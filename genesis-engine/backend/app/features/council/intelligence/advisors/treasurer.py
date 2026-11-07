"""
CIVORA — Council Advisor Intelligence: The Treasurer
Analyses sovereign GDP, liquidity reserves (GRC), taxation, and resource deficits.
"""

from typing import List
from app.features.council.constants import ADVISOR_TREASURER
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class TreasurerAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_TREASURER
    advisor_name = "Cassian Drake"
    advisor_title = "The Grand Treasurer"
    domain = "Economy and Finance"

    required_indicators = {
        "gdp",
        "gdp_growth_rate",
        "tax_rate",
        "grc_balance",
        "materials_rate",
        "energy_rate",
        "average_income",
        "employment_rate",
        "sovereign_debt_market",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Sovereign Treasury Liquidity (GRC)
        grc = context.grc_balance
        if grc < 500.0:
            severity = "critical"
            desc = f"Imperial liquid reserve (GRC) has fallen dangerously low to {grc:.1f} credits. Threatens emergency procurement capability."
        elif grc < 1200.0:
            severity = "moderate"
            desc = f"Imperial liquid reserve stands at {grc:.1f} GRC. Adequate for operational baseline, but constrained for major capital expansions."
        else:
            severity = "informational"
            desc = f"Treasury liquid reserves are robust at {grc:.1f} GRC, providing substantial fiscal buffer."

        findings.append(Finding(
            id="find-treasurer-liquidity",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Sovereign Liquid Reserves (GRC)",
            description=desc,
            severity=severity,
            related_metrics=["grc_balance"],
            observed_values={"grc_balance": grc},
            supporting_evidence=[
                Evidence(
                    metric_name="grc_balance",
                    observed_value=f"{grc:.1f} GRC",
                    benchmark_or_threshold="1,000.0 GRC",
                    trend="neutral",
                    interpretation=f"Liquid treasury reserves at {grc:.1f} GRC."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Macro GDP Output & Growth
        gdp = context.gdp
        growth = context.gdp_growth_rate
        gdp_str = f"${gdp / 1e9:.2f}B" if gdp >= 1e9 else f"${gdp / 1e6:.1f}M"

        findings.append(Finding(
            id="find-treasurer-gdp",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Macroeconomic Output & Industrial Productivity",
            description=f"Annualized civil output stands at {gdp_str} expanding at {growth * 100:.1f}% per tick cycle.",
            severity="informational" if growth >= 0.03 else "moderate",
            related_metrics=["gdp", "gdp_growth_rate"],
            observed_values={"gdp": gdp, "gdp_growth_rate": growth},
            supporting_evidence=[
                Evidence(
                    metric_name="gdp_growth_rate",
                    observed_value=f"{growth * 100:.1f}%",
                    benchmark_or_threshold="3.0%",
                    trend="improving" if growth >= 0.03 else "stable",
                    interpretation=f"GDP velocity healthy across industrial foundries."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 3. Resource Stockpiles & Burn Rates
        if context.materials_rate < 0 or context.materials < 2000.0:
            findings.append(Finding(
                id="find-treasurer-materials-deficit",
                advisor_id=self.advisor_id,
                domain=self.domain,
                title="Industrial Raw Material Supply Constriction",
                description=f"Raw materials inventory at {context.materials:.0f} tons with flow rate of {context.materials_rate:+.1f} tons/cycle.",
                severity="high" if context.materials_rate < 0 else "moderate",
                related_metrics=["materials", "materials_rate"],
                observed_values={"materials": context.materials, "materials_rate": context.materials_rate},
                supporting_evidence=[
                    Evidence(
                        metric_name="materials_rate",
                        observed_value=f"{context.materials_rate:+.1f} t/cycle",
                        benchmark_or_threshold=">= +30.0 t/cycle",
                        trend="deteriorating" if context.materials_rate < 0 else "neutral",
                        interpretation="Foundry material throughput constraining construction capacity."
                    )
                ],
                detected_epoch=f"Cycle {context.tick}"
            ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []
        grc = context.grc_balance

        if grc < 800.0:
            risks.append(Risk(
                id="risk-treasurer-liquidity",
                advisor_id=self.advisor_id,
                title="Fiscal Liquidity Squeeze",
                description="Insufficient liquid reserves limit the crown's ability to finance emergency infrastructural repairs or counter-cyclical investments.",
                probability="High" if grc < 400.0 else "Moderate",
                potential_impact="Severe" if grc < 400.0 else "Moderate",
                severity="High" if grc < 400.0 else "Moderate",
                time_horizon="Immediate (1-5 cycles)",
                supporting_finding_ids=["find-treasurer-liquidity"],
                mitigation_strategy="Conserve discretionary spending and prioritize high-yield capital projects.",
                confidence=0.92
            ))

        # Explicit missing data note
        if "sovereign_debt_market" in context.missing_indicators:
            risks.append(Risk(
                id="risk-treasurer-debt-gap",
                advisor_id=self.advisor_id,
                title="Sovereign Bond & Debt Instrument Blindspot",
                description="Long-term government bond obligations and public debt instruments are unmodelled in discrete simulation.",
                probability="Unavailable",
                potential_impact="Minor",
                severity="Low",
                time_horizon="Long-term (50+ cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Maintain fiscal operations under cash-in-hand accounting rules.",
                confidence=0.70
            ))

        return risks

    def generate_recommendations(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk]
    ) -> List[IntelligenceRecommendation]:
        recs = []

        # Fiscal recommendation: if GRC is moderate and tax rate < 18%, propose tariff optimization
        if context.tax_rate < 0.18 and context.grc_balance < 2000.0:
            recs.append(IntelligenceRecommendation(
                id="rec-treasurer-fiscal-opt",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Commercial Trade & Tariff Rationalization",
                description="Calibrate external trade duties and automate collection efficiency across corporate guild registries.",
                reason=f"Current effective taxation stands at {context.tax_rate * 100:.1f}%. Rationalizing duties can bolster liquid reserves by +15% without reducing citizen purchasing power.",
                category="Fiscal",
                priority="Medium",
                expected_benefits=[
                    "+15% Growth in sovereign GRC revenue intake",
                    "Strengthens imperial emergency liquidity buffer"
                ],
                potential_risks=[
                    "Minor economic friction among commercial merchant guilds",
                    "Must be balanced with Chancellor's civic approval monitoring"
                ],
                suggested_actions=[
                    "Issue decree updating merchant trade tariff schedules"
                ],
                supporting_finding_ids=["find-treasurer-liquidity", "find-treasurer-gdp"],
                monitoring_indicators=["grc_balance", "gdp_growth_rate"],
                estimated_cost_crc=100.0,
                political_capital_req=60.0,
                confidence=0.90
            ))

        # Industrial capacity expansion recommendation if materials throughput is low
        if context.materials_rate < 80.0:
            recs.append(IntelligenceRecommendation(
                id="rec-treasurer-foundry",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Industrial Foundry Automation Overhaul",
                description="Upgrade advanced materials foundry tooling to accelerate raw metals throughput.",
                reason=f"Materials generation rate ({context.materials_rate:+.1f} t/cycle) lags urban expansion demand.",
                category="Infrastructure",
                priority="High" if context.materials < 3000.0 else "Medium",
                expected_benefits=[
                    "+40 tons/cycle increase in materials generation",
                    "+0.02% boost to sovereign GDP growth velocity"
                ],
                potential_risks=[
                    "Requires 350 GRC capital investment and 1,200 energy MW load",
                    "Slight uptick in industrial pollution footprint (+0.03)"
                ],
                suggested_actions=[
                    "Allocate capital for foundry machinery modernization"
                ],
                supporting_finding_ids=["find-treasurer-materials-deficit"],
                monitoring_indicators=["materials_rate", "materials", "energy"],
                estimated_cost_crc=350.0,
                political_capital_req=90.0,
                confidence=0.89
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        grc = context.grc_balance
        gdp_str = f"${context.gdp / 1e9:.2f}B" if context.gdp >= 1e9 else f"${context.gdp / 1e6:.1f}M"

        if grc < 600.0:
            return (
                f"Sovereign Directorate, the Imperial Ledger requires immediate restraint. "
                f"Our liquid credit reserves have dwindled to {grc:.1f} GRC. "
                "I strongly urge against embarking upon capital-intensive megaprojects until our fiscal foundation is restored."
            )
        elif grc < 1500.0:
            return (
                f"Sovereign Leader, our economy generates robust gross output of {gdp_str}, "
                f"yet sovereign reserves remain moderately tight at {grc:.1f} GRC. "
                "With disciplined allocation and targeted tariff optimization, we can steadily accumulate sovereign wealth."
            )
        else:
            return (
                f"Sovereign Directorate, our treasury stands in enviable prosperity. "
                f"With {gdp_str} in civil output and a liquid surplus of {grc:.1f} GRC, "
                "we possess the financial fortitude to finance the crown's grandest ambitions."
            )
