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

        # 7. Longitudinal Gradual Assimilation Trajectory & Research Predictions
        longitudinal_trajectory = self._generate_longitudinal_trajectory(
            name, category, overall_approval, happiness_delta, stability_delta, research_delta, is_research
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
                "citizen_quotes": quotes,
                "longitudinal_trajectory": longitudinal_trajectory
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
        """Synthesizes high-stakes discussion among the 6 sovereign Royal Council Advisors."""
        # 1. Chancellor Aurelius Vane (Governance & Society)
        if approval >= 60 and d_stab >= 0:
            chancellor_vote = "Yea"
            chancellor_arg = f"Order and legitimacy flourish when the Directorate acts with clear purpose. '{name}' reinforces civic covenant and stabilizes communal expectations."
        elif approval < 45 or d_stab < -1.0:
            chancellor_vote = "Nay"
            chancellor_arg = f"Caution, Governor. Our civic wardens report unrest in the outer quarters. Forcing '{name}' without preparatory assemblies will strain public obedience."
        else:
            chancellor_vote = "Abstain"
            chancellor_arg = "The populace is divided. If enacted, ensure local magistrates provide transparent briefings to maintain civil tranquility."

        # 2. High Treasurer Lady Vivienne Moray (Economy & Finance)
        if cost > 350 and not (is_welfare and approval > 70):
            treasurer_vote = "Nay" if cost > 450 else "Abstain"
            treasurer_arg = f"A capital expenditure of {cost:.0f} Political Capital requires unyielding discipline. We must verify this outlay does not drain our sovereign mint."
        elif not is_research and not is_green:
            treasurer_vote = "Yea"
            treasurer_arg = f"Gold is the silent general of civilization. Commercial indices confirm '{name}' establishes regulatory certainty and stimulates guild enterprise."
        else:
            treasurer_vote = "Yea"
            treasurer_arg = "Prudent long-term asset allocation. Compounding fiscal velocity will easily offset the initial treasury commitment."

        # 3. Grand Scholar Arch-Librarian Cynthia Sol (Science & Knowledge)
        if is_research:
            scholar_vote = "Yea"
            scholar_arg = f"Glorious intellectual leap! '{name}' unleashes experimental energy across our observatories and academies. The empirical knowledge gained will redefine our civilization."
        elif is_green:
            scholar_vote = "Yea"
            scholar_arg = "Empirical natural science confirms that systemic ecological balance is essential for continuous laboratory breakthroughs."
        elif cost > 400:
            scholar_vote = "Abstain"
            scholar_arg = f"While politically expedient, committing {cost:.0f} Capital without dedicated laboratory grants slows our research trajectory."
        else:
            scholar_vote = "Yea"
            scholar_arg = "Acceptable societal baseline. It leaves our research enclaves unhindered to pursue higher discoveries."

        # 4. Royal Architect Master Mason Titus Varr (Infrastructure & Development)
        if any(k in (category + name + description).lower() for k in ["infrastructure", "labor", "automation", "building", "industry"]):
            architect_vote = "Yea"
            architect_arg = f"Sound structural engineering! '{name}' aligns logistics corridors and gives our craft guilds clear blueprints for expansion."
        elif cost > 400:
            architect_vote = "Abstain"
            architect_arg = "Capital should be poured into stone, aqueducts, and roads. Ensure civic works are not starved of resources."
        else:
            architect_vote = "Yea"
            architect_arg = "Logistics grids and civic works can readily accommodate this edict without physical disruption."

        # 5. High Physician Curate Elena Sylvan (Health & Wellbeing)
        if is_welfare or d_happy > 1.0 or any(k in (category + name + description).lower() for k in ["health", "care", "welfare", "food"]):
            physician_vote = "Yea"
            physician_arg = f"The vital spirits of our citizens are fortified! When the state relieves hardship, infant mortality declines and public vitality reaches its zenith."
        elif d_happy < -1.5:
            physician_vote = "Nay"
            physician_arg = f"Stress and anxiety are spreading through the common wards. Prolonged psychological strain under '{name}' will depress vitality."
        else:
            physician_vote = "Yea" if approval >= 50 else "Abstain"
            physician_arg = "Vitality monitors show stable baseline health. We endorse as long as medical rations remain untouched."

        # 6. Keeper of Nature Ranger General Kaelen Thorne (Environment & Ecology)
        if is_green:
            keeper_vote = "Yea"
            keeper_arg = f"The planetary biosphere breathes a sigh of relief! Protecting our forests, soils, and aquifers guarantees our descendants will inherit a living world."
        elif "pollution" in description.lower() or "mineral" in description.lower() or cost > 450:
            keeper_vote = "Nay" if "pollution" in description.lower() else "Abstain"
            keeper_arg = "Nature maintains an unforgiving ledger. Ensure industrial emissions and resource extraction do not exceed regenerative bounds."
        else:
            keeper_vote = "Yea"
            keeper_arg = "The ecological impact falls within safe biospheric carrying capacities. Planetary wardens approve."

        # Tally
        votes = [chancellor_vote, treasurer_vote, scholar_vote, architect_vote, physician_vote, keeper_vote]
        yeas = votes.count("Yea")
        nays = votes.count("Nay")
        abstains = votes.count("Abstain")

        chamber_status = "Approved by Royal Council Consensus" if yeas >= 4 else ("Split Council Deliberation" if yeas >= 3 else "High Council Contention")

        advisors = [
            {
                "id": "adv-chancellor",
                "name": "Aurelius Vane",
                "title": "The Chancellor of the Realm",
                "domain": "Governance and Society",
                "avatar": "🏛️",
                "vote": chancellor_vote,
                "argument": chancellor_arg,
                "domain_priority": "Civic Order & Institutional Trust"
            },
            {
                "id": "adv-treasurer",
                "name": "Lady Vivienne Moray",
                "title": "The High Treasurer",
                "domain": "Economy and Finance",
                "avatar": "⚖️",
                "vote": treasurer_vote,
                "argument": treasurer_arg,
                "domain_priority": "Fiscal Solvency & Resource Productivity"
            },
            {
                "id": "adv-scholar",
                "name": "Arch-Librarian Cynthia Sol",
                "title": "The Grand Scholar",
                "domain": "Science and Knowledge",
                "avatar": "🔬",
                "vote": scholar_vote,
                "argument": scholar_arg,
                "domain_priority": "Empirical Research & Epistemic Progress"
            },
            {
                "id": "adv-architect",
                "name": "Master Mason Titus Varr",
                "title": "The Royal Architect",
                "domain": "Infrastructure and Development",
                "avatar": "📐",
                "vote": architect_vote,
                "argument": architect_arg,
                "domain_priority": "Structural Integrity & Municipal Works"
            },
            {
                "id": "adv-physician",
                "name": "Curate Elena Sylvan",
                "title": "The High Physician",
                "domain": "Health and Wellbeing",
                "avatar": "🕊️",
                "vote": physician_vote,
                "argument": physician_arg,
                "domain_priority": "Public Vitality & Humanitarian Care"
            },
            {
                "id": "adv-keeper",
                "name": "Ranger General Kaelen Thorne",
                "title": "The Keeper of Nature",
                "domain": "Environment and Ecology",
                "avatar": "🌿",
                "vote": keeper_vote,
                "argument": keeper_arg,
                "domain_priority": "Biospheric Carrying Capacity"
            }
        ]

        return {
            "chamber_status": chamber_status,
            "vote_summary": {"yea": yeas, "nay": nays, "abstain": abstains, "total": 6},
            "advisors": advisors,
            "proposer_right": "As Sovereign Governor, you hold Supreme Imperial Veto and Enactment Decree."
        }

    def _generate_longitudinal_trajectory(
        self, name: str, category: str, approval: float, d_happy: float, d_stab: float, d_research: float, is_research: bool
    ) -> Dict[str, Any]:
        """Synthesizes the gradual 3-phase evolutionary assimilation curve and empirical research discovery."""
        breakthrough_title = f"Empirical Synthesis: Dynamic Equilibrium of {name}"
        if is_research:
            discovery_desc = f"Longitudinal observation reveals a compounding +{d_research:.1f}% research throughput dividend. Cognitive tools and academic autonomy synthesize accelerated breakthrough frequency."
        elif d_happy > 0:
            discovery_desc = f"Longitudinal monitoring validates profound civic dividend: citizen morale stabilizes at +{d_happy:.1f} pts, dampening generational unrest and raising communal productivity."
        else:
            discovery_desc = f"Empirical field trials demonstrate structural resilience: despite initial implementation friction, administrative systems achieved +{abs(d_stab):.1f} pts civic stability."

        return {
            "assimilation_curve": [
                {
                    "phase": "Phase 1: Implementation Friction",
                    "timeframe": "Days 1 – 20",
                    "adoption_pct": 25,
                    "measured_delta": round(d_happy * 0.25 - 0.8, 1),
                    "citizen_reaction": "Initial loss aversion and procedural skepticism as households adapt to revised municipal directives."
                },
                {
                    "phase": "Phase 2: Societal Assimilation",
                    "timeframe": "Days 21 – 60",
                    "adoption_pct": 65,
                    "measured_delta": round(d_happy * 0.65, 1),
                    "citizen_reaction": "Widespread routine adjustment. Municipal guilds and research institutes report tangible efficiency gains."
                },
                {
                    "phase": "Phase 3: Mature Equilibrium",
                    "timeframe": "Days 60+",
                    "adoption_pct": 100,
                    "measured_delta": round(d_happy, 1),
                    "citizen_reaction": "Permanent cultural and infrastructural integration. The policy yields compounding societal dividends."
                }
            ],
            "breakthrough": {
                "title": breakthrough_title,
                "discovery": discovery_desc,
                "research_reward_grc": 250,
                "research_reward_xp": 500
            }
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

