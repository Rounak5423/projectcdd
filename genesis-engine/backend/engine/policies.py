from typing import Dict, Tuple
from .models import Policy


def get_default_policies() -> Dict[str, Policy]:
    """
    Returns standard baseline policies for world initialization.
    """
    return {
        "universal_ai": Policy(
            id="universal_ai",
            name="Universal AI Assistance",
            description="Grants automated AI cognitive copilot tools to all citizens without friction.",
            active=False,
            parameters={"ai_access_coverage": 0.9, "task_complexity": 0.6}
        ),
        "cognitive_scaffolding": Policy(
            id="cognitive_scaffolding",
            name="Cognitive Scaffolding Mandate",
            description="Enforces interactive Socratic friction and guided inquiry rather than direct answer delegation.",
            active=False,
            parameters={"scaffolding_friction": 0.8}
        ),
        "universal_basic_income": Policy(
            id="universal_basic_income",
            name="Universal Basic Dividend (UBI)",
            description="Distributes unconditional dividend per tick to reduce economic disparity.",
            active=False,
            parameters={"ubi_amount": 4.0}
        ),
        "free_education": Policy(
            id="free_education",
            name="Public Foundational Academy",
            description="State-funded critical thinking and logic training to counteract cognitive atrophy.",
            active=False,
            parameters={"education_boost": 0.8}
        ),
        "automation_tax": Policy(
            id="automation_tax",
            name="Algorithmic Dividend Levy",
            description="Levies a 20% automation tax on high algorithmic capital gains to fund civic programs.",
            active=False,
            parameters={"tax_rate": 0.20}
        )
    }


def extract_policy_modifiers(policies: Dict[str, Policy]) -> Tuple[float, float, float, float, float]:
    """
    Computes effective simulation parameters based on currently active policies.
    Returns:
    (ai_access_coverage, scaffolding_friction, ubi_amount, education_boost, automation_tax_rate)
    """
    ai_coverage = 0.05
    scaffolding = 0.1
    ubi_amount = 0.0
    education_boost = 0.0
    automation_tax = 0.0

    if policies.get("universal_ai", Policy(id="", name="", description="")).active:
        ai_coverage = policies["universal_ai"].parameters.get("ai_access_coverage", 0.9)

    if policies.get("cognitive_scaffolding", Policy(id="", name="", description="")).active:
        scaffolding = policies["cognitive_scaffolding"].parameters.get("scaffolding_friction", 0.8)

    if policies.get("universal_basic_income", Policy(id="", name="", description="")).active:
        ubi_amount = policies["universal_basic_income"].parameters.get("ubi_amount", 4.0)

    if policies.get("free_education", Policy(id="", name="", description="")).active:
        education_boost = policies["free_education"].parameters.get("education_boost", 0.8)

    if policies.get("automation_tax", Policy(id="", name="", description="")).active:
        automation_tax = policies["automation_tax"].parameters.get("tax_rate", 0.2)

    return ai_coverage, scaffolding, ubi_amount, education_boost, automation_tax

