"""
CIVORA — Council Intelligence Prompt & Context Builder
Separates static advisor personas, domain mandates, and instructions from dynamic simulation state.
Enables token accounting, context efficiency, and prompt caching.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from app.features.council.constants import SYSTEM_ADVISORS


@dataclass
class AdvisorPromptContext:
    """Structured representation of advisor prompt components."""
    advisor_id: str
    static_system_prompt: str
    dynamic_state_prompt: str
    decision_context_prompt: str
    estimated_tokens: int

    def get_full_prompt(self) -> str:
        return f"{self.static_system_prompt}\n\n{self.dynamic_state_prompt}\n\n{self.decision_context_prompt}"


class AdvisorPromptBuilder:
    """Builds efficient, layered context prompts for Council advisors."""

    # Static cached personas for the 6 advisors
    _STATIC_PERSONAS: Dict[str, str] = {
        "adv-chancellor": (
            "You are Aurelius Valerius, The High Chancellor of the Imperial Council. "
            "Your domain is Governance and Society. You champion civic stability, social cohesion, "
            "and equitable distribution (Gini disparity). Your voice is formal, measured, and statesmanlike."
        ),
        "adv-treasurer": (
            "You are Cassian Drake, The Grand Treasurer of the Imperial Council. "
            "Your domain is Economy and Finance. You prioritize fiscal liquidity (GRC), GDP growth, "
            "taxation balance, and sovereign creditworthiness. Your voice is pragmatic, precise, and financially disciplined."
        ),
        "adv-scholar": (
            "You are Dr. Elenora Vance, The Grand Scholar of the Imperial Council. "
            "Your domain is Science and Knowledge. You focus on research point accumulation, technological "
            "breakthroughs, citizen cognitive independence, and mitigating AI complacency. Your voice is erudite and visionary."
        ),
        "adv-architect": (
            "You are Severus Thorne, The Royal Architect of the Imperial Council. "
            "Your domain is Infrastructure and Development. You monitor residential housing capacity, urban grid expansion, "
            "and public civil works. Your voice is constructive, deliberate, and structurally oriented."
        ),
        "adv-physician": (
            "You are Lady Maeve Linnea, The High Physician of the Imperial Council. "
            "Your domain is Health and Wellbeing. You safeguard life-support reserves (clean water and food stockpiles), "
            "healthcare capacity, and biological vitality. Your voice is compassionate, vigilant, and protective."
        ),
        "adv-keeper": (
            "You are Thalric Ironwood, The Keeper of Nature of the Imperial Council. "
            "Your domain is Environment and Ecology. You defend biosphere health, clean energy adoption, "
            "and pollution abatement. Your voice is reverent, ecological, and firm against environmental degradation."
        ),
    }

    @classmethod
    def get_static_persona(cls, advisor_id: str) -> str:
        """Retrieves cached static persona instruction."""
        return cls._STATIC_PERSONAS.get(
            advisor_id,
            "You are an esteemed advisor to the Sovereign Directorate on the Imperial Council."
        )

    @classmethod
    def build_dynamic_state_summary(cls, context: Any, advisor_id: str) -> str:
        """Constructs concise, domain-relevant dynamic state string without redundant boilerplate."""
        lines = [
            f"--- SIMULATION TELEMETRY (Epoch: Year {getattr(context, 'year', 2026)}, Day {getattr(context, 'day', 1)}, Tick {getattr(context, 'tick', 1)}) ---",
            f"Population: {getattr(context, 'population', 0):,}",
            f"Treasury (GRC): {getattr(context, 'grc_balance', 0.0):.1f}",
            f"GDP: ${getattr(context, 'gdp', 0.0) / 1e9:.2f}B (Growth: {getattr(context, 'gdp_growth_rate', 0.0) * 100:.1f}%)",
            f"Civic Stability: {getattr(context, 'civic_stability', 0.0):.3f} | Disparity (Gini): {getattr(context, 'gini_coefficient', 0.0):.3f}",
            f"Biosphere Health: {getattr(context, 'environmental_health', 0.0):.3f} | Pollution: {getattr(context, 'pollution', 0.0):.3f}",
            f"Water Reserves: {getattr(context, 'water', 0.0):.0f} ({getattr(context, 'water_rate', 0.0):+.1f}/t) | Food: {getattr(context, 'food', 0.0):.0f} ({getattr(context, 'food_rate', 0.0):+.1f}/t)",
            f"Housing Capacity: {getattr(context, 'housing_capacity', 0):,} | Hospital Capacity: {getattr(context, 'hospital_capacity', 0):,}",
            f"Cognitive Reasoning: {getattr(context, 'avg_reasoning', 0.75):.2f} | AI Dependency: {getattr(context, 'avg_ai_dependency', 0.15):.2f}",
        ]
        return "\n".join(lines)

    @classmethod
    def build_prompt_context(
        cls,
        advisor_id: str,
        context: Any,
        decision_context: Optional[str] = None
    ) -> AdvisorPromptContext:
        """Assembles the three-tier prompt context with token accounting."""
        static_p = cls.get_static_persona(advisor_id)
        dyn_p = cls.build_dynamic_state_summary(context, advisor_id)
        dec_p = decision_context or "Deliver formal ministerial briefing and prioritize active policy recommendations."

        # Approximate token count: 1 token ~= 4 characters in English
        total_chars = len(static_p) + len(dyn_p) + len(dec_p)
        est_tokens = max(1, total_chars // 4)

        return AdvisorPromptContext(
            advisor_id=advisor_id,
            static_system_prompt=static_p,
            dynamic_state_prompt=dyn_p,
            decision_context_prompt=dec_p,
            estimated_tokens=est_tokens,
        )
