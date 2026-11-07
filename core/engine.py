"""Simulation Engine Coordinator (Module G).

Coordinates discrete-tick state progression, agent decisions, resource thermodynamics,
social interactions, governance policies, dynamic scenario adaptations, and game mechanics.
"""

import random
from typing import Dict, List, Optional, Any, Set

from genesis.core.civilisation import CivilisationConfig, InitialTechLevel
from genesis.core.scenarios import ActiveScenario, ScenarioType, AIScenarioDirector
from genesis.agents.citizen import CitizenAgent
from genesis.agents.decision import DecisionEngine, ActionType, ActionIntent
from genesis.agents.skills import SkillType
from genesis.environment.resources import EnvironmentMatrix, ResourceType
from genesis.knowledge.database import KnowledgeRegistry, get_default_knowledge_registry
from genesis.social.interactions import SocialInteractionManager
from genesis.governance.policies import GovernanceModel, create_governance_system, GovernancePolicy
from genesis.analytics.metrics import CivilisationMetricsCollector, SimulationSnapshot


class SimulationEngine:
    """The central discrete-tick coordinator and game engine for Project Genesis."""

    def __init__(
        self,
        config: CivilisationConfig,
        knowledge_registry: Optional[KnowledgeRegistry] = None,
    ) -> None:
        self.config = config
        self.rng = random.Random(config.seed)
        self.current_tick = 0
        self.is_running = False
        
        self.knowledge_registry = knowledge_registry or get_default_knowledge_registry()
        self.environment = EnvironmentMatrix(climate=config.climate)
        
        # Active AI Scenario / Crisis
        self.active_scenario: Optional[ActiveScenario] = None
        
        # Determine governance model from config social structure
        gov_model = GovernanceModel.DEMOCRACY
        if "chiefdom" in config.social_structure.value:
            gov_model = GovernanceModel.AUTOCRACY
        elif "council" in config.social_structure.value:
            gov_model = GovernanceModel.COUNCIL
        elif "market" in config.social_structure.value:
            gov_model = GovernanceModel.LAISSEZ_FAIRE

        self.governance: GovernancePolicy = create_governance_system(
            model=gov_model,
            initial_food=config.initial_food * 0.4,
            initial_water=config.initial_water * 0.4,
        )

        self.citizens: Dict[str, CitizenAgent] = {}
        self.metrics = CivilisationMetricsCollector()
        self.event_log: List[Dict[str, Any]] = []
        self.total_deaths = 0
        self.total_births = 0
        self.unlocked_technologies: Set[str] = set()

        self._populate_initial_citizens()

    @property
    def prosperity_score(self) -> int:
        """Calculates a game score / civilization prestige index."""
        living = [c for c in self.citizens.values() if c.alive]
        pop_count = len(living)
        if pop_count == 0:
            return 0
        avg_health = sum(c.needs.health for c in living) / pop_count
        tech_score = len(self.unlocked_technologies) * 60
        stockpile_score = (self.governance.public_food_reserve + self.governance.public_water_reserve) * 0.5
        death_penalty = self.total_deaths * 25

        score = int((pop_count * 25) + tech_score + (avg_health * 3) + stockpile_score - death_penalty)
        return max(0, score)

    @property
    def civilisation_era(self) -> str:
        """Computes the historical epoch achieved by the society."""
        tech_count = len(self.unlocked_technologies)
        if tech_count >= 12:
            return "Modern Information Age"
        elif tech_count >= 9:
            return "Age of Discovery & Science"
        elif tech_count >= 6:
            return "Classical Antiquity"
        elif tech_count >= 3:
            return "Neolithic Agricultural Era"
        else:
            return "Paleolithic Stone Age"

    def _populate_initial_citizens(self) -> None:
        """Instantiates the starting citizen population using seeded Gaussian intelligence."""
        food_per_capita = (self.config.initial_food * 0.6) / self.config.initial_population
        water_per_capita = (self.config.initial_water * 0.6) / self.config.initial_population

        starter_tech = []
        if self.config.starting_tech_level in (InitialTechLevel.STONE_AGE, InitialTechLevel.AGRICULTURAL_REVOLUTION, InitialTechLevel.EARLY_BRONZE):
            starter_tech.append("fire_control")
            starter_tech.append("flint_knapping")
        if self.config.starting_tech_level in (InitialTechLevel.AGRICULTURAL_REVOLUTION, InitialTechLevel.EARLY_BRONZE):
            starter_tech.append("plant_domestication")
            starter_tech.append("mudbrick_architecture")

        self.unlocked_technologies = set(starter_tech)

        first_names = [
            "Aura", "Boran", "Cora", "Dax", "Elia", "Fintan", "Galia", "Hektor",
            "Idris", "Jorah", "Kaia", "Lysander", "Mira", "Nicos", "Orin", "Phaedra",
            "Quinn", "Rowan", "Selene", "Thorne", "Ulric", "Vesper", "Wren", "Zephyr"
        ]

        for i in range(self.config.initial_population):
            raw_iq = self.rng.gauss(self.config.intelligence_mean, self.config.intelligence_std_dev)
            bounded_iq = max(30.0, min(180.0, raw_iq))
            name = f"{self.rng.choice(first_names)}_{i + 1}"
            
            agent = CitizenAgent.create(
                name=name,
                intelligence=round(bounded_iq, 1),
                rng=self.rng,
                age_ticks=self.rng.randint(160, 300),
            )
            agent.inventory_food = round(food_per_capita, 1)
            agent.inventory_water = round(water_per_capita, 1)

            for tech_id in starter_tech:
                agent.knowledge_inventory[tech_id] = 1.0

            agent.refresh_thought()
            self.citizens[agent.id] = agent

        self._log_event("Genesis Engine initialized.", {"population": len(self.citizens), "climate": self.config.climate.value})

    # --- God Powers / Player Interventions ---

    def cast_rain_miracle(self) -> Dict[str, Any]:
        """God Power: Brings torrential rain, replenishing water reserves."""
        water_node = self.environment.resources.get(ResourceType.WATER.value)
        added = 0.0
        if water_node:
            added = min(250.0, water_node.max_capacity - water_node.current_stock)
            water_node.current_stock += added

        self.governance.public_water_reserve += 50.0
        for citizen in self.citizens.values():
            if citizen.alive:
                citizen.inventory_water = min(15.0, citizen.inventory_water + 4.0)
                citizen.needs.thirst = max(0.0, citizen.needs.thirst - 30.0)

        self._log_event("🌧️ Divine Intervention: Rain Miracle replenished fresh water wells!", {"water_added": added})
        return {"status": "success", "message": f"Rain miracle granted +{added:.1f} water to the realm!"}

    def cast_feast_miracle(self) -> Dict[str, Any]:
        """God Power: Gifts a divine feast (+250 food to public granary)."""
        self.governance.public_food_reserve += 250.0
        for citizen in self.citizens.values():
            if citizen.alive:
                citizen.inventory_food = min(15.0, citizen.inventory_food + 4.0)
                citizen.needs.hunger = max(0.0, citizen.needs.hunger - 40.0)

        self._log_event("🍞 Divine Intervention: Grand Feast blessed the communal granaries!", {"food_added": 250.0})
        return {"status": "success", "message": "Grand Feast bestowed upon your people!"}

    def cast_eureka_miracle(self) -> Dict[str, Any]:
        """God Power: Inspires a sudden intellectual awakening."""
        available_nodes = self.knowledge_registry.get_available_for_agent(self.unlocked_technologies)
        if not available_nodes:
            return {"status": "info", "message": "All currently researched technologies are already unlocked!"}

        chosen = available_nodes[0]
        self.unlocked_technologies.add(chosen.knowledge_id)

        # Grant mastery to top living scholar
        living = [c for c in self.citizens.values() if c.alive]
        if living:
            top_scholar = max(living, key=lambda c: c.intelligence)
            top_scholar.knowledge_inventory[chosen.knowledge_id] = 1.0
            top_scholar.memory.record_experience(
                description=f"Struck by a divine flash of insight: '{chosen.title}'!",
                current_tick=self.current_tick,
                category="discovery",
                importance=1.0,
                emotional_valence=1.0,
            )

        self._log_event(f"💡 Divine Flash of Genius: Instantly unlocked '{chosen.title}'!", {"knowledge_id": chosen.knowledge_id})
        return {"status": "success", "message": f"Divine Inspiration unlocked '{chosen.title}'!"}

    def cast_sunshine_miracle(self) -> Dict[str, Any]:
        """God Power: Immediately clears any active crisis/scenario."""
        if not self.active_scenario:
            return {"status": "info", "message": "Skies are already clear and peaceful."}

        cleared_title = self.active_scenario.title
        self.active_scenario = None
        self._log_event(f"☀️ Divine Intervention: Cleared crisis '{cleared_title}'!", {})
        return {"status": "success", "message": f"Cleared '{cleared_title}'. Peace returns to the land."}

    def trigger_scenario(
        self,
        scenario_type: ScenarioType,
        custom_prompt: Optional[str] = None,
        duration: int = 15,
    ) -> ActiveScenario:
        """Injects an AI scenario and compels citizens to adapt."""
        scenario = AIScenarioDirector.create_scenario(scenario_type, custom_prompt, duration)
        self.active_scenario = scenario

        # Immediate ambient effect on environment
        if scenario.scenario_type == ScenarioType.DROUGHT:
            water_node = self.environment.resources.get(ResourceType.WATER.value)
            if water_node:
                water_node.current_stock *= 0.4
        elif scenario.scenario_type == ScenarioType.BOUNTIFUL_HARVEST:
            food_node = self.environment.resources.get(ResourceType.FOOD.value)
            if food_node:
                food_node.current_stock = min(food_node.max_capacity, food_node.current_stock + 300.0)

        self._log_event(
            f"⚡ Scenario Alert: {scenario.title} begins! ({scenario.description})",
            {"scenario_type": scenario.scenario_type.value, "duration": scenario.duration_ticks},
        )
        return scenario

    # --- Core Tick Progression ---

    def step(self) -> SimulationSnapshot:
        """Executes one discrete simulation tick with adaptive AI behavior."""
        self.current_tick += 1

        # 1. Environment cycle
        self.environment.tick(self.current_tick)

        # 2. Evaluate Active Scenario Modifiers
        active_priority = "NORMAL"
        scenario_title = None
        health_drain = 0.0

        if self.active_scenario:
            active_priority = self.active_scenario.behavioral_priority
            scenario_title = self.active_scenario.title
            health_drain = self.active_scenario.health_drain_per_tick

            # Tick down scenario
            is_finished = self.active_scenario.tick()
            if is_finished:
                self._log_event(
                    f"🏆 Triumph: The civilisation has survived '{self.active_scenario.title}'!",
                    {"scenario_type": self.active_scenario.scenario_type.value},
                )
                self.active_scenario = None

        # 3. Governance cycle (taxation and safety net)
        living_citizens = [c for c in self.citizens.values() if c.alive]
        self.governance.execute_governance_cycle(living_citizens, self.current_tick)

        # 4. Citizen biological metabolism
        new_deaths = 0
        for citizen in living_citizens:
            was_alive = citizen.alive
            citizen.metabolic_tick(self.current_tick, health_drain_modifier=health_drain)
            if was_alive and not citizen.alive:
                new_deaths += 1
                self.total_deaths += 1
                self._log_event(
                    f"{citizen.name} passed away from {citizen.cause_of_death}.",
                    {"agent_id": citizen.id, "age_years": citizen.age_years},
                )

        # 5. Cognitive Decision Phase & Adaptive Action Resolution
        active_citizens = [c for c in self.citizens.values() if c.alive]
        for citizen in active_citizens:
            intent = DecisionEngine.evaluate_and_select(
                agent=citizen,
                environment=self.environment,
                knowledge_registry=self.knowledge_registry,
                available_peers=active_citizens,
                active_scenario_priority=active_priority,
            )
            self._resolve_action(citizen, intent)
            # Update citizen's real-time thought bubble!
            citizen.refresh_thought(active_scenario_priority=active_priority, scenario_title=scenario_title)

        # 6. Social Barter Matching Phase
        self._resolve_social_barters(active_citizens)

        # 7. Demographics and Births Phase
        self._evaluate_demographics(active_citizens)

        # 8. Memory Maintenance
        for citizen in active_citizens:
            citizen.memory.forget_decayed(self.current_tick)

        # 9. Telemetry Snapshot
        unlocked_titles = [
            self.knowledge_registry.get(tid).title
            for tid in self.unlocked_technologies
            if self.knowledge_registry.get(tid)
        ]

        snapshot = self.metrics.capture_tick(
            tick=self.current_tick,
            citizens=list(self.citizens.values()),
            environment=self.environment,
            governance=self.governance,
            unlocked_knowledge_titles=unlocked_titles,
            total_deaths=self.total_deaths,
            total_births=self.total_births,
        )

        return snapshot

    def _resolve_action(self, citizen: CitizenAgent, intent: ActionIntent) -> None:
        """Applies physical and cognitive outcomes of an agent's selected action."""
        action = intent.action_type
        citizen.record_decision(self.current_tick, action.value)

        # Yield multiplier from active scenario
        food_mod = self.active_scenario.food_yield_modifier if self.active_scenario else 1.0
        water_mod = self.active_scenario.water_yield_modifier if self.active_scenario else 1.0
        wood_mod = self.active_scenario.wood_yield_modifier if self.active_scenario else 1.0
        learn_mod = self.active_scenario.learning_speed_modifier if self.active_scenario else 1.0

        if action == ActionType.EAT:
            citizen.consume_food(5.0)

        elif action == ActionType.DRINK:
            citizen.consume_water(5.0)

        elif action == ActionType.REST:
            citizen.rest(35.0)

        elif action == ActionType.FORAGE_FOOD:
            base_harvest = (4.0 + (citizen.skills.get_level(SkillType.FORAGING) * 0.3)) * food_mod
            yield_food = self.environment.harvest(ResourceType.FOOD, base_harvest)
            citizen.inventory_food += yield_food
            citizen.skills.practice(SkillType.FORAGING, 15.0, citizen.intelligence, citizen.personality.conscientiousness)

        elif action == ActionType.GATHER_WATER:
            yield_water = self.environment.harvest(ResourceType.WATER, 6.0 * water_mod)
            citizen.inventory_water += yield_water

        elif action == ActionType.CHOP_WOOD:
            yield_wood = self.environment.harvest(ResourceType.WOOD, 3.0 * wood_mod)
            citizen.inventory_wood += yield_wood
            citizen.skills.practice(SkillType.CONSTRUCTION, 12.0, citizen.intelligence, citizen.personality.conscientiousness)

        elif action == ActionType.MINE_STONE:
            yield_stone = self.environment.harvest(ResourceType.STONE, 2.0)
            citizen.inventory_stone += yield_stone
            citizen.skills.practice(SkillType.CONSTRUCTION, 12.0, citizen.intelligence, citizen.personality.conscientiousness)

        elif action == ActionType.STUDY_KNOWLEDGE:
            if intent.target_knowledge:
                node = self.knowledge_registry.get(intent.target_knowledge)
                if node:
                    old_mastery = citizen.knowledge_inventory.get(node.knowledge_id, 0.0)
                    study_multiplier = self.governance.research_subsidy_multiplier * learn_mod
                    new_mastery = citizen.study_knowledge(node, self.current_tick, base_effort=0.25 * study_multiplier)
                    
                    if old_mastery < 1.0 and new_mastery >= 1.0:
                        self.unlocked_technologies.add(node.knowledge_id)
                        self._log_event(
                            f"Breakthrough: {citizen.name} mastered '{node.title}'!",
                            {"knowledge_id": node.knowledge_id, "domain": node.domain.value},
                        )

        elif action == ActionType.TEACH_NEIGHBOR:
            if intent.target_id and intent.target_knowledge:
                target_peer = self.citizens.get(intent.target_id)
                node = self.knowledge_registry.get(intent.target_knowledge)
                if target_peer and node:
                    result = SocialInteractionManager.execute_teaching(
                        teacher=citizen,
                        student=target_peer,
                        knowledge_node=node,
                        current_tick=self.current_tick,
                    )
                    if result.success and target_peer.knowledge_inventory.get(node.knowledge_id, 0.0) >= 1.0:
                        self.unlocked_technologies.add(node.knowledge_id)
                        self._log_event(
                            f"Education: {citizen.name} passed '{node.title}' to {target_peer.name}!",
                            {"knowledge_id": node.knowledge_id},
                        )

        elif action == ActionType.CONTRIBUTE_STOCKPILE:
            if citizen.inventory_food > 10.0:
                surplus = citizen.inventory_food - 8.0
                citizen.inventory_food -= surplus
                self.governance.public_food_reserve += surplus

    def _resolve_social_barters(self, active_citizens: List[CitizenAgent]) -> None:
        """Pairs random agents to check for complementary trade barter."""
        if len(active_citizens) < 2:
            return
        
        sample_size = min(6, len(active_citizens))
        candidates = self.rng.sample(active_citizens, sample_size)
        for i in range(0, len(candidates) - 1, 2):
            SocialInteractionManager.execute_barter(candidates[i], candidates[i + 1], self.current_tick)

    def _evaluate_demographics(self, active_citizens: List[CitizenAgent]) -> None:
        """Evaluates conditions for new citizen births."""
        pop_count = len(active_citizens)
        if pop_count < 2 or pop_count > 250:
            return

        total_food = sum(c.inventory_food for c in active_citizens) + self.governance.public_food_reserve
        avg_health = sum(c.needs.health for c in active_citizens) / pop_count

        if total_food > (pop_count * 12.0) and avg_health > 70.0:
            if self.rng.random() < 0.12:
                parents = self.rng.sample(active_citizens, 2)
                child_iq = round(
                    max(40.0, min(170.0, ((parents[0].intelligence + parents[1].intelligence) / 2.0) + self.rng.gauss(0, 8))),
                    1,
                )
                child_name = f"Child_Gen{self.total_births + 1}_{parents[0].name.split('_')[0]}"
                child = CitizenAgent.create(
                    name=child_name,
                    intelligence=child_iq,
                    rng=self.rng,
                    age_ticks=1,
                )
                child.inventory_food = 5.0
                child.inventory_water = 5.0
                for tech_id, mastery in parents[0].knowledge_inventory.items():
                    if mastery >= 1.0:
                        child.knowledge_inventory[tech_id] = 0.5

                child.refresh_thought()
                self.citizens[child.id] = child
                self.total_births += 1
                self._log_event(
                    f"A new citizen, {child.name}, was born to {parents[0].name} and {parents[1].name}!",
                    {"child_id": child.id, "iq": child_iq},
                )

    def _log_event(self, description: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        event = {
            "tick": self.current_tick,
            "description": description,
            "metadata": metadata or {},
        }
        self.event_log.append(event)
        if len(self.event_log) > 200:
            self.event_log.pop(0)

    def run(self, ticks: int) -> List[SimulationSnapshot]:
        """Runs the simulation synchronously for a set number of ticks."""
        snapshots = []
        for _ in range(ticks):
            snapshots.append(self.step())
        return snapshots
