from typing import List
from .models import Citizen, CognitiveProfile


def calculate_cognitive_atrophy(
    dependency: float,
    scaffolding: float,
    base_decay_rate: float = 0.015,
    dt: float = 1.0
) -> float:
    """
    Computes complacency decay rate for a citizen based on scaffolding friction.
    Atrophy = (1.0 - S) * base_decay_rate * D_t * dt
    """
    scaffolding_clamped = max(0.0, min(1.0, scaffolding))
    dependency_clamped = max(0.0, min(1.0, dependency))
    return (1.0 - scaffolding_clamped) * base_decay_rate * dependency_clamped * dt


def update_citizen_cognition(
    citizen: Citizen,
    ai_access_coverage: float,
    scaffolding_friction: float,
    education_boost: float = 0.0,
    dt: float = 1.0
) -> None:
    """
    Advances citizen cognitive profile by dt ticks according to the AI Dependency Paradox formulas.
    Default dt=1.0 preserves standard tick step.
    """
    A = max(0.0, min(1.0, ai_access_coverage))
    S = max(0.0, min(1.0, scaffolding_friction))
    c = citizen.cognitive

    # 1. AI Dependency Accumulation or Decay
    if A > 0.05:
        c.ai_dependency = min(1.0, c.ai_dependency + (A * 0.02 * dt))
    else:
        # Natural weaning when AI coverage drops
        c.ai_dependency = max(0.02, c.ai_dependency - (0.01 * dt))

    # 2. Problem-Solving Speedup (tool-assisted task efficiency)
    c.problem_solving = min(1.0, c.problem_solving + ((A * 0.01 + education_boost * 0.005) * dt))

    # 3. Cognitive Atrophy Rate (Complacency Decay)
    atrophy = calculate_cognitive_atrophy(c.ai_dependency, S, base_decay_rate=0.015, dt=dt)

    # If education is active, it counteracts atrophy
    net_atrophy = max(0.0, atrophy - (education_boost * 0.008 * dt))

    # Independent Reasoning (R) and Critical Evaluation (E) decay under unchecked automation
    c.independent_reasoning = max(0.1, min(1.0, c.independent_reasoning - net_atrophy))
    c.critical_evaluation = max(0.1, min(1.0, c.critical_evaluation - net_atrophy))

    # Scaffolding reinforcement: if scaffolding is actively maintained, reasoning can grow
    if S >= 0.6 and A > 0.1:
        reinforcement = 0.004 * S * dt
        c.independent_reasoning = min(1.0, c.independent_reasoning + reinforcement)
        c.critical_evaluation = min(1.0, c.critical_evaluation + reinforcement)

    # Creativity & Knowledge retention dynamics
    if c.ai_dependency > 0.7 and S < 0.3:
        c.knowledge_retention = max(0.1, c.knowledge_retention - (0.008 * dt))
    else:
        c.knowledge_retention = min(1.0, c.knowledge_retention + (0.002 * dt))

    c.creativity = max(0.1, min(1.0, c.creativity + ((0.003 if S > 0.4 else -0.002) * dt)))


def calculate_macro_innovation_index(citizens: List[Citizen]) -> float:
    """
    Computes Macro Collective Innovation Index:
    I_macro = (1 / N) * sum( 0.6 * R_i + 0.4 * (1.0 - D_i) )
    """
    alive_citizens = [c for c in citizens if c.is_alive]
    if not alive_citizens:
        return 0.0

    total_score = sum(
        (0.6 * c.cognitive.independent_reasoning) + (0.4 * (1.0 - c.cognitive.ai_dependency))
        for c in alive_citizens
    )
    return round(total_score / len(alive_citizens), 4)

