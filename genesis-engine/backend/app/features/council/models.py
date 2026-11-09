"""
CIVORA — Council of Advisors Database Models (SQLAlchemy & Declarative Schema)
"""

import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class CouncilAdvisor(Base):
    """Permanent civilisational council advisor identity."""
    __tablename__ = "council_advisors"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    title = Column(String(128), nullable=False)
    domain = Column(String(128), nullable=False)
    role = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    responsibilities = Column(Text, nullable=False, default="[]")  # JSON array
    portrait_url = Column(String(256), nullable=True)
    portrait_symbol = Column(String(32), nullable=True)
    accent_color = Column(String(32), nullable=True)
    motto = Column(String(256), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(String(64), nullable=False)
    updated_at = Column(String(64), nullable=False)

    # Relationships
    session_participations = relationship(
        "CouncilSessionAdvisor", back_populates="advisor", cascade="all, delete-orphan"
    )
    recommendations = relationship(
        "CouncilRecommendation", back_populates="advisor", cascade="all, delete-orphan"
    )


class CouncilSession(Base):
    """A formal council deliberation session convened in royal chambers."""
    __tablename__ = "council_sessions"

    id = Column(String(64), primary_key=True)
    world_id = Column(String(64), ForeignKey("worlds.id", ondelete="CASCADE"), nullable=False, index=True)
    session_number = Column(Integer, default=1, nullable=False)
    title = Column(String(256), nullable=False)
    status = Column(String(32), default="scheduled", nullable=False, index=True)  # scheduled, active, completed, cancelled
    sim_year = Column(Integer, default=2026, nullable=False)
    sim_day = Column(Integer, default=1, nullable=False)
    convened_by = Column(String(128), default="The Sovereign High Directorate", nullable=False)
    agenda_topics = Column(Text, default="[]", nullable=False)  # JSON array
    summary = Column(Text, nullable=True)
    opening_address = Column(Text, nullable=True)
    started_at = Column(String(64), nullable=True)
    ended_at = Column(String(64), nullable=True)
    created_by = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String(64), nullable=False, index=True)
    updated_at = Column(String(64), nullable=False)

    # Relationships
    participating_advisors = relationship(
        "CouncilSessionAdvisor", back_populates="session", cascade="all, delete-orphan"
    )
    recommendations = relationship(
        "CouncilRecommendation", back_populates="session"
    )
    decisions = relationship(
        "CouncilDecision", back_populates="session", cascade="all, delete-orphan"
    )
    events = relationship(
        "CouncilSessionEvent", back_populates="session", cascade="all, delete-orphan"
    )


class CouncilSessionAdvisor(Base):
    """Participation of an advisor in a specific council session."""
    __tablename__ = "council_session_advisors"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("council_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    advisor_id = Column(String(64), ForeignKey("council_advisors.id", ondelete="CASCADE"), nullable=False, index=True)
    participation_status = Column(String(32), default="present", nullable=False)
    briefing_snapshot = Column(Text, default="{}", nullable=False)  # JSON object
    created_at = Column(String(64), nullable=False)

    # Relationships
    session = relationship("CouncilSession", back_populates="participating_advisors")
    advisor = relationship("CouncilAdvisor", back_populates="session_participations")


class CouncilRecommendation(Base):
    """An official policy, infrastructural, or fiscal recommendation proposed by an advisor."""
    __tablename__ = "council_recommendations"

    id = Column(String(64), primary_key=True)
    world_id = Column(String(64), ForeignKey("worlds.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("council_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    advisor_id = Column(String(64), ForeignKey("council_advisors.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    justification = Column(Text, default="", nullable=False)
    expected_benefits = Column(Text, default="[]", nullable=False)  # JSON array
    potential_risks = Column(Text, default="[]", nullable=False)  # JSON array
    estimated_cost_crc = Column(Float, default=0.0, nullable=False)
    political_capital_req = Column(Float, default=0.0, nullable=False)
    category = Column(String(64), default="Policy", nullable=False)
    priority = Column(String(32), default="medium", nullable=False, index=True)  # low, medium, high, critical
    status = Column(String(32), default="proposed", nullable=False, index=True)  # proposed, under_review, accepted, rejected, implemented, expired
    proposed_at = Column(String(64), nullable=False)
    reviewed_at = Column(String(64), nullable=True)
    reviewed_by = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_notes = Column(Text, nullable=True)
    implementation_reference = Column(String(128), nullable=True)
    created_at = Column(String(64), nullable=False, index=True)
    updated_at = Column(String(64), nullable=False)

    # Relationships
    session = relationship("CouncilSession", back_populates="recommendations")
    advisor = relationship("CouncilAdvisor", back_populates="recommendations")
    decisions = relationship("CouncilDecision", back_populates="recommendation")


class CouncilDecision(Base):
    """An authoritative sovereign decree recorded during a council session."""
    __tablename__ = "council_decisions"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("council_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_id = Column(String(64), ForeignKey("council_recommendations.id", ondelete="SET NULL"), nullable=True, index=True)
    advisor_id = Column(String(64), ForeignKey("council_advisors.id", ondelete="SET NULL"), nullable=True)
    decision_type = Column(String(64), default="ratification", nullable=False)
    decision_text = Column(Text, nullable=False)
    outcome = Column(String(64), nullable=False)  # Ratified, Vetoed, Referred to Committee
    decided_by = Column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(String(64), nullable=False)
    metadata_json = Column(Text, default="{}", nullable=False)

    # Relationships
    session = relationship("CouncilSession", back_populates="decisions")
    recommendation = relationship("CouncilRecommendation", back_populates="decisions")


class CouncilSessionEvent(Base):
    """Historical audit event for council proceedings and decisions."""
    __tablename__ = "council_session_events"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("council_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)  # session_started, briefing_added, etc.
    description = Column(Text, nullable=False)
    actor_id = Column(String(64), nullable=True)
    metadata_json = Column(Text, default="{}", nullable=False)
    created_at = Column(String(64), nullable=False, index=True)

    # Relationships
    session = relationship("CouncilSession", back_populates="events")

