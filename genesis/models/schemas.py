"""Request bodies for the API (validated by Pydantic)."""
from typing import Optional
from pydantic import BaseModel, Field


class ConfirmBody(BaseModel):
    confirm: bool = False


class BuildBody(BaseModel):
    type: str
    x: int
    z: int
    confirm: bool = False


class SpeedBody(BaseModel):
    speed: int


class StepBody(BaseModel):
    days: int = Field(1, ge=1, le=30)


class ResearchBody(BaseModel):
    tech: str


class ExperimentBody(BaseModel):
    key: str
    confirm: bool = False


class SnapshotBody(BaseModel):
    name: str = ""


class BranchBody(BaseModel):
    preset: str = "none"
    name: str = ""
    snapshot_id: Optional[str] = None


class AdvanceBody(BaseModel):
    days: int = Field(1, ge=1, le=120)


class NewWorldBody(BaseModel):
    seed: int = 42
    name: str = "My Civilisation"
    confirm: bool = False
