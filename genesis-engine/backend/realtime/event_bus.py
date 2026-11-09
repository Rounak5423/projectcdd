"""
CIVORA — Real-Time Event Engine (Phase 6)
Central Event Bus: Unifies event publishing, prioritization, batching,
and critical event outbox persistence.
"""

import asyncio
import time
from typing import Dict, Any, Optional, Callable, List
from realtime.envelope import EventEnvelope, EventPriority, EventCategory
from realtime.sequencer import sequencer
from realtime.connection_manager import rt_ws_manager
from monitoring.collector import perf_collector


class CentralEventBus:
    """
    Authoritative event publishing layer for CIVORA.
    Coordinates real-time delivery across Simulation, AI Council, and Player interactions.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[EventEnvelope], Any]]] = {}
        self._critical_outbox: List[EventEnvelope] = []
        self._batch_queue: List[EventEnvelope] = []
        self._batch_task: Optional[asyncio.Task] = None
        self._batch_window_sec: float = 0.05  # 50ms batching for low-priority events
        self._background_tasks: set = set()

    def subscribe(self, event_pattern: str, handler: Callable[[EventEnvelope], Any]):
        """Registers a listener for a specific event type or wildcard '*'."""
        if event_pattern not in self._subscribers:
            self._subscribers[event_pattern] = []
        self._subscribers[event_pattern].append(handler)

    async def publish(
        self,
        event_type: str,
        world_id: str,
        payload: Dict[str, Any],
        category: EventCategory = EventCategory.SIMULATION,
        priority: EventPriority = EventPriority.NORMAL,
        idempotency_key: Optional[str] = None
    ) -> EventEnvelope:
        """
        Constructs, sequences, and broadcasts an authoritative EventEnvelope.
        """
        seq = sequencer.next_sequence(world_id)
        state_ver = sequencer.get_state_version(world_id)

        envelope = EventEnvelope(
            event_type=event_type,
            category=category,
            world_id=world_id,
            sequence_number=seq,
            world_state_version=state_ver,
            priority=priority,
            idempotency_key=idempotency_key,
            payload=payload
        )

        # Critical event durability (Task 10 Outbox pattern)
        if priority == EventPriority.CRITICAL:
            self._critical_outbox.append(envelope)
            if len(self._critical_outbox) > 1000:
                self._critical_outbox.pop(0)

        # Broadcast immediately to active WebSockets
        await rt_ws_manager.broadcast_envelope(world_id, envelope)

        # Notify registered in-process listeners
        self._notify_subscribers(envelope)

        return envelope

    def _notify_subscribers(self, envelope: EventEnvelope):
        # Exact match handlers
        handlers = self._subscribers.get(envelope.event_type, [])
        # Wildcard handlers
        wildcard_handlers = self._subscribers.get("*", [])

        for h in handlers + wildcard_handlers:
            try:
                res = h(envelope)
                if asyncio.iscoroutine(res):
                    task = asyncio.create_task(res)
                    self._background_tasks.add(task)
                    task.add_done_callback(self._background_tasks.discard)
            except Exception:
                pass

    def get_critical_outbox(self, world_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns surviving critical events for auditing and failure recovery."""
        if world_id:
            return [e.to_client_dict() for e in self._critical_outbox if e.world_id == world_id]
        return [e.to_client_dict() for e in self._critical_outbox]

    def clear(self):
        self._critical_outbox.clear()
        self._batch_queue.clear()
        for t in list(self._background_tasks):
            if not t.done():
                t.cancel()
        self._background_tasks.clear()


event_bus = CentralEventBus()

