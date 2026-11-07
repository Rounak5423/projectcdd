"""
CIVORA — Council of Advisors Backend Automated Tests
Verifies all 14 core requirements, business rules, idempotency, and data integrity.
"""

import os
import pytest
from fastapi.testclient import TestClient

import db.database
from main import app
from engine.simulation_v1 import seed_aurora_prime_if_not_exists
from app.features.council.constants import (
    ADVISOR_CHANCELLOR,
    ADVISOR_TREASURER,
    ADVISOR_SCHOLAR,
    ADVISOR_ARCHITECT,
    ADVISOR_PHYSICIAN,
    ADVISOR_KEEPER,
    PERMANENT_ADVISOR_IDS,
)
from app.features.council.repository import CouncilRepository

client = TestClient(app)


@pytest.fixture(autouse=True, scope="session")
def setup_test_db(tmp_path_factory):
    """Sets up an isolated SQLite test database with seed data."""
    test_db = str(tmp_path_factory.mktemp("council_db") / "test_genesis.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()
    repo = CouncilRepository()
    repo.seed_advisors_idempotent()


# ---------------------------------------------------------------------------
# Test 1 & 2: Advisor Seeding Idempotency & Retrieval
# ---------------------------------------------------------------------------

def test_advisor_seeding_is_idempotent():
    """Requirement 1: Repeated seeding must never create duplicate advisors."""
    repo = CouncilRepository()
    # Call seeding 5 times consecutively
    for _ in range(5):
        repo.seed_advisors_idempotent()

    advisors = repo.get_all_advisors()
    assert len(advisors) == 6, f"Expected exactly 6 advisors, got {len(advisors)}"

    advisor_ids = [a["id"] for a in advisors]
    for expected_id in PERMANENT_ADVISOR_IDS:
        assert expected_id in advisor_ids
        assert advisor_ids.count(expected_id) == 1, f"Duplicate found for {expected_id}"


def test_get_all_advisors_endpoint():
    """Requirement 2: All six advisors can be retrieved via REST API."""
    # Test both /api/v1/council/advisors and /api/council/advisors
    for path in ["/api/v1/council/advisors", "/api/council/advisors"]:
        res = client.get(path)
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        advisors = payload["data"]
        assert len(advisors) == 6
        # Verify display order
        orders = [a["displayOrder"] for a in advisors]
        assert orders == sorted(orders)


def test_get_advisor_detail_endpoint():
    """Requirement 3: Advisor detail returns the correct advisor."""
    res = client.get(f"/api/v1/council/advisors/{ADVISOR_CHANCELLOR}")
    assert res.status_code == 200
    payload = res.json()
    assert payload["success"] is True
    adv = payload["data"]
    assert adv["id"] == ADVISOR_CHANCELLOR
    assert adv["officialTitle"] == "The High Chancellor"
    assert adv["domain"] == "Governance and Society"
    assert len(adv["responsibilities"]) >= 3


def test_get_advisor_briefing_endpoint():
    """Verifies standing briefing endpoint placeholder."""
    res = client.get(f"/api/v1/council/advisors/{ADVISOR_TREASURER}/briefing")
    assert res.status_code == 200
    payload = res.json()
    assert payload["success"] is True
    briefing = payload["data"]
    assert briefing["advisorId"] == ADVISOR_TREASURER
    assert "headline" in briefing
    assert len(briefing["keyMetrics"]) >= 1


# ---------------------------------------------------------------------------
# Test 4, 5, 6, 7 & 8: Council Session Lifecycle & Decision Locking
# ---------------------------------------------------------------------------

def test_session_lifecycle_and_decision_locking():
    """
    Requirements 4, 6, 7, 8:
    - Session can be created.
    - Listing filters correctly.
    - Session can be completed.
    - Completed session CANNOT receive new decisions.
    """
    # 1. Create a session
    create_res = client.post("/api/v1/council/sessions", json={
        "worldId": "aurora-prime",
        "title": "Imperial Fiscal & Defensive Deliberation",
        "simYear": 12,
        "simDay": 145,
        "agendaTopics": ["Treasury Reserves", "Worker Sector Dissidence"],
        "invitedAdvisorIds": [ADVISOR_CHANCELLOR, ADVISOR_TREASURER],
        "openingAddress": "Sovereign High Directorate calls the council to order."
    })
    assert create_res.status_code == 201
    session_data = create_res.json()["data"]
    session_id = session_data["id"]
    assert session_data["worldId"] == "aurora-prime"
    assert session_data["status"] == "active"
    assert session_data["state"] == "In Progress"
    assert ADVISOR_CHANCELLOR in session_data["attendees"]
    assert ADVISOR_TREASURER in session_data["attendees"]

    # 2. Get session details
    get_res = client.get(f"/api/v1/council/sessions/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == session_id

    # 3. List sessions with filtering
    list_res = client.get("/api/v1/council/sessions?worldId=aurora-prime&status=active")
    assert list_res.status_code == 200
    active_sessions = list_res.json()["data"]
    assert any(s["id"] == session_id for s in active_sessions)

    # 4. Record a decision while active
    dec_res = client.post(f"/api/v1/council/sessions/{session_id}/decisions", json={
        "outcome": "Ratified",
        "decreeSummary": "Authorize immediate transfer of 5,000 credit reserves.",
        "decision_type": "fiscal_ordinance"
    })
    assert dec_res.status_code == 201
    dec_data = dec_res.json()["data"]
    assert dec_data["outcome"] == "Ratified"
    assert dec_data["sessionId"] == session_id

    # 5. Complete the session
    comp_res = client.post(f"/api/v1/council/sessions/{session_id}/complete", params={
        "summary": "Directives ratified and session concluded in peace."
    })
    assert comp_res.status_code == 200
    completed_data = comp_res.json()["data"]
    assert completed_data["status"] == "completed"
    assert completed_data["state"] == "Concluded"

    # 6. Attempting to complete already completed session must fail (HTTP 400)
    repeat_comp = client.post(f"/api/v1/council/sessions/{session_id}/complete")
    assert repeat_comp.status_code == 400

    # 7. Requirement 8: A completed session CANNOT receive new decisions (HTTP 400)
    locked_dec_res = client.post(f"/api/v1/council/sessions/{session_id}/decisions", json={
        "outcome": "Vetoed",
        "decreeSummary": "Attempted post-session decree should fail."
    })
    assert locked_dec_res.status_code == 400
    assert "locked" in locked_dec_res.json()["detail"].lower()


def test_session_creation_invalid_world():
    """Requirement 5: A session cannot be created for a non-existent or unauthorized world."""
    res = client.post("/api/v1/council/sessions", json={
        "worldId": "non_existent_world_999",
        "title": "Phantom Session",
    })
    assert res.status_code == 404


def test_session_creation_invalid_advisor():
    """Requirement 12: Invalid advisor IDs are rejected."""
    res = client.post("/api/v1/council/sessions", json={
        "worldId": "aurora-prime",
        "title": "Erroneous Advisor Session",
        "invitedAdvisorIds": ["fake-advisor-identity"]
    })
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Test 9, 10 & 11: Recommendations & "Accepted != Implemented" Rule
# ---------------------------------------------------------------------------

def test_recommendation_lifecycle_and_accepted_not_implemented():
    """
    Requirements 9, 10, 11:
    - Recommendation can be created.
    - Review transitions work correctly (accept, reject, request_review).
    - ACCEPTED DOES NOT MEAN IMPLEMENTED: Accepting a recommendation must leave status as Accepted.
    """
    # 1. Create recommendation
    create_res = client.post("/api/v1/council/recommendations", json={
        "worldId": "aurora-prime",
        "advisorId": ADVISOR_SCHOLAR,
        "title": "Quantum Epistemology Scaffolding",
        "description": "Establish cognitive curriculum guidelines for synthetic intelligence modules.",
        "justification": "Mitigates civilian reasoning atrophy.",
        "expectedBenefits": ["+12% Critical evaluation retention"],
        "potentialRisks": ["Minor short-term cognitive friction"],
        "estimatedCostCrc": 750.0,
        "politicalCapitalReq": 150.0,
        "category": "Research",
        "priority": "High"
    })
    assert create_res.status_code == 201
    rec = create_res.json()["data"]
    rec_id = rec["id"]
    assert rec["status"] == "Proposed"
    assert rec["priority"] == "High"
    assert rec["advisorId"] == ADVISOR_SCHOLAR

    # 2. Review: request_review -> Under Review
    rev1 = client.post(f"/api/v1/council/recommendations/{rec_id}/review", json={
        "action": "request_review",
        "notes": "Referred to imperial academic sub-committee."
    })
    assert rev1.status_code == 200
    assert rev1.json()["data"]["status"] == "Under Review"

    # 3. Review: accept -> Accepted
    rev2 = client.post(f"/api/v1/council/recommendations/{rec_id}/review", json={
        "action": "accept",
        "notes": "Ratified by Sovereign Decree."
    })
    assert rev2.status_code == 200
    accepted_rec = rev2.json()["data"]

    # CRITICAL RULE: "ACCEPTED DOES NOT MEAN IMPLEMENTED"
    assert accepted_rec["status"] == "Accepted"
    assert accepted_rec["status"] != "Implemented"

    # 4. Cannot revert accepted recommendation directly back to proposed
    bad_rev = client.post(f"/api/v1/council/recommendations/{rec_id}/review", json={
        "action": "request_review",
        "status": "Proposed"
    })
    assert bad_rev.status_code == 400

    # 5. History check
    hist_res = client.get(f"/api/v1/council/recommendations/{rec_id}/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()["data"]
    assert len(hist) >= 2


# ---------------------------------------------------------------------------
# Test 13 & 14: Cross-World Data Isolation & Historical Decisions
# ---------------------------------------------------------------------------

def test_cross_world_isolation_and_historical_decisions():
    """
    Requirements 13 & 14:
    - Council data is strictly isolated by world_id.
    - Historical decisions remain accessible.
    """
    # Create two separate worlds
    w1_res = client.post("/api/v1/worlds", json={
        "name": "World Alpha",
        "climate": "Temperate",
        "technology_level": "Automated",
        "initial_population": 100
    })
    w1_id = w1_res.json()["id"]

    w2_res = client.post("/api/v1/worlds", json={
        "name": "World Beta",
        "climate": "Arid",
        "technology_level": "Emergent",
        "initial_population": 100
    })
    w2_id = w2_res.json()["id"]

    # Create recommendation in World Alpha
    r1 = client.post("/api/v1/council/recommendations", json={
        "worldId": w1_id,
        "advisorId": ADVISOR_ARCHITECT,
        "title": "Alpha Monolith Foundation",
        "description": "Construct monumental aqueduct for World Alpha.",
        "priority": "Medium"
    }).json()["data"]

    # Create recommendation in World Beta
    r2 = client.post("/api/v1/council/recommendations", json={
        "worldId": w2_id,
        "advisorId": ADVISOR_KEEPER,
        "title": "Beta Geothermal Basin",
        "description": "Preserve subterranean moisture for World Beta.",
        "priority": "Critical"
    }).json()["data"]

    # Query Alpha recommendations - Beta recommendation MUST NOT leak
    alpha_recs = client.get(f"/api/v1/council/recommendations?worldId={w1_id}").json()["data"]
    alpha_ids = [r["id"] for r in alpha_recs]
    assert r1["id"] in alpha_ids
    assert r2["id"] not in alpha_ids, "Cross-world data leak detected!"

    # Query Beta recommendations - Alpha recommendation MUST NOT leak
    beta_recs = client.get(f"/api/v1/council/recommendations?worldId={w2_id}").json()["data"]
    beta_ids = [r["id"] for r in beta_recs]
    assert r2["id"] in beta_ids
    assert r1["id"] not in beta_ids, "Cross-world data leak detected!"

    # Create session with decision in World Alpha
    sess = client.post("/api/v1/council/sessions", json={
        "worldId": w1_id,
        "title": "Alpha Inaugural Session",
        "invitedAdvisorIds": [ADVISOR_ARCHITECT]
    }).json()["data"]

    dec = client.post(f"/api/v1/council/sessions/{sess['id']}/decisions", json={
        "recommendationId": r1["id"],
        "outcome": "Ratified",
        "decreeSummary": "Aqueduct construction approved with royal seal."
    }).json()["data"]

    # Complete session
    client.post(f"/api/v1/council/sessions/{sess['id']}/complete")

    # Verify historical decisions remain accessible (Requirement 14)
    dec_list = client.get(f"/api/v1/council/sessions/{sess['id']}/decisions").json()["data"]
    assert len(dec_list) == 1
    assert dec_list[0]["id"] == dec["id"]
    assert dec_list[0]["outcome"] == "Ratified"
    assert dec_list[0]["decreeSummary"] == "Aqueduct construction approved with royal seal."

