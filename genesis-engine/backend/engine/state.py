import copy
import uuid
from typing import Dict, List, Optional, Any
from .models import WorldState, CompareResponse, HistorySnapshot
from .simulation import create_initial_world, step_world


class WorldStateManager:
    """
    Manages in-memory active worlds, snapshot cloning, and counterfactual branch comparisons.
    """

    def __init__(self):
        self._worlds: Dict[str, WorldState] = {}

    def create(
        self,
        name: str = "Civilisation Alpha",
        population: int = 100,
        grid_size: int = 32,
        climate: str = "Temperate",
        technology_level: str = "Automated",
        resource_tier: str = "Balanced",
        active_policies: Optional[List[str]] = None,
        world_id: Optional[str] = None,
        seed: Optional[int] = None
    ) -> WorldState:
        w_id = world_id or str(uuid.uuid4())[:8]
        world = create_initial_world(
            world_id=w_id,
            name=name,
            population_size=population,
            grid_size=grid_size,
            climate=climate,
            technology_level=technology_level,
            resource_tier=resource_tier,
            active_policy_ids=active_policies,
            seed=seed
        )
        self._worlds[w_id] = world
        return world

    def get(self, world_id: str) -> Optional[WorldState]:
        return self._worlds.get(world_id)

    def list_all(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": w.id,
                "name": w.name,
                "parent_world_id": w.parent_world_id,
                "tick": w.tick,
                "year": w.year,
                "population": w.population_count,
                "gini": w.economy.gini,
                "civic_stability": w.economy.civic_stability,
                "macro_innovation": w.economy.macro_innovation_index,
                "active_policies": [p.id for p in w.policies.values() if p.active]
            }
            for w in self._worlds.values()
        ]

    def delete(self, world_id: str) -> bool:
        if world_id in self._worlds:
            del self._worlds[world_id]
            return True
        return False

    def branch(
        self,
        source_id: str,
        new_name: str,
        new_id: Optional[str] = None,
        policy_overrides: Optional[Dict[str, bool]] = None,
        project_ticks: int = 0
    ) -> WorldState:
        source = self.get(source_id)
        if not source:
            raise ValueError(f"Source world '{source_id}' not found.")

        # Deep copy snapshot of current state
        branched_world: WorldState = copy.deepcopy(source)
        branched_id = new_id or str(uuid.uuid4())[:8]
        branched_world.id = branched_id
        branched_world.name = new_name
        branched_world.parent_world_id = source_id

        # Update IDs for citizens in the branched universe
        for c in branched_world.citizens:
            c.id = f"{c.id}_b_{branched_id}"
            c.demographics.id = c.id

        # Apply policy overrides
        if policy_overrides:
            for p_id, is_active in policy_overrides.items():
                if p_id in branched_world.policies:
                    branched_world.policies[p_id].active = is_active

        # Optionally project simulation forward
        if project_ticks > 0:
            step_world(branched_world, ticks=project_ticks)

        self._worlds[branched_id] = branched_world
        return branched_world

    def compare(self, source_id: str, target_id: str) -> CompareResponse:
        source = self.get(source_id)
        target = self.get(target_id)

        if not source or not target:
            raise ValueError(f"One or both worlds ({source_id}, {target_id}) do not exist.")

        # Determine branch tick
        branch_tick = 0
        if target.parent_world_id == source.id:
            # Common prefix in history
            common_ticks = min(len(source.history), len(target.history))
            for i in range(common_ticks):
                if (
                    source.history[i].tick == target.history[i].tick
                    and source.history[i].gini == target.history[i].gini
                    and source.history[i].macro_innovation == target.history[i].macro_innovation
                ):
                    branch_tick = source.history[i].tick
                else:
                    break

        s_latest = source.history[-1] if source.history else None
        t_latest = target.history[-1] if target.history else None

        divergence = {}
        if s_latest and t_latest:
            divergence = {
                "year_source": s_latest.year,
                "year_target": t_latest.year,
                "gini_source": s_latest.gini,
                "gini_target": t_latest.gini,
                "gini_delta": round(t_latest.gini - s_latest.gini, 4),
                "stability_source": s_latest.civic_stability,
                "stability_target": t_latest.civic_stability,
                "stability_delta": round(t_latest.civic_stability - s_latest.civic_stability, 4),
                "innovation_source": s_latest.macro_innovation,
                "innovation_target": t_latest.macro_innovation,
                "innovation_delta": round(t_latest.macro_innovation - s_latest.macro_innovation, 4),
                "ai_dependency_source": s_latest.avg_ai_dependency,
                "ai_dependency_target": t_latest.avg_ai_dependency,
                "ai_dependency_delta": round(t_latest.avg_ai_dependency - s_latest.avg_ai_dependency, 4),
                "reasoning_source": s_latest.avg_reasoning,
                "reasoning_target": t_latest.avg_reasoning,
                "reasoning_delta": round(t_latest.avg_reasoning - s_latest.avg_reasoning, 4),
                "wealth_source": s_latest.average_wealth,
                "wealth_target": t_latest.average_wealth,
                "wealth_delta": round(t_latest.average_wealth - s_latest.average_wealth, 2)
            }

        return CompareResponse(
            source_world_id=source.id,
            source_world_name=source.name,
            target_world_id=target.id,
            target_world_name=target.name,
            branch_tick=branch_tick,
            trajectory_length=max(len(source.history), len(target.history)),
            source_history=source.history,
            target_history=target.history,
            divergence_summary=divergence
        )


# Global singleton instance
world_manager = WorldStateManager()
