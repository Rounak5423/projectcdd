"""
Authoritative Budget, Taxation, and Municipal Bonds Endpoints
Sprint 2: Honest Economy.
"""

from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from db.database import get_db_connection
from auth.security import get_current_user_optional

router = APIRouter(tags=["Budget & Economy"])


def _resolve_world_id(world_id: str) -> str:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return world_id


class BudgetUpdateRequest(BaseModel):
    residential_tax: Optional[float] = Field(None, ge=0.0, le=0.50)
    commercial_tax: Optional[float] = Field(None, ge=0.0, le=0.50)
    industrial_tax: Optional[float] = Field(None, ge=0.0, le=0.50)
    office_tax: Optional[float] = Field(None, ge=0.0, le=0.50)
    road_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)
    power_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)
    water_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)
    health_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)
    education_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)
    police_budget_pct: Optional[float] = Field(None, ge=20.0, le=200.0)


class BondActionRequest(BaseModel):
    amount: float = Field(..., gt=0.0)


@router.get("/worlds/{id}/budget")
def get_world_budget(id: str):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    if not econ:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' economy not found")

    # Count jobs and labor
    cit_row = conn.execute("SELECT COUNT(*) as pop FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()
    pop = cit_row["pop"] if cit_row and cit_row["pop"] else econ["population"]

    # Tax rates
    res_tax = econ["residential_tax"] if "residential_tax" in econ.keys() and econ["residential_tax"] is not None else 0.14
    com_tax = econ["commercial_tax"] if "commercial_tax" in econ.keys() and econ["commercial_tax"] is not None else 0.12
    ind_tax = econ["industrial_tax"] if "industrial_tax" in econ.keys() and econ["industrial_tax"] is not None else 0.15
    off_tax = econ["office_tax"] if "office_tax" in econ.keys() and econ["office_tax"] is not None else 0.13

    # Computed daily tax revenues
    res_rev = round(pop * 20.0 * (res_tax / 0.14), 2)
    com_rev = round(pop * 12.0 * (com_tax / 0.12), 2)
    ind_rev = round(pop * 10.0 * (ind_tax / 0.15), 2)
    off_rev = round(pop * 8.0 * (off_tax / 0.13), 2)
    total_tax_revenue = round(res_rev + com_rev + ind_rev + off_rev, 2)

    # Budgets
    road_f = econ["road_budget_pct"] if "road_budget_pct" in econ.keys() and econ["road_budget_pct"] is not None else 100.0
    power_f = econ["power_budget_pct"] if "power_budget_pct" in econ.keys() and econ["power_budget_pct"] is not None else 100.0
    water_f = econ["water_budget_pct"] if "water_budget_pct" in econ.keys() and econ["water_budget_pct"] is not None else 100.0
    health_f = econ["health_budget_pct"] if "health_budget_pct" in econ.keys() and econ["health_budget_pct"] is not None else 100.0
    edu_f = econ["education_budget_pct"] if "education_budget_pct" in econ.keys() and econ["education_budget_pct"] is not None else 100.0
    police_f = econ["police_budget_pct"] if "police_budget_pct" in econ.keys() and econ["police_budget_pct"] is not None else 100.0

    debt = econ["municipal_debt"] if "municipal_debt" in econ.keys() and econ["municipal_debt"] is not None else 0.0
    interest_paid = econ["total_interest_paid"] if "total_interest_paid" in econ.keys() and econ["total_interest_paid"] is not None else 0.0
    daily_interest = round(debt * (0.02 / 30.0), 2)

    expenses = round(
        (110.0 * (road_f / 100.0)) +
        (145.0 * (power_f / 100.0)) +
        (98.0 * (water_f / 100.0)) +
        (130.0 * (health_f / 100.0)) +
        (160.0 * (edu_f / 100.0)) +
        (105.0 * (police_f / 100.0)) +
        daily_interest,
        2
    )

    treasury = float(econ["genesis_research_credits"])
    conn.close()

    return {
        "world_id": world_id,
        "treasury": treasury,
        "residential_tax": res_tax,
        "commercial_tax": com_tax,
        "industrial_tax": ind_tax,
        "office_tax": off_tax,
        "tax_revenue": total_tax_revenue,
        "road_funding": road_f,
        "power_funding": power_f,
        "water_funding": water_f,
        "health_funding": health_f,
        "education_funding": edu_f,
        "police_funding": police_f,
        "total_expenses": expenses,
        "net_balance": round(total_tax_revenue - expenses, 2),
        "municipal_debt": debt,
        "total_interest_paid": interest_paid,
        "daily_interest": daily_interest
    }


@router.post("/worlds/{id}/budget")
def update_world_budget(id: str, req: BudgetUpdateRequest):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()

    updates = []
    params = []

    if req.residential_tax is not None:
        updates.append("residential_tax = ?, tax_rate = ?")
        params.extend([req.residential_tax, req.residential_tax])
    if req.commercial_tax is not None:
        updates.append("commercial_tax = ?")
        params.append(req.commercial_tax)
    if req.industrial_tax is not None:
        updates.append("industrial_tax = ?")
        params.append(req.industrial_tax)
    if req.office_tax is not None:
        updates.append("office_tax = ?")
        params.append(req.office_tax)
    if req.road_budget_pct is not None:
        updates.append("road_budget_pct = ?")
        params.append(req.road_budget_pct)
    if req.power_budget_pct is not None:
        updates.append("power_budget_pct = ?")
        params.append(req.power_budget_pct)
    if req.water_budget_pct is not None:
        updates.append("water_budget_pct = ?")
        params.append(req.water_budget_pct)
    if req.health_budget_pct is not None:
        updates.append("health_budget_pct = ?")
        params.append(req.health_budget_pct)
    if req.education_budget_pct is not None:
        updates.append("education_budget_pct = ?")
        params.append(req.education_budget_pct)
    if req.police_budget_pct is not None:
        updates.append("police_budget_pct = ?")
        params.append(req.police_budget_pct)

    if updates:
        params.append(world_id)
        with conn:
            conn.execute(f"UPDATE economy_resources SET {', '.join(updates)} WHERE world_id = ?", params)

    conn.close()
    return get_world_budget(id)


@router.post("/worlds/{id}/bonds/issue")
def issue_municipal_bond(id: str, req: BondActionRequest):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    with conn:
        conn.execute("""
        UPDATE economy_resources SET
            genesis_research_credits = genesis_research_credits + ?,
            municipal_debt = COALESCE(municipal_debt, 0.0) + ?
        WHERE world_id = ?
        """, (req.amount, req.amount, world_id))

        # Also credit progression if present
        conn.execute("""
        UPDATE progression SET grc_balance = grc_balance + ? WHERE world_id = ?
        """, (req.amount, world_id))

        row = conn.execute("SELECT genesis_research_credits, municipal_debt FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()

    conn.close()
    return {
        "success": True,
        "amount": req.amount,
        "treasury": row["genesis_research_credits"],
        "municipal_debt": row["municipal_debt"]
    }


@router.post("/worlds/{id}/bonds/repay")
def repay_municipal_bond(id: str, req: BondActionRequest):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    row = conn.execute("SELECT genesis_research_credits, municipal_debt FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="World not found")

    if row["genesis_research_credits"] < req.amount:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient treasury funds to repay bond")

    repay_amount = min(req.amount, row["municipal_debt"])
    with conn:
        conn.execute("""
        UPDATE economy_resources SET
            genesis_research_credits = genesis_research_credits - ?,
            municipal_debt = MAX(0.0, municipal_debt - ?)
        WHERE world_id = ?
        """, (req.amount, repay_amount, world_id))

        conn.execute("""
        UPDATE progression SET grc_balance = MAX(0.0, grc_balance - ?) WHERE world_id = ?
        """, (req.amount, world_id))

        updated = conn.execute("SELECT genesis_research_credits, municipal_debt FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()

    conn.close()
    return {
        "success": True,
        "repaid_amount": repay_amount,
        "treasury": updated["genesis_research_credits"],
        "municipal_debt": updated["municipal_debt"]
    }
