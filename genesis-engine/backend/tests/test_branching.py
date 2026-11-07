import pytest
from engine.state import WorldStateManager
from engine.simulation import step_world


def test_counterfactual_branch_isolation():
    manager = WorldStateManager()
    source_world = manager.create(name="Baseline World", population=40, seed=42)

    # Advance source to tick 10
    step_world(source_world, ticks=10)
    assert source_world.tick == 10

    # Fork world with different policy
    branch_world = manager.branch(
        source_id=source_world.id,
        new_name="Intervention World",
        policy_overrides={"universal_basic_income": True, "cognitive_scaffolding": True},
        project_ticks=15
    )

    # Verify branch world advanced while source remained at tick 10
    assert branch_world.parent_world_id == source_world.id
    assert branch_world.tick == 25
    assert source_world.tick == 10

    # Step source world independently
    step_world(source_world, ticks=15)
    assert source_world.tick == 25

    # Run comparative divergence
    comparison = manager.compare(source_world.id, branch_world.id)
    assert comparison.source_world_id == source_world.id
    assert comparison.target_world_id == branch_world.id
    assert "gini_delta" in comparison.divergence_summary
    assert "innovation_delta" in comparison.divergence_summary

