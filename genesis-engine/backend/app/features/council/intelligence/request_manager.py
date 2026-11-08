"""
CIVORA — Centralized AI Request Manager
Provides bounded concurrency control, in-flight request deduplication (Single-Flight),
per-advisor timeout management, exponential backoff with jitter, and circuit breaking.
Prevents unconstrained parallel tasks, cascading failures, and event loop starvation.
"""

import time
import random
import asyncio
import logging
from enum import Enum
from typing import Dict, Any, Optional, Callable, Awaitable, TypeVar

from monitoring.collector import perf_collector

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitBreakerState(str, Enum):
    CLOSED = "closed"        # Healthy: operations proceed normally
    OPEN = "open"            # Tripped: fail-fast to protect system
    HALF_OPEN = "half_open"  # Probing: allowing a single test operation


class CircuitBreaker:
    """Three-state circuit breaker pattern for AI evaluation pipelines."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 4,
        recovery_timeout_sec: float = 10.0
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.state = CircuitBreakerState.CLOSED
        self.consecutive_failures = 0
        self.last_failure_time = 0.0

    def can_execute(self) -> bool:
        """Determines if a request may proceed based on circuit health."""
        if self.state == CircuitBreakerState.CLOSED:
            return True

        now = time.time()
        if self.state == CircuitBreakerState.OPEN:
            if now - self.last_failure_time >= self.recovery_timeout_sec:
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"CircuitBreaker [{self.name}] entering HALF_OPEN state (probe).")
                return True
            return False

        # HALF_OPEN allows probe
        return True

    def record_success(self) -> None:
        """Records a successful operation, resetting consecutive failures."""
        if self.state != CircuitBreakerState.CLOSED:
            logger.info(f"CircuitBreaker [{self.name}] recovered to CLOSED state.")
        self.state = CircuitBreakerState.CLOSED
        self.consecutive_failures = 0

    def record_failure(self) -> None:
        """Records a failure and trips to OPEN if threshold exceeded."""
        self.consecutive_failures += 1
        self.last_failure_time = time.time()

        if self.consecutive_failures >= self.failure_threshold:
            if self.state != CircuitBreakerState.OPEN:
                logger.warning(
                    f"CircuitBreaker [{self.name}] TRIPPED to OPEN after {self.consecutive_failures} failures."
                )
                perf_collector.record_ai_circuit_breaker_trip()
            self.state = CircuitBreakerState.OPEN


class AIRequestManager:
    """
    Central coordinator for Council AI execution.
    Features:
    - Bounded concurrency via asyncio.Semaphore
    - In-flight deduplication (Single-Flight)
    - Timeout protection
    - Exponential backoff retries with jitter
    - Circuit breaker fail-fast protection
    """

    def __init__(
        self,
        max_concurrency: int = 6,
        default_timeout_sec: float = 5.0,
        default_max_retries: int = 2,
    ):
        self.max_concurrency = max_concurrency
        self.default_timeout_sec = default_timeout_sec
        self.default_max_retries = default_max_retries

        self._semaphore: Optional[asyncio.Semaphore] = None
        self._in_flight: Dict[str, asyncio.Future] = {}
        self._circuit_breakers: Dict[str, CircuitBreaker] = {}
        self._lock: Optional[asyncio.Lock] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def _ensure_async_primitives(self) -> None:
        """Lazy initialization of asyncio primitives bound to the currently running event loop."""
        loop = asyncio.get_running_loop()
        if self._semaphore is None or self._lock is None or self._loop != loop:
            self._loop = loop
            self._semaphore = asyncio.Semaphore(self.max_concurrency)
            self._lock = asyncio.Lock()
            self._in_flight.clear()

    def get_circuit_breaker(self, name: str) -> CircuitBreaker:
        """Gets or creates a circuit breaker for a domain/advisor/provider."""
        if name not in self._circuit_breakers:
            self._circuit_breakers[name] = CircuitBreaker(name=name)
        return self._circuit_breakers[name]

    async def execute_task(
        self,
        request_key: str,
        coro_func: Callable[[], Awaitable[T]],
        circuit_breaker_name: str = "global",
        timeout_sec: Optional[float] = None,
        max_retries: Optional[int] = None,
        fallback_value: Optional[T] = None,
        deduplicate: bool = True,
    ) -> T:
        """
        Executes an asynchronous AI operation through the management pipeline:
        1. Checks in-flight deduplication.
        2. Acquires concurrency token.
        3. Enforces circuit breaker health.
        4. Applies timeout and exponential backoff retry with jitter.
        5. Reports metrics to perf_collector.
        """
        self._ensure_async_primitives()
        timeout = timeout_sec if timeout_sec is not None else self.default_timeout_sec
        retries = max_retries if max_retries is not None else self.default_max_retries
        cb = self.get_circuit_breaker(circuit_breaker_name)

        # In-Flight Deduplication Check
        if deduplicate:
            lead_future = None
            async with self._lock:
                if request_key in self._in_flight:
                    perf_collector.record_ai_dedup_hit()
                    logger.debug(f"AIRequestManager: Deduplicated in-flight task for key '{request_key}'")
                    existing_future = self._in_flight[request_key]
                else:
                    loop = asyncio.get_running_loop()
                    lead_future = loop.create_future()
                    self._in_flight[request_key] = lead_future
                    existing_future = None

            if existing_future is not None:
                return await asyncio.shield(existing_future)

        # Execute with single-flight lifecycle
        try:
            result = await self._execute_with_lifecycle(
                coro_func=coro_func,
                circuit_breaker=cb,
                timeout_sec=timeout,
                max_retries=retries,
                fallback_value=fallback_value
            )
            if deduplicate:
                async with self._lock:
                    if not lead_future.done():
                        lead_future.set_result(result)
            return result
        except Exception as e:
            if deduplicate and lead_future is not None:
                async with self._lock:
                    if not lead_future.done():
                        lead_future.set_exception(e)
                try:
                    # Suppress unretrieved future warning if no other listener attached
                    _ = lead_future.exception()
                except Exception:
                    pass
            raise e
        finally:
            if deduplicate:
                async with self._lock:
                    self._in_flight.pop(request_key, None)

    async def _execute_with_lifecycle(
        self,
        coro_func: Callable[[], Awaitable[T]],
        circuit_breaker: CircuitBreaker,
        timeout_sec: float,
        max_retries: int,
        fallback_value: Optional[T] = None,
    ) -> T:
        """Inner execution loop with concurrency bound, circuit breaker, timeout, and retry."""
        if not circuit_breaker.can_execute():
            msg = f"Circuit breaker [{circuit_breaker.name}] is OPEN. Fast-failing request."
            logger.warning(msg)
            if fallback_value is not None:
                return fallback_value
            raise RuntimeError(msg)

        async with self._semaphore:
            perf_collector.inc_ai_concurrent()
            attempt = 0
            last_err = None

            try:
                while attempt <= max_retries:
                    try:
                        result = await asyncio.wait_for(coro_func(), timeout=timeout_sec)
                        circuit_breaker.record_success()
                        return result
                    except asyncio.TimeoutError as te:
                        perf_collector.record_ai_timeout()
                        last_err = te
                        logger.warning(
                            f"AI task [{circuit_breaker.name}] timed out after {timeout_sec:.2f}s (attempt {attempt + 1}/{max_retries + 1})"
                        )
                    except Exception as err:
                        last_err = err
                        logger.warning(
                            f"AI task [{circuit_breaker.name}] failed: {err} (attempt {attempt + 1}/{max_retries + 1})"
                        )

                    attempt += 1
                    if attempt <= max_retries:
                        perf_collector.record_ai_retry()
                        # Exponential backoff with jitter
                        base_backoff = 0.05 * (2 ** attempt)
                        jitter = random.uniform(0.01, 0.05)
                        delay = min(1.0, base_backoff + jitter)
                        await asyncio.sleep(delay)

                # All attempts exhausted
                circuit_breaker.record_failure()
                if fallback_value is not None:
                    logger.warning(f"AI task [{circuit_breaker.name}] exhausted retries. Returning fallback value.")
                    return fallback_value
                raise last_err or RuntimeError("Task failed after all retries.")
            finally:
                perf_collector.dec_ai_concurrent()

    async def shutdown(self) -> None:
        """Gracefully cancels any remaining in-flight tasks upon shutdown."""
        self._ensure_async_primitives()
        async with self._lock:
            for key, future in list(self._in_flight.items()):
                if not future.done():
                    future.cancel()
            self._in_flight.clear()


# Global singleton instance
ai_request_manager = AIRequestManager()
