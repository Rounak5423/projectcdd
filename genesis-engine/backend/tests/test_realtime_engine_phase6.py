"""
CIVORA — Real-Time Event Engine (Phase 6)
Comprehensive Regression, Concurrency, and Reliability Test Suite.

Validates all 14 required Phase 6 scenarios:
1. Single-client communication.
2. Multiple simultaneous clients.
3. Rapid player actions & idempotency duplicate protection.
4. Simulation event bursts & property-level delta compression.
5. Authoritative delta patch reproducibility (base + deltas == current state).
6. Monotonic stream sequencing per world scope.
7. Missing sequence numbers & gap detection.
8. Stale event rejection and state version safety.
9. Council deliberation event publishing and broadcasting.
10. Slow clients, bounded outbound queues, and priority backpressure.
11. Client disconnect and resource cleanup.
12. Critical event outbox persistence and auditability.
13. Server graceful shutdown.
14. Real-time performance telemetry integration.
"""

import asyncio
import json
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import WebSocket, WebSocketDisconnect

from realtime.envelope import EventEnvelope, EventPriority, EventCategory
from realtime.sequencer import StreamSequencer, sequencer
from realtime.delta import DeltaEngine, delta_engine
from realtime.idempotency import IdempotencyManager, idempotency_manager
from realtime.connection_manager import RealtimeConnectionManager, ClientSession, rt_ws_manager
from realtime.event_bus import CentralEventBus, event_bus
from monitoring.collector import perf_collector


class MockWebSocket:
    """Simulates a FastAPI WebSocket connection for unit testing."""
    def __init__(self, delay_ms: float = 0.0, fail_after: int = 999999):
        self.accepted = False
        self.closed = False
        self.close_code = None
        self.sent_messages = []
        self.delay_ms = delay_ms
        self.fail_after = fail_after
        self._send_count = 0

    async def accept(self):
        self.accepted = True

    async def send_text(self, text: str):
        if self.closed:
            raise ConnectionResetError("Socket closed")
        self._send_count += 1
        if self._send_count > self.fail_after:
            self.closed = True
            raise WebSocketDisconnect(code=1006)
        if self.delay_ms > 0:
            await asyncio.sleep(self.delay_ms / 1000.0)
        self.sent_messages.append(text)

    async def close(self, code: int = 1000, reason: str = ""):
        self.closed = True
        self.close_code = code


@pytest.fixture(autouse=True)
def reset_realtime_state():
    """Resets sequencer, cache, managers and telemetry between tests."""
    sequencer.reset()
    delta_engine.clear()
    idempotency_manager.clear()
    event_bus.clear()
    perf_collector.reset()
    yield
    sequencer.reset()
    delta_engine.clear()
    idempotency_manager.clear()
    event_bus.clear()


@pytest.mark.asyncio
async def test_01_single_client_connect_and_receive():
    """Requirement 1: Verify single-client connection lifecycle and message delivery."""
    ws = MockWebSocket()
    manager = RealtimeConnectionManager()
    session = await manager.connect("world_alpha", ws)

    assert ws.accepted is True
    assert session.is_alive is True
    assert session.world_id == "world_alpha"

    test_env = EventEnvelope(
        event_type="test.ping",
        world_id="world_alpha",
        sequence_number=1,
        payload={"msg": "hello"}
    )
    await manager.broadcast_envelope("world_alpha", test_env)

    # Allow worker task to process
    await asyncio.sleep(0.05)
    assert len(ws.sent_messages) == 1
    received = json.loads(ws.sent_messages[0])
    assert received["event_type"] == "test.ping"
    assert received["sequence_number"] == 1
    assert received["payload"]["msg"] == "hello"

    await manager.disconnect("world_alpha", session)
    await manager.shutdown()


@pytest.mark.asyncio
async def test_02_multiple_simultaneous_clients():
    """Requirement 2: Multiple concurrent clients receive non-blocking broadcasts."""
    manager = RealtimeConnectionManager()
    clients = [MockWebSocket() for _ in range(5)]
    sessions = []
    for ws in clients:
        sess = await manager.connect("world_prime", ws)
        sessions.append(sess)

    assert manager.get_stats()["active_connections"] == 5

    test_env = EventEnvelope(
        event_type="sim.tick",
        world_id="world_prime",
        sequence_number=10,
        payload={"tick": 100}
    )
    await manager.broadcast_envelope("world_prime", test_env)

    await asyncio.sleep(0.05)
    for ws in clients:
        assert len(ws.sent_messages) == 1
        msg = json.loads(ws.sent_messages[0])
        assert msg["sequence_number"] == 10

    await manager.shutdown()


@pytest.mark.asyncio
async def test_03_rapid_player_actions_and_idempotency():
    """Requirement 3: Rapid repeated commands with idempotency key do not execute twice."""
    key = "action_cmd_123"
    world_id = "world_alpha"

    # First attempt: is_new is True
    is_new, cached = idempotency_manager.register_or_check(world_id, key)
    assert is_new is True
    assert cached is None

    # Complete the command
    result = {"status": "ok", "resource_points_added": 500}
    idempotency_manager.complete(world_id, key, result)

    # Immediate second attempt with same key: is_new is False, returns cached result
    is_new_second, cached_second = idempotency_manager.register_or_check(world_id, key)
    assert is_new_second is False
    assert cached_second == result


@pytest.mark.asyncio
async def test_04_simulation_event_bursts_and_delta():
    """Requirement 4: Sequential ticks emit property-level deltas rather than full snapshots."""
    world_id = "world_delta_test"
    initial_state = {
        "world_id": world_id,
        "tick": 1,
        "year": 1.0,
        "resources": {"food": 1000.0, "water": 1000.0, "energy": 500.0},
        "economy": {"gdp": 50000.0, "stability": 0.8}
    }

    # Step 1: Initial state creates snapshot
    ev1, p1, b1, n1 = delta_engine.compute_state_delta(world_id, initial_state)
    assert ev1 == "world.state.snapshot"
    assert p1["is_snapshot"] is True
    assert b1 == 0
    assert n1 == 1

    # Step 2: Next tick changes only food and tick
    tick2_state = {
        "world_id": world_id,
        "tick": 2,
        "year": 1.01,
        "resources": {"food": 990.0, "water": 1000.0, "energy": 500.0},
        "economy": {"gdp": 50000.0, "stability": 0.8}
    }
    ev2, p2, b2, n2 = delta_engine.compute_state_delta(world_id, tick2_state)
    assert ev2 == "world.state.delta"
    assert p2["is_snapshot"] is False
    assert b2 == 1
    assert n2 == 2
    # Verify delta payload only contains the modified properties
    assert "food" in p2["updates"]["resources"]
    assert "water" not in p2["updates"]["resources"]
    assert p2["updates"]["tick"] == 2


def test_05_authoritative_delta_patch_reproducibility():
    """Requirement 5: Applying delta sequence onto base snapshot reproduces exact state."""
    base_state = {
        "tick": 10,
        "resources": {"food": 100.0, "energy": 50.0},
        "policies": ["universal_ai"],
        "temp_notice": "Alert!"
    }
    delta_payload = {
        "is_snapshot": False,
        "updates": {
            "tick": 11,
            "resources": {"food": 95.0, "materials": 200.0}
        },
        "removals": ["temp_notice"]
    }

    reconciled = DeltaEngine.apply_delta(base_state, delta_payload)

    assert reconciled["tick"] == 11
    assert reconciled["resources"]["food"] == 95.0
    assert reconciled["resources"]["energy"] == 50.0
    assert reconciled["resources"]["materials"] == 200.0
    assert "temp_notice" not in reconciled
    assert reconciled["policies"] == ["universal_ai"]


def test_06_monotonic_stream_sequencing():
    """Requirement 6: Sequence numbers strictly increment per world stream."""
    seq = StreamSequencer()
    s1 = seq.next_sequence("w1")
    s2 = seq.next_sequence("w1")
    s3 = seq.next_sequence("w1")
    assert [s1, s2, s3] == [1, 2, 3]

    # Independent world has independent counter
    w2_s1 = seq.next_sequence("w2")
    assert w2_s1 == 1


def test_07_missing_sequence_numbers_and_gap_detection():
    """Requirement 7: Gap detection correctly flags missing sequence count."""
    seq = StreamSequencer()
    # Normal in-order sequence
    has_gap, missing = seq.check_sequence_gap("w1", last_known_seq=5, new_seq=6)
    assert has_gap is False
    assert missing == 0

    # Gap detected: expected 6, received 9
    has_gap, missing = seq.check_sequence_gap("w1", last_known_seq=5, new_seq=9)
    assert has_gap is True
    assert missing == 3


@pytest.mark.asyncio
async def test_08_stale_event_rejection_and_version_safety():
    """Requirement 8: Older versions do not overwrite newer authoritative versions."""
    seq = StreamSequencer()
    seq.set_state_version("w_test", 10)

    # Trying to set older version has no effect
    seq.set_state_version("w_test", 8)
    assert seq.get_state_version("w_test") == 10

    # Setting newer version advances
    seq.set_state_version("w_test", 11)
    assert seq.get_state_version("w_test") == 11


@pytest.mark.asyncio
async def test_09_council_deliberation_event_publishing():
    """Requirement 9: Council deliberation events are routed through event bus."""
    published_events = []

    def on_council_event(env: EventEnvelope):
        published_events.append(env)

    event_bus.subscribe("council.deliberation.completed", on_council_event)

    envelope = await event_bus.publish(
        event_type="council.deliberation.completed",
        world_id="aurora-prime",
        category=EventCategory.COUNCIL,
        priority=EventPriority.CRITICAL,
        payload={"consensus_reached": True, "recommendations_count": 4}
    )

    assert len(published_events) == 1
    assert published_events[0].event_id == envelope.event_id
    assert published_events[0].payload["recommendations_count"] == 4


@pytest.mark.asyncio
async def test_10_slow_client_backpressure_and_queue_bounding():
    """Requirement 10: Slow client queue does not grow unbounded; low-priority messages drop."""
    # Create client with small queue of 3
    manager = RealtimeConnectionManager(client_queue_size=3)
    ws = MockWebSocket(delay_ms=200) # Simulates slow client
    session = await manager.connect("w_slow", ws)

    # Send 10 low-priority telemetry events rapidly
    for i in range(10):
        env = EventEnvelope(
            event_type="telemetry.tick",
            world_id="w_slow",
            priority=EventPriority.LOW,
            payload={"t": i}
        )
        await manager.broadcast_envelope("w_slow", env)

    stats = manager.get_stats()
    # Queue is bounded to 3 max
    assert stats["max_queue_depth"] <= 3
    # At least some low-priority messages were safely dropped under backpressure
    assert session.dropped_messages > 0

    await manager.shutdown()


@pytest.mark.asyncio
async def test_11_client_disconnect_and_resource_cleanup():
    """Requirement 11: Disconnecting cleans up sessions and cancels sender tasks."""
    manager = RealtimeConnectionManager()
    ws = MockWebSocket()
    session = await manager.connect("w_clean", ws)

    assert manager.get_stats()["active_connections"] == 1
    await manager.disconnect("w_clean", session)

    assert manager.get_stats()["active_connections"] == 0
    assert session.is_alive is False
    assert session.worker_task.done()

    await manager.shutdown()


@pytest.mark.asyncio
async def test_12_critical_event_outbox_durability():
    """Requirement 12: Critical events survive in the event bus outbox journal."""
    await event_bus.publish(
        event_type="policy.enacted",
        world_id="w_persist",
        category=EventCategory.GAMEPLAY,
        priority=EventPriority.CRITICAL,
        payload={"policy_id": "cognitive_scaffolding", "active": True}
    )

    outbox = event_bus.get_critical_outbox("w_persist")
    assert len(outbox) == 1
    assert outbox[0]["payload"]["policy_id"] == "cognitive_scaffolding"
    assert outbox[0]["priority"] == "critical"


@pytest.mark.asyncio
async def test_13_server_graceful_shutdown():
    """Requirement 13: Manager shutdown cleanly closes all active sockets with code 1001."""
    manager = RealtimeConnectionManager()
    ws1 = MockWebSocket()
    ws2 = MockWebSocket()
    await manager.connect("w_shut", ws1)
    await manager.connect("w_shut", ws2)

    await manager.shutdown()
    assert ws1.closed is True
    assert ws1.close_code == 1001
    assert ws2.closed is True
    assert ws2.close_code == 1001
    assert manager.get_stats()["active_connections"] == 0


@pytest.mark.asyncio
async def test_14_realtime_performance_telemetry_integration():
    """Requirement 14: Centralized telemetry captures WebSocket metrics, deltas, and errors."""
    perf_collector.record_ws_connect()
    perf_collector.record_ws_message_sent(128)
    perf_collector.record_ws_message_received(64, processing_ms=1.5)
    perf_collector.record_ws_delta_emitted()
    perf_collector.record_ws_snapshot_emitted()
    perf_collector.record_ws_duplicate_detected()
    perf_collector.record_ws_snapshot_recovery()
    perf_collector.record_ws_dropped(2)

    metrics = perf_collector.get_metrics_snapshot()
    ws_metrics = metrics["websocket"]

    assert ws_metrics["messages_sent"] >= 1
    assert ws_metrics["messages_received"] >= 1
    assert ws_metrics["deltas_emitted"] >= 1
    assert ws_metrics["snapshots_emitted"] >= 1
    assert ws_metrics["duplicate_events_detected"] >= 1
    assert ws_metrics["snapshot_recoveries"] >= 1
    assert ws_metrics["dropped_messages"] >= 2
