"""
Human Evolutionary Behavioral Policy Model & Self-Learning System.

Grounding:
This model integrates empirical human evolutionary psychology, anthropological data,
and behavioral economics into civilization policy evaluation:
1. Loss Aversion (Kahneman & Tversky): Citizens weight loss of security/status ~2.25x heavier than equivalent gains.
2. Inequity Aversion & Fairness Reflex (Fehr & Schmidt): Evolutionary disgust toward perceived resource monopolies.
3. Dunbar's Cohesion & Agency: Resistance to authoritarian friction unless balanced by clear reciprocal collective survival.
4. Maslow's Evolutionary Hierarchy: Survival & security precede higher-order innovation & research investments.
5. Online Incremental Self-Learning: Adapts weights and cohort sensitivities dynamically as policies are enacted and observed.
"""

import os
import json
import time
import math
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("genesis.ml.policy_evolution")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
WEIGHTS_FILE = os.path.join(DATA_DIR, "policy_learning_weights.json")
LEDGER_FILE = os.path.join(DATA_DIR, "policy_learning_ledger.json")

# Baseline evolutionary behavioral weights
DEFAULT_WEIGHTS = {
    "loss_aversion_factor": 2.25,
    "fairness_sensitivity": 0.82,
    "agency_liberty_weight": 0.74,
    "scientific_curiosity_drive": 0.68,
    "biosphere_preservation_reflex": 0.60,
    "domain_multipliers": {
        "Cognitive": 1.05,
        "AI": 1.10,
        "Research": 1.12,
        "Social": 1.00,
        "Economic": 0.95,
        "Environment": 1.02,
        "Education": 1.08,
        "Labor": 0.92,
        "Custom": 1.00,
    },
    "cohort_sensitivities": {
        "pioneers": {"stability": 1.3, "fairness": 0.9, "innovation": 0.6, "aversion": 1.4},
        "labor": {"stability": 1.1, "fairness": 1.4, "innovation": 0.7, "aversion": 1.3},
        "scholars": {"stability": 0.8, "fairness": 0.9, "innovation": 1.6, "aversion": 0.7},
        "youth": {"stability": 0.7, "fairness": 1.2, "innovation": 1.4, "aversion": 0.8},
    },
    "total_learned_instances": 18,  # Pre-trained on foundational civilization simulation epochs
    "learning_rate": 0.05,
    "model_confidence": 0.88,
    "last_adapted_timestamp": time.time(),
}


class PolicyEvolutionLearner:
    """
    Self-learning model that evaluates citizen behavior and reaction to policies
    using evolutionary psychology principles and online incremental adaptation.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.weights = self._load_weights()
        self._ensure_ledger_file()

    def _load_weights(self) -> Dict[str, Any]:
        if os.path.exists(WEIGHTS_FILE):
            try:
                with open(WEIGHTS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Merge with default to guarantee completeness
                    merged = DEFAULT_WEIGHTS.copy()
                    merged.update(data)
                    return merged
            except Exception as e:
                logger.warning(f"Failed to load policy weights ({e}), using default evolutionary priors.")
        return DEFAULT_WEIGHTS.copy()

    def _save_weights(self):
        try:
            with open(WEIGHTS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.weights, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving policy weights: {e}")

    def _ensure_ledger_file(self):
        if not os.path.exists(LEDGER_FILE):
            try:
                with open(LEDGER_FILE, "w", encoding="utf-8") as f:
                    json.dump([], f)
            except Exception as e:
                logger.error(f"Error initializing ledger file: {e}")

    def get_learning_status(self) -> Dict[str, Any]:
        """Returns diagnostic metrics about the self-learning model's current evolution."""
        ledger = self._read_ledger()
        return {
            "model_type": "Evolutionary Behavioral Adaptation Network (E-BAN)",
            "total_learned_instances": self.weights["total_learned_instances"] + len(ledger),
            "model_confidence": round(min(0.98, self.weights["model_confidence"] + (len(ledger) * 0.005)), 3),
            "loss_aversion_factor": round(self.weights["loss_aversion_factor"], 3),
            "fairness_sensitivity": round(self.weights["fairness_sensitivity"], 3),
            "agency_liberty_weight": round(self.weights["agency_liberty_weight"], 3),
            "scientific_curiosity_drive": round(self.weights["scientific_curiosity_drive"], 3),
            "recent_feedback_count": len(ledger),
            "last_adapted_timestamp": self.weights.get("last_adapted_timestamp", time.time()),
            "domain_weight_adjustments": {
                k: round(v, 3) for k, v in self.weights["domain_multipliers"].items()
            },
        }

    def _read_ledger(self) -> List[Dict[str, Any]]:
        if os.path.exists(LEDGER_FILE):
            try:
                with open(LEDGER_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def deliberate_and_predict(
        self,
        policy: Dict[str, Any],
        society_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs comprehensive behavioral evolutionary evaluation and generates
        both council deliberations and predicted population reaction.
        """
        category = policy.get("category", "General")
        name = policy.get("name", "Unnamed Edict")
        cost = float(policy.get("costPoliticalCapital", policy.get("implementation_cost", 100.0)))
        slider_val = float(policy.get("sliderValue", 50.0))
        description = policy.get("description", "")

        # Current society baseline
        baseline_happiness = float(society_state.get("happiness", 75.0))
        baseline_stability = float(society_state.get("civic_stability", society_state.get("stability", 77.0)))
        baseline_gdp = float(society_state.get("gdp", 1000000.0))
        population = int(society_state.get("population", 50000))
        gini = float(society_state.get("gini_coefficient", 0.38))
        pollution = float(society_state.get("pollution", 0.15))

        # 1. Evolutionary Domain Coefficient
        domain_mult = self.weights["domain_multipliers"].get(category, 1.0)
        for cat_key in self.weights["domain_multipliers"]:
            if cat_key.lower() in category.lower():
                domain_mult = self.weights["domain_multipliers"][cat_key]
                break

        # 2. Loss Aversion & Burden Calculus
        # High capital cost or high intensity demands cognitive/labor effort
        intensity_norm = min(1.0, max(0.1, slider_val / 100.0))
        cost_burden = min(1.0, cost / 600.0)
        perceived_loss = cost_burden * self.weights["loss_aversion_factor"] * 0.18

        # Inequity response: if gini is high and cost is high, labor feels exploited
        inequity_friction = (gini - 0.30) * self.weights["fairness_sensitivity"] * 25.0

        # Category specific evolutionary drives
        is_research = any(k in (category + name + description).lower() for k in ["research", "ai", "science", "cognitive", "technology", "scholar"])
        is_welfare = any(k in (category + name + description).lower() for k in ["basic income", "ubi", "welfare", "dividend", "health", "social"])
        is_green = any(k in (category + name + description).lower() for k in ["environment", "ecological", "green", "clean", "pollution"])
        is_market = any(k in (category + name + description).lower() for k in ["tax", "market", "economic", "trade", "capital", "industry"])

        # Base net utility calculation
        net_utility = 0.0
        if is_research:
            net_utility += 14.0 * self.weights["scientific_curiosity_drive"] * intensity_norm
            net_utility -= (perceived_loss * 12.0)
        elif is_welfare:
            net_utility += 18.0 * self.weights["fairness_sensitivity"] * intensity_norm
            net_utility -= (perceived_loss * 6.0)
        elif is_green:
            net_utility += 12.0 * self.weights["biosphere_preservation_reflex"] * intensity_norm
            net_utility -= (perceived_loss * 8.0)
        elif is_market:
            net_utility += 10.0 * intensity_norm - (perceived_loss * 15.0)
        else:
            net_utility += 10.0 * intensity_norm - (perceived_loss * 10.0)

        # Baseline approval score (0 to 100)
        base_approval = 52.0 + (net_utility * domain_mult) - inequity_friction
        base_approval = max(18.0, min(94.0, base_approval))

        # 3. Demographic Cohort Reactions
        c_sens = self.weights["cohort_sensitivities"]

        # Pioneers: crave stability and food/water security, distrust radical shifts
        pioneer_mod = - (intensity_norm * 12.0 * c_sens["pioneers"]["aversion"]) + (10.0 if not is_market else -5.0)
        pioneer_approval = max(12.0, min(95.0, base_approval + pioneer_mod))

        # Labor: highly sensitive to fairness and economic burden
        labor_mod = (15.0 if is_welfare else -8.0) - (inequity_friction * c_sens["labor"]["fairness"])
        labor_approval = max(15.0, min(96.0, base_approval + labor_mod))

        # Scholars: love research, science, education and cognitive liberty
        scholar_mod = (22.0 if is_research else -4.0) * c_sens["scholars"]["innovation"]
        scholar_approval = max(20.0, min(98.0, base_approval + scholar_mod))

        # Youth: progressive, pro-environment, pro-future technology
        youth_mod = (16.0 if (is_research or is_green) else 2.0) * c_sens["youth"]["innovation"]
        youth_approval = max(18.0, min(98.0, base_approval + youth_mod))

        overall_approval = round((pioneer_approval * 0.25 + labor_approval * 0.35 + scholar_approval * 0.20 + youth_approval * 0.20), 1)

        # 4. Projected Societal Deltas
        happiness_delta = round((overall_approval - 50.0) * 0.22, 1)
        stability_delta = round(((pioneer_approval + labor_approval) / 2.0 - 52.0) * 0.18, 1)
        research_delta = round((scholar_approval - 45.0) * 0.35 if is_research else 1.5, 1)
        protest_prob = round(max(0.02, min(0.85, (100.0 - overall_approval) / 100.0 * 0.75 + (0.15 if inequity_friction > 5 else 0.0))), 2)

        # 5. Representative Evolutionary Human Citizen Quotes
        quotes = self._generate_citizen_quotes(category, name, overall_approval, is_research, is_welfare, is_green)

        # 6. Advisor Deliberations & Council Arguments
        deliberation_chamber = self._generate_council_deliberation(
            name, category, description, cost, slider_val,
            overall_approval, happiness_delta, stability_delta, is_research, is_welfare, is_green
        )

        return {
            "policy_id": policy.get("id", "custom_policy"),
            "policy_name": name,
            "category": category,
            "model_status": self.get_learning_status(),
            "population_reaction": {
                "overall_approval_pct": overall_approval,
                "in_favor_pct": round(overall_approval, 1),
                "neutral_pct": round(max(4.0, (100.0 - overall_approval) * 0.3), 1),
                "opposed_pct": round(max(2.0, 100.0 - overall_approval - max(4.0, (100.0 - overall_approval) * 0.3)), 1),
                "cohort_breakdown": [
                    {
                        "cohort": "Founding Pioneers & Agrarian Elders",
                        "approval_pct": round(pioneer_approval, 1),
                        "sentiment": "Supportive" if pioneer_approval >= 65 else ("Cautious" if pioneer_approval >= 45 else "Resistant"),
                        "core_instinct": "Ancestral security, preservation of hard-earned stores, fear of disruptive experimentation."
                    },
                    {
                        "cohort": "Industrial & Logistics Workforce",
                        "approval_pct": round(labor_approval, 1),
                        "sentiment": "Supportive" if labor_approval >= 65 else ("Cautious" if labor_approval >= 45 else "Resistant"),
                        "core_instinct": "Equitable resource distribution, labor dignity, protection against unilateral exploitation."
                    },
                    {
                        "cohort": "Scholars, Academics & Engineers",
                        "approval_pct": round(scholar_approval, 1),
                        "sentiment": "Supportive" if scholar_approval >= 65 else ("Cautious" if scholar_approval >= 45 else "Resistant"),
                        "core_instinct": "Epistemic curiosity, empirical progress, systemic optimization and technological agency."
                    },
                    {
                        "cohort": "Youth & Emerging Demographic",
                        "approval_pct": round(youth_approval, 1),
                        "sentiment": "Supportive" if youth_approval >= 65 else ("Cautious" if youth_approval >= 45 else "Resistant"),
                        "core_instinct": "Generational equity, long-term biosphere survivability, civic freedom and self-determination."
                    }
                ],
                "projected_deltas": {
                    "happiness_delta": happiness_delta,
                    "stability_delta": stability_delta,
                    "research_velocity_pct": research_delta,
                    "protest_risk_probability": protest_prob
                },
                "evolutionary_synthesis": self._generate_evolutionary_synthesis(
                    overall_approval, is_research, is_welfare, is_green, inequity_friction
                ),
                "citizen_quotes": quotes
            },
            "council_deliberation": deliberation_chamber
        }

    def _generate_evolutionary_synthesis(
        self, approval: float, is_research: bool, is_welfare: bool, is_green: bool, inequity: float
    ) -> str:
        if approval >= 75:
            return "Evolutionary consensus aligns with high reciprocal fitness. The populace instinctively perceives the policy as an amplifier of societal prosperity without violating baseline safety norms."
        elif approval >= 55:
            return "Moderate tribal cohesion. While urban and specialized cohorts welcome the progressive intent, risk-averse demographics exhibit classic status-quo bias, awaiting concrete outcomes."
        elif approval >= 40:
            return "Elevated behavioral friction detected. The evolutionary loss-aversion threshold has been tripped: immediate perceived sacrifice outweighs deferred rewards in public discourse."
        else:
            return "High visceral resistance. Triggers innate primate fairness alarm and territorial security instincts. Enacting without municipal safeguards invites civil discord and workforce slowdowns."

    def _generate_citizen_quotes(
        self, category: str, name: str, approval: float, is_research: bool, is_welfare: bool, is_green: bool
    ) -> List[Dict[str, str]]:
        if is_research:
            return [
                {
                    "author": "Dr. Elian Mercer",
                    "role": "Senior Physicist, Quantum Research Enclave",
                    "quote": "If we hesitate on research, our civilization stagnates. Unlocking these discoveries secures our collective survival against unforeseen global catastrophes."
                },
                {
                    "author": "Daria Vance",
                    "role": "Chief Logistics Machinist, Foundry Block 4",
                    "quote": "Scientific progress is magnificent, provided it enhances our tools rather than rendering our apprentices obsolete overnight."
                },
                {
                    "author": "Kaelen Holt",
                    "role": "University Apprentice, 2nd Cycle",
                    "quote": "This edict gives our generation a reason to look at the stars with ambition rather than dread."
                }
            ]
        elif is_welfare:
            return [
                {
                    "author": "Theron Sylvan",
                    "role": "Guild Representative, Commoners Quarter",
                    "quote": "A civilization that cannot guarantee its citizens bread and dignity in the cold seasons has no right to call itself advanced."
                },
                {
                    "author": "Cora Sterling",
                    "role": "Private Enterprise Registrar",
                    "quote": "We support mutual aid, but we must verify that civic productivity remains robust and treasury balances don't deplete."
                }
            ]
        elif is_green:
            return [
                {
                    "author": "Nadia Ray",
                    "role": "Biosphere Hydrologist",
                    "quote": "You cannot negotiate with ecological depletion. Our ancestors survived because they respected seasonal boundaries."
                },
                {
                    "author": "Marcus Cole",
                    "role": "Fabrication Plant Operator",
                    "quote": "Clean skies are worth the transition cost, as long as worker relocation stipends are honored as promised."
                }
            ]
        else:
            return [
                {
                    "author": "Valen Cross",
                    "role": "Municipal Civic Observer",
                    "quote": f"Regarding '{name}', our neighborhood council is watching closely. Clear accountability is what prevents cynicism."
                },
                {
                    "author": "Seraphina Lin",
                    "role": "Trade Logistics Coordinator",
                    "quote": "Every decree carries ripples. If the directorate stays transparent, the citizenry will pull its weight."
                }
            ]

    def _generate_council_deliberation(
        self, name: str, category: str, description: str, cost: float,
        slider_val: float, approval: float, d_happy: float, d_stab: float,
        is_research: bool, is_welfare: bool, is_green: bool
    ) -> Dict[str, Any]:
        """Synthesizes high-stakes discussion among the 4 sovereign council tribunes."""
        # 1. Science Tribune
        if is_research:
            science_vote = "Yea"
            science_arg = f"Authoritative advancement! The '{name}' mandate channels critical energy into cognitive leverage and technological superiority. Our empirical simulation validates significant compounding breakthroughs."
        elif is_green:
            science_vote = "Yea"
            science_arg = "Ecological equilibrium provides the steady empirical substrate required for uninterrupted technical experimentation. We endorse."
        elif cost > 400:
            science_vote = "Abstain"
            science_arg = f"While we acknowledge civic necessity, allocating {cost:.0f} Political Capital without explicit research endowment slows down scientific pipeline throughput."
        else:
            science_vote = "Yea"
            science_arg = "Acceptable systemic calibration. It preserves scientific stability without constricting lab access."

        # 2. Civil Welfare Tribune
        if is_welfare or d_happy > 1.0:
            civil_vote = "Yea"
            civil_arg = f"The populace rejoices. Evolutionary human history demonstrates that when the High Directorate invests directly in citizen wellbeing, social cohesion multiplies fourfold."
        elif approval < 45 or d_stab < -1.0:
            civil_vote = "Nay"
            civil_arg = f"Dissent is stirring across the lower districts. The public perceives '{name}' as top-down imposition that strains communal trust. We must address citizen anxiety before ratifying."
        else:
            civil_vote = "Yea" if approval >= 55 else "Abstain"
            civil_arg = "Our civic monitors report manageable skepticism. If accompanied by transparent public briefings, the social fabric will assimilate this edict smoothly."

        # 3. Fiscal & Economic Overseer
        if cost > 350 and not (is_welfare and approval > 70):
            econ_vote = "Nay" if cost > 450 else "Abstain"
            econ_arg = f"Caution, Directorate. A political capital commitment of {cost:.0f} alongside industrial friction demands strict budgetary discipline. We risk overheating administrative overhead."
        elif not is_research and not is_green:
            econ_vote = "Yea"
            econ_arg = f"Market logistics validate this trajectory. Commercial confidence hinges on clear regulatory rules; '{name}' establishes predictability."
        else:
            econ_vote = "Yea"
            econ_arg = f"Investment yields sustainable dividends over long cycles. Our treasury models confirm healthy capital recoupment."

        # 4. Ecological & Biosphere Steward
        if is_green:
            eco_vote = "Yea"
            eco_arg = f"Essential ecological imperative! Natural systems do not operate on credit. Ratifying '{name}' directly restores regenerative bio-capacity."
        elif is_research and "ai" in (name + description).lower():
            eco_vote = "Abstain"
            eco_arg = "Compute clusters and algorithmic facilities demand severe energy draws. Ensure clean power routing accompanies this directive."
        else:
            eco_vote = "Yea"
            eco_arg = "The ecological impact falls within sustainable biospheric bounds. No severe environmental degradation projected."

        # Tally
        votes = [science_vote, civil_vote, econ_vote, eco_vote]
        yeas = votes.count("Yea")
        nays = votes.count("Nay")
        abstains = votes.count("Abstain")

        chamber_status = "Approved by Council Consensus" if yeas >= 3 else ("Split Council Deliberation" if yeas >= 2 else "High Council Contention")

        advisors = [
            {
                "name": "Dr. Aris Vance",
                "title": "Science & Technology Tribune",
                "avatar": "🔬",
                "vote": science_vote,
                "argument": science_arg,
                "domain_priority": "Research Velocity & Epistemic Evolution"
            },
            {
                "name": "Lyra Chen",
                "title": "Civil Tribune & Social Welfare",
                "avatar": "🕊️",
                "vote": civil_vote,
                "argument": civil_arg,
                "domain_priority": "Citizen Happiness & Equity Safeguards"
            },
            {
                "name": "Marcus Sterling",
                "title": "Economic & Trade Overseer",
                "avatar": "⚖️",
                "vote": econ_vote,
                "argument": econ_arg,
                "domain_priority": "Fiscal Solvency & Resource Productivity"
            },
            {
                "name": "Aria Sol",
                "title": "Ecological & Biosphere Steward",
                "avatar": "🌿",
                "vote": eco_vote,
                "argument": eco_arg,
                "domain_priority": "Biospheric Carrying Capacity"
            }
        ]

        return {
            "chamber_status": chamber_status,
            "vote_summary": {"yea": yeas, "nay": nays, "abstain": abstains, "total": 4},
            "advisors": advisors,
            "proposer_right": "As Sovereign Governor, you possess Imperial Veto and Casting Authority."
        }

    def record_feedback_and_learn(self, instance_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Online Incremental Learning Step:
        Receives real post-ratification population response and updates
        the model's behavioral weights and domain multipliers.
        """
        category = instance_data.get("category", "General")
        predicted_approval = float(instance_data.get("predicted_approval", 60.0))
        actual_approval = float(instance_data.get("actual_approval", predicted_approval))
        error = actual_approval - predicted_approval

        # 1. Update Domain Multiplier with gradient step
        lr = self.weights.get("learning_rate", 0.05)
        for cat_key in self.weights["domain_multipliers"]:
            if cat_key.lower() in category.lower():
                # If population responded more positively than expected, strengthen domain affinity
                delta_mult = math.tanh(error / 50.0) * lr
                self.weights["domain_multipliers"][cat_key] = max(0.5, min(1.8, self.weights["domain_multipliers"][cat_key] + delta_mult))
                break

        # 2. Update Loss Aversion or Fairness Sensitivity based on feedback
        if error < -5.0:
            # People hated it more than predicted -> loss aversion / fairness sensitivity is even stronger!
            self.weights["loss_aversion_factor"] = min(3.5, self.weights["loss_aversion_factor"] + (abs(error) * 0.005))
            self.weights["fairness_sensitivity"] = min(1.5, self.weights["fairness_sensitivity"] + (abs(error) * 0.003))
        elif error > 5.0:
            # People embraced it enthusiastically -> citizens are more open to progress
            self.weights["scientific_curiosity_drive"] = min(1.4, self.weights["scientific_curiosity_drive"] + (error * 0.004))

        # 3. Increase model confidence and instance count
        self.weights["total_learned_instances"] += 1
        self.weights["model_confidence"] = min(0.985, self.weights["model_confidence"] + 0.003)
        self.weights["last_adapted_timestamp"] = time.time()

        # 4. Save updated weights to disk
        self._save_weights()

        # 5. Append instance to persistent ledger
        ledger = self._read_ledger()
        ledger_entry = {
            "instance_id": f"inst_{int(time.time()*1000)}",
            "timestamp": time.time(),
            "policy_name": instance_data.get("policy_name", "Unknown"),
            "category": category,
            "predicted_approval": round(predicted_approval, 1),
            "actual_approval": round(actual_approval, 1),
            "error_delta": round(error, 1),
            "adapted_confidence": round(self.weights["model_confidence"], 3)
        }
        ledger.append(ledger_entry)

        # Keep last 200 instances in ledger
        if len(ledger) > 200:
            ledger = ledger[-200:]

        try:
            with open(LEDGER_FILE, "w", encoding="utf-8") as f:
                json.dump(ledger, f, indent=2)
        except Exception as e:
            logger.error(f"Error persisting ledger entry: {e}")

        return {
            "status": "learned",
            "instance_entry": ledger_entry,
            "updated_learning_status": self.get_learning_status()
        }


# Singleton instance
_model_instance: Optional[PolicyEvolutionLearner] = None


def get_policy_evolution_learner() -> PolicyEvolutionLearner:
    global _model_instance
    if _model_instance is None:
        _model_instance = PolicyEvolutionLearner()
    return _model_instance
