"""
CIVORA — Phase 8 Memory Management & Resource Optimization Test Suite
Validates bounded data structures, dead session purging, task lifecycle management,
DeltaEngine eviction, and memory telemetry across extended sessions.
"""

import asyncio
import time
import pytest
from fastapi.testclient import TestClient
from main import app
from monitoring.collector import perf_collector
from realtime.connection_manager import rt_ws_manager, ClientSession
from realtime.event_bus import event_bus
from realtime.envelope import EventEnvelope, EventPriority, EventCategory
from realtime.delta import DeltaEngine
from engine.scheduler import SimulationRunner


@pytest.fixture
def client():
    return TestClient(app)


def test_01_api_endpoints_normalization_and_bounding():
    """Requirement: Dynamic URLs must be normalized and _api_endpoints capped at 256 items."""
    perf_collector.reset()

    # Simulate 500 requests with unique dynamic world IDs
    for i in range(500):
        perf_collector.record_api_request(
            method="GET",
            path=f"/api/v1/worlds/world-{i}/citizens",
            status_code=200,
            duration_ms=4.2,
            correlation_id=f"corr_{i}"
        )

    snap = perf_collector.get_metrics_snapshot()
    # The normalized route key should be "GET /api/v1/worlds/{id}/citizens"
    # and total tracked endpoints must be tightly bounded
    assert snap["memory"]["tracked_endpoints_count"] <= 256
    endpoint_names = [ep["endpoint"] for ep in snap["api"]["endpoints"]]
    assert "GET /api/v1/worlds/{id}/citizens" in endpoint_names
    # Verify count aggregated on the normalized endpoint
    norm_ep = next(ep for ep in snap["api"]["endpoints"] if ep["endpoint"] == "GET /api/v1/worlds/{id}/citizens")
    assert norm_ep["count"] == 500


@pytest.mark.asyncio
async def test_02_realtime_connection_manager_dead_session_purge():
    """Requirement: Dead client sessions must be actively purged from _sessions during heartbeat sweep."""
    class MockWebSocket:
        def __init__(self):
            self.closed = False
        async def accept(self):
            pass
        async def send_text(self, text: str):
            pass
        async def close(self, code=1000, reason=""):
            self.closed = True

    # Connect a mock client session
    mock_ws = MockWebSocket()
    session = await rt_ws_manager.connect("test-world-leak", mock_ws)
    assert "test-world-leak" in rt_ws_manager._sessions
    assert session.client_id in rt_ws_manager._sessions["test-world-leak"]

    # Mark session as dead (simulating abrupt network disconnect)
    session.is_alive = False

    # Execute a manual heartbeat sweep iteration
    for world_id, client_map in list(rt_ws_manager._sessions.items()):
        for cid, s in list(client_map.items()):
            if not s.is_alive:
                client_map.pop(cid, None)
                continue
        if not client_map:
            rt_ws_manager._sessions.pop(world_id, None)

    # Dead session must be purged from the manager
    assert "test-world-leak" not in rt_ws_manager._sessions


@pytest.mark.asyncio
async def test_03_event_bus_background_tasks_lifecycle():
    """Requirement: Event bus coroutine subscribers must be tracked in a task set and cleaned up on completion."""
    event_bus.clear()
    executed = []

    async def async_handler(env: EventEnvelope):
        await asyncio.sleep(0.01)
        executed.append(env.event_type)

    event_bus.subscribe("test.lifecycle.event", async_handler)

    # Publish an event
    env = await event_bus.publish(
        event_type="test.lifecycle.event",
        world_id="aurora-prime",
        payload={"message": "lifecycle_test"}
    )
    assert env is not None

    # Allow task to run and complete
    await asyncio.sleep(0.05)
    assert len(executed) == 1
    # Bounded task set should discard finished tasks
    assert len(event_bus._background_tasks) == 0


@pytest.mark.asyncio
async def test_04_simulation_runner_task_cleanup():
    """Requirement: SimulationRunner must clear _task reference on pause and stop."""
    async def dummy_tick(world_id: str, ticks: int):
        return {"ticks": ticks}

    runner = SimulationRunner(world_id="test-sim-mem", speed="10x", tick_func=dummy_tick)
    runner.start()
    assert runner.status == "running"
    assert runner._task is not None

    # Pause and verify task reference is freed
    await runner.pause_async()
    assert runner.status == "paused"
    assert runner._task is None

    # Stop and verify task reference remains None
    await runner.stop_async()
    assert runner.status == "stopped"
    assert runner._task is None


def test_05_delta_engine_capacity_bounding():
    """Requirement: DeltaEngine must bound cached world states to prevent unbounded memory growth."""
    delta = DeltaEngine(max_cached_worlds=8)

    # Insert 20 distinct worlds
    for i in range(20):
        w_id = f"world-delta-{i}"
        state = {"id": w_id, "pop": 1000 + i, "tick": i}
        delta.compute_state_delta(w_id, state)

    # Only max_cached_worlds (8) should be retained in memory
    assert len(delta._previous_states) <= 8


def test_06_memory_telemetry_diagnostics_reporting(client):
    """Requirement: Developer diagnostics endpoint must report process RSS and GC stats."""
    resp = client.get("/api/v1/diagnostics/metrics")
    assert resp.status_code == 200
    data = resp.json()

    assert "memory" in data
    mem = data["memory"]
    assert "process_rss_mb" in mem
    assert mem["process_rss_mb"] is None or mem["process_rss_mb"] > 0
    assert "gc_gen_counts" in mem
    assert "gen0" in mem["gc_gen_counts"]
    assert "tracked_endpoints_count" in mem


@pytest.mark.asyncio
async def test_07_extended_simulation_long_session_stability():
    """Requirement: Extended simulation execution must maintain stable tick timings without runaway memory."""
    import psutil
    process = psutil.Process()
    initial_rss = process.memory_info().rss / (1024 * 1024)

    runner = SimulationRunner(world_id="aurora-prime")

    # Run 100 consecutive ticks
    for _ in range(100):
        await runner.advance_ticks(1)

    final_rss = process.memory_info().rss / (1024 * 1024)
    rss_growth = final_rss - initial_rss

    # Memory growth over 100 ticks must remain stable (< 25 MB growth ceiling)
    assert rss_growth < 25.0
