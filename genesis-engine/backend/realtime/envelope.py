"""
CIVORA — Real-Time Event Engine (Phase 6)
Envelope schemas, event categories, and priority specifications.
"""

from enum import Enum
from typing import Dict, Any, Optional
import time
import uuid
from pydantic import BaseModel, Field


class EventPriority(str, Enum):
    CRITICAL = "critical"   # Immediate delivery, never dropped (decisions, authoritative actions)
    NORMAL = "normal"       # Standard events, reliable delivery
    LOW = "low"             # High-frequency telemetry, cosmetic ticks, can be dropped under backpressure


class EventCategory(str, Enum):
    GAMEPLAY = "gameplay"       # Player actions, policies, facility construction
    WORLD_STATE = "world_state" # Snapshots and deltas
    SIMULATION = "simulation"   # Engine ticks, cycle transitions, crises
    COUNCIL = "council"         # Deliberation starts, conclusions, advisor speech
    PLAYER = "player"           # Commands, acks, errors
    NOTIFICATION = "notification"# In-game notices and achievements
    VISUAL = "visual"           # Cosmetic telemetry, citizen animations


class EventEnvelope(BaseModel):
    """Authoritative real-time event envelope."""
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: str
    category: EventCategory = EventCategory.SIMULATION
    schema_version: str = "1.0"
    world_id: str
    sequence_number: int = 0
    world_state_version: int = 0
    timestamp: float = Field(default_factory=time.time)
    priority: EventPriority = EventPriority.NORMAL
    idempotency_key: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

    def to_client_dict(self) -> Dict[str, Any]:
        """
        Converts the envelope to a serialized dictionary.
        Maintains backward compatibility with legacy clients expecting top-level 'type'.
        """
        d = self.model_dump()
        d["type"] = self.event_type
        return d
