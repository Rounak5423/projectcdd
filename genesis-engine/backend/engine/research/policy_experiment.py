"""
Policy Experimentation Engine Data Structures & Persistence.
Manages experiment definitions, parameter configurations, scenarios, and metadata.
"""

import os
import json
import time
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

EXPERIMENTS_DATA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "data", "research_experiments")
)
os.makedirs(EXPERIMENTS_DATA_DIR, exist_ok=True)


class PolicyInterventionParams(BaseModel):
    tax_rate: float = Field(default=0.15, ge=0.05, le=0.45, description="Effective income tax rate")
    healthcare_budget_pct: float = Field(default=0.20, ge=0.05, le=0.50, description="Share allocated to public health")
    education_budget_pct: float = Field(default=0.20, ge=0.05, le=0.50, description="Share allocated to schools & research")
    infrastructure_investment_pct: float = Field(default=0.15, ge=0.05, le=0.45, description="Share for roads, water, utilities")
    universal_basic_income: bool = Field(default=False, description="Whether unconditional citizen dividend is active")
    cognitive_scaffolding: bool = Field(default=False, description="Public AI decision assistance & cognitive tools")
    green_energy_subsidy: bool = Field(default=False, description="Ecological transition grant")
    tech_research_subsidy: bool = Field(default=False, description="Science & autonomous lab grant")
    custom_slider_value: float = Field(default=50.0, ge=0.0, le=100.0, description="General policy intensity slider")


class CivilisationStateVector(BaseModel):
    year: int
    population: float
    gdp: float
    treasury: float
    gini_index: float
    wellbeing: float
    health_index: float
    education_index: float
    infrastructure_capacity: float
    pollution_level: float
    stability: float
    citizen_approval: float
    unemployment_rate: float
    uncertainty_p10: Optional[Dict[str, float]] = None
    uncertainty_p90: Optional[Dict[str, float]] = None


class ExperimentScenarioConfig(BaseModel):
    scenario_id: str
    name: str
    description: str
    intervention: PolicyInterventionParams
    shock_params: Optional[Dict[str, Any]] = None


class PolicyExperimentConfig(BaseModel):
    experiment_id: str
    title: str
    policy_category: str
    policy_name: str
    research_question: str
    hypothesis: str
    starting_year: int = 2026
    simulation_duration: int = 10
    initial_state: CivilisationStateVector
    scenarios: List[ExperimentScenarioConfig]
    model_version: str = "v2.0.0-calibrated"
    random_seed: int = 42
    created_at: float = Field(default_factory=time.time)
    status: str = "configured"  # configured, running, completed, failed


def get_default_initial_state(starting_year: int = 2026) -> CivilisationStateVector:
    """Provides a realistic baseline starting state for the civilization."""
    return CivilisationStateVector(
        year=starting_year,
        population=150000.0,
        gdp=4500000.0,
        treasury=850000.0,
        gini_index=0.365,
        wellbeing=0.74,
        health_index=0.82,
        education_index=0.71,
        infrastructure_capacity=0.78,
        pollution_level=0.28,
        stability=0.85,
        citizen_approval=68.5,
        unemployment_rate=0.054,
        uncertainty_p10={},
        uncertainty_p90={}
    )


def create_standard_scenarios(
    policy_category: str,
    policy_name: str,
    primary_intervention: PolicyInterventionParams
) -> List[ExperimentScenarioConfig]:
    """
    Constructs a controlled scientific scenario suite:
    1. Baseline (Status Quo)
    2. Scenario A (Primary Policy Intervention)
    3. Scenario B (Alternative Moderate Policy)
    4. Scenario C (Comprehensive / Combined Policy)
    5. Stress Scenario (Adverse Ecological & Macro Shock under Policy A)
    """
    # 1. Baseline: Conservative default parameters
    baseline_params = PolicyInterventionParams(
        tax_rate=0.15,
        healthcare_budget_pct=0.18,
        education_budget_pct=0.18,
        infrastructure_investment_pct=0.15,
        universal_basic_income=False,
        cognitive_scaffolding=False,
        green_energy_subsidy=False,
        tech_research_subsidy=False,
        custom_slider_value=30.0
    )

    # 2. Scenario A: Direct enactment of primary user policy
    scenario_a_params = primary_intervention

    # 3. Scenario B: Alternative targeted policy (e.g. higher tax + higher social transfers)
    scenario_b_params = PolicyInterventionParams(
        tax_rate=min(0.35, primary_intervention.tax_rate + 0.08),
        healthcare_budget_pct=min(0.40, primary_intervention.healthcare_budget_pct + 0.05),
        education_budget_pct=min(0.40, primary_intervention.education_budget_pct + 0.05),
        infrastructure_investment_pct=primary_intervention.infrastructure_investment_pct,
        universal_basic_income=True,
        cognitive_scaffolding=False,
        green_energy_subsidy=primary_intervention.green_energy_subsidy,
        tech_research_subsidy=False,
        custom_slider_value=min(100.0, primary_intervention.custom_slider_value + 15.0)
    )

    # 4. Scenario C: Synergistic Combined Policy (Technological + Ecological + Fiscal balance)
    scenario_c_params = PolicyInterventionParams(
        tax_rate=round((primary_intervention.tax_rate + 0.20) / 2.0, 3),
        healthcare_budget_pct=max(0.25, primary_intervention.healthcare_budget_pct),
        education_budget_pct=max(0.28, primary_intervention.education_budget_pct),
        infrastructure_investment_pct=0.22,
        universal_basic_income=True,
        cognitive_scaffolding=True,
        green_energy_subsidy=True,
        tech_research_subsidy=True,
        custom_slider_value=85.0
    )

    # 5. Stress Scenario: Same as Scenario A, but with severe exogenous shock
    stress_shock = {
        "climate_severity": 1.45,
        "energy_cost_shock": 1.30,
        "epidemic_threat_index": 0.35,
        "descr": "Severe Drought, Grid Strain & Global Commodity Supply Shock"
    }

    return [
        ExperimentScenarioConfig(
            scenario_id="baseline",
            name="Baseline (Status Quo)",
            description="Status-quo trajectory with standard historical growth and no structural reforms.",
            intervention=baseline_params
        ),
        ExperimentScenarioConfig(
            scenario_id="scenario_a",
            name=f"Scenario A: {policy_name}",
            description=f"Primary policy intervention enacted under category '{policy_category}'.",
            intervention=scenario_a_params
        ),
        ExperimentScenarioConfig(
            scenario_id="scenario_b",
            name="Scenario B: Progressive Welfare Rebalance",
            description="Alternative progressive policy combining redistributive fiscal reform and expanded healthcare.",
            intervention=scenario_b_params
        ),
        ExperimentScenarioConfig(
            scenario_id="scenario_c",
            name="Scenario C: Full Technological & Ecological Synergy",
            description="Comprehensive combined reform with cognitive tools, green energy subsidies, and advanced infrastructure.",
            intervention=scenario_c_params
        ),
        ExperimentScenarioConfig(
            scenario_id="stress_shock",
            name=f"Stress Test: {policy_name} + Climate & Supply Shock",
            description="Resilience test simulating adverse exogenous environmental disruption under primary policy.",
            intervention=scenario_a_params,
            shock_params=stress_shock
        )
    ]


def save_experiment_record(record: Dict[str, Any]) -> str:
    exp_id = record["config"]["experiment_id"]
    filepath = os.path.join(EXPERIMENTS_DATA_DIR, f"{exp_id}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)
    return filepath


def load_experiment_record(experiment_id: str) -> Optional[Dict[str, Any]]:
    filepath = os.path.join(EXPERIMENTS_DATA_DIR, f"{experiment_id}.json")
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return None
    return None


def list_experiment_records() -> List[Dict[str, Any]]:
    results = []
    if not os.path.exists(EXPERIMENTS_DATA_DIR):
        return results
    for fname in os.listdir(EXPERIMENTS_DATA_DIR):
        if fname.endswith(".json"):
            try:
                with open(os.path.join(EXPERIMENTS_DATA_DIR, fname), "r", encoding="utf-8") as f:
                    data = json.load(f)
                    cfg = data.get("config", {})
                    results.append({
                        "experiment_id": cfg.get("experiment_id", fname.replace(".json", "")),
                        "title": cfg.get("title", "Untitled Experiment"),
                        "policy_name": cfg.get("policy_name", "Unknown"),
                        "policy_category": cfg.get("policy_category", "General"),
                        "starting_year": cfg.get("starting_year", 2026),
                        "simulation_duration": cfg.get("simulation_duration", 10),
                        "status": cfg.get("status", "unknown"),
                        "created_at": cfg.get("created_at", 0),
                        "has_paper": "paper" in data
                    })
            except Exception:
                continue
    # Sort descending by creation time
    results.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    return results

