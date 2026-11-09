import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_civilization_technology_tree():
    """Verify that GET /technology returns all Civ VI paradigms with full metadata."""
    res = client.get("/api/v1/worlds/aurora-prime/technology")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 13

    # Check for specific Civ tech cards from the UI
    tech_map = {t["id"]: t for t in data}
    assert "tech-masonry" in tech_map
    assert "tech-celestial" in tech_map
    assert "tech-bronze" in tech_map
    assert "tech-wheel" in tech_map
    assert "tech-quantum" in tech_map
    assert "tech-synthetic" in tech_map

    # Check metadata fields
    celestial = tech_map["tech-celestial"]
    assert celestial["name"] == "Celestial Navigation"
    assert celestial["era"] == "Foundational"
    assert celestial["icon"] == "⛵"
    assert celestial["cost_points"] == 320
    assert "Harbors" in celestial["unlocked_effects"][0] or "Harbors" in str(celestial["unlocked_effects"])


def test_technology_overview():
    """Verify that GET /technology/overview provides research rate, turns, and active focus."""
    res = client.get("/api/v1/worlds/aurora-prime/technology/overview")
    assert res.status_code == 200
    overview = res.json()

    assert overview["world_id"] == "aurora-prime"
    assert overview["science_per_turn"] >= 30.0
    assert overview["total_technologies"] >= 13
    assert "current_era" in overview
    assert overview["unlocked_count"] >= 1


def test_start_technology_research_validation():
    """Verify switching active research and prerequisite validation."""
    # 1. Research an unlocked tech should fail with 400
    res_unlocked = client.post(
        "/api/v1/worlds/aurora-prime/technology/research",
        json={"technology_id": "tech-masonry"}
    )
    assert res_unlocked.status_code == 400

    # 2. Research a tech with unfulfilled prerequisites should fail with 400
    res_prereq_fail = client.post(
        "/api/v1/worlds/aurora-prime/technology/research",
        json={"technology_id": "tech-steam"}  # Requires engineering, which requires construction, etc.
    )
    assert res_prereq_fail.status_code == 400
    assert "prerequisites" in res_prereq_fail.json()["detail"].lower()

    # 3. Research a valid tech with no unmet prerequisites (e.g. Celestial Navigation)
    res_valid = client.post(
        "/api/v1/worlds/aurora-prime/technology/research",
        json={"technology_id": "tech-celestial"}
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["is_researching"] is True


def test_queue_research_alias_compatibility():
    """Verify frontend civilizationApi.queueResearch endpoint compatibility."""
    res = client.post("/api/v1/worlds/aurora-prime/technologies/tech-celestial/unlock")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert json_data["techId"] == "tech-celestial"
    assert json_data["status"] == "researching"


def test_eureka_breakthrough_boost():
    """Verify 50% Eureka discount mechanism and event creation."""
    res = client.post("/api/v1/worlds/aurora-prime/technology/tech-celestial/eureka")
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert data["technology"]["is_boosted"] is True
    assert data["discount_applied"] > 0
    assert "Eureka breakthrough" in data["message"]


def test_simulate_research_tick():
    """Verify tick-based science accumulation advances research progress."""
    # Start celestial
    client.post(
        "/api/v1/worlds/aurora-prime/technology/research",
        json={"technology_id": "tech-celestial"}
    )

    tick_res = client.post(
        "/api/v1/worlds/aurora-prime/technology/tick",
        params={"science_boost": 50.0}
    )
    assert tick_res.status_code == 200
    data = tick_res.json()
    assert data["status"] in ["progressing", "completed"]
    assert data["progress_added"] == 50.0
    assert data["technology"]["research_progress"] >= 50.0


def test_complete_technology_instantly():
    """Verify instant completion unlocks tech and applies breakthrough."""
    res = client.post("/api/v1/worlds/aurora-prime/technology/tech-bronze/complete")
    assert res.status_code == 200
    tech = res.json()
    assert tech["is_unlocked"] is True
    assert tech["is_researching"] is False

