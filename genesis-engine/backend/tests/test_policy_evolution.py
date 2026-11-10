import pytest
from fastapi.testclient import TestClient
import main
from ml.policy_learning_model import get_policy_evolution_learner

client = TestClient(main.app)


def test_policy_evolution_learner_initialization():
    learner = get_policy_evolution_learner()
    status = learner.get_learning_status()
    assert status["model_type"] == "Evolutionary Behavioral Adaptation Network (E-BAN)"
    assert status["total_learned_instances"] >= 18
    assert status["model_confidence"] >= 0.85
    assert "loss_aversion_factor" in status
    assert "fairness_sensitivity" in status


def test_policy_deliberation_research_policy():
    learner = get_policy_evolution_learner()
    policy = {
        "id": "quantum_cognitive_expansion",
        "name": "Quantum Cognitive Expansion",
        "category": "Research",
        "description": "Allocates state supercomputing grids to accelerate fundamental scientific exploration.",
        "costPoliticalCapital": 220,
        "sliderValue": 75,
        "parameters": {"intensity": 0.75}
    }
    society_state = {
        "population": 60000,
        "gdp": 1500000.0,
        "gini_coefficient": 0.35,
        "happiness": 76.0,
        "civic_stability": 78.0,
        "pollution": 0.12
    }

    result = learner.deliberate_and_predict(policy, society_state)

    assert result["policy_name"] == "Quantum Cognitive Expansion"
    assert "population_reaction" in result
    reaction = result["population_reaction"]
    assert 0 <= reaction["overall_approval_pct"] <= 100
    assert len(reaction["cohort_breakdown"]) == 4

    # Scholars cohort should strongly support research
    scholars = next(c for c in reaction["cohort_breakdown"] if "Scholars" in c["cohort"])
    assert scholars["approval_pct"] > 60

    # Council deliberation with 6 Royal Advisors
    council = result["council_deliberation"]
    assert len(council["advisors"]) == 6
    advisor_names = [a["name"] for a in council["advisors"]]
    assert "Aurelius Vane" in advisor_names
    assert "Lady Vivienne Moray" in advisor_names
    assert "Arch-Librarian Cynthia Sol" in advisor_names
    assert "Master Mason Titus Varr" in advisor_names
    assert "Curate Elena Sylvan" in advisor_names
    assert "Ranger General Kaelen Thorne" in advisor_names

    # Check longitudinal assimilation trajectory
    assert "longitudinal_trajectory" in reaction
    assert len(reaction["longitudinal_trajectory"]["assimilation_curve"]) == 3
    assert "breakthrough" in reaction["longitudinal_trajectory"]

    # Check citizen quotes exist
    assert len(reaction["citizen_quotes"]) >= 2


def test_api_policy_endpoints():
    # 1. Learning Status
    resp = client.get("/api/v1/policies/learning-status")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_learned_instances" in data
    assert "model_confidence" in data

    # 2. Deliberate Endpoint
    payload = {
        "policy": {
            "id": "universal_ai",
            "name": "Universal AI Assistance",
            "category": "Cognitive",
            "description": "Deploys unrestricted AI copilots across all sectors.",
            "costPoliticalCapital": 150,
            "sliderValue": 80
        }
    }
    delib_resp = client.post("/api/v1/policies/deliberate", json=payload)
    assert delib_resp.status_code == 200
    delib_data = delib_resp.json()
    assert "population_reaction" in delib_data
    assert "council_deliberation" in delib_data

    # 3. Create Custom Policy
    custom_payload = {
        "name": "Citizens Innovation Dividend",
        "category": "Research",
        "description": "Direct grants to open-source citizen science labs.",
        "costPoliticalCapital": 180,
        "sliderLabel": "Grant Allocation",
        "sliderValue": 65,
        "minVal": 10,
        "maxVal": 100,
        "unit": "M GRC"
    }
    custom_resp = client.post("/api/v1/policies/custom", json=custom_payload)
    assert custom_resp.status_code == 200
    custom_data = custom_resp.json()
    assert custom_data["name"] == "Citizens Innovation Dividend"
    assert custom_data["is_custom"] is True

    # 4. Record Feedback (Self-Learning Step)
    feedback_payload = {
        "policy_name": "Citizens Innovation Dividend",
        "category": "Research",
        "predicted_approval": 72.0,
        "actual_approval": 78.5
    }
    feedback_resp = client.post("/api/v1/policies/record-feedback", json=feedback_payload)
    assert feedback_resp.status_code == 200
    learn_data = feedback_resp.json()
    assert learn_data["status"] == "learned"
    assert "updated_learning_status" in learn_data

    # 5. Model Accuracy & Benchmark Verification Endpoint
    acc_resp = client.get("/api/v1/policies/model-accuracy")
    assert acc_resp.status_code == 200
    acc_data = acc_resp.json()
    assert acc_data["status"] == "verified_top_notch"
    assert acc_data["evaluation_metrics"]["verified_accuracy_pct"] >= 90.0
    assert acc_data["evaluation_metrics"]["mean_absolute_error_mae"] <= 3.0
    assert len(acc_data["fold_cross_validation_results"]) == 5

