"""
GENESIS Engine v2.0 - Economy Subsystem Module
Module: engine.modules.economy
Bottom-up GDP derived from citizen wages and enterprise revenues, Gini inequality,
sector taxation, municipal budget, loans/debt, and price dynamics.
"""

from typing import Dict, List, Optional, Any


class EconomyModule:
    """
    Authoritative micro-to-macro economic engine.
    Derives GDP, income, Gini inequality, taxes, and trade bottom-up from entities.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.treasury_credits: float = 250000.0
        self.municipal_debt: float = 0.0
        self.interest_rate: float = 0.04
        self.tax_rate: float = 0.15 # 15% flat default
        self.residential_tax: float = 0.15
        self.commercial_tax: float = 0.15
        self.industrial_tax: float = 0.12
        self.office_tax: float = 0.14

        # Budget allocation percentages
        self.budget_allocations = {
            "roads": 0.20,
            "utilities": 0.25,
            "healthcare": 0.20,
            "education": 0.20,
            "security": 0.15
        }

    def compute_gini(self, wealth_values: List[float]) -> float:
        """Computes true Gini inequality index from citizen wealth distribution."""
        if not wealth_values or len(wealth_values) <= 1:
            return 0.25 # Baseline equal
        # Sub-sample for high throughput if scale exceeds 1,000
        if len(wealth_values) > 1000:
            step = len(wealth_values) // 1000
            wealth_values = wealth_values[::step]
        values = sorted(max(0.0, float(w)) for w in wealth_values)
        n = len(values)
        total_sum = sum(values)
        if total_sum <= 0:
            return 0.0
        # Gini = (2 * sum(i * y_i) - (n + 1) * sum(y_i)) / (n * sum(y_i))
        weighted_sum = sum((i + 1) * val for i, val in enumerate(values))
        gini = (2.0 * weighted_sum - (n + 1) * total_sum) / (n * total_sum)
        return max(0.0, min(1.0, round(gini, 3)))

    def step(
        self,
        ticks: int,
        citizens: List[Any],
        buildings: List[Any],
        resources_state: Dict[str, Any],
        policy_multipliers: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Advances the economy by ticks, collecting taxes, paying municipal maintenance,
        and updating treasury and bottom-up GDP.
        """
        if policy_multipliers is None:
            policy_multipliers = {}

        living_citizens = [c for c in citizens if getattr(c, "is_alive", 1) == 1]
        pop_count = len(living_citizens)

        # 1. Citizen Wages and Incomes (Fast direct access)
        total_wages = 0.0
        citizen_wealths = []
        living_cost = 5.0 * ticks

        for c in living_citizens:
            is_employed = (c.employed == 1) if hasattr(c, "employed") else False
            edu = c.education if hasattr(c, "education") else 0.5
            hourly_wage = (15.0 + 25.0 * edu) if is_employed else 2.0
            earned = hourly_wage * ticks
            w = (c.wealth + earned) if hasattr(c, "wealth") else (100.0 + earned)
            w = max(10.0, w - living_cost)
            if hasattr(c, "wealth"):
                c.wealth = w
            citizen_wealths.append(w)
            total_wages += earned

        # 2. Firm Enterprise Output (Commercial & Industrial Buildings)
        enterprise_output = 0.0
        for b in buildings:
            if getattr(b, "status", "active") == "abandoned":
                continue
            b_type = getattr(b, "type", "")
            workers = getattr(b, "current_workers", 0)
            lvl = getattr(b, "level", 1)
            eff = getattr(b, "efficiency", 1.0)

            if "Commercial" in b_type:
                # Value added per worker per hour
                enterprise_output += (workers * 28.0 * eff * lvl) * ticks
            elif "Industrial" in b_type:
                enterprise_output += (workers * 35.0 * eff * lvl) * ticks

        # 3. Bottom-Up GDP
        # GDP = Citizen Wages + Corporate Gross Output + Government Services
        hourly_gov_service_val = max(50.0, pop_count * 4.0) * ticks
        bottom_up_gdp = total_wages + enterprise_output + hourly_gov_service_val
        annualized_gdp = bottom_up_gdp * (8760.0 / max(1, ticks))

        # 4. Tax Collections (Hourly -> Ticks)
        tax_revenue = (
            (total_wages * self.residential_tax) +
            (enterprise_output * 0.5 * self.commercial_tax) +
            (enterprise_output * 0.5 * self.industrial_tax)
        )
        if "tax_revenue_drag" in policy_multipliers:
            tax_revenue *= (1.0 + policy_multipliers["tax_revenue_drag"])

        # 5. Municipal Expenses & Budget
        building_maintenance = sum(5.0 * getattr(b, "level", 1) for b in buildings) * (ticks / 24.0)
        debt_service = (self.municipal_debt * (self.interest_rate / 8760.0)) * ticks
        total_expenses = building_maintenance + debt_service

        # Update treasury
        net_fiscal_flow = tax_revenue - total_expenses
        self.treasury_credits += net_fiscal_flow

        # 6. Gini Inequality
        gini_index = self.compute_gini(citizen_wealths)

        return {
            "gdp": round(annualized_gdp, 2),
            "total_wages": round(total_wages, 2),
            "enterprise_output": round(enterprise_output, 2),
            "treasury_credits": round(self.treasury_credits, 2),
            "tax_revenue_step": round(tax_revenue, 2),
            "municipal_expenses_step": round(total_expenses, 2),
            "net_fiscal_flow": round(net_fiscal_flow, 2),
            "gini_coefficient": gini_index,
            "average_citizen_wealth": round(sum(citizen_wealths) / max(1, len(citizen_wealths)), 2),
            "municipal_debt": round(self.municipal_debt, 2),
            "tax_rate_percent": round(self.tax_rate * 100.0, 1)
        }
