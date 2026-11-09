import os
import sys
import json
import numpy as np

backend_path = os.path.abspath("genesis-engine/backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from engine.causal.engine import CausalCouplingEngine, CausalConfig
import ml.config
import ml.inference.registry as reg

def run_ml_comparison():
    print("=== RUNNING ML_ENABLED COMPARISON (365 TICKS) ===")
    
    results = {}
    
    for mode in [False, True]:
        os.environ["ML_ENABLED"] = "1" if mode else "0"
        ml.config.ML_ENABLED = mode
        reg.ML_ENABLED = mode
        
        np.random.seed(42)
        engine = CausalCouplingEngine()
        world_id = f"test_ml_world_{mode}"
        
        pop = 500
        history = []
        models_called_count = 0
        original_hazard_fn = reg.calculate_gompertz_mortality_hazard
        
        def hazard_tracker(*args, **kwargs):
            nonlocal models_called_count
            models_called_count += 1
            return original_hazard_fn(*args, **kwargs)
            
        reg.calculate_gompertz_mortality_hazard = hazard_tracker
        
        for tick in range(1, 366):
            res = engine.step(
                world_id=world_id,
                current_tick=tick,
                year=2026 + (tick // 365),
                day=tick % 365,
                population=pop,
                food_stock=1000.0,
                food_production=50.0,
                water_stock=1000.0,
                water_production=50.0,
                energy_stock=1000.0,
                energy_production=50.0,
                pollution_level=0.15,
                civic_stability=0.85,
                happiness=0.75,
                hospital_capacity=20,
                residential_capacity=600,
                unemployment_rate=0.03,
                ticks_passed=1
            )
            pop = res["new_population"]
            history.append({
                "tick": tick,
                "population": res["new_population"],
                "births": res["births"],
                "deaths": res["deaths"],
                "deaths_aging": res["deaths_by_cause"]["aging"],
                "protest_intensity": res.get("protest_intensity", 0.0)
            })
            
        reg.calculate_gompertz_mortality_hazard = original_hazard_fn
        
        mode_str = "ML_ENABLED=True" if mode else "ML_ENABLED=False"
        results[mode_str] = {
            "initial_pop": 500,
            "final_pop": history[-1]["population"],
            "total_births": sum(h["births"] for h in history),
            "total_deaths": sum(h["deaths"] for h in history),
            "total_aging_deaths": sum(h["deaths_aging"] for h in history),
            "models_called_count": models_called_count,
            "sample_records": [history[i] for i in [0, 29, 89, 179, 269, 364]]
        }
        
    print("\n--- RESULTS COMPARISON ---")
    print(json.dumps(results, indent=2))
    
    with open("/tmp/ml_comparison_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nSaved comparison to /tmp/ml_comparison_results.json")

if __name__ == "__main__":
    run_ml_comparison()
