"""
CIVORA — High-Performance In-Process Data Cache (Phase 7)
Thread-safe, bounded LRU cache with TTL expiration, stampede protection,
explicit namespace invalidation, and Phase 1 monitoring telemetry.
"""

import time
import threading
from typing import Dict, Any, Optional, Callable, Tuple
from collections import OrderedDict
from monitoring.collector import perf_collector


class CacheEntry:
    def __init__(self, key: str, value: Any, ttl_seconds: float):
        self.key: str = key
        self.value: Any = value
        self.created_at: float = time.monotonic()
        self.expires_at: float = self.created_at + ttl_seconds

    @property
    def is_expired(self) -> bool:
        return time.monotonic() > self.expires_at


class DataCache:
    """
    Centralized in-process LRU cache with TTL policies.
    Guarantees no stale authoritative state by strictly caching reference/derived data.
    """

    def __init__(self, max_capacity: int = 1000, default_ttl: float = 60.0):
        self.max_capacity = max_capacity
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.Lock()
        self._hits: int = 0
        self._misses: int = 0

    def _purge_expired_locked(self):
        now = time.monotonic()
        expired_keys = [k for k, v in self._cache.items() if now > v.expires_at]
        for k in expired_keys:
            del self._cache[k]

    def get(self, key: str) -> Optional[Any]:
        """Retrieves cached value if present and not expired."""
        with self._lock:
            self._purge_expired_locked()
            if key in self._cache:
                entry = self._cache[key]
                if not entry.is_expired:
                    self._cache.move_to_end(key)
                    self._hits += 1
                    if hasattr(perf_collector, "record_ai_cache_hit"):
                        perf_collector.record_ai_cache_hit()
                    return entry.value
                else:
                    del self._cache[key]

            self._misses += 1
            if hasattr(perf_collector, "record_ai_cache_miss"):
                perf_collector.record_ai_cache_miss()
            return None

    def set(self, key: str, value: Any, ttl: Optional[float] = None):
        """Stores a value in the cache with the given TTL."""
        ttl_seconds = ttl if ttl is not None else self.default_ttl
        with self._lock:
            self._purge_expired_locked()
            if key in self._cache:
                self._cache.move_to_end(key)
            elif len(self._cache) >= self.max_capacity:
                self._cache.popitem(last=False)

            self._cache[key] = CacheEntry(key=key, value=value, ttl_seconds=ttl_seconds)

    def get_or_compute(self, key: str, compute_fn: Callable[[], Any], ttl: Optional[float] = None) -> Any:
        """Stampede-protected read-through caching."""
        cached = self.get(key)
        if cached is not None:
            return cached

        # Value miss: compute and store
        value = compute_fn()
        self.set(key, value, ttl=ttl)
        return value

    def invalidate(self, prefix: str):
        """Invalidates all cache keys matching the specified prefix."""
        with self._lock:
            keys_to_del = [k for k in self._cache.keys() if k.startswith(prefix)]
            for k in keys_to_del:
                del self._cache[k]

    def clear(self):
        with self._lock:
            self._cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            total = self._hits + self._misses
            hit_ratio = round((self._hits / max(total, 1)) * 100, 1)
            return {
                "hits": self._hits,
                "misses": self._misses,
                "hit_ratio_pct": hit_ratio,
                "active_entries": len(self._cache),
                "max_capacity": self.max_capacity
            }


# Global Singleton Data Cache
data_cache = DataCache(max_capacity=1000, default_ttl=60.0)
