"""
GENESIS Engine v2.0 - Governance Subsystem Module
Module: engine.modules.governance
Policy enactment with implementation delay, ongoing cost, effects, and trade-offs
(8 policies, with 3 fully working: universal healthcare, clean energy subsidies, congestion pricing),
public trust, and protest dynamics mathematically tied to grievance and inequality.
"""

from typing import Dict, List, Optional, Any, Tuple
from .config import POLICY_CATALOG


class GovernanceModule:
    """
    Manages public policy enactment, activation delays, costs, trade-offs,
    and public trust/protest dynamics.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        # State of policies: id -> {"status": "active"|"pending"|"inactive", "ticks_remaining": int}
        self.policy_states: Dict[str, Dict[str, Any]] = {}
        for pid, pdata in POLICY_CATALOG.items():
            self.policy_states[pid] = {
                "id": pid,
                "name": pdata["name"],
                "category": pdata["category"],
                "status": "inactive",
                "ticks_remaining": 0,
                "cost_credits_per_day": pdata["cost_credits_per_day"]
            }

        self.public_trust: float = 0.82
        self.protest_intensity: float = 0.0
        self.grievance_index: float = 0.15
        self.active_strikes: bool = False

    def enact_policy(self, policy_id: str) -> Dict[str, Any]:
        """Queues a policy for implementation after its activation delay."""
        if policy_id not in POLICY_CATALOG:
            return {"status": "error", "message": f"Policy '{policy_id}' not found"}

        pinfo = POLICY_CATALOG[policy_id]
        state = self.policy_states[policy_id]
        if state["status"] == "active":
            return {"status": "already_active", "policy_id": policy_id}

        state["status"] = "pending"
        state["ticks_remaining"] = pinfo["activation_delay_ticks"]
        return {
            "status": "queued",
            "policy_id": policy_id,
            "delay_ticks": pinfo["activation_delay_ticks"]
        }

    def revoke_policy(self, policy_id: str) -> Dict[str, Any]:
        """Revokes an active or pending policy."""
        if policy_id not in self.policy_states:
            return {"status": "error", "message": f"Policy '{policy_id}' not found"}
        self.policy_states[policy_id]["status"] = "inactive"
        self.policy_states[policy_id]["ticks_remaining"] = 0
        return {"status": "revoked", "policy_id": policy_id}

    def step(
        self,
        ticks: int,
        average_happiness: float,
        gini_coefficient: float,
        unmet_needs_ratio: float,
        recent_deaths_rate: float
    ) -> Tuple[Dict[str, float], Dict[str, Any]]:
        """
        Processes activation timers, updates public trust, and evaluates protest dynamics.
        Returns (active_policy_multipliers, governance_summary).
        """
        # 1. Update Pending Policy Timers
        just_activated = []
        daily_policy_costs = 0.0
        multipliers: Dict[str, float] = {}

        for pid, state in self.policy_states.items():
            pinfo = POLICY_CATALOG[pid]
            if state["status"] == "pending":
                state["ticks_remaining"] = max(0, state["ticks_remaining"] - ticks)
                if state["ticks_remaining"] == 0:
                    state["status"] = "active"
                    just_activated.append(pid)

            if state["status"] == "active":
                daily_policy_costs += state["cost_credits_per_day"]
                # Accumulate multipliers
                for eff_key, eff_val in pinfo.get("effects", {}).items():
                    multipliers[eff_key] = multipliers.get(eff_key, 0.0) + eff_val

        # 2. Grievance and Public Trust
        # Grievance formula:
        # Grievance = 0.35*(1-happiness) + 0.20*Gini + 0.30*unmet_needs + 0.25*recent_deaths_rate
        g_raw = (
            0.35 * max(0.0, 1.0 - average_happiness) +
            0.20 * max(0.0, gini_coefficient - 0.25) * 2.0 +
            0.30 * unmet_needs_ratio +
            0.25 * min(1.0, recent_deaths_rate * 50.0)
        )
        self.grievance_index = round(max(0.0, min(1.0, g_raw)), 3)

        # Public trust decays with grievance, recovers when people are happy
        if self.grievance_index > 0.40:
            self.public_trust = max(0.05, self.public_trust - (self.grievance_index - 0.40) * 0.05 * (ticks / 24.0))
        else:
            self.public_trust = min(1.0, self.public_trust + 0.02 * (ticks / 24.0))

        # 3. Protest Dynamics
        # Protests ignite when grievance crosses 0.50 or trust falls below 0.30
        if self.grievance_index > 0.50 or self.public_trust < 0.30:
            target_protest = min(1.0, (self.grievance_index - 0.40) * 2.0)
            self.protest_intensity = min(1.0, self.protest_intensity + (target_protest - self.protest_intensity) * 0.2)
        else:
            self.protest_intensity = max(0.0, self.protest_intensity - 0.08 * (ticks / 24.0))

        self.active_strikes = self.protest_intensity > 0.60

        gov_summary = {
            "public_trust": round(self.public_trust, 3),
            "grievance_index": self.grievance_index,
            "protest_intensity": round(self.protest_intensity, 3),
            "active_strikes": self.active_strikes,
            "daily_policy_costs": round(daily_policy_costs, 2),
            "active_policies": [pid for pid, s in self.policy_states.items() if s["status"] == "active"],
            "pending_policies": [pid for pid, s in self.policy_states.items() if s["status"] == "pending"],
            "just_activated": just_activated
        }

        return multipliers, gov_summary
