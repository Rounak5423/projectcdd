import json
import time as time_mod
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from db.database import get_db_connection
from engine.models_v1 import PolicyDefinition, PolicyApplyRequest
from cache import data_cache

router = APIRouter(tags=["Policies"])

CATALOG_POLICIES = [
    {
        "id": "universal_ai",
        "name": "Universal AI Assistance",
        "category": "Cognitive",
        "description": "Deploys unrestricted AI copilots across all industry and academic sectors.",
        "implementation_cost": 150.0,
        "parameters": {"ai_access_coverage": 0.90},
        "effects": {"efficiency_boost": 0.12, "atrophy_risk": 0.015}
    },
    {
        "id": "cognitive_scaffolding",
        "name": "Cognitive Scaffolding Mandate",
        "category": "Cognitive",
        "description": "Requires Socratic and inquiry-based scaffolding in automated tools to prevent critical atrophy.",
        "implementation_cost": 200.0,
        "parameters": {"scaffolding_friction": 0.75},
        "effects": {"atrophy_mitigation": 0.80, "reasoning_growth": 0.004}
    },
    {
        "id": "universal_basic_income",
        "name": "Universal Basic Dividend (UBI)",
        "category": "Social",
        "description": "Distributes periodic unconditional dividend to compress Gini disparity and raise civic stability.",
        "implementation_cost": 500.0,
        "parameters": {"ubi_amount": 4.0},
        "effects": {"gini_reduction": 0.05, "civic_stability_boost": 0.08}
    },
    {
        "id": "clean_energy_subsidies",
        "name": "Ecological Transition Subsidies",
        "category": "Environment",
        "description": "Grants state subsidies for renewable and geothermal infrastructure to curb emissions.",
        "implementation_cost": 350.0,
        "parameters": {"subsidy_rate": 0.25},
        "effects": {"environmental_health_boost": 0.07, "pollution_reduction": 0.12}
    },
    {
        "id": "free_education",
        "name": "Public Foundational Academy",
        "category": "Education",
        "description": "State-funded critical thinking, logic, and cognitive training across all demographics.",
        "implementation_cost": 300.0,
        "parameters": {"education_boost": 0.80},
        "effects": {"education_index_boost": 0.09, "reasoning_floor_raise": 0.15}
    },
    {
        "id": "automation_tax",
        "name": "Algorithmic Dividend Levy",
        "category": "Economy",
        "description": "Imposes a 20% automation tax on high algorithmic capital gains to fund civic infrastructure.",
        "implementation_cost": 250.0,
        "parameters": {"tax_rate": 0.20},
        "effects": {"treasury_boost": 0.15, "gini_compression": 0.03}
    }
]


@router.get("/policies", response_model=List[PolicyDefinition])
async def get_available_policies():
    cached = data_cache.get("catalog_policies")
    if cached is not None:
        return cached

    result = [
        PolicyDefinition(
            id=p["id"],
            name=p["name"],
            category=p["category"],
            description=p["description"],
            implementation_cost=p["implementation_cost"],
            parameters=p["parameters"],
            effects=p["effects"],
            is_active=False
        )
        for p in CATALOG_POLICIES
    ]
    data_cache.set("catalog_policies", result, ttl=3600.0)
    return result


@router.get("/worlds/{id}/policies", response_model=List[PolicyDefinition])
async def get_active_world_policies(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM policies WHERE world_id = ? AND is_active = 1", (id,)).fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(PolicyDefinition(
            id=r["id"],
            name=r["name"],
            category=r["category"],
            description="",
            implementation_cost=r["implementation_cost"],
            parameters=json.loads(r["parameters"] or "{}"),
            effects=json.loads(r["effects"] or "{}"),
            is_active=bool(r["is_active"])
        ))
    return result


@router.post("/worlds/{id}/policies", response_model=PolicyDefinition)
async def apply_policy(id: str, req: PolicyApplyRequest):
    # Find policy template
    template = next((p for p in CATALOG_POLICIES if p["id"] == req.policy_id), None)
    if not template:
        raise HTTPException(status_code=400, detail=f"Policy '{req.policy_id}' not found in policy catalog")

    params = template["parameters"].copy()
    if req.parameters:
        params.update(req.parameters)

    conn = get_db_connection()
    with conn:
        conn.execute("""
        INSERT INTO policies (id, world_id, name, category, is_active, implementation_cost, parameters, effects)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(world_id, id) DO UPDATE SET
            is_active = 1,
            parameters = excluded.parameters
        """, (
            req.policy_id, id, template["name"], template["category"],
            template["implementation_cost"], json.dumps(params), json.dumps(template["effects"])
        ))

        # Record event
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        SELECT 'evt_' || hex(randomblob(4)), id, year, day, 'Policy Enacted: ' || ?, 'policy', ?, datetime('now')
        FROM worlds WHERE id = ?
        """, (template["name"], f"The governance council enacted {template['name']}.", id))

    conn.close()

    return PolicyDefinition(
        id=template["id"],
        name=template["name"],
        category=template["category"],
        description=template["description"],
        implementation_cost=template["implementation_cost"],
        parameters=params,
        effects=template["effects"],
        is_active=True
    )


@router.delete("/worlds/{id}/policies/{policy_id}")
async def remove_policy(id: str, policy_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM policies WHERE world_id = ? AND id = ?", (id, policy_id)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Policy '{policy_id}' is not active on world '{id}'")

    with conn:
        conn.execute("UPDATE policies SET is_active = 0 WHERE world_id = ? AND id = ?", (id, policy_id))

        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        SELECT 'evt_' || hex(randomblob(4)), id, year, day, 'Policy Repealed: ' || ?, 'policy', ?, datetime('now')
        FROM worlds WHERE id = ?
        """, (row["name"], f"The governance council repealed {row['name']}.", id))

    conn.close()
    return {"status": "repealed", "world_id": id, "policy_id": policy_id}


@router.get("/worlds/{id}/policies/recommend")
async def get_policy_recommendations_for_world(id: str):
    """
    Level 5 AI Model: Sandboxed AI Policy Controller & Optimization Suite.
    Uses Surrogate-Guided Model Predictive Control (MPC) to evaluate candidate
    policy configurations and recommend optimal adjustments to maximize societal welfare.
    """
    from ml.control.controller import generate_policy_recommendation
    from db.database import get_db_connection

    conn = get_db_connection()
    row = conn.execute("""
    SELECT w.year, e.population, e.gdp, e.gini_coefficient, e.tax_rate,
           e.happiness, e.civic_stability, e.pollution
    FROM worlds w
    JOIN economy_resources e ON w.id = e.world_id
    WHERE w.id = ?
    """, (id,)).fetchone()
    conn.close()

    if not row:
        state = {
            "population": 50000,
            "gdp": 10000000.0,
            "gini_coefficient": 0.38,
            "civic_stability": 0.77,
            "happiness": 0.75,
            "pollution": 0.12,
            "treasury": 500000.0
        }
    else:
        state = {
            "population": row["population"],
            "gdp": row["gdp"],
            "gini_coefficient": row["gini_coefficient"],
            "civic_stability": row["civic_stability"] if "civic_stability" in row.keys() else 0.77,
            "happiness": row["happiness"] if "happiness" in row.keys() else 0.75,
            "pollution": row["pollution"] if "pollution" in row.keys() else 0.12,
            "treasury": row["gdp"]
        }

    rec = generate_policy_recommendation(id, state)
    rec["level"] = "Level 5: Meta / Strategic Policy Controller (Surrogate MPC)"
    return rec


# ==============================================================================
# PHASE 10: DELIBERATION, CUSTOM POLICIES & EVOLUTIONARY SELF-LEARNING MODEL
# ==============================================================================

@router.get("/policies/learning-status")
async def get_policy_learning_status():
    """
    Returns current status of the Human Evolutionary Behavioral Model,
    including online adaptation epochs, learned instances, and domain weights.
    """
    from ml.policy_learning_model import get_policy_evolution_learner
    learner = get_policy_evolution_learner()
    return learner.get_learning_status()


@router.get("/policies/model-accuracy")
async def get_policy_model_accuracy():
    """
    Returns verified empirical accuracy benchmarks, goodness-of-fit R2,
    mean absolute error (MAE), directional concordance, and 5-fold cross-validation proofs.
    """
    from ml.train_policy_evolution import get_verified_model_accuracy_report
    return get_verified_model_accuracy_report()


@router.post("/policies/train-benchmark")
async def retrain_and_verify_model_accuracy():
    """
    Triggers a live cross-validation re-training cycle against empirical benchmark datasets
    to verify and refine model prediction accuracy.
    """
    from ml.train_policy_evolution import train_and_verify_accuracy
    return train_and_verify_accuracy()


@router.post("/policies/deliberate")
async def deliberate_policy(req: Dict[str, Any]):
    """
    Submits a policy (standard catalog or custom user edict) to the Deliberative Council
    and the Human Evolutionary Behavioral Model. Evaluates cohort approval, happiness/stability
    deltas, protest risk, and generates advisor debate arguments.
    """
    from ml.policy_learning_model import get_policy_evolution_learner
    learner = get_policy_evolution_learner()

    policy = req.get("policy", req)
    world_id = req.get("world_id")
    society_state = req.get("society_state")

    if not society_state and world_id:
        try:
            conn = get_db_connection()
            row = conn.execute("""
            SELECT e.population, e.gdp, e.gini_coefficient, e.happiness, e.civic_stability, e.pollution
            FROM economy_resources e WHERE e.world_id = ?
            """, (world_id,)).fetchone()
            conn.close()
            if row:
                society_state = {
                    "population": row["population"],
                    "gdp": row["gdp"],
                    "gini_coefficient": row["gini_coefficient"],
                    "happiness": row["happiness"],
                    "civic_stability": row["civic_stability"],
                    "pollution": row["pollution"]
                }
        except Exception:
            pass

    if not society_state:
        society_state = {
            "population": 50000,
            "gdp": 1000000.0,
            "gini_coefficient": 0.38,
            "happiness": 75.0,
            "civic_stability": 77.0,
            "pollution": 0.15
        }

    result = learner.deliberate_and_predict(policy, society_state)
    return result


@router.post("/policies/custom")
async def create_custom_policy(req: Dict[str, Any]):
    """
    Allows the sovereign user to draft and register their own custom edict
    with unique parameters, budget impact, and domain targets.
    """
    name = req.get("name", "Custom Civic Accord")
    category = req.get("category", "Custom")
    description = req.get("description", "A custom municipal edict ordained by the Sovereign Governor.")
    cost = float(req.get("costPoliticalCapital", req.get("implementation_cost", 150.0)))
    slider_label = req.get("sliderLabel", "Edict Enforcement Level")
    slider_value = float(req.get("sliderValue", 50.0))
    min_val = float(req.get("minVal", 0.0))
    max_val = float(req.get("maxVal", 100.0))
    unit = req.get("unit", "%")

    policy_id = req.get("id") or f"custom_{int(time_mod.time()*1000)}"

    # Generate or parse effects
    effects = req.get("effects", {
        "happiness_mod": round((slider_value - 40.0) * 0.1, 1),
        "stability_mod": round((50.0 - abs(slider_value - 50.0)) * 0.1, 1),
        "gdp_mod": round(slider_value * 0.08, 1)
    })

    new_policy = {
        "id": policy_id,
        "name": name,
        "category": category,
        "description": description,
        "implementation_cost": cost,
        "costPoliticalCapital": cost,
        "parameters": {"intensity": slider_value / 100.0},
        "effects": effects,
        "sliderLabel": slider_label,
        "sliderValue": slider_value,
        "minVal": min_val,
        "maxVal": max_val,
        "unit": unit,
        "is_custom": True,
        "is_active": False
    }

    # Register in catalog if not existing
    existing = next((p for p in CATALOG_POLICIES if p["id"] == policy_id), None)
    if not existing:
        CATALOG_POLICIES.append(new_policy)
        data_cache.invalidate("catalog_policies")

    return new_policy


@router.post("/policies/record-feedback")
async def record_policy_feedback(req: Dict[str, Any]):
    """
    Online Incremental Self-Learning Endpoint:
    Logs an enacted policy instance and trains the Evolutionary Behavioral Model
    to adapt future predictions based on real societal response.
    """
    from ml.policy_learning_model import get_policy_evolution_learner
    learner = get_policy_evolution_learner()
    result = learner.record_feedback_and_learn(req)
    return result


@router.post("/worlds/{id}/policies/{policy_id}/toggle")
async def toggle_world_policy(id: str, policy_id: str, req: Dict[str, Any]):
    """
    Direct toggle endpoint that activates or deactivates a policy on a world.
    """
    is_active = req.get("is_active", True)
    params = req.get("parameters", {})

    conn = get_db_connection()
    with conn:
        conn.execute("""
        INSERT INTO policies (id, world_id, name, category, is_active, implementation_cost, parameters, effects)
        VALUES (?, ?, ?, 'General', ?, 150.0, ?, '{}')
        ON CONFLICT(world_id, id) DO UPDATE SET
            is_active = ?,
            parameters = ?
        """, (
            policy_id, id, policy_id.replace("_", " ").title(),
            1 if is_active else 0, json.dumps(params),
            1 if is_active else 0, json.dumps(params)
        ))

        action_label = "Enacted" if is_active else "Repealed"
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        SELECT 'evt_' || hex(randomblob(4)), id, year, day, 'Policy ' || ?, 'policy', ?, datetime('now')
        FROM worlds WHERE id = ?
        """, (action_label, f"Council directive: {policy_id} {action_label.lower()}.", id))

    conn.close()
    return {"status": "ok", "world_id": id, "policy_id": policy_id, "is_active": is_active}


