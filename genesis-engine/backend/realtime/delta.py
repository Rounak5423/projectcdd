"""
CIVORA — Real-Time Event Engine (Phase 6)
Delta Synchronization Engine: Property-level state diffing, nested patching, and snapshot recovery.
"""

import copy
import threading
from typing import Dict, Any, Optional, Tuple, List


class DeltaEngine:
    """
    Computes property-level deltas between sequential world states,
    reducing bandwidth and JSON serialization overhead while preserving
    deterministic snapshot-equivalent state on the client.
    """

    def __init__(self, max_delta_ratio: float = 0.70, max_cached_worlds: int = 64):
        self._lock = threading.Lock()
        self._previous_states: Dict[str, Dict[str, Any]] = {}
        self._state_versions: Dict[str, int] = {}
        self.max_delta_ratio = max_delta_ratio
        self.max_cached_worlds = max_cached_worlds

    def _diff_dicts(self, old: Dict[str, Any], new: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
        """
        Recursively calculates updates and removals between two dictionaries.
        """
        updates: Dict[str, Any] = {}
        removals: List[str] = []

        # Find updated or added fields
        for k, v in new.items():
            if k not in old:
                updates[k] = copy.deepcopy(v)
            else:
                old_v = old[k]
                if isinstance(v, dict) and isinstance(old_v, dict):
                    sub_updates, sub_removals = self._diff_dicts(old_v, v)
                    if sub_updates or sub_removals:
                        updates[k] = sub_updates
                elif v != old_v:
                    updates[k] = copy.deepcopy(v)

        # Find removed fields
        for k in old:
            if k not in new:
                removals.append(k)

        return updates, removals

    def compute_state_delta(
        self,
        world_id: str,
        current_state: Dict[str, Any],
        force_snapshot: bool = False
    ) -> Tuple[str, Dict[str, Any], int, int]:
        """
        Calculates the delta against the previous state for the world.
        Returns:
            (event_type, payload, base_version, new_version)
            - event_type: "world.state.snapshot" or "world.state.delta"
        """
        with self._lock:
            prev_state = self._previous_states.get(world_id)
            prev_ver = self._state_versions.get(world_id, 0)
            new_ver = prev_ver + 1

            if force_snapshot or prev_state is None:
                # Full snapshot required
                if world_id not in self._previous_states and len(self._previous_states) >= self.max_cached_worlds:
                    oldest_w = next(iter(self._previous_states))
                    del self._previous_states[oldest_w]
                    self._state_versions.pop(oldest_w, None)

                self._previous_states[world_id] = copy.deepcopy(current_state)
                self._state_versions[world_id] = new_ver
                payload = {
                    "world_id": world_id,
                    "version": new_ver,
                    "base_version": 0,
                    "is_snapshot": True,
                    "state": copy.deepcopy(current_state)
                }
                return "world.state.snapshot", payload, 0, new_ver

            # Compute recursive diff
            updates, removals = self._diff_dicts(prev_state, current_state)

            # Check if delta is empty
            if not updates and not removals:
                # No change, still advance version or emit minimal delta
                payload = {
                    "world_id": world_id,
                    "version": prev_ver,
                    "base_version": prev_ver,
                    "is_snapshot": False,
                    "updates": {},
                    "removals": []
                }
                return "world.state.delta", payload, prev_ver, prev_ver

            # Check if delta is larger than full snapshot (save overhead)
            # Rough estimate using keys
            if len(updates) > len(current_state) * self.max_delta_ratio:
                self._previous_states[world_id] = copy.deepcopy(current_state)
                self._state_versions[world_id] = new_ver
                payload = {
                    "world_id": world_id,
                    "version": new_ver,
                    "base_version": prev_ver,
                    "is_snapshot": True,
                    "state": copy.deepcopy(current_state)
                }
                return "world.state.snapshot", payload, prev_ver, new_ver

            # Save current state for next delta
            self._previous_states[world_id] = copy.deepcopy(current_state)
            self._state_versions[world_id] = new_ver

            payload = {
                "world_id": world_id,
                "version": new_ver,
                "base_version": prev_ver,
                "is_snapshot": False,
                "updates": updates,
                "removals": removals
            }
            return "world.state.delta", payload, prev_ver, new_ver

    def get_latest_snapshot(self, world_id: str) -> Optional[Dict[str, Any]]:
        """Returns the cached latest authoritative state snapshot for recovery."""
        with self._lock:
            state = self._previous_states.get(world_id)
            if state is None:
                return None
            return {
                "world_id": world_id,
                "version": self._state_versions.get(world_id, 0),
                "base_version": 0,
                "is_snapshot": True,
                "state": copy.deepcopy(state)
            }

    @staticmethod
    def apply_delta(base_state: Dict[str, Any], delta_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep-patches a delta payload onto a base state dictionary.
        Applying valid deltas onto a base snapshot produces authoritative new state.
        """
        if delta_payload.get("is_snapshot"):
            return copy.deepcopy(delta_payload.get("state", {}))

        result = copy.deepcopy(base_state)
        updates = delta_payload.get("updates", {})
        removals = delta_payload.get("removals", [])

        def _deep_merge(target: Dict[str, Any], source: Dict[str, Any]):
            for k, v in source.items():
                if isinstance(v, dict) and k in target and isinstance(target[k], dict):
                    _deep_merge(target[k], v)
                else:
                    target[k] = copy.deepcopy(v)

        _deep_merge(result, updates)

        for rem in removals:
            result.pop(rem, None)

        return result

    def clear(self, world_id: Optional[str] = None):
        with self._lock:
            if world_id:
                self._previous_states.pop(world_id, None)
                self._state_versions.pop(world_id, None)
            else:
                self._previous_states.clear()
                self._state_versions.clear()


delta_engine = DeltaEngine()

