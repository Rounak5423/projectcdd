"""
CIVORA — Council Intelligence Response Caching Layer
High-performance, thread-safe, bounded LRU cache with TTL expiration.
Explicitly keyed by world state, simulation tick, context signature, and advisor identity.
Ensures zero stale evaluations can influence authoritative gameplay decisions.
"""

import time
import hashlib
import threading
from typing import Dict, Optional, Any, Tuple
from collections import OrderedDict

from monitoring.collector import perf_collector


class AICacheEntry:
    """Represents a cached evaluation result with timestamp and metadata."""

    def __init__(self, key: str, value: Any, ttl_seconds: float, state_signature: str):
        self.key = key
        self.value = value
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl_seconds
        self.state_signature = state_signature
        self.hit_count = 0

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class AICache:
    """Thread-safe bounded LRU cache with state-based validation and TTL."""

    def __init__(self, max_entries: int = 256, default_ttl_seconds: float = 60.0):
        self._lock = threading.Lock()
        self._max_entries = max_entries
        self._default_ttl_seconds = default_ttl_seconds
        self._cache: OrderedDict[str, AICacheEntry] = OrderedDict()
        self._world_index: Dict[str, set] = {}

    @staticmethod
    def compute_context_signature(context: Any) -> str:
        """
        Generates a compact deterministic hash from immutable CivilisationContext attributes.
        If any indicator, tick, or resource diverges, the signature changes.
        """
        if not context:
            return "empty"

        components = [
            str(getattr(context, "world_id", "")),
            str(getattr(context, "tick", 0)),
            str(getattr(context, "year", 0)),
            str(getattr(context, "day", 0)),
            f"{getattr(context, 'population', 0)}",
            f"{getattr(context, 'gdp', 0.0):.2f}",
            f"{getattr(context, 'civic_stability', 0.0):.4f}",
            f"{getattr(context, 'gini_coefficient', 0.0):.4f}",
            f"{getattr(context, 'grc_balance', 0.0):.2f}",
            f"{getattr(context, 'environmental_health', 0.0):.4f}",
            f"{getattr(context, 'pollution', 0.0):.4f}",
            f"{len(getattr(context, 'active_policies', []))}",
            f"{len(getattr(context, 'unlocked_technologies', []))}",
        ]
        raw = "|".join(components)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]

    @staticmethod
    def build_cache_key(
        world_id: str,
        tick: int,
        state_signature: str,
        operation: str,
        advisor_id: Optional[str] = None,
        config_version: str = "v1"
    ) -> str:
        """Constructs an unambiguous composite cache key."""
        adv_part = advisor_id or "all"
        return f"{world_id}:t{tick}:{state_signature}:{adv_part}:{operation}:{config_version}"

    def get(self, key: str, expected_signature: Optional[str] = None) -> Optional[Any]:
        """
        Retrieves a cached value if present, not expired, and state signature matches.
        Updates LRU order on hit.
        """
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                perf_collector.record_ai_cache_miss()
                return None

            if entry.is_expired:
                self._remove_entry_locked(key)
                perf_collector.record_ai_cache_miss()
                return None

            if expected_signature and entry.state_signature != expected_signature:
                # State drifted within the tick, invalidate immediately
                self._remove_entry_locked(key)
                perf_collector.record_ai_cache_miss()
                return None

            # Hit: move to end for LRU freshness
            self._cache.move_to_end(key)
            entry.hit_count += 1
            perf_collector.record_ai_cache_hit()
            return entry.value

    def set(
        self,
        key: str,
        value: Any,
        world_id: str,
        state_signature: str,
        ttl_seconds: Optional[float] = None
    ) -> None:
        """Stores a result in the cache with bounded capacity and world indexing."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl_seconds

        with self._lock:
            # Evict expired entries or LRU items if at capacity
            if key not in self._cache and len(self._cache) >= self._max_entries:
                self._evict_oldest_locked()

            entry = AICacheEntry(
                key=key,
                value=value,
                ttl_seconds=ttl,
                state_signature=state_signature
            )
            self._cache[key] = entry
            self._cache.move_to_end(key)

            if world_id not in self._world_index:
                self._world_index[world_id] = set()
            self._world_index[world_id].add(key)

    def invalidate_world(self, world_id: str) -> int:
        """Flushes all cached entries associated with a specific civilisation world."""
        count = 0
        with self._lock:
            keys = self._world_index.pop(world_id, set())
            for k in keys:
                if k in self._cache:
                    del self._cache[k]
                    count += 1
        return count

    def clear(self) -> None:
        """Clears the entire cache."""
        with self._lock:
            self._cache.clear()
            self._world_index.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Returns internal cache diagnostics."""
        with self._lock:
            active_count = 0
            expired_count = 0
            now = time.time()
            for e in self._cache.values():
                if e.expires_at > now:
                    active_count += 1
                else:
                    expired_count += 1

            return {
                "total_entries": len(self._cache),
                "active_entries": active_count,
                "expired_entries": expired_count,
                "max_entries": self._max_entries,
                "indexed_worlds": len(self._world_index),
            }

    def _evict_oldest_locked(self) -> None:
        """Evicts expired items first; if none, pops the oldest (least recently used) item."""
        now = time.time()
        for k, e in list(self._cache.items()):
            if e.expires_at <= now:
                self._remove_entry_locked(k)
                return

        # No expired item found; pop LRU item
        if self._cache:
            oldest_key, _ = self._cache.popitem(last=False)
            self._cleanup_world_index_locked(oldest_key)

    def _remove_entry_locked(self, key: str) -> None:
        if key in self._cache:
            del self._cache[key]
            self._cleanup_world_index_locked(key)

    def _cleanup_world_index_locked(self, key: str) -> None:
        for w_id, key_set in list(self._world_index.items()):
            key_set.discard(key)
            if not key_set:
                del self._world_index[w_id]


# Global singleton instance for the Council intelligence tier
ai_cache = AICache()
