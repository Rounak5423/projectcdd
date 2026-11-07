"""Skill System and Practice Mechanics for Genesis Citizens."""

import math
from enum import Enum
from typing import Dict
from pydantic import BaseModel, Field


class SkillType(str, Enum):
    FORAGING = "foraging"
    FARMING = "farming"
    CONSTRUCTION = "construction"
    CRAFTING = "crafting"
    MEDICINE = "medicine"
    TRADING = "trading"
    LEADERSHIP = "leadership"
    SCIENCE = "science"
    NAVIGATION = "navigation"


class SkillRecord(BaseModel):
    """Tracks a citizen's proficiency and experience in a distinct trade or capability."""

    skill_type: SkillType
    level: int = Field(default=1, ge=1, le=100)
    current_xp: float = Field(default=0.0, ge=0.0)
    total_xp: float = Field(default=0.0, ge=0.0)

    @property
    def xp_for_next_level(self) -> float:
        """Non-linear XP curve: threshold = 50 * (level ^ 1.35)."""
        return 50.0 * math.pow(self.level, 1.35)

    def gain_xp(self, base_xp: float, intelligence: float, conscientiousness: float) -> bool:
        """Applies XP modified by cognitive and personality attributes.

        Returns True if a level-up occurred.
        """
        # Intelligence accelerates comprehension; conscientiousness improves deliberate practice
        learning_efficiency = (intelligence / 100.0) * (0.8 + 0.4 * conscientiousness)
        effective_xp = max(0.1, base_xp * learning_efficiency)

        self.current_xp += effective_xp
        self.total_xp += effective_xp

        leveled_up = False
        while self.current_xp >= self.xp_for_next_level and self.level < 100:
            self.current_xp -= self.xp_for_next_level
            self.level += 1
            leveled_up = True
        return leveled_up


class SkillInventory(BaseModel):
    """Collection of an agent's skills."""

    skills: Dict[str, SkillRecord] = Field(default_factory=dict)

    def __init__(self, **data) -> None:
        super().__init__(**data)
        # Initialize default skills at level 1 if not present
        if not self.skills:
            for st in SkillType:
                self.skills[st.value] = SkillRecord(skill_type=st)

    def get_level(self, skill: SkillType) -> int:
        record = self.skills.get(skill.value)
        return record.level if record else 1

    def practice(
        self,
        skill: SkillType,
        base_xp: float,
        intelligence: float,
        conscientiousness: float,
    ) -> bool:
        if skill.value not in self.skills:
            self.skills[skill.value] = SkillRecord(skill_type=skill)
        return self.skills[skill.value].gain_xp(base_xp, intelligence, conscientiousness)
