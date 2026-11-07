"""
CIVORA — Council Advisor Intelligence: The Chancellor
Evaluates governance efficiency, civic stability, wealth disparity (Gini), and social cohesion.
"""

from typing import List
from app.features.council.constants import ADVISOR_CHANCELLOR
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class ChancellorAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_CHANCELLOR
    advisor_name = "Aurelius Valerius"
    advisor_title = "The High Chancellor"
    domain = "Governance and Society"

    required_indicators = {
        "civic_stability",
        "gini_coefficient",
        "happiness",
        "active_policies",
        "government_infrastructure",
        "crime_statistics",
        "social_class_mobility",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Civic Stability Assessment
        stability = context.civic_stability
        stability_trend = context.get_historical_trend("civic_stability")
        trend_str = "improving" if (stability_trend and stability_trend > 0.01) else "deteriorating" if (stability_trend and stability_trend < -0.01) else "stable"

        if stability < 0.60:
            severity = "critical"
            desc = f"Civic stability index has collapsed to {stability:.3f}. Severe civil dissidence and social fracture imminent."
        elif stability < 0.72:
            severity = "high"
            desc = f"Civic stability index is depressed at {stability:.3f}. Worker unrest and civil disobedience emerging in outlying sectors."
        elif stability < 0.80:
            severity = "moderate"
            desc = f"Civic stability stands at {stability:.3f}. Institutional legitimacy is maintained, though citizen grievances are noted."
        else:
            severity = "informational"
            desc = f"Civic stability is robust at {stability:.3f}. Imperial decrees enjoy high civil compliance."

        findings.append(Finding(
            id="find-chancellor-stability",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Civil Stability & Institutional Order",
            description=desc,
            severity=severity,
            related_metrics=["civic_stability"],
            observed_values={"civic_stability": stability, "trend": trend_str},
            supporting_evidence=[
                Evidence(
                    metric_name="civic_stability",
                    observed_value=stability,
                    benchmark_or_threshold=0.75,
                    trend=trend_str,
                    interpretation=f"Stability indicator at {stability:.3f} (Benchmark: >= 0.75)."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Wealth Disparity (Gini Coefficient)
        gini = context.gini_coefficient
        if gini > 0.38:
            gini_sev = "high"
            gini_desc = f"Gini disparity coefficient has risen to {gini:.3f}. Wealth concentration is compressing civic stability."
            gini_title = "Dangerous Wealth Disparity Polarization"
        elif gini > 0.30:
            gini_sev = "moderate"
            gini_desc = f"Gini disparity stands at {gini:.3f}. Wealth divergence requires monitoring."
            gini_title = "Elevated Wealth Disparity Index"
        else:
            gini_sev = "informational"
            gini_desc = f"Gini disparity is well-controlled at {gini:.3f}. Broad economic distribution sustains civic harmony."
            gini_title = "Equitable Wealth Distribution"

        findings.append(Finding(
            id="find-chancellor-gini",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title=gini_title,
            description=gini_desc,
            severity=gini_sev,
            related_metrics=["gini_coefficient", "civic_stability"],
            observed_values={"gini": gini, "formula_stability_limit": round(1.0 - 0.8 * gini, 3)},
            supporting_evidence=[
                Evidence(
                    metric_name="gini_coefficient",
                    observed_value=gini,
                    benchmark_or_threshold=0.30,
                    trend="deteriorating" if gini > 0.35 else "stable",
                    interpretation=f"Gini at {gini:.3f} exerts structural drag on social cohesion."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 3. Public Sentiment & Directorate Approval
        happiness = context.happiness
        if happiness < 0.70:
            app_sev = "high" if happiness < 0.60 else "moderate"
            app_desc = f"Citizen public satisfaction poll has fallen to {happiness * 100:.1f}%. Dissatisfaction is accumulating."
            app_title = "Depressed Civilian Directorate Approval"
        else:
            app_sev = "informational"
            app_desc = f"Citizen satisfaction is high at {happiness * 100:.1f}%. Edicts enjoy broad public legitimacy."
            app_title = "Strong Civilian Directorate Approval"

        findings.append(Finding(
            id="find-chancellor-approval",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title=app_title,
            description=app_desc,
            severity=app_sev,
            related_metrics=["happiness"],
            observed_values={"happiness": happiness},
            supporting_evidence=[
                Evidence(
                    metric_name="happiness",
                    observed_value=f"{happiness * 100:.1f}%",
                    benchmark_or_threshold="75.0%",
                    trend="improving" if happiness >= 0.75 else "neutral",
                    interpretation="Directorate approval within target zone of public harmony."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []
        stability = context.civic_stability
        gini = context.gini_coefficient

        if stability < 0.75 or gini > 0.35:
            risks.append(Risk(
                id="risk-chancellor-unrest",
                advisor_id=self.advisor_id,
                title="Civil Dissidence & Sector Insurrection",
                description="Elevated wealth concentration combined with declining civic stability risks labor strikes and civil protest.",
                probability="High" if stability < 0.68 else "Moderate",
                potential_impact="Severe" if stability < 0.65 else "Moderate",
                severity="High" if stability < 0.68 else "Moderate",
                time_horizon="Immediate (1-5 cycles)",
                supporting_finding_ids=["find-chancellor-stability", "find-chancellor-gini"],
                mitigation_strategy="Enact redistributive basic dividend or public services expansion to relieve civilian cost-of-living distress.",
                confidence=0.88
            ))

        # Explicit missing data note
        if "crime_statistics" in context.missing_indicators:
            risks.append(Risk(
                id="risk-chancellor-data-gap",
                advisor_id=self.advisor_id,
                title="Municipal Crime Vector Blindspot",
                description="Local municipal crime telemetry is unmodelled in current simulation epoch; street-level enforcement risk cannot be statistically forecasted.",
                probability="Unavailable",
                potential_impact="Minor",
                severity="Low",
                time_horizon="Mid-term (10-20 cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Rely on aggregate civic stability index until provincial police telemetry is commissioned.",
                confidence=0.60
            ))

        return risks

    def generate_recommendations(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk]
    ) -> List[IntelligenceRecommendation]:
        recs = []

        # If Gini is elevated and UBI is not active
        has_ubi = any(p.get("id") == "universal_basic_income" for p in context.active_policies)
        if context.gini_coefficient > 0.28 and not has_ubi:
            recs.append(IntelligenceRecommendation(
                id="rec-chancellor-ubi",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Enact Universal Basic Dividend (UBI)",
                description="Institute an unconditional sovereign civic dividend across all registered civilian households.",
                reason=f"Wealth disparity is elevated (Gini {context.gini_coefficient:.3f}), threatening civic stability. A baseline dividend compresses disparity by ~0.05.",
                category="Policy",
                priority="High" if context.civic_stability < 0.75 else "Medium",
                expected_benefits=[
                    "Compresses Gini coefficient disparity by up to 0.05",
                    "Raises civic stability index by +0.08 points",
                    "Elevates low-income citizen wellbeing and public approval"
                ],
                potential_risks=[
                    "Imposes recurring sovereign treasury expenditure (500 GRC implementation cost)",
                    "Minor economic inflation risk if resource production cannot match demand"
                ],
                suggested_actions=[
                    "Table Universal Basic Dividend in the High Imperial Directorate",
                    "Coordinate with Grand Treasurer on budgetary liquidity allocation"
                ],
                supporting_finding_ids=["find-chancellor-gini", "find-chancellor-stability"],
                monitoring_indicators=["gini_coefficient", "civic_stability", "happiness"],
                estimated_cost_crc=500.0,
                political_capital_req=150.0,
                confidence=0.92
            ))

        # If civic stability is below threshold
        if context.civic_stability < 0.75:
            recs.append(IntelligenceRecommendation(
                id="rec-chancellor-tribunals",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Civic Harmony & Conciliation Accord",
                description="Establish municipal conciliation forums and ombudsman councils across worker districts to peacefully resolve labor grievances.",
                reason=f"Civic stability ({context.civic_stability:.3f}) requires direct diplomatic mediation to prevent escalation into sector disruption.",
                category="Civic",
                priority="High" if context.civic_stability < 0.68 else "Medium",
                expected_benefits=[
                    "+0.05 Civic stability reinforcement",
                    "Prevents industrial sector strike disruptions",
                    "Increases citizen institutional trust"
                ],
                potential_risks=[
                    "Requires 150 GRC administrative operational budget",
                    "May slow executive bureaucratic implementation speed"
                ],
                suggested_actions=[
                    "Commission imperial ombudsman offices in urban residential sectors"
                ],
                supporting_finding_ids=["find-chancellor-stability"],
                monitoring_indicators=["civic_stability", "happiness"],
                estimated_cost_crc=150.0,
                political_capital_req=80.0,
                confidence=0.88
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        stability = context.civic_stability
        gini = context.gini_coefficient

        if stability < 0.72:
            return (
                f"Sovereign Directorate, the civic fabric of our realm faces mounting strain. "
                f"Civic stability has receded to {stability:.3f}, compounded by a wealth disparity index of {gini:.3f}. "
                "Unless we take immediate redistributive and conciliatory measures, worker discontent will spill into our industrial arteries."
            )
        elif stability < 0.80:
            return (
                f"Sovereign, institutional order remains intact, though social cohesion requires vigilant stewardship. "
                f"With stability at {stability:.3f} and public approval at {context.happiness * 100:.1f}%, "
                "I advise targeted reinforcement of our social compact to preserve eternal harmony."
            )
        else:
            return (
                f"Sovereign Directorate, I bring auspicious tidings from the civil ministries. "
                f"Imperial stability is exalted at {stability:.3f}, and our decrees command widespread public reverence. "
                "Let us harness this peace to fortify our legal institutions for the epochs ahead."
            )
