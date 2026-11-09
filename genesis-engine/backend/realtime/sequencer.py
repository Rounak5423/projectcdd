"""
CIVORA — Real-Time Event Engine (Phase 6)
Stream Sequencer: Scoped monotonic sequence tracking and gap detection.
"""

import threading
from typing import Dict, Optional, Tuple


class StreamSequencer:
    """
    Maintains strictly monotonic sequence numbers scoped per world.
    Guarantees no sequence gaps or re-use within an active world stream.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._counters: Dict[str, int] = {}
        self._state_versions: Dict[str, int] = {}

    def next_sequence(self, world_id: str) -> int:
        """Returns the next strictly monotonic sequence number for the specified world."""
        with self._lock:
            current = self._counters.get(world_id, 0) + 1
            self._counters[world_id] = current
            return current

    def get_current_sequence(self, world_id: str) -> int:
        """Returns the current sequence number for the specified world without incrementing."""
        with self._lock:
            return self._counters.get(world_id, 0)

    def next_state_version(self, world_id: str) -> int:
        """Increments and returns the authoritative world state version."""
        with self._lock:
            ver = self._state_versions.get(world_id, 0) + 1
            self._state_versions[world_id] = ver
            return ver

    def get_state_version(self, world_id: str) -> int:
        """Returns current world state version."""
        with self._lock:
            return self._state_versions.get(world_id, 0)

    def set_state_version(self, world_id: str, version: int):
        with self._lock:
            self._state_versions[world_id] = max(self._state_versions.get(world_id, 0), version)

    def check_sequence_gap(self, world_id: str, last_known_seq: int, new_seq: int) -> Tuple[bool, int]:
        """
        Determines if there is a sequence gap between last_known_seq and new_seq.
        Returns: (has_gap: bool, missing_count: int)
        """
        if new_seq > last_known_seq + 1:
            return True, new_seq - (last_known_seq + 1)
        return False, 0

    def reset(self, world_id: Optional[str] = None):
        """Resets sequence tracking for a given world or all worlds."""
        with self._lock:
            if world_id:
                self._counters.pop(world_id, None)
                self._state_versions.pop(world_id, None)
            else:
                self._counters.clear()
                self._state_versions.clear()


sequencer = StreamSequencer()
