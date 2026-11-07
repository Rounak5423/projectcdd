"""
CIVORA — Council Advisor Intelligence: The Keeper of Nature
Evaluates environmental health, atmospheric pollution, clean energy ratios, and ecological harmony.
"""

from typing import List
from app.features.council.constants import ADVISOR_KEEPER
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class KeeperOfNatureAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_KEEPER
    advisor_name = "Thalric Ironwood"
    advisor_title = "The Keeper of Nature"
    domain = "Environment and Ecology"

    required_indicators = {
        "environmental_health",
        "pollution",
        "clean_energy_ratio",
        "active_policies",
        "buildings_by_type",
        "forest_canopy_coverage_km2",
        "biome_biodiversity_species_count",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Planetary Environmental Health
        env = context.environmental_health
        if env < 0.55:
            severity = "critical"
            desc = f"Ecological biosphere health has collapsed to {env:.3f}. Severe habitat degradation and atmospheric toxicity."
        elif env < 0.70:
            severity = "high"
            desc = f"Environmental health is under pressure at {env:.3f}. Industrial runoff outpacing natural planetary replenishment."
        elif env < 0.82:
            severity = "moderate"
            desc = f"Environmental health stable at {env:.3f}. Natural biome equilibrium preserved, though pollution monitors show localized hotspots."
        else:
            severity = "informational"
            desc = f"Planetary environment is pristine at {env:.3f}. Nature flourishes in harmony with civil settlements."

        findings.append(Finding(
            id="find-keeper-env-health",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Biosphere Environmental Health Index",
            description=desc,
            severity=severity,
            related_metrics=["environmental_health"],
            observed_values={"environmental_health": env},
            supporting_evidence=[
                Evidence(
                    metric_name="environmental_health",
                    observed_value=f"{env:.3f}",
                    benchmark_or_threshold=">= 0.75",
                    trend="stable" if env >= 0.70 else "deteriorating",
                    interpretation=f"Planetary ecological equilibrium index at {env:.3f}."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Industrial Pollution Index
        poll = context.pollution
        if poll > 0.30:
            findings.append(Finding(
                id="find-keeper-pollution",
                advisor_id=self.advisor_id,
                domain=self.domain,
                title="Industrial Effluent & Atmospheric Pollution Spike",
                description=f"Pollution emissions index has spiked to {poll:.3f}. Factory exhausts are degrading air quality and water tables.",
                severity="high" if poll > 0.40 else "moderate",
                related_metrics=["pollution"],
                observed_values={"pollution": poll},
                supporting_evidence=[
                    Evidence(
                        metric_name="pollution",
                        observed_value=f"{poll:.3f}",
                        benchmark_or_threshold="< 0.20",
                        trend="deteriorating" if poll > 0.20 else "stable",
                        interpretation=f"Pollution index above ecological absorption threshold."
                    )
                ],
                detected_epoch=f"Cycle {context.tick}"
            ))

        # 3. Clean Energy Transition Ratio
        clean_ratio = context.clean_energy_ratio
        findings.append(Finding(
            id="find-keeper-clean-power",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Renewable Geothermal & Wind Energy Ratio",
            description=f"Clean renewable power accounts for {clean_ratio * 100:.1f}% of civil power grid generation.",
            severity="informational" if clean_ratio >= 0.80 else "moderate",
            related_metrics=["clean_power_generation", "total_power_generation"],
            observed_values={"clean_energy_ratio": clean_ratio},
            supporting_evidence=[
                Evidence(
                    metric_name="clean_energy_ratio",
                    observed_value=f"{clean_ratio * 100:.1f}%",
                    benchmark_or_threshold=">= 80.0%",
                    trend="improving" if clean_ratio >= 0.80 else "neutral",
                    interpretation=f"Geothermal/wind power accounts for {clean_ratio * 100:.1f}% of grid capacity."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []
        poll = context.pollution
        env = context.environmental_health

        if poll > 0.25 or env < 0.65:
            risks.append(Risk(
                id="risk-keeper-ecocide",
                advisor_id=self.advisor_id,
                title="Ecological Degradation & Runoff Contamination",
                description="Unchecked industrial particulate emissions risk poisoning municipal aquifers and triggering ecological collapse.",
                probability="High" if poll > 0.35 else "Moderate",
                potential_impact="Severe",
                severity="High" if poll > 0.30 else "Moderate",
                time_horizon="Mid-term (10-20 cycles)",
                supporting_finding_ids=["find-keeper-env-health", "find-keeper-pollution"],
                mitigation_strategy="Enact ecological transition subsidies to mandate scrubbers across foundries and factories.",
                confidence=0.91
            ))

        # Explicit missing data note
        if "forest_canopy_coverage_km2" in context.missing_indicators:
            risks.append(Risk(
                id="risk-keeper-canopy-gap",
                advisor_id=self.advisor_id,
                title="Forest Canopy & Biodiversity Species Blindspot",
                description="Exact forest canopy square meterage and micro-faunal extinction indices are unmodelled in simulation.",
                probability="Unavailable",
                potential_impact="Minor",
                severity="Low",
                time_horizon="Long-term (50+ cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Monitor macro environmental health score as composite planetary proxy.",
                confidence=0.66
            ))

        return risks

    def generate_recommendations(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk]
    ) -> List[IntelligenceRecommendation]:
        recs = []

        # If pollution is above 0.15 and clean energy subsidies policy not active
        has_subsidies = any(p.get("id") == "clean_energy_subsidies" for p in context.active_policies)
        if context.pollution > 0.15 and not has_subsidies:
            recs.append(IntelligenceRecommendation(
                id="rec-keeper-subsidies",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Enact Ecological Transition Subsidies",
                description="Grant state subsidies and tax deductions for factories deploying particulate scrubbers and geothermal loops.",
                reason=f"Industrial pollution ({context.pollution:.3f}) exceeds target threshold. Subsidies reduce pollution by 12% and raise environmental health by +0.07.",
                category="Ecological",
                priority="High" if context.pollution > 0.25 else "Medium",
                expected_benefits=[
                    "+0.07 Environmental health index boost",
                    "-0.12 Net reduction in industrial particulate pollution",
                    "Preserves pristine aquifer tables for provincial settlements"
                ],
                potential_risks=[
                    "Requires 350 GRC implementation subsidy grant",
                    "May temporarily reduce industrial foundry net margins by ~2%"
                ],
                suggested_actions=[
                    "Table 'Ecological Transition Subsidies' in the High Policy Laboratory"
                ],
                supporting_finding_ids=["find-keeper-pollution", "find-keeper-env-health"],
                monitoring_indicators=["pollution", "environmental_health"],
                estimated_cost_crc=350.0,
                political_capital_req=90.0,
                confidence=0.93
            ))

        # If clean energy ratio is below 85%
        if context.clean_energy_ratio < 0.85:
            recs.append(IntelligenceRecommendation(
                id="rec-keeper-wind-array",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Commission Wind Turbine & Biosphere Array",
                description="Erect high-altitude wind turbine array paired with biological buffer strips along industrial boundaries.",
                reason=f"Clean power ratio stands at {context.clean_energy_ratio * 100:.1f}%. Expansion adds 35 MW clean energy and absorbs localized emissions.",
                category="Infrastructure",
                priority="Medium",
                expected_benefits=[
                    "+35 MW Zero-emission clean energy generation",
                    "+0.06 Planetary environmental health score improvement"
                ],
                potential_risks=[
                    "Consumes 1,200 materials tons and 100 GRC installation cost",
                    "Requires dedicated territorial zoning coordinates"
                ],
                suggested_actions=[
                    "Authorize wind turbine array development in open provincial plains"
                ],
                supporting_finding_ids=["find-keeper-clean-power"],
                monitoring_indicators=["clean_energy_ratio", "environmental_health"],
                estimated_cost_crc=100.0,
                political_capital_req=60.0,
                confidence=0.90
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        env = context.environmental_health
        poll = context.pollution

        if poll > 0.25:
            return (
                f"Sovereign Directorate, the living biosphere cries out in distress. "
                f"Factory smog and toxic runoff have pushed our pollution index to {poll:.3f}. "
                "Nature commands what mankind merely borrows; if we choke the soil and skies, our great cities will inherit only poisoned dust."
            )
        else:
            return (
                f"Sovereign Leader, the ecological harmonies of our realm remain well-ordered. "
                f"With environmental health at {env:.3f} and clean power generation at {context.clean_energy_ratio * 100:.1f}%, "
                "our civilization demonstrates that monumental grandeur need not come at the expense of our planetary cradle."
            )
