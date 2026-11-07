"""
CIVORA — Council of Advisors Phase 3 Intelligence Automated Tests
Verifies domain analytical logic, risk assessment, evidence-based recommendations,
cross-domain trade-offs, and simulation state immutability.
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
)
from app.features.council.intelligence.context import build_civilisation_context
from app.features.council.intelligence.orchestrator import CouncilOrchestrator
from app.features.council.intelligence.advisors import (
    ChancellorAdvisor,
    TreasurerAdvisor,
    GrandScholarAdvisor,
    RoyalArchitectAdvisor,
    HighPhysicianAdvisor,
    KeeperOfNatureAdvisor,
)
from app.features.council.intelligence.strategies.tradeoff_analysis import detect_cross_domain_tradeoffs

client = TestClient(app)


@pytest.fixture(autouse=True, scope="session")
def setup_test_db(tmp_path_factory):
    """Sets up an isolated SQLite test database with seed data."""
    test_db = str(tmp_path_factory.mktemp("intel_db") / "test_genesis.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


# ---------------------------------------------------------------------------
# Test 1 & 2: Context Construction & Domain Isolation
# ---------------------------------------------------------------------------

def test_civilisation_context_snapshot_construction():
    """Requirement 1: Shared read-only context correctly reflects simulation state."""
    ctx = build_civilisation_context("aurora-prime")
    assert ctx.world_id == "aurora-prime"
    assert ctx.world_name == "Aurora Prime"
    assert ctx.population == 1248532
    assert ctx.gdp == 48600000000.0
    assert ctx.civic_stability == 0.772
    assert ctx.gini_coefficient == 0.285
    assert ctx.grc_balance == 2500.0
    assert ctx.housing_capacity >= 1200000
    assert len(ctx.missing_indicators) >= 5
    assert "crime_statistics" in ctx.missing_indicators


def test_six_advisors_domain_isolation():
    """Requirement 2: Each advisor engine analyses its own domain indicators."""
    ctx = build_civilisation_context("aurora-prime")

    chancellor = ChancellorAdvisor()
    treasurer = TreasurerAdvisor()
    scholar = GrandScholarAdvisor()
    architect = RoyalArchitectAdvisor()
    physician = HighPhysicianAdvisor()
    keeper = KeeperOfNatureAdvisor()

    c_res = chancellor.analyse(ctx)
    t_res = treasurer.analyse(ctx)
    s_res = scholar.analyse(ctx)
    a_res = architect.analyse(ctx)
    p_res = physician.analyse(ctx)
    k_res = keeper.analyse(ctx)

    # Verify domain attribution
    assert c_res.domain == "Governance and Society"
    assert t_res.domain == "Economy and Finance"
    assert s_res.domain == "Science and Knowledge"
    assert a_res.domain == "Infrastructure and Development"
    assert p_res.domain == "Health and Wellbeing"
    assert k_res.domain == "Environment and Ecology"

    # Chancellor evaluates civic stability & Gini
    c_metrics = [m for f in c_res.findings for m in f.related_metrics]
    assert "civic_stability" in c_metrics or "gini_coefficient" in c_metrics

    # Treasurer evaluates GDP & liquid reserves
    t_metrics = [m for f in t_res.findings for m in f.related_metrics]
    assert "grc_balance" in t_metrics or "gdp" in t_metrics

    # Scholar evaluates macro innovation & research
    s_metrics = [m for f in s_res.findings for m in f.related_metrics]
    assert "macro_innovation_index" in s_metrics or "research_rate" in s_metrics

    # Architect evaluates housing capacity
    a_metrics = [m for f in a_res.findings for m in f.related_metrics]
    assert "housing_capacity" in a_metrics

    # Physician evaluates health & water
    p_metrics = [m for f in p_res.findings for m in f.related_metrics]
    assert "avg_health" in p_metrics or "water" in p_metrics

    # Keeper evaluates environment & pollution
    k_metrics = [m for f in k_res.findings for m in f.related_metrics]
    assert "environmental_health" in k_metrics or "pollution" in k_metrics


# ---------------------------------------------------------------------------
# Test 3 & 4: Evidence-Backed Findings & Honest Missing Metrics
# ---------------------------------------------------------------------------

def test_findings_contain_supporting_evidence_and_missing_data():
    """Requirements 3 & 4: Findings contain evidence; missing data reported honestly."""
    ctx = build_civilisation_context("aurora-prime")
    advisor = ChancellorAdvisor()
    res = advisor.analyse(ctx)

    assert len(res.findings) >= 2
    for f in res.findings:
        assert f.id.startswith("find-")
        assert len(f.supporting_evidence) >= 1
        ev = f.supporting_evidence[0]
        assert ev.metric_name != ""
        assert ev.observed_value is not None

    # Missing metrics must be listed honestly
    assert len(res.missing_metrics) >= 1
    assert "crime_statistics" in res.missing_metrics

    # Risks must flag missing data explicitly with probability = 'Unavailable'
    data_gap_risks = [r for r in res.risks if r.probability == "Unavailable"]
    assert len(data_gap_risks) >= 1


# ---------------------------------------------------------------------------
# Test 5 & 6: Traceable Recommendations & Confidence Calculation
# ---------------------------------------------------------------------------

def test_recommendation_traceability_and_confidence_scoring():
    """Requirements 5 & 6: Recommendations trace to findings; confidence is defensible."""
    ctx = build_civilisation_context("aurora-prime")
    advisor = GrandScholarAdvisor()
    res = advisor.analyse(ctx)

    # Confidence must fall in [0.50, 0.98]
    assert 0.50 <= res.confidence <= 0.98

    # Recommendations must contain reasons, actions, and trace to findings
    for rec in res.recommendations:
        assert rec.title != ""
        assert rec.reason != ""
        assert len(rec.expected_benefits) >= 1
        assert len(rec.potential_risks) >= 1
        assert len(rec.suggested_actions) >= 1
        assert len(rec.supporting_finding_ids) >= 1
        assert rec.estimated_cost_crc >= 0.0


# ---------------------------------------------------------------------------
# Test 7 & 8: Cross-Domain Trade-off & Disagreement Detection
# ---------------------------------------------------------------------------

def test_cross_domain_tradeoffs_and_advisor_disagreements():
    """Requirement 8: Advisors identify genuine cross-domain conflicts with evidence."""
    ctx = build_civilisation_context("aurora-prime")
    orchestrator = CouncilOrchestrator()
    reports = {a.advisor_id: a.analyse(ctx) for a in orchestrator.advisors}

    tradeoffs = detect_cross_domain_tradeoffs(ctx, reports)
    assert len(tradeoffs) >= 1

    # Check structure of conflict
    first_conflict = tradeoffs[0]
    assert first_conflict.conflict_title != ""
    assert first_conflict.primary_advisor_id != ""
    assert first_conflict.competing_advisor_id != ""
    assert first_conflict.primary_stance != ""
    assert first_conflict.competing_stance != ""
    assert first_conflict.compromise_recommendation != ""
    assert len(first_conflict.supporting_finding_ids) >= 1


# ---------------------------------------------------------------------------
# Test 9 & 10: Multi-Domain Deliberation Orchestration & Non-Duplication
# ---------------------------------------------------------------------------

def test_council_orchestrator_deliberation_and_deduplication():
    """
    Requirements 9, 12, 14, 15:
    - Full Council deliberation executes cleanly.
    - Recommendations persist into Council database.
    - Repeated analysis does not create duplicate recommendations.
    - Simulation state remains unchanged.
    """
    conn = db.database.get_db_connection()
    pre_econ = dict(conn.execute("SELECT * FROM economy_resources WHERE world_id = 'aurora-prime'").fetchone())
    conn.close()

    orchestrator = CouncilOrchestrator()

    # 1. First run with recommendation persistence
    report1 = orchestrator.run_council_deliberation(world_id="aurora-prime", persist_recommendations=True)
    assert report1.world_id == "aurora-prime"
    assert report1.overall_civilisation_status in ["Optimal", "Stable", "Attention Required", "Critical"]
    assert len(report1.advisor_reports) == 6
    assert report1.all_findings_count >= 6
    assert report1.all_recommendations_count >= 1
    assert len(report1.cross_domain_tradeoffs) >= 1

    # Count persisted recommendations
    conn = db.database.get_db_connection()
    rec_count_1 = conn.execute("SELECT COUNT(*) as c FROM council_recommendations WHERE world_id = 'aurora-prime'").fetchone()["c"]
    conn.close()
    assert rec_count_1 >= 1

    # 2. Second deliberation run: Must NOT create duplicate recommendations (Requirement 15)
    report2 = orchestrator.run_council_deliberation(world_id="aurora-prime", persist_recommendations=True)
    conn = db.database.get_db_connection()
    rec_count_2 = conn.execute("SELECT COUNT(*) as c FROM council_recommendations WHERE world_id = 'aurora-prime'").fetchone()["c"]
    conn.close()
    assert rec_count_2 == rec_count_1, "Repeated deliberation created duplicate recommendations!"

    # 3. Requirement 14: Simulation state MUST remain strictly unchanged
    conn = db.database.get_db_connection()
    post_econ = dict(conn.execute("SELECT * FROM economy_resources WHERE world_id = 'aurora-prime'").fetchone())
    conn.close()

    assert pre_econ["population"] == post_econ["population"]
    assert pre_econ["gdp"] == post_econ["gdp"]
    assert pre_econ["food"] == post_econ["food"]
    assert pre_econ["water"] == post_econ["water"]
    assert pre_econ["civic_stability"] == post_econ["civic_stability"]


# ---------------------------------------------------------------------------
# Test 11 & 12: REST Endpoints Integration
# ---------------------------------------------------------------------------

def test_intelligence_api_endpoints():
    """Verifies all Phase 3 REST endpoints via FastAPI."""
    # 1. POST /api/v1/council/intelligence/analyse/{world_id}
    res_analyse = client.post("/api/v1/council/intelligence/analyse/aurora-prime")
    assert res_analyse.status_code == 200
    report_data = res_analyse.json()["data"]
    assert report_data["worldId"] == "aurora-prime"
    assert len(report_data["advisor_reports"]) == 6
    assert len(report_data["cross_domain_tradeoffs"]) >= 1

    # 2. GET /api/v1/council/intelligence/latest/{world_id}
    res_latest = client.get("/api/v1/council/intelligence/latest/aurora-prime")
    assert res_latest.status_code == 200
    assert res_latest.json()["data"]["worldId"] == "aurora-prime"

    # 3. POST /api/v1/council/intelligence/analyse/{world_id}/advisor/{advisor_id}
    res_single = client.post(f"/api/v1/council/intelligence/analyse/aurora-prime/advisor/{ADVISOR_TREASURER}")
    assert res_single.status_code == 200
    adv_data = res_single.json()["data"]
    assert adv_data["advisorId"] == ADVISOR_TREASURER
    assert len(adv_data["findings"]) >= 1

    # 4. GET /api/v1/council/advisors/{advisor_id}/findings
    res_findings = client.get(f"/api/v1/council/advisors/{ADVISOR_SCHOLAR}/findings?worldId=aurora-prime")
    assert res_findings.status_code == 200
    assert len(res_findings.json()["data"]) >= 1

    # 5. GET /api/v1/council/advisors/{advisor_id}/briefing (Live Intelligence Generated)
    res_briefing = client.get(f"/api/v1/council/advisors/{ADVISOR_CHANCELLOR}/briefing?worldId=aurora-prime")
    assert res_briefing.status_code == 200
    briefing = res_briefing.json()["data"]
    assert briefing["advisorId"] == ADVISOR_CHANCELLOR
    assert "Sovereign" in briefing["formalSpeech"]
    assert len(briefing["supportingObservations"]) >= 1
