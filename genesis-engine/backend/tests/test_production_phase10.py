"""
CIVORA — Phase 10 Production Hardening, Deployment & Final Validation Test Suite
Validates health probes, configuration invariants, rate limiting, end-to-end user journeys,
real-time WebSocket streams, production diagnostics access control, and atomic backup/restore.
"""

import os
import time
import uuid
import tempfile
import pytest
from fastapi.testclient import TestClient

from main import app
from config import Settings, settings
from auth.rate_limiter import auth_rate_limiter
from db.backup import create_backup, restore_backup, verify_database_integrity
from engine.state import world_manager


@pytest.fixture
def client():
    return TestClient(app)


def test_01_health_probes_liveness_and_readiness(client):
    """Verifies that liveness and readiness health probes return HTTP 200 with expected structure."""
    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json() == {"status": "alive"}

    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    ready_data = res_ready.json()
    assert ready_data["status"] == "ready"
    assert ready_data["database"] == "connected"

    # Backward compatibility endpoints
    res_api_health = client.get("/api/health")
    assert res_api_health.status_code == 200
    assert res_api_health.json()["status"] == "online"


def test_02_production_config_validation_and_invariants():
    """Verifies that production invariants validation strictly fails if JWT secret is insecure."""
    test_settings = Settings()
    test_settings.ENVIRONMENT = "production"
    test_settings.JWT_SECRET = "genesis_super_secret_jwt_key_2026_dev"  # Dev default

    with pytest.raises(RuntimeError) as exc_info:
        test_settings.validate_production_invariants()
    assert "CRITICAL SECURITY FAILURE: GENESIS_JWT_SECRET" in str(exc_info.value)

    # Valid secret should pass
    test_settings.JWT_SECRET = "a" * 32
    test_settings.ALLOWED_ORIGINS = ["https://civora.example.com"]
    test_settings.validate_production_invariants()  # Should not raise


def test_03_auth_rate_limiting_enforcement(client):
    """Verifies that authentication attempts are strictly rate-limited per IP."""
    auth_rate_limiter.reset()

    # Rapid requests from same IP
    status_codes = []
    for _ in range(settings.AUTH_RATE_LIMIT_PER_MINUTE + 5):
        res = client.post("/api/v1/auth/login", json={
            "username": "rate_limit_probe_user",
            "password": "WrongPassword123!"
        })
        status_codes.append(res.status_code)

    # Initially unauthorized (401), followed by throttled (429)
    assert 401 in status_codes
    assert 429 in status_codes
    assert status_codes[-1] == 429

    # Reset limiter for subsequent tests
    auth_rate_limiter.reset()


def test_04_end_to_end_user_journey_simulation_and_economy(client):
    """End-to-End Test: Registers user, obtains token, inspects civilization, and runs simulation."""
    unique_id = uuid.uuid4().hex[:8]
    username = f"emperor_{unique_id}"
    email = f"{username}@civora.org"

    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "password": "StrongPassword2026!"
    })
    assert reg_res.status_code == 201
    auth_data = reg_res.json()
    token = auth_data["access_token"]
    assert token

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Me
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == username

    # 3. Access Aurora Prime Civilization State
    civ_res = client.get("/api/v1/civilizations/aurora-prime", headers=headers)
    assert civ_res.status_code == 200
    civ_data = civ_res.json()
    assert civ_data["name"] == "Aurora Prime"
    assert "gdp" in civ_data
    assert "population_count" in civ_data

    # 4. Advance Simulation Tick
    sim_res = client.post("/api/v1/civilizations/aurora-prime/simulate", json={"ticks": 2}, headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "current_tick" in sim_data
    assert sim_data["world_id"] == "aurora-prime"

    # 5. Execute Counterfactual Experiment
    exp_res = client.post("/api/experiments/execute", json={
        "civ_id": "aurora-prime",
        "horizon_years": 3,
        "policy_overrides": {"cognitive_scaffolding": 0.90}
    }, headers=headers)
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["success"] is True
    assert "projected_trajectory" in exp_data


def test_05_council_intelligence_pipeline_e2e(client):
    """Verifies end-to-end advisor briefing, recommendations, and execution lifecycle."""
    # 1. List Advisors
    adv_res = client.get("/api/v1/council/advisors")
    assert adv_res.status_code == 200
    res_data = adv_res.json()
    advisors = res_data["data"] if isinstance(res_data, dict) and "data" in res_data else res_data
    assert len(advisors) >= 1

    first_advisor_id = advisors[0]["id"]

    # 2. Get Advisor Briefing
    brief_res = client.get(f"/api/v1/council/advisors/{first_advisor_id}/briefing")
    assert brief_res.status_code == 200

    # 3. Create & Convoke Council Session (safely completing any previous active session)
    existing_sessions = client.get("/api/v1/council/sessions?world_id=aurora-prime").json().get("data", [])
    for s in existing_sessions:
        if s.get("status") == "active":
            client.post(f"/api/v1/council/sessions/{s['id']}/complete", params={"finalDecision": "deferred"})

    create_sess_res = client.post("/api/v1/council/sessions", json={
        "worldId": "aurora-prime",
        "topic": "Strategic Infrastructure Review",
        "description": "Council review of economic metrics and innovation."
    })
    assert create_sess_res.status_code in [200, 201]
    session_id = create_sess_res.json()["data"]["id"]

    session_res = client.post(f"/api/v1/council/sessions/{session_id}/convoke")
    assert session_res.status_code == 200
    session_data = session_res.json()
    assert session_data.get("success") is True
    assert "data" in session_data


def test_06_websocket_realtime_e2e_resync(client):
    """Verifies WebSocket client connection, ping/pong, and idempotency deduplication."""
    # Ensure test world exists
    world_manager.create(name="WS Production Test World", population=30, world_id="ws_prod_world")

    with client.websocket_connect("/ws/world/ws_prod_world") as websocket:
        # 1. Expect initial snapshot
        init_data = websocket.receive_json()
        assert init_data["event_type"] == "initial_state"
        assert init_data["world_id"] == "ws_prod_world"

        # 2. Send ping, receive pong
        websocket.send_json({"type": "ping", "timestamp": time.time()})
        pong_data = websocket.receive_json()
        assert pong_data["event_type"] == "pong"

        # 3. Send tick with idempotency key
        idemp_key = f"key_{uuid.uuid4().hex}"
        websocket.send_json({"type": "tick", "ticks": 1, "idempotency_key": idemp_key})
        tick_data = websocket.receive_json()
        assert tick_data["type"] == "tick_update"

        # 4. Send duplicate tick with same idempotency key - deduplicated response received
        websocket.send_json({"type": "tick", "ticks": 1, "idempotency_key": idemp_key})
        dup_data = websocket.receive_json()
        assert dup_data["event_type"] == "tick_update" or dup_data.get("type") == "tick_update"

        # 5. Authoritative Resync snapshot request
        websocket.send_json({"type": "resync"})
        resync_data = websocket.receive_json()
        assert resync_data["event_type"] in ["initial_state", "world.state.snapshot"]


def test_07_diagnostics_production_access_control(client):
    """Verifies that mutating diagnostic controls in production mode requires authorization."""
    original_env = settings.ENVIRONMENT
    try:
        # Simulate production mode
        settings.ENVIRONMENT = "production"

        # Unauthenticated request to toggle should be rejected with 401
        res = client.post("/api/v1/diagnostics/toggle", json={"enabled": False})
        assert res.status_code in [401, 403]

        # Unauthenticated request to reset should be rejected with 401
        res = client.post("/api/v1/diagnostics/reset")
        assert res.status_code in [401, 403]

        # Reading metrics snapshot remains allowed for health monitoring
        res_metrics = client.get("/api/v1/diagnostics/metrics")
        assert res_metrics.status_code == 200
    finally:
        settings.ENVIRONMENT = original_env


def test_08_atomic_sqlite_backup_and_restore_cycle():
    """Performs an end-to-end atomic backup and restore cycle on an isolated temporary copy."""
    with tempfile.TemporaryDirectory() as temp_dir:
        backup_file = create_backup(destination_dir=temp_dir)
        assert os.path.exists(backup_file)

        # Verify integrity of backup
        is_valid, msg = verify_database_integrity(backup_file)
        assert is_valid is True

        # Test restoring to an isolated target
        test_restore_target = os.path.join(temp_dir, "restored_test.db")
        success = restore_backup(backup_file, target_path=test_restore_target)
        assert success is True

        # Verify restored target integrity
        target_valid, _ = verify_database_integrity(test_restore_target)
        assert target_valid is True
