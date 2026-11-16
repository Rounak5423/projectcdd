"""Adaptive AI and Dynamic Citizen Cognition Subsystem.

Empowers individual citizens to cognitively evaluate active world scenarios,
generate first-person thoughts and dialogue, and dynamically adapt decision utilities.
"""

from typing import Optional, Dict, Any, List
from genesis.agents.personality import PersonalityMatrix
from genesis.agents.skills import SkillType


def generate_citizen_thought(
    agent_name: str,
    intelligence: float,
    personality: PersonalityMatrix,
    health: float,
    hunger: float,
    thirst: float,
    current_action: str,
    active_scenario_priority: str = "NORMAL",
    scenario_title: Optional[str] = None,
) -> str:
    """Generates an intuitive, personality-driven, first-person thought bubble for the player to read."""
    # 1. Critical Physiological Distress Overrides
    if health < 30.0:
        return f"I'm feeling so weak... I need shelter and rest to survive."
    if thirst > 75.0:
        return f"My throat is parched... finding clean water is my only thought!"
    if hunger > 75.0:
        return f"Starving... I must find food right away before my strength gives out."

    # 2. Scenario-Specific Cognitive Reactions
    if active_scenario_priority == "WATER_CONSERVATION":
        if intelligence > 115:
            return f"The riverbeds are drying up. If we build irrigation channels soon, we can salvage the crops."
        elif personality.agreeableness > 0.6:
            return f"Water is scarce, but I'll make sure the children and elders get their share first."
        elif personality.neuroticism > 0.6:
            return f"The drought is terrifying... what if the wells completely run dry?"
        else:
            return f"Digging for water near the dried creek bed before noon."

    elif active_scenario_priority == "WARMTH_SHELTER":
        if personality.conscientiousness > 0.6:
            return f"The frost is bitter. We need dry timber stockpiled for the hearth fires tonight."
        elif intelligence > 115:
            return f"Stone and mudbrick insulate far better than hide tents against this freezing wind."
        else:
            return f"Shivering by the fire. We must gather more firewood before nightfall."

    elif active_scenario_priority == "MEDICAL_EMERGENCY":
        if intelligence > 110:
            return f"I'm boiling willow bark and herbs to soothe the fever of our afflicted neighbors."
        else:
            return f"Many in the village are coughing. We must keep our drinking water clean."

    elif active_scenario_priority == "RESEARCH_BOOM":
        if personality.openness > 0.6:
            return f"The world feels alive with ideas! I have an intuition about better pottery and smelting."
        elif personality.extraversion > 0.6:
            return f"Gather round the council fire—let me share what I learned from our elders!"
        else:
            return f"A peaceful, prosperous season. Perfect time to practice our crafts."

    # 3. Action-Specific Normal Thoughts
    if current_action == "study_knowledge":
        return f"Fascinating... contemplating how this discovery can improve our whole settlement."
    elif current_action == "teach_neighbor":
        return f"Teaching is wonderful. Watching my fellow citizen understand brings me joy."
    elif current_action == "forage_food":
        return f"Searching the meadows for ripe berries and edible roots."
    elif current_action == "gather_water":
        return f"Carrying cool fresh water back from the river."
    elif current_action == "chop_wood":
        return f"Hewing sturdy timber for tool shafts and construction."
    elif current_action == "mine_stone":
        return f"Shaping flint and quarry stones into durable masonry."
    elif current_action == "rest":
        return f"Resting peacefully under the shade to regain my vitality."
    elif current_action == "eat":
        return f"Enjoying a hearty meal. Nothing beats fresh roasted provisions."

    # 4. Default Reflective Thought
    if personality.openness > 0.7:
        return f"Looking at the stars tonight, wondering what lies beyond our valley."
    elif personality.conscientiousness > 0.7:
        return f"Everything is orderly. Our stockpiles are well kept."
    else:
        return f"Another good day in our growing settlement."


def get_adaptive_utility_modifiers(active_scenario_priority: str) -> Dict[str, float]:
    """Provides utility bonus multipliers based on the community's adaptive response to crises."""
    mods = {
        "water_mult": 1.0,
        "food_mult": 1.0,
        "wood_mult": 1.0,
        "stone_mult": 1.0,
        "study_mult": 1.0,
        "teach_mult": 1.0,
        "rest_mult": 1.0,
    }

    if active_scenario_priority == "WATER_CONSERVATION":
        mods["water_mult"] = 3.0
        mods["study_mult"] = 0.5  # Deprioritize luxury research during acute water crisis

    elif active_scenario_priority == "WARMTH_SHELTER":
        mods["wood_mult"] = 3.0
        mods["stone_mult"] = 2.0
        mods["rest_mult"] = 1.3

    elif active_scenario_priority == "MEDICAL_EMERGENCY":
        mods["rest_mult"] = 2.2
        mods["study_mult"] = 1.8  # Urgent medical research

    elif active_scenario_priority == "RESEARCH_BOOM":
        mods["study_mult"] = 2.5
        mods["teach_mult"] = 2.0

    elif active_scenario_priority == "HARVEST_FEAST":
        mods["food_mult"] = 2.0
        mods["teach_mult"] = 1.5

    return mods
