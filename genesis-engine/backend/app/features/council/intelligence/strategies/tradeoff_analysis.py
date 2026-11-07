"""
CIVORA — Council Intelligence Cross-Domain Trade-off & Disagreement Analysis
Detects genuine conflicting objectives between advisors grounded in actual simulation findings.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.base import AdvisorAnalysisResult


@dataclass
class AdvisorTradeoffConflict:
    """A documented analytical disagreement between two or more Council advisors."""
    id: str
    conflict_title: str
    primary_advisor_id: str
    primary_advisor_title: str
    competing_advisor_id: str
    competing_advisor_title: str
    competing_objectives: str
    primary_stance: str
    competing_stance: str
    potential_consequences: str
    compromise_recommendation: str
    supporting_finding_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "conflict_title": self.conflict_title,
            "primary_advisor_id": self.primary_advisor_id,
            "primary_advisor_title": self.primary_advisor_title,
            "competing_advisor_id": self.competing_advisor_id,
            "competing_advisor_title": self.competing_advisor_title,
            "competing_objectives": self.competing_objectives,
            "primary_stance": self.primary_stance,
            "competing_stance": self.competing_stance,
            "potential_consequences": self.potential_consequences,
            "compromise_recommendation": self.compromise_recommendation,
            "supporting_finding_ids": self.supporting_finding_ids,
        }


def detect_cross_domain_tradeoffs(
    context: CivilisationContext,
    advisor_reports: Dict[str, AdvisorAnalysisResult]
) -> List[AdvisorTradeoffConflict]:
    """
    Examines all six advisor reports and identifies genuine structural policy trade-offs.
    Does not script artificial arguments; only triggers when genuine competing findings exist.
    """
    conflicts: List[AdvisorTradeoffConflict] = []

    chancellor = advisor_reports.get("adv-chancellor")
    treasurer = advisor_reports.get("adv-treasurer")
    scholar = advisor_reports.get("adv-scholar")
    architect = advisor_reports.get("adv-architect")
    physician = advisor_reports.get("adv-physician")
    keeper = advisor_reports.get("adv-keeper")

    # Conflict 1: Fiscal Budgetary Discipline (Treasurer) vs Social Redistribution (Chancellor)
    if treasurer and chancellor:
        has_ubi_rec = any("UBI" in r.title or "Dividend" in r.title for r in chancellor.recommendations)
        tight_grc = context.grc_balance < 1500.0
        if has_ubi_rec and tight_grc:
            conflicts.append(AdvisorTradeoffConflict(
                id="conflict-treasurer-chancellor-ubi",
                conflict_title="Sovereign Fiscal Liquidity vs Social Wealth Redistribution",
                primary_advisor_id=treasurer.advisor_id,
                primary_advisor_title=treasurer.advisor_title,
                competing_advisor_id=chancellor.advisor_id,
                competing_advisor_title=chancellor.advisor_title,
                competing_objectives="Maintaining sovereign credit reserves (GRC) vs Compressing wealth inequality (Gini)",
                primary_stance=f"The Grand Treasurer cautions that liquid reserves ({context.grc_balance:.0f} GRC) are tight and funding UBI strains the crown's balance sheet.",
                competing_stance=f"The High Chancellor counters that elevated Gini ({context.gini_coefficient:.3f}) risks civil dissidence if redistribution is postponed.",
                potential_consequences="Immediate full UBI payout risks fiscal illiquidity; withholding UBI risks worker sector unrest and reduced approval.",
                compromise_recommendation="Phase the Universal Basic Dividend over multiple simulation epochs, indexing payouts to quarterly GDP tax surplus.",
                supporting_finding_ids=["find-treasurer-liquidity", "find-chancellor-gini"]
            ))

    # Conflict 2: Industrial / Residential Expansion (Architect) vs Ecological Protection (Keeper)
    if architect and keeper:
        has_housing_rec = any("Residential" in r.title for r in architect.recommendations)
        elevated_pollution = context.pollution > 0.15 or context.environmental_health < 0.78
        if has_housing_rec and elevated_pollution:
            conflicts.append(AdvisorTradeoffConflict(
                id="conflict-architect-keeper-expansion",
                conflict_title="Urban Demographic Density vs Planetary Biosphere Preservation",
                primary_advisor_id=architect.advisor_id,
                primary_advisor_title=architect.advisor_title,
                competing_advisor_id=keeper.advisor_id,
                competing_advisor_title=keeper.advisor_title,
                competing_objectives="Relieving municipal housing occupancy pressure vs Curbing industrial pollution emissions",
                primary_stance=f"The Royal Architect insists that housing occupancy ({context.housing_occupancy_ratio * 100:.1f}%) necessitates immediate high-rise zoning.",
                competing_stance=f"The Keeper of Nature warns that concrete and steel expansion accelerates carbon emissions and stresses environmental health ({context.environmental_health:.3f}).",
                potential_consequences="Halting construction causes tenement squalor; unconstrained construction poisons provincial aquifers.",
                compromise_recommendation="Approve residential sector zoning strictly conditioned on mandatory green rooftop flora and closed-loop filtration.",
                supporting_finding_ids=["find-architect-housing-occupancy", "find-keeper-pollution"]
            ))

    # Conflict 3: Automation Efficiency (Treasurer) vs Cognitive Agency (Grand Scholar)
    if treasurer and scholar:
        has_scaffold_rec = any("Scaffolding" in r.title for r in scholar.recommendations)
        if has_scaffold_rec:
            conflicts.append(AdvisorTradeoffConflict(
                id="conflict-treasurer-scholar-automation",
                conflict_title="Unfettered Algorithmic Productivity vs Cognitive Epistemic Independence",
                primary_advisor_id=treasurer.advisor_id,
                primary_advisor_title=treasurer.advisor_title,
                competing_advisor_id=scholar.advisor_id,
                competing_advisor_title=scholar.advisor_title,
                competing_objectives="Maximizing task output velocity vs Preventing civilian cognitive atrophy",
                primary_stance="The Grand Treasurer favors unencumbered AI tool deployment to maintain peak foundry output and corporate GDP velocity.",
                competing_stance=f"The Grand Scholar warns that unchecked reliance has elevated dependency to {context.avg_ai_dependency * 100:.1f}%, degrading critical reasoning.",
                potential_consequences="Permitting unchecked automation degrades human innovation; excessive friction lowers industrial productivity.",
                compromise_recommendation="Deploy inquiry-based cognitive scaffolding selectively: full friction in educational academies, streamlined in emergency operations.",
                supporting_finding_ids=["find-scholar-macro-innovation", "find-treasurer-gdp"]
            ))

    # Conflict 4: Monumental Capital Allocation (Architect/Treasurer) vs Vital Life-Support Water Security (Physician)
    if physician and (treasurer or architect):
        has_water_rec = any("Water" in r.title or "Aquifer" in r.title for r in physician.recommendations)
        tight_grc = context.grc_balance < 1200.0
        if has_water_rec and tight_grc:
            conflicts.append(AdvisorTradeoffConflict(
                id="conflict-physician-treasurer-water",
                conflict_title="Essential Potable Water Security vs Discretionary Infrastructure Budgeting",
                primary_advisor_id=physician.advisor_id,
                primary_advisor_title=physician.advisor_title,
                competing_advisor_id="adv-treasurer",
                competing_advisor_title="The Grand Treasurer",
                competing_objectives="Securing clean potable water reserves vs Protecting liquid treasury balance",
                primary_stance=f"The High Physician demands 250 GRC for closed-loop aquifer purification to secure water reserves ({context.water:,.0f} units).",
                competing_stance=f"The Grand Treasurer urges delaying non-critical capital grants until treasury liquid reserves exceed 2,000 GRC.",
                potential_consequences="Delaying water purification risks contamination shocks; immediate grant temporarily reduces fiscal liquidity buffer.",
                compromise_recommendation="Prioritize clean water infrastructure grant ahead of all aesthetic monuments and non-essential commercial projects.",
                supporting_finding_ids=["find-physician-water", "find-treasurer-liquidity"]
            ))

    return conflicts
