"""
CIVORA — Real-Time Event Engine (Phase 6)
Idempotency Manager: Duplicate command protection and retry safety.
"""

import time
import threading
from typing import Dict, Any, Optional, Tuple
from collections import OrderedDict
from monitoring.collector import perf_collector


class IdempotencyEntry:
    def __init__(self, key: str, world_id: str, ttl_seconds: float = 120.0):
        self.key: str = key
        self.world_id: str = world_id
        self.created_at: float = time.time()
        self.expires_at: float = self.created_at + ttl_seconds
        self.status: str = "PENDING"  # PENDING, COMPLETED, FAILED
        self.result: Optional[Any] = None
        self.error: Optional[str] = None

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class IdempotencyManager:
    """
    Thread-safe, bounded LRU idempotency cache preventing duplicate gameplay execution.
    """

    def __init__(self, max_capacity: int = 2000, default_ttl: float = 120.0):
        self.max_capacity = max_capacity
        self.default_ttl = default_ttl
        self._lock = threading.Lock()
        self._cache: OrderedDict[Tuple[str, str], IdempotencyEntry] = OrderedDict()

    def _purge_expired_locked(self):
        now = time.time()
        expired_keys = [k for k, v in self._cache.items() if now > v.expires_at]
        for k in expired_keys:
            del self._cache[k]

    def register_or_check(self, world_id: str, key: Optional[str]) -> Tuple[bool, Optional[Any]]:
        """
        Validates idempotency key.
        Returns:
            (is_new: bool, existing_result: Optional[Any])
            - If is_new is True: caller must execute action and call complete().
            - If is_new is False: caller must return existing_result directly without re-executing.
        """
        if not key:
            # Without idempotency key, command runs normally
            return True, None

        cache_key = (world_id, key)
        with self._lock:
            self._purge_expired_locked()

            if cache_key in self._cache:
                entry = self._cache[cache_key]
                if not entry.is_expired:
                    self._cache.move_to_end(cache_key)
                    perf_collector.record_ai_dedup_hit() if hasattr(perf_collector, 'record_ai_dedup_hit') else None
                    return False, entry.result

            # Create new pending entry
            if len(self._cache) >= self.max_capacity:
                self._cache.popitem(last=False)

            entry = IdempotencyEntry(key=key, world_id=world_id, ttl_seconds=self.default_ttl)
            self._cache[cache_key] = entry
            return True, None

    def complete(self, world_id: str, key: Optional[str], result: Any):
        """Marks idempotent command as successfully completed and caches result."""
        if not key:
            return
        cache_key = (world_id, key)
        with self._lock:
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                entry.status = "COMPLETED"
                entry.result = result

    def fail(self, world_id: str, key: Optional[str], error: str):
        """Marks idempotent command as failed."""
        if not key:
            return
        cache_key = (world_id, key)
        with self._lock:
            if cache_key in self._cache:
                entry = self._cache[cache_key]
                entry.status = "FAILED"
                entry.error = error

    def clear(self):
        with self._lock:
            self._cache.clear()


idempotency_manager = IdempotencyManager()
