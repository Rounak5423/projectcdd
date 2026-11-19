"""
GENESIS Engine v2.0 - Events Subsystem Module
Module: engine.modules.events
Stochastic and causal incidents: resource shortages, disease outbreaks, grid blackouts,
traffic gridlocks, industrial accidents, and technological breakthroughs.
"""

import uuid
from typing import Dict, List, Optional, Any
import random


class SimulationEvent:
    def __init__(
        self,
        id: str,
        world_id: str,
        category: str,
        title: str,
        description: str,
        severity: str,
        tick: int,
        year: int,
        day: int,
        duration_ticks: int = 24
    ):
        self.id = id
        self.world_id = world_id
        self.category = category # 'crisis', 'shortage', 'health', 'infrastructure', 'breakthrough'
        self.title = title
        self.description = description
        self.severity = severity # 'low', 'medium', 'high', 'critical'
        self.tick = tick
        self.year = year
        self.day = day
        self.duration_ticks = duration_ticks
        self.remaining_ticks = duration_ticks

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "category": self.category,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "tick": self.tick,
            "year": self.year,
            "day": self.day,
            "remaining_ticks": self.remaining_ticks
        }


class EventsModule:
    """
    Evaluates incident conditions, triggers stochastic events,
    and applies consequences to the shared world state.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.active_events: Dict[str, SimulationEvent] = {}
        self.event_history: List[Dict[str, Any]] = []

    def step(
        self,
        tick: int,
        year: int,
        day: int,
        ticks_passed: int,
        food_stock: float,
        water_stock: float,
        power_deficit: float,
        air_pollution: float,
        protest_intensity: float,
        congestion_index: float,
        rng: Optional[random.Random] = None
    ) -> List[Dict[str, Any]]:
        """
        Advances active event durations and evaluates causal triggers.
        """
        if rng is None:
            rng = random.Random(tick)

        # 1. Age active events
        expired = []
        for eid, ev in self.active_events.items():
            ev.remaining_ticks -= ticks_passed
            if ev.remaining_ticks <= 0:
                expired.append(eid)
        for eid in expired:
            del self.active_events[eid]

        # 2. Evaluate Causal Incident Triggers
        newly_spawned: List[SimulationEvent] = []

        # Food Famine Crisis
        if food_stock <= 0.0 and "event_famine" not in self.active_events:
            ev = SimulationEvent(
                id="event_famine",
                world_id=self.world_id,
                category="shortage",
                title="Critical Food Depletion & Famine",
                description="City grain stockpiles are completely exhausted. Widespread malnutrition and starvation reported.",
                severity="critical",
                tick=tick,
                year=year,
                day=day,
                duration_ticks=48
            )
            self.active_events[ev.id] = ev
            newly_spawned.append(ev)

        # Power Grid Blackout
        if power_deficit > 5.0 and "event_blackout" not in self.active_events:
            ev = SimulationEvent(
                id="event_blackout",
                world_id=self.world_id,
                category="infrastructure",
                title="Rolling Grid Blackout",
                description="Power demand outstrips generation capacity. Sub-stations are shedding load across multiple districts.",
                severity="high",
                tick=tick,
                year=year,
                day=day,
                duration_ticks=24
            )
            self.active_events[ev.id] = ev
            newly_spawned.append(ev)

        # Respiratory Disease Outbreak
        if air_pollution > 0.50 and "event_pollution_health" not in self.active_events:
            ev = SimulationEvent(
                id="event_pollution_health",
                world_id=self.world_id,
                category="health",
                title="Toxic Smog & Respiratory Crisis",
                description="Airborne particulates have exceeded safe thresholds, overloading local clinics.",
                severity="medium",
                tick=tick,
                year=year,
                day=day,
                duration_ticks=72
            )
            self.active_events[ev.id] = ev
            newly_spawned.append(ev)

        # Civil Protest & General Strike
        if protest_intensity > 0.60 and "event_protest_strike" not in self.active_events:
            ev = SimulationEvent(
                id="event_protest_strike",
                world_id=self.world_id,
                category="crisis",
                title="Mass Civil Strike",
                description="Widespread citizen grievance has culminated in civil disobedience and labour walkouts.",
                severity="critical",
                tick=tick,
                year=year,
                day=day,
                duration_ticks=36
            )
            self.active_events[ev.id] = ev
            newly_spawned.append(ev)

        # Stochastic Breakthrough (Rare positive event)
        if rng.random() < 0.002 * (ticks_passed / 24.0) and "event_breakthrough" not in self.active_events:
            ev = SimulationEvent(
                id=f"event_breakthrough_{tick}",
                world_id=self.world_id,
                category="breakthrough",
                title="Scientific Breakthrough: Fusion Catalysis",
                description="Local university researchers discover improved thermal efficiency, boosting power output by 15%.",
                severity="low",
                tick=tick,
                year=year,
                day=day,
                duration_ticks=120
            )
            self.active_events[ev.id] = ev
            newly_spawned.append(ev)

        for ev in newly_spawned:
            self.event_history.append(ev.to_dict())

        return [e.to_dict() for e in self.active_events.values()]
