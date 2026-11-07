"""Cognitive Memory Subsystem with Ebbinghaus-Inspired Forgetting Dynamics."""

import math
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MemoryItem(BaseModel):
    """An episodic memory entry stored within an agent's cognitive buffer."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    tick_created: int
    last_accessed_tick: int
    access_count: int = 1
    description: str
    category: str = "general"
    importance: float = Field(default=0.5, ge=0.0, le=1.0)
    emotional_valence: float = Field(default=0.0, ge=-1.0, le=1.0)

    def calculate_retention(self, current_tick: int, decay_constant: float = 0.04) -> float:
        """Calculates memory strength using an Ebbinghaus retention curve:

        R = importance * e^(-decay * delta_t / (1 + ln(1 + access_count)))
        """
        delta_t = max(0, current_tick - self.last_accessed_tick)
        # Repetition reduces effective decay
        memory_stability = 1.0 + math.log1p(self.access_count)
        decay_factor = math.exp(-decay_constant * delta_t / memory_stability)
        # Valence amplifies retention: strong positive or negative events resist forgetting
        valence_boost = 1.0 + (abs(self.emotional_valence) * 0.3)
        return min(1.0, self.importance * decay_factor * valence_boost)


class CognitiveMemory(BaseModel):
    """Finite-capacity cognitive memory store that forgets older, unreinforced memories."""

    capacity: int = Field(default=12, ge=3, le=100)
    decay_constant: float = Field(default=0.04, ge=0.001, le=0.5)
    memories: Dict[str, MemoryItem] = Field(default_factory=dict)

    def record_experience(
        self,
        description: str,
        current_tick: int,
        category: str = "general",
        importance: float = 0.5,
        emotional_valence: float = 0.0,
    ) -> MemoryItem:
        """Creates and stores a memory item, evicting the weakest memory if capacity is breached."""
        item = MemoryItem(
            tick_created=current_tick,
            last_accessed_tick=current_tick,
            description=description,
            category=category,
            importance=importance,
            emotional_valence=emotional_valence,
        )
        self.memories[item.id] = item
        self._enforce_capacity(current_tick)
        return item

    def retrieve_by_category(self, category: str, current_tick: int) -> List[MemoryItem]:
        """Retrieves memories matching a category, reinforces them, and returns them sorted by retention."""
        matching = [m for m in self.memories.values() if m.category == category]
        for m in matching:
            m.last_accessed_tick = current_tick
            m.access_count += 1
        matching.sort(key=lambda m: m.calculate_retention(current_tick, self.decay_constant), reverse=True)
        return matching

    def get_strongest_memory(self, current_tick: int) -> Optional[MemoryItem]:
        """Finds the most salient memory in current working memory."""
        if not self.memories:
            return None
        return max(
            self.memories.values(),
            key=lambda m: m.calculate_retention(current_tick, self.decay_constant),
        )

    def forget_decayed(self, current_tick: int, retention_cutoff: float = 0.05) -> int:
        """Removes memories that have fallen below the retention threshold. Returns count forgotten."""
        to_remove = [
            mid
            for mid, m in self.memories.items()
            if m.calculate_retention(current_tick, self.decay_constant) < retention_cutoff
        ]
        for mid in to_remove:
            del self.memories[mid]
        return len(to_remove)

    def _enforce_capacity(self, current_tick: int) -> None:
        """Evicts the weakest memories until memory count is within maximum capacity."""
        if len(self.memories) <= self.capacity:
            return
        
        # Sort memories ascending by current retention score
        sorted_items = sorted(
            self.memories.values(),
            key=lambda m: m.calculate_retention(current_tick, self.decay_constant),
        )
        excess = len(self.memories) - self.capacity
        for item in sorted_items[:excess]:
            del self.memories[item.id]
