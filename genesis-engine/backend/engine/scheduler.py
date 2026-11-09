"""
CIVORA — Simulation Scheduler
Fixed-timestep, deterministic, monotonic scheduling engine for CIVORA.
Prevents concurrent execution overlap, regulates tick rates, handles overload,
and executes simulation ticks asynchronously off the main event loop.
"""

import asyncio
import time
import threading
from typing import Dict, Optional, Any, Callable, Coroutine
from monitoring.collector import perf_collector


SPEED_INTERVALS: Dict[str, float] = {
    "1x": 1.0,
    "2x": 0.5,
    "5x": 0.2,
    "10x": 0.1
}

# Maximum catchup ticks allowed per frame if execution falls behind (prevents lag death spiral)
MAX_CATCHUP_TICKS = 3


class SimulationRunner:
    """Manages the lifecycle, timing, and lock of an individual world simulation."""

    def __init__(
        self,
        world_id: str,
        speed: str = "1x",
        tick_func: Optional[Callable[[str, int], Coroutine[Any, Any, Dict[str, Any]]]] = None
    ):
        self.world_id: str = world_id
        self.speed: str = speed
        self.interval: float = SPEED_INTERVALS.get(speed, 1.0)
        self.status: str = "paused"
        self.tick_func = tick_func
        self._lock: Optional[asyncio.Lock] = None
        self._stop_event: Optional[asyncio.Event] = None
        self._task: Optional[asyncio.Task] = None

        # Telemetry & Timing
        self.total_ticks: int = 0
        self.last_tick_time: float = time.monotonic()
        self.accumulator: float = 0.0
        self.overload_count: int = 0
        self.last_error: Optional[str] = None

    @property
    def lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    @property
    def stop_event(self) -> asyncio.Event:
        if self._stop_event is None:
            self._stop_event = asyncio.Event()
        return self._stop_event

    def set_speed(self, new_speed: str):
        self.speed = new_speed
        self.interval = SPEED_INTERVALS.get(new_speed, 1.0)

    async def advance_ticks(self, ticks: int = 1) -> Dict[str, Any]:
        """Executes N ticks under mutual exclusion lock."""
        async with self.lock:
            t0 = time.monotonic()
            try:
                if self.tick_func:
                    result = await self.tick_func(self.world_id, ticks)
                else:
                    result = {"world_id": self.world_id, "ticks": ticks}
                self.total_ticks += ticks
                self.last_tick_time = time.monotonic()
                return result
            except Exception as e:
                self.last_error = str(e)
                perf_collector.record_simulation_error()
                raise e

    async def _loop(self):
        """Monotonic fixed-timestep execution loop with drift compensation and overload protection."""
        if self.stop_event.is_set():
            return

        prev_time = time.monotonic()

        try:
            while not self.stop_event.is_set():
                now = time.monotonic()
                elapsed = now - prev_time
                prev_time = now

                self.accumulator += elapsed

                # Check how many ticks are due based on accumulated time
                ticks_to_run = int(self.accumulator // self.interval)
                if ticks_to_run > 0:
                    # Enforce overload policy: clamp catchup ticks to avoid freezing
                    if ticks_to_run > MAX_CATCHUP_TICKS:
                        self.overload_count += 1
                        self.accumulator = 0.0
                        ticks_to_run = MAX_CATCHUP_TICKS
                    else:
                        self.accumulator -= ticks_to_run * self.interval

                    # Execute the ticks under lock
                    try:
                        await self.advance_ticks(ticks=ticks_to_run)
                    except asyncio.CancelledError:
                        break
                    except Exception as e:
                        self.status = "error"
                        self.last_error = str(e)
                        break

                # Wait dynamically for remaining interval or immediate stop event
                next_sleep = max(0.005, min(self.interval, self.interval - self.accumulator))
                try:
                    await asyncio.wait_for(self.stop_event.wait(), timeout=next_sleep)
                    break  # Stop event was signaled, exit immediately
                except asyncio.TimeoutError:
                    pass  # Normal interval elapsed, loop for next tick
                except asyncio.CancelledError:
                    break

        except asyncio.CancelledError:
            pass
        finally:
            if self.status != "error":
                self.status = "paused"

    def start(self):
        if self._task and not self._task.done():
            return
        self.status = "running"
        self.stop_event.clear()
        self.accumulator = 0.0
        self.last_tick_time = time.monotonic()
        self._task = asyncio.create_task(self._loop())

    def pause(self):
        self.stop_event.set()
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None
        self.status = "paused"

    async def pause_async(self):
        self.stop_event.set()
        if self._task and not self._task.done():
            try:
                await asyncio.wait_for(self._task, timeout=0.5)
            except (asyncio.TimeoutError, asyncio.CancelledError, Exception):
                if not self._task.done():
                    self._task.cancel()
        self._task = None
        self.status = "paused"

    def stop(self):
        self.pause()
        self._task = None
        self.status = "stopped"

    async def stop_async(self):
        self.stop_event.set()
        if self._task and not self._task.done():
            try:
                await asyncio.wait_for(self._task, timeout=0.5)
            except (asyncio.TimeoutError, asyncio.CancelledError, Exception):
                if not self._task.done():
                    self._task.cancel()
        self._task = None
        self.status = "stopped"


class SimulationScheduler:
    """Central singleton coordinator for all active simulations."""

    def __init__(self):
        self._runners: Dict[str, SimulationRunner] = {}
        self._default_tick_func: Optional[Callable[[str, int], Coroutine[Any, Any, Dict[str, Any]]]] = None
        self._lock = threading.RLock()

    def set_default_tick_handler(self, handler: Callable[[str, int], Coroutine[Any, Any, Dict[str, Any]]]):
        with self._lock:
            self._default_tick_func = handler

    def get_or_create_runner(
        self,
        world_id: str,
        speed: str = "1x",
        tick_func: Optional[Callable[[str, int], Coroutine[Any, Any, Dict[str, Any]]]] = None
    ) -> SimulationRunner:
        with self._lock:
            if world_id not in self._runners:
                func = tick_func or self._default_tick_func
                self._runners[world_id] = SimulationRunner(world_id=world_id, speed=speed, tick_func=func)
            runner = self._runners[world_id]
            if speed != runner.speed:
                runner.set_speed(speed)
            return runner

    def get_runner(self, world_id: str) -> Optional[SimulationRunner]:
        with self._lock:
            return self._runners.get(world_id)

    async def advance_world(self, world_id: str, ticks: int = 1) -> Dict[str, Any]:
        """Thread-safe, mutex-guaranteed manual tick advance."""
        runner = self.get_or_create_runner(world_id)
        return await runner.advance_ticks(ticks)

    def start_world(self, world_id: str, speed: str = "1x") -> SimulationRunner:
        runner = self.get_or_create_runner(world_id, speed=speed)
        runner.start()
        return runner

    def pause_world(self, world_id: str) -> Optional[SimulationRunner]:
        runner = self.get_runner(world_id)
        if runner:
            runner.pause()
        return runner

    def stop_world(self, world_id: str) -> Optional[SimulationRunner]:
        with self._lock:
            runner = self.get_runner(world_id)
            if runner:
                runner.stop()
                del self._runners[world_id]
            return runner

    def get_status(self, world_id: str) -> Dict[str, Any]:
        runner = self.get_runner(world_id)
        if not runner:
            return {
                "world_id": world_id,
                "status": "idle",
                "speed": "1x",
                "ticks": 0,
                "overloads": 0
            }
        return {
            "world_id": world_id,
            "status": runner.status,
            "speed": runner.speed,
            "ticks": runner.total_ticks,
            "overloads": runner.overload_count,
            "last_error": runner.last_error
        }

    async def shutdown(self):
        """Gracefully halts all runners on application shutdown."""
        with self._lock:
            runners_copy = list(self._runners.values())
            self._runners.clear()
        for runner in runners_copy:
            runner.stop()


# Global Singleton Scheduler
simulation_scheduler = SimulationScheduler()
