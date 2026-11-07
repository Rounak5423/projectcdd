"""
CIVORA — Council Advisor Intelligence: The High Physician
Analyses citizen physiological vitality, hospital bed ratios, clean water, and nutritional security.
"""

from typing import List
from app.features.council.constants import ADVISOR_PHYSICIAN
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class HighPhysicianAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_PHYSICIAN
    advisor_name = "Lady Maeve Linnea"
    advisor_title = "The High Physician"
    domain = "Health and Wellbeing"

    required_indicators = {
        "avg_health",
        "avg_wellbeing",
        "hospital_capacity",
        "water",
        "water_rate",
        "food",
        "food_rate",
        "population",
        "pandemic_pathogen_vectors",
        "mental_health_diagnostics",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Citizen Physiological Vitality & Health Score
        health = context.avg_health
        wellbeing = context.avg_wellbeing

        if health < 0.70:
            severity = "critical"
            desc = f"Citizen health index has declined to {health * 100:.1f}%. Malnutrition or biosecurity vulnerabilities spreading."
        elif health < 0.80:
            severity = "moderate"
            desc = f"Citizen physiological health stable at {health * 100:.1f}%. General vitality intact across provinces."
        else:
            severity = "informational"
            desc = f"Citizen health is exemplary at {health * 100:.1f}%, reflecting robust sanitation and clean nourishment."

        findings.append(Finding(
            id="find-physician-vitality",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Citizen Physiological Vitality & Public Health Index",
            description=desc,
            severity=severity,
            related_metrics=["avg_health", "avg_wellbeing"],
            observed_values={"avg_health": health, "avg_wellbeing": wellbeing},
            supporting_evidence=[
                Evidence(
                    metric_name="avg_health",
                    observed_value=f"{health * 100:.1f}%",
                    benchmark_or_threshold=">= 80.0%",
                    trend="stable" if health >= 0.80 else "deteriorating",
                    interpretation=f"Citizen biological resistance index at {health:.3f}."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Clean Water Security & Aquifer Reserves
        water = context.water
        water_rate = context.water_rate

        if water_rate < 0 or water < 5000.0:
            severity = "critical" if water < 2000.0 else "high"
            desc = f"Clean water reserves depleted to {water:.0f} units with burn deficit of {water_rate:+.1f} units/cycle. Immediate dehydration threat."
        else:
            severity = "informational"
            desc = f"Clean water reserves abundant at {water:.0f} units (+{water_rate:.1f} units/cycle surplus). Aquifers pristine."

        findings.append(Finding(
            id="find-physician-water",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Potable Water Supply & Aquifer Reserves",
            description=desc,
            severity=severity,
            related_metrics=["water", "water_rate"],
            observed_values={"water": water, "water_rate": water_rate},
            supporting_evidence=[
                Evidence(
                    metric_name="water_rate",
                    observed_value=f"{water_rate:+.1f} units/cycle",
                    benchmark_or_threshold=">= +50.0 units/cycle",
                    trend="improving" if water_rate > 0 else "deteriorating",
                    interpretation=f"Water generation throughput: {water_rate:+.1f} units/cycle."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 3. Healthcare Bed Capacity
        beds_per_k = context.healthcare_coverage_per_thousand
        findings.append(Finding(
            id="find-physician-hospital-beds",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Hospital Treatment Capacity & Clinic Ratios",
            description=f"Healthcare capacity provides {context.hospital_capacity:,} certified patient care beds ({beds_per_k:.2f} per 1,000 citizens).",
            severity="moderate" if beds_per_k < 1.0 else "informational",
            related_metrics=["hospital_capacity", "population"],
            observed_values={"hospital_capacity": context.hospital_capacity, "beds_per_thousand": beds_per_k},
            supporting_evidence=[
                Evidence(
                    metric_name="hospital_beds_per_thousand",
                    observed_value=beds_per_k,
                    benchmark_or_threshold=">= 1.5 per 1,000",
                    trend="stable",
                    interpretation="Provincial hospital infrastructure capacity index."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []

        if context.water_rate < 0 or context.water < 3000.0:
            risks.append(Risk(
                id="risk-physician-water-deficit",
                advisor_id=self.advisor_id,
                title="Acute Water Scarcity & Dehydration Shock",
                description="Negative aquifer replenishment rate threatens citizen biological survival and municipal sanitation systems.",
                probability="High" if context.water_rate < 0 else "Moderate",
                potential_impact="Catastrophic" if context.water < 1000.0 else "Severe",
                severity="Critical" if context.water_rate < 0 else "High",
                time_horizon="Immediate (1-5 cycles)",
                supporting_finding_ids=["find-physician-water"],
                mitigation_strategy="Prioritize geothermal water desalinization and ration industrial water diversion.",
                confidence=0.96
            ))

        # Explicit missing data note
        if "pandemic_pathogen_vectors" in context.missing_indicators:
            risks.append(Risk(
                id="risk-physician-pathogen-gap",
                advisor_id=self.advisor_id,
                title="Pathogen Contagion & Epidemiological Vector Blindspot",
                description="Specific viral mutation lineages and airborne transmission vectors are unmodelled in discrete simulation.",
                probability="Unavailable",
                potential_impact="Moderate",
                severity="Low",
                time_horizon="Mid-term (10-20 cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Maintain baseline hygiene standards and clinical stockpiles as universal prophylaxis.",
                confidence=0.68
            ))

        return risks

    def generate_recommendations(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk]
    ) -> List[IntelligenceRecommendation]:
        recs = []

        # If water rate is low or food reserves are tight
        if context.water_rate < 100.0 or context.water < 15000.0:
            recs.append(IntelligenceRecommendation(
                id="rec-physician-water-infrastructure",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Commission Closed-Loop Aquifer Reclamation",
                description="Equip municipal water networks with nanofiltration and atmospheric moisture condensation plants.",
                reason=f"Water reserve surplus ({context.water_rate:+.1f} units/cycle) must be bolstered to safeguard demographic growth.",
                category="Infrastructure",
                priority="High" if context.water_rate < 50.0 else "Medium",
                expected_benefits=[
                    "+80.0 units/cycle expansion in clean potable water output",
                    "+0.05 Citizen biological health and disease resistance index"
                ],
                potential_risks=[
                    "Requires 250 GRC implementation budget and 500 energy MW grid load"
                ],
                suggested_actions=[
                    "Authorize water reclamation infrastructure development"
                ],
                supporting_finding_ids=["find-physician-water"],
                monitoring_indicators=["water", "water_rate", "avg_health"],
                estimated_cost_crc=250.0,
                political_capital_req=70.0,
                confidence=0.93
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        health = context.avg_health

        if context.water_rate < 0:
            return (
                f"Sovereign Leader, I bring a grave biological warning. "
                f"Our water supply is in deficit at {context.water_rate:+.1f} units per cycle! "
                "No throne can outlive a parched populace. We must secure fresh water replenishment before disease takes root."
            )
        else:
            return (
                f"Sovereign Directorate, the vitality of our people is well-guarded. "
                f"Citizen health index stands at {health * 100:.1f}%, and our clean water reservoirs hold {context.water:,.0f} units in reserve. "
                "Let us continue to invest in our biological resilience, for healthy hands build eternal empires."
            )
