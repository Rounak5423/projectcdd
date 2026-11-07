"""Human Civilisation Knowledge Database Implementation.

Contains historically grounded advancement nodes spanning 13 canonical domains
from Paleolithic toolmaking to 20th-century computing.
"""

from typing import Dict, List, Optional, Set
from genesis.knowledge.models import KnowledgeDomain, KnowledgeNode


class KnowledgeRegistry:
    """In-memory structured knowledge registry with prerequisite graph validation."""

    def __init__(self) -> None:
        self._nodes: Dict[str, KnowledgeNode] = {}

    def register(self, node: KnowledgeNode) -> None:
        if node.knowledge_id in self._nodes:
            raise ValueError(f"Duplicate knowledge_id: {node.knowledge_id}")
        self._nodes[node.knowledge_id] = node

    def get(self, knowledge_id: str) -> Optional[KnowledgeNode]:
        return self._nodes.get(knowledge_id)

    def get_all(self) -> List[KnowledgeNode]:
        return list(self._nodes.values())

    def get_by_domain(self, domain: KnowledgeDomain) -> List[KnowledgeNode]:
        return [n for n in self._nodes.values() if n.domain == domain]

    def get_available_for_agent(self, mastered_ids: Set[str]) -> List[KnowledgeNode]:
        """Returns knowledge nodes whose prerequisites are fully met and not yet mastered."""
        available = []
        for node in self._nodes.values():
            if node.knowledge_id in mastered_ids:
                continue
            if all(prereq in mastered_ids for prereq in node.prerequisites):
                available.append(node)
        return available

    def validate_graph(self) -> None:
        """Ensures that all prerequisites reference valid registered nodes and checks for cycles."""
        for kid, node in self._nodes.items():
            for prereq in node.prerequisites:
                if prereq not in self._nodes:
                    raise ValueError(
                        f"Knowledge '{kid}' has missing prerequisite '{prereq}'"
                    )

        # Cycle detection using DFS
        visited: Dict[str, int] = {}  # 0: unvisited, 1: visiting, 2: visited

        def dfs(curr_id: str) -> None:
            visited[curr_id] = 1
            node = self._nodes[curr_id]
            for prereq in node.prerequisites:
                state = visited.get(prereq, 0)
                if state == 1:
                    raise ValueError(f"Cycle detected in knowledge graph involving: {prereq}")
                if state == 0:
                    dfs(prereq)
            visited[curr_id] = 2

        for kid in self._nodes:
            if visited.get(kid, 0) == 0:
                dfs(kid)


def build_default_knowledge_nodes() -> List[KnowledgeNode]:
    """Generates the canonical 13-domain dataset of human civilisational knowledge."""
    return [
        # 1. Stone Age
        KnowledgeNode(
            knowledge_id="fire_control",
            domain=KnowledgeDomain.STONE_AGE,
            title="Controlled Fire Making",
            description="Techniques for creating and sustaining fire using friction and spark tools.",
            related_activity="cooking_and_warmth",
            related_skill="foraging",
            difficulty=0.15,
            prerequisites=[],
            learning_outcomes={"cold_resistance": 0.3, "nutrition_absorption": 0.25},
            historical_context="Mastered by early hominins over 400,000 years ago, enabling cooking and migration to colder climates.",
        ),
        KnowledgeNode(
            knowledge_id="flint_knapping",
            domain=KnowledgeDomain.STONE_AGE,
            title="Flint Knapping & Toolmaking",
            description="Conchoidal flaking to shape stone, chert, and obsidian into bifacial handaxes.",
            related_activity="crafting",
            related_skill="crafting",
            difficulty=0.20,
            prerequisites=[],
            learning_outcomes={"foraging_yield": 0.2, "defense_bonus": 0.15},
            historical_context="Oldowan and Acheulean lithic traditions formed the foundation of early human tool production.",
        ),

        # 2. Agricultural Development
        KnowledgeNode(
            knowledge_id="plant_domestication",
            domain=KnowledgeDomain.AGRICULTURAL_DEVELOPMENT,
            title="Seed Selection & Domestication",
            description="Identifying wild cereal grains with non-shattering rachis and intentional planting.",
            related_activity="farming",
            related_skill="farming",
            difficulty=0.30,
            prerequisites=["flint_knapping"],
            learning_outcomes={"food_production_yield": 0.5, "sedentary_stability": 0.4},
            historical_context="Developed during the Neolithic Revolution circa 10,000 BCE across the Fertile Crescent.",
        ),
        KnowledgeNode(
            knowledge_id="irrigation_canals",
            domain=KnowledgeDomain.AGRICULTURAL_DEVELOPMENT,
            title="Canal Irrigation",
            description="Diverting river waters across dykes and field channels to stabilize seasonal harvest.",
            related_activity="infrastructure",
            related_skill="engineering",
            difficulty=0.40,
            prerequisites=["plant_domestication"],
            learning_outcomes={"drought_resilience": 0.6, "carrying_capacity_multiplier": 1.5},
            historical_context="Adopted in ancient Mesopotamia along the Tigris and Euphrates rivers around 5000 BCE.",
        ),

        # 3. Early Settlements
        KnowledgeNode(
            knowledge_id="mudbrick_architecture",
            domain=KnowledgeDomain.EARLY_SETTLEMENTS,
            title="Sun-Dried Mudbrick Masonry",
            description="Forming clay, loam, and straw into uniform rectangular blocks for durable shelters.",
            related_activity="construction",
            related_skill="construction",
            difficulty=0.30,
            prerequisites=["plant_domestication"],
            learning_outcomes={"shelter_quality": 0.4, "population_density_limit": 2.0},
            historical_context="Pioneered in sites like Jericho and Catalhoyuk, replacing nomadic hide tents with permanent hamlets.",
        ),
        KnowledgeNode(
            knowledge_id="granary_storage",
            domain=KnowledgeDomain.EARLY_SETTLEMENTS,
            title="Granary Grain Storage",
            description="Elevated, rodent-proof clay silos preventing spoilage of seasonal crop surpluses.",
            related_activity="storage",
            related_skill="logistics",
            difficulty=0.35,
            prerequisites=["mudbrick_architecture"],
            learning_outcomes={"spoilage_reduction": 0.7, "winter_survival": 0.5},
            historical_context="Enabled long-term food surplus storage, freeing labor for specialized non-farming crafts.",
        ),

        # 4. Ancient Trade
        KnowledgeNode(
            knowledge_id="barter_standards",
            domain=KnowledgeDomain.ANCIENT_TRADE,
            title="Standardized Commodity Barter",
            description="Establishing common ratios of exchange based on fixed units of barley, cattle, or beads.",
            related_activity="trading",
            related_skill="trading",
            difficulty=0.35,
            prerequisites=["granary_storage"],
            learning_outcomes={"trade_efficiency": 0.35, "diplomatic_affinity": 0.2},
            historical_context="Emergence of formalized markets between agriculturalists and pastoral nomads.",
        ),
        KnowledgeNode(
            knowledge_id="weights_and_measures",
            domain=KnowledgeDomain.ANCIENT_TRADE,
            title="Standard Weights and Measures",
            description="Using carved stone weights (shekels, minas) to evaluate metals and bulk commodities fairly.",
            related_activity="market_exchange",
            related_skill="trading",
            difficulty=0.45,
            prerequisites=["barter_standards"],
            learning_outcomes={"trade_friction_reduction": 0.5, "merchant_profit": 0.3},
            historical_context="Standardized under the Indus Valley Civilization and ancient Sumerian trade guilds.",
        ),

        # 5. Writing and Communication
        KnowledgeNode(
            knowledge_id="cuneiform_records",
            domain=KnowledgeDomain.WRITING_AND_COMMUNICATION,
            title="Proto-Cuneiform Accounting",
            description="Incising clay tablets with reed styluses to tally livestock, granary rations, and labor.",
            related_activity="record_keeping",
            related_skill="administration",
            difficulty=0.45,
            prerequisites=["weights_and_measures"],
            learning_outcomes={"tax_collection_efficiency": 0.4, "memory_retention_civilisation": 0.5},
            historical_context="Invented in Uruk around 3200 BCE initially for fiscal ledgers before literary use.",
        ),
        KnowledgeNode(
            knowledge_id="phonetic_alphabet",
            domain=KnowledgeDomain.WRITING_AND_COMMUNICATION,
            title="Phonetic Alphabet",
            description="A concise system of 20-30 graphemes representing single phonemes rather than thousands of ideograms.",
            related_activity="education",
            related_skill="teaching",
            difficulty=0.50,
            prerequisites=["cuneiform_records"],
            learning_outcomes={"literacy_rate_multiplier": 2.5, "knowledge_sharing_speed": 0.6},
            historical_context="Developed by Phoenician seafaring merchants around 1200 BCE, democratizing literacy.",
        ),

        # 6. Mathematics
        KnowledgeNode(
            knowledge_id="practical_arithmetic",
            domain=KnowledgeDomain.MATHEMATICS,
            title="Positional Base-60/Base-10 Arithmetic",
            description="Techniques for multi-digit addition, subtraction, division, and fractions for trade and surveying.",
            related_activity="accounting",
            related_skill="administration",
            difficulty=0.40,
            prerequisites=["cuneiform_records"],
            learning_outcomes={"resource_allocation_optimality": 0.3, "building_cost_reduction": 0.15},
            historical_context="Used by Babylonian scribes to calculate interest, compound taxes, and agricultural yields.",
        ),
        KnowledgeNode(
            knowledge_id="euclidean_geometry",
            domain=KnowledgeDomain.MATHEMATICS,
            title="Axiomatic Plane Geometry",
            description="Mathematical deduction proving properties of angles, triangles, circles, and area calculations.",
            related_activity="architecture",
            related_skill="engineering",
            difficulty=0.60,
            prerequisites=["practical_arithmetic"],
            learning_outcomes={"construction_structural_integrity": 0.5, "monumental_architecture_unlocked": 1.0},
            historical_context="Formalized by Euclid of Alexandria circa 300 BCE, underpinning centuries of structural design.",
        ),

        # 7. Engineering
        KnowledgeNode(
            knowledge_id="the_wheel_and_axle",
            domain=KnowledgeDomain.ENGINEERING,
            title="Solid Wheel and Axle",
            description="Mounting circular wooden disks on revolving shafts for heavy wheeled carts and pottery.",
            related_activity="transport",
            related_skill="engineering",
            difficulty=0.35,
            prerequisites=["mudbrick_architecture"],
            learning_outcomes={"transport_capacity": 3.0, "travel_time_reduction": 0.4},
            historical_context="Invented independently in Mesopotamia and the Caucasus circa 3500 BCE.",
        ),
        KnowledgeNode(
            knowledge_id="bronze_metallurgy",
            domain=KnowledgeDomain.ENGINEERING,
            title="Bronze Smelting and Alloying",
            description="Smelting copper with approximately 10-12% tin in crucible furnaces to create resilient weapons and plowshares.",
            related_activity="metallurgy",
            related_skill="crafting",
            difficulty=0.55,
            prerequisites=["the_wheel_and_axle", "fire_control"],
            learning_outcomes={"tool_durability": 2.0, "military_power": 0.6},
            historical_context="Began around 3300 BCE, igniting long-distance maritime trade for scarce tin deposits.",
        ),

        # 8. Medicine
        KnowledgeNode(
            knowledge_id="herbal_pharmacopeia",
            domain=KnowledgeDomain.MEDICINE,
            title="Herbalism & Natural Antiseptics",
            description="Preparation of willow bark (salicin), honey poultices, and dried medicinal herbs for wound care.",
            related_activity="healing",
            related_skill="medicine",
            difficulty=0.35,
            prerequisites=["plant_domestication"],
            learning_outcomes={"infection_mortality_reduction": 0.4, "life_expectancy_increase": 5.0},
            historical_context="Practiced across ancient Egypt (Ebers Papyrus) and traditional Chinese herbal traditions.",
        ),
        KnowledgeNode(
            knowledge_id="sanitation_aqueducts",
            domain=KnowledgeDomain.MEDICINE,
            title="Clean Water Aqueducts and Latrines",
            description="Separating potable drinking water channels from sewage runoff and domestic waste.",
            related_activity="public_health",
            related_skill="medicine",
            difficulty=0.55,
            prerequisites=["herbal_pharmacopeia", "euclidean_geometry"],
            learning_outcomes={"epidemic_resistance": 0.7, "health_baseline": 0.3},
            historical_context="Engineered extensively by Roman civil architects to safeguard dense urban populations.",
        ),

        # 9. Astronomy
        KnowledgeNode(
            knowledge_id="lunar_solar_calendar",
            domain=KnowledgeDomain.ASTRONOMY,
            title="Intercalated Soli-Lunar Calendar",
            description="Tracking solstices and lunar cycles to predict annual floods and optimal planting periods.",
            related_activity="temporal_planning",
            related_skill="administration",
            difficulty=0.45,
            prerequisites=["practical_arithmetic"],
            learning_outcomes={"harvest_success_probability": 0.25, "civic_holiday_cohesion": 0.2},
            historical_context="Observed by Mayan, Egyptian, and Babylonian skywatchers to align civic life with seasonal rhythm.",
        ),

        # 10. Navigation
        KnowledgeNode(
            knowledge_id="coastal_sailing",
            domain=KnowledgeDomain.NAVIGATION,
            title="Square-Rigged Coastal Sailing",
            description="Harnessing wind propulsion with square sails to move heavy cargoes along littoral shores.",
            related_activity="voyaging",
            related_skill="navigation",
            difficulty=0.45,
            prerequisites=["the_wheel_and_axle"],
            learning_outcomes={"maritime_trade_range": 3.0, "food_yield_fishing": 0.5},
            historical_context="Minoan and Phoenician sailors connected Mediterranean trade hubs by coast-hugging routes.",
        ),
        KnowledgeNode(
            knowledge_id="magnetic_compass",
            domain=KnowledgeDomain.NAVIGATION,
            title="Lodestone Magnetic Compass",
            description="Suspending magnetized needles in water or on pivots to discern magnetic north without visible stars.",
            related_activity="open_sea_voyaging",
            related_skill="navigation",
            difficulty=0.60,
            prerequisites=["coastal_sailing", "bronze_metallurgy"],
            learning_outcomes={"shipwreck_rate_reduction": 0.6, "transoceanic_range": 5.0},
            historical_context="Invented during the Chinese Han and Song Dynasties, later revolutionizing global maritime exploration.",
        ),

        # 11. Scientific Discoveries
        KnowledgeNode(
            knowledge_id="scientific_method",
            domain=KnowledgeDomain.SCIENTIFIC_DISCOVERIES,
            title="Baconian Empirical Method",
            description="Systematic formulation of hypotheses, controlled experimentation, and peer verification.",
            related_activity="research",
            related_skill="science",
            difficulty=0.70,
            prerequisites=["phonetic_alphabet", "euclidean_geometry"],
            learning_outcomes={"invention_discovery_rate": 2.0, "superstition_bias_reduction": 0.8},
            historical_context="Codified during the European Scientific Revolution by Francis Bacon, Galileo, and Newton.",
        ),

        # 12. Industrial Development
        KnowledgeNode(
            knowledge_id="steam_engine",
            domain=KnowledgeDomain.INDUSTRIAL_DEVELOPMENT,
            title="Atmospheric Reciprocating Steam Engine",
            description="Converting the thermodynamic energy of expanding steam into mechanical piston work.",
            related_activity="factory_production",
            related_skill="engineering",
            difficulty=0.75,
            prerequisites=["scientific_method"],
            learning_outcomes={"manufacturing_output_multiplier": 5.0, "labor_productivity": 4.0},
            historical_context="Refined by James Watt in 1776, untethering mechanical work from animal muscle and river watermills.",
        ),

        # 13. Modern Technology
        KnowledgeNode(
            knowledge_id="electrical_power_grid",
            domain=KnowledgeDomain.MODERN_TECHNOLOGY,
            title="AC Electrical Power Distribution",
            description="Generation, step-up transformation, and alternating current transmission over high-voltage grids.",
            related_activity="power_generation",
            related_skill="engineering",
            difficulty=0.85,
            prerequisites=["steam_engine"],
            learning_outcomes={"energy_distribution_efficiency": 10.0, "night_activity_penalty_reduction": 0.9},
            historical_context="Pioneered by Nikola Tesla and Westinghouse in the 1890s, powering modern factories and cities.",
        ),
        KnowledgeNode(
            knowledge_id="digital_computing",
            domain=KnowledgeDomain.MODERN_TECHNOLOGY,
            title="Stored-Program Digital Computing",
            description="Von Neumann computing architectures using binary logic gates and magnetic/solid-state storage.",
            related_activity="information_processing",
            related_skill="science",
            difficulty=0.90,
            prerequisites=["electrical_power_grid"],
            learning_outcomes={"calculation_speed_multiplier": 1000.0, "simulation_fidelity": 1.0},
            historical_context="Developed during mid-20th century (ENIAC, Turing, Manchester Baby), driving the Information Age.",
        ),
    ]


def get_default_knowledge_registry() -> KnowledgeRegistry:
    """Factory creating and validating a singleton KnowledgeRegistry populated with all 13 domains."""
    registry = KnowledgeRegistry()
    for node in build_default_knowledge_nodes():
        registry.register(node)
    registry.validate_graph()
    return registry
