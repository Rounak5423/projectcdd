"""OCEAN Five-Factor Personality Trait Model for Genesis Citizens."""

import random
from pydantic import BaseModel, Field


class PersonalityMatrix(BaseModel):
    """Five-Factor Model (OCEAN) traits normalized between 0.0 and 1.0."""

    openness: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Intellectual curiosity, creativity, and receptivity to new knowledge"
    )
    conscientiousness: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Diligence, goal-directed behavior, and work ethic"
    )
    extraversion: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Desire for social interaction, communication, and teaching others"
    )
    agreeableness: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Altruism, willingness to share resources, and cooperativeness"
    )
    neuroticism: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Sensitivity to resource scarcity, risk aversion, and stress"
    )

    @classmethod
    def generate_random(cls, rng: random.Random) -> "PersonalityMatrix":
        """Generates a realistic personality sample using bounded Gaussian distributions."""
        return cls(
            openness=max(0.0, min(1.0, rng.gauss(0.5, 0.15))),
            conscientiousness=max(0.0, min(1.0, rng.gauss(0.5, 0.15))),
            extraversion=max(0.0, min(1.0, rng.gauss(0.5, 0.15))),
            agreeableness=max(0.0, min(1.0, rng.gauss(0.5, 0.15))),
            neuroticism=max(0.0, min(1.0, rng.gauss(0.5, 0.15))),
        )
