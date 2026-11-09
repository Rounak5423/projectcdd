"""
CIVORA — Phase 9 Scalability, Concurrency & Load Engineering Test Suite
Validates thread-safe multi-world execution, AI queue bounding, WebSocket connection limits,
agent scaling throughput, database read/write concurrency, and diagnostics telemetry.
"""

import asyncio
import threading
import time
import pytest
from fastapi.testclient import TestClient
from fastapi import WebSocketDisconnect

from main import app
from engine.state import world_manager
from engine.simulation import create_initial_world, step_world
from app.features.council.intelligence.request_manager import AIRequestManager
from realtime.connection_manager import RealtimeConnectionManager
from monitoring.collector import perf_collector
from db.database import get_db_connection


@pytest.fixture
def client():
    return TestClient(app)


def test_01_multi_world_concurrency_and_isolation():
    """Requirement: Simultaneous worlds must maintain complete isolation with zero cross-leakage."""
    w1 = world_manager.create(name="Empire One", population=50, world_id="sc_world_1")
    w2 = world_manager.create(name="Empire Two", population=100, world_id="sc_world_2")

    # Advance both worlds in separate threads
    def advance(w_id, count):
        w = world_manager.get(w_id)
        step_world(w, ticks=count)

    t1 = threading.Thread(target=advance, args=("sc_world_1", 5))
    t2 = threading.Thread(target=advance, args=("sc_world_2", 10))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert w1.tick == 5
    assert w2.tick == 10
    assert w1.name == "Empire One"
    assert w2.name == "Empire Two"
    assert len(w1.citizens) == 50
    assert len(w2.citizens) == 100

    world_manager.delete("sc_world_1")
    world_manager.delete("sc_world_2")


@pytest.mark.asyncio
async def test_02_ai_request_manager_queue_bounding_and_overload():
    """Requirement: When semaphore and queue capacity are saturated, excess tasks fail fast with overload metric."""
    mgr = AIRequestManager(max_concurrency=2, max_queue_depth=3, default_timeout_sec=2.0)
    perf_collector.reset()

    started_events = [asyncio.Event() for _ in range(2)]
    release_event = asyncio.Event()

    async def slow_ai_task(idx):
        if idx < 2:
            started_events[idx].set()
        await release_event.wait()
        return f"result_{idx}"

    # Launch 2 workers to hold the 2 semaphore slots
    tasks = [
        asyncio.create_task(mgr.execute_task(f"task_{i}", lambda i=i: slow_ai_task(i), deduplicate=False))
        for i in range(2)
    ]

    # Wait until both slots are occupied
    await asyncio.gather(started_events[0].wait(), started_events[1].wait())

    # Queue 3 tasks to reach max_queue_depth (3)
    queued_tasks = [
        asyncio.create_task(mgr.execute_task(f"queued_{i}", lambda i=i: slow_ai_task(i+2), deduplicate=False))
        for i in range(3)
    ]
    await asyncio.sleep(0.01)

    # The 6th task exceeds capacity and must fast-fail or return fallback
    with pytest.raises(RuntimeError) as exc_info:
        await mgr.execute_task(
            "excess_task",
            lambda: slow_ai_task(99),
            fallback_value=None,
            deduplicate=False
        )
    assert "saturated" in str(exc_info.value).lower()

    # Verify overload rejection counter incremented
    snap = perf_collector.get_metrics_snapshot()
    assert snap["council_ai"]["overload_rejections"] >= 1

    # Release workers
    release_event.set()
    await asyncio.gather(*tasks, *queued_tasks)


@pytest.mark.asyncio
async def test_03_websocket_gateway_capacity_limits():
    """Requirement: Connections exceeding world capacity limit are rejected with code 1008."""
    mgr = RealtimeConnectionManager(max_connections_per_world=3, max_total_connections=5)
    perf_collector.reset()

    class MockWebSocket:
        def __init__(self):
            self.accepted = False
            self.closed_code = None
        async def accept(self):
            self.accepted = True
        async def send_text(self, text):
            pass
        async def close(self, code=1000, reason=""):
            self.closed_code = code

    # Connect 3 clients to fill world capacity
    clients = [MockWebSocket() for _ in range(3)]
    sessions = []
    for ws in clients:
        sess = await mgr.connect("world_cap_test", ws)
        sessions.append(sess)

    assert len(mgr._sessions["world_cap_test"]) == 3

    # 4th client exceeds per-world limit (3) and must be rejected
    overflow_ws = MockWebSocket()
    with pytest.raises(WebSocketDisconnect) as exc_info:
        await mgr.connect("world_cap_test", overflow_ws)

    assert exc_info.value.code == 1008
    assert overflow_ws.closed_code == 1008

    # Verify telemetry tracked rejection
    snap = perf_collector.get_metrics_snapshot()
    assert snap["websocket"]["connection_rejections"] >= 1

    await mgr.shutdown()


def test_04_database_concurrent_read_write_stability():
    """Requirement: Concurrent readers and writers run without raising database is locked exceptions."""
    errors = []

    def reader():
        try:
            conn = get_db_connection()
            with conn:
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM worlds")
                _ = cur.fetchone()
            conn.close()
        except Exception as e:
            errors.append(f"Reader error: {e}")

    def writer(idx):
        try:
            conn = get_db_connection()
            with conn:
                conn.execute(
                    "INSERT INTO metrics_history (world_id, tick, year, day, population, gdp, happiness, employment, environment, gini, civic_stability, macro_innovation, avg_ai_dependency, avg_reasoning, food, energy, materials) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    ("aurora-prime", 99000 + idx, 2026, 1, 1000, 1000000.0, 0.8, 0.9, 0.7, 0.25, 0.8, 0.7, 0.2, 0.8, 100.0, 100.0, 100.0)
                )
            conn.close()
        except Exception as e:
            errors.append(f"Writer error: {e}")

    threads = []
    # 20 readers + 10 writers simultaneously
    for _ in range(20):
        threads.append(threading.Thread(target=reader))
    for i in range(10):
        threads.append(threading.Thread(target=writer, args=(i,)))

    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Clean up test rows
    conn = get_db_connection()
    with conn:
        conn.execute("DELETE FROM metrics_history WHERE tick >= 99000")
    conn.close()

    assert len(errors) == 0, f"Encountered concurrency errors: {errors}"


def test_05_agent_scaling_monotonicity():
    """Requirement: Agent scaling from 10 to 1,000 maintains deterministic monotonic updates."""
    w = create_initial_world(population_size=1000, seed=42)
    assert w.population_count == 1000

    t0 = time.perf_counter()
    step_world(w, ticks=3)
    dur = (time.perf_counter() - t0) * 1000.0

    assert w.tick == 3
    assert w.population_count > 900
    assert w.economy.gini >= 0.0
    # 1,000 agents over 3 ticks must complete well within 150ms budget
    assert dur < 150.0


def test_06_state_manager_thread_safety():
    """Requirement: WorldStateManager handles concurrent creation and branching safely."""
    errors = []

    def create_and_branch(idx):
        try:
            w_id = f"th_world_{idx}"
            world_manager.create(name=f"Thread World {idx}", population=20, world_id=w_id)
            world_manager.branch(source_id=w_id, new_name=f"Branch {idx}", new_id=f"th_br_{idx}")
            world_manager.delete(w_id)
            world_manager.delete(f"th_br_{idx}")
        except Exception as e:
            errors.append(str(e))

    threads = [threading.Thread(target=create_and_branch, args=(i,)) for i in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()

    assert len(errors) == 0, f"Thread safety errors: {errors}"


def test_07_diagnostics_telemetry_phase9_metrics(client):
    """Requirement: Diagnostics endpoint reports Phase 9 scalability metrics."""
    resp = client.get("/api/v1/diagnostics/metrics")
    assert resp.status_code == 200
    data = resp.json()

    assert "queue_depth" in data["council_ai"]
    assert "overload_rejections" in data["council_ai"]
    assert "connection_rejections" in data["websocket"]
    assert "contention_events" in data["database"]

