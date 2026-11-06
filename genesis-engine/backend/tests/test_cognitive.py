import pytest
from engine.models import Citizen, Demographics, NeedsVector, CognitiveProfile
from engine.cognitive import (
    calculate_cognitive_atrophy,
    update_citizen_cognition,
    calculate_macro_innovation_index
)


def create_test_citizen(reasoning=0.8, dependency=0.1) -> Citizen:
    return Citizen(
        id="test_001",
        demographics=Demographics(id="test_001", age=30.0, occupation="Scholar", wealth=100.0),
        needs=NeedsVector(),
        cognitive=CognitiveProfile(
            independent_reasoning=reasoning,
            problem_solving=0.6,
            critical_evaluation=0.8,
            creativity=0.7,
            knowledge_retention=0.8,
            ai_dependency=dependency
        )
    )


def test_ai_dependency_accumulation():
    citizen = create_test_citizen(dependency=0.1)
    # High AI access (A = 1.0), zero scaffolding (S = 0.0)
    update_citizen_cognition(citizen, ai_access_coverage=1.0, scaffolding_friction=0.0)
    assert citizen.cognitive.ai_dependency > 0.1
    assert citizen.cognitive.problem_solving > 0.6


def test_scaffolding_prevents_cognitive_atrophy():
    # Citizen A: Unscaffolded AI (high atrophy)
    cit_unscaffolded = create_test_citizen(reasoning=0.8, dependency=0.6)
    # Citizen B: Scaffolded AI (S = 0.9, protected)
    cit_scaffolded = create_test_citizen(reasoning=0.8, dependency=0.6)

    for _ in range(20):
        update_citizen_cognition(cit_unscaffolded, ai_access_coverage=0.9, scaffolding_friction=0.0)
        update_citizen_cognition(cit_scaffolded, ai_access_coverage=0.9, scaffolding_friction=0.9)

    # Scaffolding should preserve significantly higher independent reasoning
    assert cit_scaffolded.cognitive.independent_reasoning > cit_unscaffolded.cognitive.independent_reasoning


def test_macro_innovation_index():
    c1 = create_test_citizen(reasoning=0.8, dependency=0.2)
    c2 = create_test_citizen(reasoning=0.6, dependency=0.4)
    # I_macro = 0.6 * R + 0.4 * (1 - D)
    # c1: 0.6*0.8 + 0.4*0.8 = 0.48 + 0.32 = 0.80
    # c2: 0.6*0.6 + 0.4*0.6 = 0.36 + 0.24 = 0.60
    # Average = 0.70
    macro_idx = calculate_macro_innovation_index([c1, c2])
    assert pytest.approx(macro_idx, 0.01) == 0.70

