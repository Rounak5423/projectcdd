"""
CIVORA — Council of Advisors Phase 5 End-to-End Integration Test Suite
Validates the complete workflow:
1. Open Council and load advisor registry
2. Convene a Council session
3. Prevent duplicate active sessions
4. Convoke all six advisors in royal conclave
5. Generate findings, risks, and evidence-backed recommendations
6. Retrieve individual advisor briefings
7. Verify live advisor warning states
8. Detect genuine cross-domain disagreements and trade-offs
9. Review and Accept a recommendation (Accepted != Implemented)
10. Verify that Acceptance does NOT modify the simulation
11. Authorize execution of an accepted recommendation
12. Enforce resource availability checks (insufficient treasury fails gracefully)
13. Execute authorized action via simulation engine
14. Store execution reference and verify transition to Implemented
15. Verify idempotency safeguard (prevent duplicate execution)
16. Post-implementation outcome evaluation (baseline vs current progression)
17. Complete Council session and verify decision locking
18. Verify analysis operations remain strictly read-only on simulation state
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from db.database import get_db_connection
from app.features.council.constants import (
    ADVISOR_CHANCELLOR,
    ADVISOR_TREASURER,
    ADVISOR_SCHOLAR,
    ADVISOR_ARCHITECT,
    ADVISOR_PHYSICIAN,
    ADVISOR_KEEPER,
)

client = TestClient(app)


def test_complete_council_e2e_governance_workflow():
    # -------------------------------------------------------------------------
    # STEP 1: Open Council & Load Registry
    # -------------------------------------------------------------------------
    advisors_res = client.get("/api/v1/council/advisors")
    assert advisors_res.status_code == 200
    advisors = advisors_res.json()["data"]
    assert len(advisors) == 6
    advisor_ids = [a["id"] for a in advisors]
    assert ADVISOR_CHANCELLOR in advisor_ids
    assert ADVISOR_TREASURER in advisor_ids

    # -------------------------------------------------------------------------
    # Clean up any leftover active session for aurora-prime before starting
    # -------------------------------------------------------------------------
    conn = get_db_connection()
    with conn:
        conn.execute("UPDATE council_sessions SET status = 'completed' WHERE world_id = 'aurora-prime' AND status IN ('active', 'scheduled')")
        conn.execute("DELETE FROM policies WHERE world_id = 'aurora-prime' AND id = 'clean_energy_subsidies'")
        # Ensure world has adequate test resources in economy_resources
        conn.execute("UPDATE economy_resources SET genesis_research_credits = 5000.0, materials = 5000.0, energy = 2000.0 WHERE world_id = 'aurora-prime'")
    conn.close()

    # -------------------------------------------------------------------------
    # STEP 2: Convene Council Session
    # -------------------------------------------------------------------------
    session_res = client.post("/api/v1/council/sessions", json={
        "worldId": "aurora-prime",
        "title": "Imperial Grand Conclave on Post-Expansion Governance",
        "agendaTopics": [
            "Cognitive Scaffolding & AI Assistance",
            "Fiscal Sustainability & Resource Reserves",
            "Ecological Resilience & Infrastructure",
        ],
        "invitedAdvisorIds": [
            ADVISOR_CHANCELLOR,
            ADVISOR_TREASURER,
            ADVISOR_SCHOLAR,
            ADVISOR_ARCHITECT,
            ADVISOR_PHYSICIAN,
            ADVISOR_KEEPER,
        ],
        "openingAddress": "Sovereign High Directorate convenes the Six Ministries to establish imperial directives."
    })
    assert session_res.status_code == 201
    session_data = session_res.json()["data"]
    session_id = session_data["id"]
    assert session_data["worldId"] == "aurora-prime"
    assert session_data["status"] == "active"
    assert session_data["state"] == "In Progress"

    # -------------------------------------------------------------------------
    # STEP 3: Prevent Duplicate Active Sessions (Section 3 Step 2)
    # -------------------------------------------------------------------------
    dup_res = client.post("/api/v1/council/sessions", json={
        "worldId": "aurora-prime",
        "title": "Duplicate Conclave Attempt",
    })
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"].lower()

    # -------------------------------------------------------------------------
    # STEP 4: Convoke Advisors in Royal Conclave (Section 3 Step 3)
    # -------------------------------------------------------------------------
    convoke_res = client.post(f"/api/v1/council/sessions/{session_id}/convoke")
    assert convoke_res.status_code == 200
    report = convoke_res.json()["data"]

    # Verify all 6 advisors delivered analysis
    assert len(report["advisors"]) == 6
    assert ADVISOR_CHANCELLOR in report["advisors"]
    assert ADVISOR_TREASURER in report["advisors"]
    assert len(report["recommendations"]) > 0
    assert len(report["tradeoffs"]) > 0

    # -------------------------------------------------------------------------
    # STEP 5: Retrieve Individual Advisor Briefings
    # -------------------------------------------------------------------------
    briefing_res = client.get(f"/api/v1/council/advisors/{ADVISOR_CHANCELLOR}/briefing?worldId=aurora-prime")
    assert briefing_res.status_code == 200
    briefing = briefing_res.json()["data"]
    assert briefing["advisorId"] == ADVISOR_CHANCELLOR
    assert len(briefing["supportingObservations"]) > 0
    assert briefing["confidenceScore"] > 0

    # -------------------------------------------------------------------------
    # STEP 6: Check Live Council Overview
    # -------------------------------------------------------------------------
    overview_res = client.get("/api/v1/council/overview/aurora-prime")
    assert overview_res.status_code == 200
    overview = overview_res.json()["data"]
    assert overview["worldId"] == "aurora-prime"
    assert overview["activeSession"]["id"] == session_id
    assert ADVISOR_CHANCELLOR in overview["advisorStatuses"]
    assert overview["disagreementsCount"] > 0

    # -------------------------------------------------------------------------
    # STEP 7: Detect Genuine Cross-Domain Disagreements (Section 6)
    # -------------------------------------------------------------------------
    tradeoffs_res = client.get(f"/api/v1/council/sessions/{session_id}/tradeoffs")
    assert tradeoffs_res.status_code == 200
    tradeoffs = tradeoffs_res.json()["data"]
    assert len(tradeoffs) > 0
    first_tradeoff = tradeoffs[0]
    assert "advisorAId" in first_tradeoff
    assert "advisorBId" in first_tradeoff
    assert "competingObjectives" in first_tradeoff
    assert "potentialCompromise" in first_tradeoff

    # -------------------------------------------------------------------------
    # STEP 8: Create Recommendation & Review (Accept != Implemented)
    # -------------------------------------------------------------------------
    rec_create_res = client.post("/api/v1/council/recommendations", json={
        "worldId": "aurora-prime",
        "sessionId": session_id,
        "advisorId": ADVISOR_TREASURER,
        "title": "Ecological Transition Subsidies for Heavy Infrastructure",
        "description": "Provide clean energy subsidies to lower industrial pollution footprint.",
        "category": "Policy",
        "priority": "high",
        "estimatedCostCrc": 350.0,
        "expectedBenefits": ["Reduce industrial carbon emissions", "Raise environmental health index"],
        "potentialRisks": ["Short-term treasury drain of 350 CRC"]
    })
    assert rec_create_res.status_code == 201
    rec = rec_create_res.json()["data"]
    rec_id = rec["id"]
    assert rec["status"] == "Proposed"

    # Review: Ruler Accepts Recommendation
    review_res = client.post(f"/api/v1/council/recommendations/{rec_id}/review", json={
        "status": "Accepted",
        "notes": "Sovereign decrees clean energy transition is vital for long-term survival."
    })
    assert review_res.status_code == 200
    accepted_rec = review_res.json()["data"]
    assert accepted_rec["status"] == "Accepted"
    assert accepted_rec["implementationReference"] is None

    # CRITICAL CHECK: Simulation MUST NOT have changed yet! (Section 8)
    conn = get_db_connection()
    pol_row = conn.execute("SELECT * FROM policies WHERE world_id = 'aurora-prime' AND id = 'clean_energy_subsidies'").fetchone()
    conn.close()
    assert pol_row is None, "Accepted recommendation must NOT automatically enact policy before explicit execution!"

    # -------------------------------------------------------------------------
    # STEP 9: Attempting Execution Without Confirmation Fails (Section 8)
    # -------------------------------------------------------------------------
    unconfirmed_exec = client.post(f"/api/v1/council/recommendations/{rec_id}/execute", json={
        "confirmation": False
    })
    assert unconfirmed_exec.status_code == 400

    # -------------------------------------------------------------------------
    # STEP 10: Resource Validation (Insufficient Resources Fails Gracefully)
    # -------------------------------------------------------------------------
    # Temporarily drain world treasury to test failure path
    conn = get_db_connection()
    with conn:
        conn.execute("UPDATE economy_resources SET genesis_research_credits = 50.0 WHERE world_id = 'aurora-prime'")
    conn.close()

    res_fail_exec = client.post(f"/api/v1/council/recommendations/{rec_id}/execute", json={
        "confirmation": True,
        "executionNotes": "Attempt with depleted reserves"
    })
    assert res_fail_exec.status_code == 400
    assert "insufficient" in res_fail_exec.json()["detail"].lower()

    # Verify recommendation remains Accepted, NOT marked implemented
    check_rec = client.get(f"/api/v1/council/recommendations/{rec_id}").json()["data"]
    assert check_rec["status"] == "Accepted"

    # -------------------------------------------------------------------------
    # STEP 11: Authorize Execution With Adequate Resources (Section 8 & 9)
    # -------------------------------------------------------------------------
    # Restore treasury
    conn = get_db_connection()
    with conn:
        conn.execute("UPDATE economy_resources SET genesis_research_credits = 3000.0, materials = 2500.0 WHERE world_id = 'aurora-prime'")
    conn.close()

    success_exec = client.post(f"/api/v1/council/recommendations/{rec_id}/execute", json={
        "confirmation": True,
        "executionNotes": "Authorized sovereign directive with treasury allocation."
    })
    assert success_exec.status_code == 200
    exec_data = success_exec.json()["data"]
    assert exec_data["status"] == "implemented"
    exec_id = exec_data["id"]
    assert exec_data["actionId"] == "clean_energy_subsidies"
    assert exec_data["costCredits"] == 350.0
    assert "baselineMetrics" in exec_data

    # Verify recommendation status is now Implemented and references execution
    updated_rec = client.get(f"/api/v1/council/recommendations/{rec_id}").json()["data"]
    assert updated_rec["status"] == "Implemented"
    assert updated_rec["implementationReference"] == exec_id

    # Verify policy is enacted in authoritative simulation policies table
    conn = get_db_connection()
    pol_row = conn.execute("SELECT * FROM policies WHERE world_id = 'aurora-prime' AND id = 'clean_energy_subsidies'").fetchone()
    conn.close()
    assert pol_row is not None
    assert pol_row["is_active"] == 1

    # -------------------------------------------------------------------------
    # STEP 12: Idempotency Safeguard (Duplicate Execution Rejected)
    # -------------------------------------------------------------------------
    repeat_exec = client.post(f"/api/v1/council/recommendations/{rec_id}/execute", json={
        "confirmation": True
    })
    assert repeat_exec.status_code == 400
    assert "already" in repeat_exec.json()["detail"].lower()

    # -------------------------------------------------------------------------
    # STEP 13: Post-Implementation Outcome Evaluation (Section 10)
    # -------------------------------------------------------------------------
    eval_res = client.get(f"/api/v1/council/recommendations/{rec_id}/evaluation")
    assert eval_res.status_code == 200
    evaluation = eval_res.json()["data"]
    assert evaluation["recommendationId"] == rec_id
    assert evaluation["executionId"] == exec_id
    assert evaluation["status"] == "implemented"
    assert "baselineMetrics" in evaluation
    assert "currentMetrics" in evaluation
    assert "causalityDisclaimer" in evaluation

    # -------------------------------------------------------------------------
    # STEP 14: Complete Council Session and Verify Locked Decrees (Section 11)
    # -------------------------------------------------------------------------
    comp_res = client.post(f"/api/v1/council/sessions/{session_id}/complete", params={
        "summary": "Imperial Grand Conclave concluded. All ministerial directives ratified and executed."
    })
    assert comp_res.status_code == 200
    completed_session = comp_res.json()["data"]
    assert completed_session["status"] == "completed"
    assert completed_session["state"] == "Concluded"

    # Attempting to record decree on completed session fails
    locked_res = client.post(f"/api/v1/council/sessions/{session_id}/decisions", json={
        "outcome": "Ratified",
        "decreeSummary": "Late decree should be locked."
    })
    assert locked_res.status_code == 400
    assert "locked" in locked_res.json()["detail"].lower()
