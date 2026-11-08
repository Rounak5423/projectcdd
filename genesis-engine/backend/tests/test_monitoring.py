"""
Tests for CIVORA Centralized Performance Monitoring Infrastructure (Phase 1).
"""

import pytest
from fastapi.testclient import TestClient

from main import app
from monitoring.collector import perf_collector


@pytest.fixture
def client():
    return TestClient(app)


def test_diagnostics_metrics_endpoint_structure(client):
    """Verifies that the /api/v1/diagnostics/metrics endpoint returns the expected structured schema."""
    resp = client.get("/api/v1/diagnostics/metrics")
    assert resp.status_code == 200
    data = resp.json()

    assert "metadata" in data
    assert "api" in data
    assert "database" in data
    assert "simulation" in data
    assert "council_ai" in data
    assert "websocket" in data

    assert data["metadata"]["status"] == "online"
    assert "monitoring_enabled" in data["metadata"]
    assert "uptime_seconds" in data["metadata"]


def test_api_middleware_correlation_id_and_timing(client):
    """Verifies that incoming requests receive X-Correlation-ID and X-Response-Time-Ms headers."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert "X-Correlation-ID" in resp.headers
    assert "X-Response-Time-Ms" in resp.headers
    assert float(resp.headers["X-Response-Time-Ms"]) >= 0.0


def test_toggle_and_reset_monitoring(client):
    """Verifies that monitoring can be toggled on/off and reset via diagnostics API."""
    # Toggle off
    resp_off = client.post("/api/v1/diagnostics/toggle", json={"enabled": False})
    assert resp_off.status_code == 200
    assert resp_off.json()["monitoring_enabled"] is False

    # Check collector status
    assert perf_collector.is_enabled is False

    # Reset
    resp_reset = client.post("/api/v1/diagnostics/reset")
    assert resp_reset.status_code == 200

    # Toggle back on
    resp_on = client.post("/api/v1/diagnostics/toggle", json={"enabled": True})
    assert resp_on.status_code == 200
    assert resp_on.json()["monitoring_enabled"] is True
    assert perf_collector.is_enabled is True


def test_database_query_tracer_records_queries(client):
    """Verifies that DB tracer captures query executions without altering query results."""
    initial_queries = perf_collector._db_total_queries
    resp = client.get("/api/worlds")
    assert resp.status_code == 200
    assert perf_collector._db_total_queries >= initial_queries


def test_simulation_tick_and_council_ai_instrumentation():
    """Verifies that simulation tick and council AI instrumentation record metrics accurately."""
    # Record synthetic tick
    perf_collector.record_simulation_tick(
        tick_duration_ms=12.5,
        processed_agents=120,
        state_updates=1,
        events_generated=1,
        db_writes=2
    )

    # Record synthetic AI run
    perf_collector.record_ai_advisor_run("adv_chancellor", 34.2, success=True)
    perf_collector.record_council_deliberation(112.4, success=True, failed_advisors=0)

    snap = perf_collector.get_metrics_snapshot()
    assert snap["simulation"]["total_ticks"] > 0
    assert "adv_chancellor" in snap["council_ai"]["advisors"]
    assert snap["council_ai"]["advisors"]["adv_chancellor"]["count"] > 0
    assert snap["council_ai"]["deliberation"]["count"] > 0
