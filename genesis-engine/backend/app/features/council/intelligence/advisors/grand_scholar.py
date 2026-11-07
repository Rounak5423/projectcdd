"""
CIVORA — Council Advisor Intelligence: The Grand Scholar
Analyses scientific velocity, tech tree unlocks, cognitive independence, and the AI dependency paradox.
"""

from typing import List
from app.features.council.constants import ADVISOR_SCHOLAR
from app.features.council.intelligence.base import BaseAdvisor
from app.features.council.intelligence.context import CivilisationContext
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation


class GrandScholarAdvisor(BaseAdvisor):
    advisor_id = ADVISOR_SCHOLAR
    advisor_name = "Dr. Elenora Vance"
    advisor_title = "The Grand Scholar"
    domain = "Science and Knowledge"

    required_indicators = {
        "research_points",
        "research_rate",
        "unlocked_technologies",
        "researching_technologies",
        "avg_reasoning",
        "avg_ai_dependency",
        "macro_innovation_index",
        "patent_registry",
    }

    def evaluate_findings(self, context: CivilisationContext) -> List[Finding]:
        findings = []

        # 1. Macro Collective Innovation Index (Cognitive Resilience)
        macro_inn = context.macro_innovation_index
        avg_reasoning = context.avg_reasoning
        avg_dep = context.avg_ai_dependency

        if macro_inn < 0.65:
            severity = "critical"
            desc = f"Collective innovation index has dropped to {macro_inn:.3f}. Severe civilian cognitive complacency and problem-solving atrophy detected."
        elif macro_inn < 0.75:
            severity = "high"
            desc = f"Macro innovation index depressed at {macro_inn:.3f}. High algorithmic dependency ({avg_dep * 100:.1f}%) is degrading independent critical reasoning."
        elif macro_inn < 0.85:
            severity = "moderate"
            desc = f"Macro innovation index stands at {macro_inn:.3f}. Cognitive independence ({avg_reasoning:.3f}) remains stable under current automated tool access."
        else:
            severity = "informational"
            desc = f"Macro innovation index is exceptional at {macro_inn:.3f}. Populous displays high intellectual vitality."

        findings.append(Finding(
            id="find-scholar-macro-innovation",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Macro Collective Innovation & Epistemic Health",
            description=desc,
            severity=severity,
            related_metrics=["macro_innovation_index", "avg_reasoning", "avg_ai_dependency"],
            observed_values={
                "macro_innovation_index": macro_inn,
                "avg_independent_reasoning": avg_reasoning,
                "avg_ai_dependency": avg_dep,
            },
            supporting_evidence=[
                Evidence(
                    metric_name="macro_innovation_index",
                    observed_value=f"{macro_inn:.3f}",
                    benchmark_or_threshold=">= 0.80",
                    trend="stable" if macro_inn >= 0.75 else "deteriorating",
                    interpretation=f"Cognitive equilibrium: 60% reasoning ({avg_reasoning:.2f}) + 40% agency (1 - {avg_dep:.2f})."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 2. Research Velocity & Accumulated Science
        rp = context.research_points
        rate = context.research_rate
        findings.append(Finding(
            id="find-scholar-research-velocity",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Academic Research Throughput & Point Accrual",
            description=f"Great Academy labs generating {rate:+.1f} research points/cycle with {rp:.0f} accumulated scientific reserves.",
            severity="informational" if rate >= 25.0 else "moderate",
            related_metrics=["research_points", "research_rate"],
            observed_values={"research_points": rp, "research_rate": rate},
            supporting_evidence=[
                Evidence(
                    metric_name="research_rate",
                    observed_value=f"{rate:+.1f} pts/cycle",
                    benchmark_or_threshold=">= +30.0 pts/cycle",
                    trend="improving" if rate >= 30.0 else "stable",
                    interpretation="Laboratory throughput supporting active discovery vectors."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        # 3. Technological Horizon Analysis
        locked_count = len([t for t in context.unlocked_technologies])
        active_tech = context.researching_technologies[0]["name"] if context.researching_technologies else "None"
        findings.append(Finding(
            id="find-scholar-tech-horizon",
            advisor_id=self.advisor_id,
            domain=self.domain,
            title="Scientific Discovery Tree Progression",
            description=f"{locked_count} major foundational paradigms mastered. Active discovery vector: '{active_tech}'.",
            severity="informational",
            related_metrics=["unlocked_technologies", "researching_technologies"],
            observed_values={"unlocked_count": locked_count, "active_research": active_tech},
            supporting_evidence=[
                Evidence(
                    metric_name="active_discovery",
                    observed_value=active_tech,
                    benchmark_or_threshold="Active vector required",
                    trend="stable",
                    interpretation="Laboratory personnel fully engaged in research pursuit."
                )
            ],
            detected_epoch=f"Cycle {context.tick}"
        ))

        return findings

    def identify_risks(self, context: CivilisationContext, findings: List[Finding]) -> List[Risk]:
        risks = []

        # Cognitive Atrophy Paradox Risk
        has_scaffold = any(p.get("id") == "cognitive_scaffolding" for p in context.active_policies)
        if context.avg_ai_dependency > 0.35 and not has_scaffold:
            risks.append(Risk(
                id="risk-scholar-atrophy",
                advisor_id=self.advisor_id,
                title="Synthetic Complacency & Cognitive Atrophy",
                description="Unscaffolded algorithmic assistance causes progressive atrophy in civilian critical reasoning and epistemic independence.",
                probability="High" if context.avg_ai_dependency > 0.50 else "Moderate",
                potential_impact="Severe",
                severity="High" if context.avg_ai_dependency > 0.50 else "Moderate",
                time_horizon="Mid-term (10-20 cycles)",
                supporting_finding_ids=["find-scholar-macro-innovation"],
                mitigation_strategy="Enact Cognitive Scaffolding Mandate to introduce inquiry-based friction into AI copilot tools.",
                confidence=0.94
            ))

        # Explicit missing data note
        if "patent_registry" in context.missing_indicators:
            risks.append(Risk(
                id="risk-scholar-patent-gap",
                advisor_id=self.advisor_id,
                title="Patent Royalty & Intellectual Rights Blindspot",
                description="Micro-layer patent claims and private corporate research monopolies are unmodelled in simulation.",
                probability="Unavailable",
                potential_impact="Minor",
                severity="Low",
                time_horizon="Long-term (50+ cycles)",
                supporting_finding_ids=[],
                mitigation_strategy="Treat scientific breakthroughs as open civilisational knowledge commons.",
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

        # Propose Cognitive Scaffolding if not active
        has_scaffold = any(p.get("id") == "cognitive_scaffolding" for p in context.active_policies)
        if not has_scaffold and context.avg_ai_dependency > 0.20:
            recs.append(IntelligenceRecommendation(
                id="rec-scholar-scaffolding",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Enforce Cognitive Scaffolding Mandate",
                description="Mandate Socratic questioning and cognitive friction in algorithmic copilots across schools and workplaces.",
                reason="Prevents autonomous tool complacency and preserves independent reasoning ($R$) without reducing task efficiency.",
                category="Policy",
                priority="High" if context.macro_innovation_index < 0.80 else "Medium",
                expected_benefits=[
                    "+0.80 Cognitive atrophy mitigation rate",
                    "+0.004 Growth rate in citizen independent reasoning",
                    "Maintains Macro Innovation Index above 0.80 benchmark"
                ],
                potential_risks=[
                    "Imposes minor initial friction on corporate workflow speeds",
                    "Requires 200 GRC implementation and teacher retraining cost"
                ],
                suggested_actions=[
                    "Enact 'Cognitive Scaffolding Mandate' policy in policy laboratory"
                ],
                supporting_finding_ids=["find-scholar-macro-innovation"],
                monitoring_indicators=["macro_innovation_index", "avg_reasoning", "avg_ai_dependency"],
                estimated_cost_crc=200.0,
                political_capital_req=100.0,
                confidence=0.95
            ))

        # Propose Research Hub upgrade if research points accumulation is slow
        if context.research_rate < 50.0:
            recs.append(IntelligenceRecommendation(
                id="rec-scholar-hub-upgrade",
                advisor_id=self.advisor_id,
                advisor_name=self.advisor_name,
                advisor_title=self.advisor_title,
                domain=self.domain,
                title="Commission Quantum Telemetry Mesh",
                description="Equip academic laboratories with distributed quantum sensory arrays to accelerate science breakthrough velocity.",
                reason=f"Current research rate ({context.research_rate:+.1f} pts/cycle) slows breakthrough discovery across technology tiers.",
                category="Research",
                priority="Medium",
                expected_benefits=[
                    "+20.0 pts/cycle increase in baseline scientific throughput",
                    "Unlocks advanced simulation scenarios and paradox modeling"
                ],
                potential_risks=[
                    "Consumes 400 GRC and 800 energy MW grid capacity",
                    "Draws skilled engineering workforce away from industrial foundries"
                ],
                suggested_actions=[
                    "Prioritize 'Quantum Telemetry Mesh' in research discovery tree"
                ],
                supporting_finding_ids=["find-scholar-research-velocity"],
                monitoring_indicators=["research_rate", "research_points"],
                estimated_cost_crc=400.0,
                political_capital_req=80.0,
                confidence=0.91
            ))

        return recs

    def compose_formal_speech(
        self,
        context: CivilisationContext,
        findings: List[Finding],
        risks: List[Risk],
        recommendations: List[IntelligenceRecommendation]
    ) -> str:
        macro_inn = context.macro_innovation_index
        avg_dep = context.avg_ai_dependency

        if macro_inn < 0.75:
            return (
                f"Sovereign Directorate, the Great Academy raises an urgent philosophical warning. "
                f"While algorithmic automation expands gross output, our civilian critical reasoning is decaying. "
                f"With AI dependency at {avg_dep * 100:.1f}%, our Macro Innovation Index has contracted to {macro_inn:.3f}. "
                "We must mandate cognitive scaffolding before the minds of our citizens atrophy beyond reclamation."
            )
        else:
            return (
                f"Sovereign Leader, our civilization advances boldly upon the frontiers of knowledge. "
                f"With a Macro Innovation score of {macro_inn:.3f} and research throughput of {context.research_rate:+.1f} points/cycle, "
                "our scholars stand poised to unravel the deepest mysteries of the artificial cosmos."
            )
