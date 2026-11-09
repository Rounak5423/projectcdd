"""
GENESIS Engine Parallel Scenario Runner
Generates diverse synthetic simulation runs with randomised policies, budgets,
starting conditions, and schedules, writing full telemetry to ml/data/generated/<run_id>/
and cataloging every run in manifest.json
"""

import os
import sys
import time
import json
import random
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, Any, List

from ..config import GENERATED_DATA_DIR, RANDOM_SEED
from ..telemetry.exporter import TelemetryBatchExporter, set_telemetry_exporter
from engine.state import WorldStateManager
from engine.simulation import step_world


def run_single_scenario(args_tuple: tuple) -> Dict[str, Any]:
    """Worker function executing an isolated seeded simulation run with telemetry."""
    run_idx, seed, ticks, out_dir = args_tuple
    random.seed(seed)
    
    run_id = f"run_{run_idx:04d}_{seed}"
    run_dir = os.path.join(out_dir, run_id)
    os.makedirs(run_dir, exist_ok=True)
    
    # 1. Randomized policies
    policies = {
        "universal_basic_income": random.random() < 0.40,
        "cognitive_scaffolding": random.random() < 0.50,
        "automation_tax": random.random() < 0.30,
        "green_energy_subsidy": random.random() < 0.50,
        "public_healthcare": random.random() < 0.60
    }
    
    # 2. Randomized budgets
    budgets = {
        "tax_rate": round(random.uniform(0.08, 0.35), 3),
        "healthcare_budget_pct": round(random.uniform(0.10, 0.35), 3),
        "education_budget_pct": round(random.uniform(0.10, 0.35), 3),
        "road_infrastructure_budget_pct": round(random.uniform(0.05, 0.25), 3)
    }
    
    # 3. Starting conditions
    init_pop = random.choice([30, 45, 60, 80])
    
    # Initialize telemetry exporter for this isolated run
    exporter = TelemetryBatchExporter(
        run_id=run_id,
        output_dir=out_dir,
        enabled=True,
        interval_ticks=1,
        batch_size=50
    )
    set_telemetry_exporter(exporter)
    
    t0 = time.perf_counter()
    mgr = WorldStateManager()
    world = mgr.create(name=f"SimWorld_{run_idx}", population=init_pop, seed=seed)
    
    # Apply randomized policy state
    for p_id, active in policies.items():
        if p_id in world.policies:
            world.policies[p_id].active = active
            
    # Run simulation forward
    step_world(world, ticks=ticks)
    
    # Flush all telemetry to parquet
    exporter.flush()
    exporter.shutdown()
    set_telemetry_exporter(None)
    duration = time.perf_counter() - t0
    
    # List generated files
    generated_files = []
    if os.path.exists(run_dir):
        generated_files = [f for f in os.listdir(run_dir) if f.endswith(".parquet")]

    return {
        "run_id": run_id,
        "seed": seed,
        "ticks": ticks,
        "initial_population": init_pop,
        "final_population": world.population_count,
        "policies": policies,
        "budgets": budgets,
        "duration_sec": round(duration, 4),
        "files_count": len(generated_files),
        "status": "completed"
    }


def run_scenarios(num_runs: int = 500, max_workers: int = 4, ticks_per_run: int = 24, output_dir: str = str(GENERATED_DATA_DIR)):
    print(f"================================================================")
    print(f"Starting Scenario Generator: {num_runs} runs | Workers: {max_workers} | Ticks: {ticks_per_run}")
    print(f"Output directory: {output_dir}")
    print(f"================================================================")
    
    os.makedirs(output_dir, exist_ok=True)
    t_start = time.perf_counter()
    
    # Prepare task arguments
    tasks = []
    for i in range(num_runs):
        seed = RANDOM_SEED + i * 17
        tasks.append((i, seed, ticks_per_run, output_dir))
        
    manifest = []
    # Execute in parallel
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(run_single_scenario, t): t for t in tasks}
        completed = 0
        for future in as_completed(futures):
            res = future.result()
            manifest.append(res)
            completed += 1
            if completed % 50 == 0 or completed == num_runs:
                print(f"Progress: [{completed}/{num_runs}] runs finished ({(completed/num_runs)*100:.1f}%)")
                
    total_time = time.perf_counter() - t_start
    manifest.sort(key=lambda x: x["run_id"])
    
    # Save manifest
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump({
            "total_runs": len(manifest),
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_duration_sec": round(total_time, 2),
            "runs": manifest
        }, f, indent=2)
        
    print(f"\n✓ Generated {len(manifest)} simulation runs in {total_time:.2f} seconds.")
    print(f"✓ Manifest written to: {manifest_path}")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GENESIS Scenario Runner")
    parser.add_argument("--runs", type=int, default=500, help="Number of simulation runs to generate (default: 500)")
    parser.add_argument("--workers", type=int, default=min(8, os.cpu_count() or 4), help="Worker processes (default: CPU count)")
    parser.add_argument("--ticks", type=int, default=24, help="Simulation ticks per run (default: 24)")
    parser.add_argument("--output-dir", type=str, default=str(GENERATED_DATA_DIR), help="Output directory for generated parquet files")
    args = parser.parse_args()

    run_scenarios(
        num_runs=args.runs,
        max_workers=args.workers,
        ticks_per_run=args.ticks,
        output_dir=args.output_dir
    )
