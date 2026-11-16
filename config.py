"""Genesis Engine Configuration and Global Constants.

Provides default simulation constants, limits, and environmental parameters.
"""

from typing import Final

# Simulation Defaults
DEFAULT_SIMULATION_SPEED: Final[float] = 1.0  # Ticks per second
DEFAULT_RANDOM_SEED: Final[int] = 42
MAX_HISTORY_SNAPSHOTS: Final[int] = 1000

# Citizen Metabolic & Vital Defaults
DEFAULT_BASE_HUNGER_RATE: Final[float] = 2.0     # Hunger accumulated per tick (scale 0-100)
DEFAULT_BASE_FATIGUE_RATE: Final[float] = 1.5    # Fatigue accumulated per tick (scale 0-100)
STARVATION_THRESHOLD: Final[float] = 90.0        # Health decay starts above this hunger
FATIGUE_EXHAUSTION_THRESHOLD: Final[float] = 85.0
MAX_AGENT_AGE_TICKS: Final[int] = 800            # Lifespan in ticks (approx. 80 years at 10 ticks/year)

# Cognitive Constants
MIN_INTELLIGENCE: Final[float] = 10.0
MAX_INTELLIGENCE: Final[float] = 200.0
DEFAULT_BASE_MEMORY_CAPACITY: Final[int] = 10
MEMORY_RETENTION_DECAY: Final[float] = 0.05      # Fractional importance loss per tick
KNOWLEDGE_MASTERY_THRESHOLD: Final[float] = 0.7  # Mastery required to teach another citizen

# Governance Types
GOVERNANCE_DEMOCRACY: Final[str] = "democracy"
GOVERNANCE_AUTOCRACY: Final[str] = "autocracy"
GOVERNANCE_COUNCIL: Final[str] = "council"
GOVERNANCE_LAISSEZ_FAIRE: Final[str] = "laissez_faire"
