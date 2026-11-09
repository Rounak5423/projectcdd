"""
CIVORA — Council Advisor Intelligence: The Royal Architect
Evaluates housing capacity vs demographic pressure, zoning grids, and civil infrastructure.
"""

from typing import List
from app.features.council.constants import ADVISOR_ARCHITECT
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class RoyalArchitectAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_ARCHITECT
    advisor_name = "Severus Thorne"
    advisor_title = "The Royal Architect"
    domain = "Infrastructure and Development"

    required_indicators = {
        "housing_capacity",
        "population",
        "buildings_by_type",
        "grid_size",
        "total_buildings_count",
        "road_network_topology",
        "structural_wear_and_tear",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Housing Capacity vs Demographic Pressure
        occupancy = context.housing_occupancy_ratio
        pop = context.population
        cap = context.housing_capacity

        if occupancy > 1.05:
            severity = "critical"
            desc = f"Critical housing deficit. Population ({pop:,}) exceeds certified residential capacity ({cap:,}) by {(occupancy - 1.0) * 100:.1f}%."
        elif occupancy > 0.90:
            severity = "high"
            desc = f"Residential zoning strained at {occupancy * 100:.1f}% occupancy ({pop:,} citizens housed across {cap:,} capacity)."
        elif occupancy > 0.75:
            severity = "moderate"
            desc = f"Residential occupancy balanced at {occupancy * 100:.1f}%. Adequate buffer remains for near-term demographic growth."
        else:
            severity = "informational"
            desc = f"Generous residential housing surplus ({occupancy * 100:.1f}% occupancy). Ample room for immigration."

        findings.append(Finding(
            id="find-architect-housing-occupancy",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Urban Housing Capacity & Density Equilibrium",
            description=desc,
            severity=severity,
            related_metrics=["housing_capacity", "population"],
            observed_values={"population": pop, "housing_capacity": cap, "occupancy_ratio": occupancy},
            supporting_evidence=[
                Evidence(
                    metric_name="housing_occupancy_ratio",
                    observed_value=f"{occupancy * 100:.1f}%",
                    benchmark_or_threshold="< 90.0%",
                    trend="deteriorating" if occupancy > 0.90 else "stable",
                    interpretation=f"Housing load: {pop:,} citizens / {cap:,} capacity."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Municipal Infrastructure Footprint & Zoning Density
        total_bld = context.total_buildings_count
        grid_cells = context.grid_size * context.grid_size
        findings.append(Finding(
            id="find-architect-zoning-density",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Provincial Zoning Grid & Structural Portfolio",
            description=f"{total_bld} monumental civic, residential, and industrial structures erected across {context.grid_size}x{context.grid_size} territorial grid.",
            severity="informational",
            related_metrics=["total_buildings_count", "grid_size"],
            observed_values={"total_buildings": total_bld, "grid_size": context.grid_size},
            supporting_evidence=[
                Evidence(
                    metric_name="total_buildings_count",
                    observed_value=total_bld,
                    benchmark_or_threshold="Grid capacity充足",
                    trend="improving",
                    interpretation="Civil architectural portfolio expanding across sectors."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []
        occupancy = context.housing_occupancy_ratio

        if occupancy > 0.92:
            risks.append(Risk(
                id="risk-architect-overcrowding",
                advisor_id=self.advisor_id,
                title="Severe Urban Overcrowding & Tenement Slums",
                description="High residential occupancy outpaces housing construction, risking illegal tenement settlements, sanitation bottlenecks, and social friction.",
                probability="High" if occupancy > 1.0 else "Moderate",
                potential_impact="Severe",
                severity="High" if occupancy > 0.95 else "Moderate",
                time_horizon="Immediate (1-5 cycles)",
                supporting_finding_ids=["find-architect-housing-occupancy"],
                mitigation_strategy="Commission modular high-rise residential zone in urban expansion sector.",
                confidence=0.95
            ))

        # Explicit missing data note
        if "road_network_topology" in context.missing_indicators:
            risks.append(Risk(
                id="risk-architect-traffic-gap",
                advisor_id=self.advisor_id,
                title="Arterial Road & Traffic Congestion Blindspot",
                description="Street-level traffic routing vectors and logistical road wear are unmodelled in grid simulation.",
                probability="Unavailable",
                potential_impact="Minor",
                severity="Low",
                time_horizon="Mid-term (10-20 cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Base transit planning on spatial district zoning density.",
                confidence=0.65
            ))

        return risks

    def generate_recommendations(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk]
    ) -> List[IntelligenceRecommendation]:
        recs = []

        # If housing occupancy is high (> 88%), propose new residential sector
        if context.housing_occupancy_ratio > 0.88:
            recs.append(IntelligenceRecommendation(
                id="rec-architect-residential-zone",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Construct High-Density Residential Sector",
                description="Zoning and erecting a modular high-rise residential zone to accommodate expanding demographics.",
                reason=f"Current residential occupancy has reached {context.housing_occupancy_ratio * 100:.1f}%. An additional zone adds 600,000 housing capacity.",
                category="Infrastructure",
                priority="High" if context.housing_occupancy_ratio > 0.95 else "Medium",
                expected_benefits=[
                    "+600,000 Total certified citizen housing capacity",
                    "+0.04 Public happiness and citizen wellbeing boost",
                    "Averts urban squalor and tenement overcrowding"
                ],
                potential_risks=[
                    "Requires 2,000 materials tons and 800 energy MW grid capacity",
                    "Increases municipal water and food demand burdens"
                ],
                suggested_actions=[
                    "Authorize civil construction permits for residential grid coordinates"
                ],
                supporting_finding_ids=["find-architect-housing-occupancy"],
                monitoring_indicators=["housing_capacity", "happiness"],
                estimated_cost_crc=300.0,
                political_capital_req=80.0,
                confidence=0.94
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        occupancy = context.housing_occupancy_ratio

        if occupancy > 0.95:
            return (
                f"Sovereign Directorate, our municipal foundations are groaning under demographic weight. "
                f"Residential occupancy has surged to {occupancy * 100:.1f}%, leaving virtually zero vacancy buffer. "
                "I plead for immediate authorization to lay the foundation stones for a new residential sector before overcrowding sparks unrest."
            )
        else:
            return (
                f"Sovereign Leader, the monuments of our empire stand unshakeable. "
                f"With {context.total_buildings_count} active structures and housing occupancy balanced at {occupancy * 100:.1f}%, "
                "our architectural arteries are well-positioned to support sustainable civil expansion."
            )

