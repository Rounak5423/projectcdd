import pytest
from engine.simulation import create_initial_world, step_world
from engine.economy import calculate_gini_coefficient, calculate_civic_stability


def test_world_creation_and_tick():
    world = create_initial_world(population_size=50, grid_size=20, seed=123)
    assert world.tick == 0
    assert world.year == 2026.0
    assert len(world.citizens) == 50
    assert len(world.history) == 1

    # Advance 10 ticks = 1 simulated year
    step_world(world, ticks=10)
    assert world.tick == 10
    assert world.year == 2027.0
    assert len(world.history) == 11


def test_gini_calculation():
    # Perfectly equal wealth -> Gini = 0
    equal_wealth = [100.0, 100.0, 100.0, 100.0]
    gini_equal = calculate_gini_coefficient(equal_wealth)
    assert gini_equal == 0.0

    # Unequal wealth -> positive Gini
    unequal_wealth = [10.0, 20.0, 30.0, 1000.0]
    gini_unequal = calculate_gini_coefficient(unequal_wealth)
    assert 0.0 < gini_unequal <= 1.0


def test_civic_stability_bounds():
    # When Gini is 0, stability is 1.0
    assert calculate_civic_stability(0.0) == 1.0
    # Stability should never fall below floor 0.2
    assert calculate_civic_stability(1.0) == 0.2
    assert calculate_civic_stability(0.5) == 0.6

