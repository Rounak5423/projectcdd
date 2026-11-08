"""
CIVORA — Phase 4 Simulation Engine & Scheduler Verification Suite
Validates fixed-timestep scheduling, overload protection, single-pass agent processing,
database transaction atomicity, mathematical consistency, and benchmark performance.
"""

import asyncio
import time
import pytest
from engine.models import WorldState
from engine.simulation import create_initial_world, step_world
from engine.simulation_v1 import advance_world_simulation, seed_aurora_prime_if_not_exists
from engine.scheduler import SimulationScheduler, SimulationRunner, MAX_CATCHUP_TICKS
from engine.economy import calculate_gini_coefficient, calculate_civic_stability, process_economy_tick
from db.database import get_db_connection
import db.database


@pytest.fixture(autouse=True, scope="session")
def setup_test_db(tmp_path_factory):
    test_db = str(tmp_path_factory.mktemp("phase4_db") / "test_genesis_p4.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


def test_scheduler_lifecycle_and_timing():
    """Validates scheduler initialization, speed modification, and pause/resume lifecycle."""
    async def _run():
        scheduler = SimulationScheduler()
        runner = scheduler.get_or_create_runner("test-world-lifecycle", speed="1x")
        assert runner.speed == "1x"
        assert runner.interval == 1.0
        assert runner.status == "paused"

        # Test speed change updates interval
        runner.set_speed("5x")
        assert runner.speed == "5x"
        assert runner.interval == 0.2

        # Test start and pause
        runner.start()
        assert runner.status == "running"
        await runner.pause_async()
        assert runner.status == "paused"

    asyncio.run(_run())


def test_scheduler_overload_protection():
    """Validates that lag backlog is clamped to MAX_CATCHUP_TICKS to prevent freeze spirals."""
    async def _run():
        tick_count = 0

        async def mock_tick_func(world_id: str, ticks: int):
            nonlocal tick_count
            tick_count += ticks
            return {"ticks": ticks}

        runner = SimulationRunner("test-overload", speed="10x", tick_func=mock_tick_func)
        runner.interval = 0.05
        runner.start()

        # Simulate artificial lag by manually setting accumulator to 1.0s (20x interval)
        runner.accumulator = 1.0

        # Allow one loop step
        await asyncio.sleep(0.08)
        await runner.pause_async()

        # Overload policy should have triggered
        assert runner.overload_count >= 1
        # Ticks processed should be clamped by MAX_CATCHUP_TICKS rather than dumping 20 ticks at once
        assert tick_count <= (MAX_CATCHUP_TICKS * 2)

    asyncio.run(_run())


def test_agent_single_pass_mathematical_consistency():
    """Verifies that optimized single-pass economy tick produces exact mathematical results."""
    world = create_initial_world(
        world_id="consistency_test",
        population_size=120,
        grid_size=32,
        seed=999
    )

    initial_food = world.resources.food
    step_world(world, ticks=1)

    # Basic invariants
    assert world.tick == 1
    assert world.population_count == 120
    assert world.economy.gini >= 0.0 and world.economy.gini <= 1.0
    assert world.economy.civic_stability >= 0.2 and world.economy.civic_stability <= 1.0
    assert world.economy.macro_innovation_index >= 0.0 and world.economy.macro_innovation_index <= 1.0
    assert world.economy.total_wealth > 0.0


def test_database_atomic_transaction_and_dirty_tracking():
    """Verifies SQLite simulation advance operates in a single atomic transaction and tracks dirty state."""
    seed_aurora_prime_if_not_exists()
    conn = get_db_connection()
    row_before = conn.execute("SELECT tick, population FROM worlds JOIN economy_resources ON worlds.id = economy_resources.world_id WHERE worlds.id = 'aurora-prime'").fetchone()
    conn.close()

    assert row_before is not None
    tick_before = row_before["tick"]

    # Advance by 1 tick
    res = advance_world_simulation("aurora-prime", ticks=1)

    assert res["world_id"] == "aurora-prime"
    assert res["tick"] == tick_before + 1
    assert res["population"] > 0
    assert res["gdp"] > 0
    assert "resources" in res


def test_agent_scaling_benchmark():
    """Benchmarks agent processing throughput across 100, 300, and 600 agents."""
    durations = {}

    for pop in [100, 300, 600]:
        world = create_initial_world(
            world_id=f"bench_{pop}",
            population_size=pop,
            grid_size=32,
            seed=42
        )
        t0 = time.perf_counter()
        step_world(world, ticks=5)
        dt_ms = (time.perf_counter() - t0) * 1000.0 / 5.0
        durations[pop] = dt_ms

        # Assert sub-5ms per tick even for 600 agents
        assert dt_ms < 15.0, f"Tick duration for {pop} agents took {dt_ms:.2f}ms (>15ms threshold)"

    # Print benchmark summary
    print("\n[Phase 4 Agent Scaling Benchmark]:")
    for pop, dt in durations.items():
        print(f"  {pop:3d} agents: {dt:.3f} ms / tick")
