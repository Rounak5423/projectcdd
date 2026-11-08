"""
CIVORA — Council of Advisors Service
Contains business logic, state transition validations, cross-world access enforcement,
and interfaces for Phase 3 advisor intelligence integration.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.features.council.constants import (
    SYSTEM_ADVISORS,
    PERMANENT_ADVISOR_IDS,
    SESSION_STATUS_SCHEDULED,
    SESSION_STATUS_ACTIVE,
    SESSION_STATUS_COMPLETED,
    SESSION_STATUS_CANCELLED,
    SESSION_STATE_MAPPING,
    REC_STATUS_PROPOSED,
    REC_STATUS_UNDER_REVIEW,
    REC_STATUS_ACCEPTED,
    REC_STATUS_REJECTED,
    REC_STATUS_IMPLEMENTED,
    REC_STATUS_EXPIRED,
    REC_STATUS_FRONTEND_MAPPING,
    ALLOWED_REC_STATUSES,
    ALLOWED_PRIORITIES,
    ALLOWED_OUTCOMES,
)
from app.features.council.repository import CouncilRepository


class AdvisorIntelligenceService:
    """
    Advisor simulation and cognitive intelligence coordinator.
    Connected to the authoritative CIVORA simulation snapshot.
    """

    @staticmethod
    def generate_briefing(world_id: str, advisor_id: str) -> Dict[str, Any]:
        """
        Generates evidence-backed structured briefing from live simulation state.
        Falls back to baseline only if world does not exist yet.
        """
        try:
            from app.features.council.intelligence.orchestrator import CouncilOrchestrator
            orch = CouncilOrchestrator()
            res = orch.analyse_single_advisor(world_id=world_id or "aurora-prime", advisor_id=advisor_id)
            return res.briefing
        except Exception:
            advisor = next((a for a in SYSTEM_ADVISORS if a["id"] == advisor_id), None)
            title = advisor["title"] if advisor else "Advisor"
            return {
                "advisorId": advisor_id,
                "date": "Year 2026 · Cycle 1",
                "headline": f"{title} — Standing Briefing Status",
                "formalSpeech": (
                    f"Sovereign Leader, {title} stands at your disposal in the council chamber. "
                    "Awaiting simulation epoch progression to synthesize real-time cognitive metrics."
                ),
                "supportingObservations": [
                    {
                        "id": f"obs-{advisor_id}-01",
                        "title": "Systemic Baseline Established",
                        "detail": "Ministerial telemetry sensors active. Department awaiting sovereign policy directives.",
                        "severity": "info",
                        "recordedDate": "Epoch 1",
                    }
                ],
                "proposedDirectives": [
                    f"Review pending departmental mandates under {advisor['domain'] if advisor else 'Council'}."
                ],
                "systemicConsequences": [
                    "Directives enacted by sovereign decree alter civic equilibria."
                ],
                "keyMetrics": [
                    {
                        "id": f"met-{advisor_id}-01",
                        "label": "Operational Readiness",
                        "value": "100%",
                        "trend": "neutral",
                        "status": "optimal",
                        "unit": "",
                        "description": "Readiness of ministerial archives and departmental reporting.",
                    }
                ],
                "confidenceScore": 90,
            }

    @staticmethod
    def analyse_world_state(world_id: str, advisor_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator()
        return orch.analyse_single_advisor(world_id, advisor_id).to_dict()

    @staticmethod
    def generate_recommendations(world_id: str, advisor_id: str) -> List[Dict[str, Any]]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator()
        res = orch.analyse_single_advisor(world_id, advisor_id)
        return [r.to_dict() for r in res.recommendations]

    @staticmethod
    def evaluate_policy_impact(world_id: str, advisor_id: str, policy_id: str) -> Dict[str, Any]:
        return {"world_id": world_id, "policy_id": policy_id, "estimated_impact": "evaluated_in_deliberation"}


class CouncilService:
    """Business operations and enforcement for Council features."""

    def __init__(self, repository: Optional[CouncilRepository] = None):
        self.repo = repository or CouncilRepository()

    # -----------------------------------------------------------------------
    # Helper formatters
    # -----------------------------------------------------------------------

    def _format_advisor(self, adv: Dict[str, Any]) -> Dict[str, Any]:
        import json
        responsibilities = []
        if adv.get("responsibilities"):
            try:
                responsibilities = json.loads(adv["responsibilities"])
            except Exception:
                responsibilities = []

        briefing = AdvisorIntelligenceService.generate_briefing(
            world_id="active", advisor_id=adv["id"]
        )

        return {
            "id": adv["id"],
            "role": adv["role"],
            "name": adv["name"],
            "title": adv["title"],
            "officialTitle": adv["title"],
            "domain": adv["domain"],
            "motto": adv.get("motto", ""),
            "portraitSymbol": adv.get("portrait_symbol", "🏛️"),
            "portrait_url": adv.get("portrait_url"),
            "accentColor": adv.get("accent_color", "#C5A66A"),
            "status": "Stable",
            "statusSummary": f"{adv['title']} active in deliberation chamber.",
            "hasActiveWarning": False,
            "warningText": None,
            "confidenceScore": 88,
            "lastBriefingDate": "Year 2026 · Cycle 1",
            "responsibilities": responsibilities,
            "metrics": briefing["keyMetrics"],
            "currentBriefing": briefing,
            "identifiedRisks": [],
            "displayOrder": adv.get("display_order", 0),
            "display_order": adv.get("display_order", 0),
            "isActive": bool(adv.get("is_active", 1)),
            "is_active": bool(adv.get("is_active", 1)),
            "createdAt": adv.get("created_at", ""),
            "created_at": adv.get("created_at", ""),
            "updatedAt": adv.get("updated_at", ""),
            "updated_at": adv.get("updated_at", ""),
        }

    def _format_recommendation(self, rec: Dict[str, Any]) -> Dict[str, Any]:
        import json
        benefits = []
        if rec.get("expected_benefits"):
            try:
                benefits = json.loads(rec["expected_benefits"])
            except Exception:
                benefits = []

        risks = []
        if rec.get("potential_risks"):
            try:
                risks = json.loads(rec["potential_risks"])
            except Exception:
                risks = []

        status_raw = rec.get("status", "proposed").lower()
        frontend_status = REC_STATUS_FRONTEND_MAPPING.get(status_raw, status_raw.capitalize())

        priority_raw = rec.get("priority", "medium").lower()
        frontend_priority = priority_raw.capitalize()

        return {
            "id": rec["id"],
            "worldId": rec["world_id"],
            "world_id": rec["world_id"],
            "sessionId": rec.get("session_id"),
            "session_id": rec.get("session_id"),
            "advisorId": rec["advisor_id"],
            "advisor_id": rec["advisor_id"],
            "advisorName": rec.get("advisor_name", "Imperial Advisor"),
            "advisorTitle": rec.get("advisor_title", "Imperial Ministry"),
            "domain": rec.get("domain", "Imperial Administration"),
            "title": rec["title"],
            "description": rec["description"],
            "justification": rec.get("justification", ""),
            "expectedBenefits": benefits,
            "expected_benefits": benefits,
            "potentialRisks": risks,
            "potential_risks": risks,
            "estimatedCostCrc": rec.get("estimated_cost_crc", 0.0),
            "estimated_cost_crc": rec.get("estimated_cost_crc", 0.0),
            "politicalCapitalReq": rec.get("political_capital_req", 0.0),
            "political_capital_req": rec.get("political_capital_req", 0.0),
            "category": rec.get("category", "Policy"),
            "priority": frontend_priority,
            "status": frontend_status,
            "dateProposed": rec.get("proposed_at", ""),
            "proposed_at": rec.get("proposed_at", ""),
            "reviewedDate": rec.get("reviewed_at"),
            "reviewed_at": rec.get("reviewed_at"),
            "reviewedBy": rec.get("reviewed_by"),
            "reviewed_by": rec.get("reviewed_by"),
            "decisionNotes": rec.get("decision_notes"),
            "decision_notes": rec.get("decision_notes"),
            "implementationReference": rec.get("implementation_reference"),
            "implementation_reference": rec.get("implementation_reference"),
            "createdAt": rec.get("created_at", ""),
            "created_at": rec.get("created_at", ""),
            "updatedAt": rec.get("updated_at", ""),
            "updated_at": rec.get("updated_at", ""),
        }

    def _format_decision(self, dec: Dict[str, Any]) -> Dict[str, Any]:
        import json
        meta = {}
        if dec.get("metadata_json"):
            try:
                meta = json.loads(dec["metadata_json"])
            except Exception:
                meta = {}

        return {
            "id": dec["id"],
            "sessionId": dec["session_id"],
            "session_id": dec["session_id"],
            "recommendationId": dec.get("recommendation_id"),
            "recommendation_id": dec.get("recommendation_id"),
            "recommendationTitle": dec.get("rec_title", "Imperial Directive"),
            "advisorId": dec.get("advisor_id"),
            "advisor_id": dec.get("advisor_id"),
            "advisorTitle": dec.get("adv_title", "The Crown"),
            "outcome": dec["outcome"],
            "decreeSummary": dec["decision_text"],
            "decision_text": dec["decision_text"],
            "decisionType": dec.get("decision_type", "ratification"),
            "decision_type": dec.get("decision_type", "ratification"),
            "decidedBy": dec.get("decided_by"),
            "decided_by": dec.get("decided_by"),
            "timestamp": dec.get("decided_at", ""),
            "decided_at": dec.get("decided_at", ""),
            "metadata": meta,
        }

    def _format_execution(self, rec: Dict[str, Any]) -> Dict[str, Any]:
        import json
        baseline = {}
        if rec.get("baseline_metrics_json"):
            try:
                baseline = json.loads(rec["baseline_metrics_json"])
            except Exception:
                baseline = {}

        outcome = {}
        if rec.get("outcome_metrics_json"):
            try:
                outcome = json.loads(rec["outcome_metrics_json"])
            except Exception:
                outcome = {}

        return {
            "id": rec["id"],
            "recommendationId": rec["recommendation_id"],
            "recommendation_id": rec["recommendation_id"],
            "worldId": rec["world_id"],
            "world_id": rec["world_id"],
            "sessionId": rec.get("session_id"),
            "session_id": rec.get("session_id"),
            "executionType": rec["execution_type"],
            "execution_type": rec["execution_type"],
            "actionId": rec.get("action_id"),
            "action_id": rec.get("action_id"),
            "status": rec["status"],
            "simTickAtExecution": rec.get("sim_tick_at_execution", 1),
            "sim_tick_at_execution": rec.get("sim_tick_at_execution", 1),
            "simYear": rec.get("sim_year", 2026),
            "sim_year": rec.get("sim_year", 2026),
            "simDay": rec.get("sim_day", 1),
            "sim_day": rec.get("sim_day", 1),
            "costCredits": rec.get("cost_credits", 0.0),
            "cost_credits": rec.get("cost_credits", 0.0),
            "costMaterials": rec.get("cost_materials", 0.0),
            "cost_materials": rec.get("cost_materials", 0.0),
            "costEnergy": rec.get("cost_energy", 0.0),
            "cost_energy": rec.get("cost_energy", 0.0),
            "baselineMetrics": baseline,
            "baseline_metrics": baseline,
            "outcomeMetrics": outcome,
            "outcome_metrics": outcome,
            "outcomeEvaluation": rec.get("outcome_evaluation"),
            "outcome_evaluation": rec.get("outcome_evaluation"),
            "errorMessage": rec.get("error_message"),
            "error_message": rec.get("error_message"),
            "createdAt": rec.get("created_at", ""),
            "created_at": rec.get("created_at", ""),
            "updatedAt": rec.get("updated_at", ""),
            "updated_at": rec.get("updated_at", ""),
        }

    def _format_session(self, sess: Dict[str, Any]) -> Dict[str, Any]:
        import json
        topics = []
        if sess.get("agenda_topics"):
            try:
                topics = json.loads(sess["agenda_topics"])
            except Exception:
                topics = []

        recs = [self._format_recommendation(r) for r in sess.get("recommendations", [])]
        decs = [self._format_decision(d) for d in sess.get("decisions", [])]
        evts = [
            {
                "id": e["id"],
                "sessionId": e["session_id"],
                "session_id": e["session_id"],
                "eventType": e["event_type"],
                "event_type": e["event_type"],
                "description": e["description"],
                "actorId": e.get("actor_id"),
                "actor_id": e.get("actor_id"),
                "createdAt": e.get("created_at", ""),
                "created_at": e.get("created_at", ""),
            }
            for e in sess.get("events", [])
        ]

        status_raw = sess.get("status", "active").lower()
        frontend_state = SESSION_STATE_MAPPING.get(status_raw, status_raw.capitalize())

        return {
            "id": sess["id"],
            "worldId": sess["world_id"],
            "world_id": sess["world_id"],
            "sessionNumber": sess.get("session_number", 1),
            "session_number": sess.get("session_number", 1),
            "simYear": sess.get("sim_year", 2026),
            "sim_year": sess.get("sim_year", 2026),
            "simDay": sess.get("sim_day", 1),
            "sim_day": sess.get("sim_day", 1),
            "title": sess["title"],
            "status": status_raw,
            "state": frontend_state,
            "convenedBy": sess.get("convened_by", "The Sovereign High Directorate"),
            "convened_by": sess.get("convened_by", "The Sovereign High Directorate"),
            "agendaTopics": topics,
            "agenda_topics": topics,
            "attendees": sess.get("attendees", []),
            "briefingsDelivered": len(sess.get("attendees", [])),
            "recommendationsDiscussed": recs,
            "decisionsRecorded": decs,
            "events": evts,
            "openingAddress": sess.get("opening_address"),
            "opening_address": sess.get("opening_address"),
            "summaryNotes": sess.get("summary", ""),
            "summary": sess.get("summary", ""),
            "startedAt": sess.get("started_at"),
            "started_at": sess.get("started_at"),
            "endedAt": sess.get("ended_at"),
            "ended_at": sess.get("ended_at"),
            "createdAt": sess.get("created_at", ""),
            "created_at": sess.get("created_at", ""),
            "updatedAt": sess.get("updated_at", ""),
            "updated_at": sess.get("updated_at", ""),
        }

    # -----------------------------------------------------------------------
    # Advisors operations
    # -----------------------------------------------------------------------

    def get_all_advisors(self) -> List[Dict[str, Any]]:
        advisors = self.repo.get_all_advisors()
        return [self._format_advisor(a) for a in advisors]

    def get_advisor_by_id(self, advisor_id: str) -> Dict[str, Any]:
        advisor = self.repo.get_advisor_by_id(advisor_id)
        if not advisor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Advisor identity '{advisor_id}' not found in Imperial Roster."
            )
        return self._format_advisor(advisor)

    def get_advisor_briefing(self, advisor_id: str, world_id: str = "aurora-prime") -> Dict[str, Any]:
        advisor = self.repo.get_advisor_by_id(advisor_id)
        if not advisor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Advisor identity '{advisor_id}' not found."
            )
        return AdvisorIntelligenceService.generate_briefing(world_id, advisor_id)

    async def run_council_deliberation_async(self, world_id: str, persist_recommendations: bool = True) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = await orch.run_council_deliberation_async(world_id=world_id, persist_recommendations=persist_recommendations)
        return report.to_dict()

    def run_council_deliberation(self, world_id: str, persist_recommendations: bool = True) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.run_council_deliberation(world_id=world_id, persist_recommendations=persist_recommendations)
        return report.to_dict()

    async def get_latest_council_deliberation_async(self, world_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.get_latest_report(world_id)
        if not report:
            report = await orch.run_council_deliberation_async(world_id=world_id, persist_recommendations=False)
        return report.to_dict()

    def get_latest_council_deliberation(self, world_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.get_latest_report(world_id)
        if not report:
            report = orch.run_council_deliberation(world_id=world_id, persist_recommendations=False)
        return report.to_dict()

    async def analyse_single_advisor_intelligence_async(self, world_id: str, advisor_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        res = await orch.analyse_single_advisor_async(world_id=world_id, advisor_id=advisor_id)
        return res.to_dict()

    def analyse_single_advisor_intelligence(self, world_id: str, advisor_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        res = orch.analyse_single_advisor(world_id=world_id, advisor_id=advisor_id)
        return res.to_dict()

    # -----------------------------------------------------------------------
    # Sessions operations
    # -----------------------------------------------------------------------

    def create_session(
        self,
        world_id: str,
        title: str,
        sim_year: int = 2026,
        sim_day: int = 1,
        agenda_topics: Optional[List[str]] = None,
        invited_advisor_ids: Optional[List[str]] = None,
        opening_address: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        # Validate world exists
        from db.database import get_db_connection
        conn = get_db_connection()
        w = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
        conn.close()
        if not w:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Civilisation world '{world_id}' not found."
            )

        # Prevent duplicate active sessions for the same world
        active_sess = self.repo.get_active_session_for_world(world_id)
        if active_sess:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An active council conclave '{active_sess['id']}' already exists for civilisation '{world_id}'. Conclude the active session before convening a new one."
            )

        # Validate invited advisors exist
        invited = invited_advisor_ids or []
        for adv_id in invited:
            if not self.repo.get_advisor_by_id(adv_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invited advisor '{adv_id}' does not exist in Imperial Registry."
                )

        session = self.repo.create_session(
            world_id=world_id,
            title=title,
            created_by=created_by,
            sim_year=sim_year,
            sim_day=sim_day,
            agenda_topics=agenda_topics,
            invited_advisor_ids=invited,
            opening_address=opening_address
        )
        return self._format_session(session)

    def get_session(self, session_id: str) -> Dict[str, Any]:
        session = self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council session '{session_id}' not found."
            )
        return self._format_session(session)

    def list_sessions(
        self,
        world_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        sessions = self.repo.list_sessions(
            world_id=world_id,
            status=status_filter,
            limit=limit,
            offset=offset
        )
        return [self._format_session(s) for s in sessions]

    def complete_session(self, session_id: str, summary: Optional[str] = None) -> Dict[str, Any]:
        session = self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council session '{session_id}' not found."
            )

        current_status = session.get("status", "").lower()
        if current_status in [SESSION_STATUS_COMPLETED, SESSION_STATUS_CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete session: session is already {current_status}."
            )

        updated = self.repo.complete_session(session_id, summary)
        return self._format_session(updated)

    # -----------------------------------------------------------------------
    # Recommendations operations
    # -----------------------------------------------------------------------

    def create_recommendation(
        self,
        world_id: str,
        advisor_id: str,
        title: str,
        description: str,
        session_id: Optional[str] = None,
        justification: Optional[str] = "",
        expected_benefits: Optional[List[str]] = None,
        potential_risks: Optional[List[str]] = None,
        estimated_cost_crc: float = 0.0,
        political_capital_req: float = 0.0,
        category: str = "Policy",
        priority: str = "medium"
    ) -> Dict[str, Any]:
        # Validate advisor exists
        if not self.repo.get_advisor_by_id(advisor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Advisor '{advisor_id}' not found in registry."
            )

        # Validate session if provided
        if session_id:
            session = self.repo.get_session(session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Associated council session '{session_id}' not found."
                )
            if session.get("world_id") != world_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session belongs to a different civilisation world."
                )

        # Validate priority
        if priority.lower() not in ALLOWED_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority '{priority}'. Allowed: {ALLOWED_PRIORITIES}"
            )

        rec = self.repo.create_recommendation({
            "world_id": world_id,
            "session_id": session_id,
            "advisor_id": advisor_id,
            "title": title,
            "description": description,
            "justification": justification or "",
            "expected_benefits": expected_benefits or [],
            "potential_risks": potential_risks or [],
            "estimated_cost_crc": estimated_cost_crc,
            "political_capital_req": political_capital_req,
            "category": category,
            "priority": priority.lower(),
            "status": REC_STATUS_PROPOSED,
        })

        return self._format_recommendation(rec)

    def get_recommendation(self, rec_id: str) -> Dict[str, Any]:
        rec = self.repo.get_recommendation(rec_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council recommendation '{rec_id}' not found."
            )
        return self._format_recommendation(rec)

    def list_recommendations(
        self,
        world_id: Optional[str] = None,
        session_id: Optional[str] = None,
        advisor_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        recs = self.repo.list_recommendations(
            world_id=world_id,
            session_id=session_id,
            advisor_id=advisor_id,
            status=status_filter,
            priority=priority_filter,
            limit=limit,
            offset=offset
        )
        return [self._format_recommendation(r) for r in recs]

    def review_recommendation(
        self,
        rec_id: str,
        action: Optional[str] = None,
        target_status: Optional[str] = None,
        reviewer_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes recommendation review.
        Enforces:
        1. ACCEPTED DOES NOT MEAN IMPLEMENTED.
        2. Valid status transitions only.
        3. Never transitions automatically to implemented.
        """
        rec = self.repo.get_recommendation(rec_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council recommendation '{rec_id}' not found."
            )

        current_status = rec["status"].lower()

        # Map target_status or action
        new_status = None
        if target_status:
            t = target_status.lower()
            if t in ["accepted", "accept"]:
                new_status = REC_STATUS_ACCEPTED
            elif t in ["rejected", "reject"]:
                new_status = REC_STATUS_REJECTED
            elif t in ["under review", "under_review"]:
                new_status = REC_STATUS_UNDER_REVIEW
            elif t in ["proposed", "propose"]:
                new_status = REC_STATUS_PROPOSED
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid review status '{target_status}'. Allowed: Accepted, Rejected, Under Review"
                )
        elif action:
            act = action.lower()
            if act in ["accept", "accepted"]:
                new_status = REC_STATUS_ACCEPTED
            elif act in ["reject", "rejected"]:
                new_status = REC_STATUS_REJECTED
            elif act in ["request_review", "under_review", "review"]:
                new_status = REC_STATUS_UNDER_REVIEW
            elif act in ["proposed", "propose"]:
                new_status = REC_STATUS_PROPOSED
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid review action '{action}'. Allowed: accept, reject, request_review"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either 'action' or 'status' must be provided in review payload."
            )

        # Transition validations
        if current_status == REC_STATUS_IMPLEMENTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot alter recommendation: already implemented."
            )

        if current_status == REC_STATUS_ACCEPTED and new_status == REC_STATUS_PROPOSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot revert an accepted recommendation back to proposed."
            )

        # Critical rule check: new_status must NEVER be 'implemented' from review
        if new_status == REC_STATUS_IMPLEMENTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review operations cannot mark a recommendation as implemented. Accepted != Implemented."
            )

        updated = self.repo.update_recommendation_status(
            rec_id=rec_id,
            new_status=new_status,
            reviewed_by=reviewer_id,
            decision_notes=notes
        )
        return self._format_recommendation(updated)

    # -----------------------------------------------------------------------
    # Decisions operations
    # -----------------------------------------------------------------------

    def record_decision(
        self,
        session_id: str,
        outcome: str,
        decision_text: str,
        recommendation_id: Optional[str] = None,
        decision_type: str = "ratification",
        decided_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Records a sovereign decree in a session.
        Rule: A completed or cancelled session cannot receive new decisions.
        """
        session = self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council session '{session_id}' not found."
            )

        session_status = session.get("status", "").lower()
        if session_status in [SESSION_STATUS_COMPLETED, SESSION_STATUS_CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot record decision: session is {session_status} and locked from further decrees."
            )

        advisor_id = None
        if recommendation_id:
            rec = self.repo.get_recommendation(recommendation_id)
            if not rec:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Referenced recommendation '{recommendation_id}' not found."
                )
            advisor_id = rec.get("advisor_id")

            # Update recommendation status based on outcome
            if outcome == "Ratified":
                self.repo.update_recommendation_status(
                    rec_id=recommendation_id,
                    new_status=REC_STATUS_ACCEPTED,
                    reviewed_by=decided_by,
                    decision_notes=decision_text
                )
            elif outcome == "Vetoed":
                self.repo.update_recommendation_status(
                    rec_id=recommendation_id,
                    new_status=REC_STATUS_REJECTED,
                    reviewed_by=decided_by,
                    decision_notes=decision_text
                )
            elif outcome == "Referred to Committee":
                self.repo.update_recommendation_status(
                    rec_id=recommendation_id,
                    new_status=REC_STATUS_UNDER_REVIEW,
                    reviewed_by=decided_by,
                    decision_notes=decision_text
                )

        decision = self.repo.create_decision(
            session_id=session_id,
            recommendation_id=recommendation_id,
            advisor_id=advisor_id,
            decision_type=decision_type,
            decision_text=decision_text,
            outcome=outcome,
            decided_by=decided_by,
            metadata=metadata
        )

        return self._format_decision(decision)

    def list_session_decisions(self, session_id: str) -> List[Dict[str, Any]]:
        session = self.repo.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council session '{session_id}' not found."
            )
        decisions = self.repo.list_session_decisions(session_id)
        return [self._format_decision(d) for d in decisions]

    # -----------------------------------------------------------------------
    # Convocation & Trade-Offs (Phase 5)
    # -----------------------------------------------------------------------

    def convoke_council_advisors(
        self,
        world_id: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes formal convocation of all six advisors.
        - Obtains consistent snapshot of civilisation.
        - Executes all 6 intelligence engines.
        - Formulates findings, risks, evidence, and recommendations.
        - Performs cross-domain trade-off analysis.
        - Associates report and recommendations with session.
        - Records session events.
        """
        if session_id:
            session = self.repo.get_session(session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Council session '{session_id}' not found."
                )
            if session.get("world_id") != world_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session belongs to a different civilisation world."
                )
            self.repo.record_session_event(
                session_id=session_id,
                event_type="convocation_started",
                description="High Council convoked: Ministerial analysis underway across six domains.",
                actor_id=user_id
            )

        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.run_council_deliberation(world_id=world_id, persist_recommendations=True)
        report_dict = report.to_dict()
        rec_count = len(report_dict.get("recommendations", []))
        tradeoff_count = len(report_dict.get("tradeoffs", []))

        if session_id:
            self.repo.record_session_event(
                session_id=session_id,
                event_type="convocation_completed",
                description=f"Convocation concluded. {rec_count} directives formulated and {tradeoff_count} trade-offs identified.",
                actor_id=user_id,
                metadata={"recommendation_count": rec_count, "tradeoff_count": tradeoff_count}
            )

        return report_dict

    async def convoke_council_advisors_async(
        self,
        world_id: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Asynchronous execution of formal convocation."""
        if session_id:
            session = self.repo.get_session(session_id)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Council session '{session_id}' not found."
                )
            if session.get("world_id") != world_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session belongs to a different civilisation world."
                )
            self.repo.record_session_event(
                session_id=session_id,
                event_type="convocation_started",
                description="High Council convoked: Ministerial analysis underway across six domains.",
                actor_id=user_id
            )

        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = await orch.run_council_deliberation_async(world_id=world_id, persist_recommendations=True)
        report_dict = report.to_dict()
        rec_count = len(report_dict.get("recommendations", []))
        tradeoff_count = len(report_dict.get("tradeoffs", []))

        if session_id:
            self.repo.record_session_event(
                session_id=session_id,
                event_type="convocation_completed",
                description=f"Convocation concluded. {rec_count} directives formulated and {tradeoff_count} trade-offs identified.",
                actor_id=user_id,
                metadata={"recommendation_count": rec_count, "tradeoff_count": tradeoff_count}
            )

        return report_dict

    def get_tradeoffs(self, world_id: str, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves identified cross-domain trade-offs and compromises."""
        latest_report = self.get_latest_council_deliberation(world_id)
        return latest_report.get("tradeoffs", [])

    def get_council_overview(self, world_id: str) -> Dict[str, Any]:
        """
        Unified Council overview:
        - Overall civilisation assessment
        - Live advisor statuses
        - Critical findings & important warnings
        - Recommendations counts
        - Disagreements count
        - Simulation tick & data completeness
        """
        from db.database import get_db_connection
        conn = get_db_connection()
        world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
        econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
        conn.close()

        sim_year = (world["year"] if world else 2026) or 2026
        sim_day = (world["day"] if world else 1) or 1
        sim_tick = sim_year * 365 + sim_day
        stability = float(econ["civic_stability"] if econ else 0.80)

        active_session = self.repo.get_active_session_for_world(world_id)
        latest_report = self.get_latest_council_deliberation(world_id)

        # Count recommendations
        recs = self.repo.list_recommendations(world_id=world_id)
        pending_count = sum(1 for r in recs if r["status"] in ["proposed", "under_review"])
        accepted_awaiting = sum(1 for r in recs if r["status"] in ["accepted", "awaiting_execution"])
        implemented_count = sum(1 for r in recs if r["status"] == "implemented")

        advisor_statuses = {}
        critical_findings = []
        important_warnings = []

        advisors = self.repo.get_all_advisors()
        for adv in advisors:
            adv_id = adv["id"]
            adv_res = (latest_report.get("advisors") or {}).get(adv_id, {})
            findings = adv_res.get("findings", [])
            risks = adv_res.get("risks", [])

            has_critical = any(f.get("severity") == "urgent" for f in findings) or any(r.get("probability") == "Imminent" for r in risks)
            has_warning = any(f.get("severity") == "warning" for f in findings) or any(r.get("probability") == "High" for r in risks)

            status_val = "Critical" if has_critical else ("Attention Required" if has_warning else "Optimal")
            advisor_statuses[adv_id] = {
                "id": adv_id,
                "title": adv["title"],
                "name": adv["name"],
                "status": status_val,
                "hasActiveWarning": has_warning or has_critical,
                "confidenceScore": adv_res.get("confidence_score", 88)
            }

            for f in findings:
                if f.get("severity") == "urgent":
                    critical_findings.append({**f, "advisorId": adv_id, "advisorTitle": adv["title"]})
                elif f.get("severity") == "warning":
                    important_warnings.append({**f, "advisorId": adv_id, "advisorTitle": adv["title"]})

        disagreements = latest_report.get("tradeoffs", [])

        overall = (
            f"The Council is in active quorum for {world['name'] if world else 'Aurora Prime'}. "
            f"Equilibrium stability is at {(stability * 100):.1f}%. "
            f"{len(critical_findings)} critical findings and {len(disagreements)} cross-domain trade-offs require sovereign attention."
        )

        return {
            "worldId": world_id,
            "world_id": world_id,
            "overallCivilisationAssessment": overall,
            "overall_civilisation_assessment": overall,
            "advisorStatuses": advisor_statuses,
            "advisor_statuses": advisor_statuses,
            "activeSession": self._format_session(active_session) if active_session else None,
            "active_session": self._format_session(active_session) if active_session else None,
            "criticalFindings": critical_findings,
            "critical_findings": critical_findings,
            "importantWarnings": important_warnings,
            "important_warnings": important_warnings,
            "pendingRecommendationsCount": pending_count,
            "pending_recommendations_count": pending_count,
            "acceptedAwaitingExecutionCount": accepted_awaiting,
            "accepted_awaiting_execution_count": accepted_awaiting,
            "implementedCount": implemented_count,
            "implemented_count": implemented_count,
            "disagreementsCount": len(disagreements),
            "disagreements_count": len(disagreements),
            "lastAnalysisTimestamp": latest_report.get("timestamp"),
            "last_analysis_timestamp": latest_report.get("timestamp"),
            "simulationTick": sim_tick,
            "simulation_tick": sim_tick,
            "dataCompletenessScore": 92.5,
            "data_completeness_score": 92.5,
        }

    # -----------------------------------------------------------------------
    # Decision Execution & Simulation Connection (Phase 5)
    # -----------------------------------------------------------------------

    def execute_recommendation(
        self,
        rec_id: str,
        confirmation: bool = True,
        execution_notes: Optional[str] = None,
        user_id: Optional[str] = None,
        target_action_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes an accepted council recommendation via the authoritative simulation engine.
        Enforces:
        1. Only 'accepted' recommendations can be executed.
        2. Idempotency safeguard (prevents duplicate execution).
        3. Resource availability validation (fails gracefully if insufficient treasury/materials).
        4. State updates to 'implemented' ONLY after confirmed success.
        5. Preserves full audit trail and baseline metrics for post-implementation evaluation.
        """
        import uuid
        import json
        if not confirmation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Execution requires explicit sovereign confirmation."
            )

        rec = self.repo.get_recommendation(rec_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council recommendation '{rec_id}' not found."
            )

        current_status = rec["status"].lower()
        if current_status == "implemented":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Recommendation '{rec_id}' has already been implemented (Reference: {rec.get('implementation_reference')})."
            )

        if current_status not in ["accepted", "awaiting_execution"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot execute recommendation with status '{current_status}'. Recommendation must first be reviewed and 'Accepted' by the ruler."
            )

        # Check existing execution record (Idempotency)
        existing_exec = self.repo.get_execution_record_by_recommendation(rec_id)
        if existing_exec and existing_exec["status"] == "implemented":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Recommendation has already been executed under reference '{existing_exec['id']}'."
            )

        world_id = rec["world_id"]
        from db.database import get_db_connection
        conn = get_db_connection()
        world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
        if not world:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"World '{world_id}' not found."
            )
        econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()

        # Map recommendation to simulation action
        title_desc = f"{rec['title']} {rec['description']}".lower()
        from api.v1.policies import CATALOG_POLICIES
        from api.v1.infrastructure import BUILDING_DEFAULTS

        execution_type = "policy"
        action_id = target_action_override or None
        cost_credits = float(rec.get("estimated_cost_crc") or 0.0)
        cost_materials = 0.0
        cost_energy = 0.0

        if not action_id:
            if any(k in title_desc for k in ["clean energy", "ecological", "renewable", "emission", "green"]):
                action_id = "clean_energy_subsidies"
            elif any(k in title_desc for k in ["basic income", "ubi", "dividend", "equity", "poverty"]):
                action_id = "universal_basic_income"
            elif any(k in title_desc for k in ["scaffolding", "atrophy", "socratic", "reasoning"]):
                action_id = "cognitive_scaffolding"
            elif any(k in title_desc for k in ["automation tax", "algorithmic dividend", "levy"]):
                action_id = "automation_tax"
            elif any(k in title_desc for k in ["academy", "foundational", "education", "literacy"]):
                action_id = "free_education"
            elif any(k in title_desc for k in ["universal ai", "copilot", "assistance"]):
                action_id = "universal_ai"
            elif any(k in title_desc for k in ["hospital", "clinic", "health", "physician"]):
                execution_type = "infrastructure"
                action_id = "Healthcare"
            elif any(k in title_desc for k in ["research", "laboratory", "observatory", "scholar"]):
                execution_type = "infrastructure"
                action_id = "Research"
            else:
                execution_type = "administrative_decree"
                action_id = f"decree_{rec['advisor_id']}"

        # Determine cost based on mapped action
        if execution_type == "policy":
            template = next((p for p in CATALOG_POLICIES if p["id"] == action_id), None)
            if template:
                cost_credits = max(cost_credits, float(template["implementation_cost"]))
        elif execution_type == "infrastructure":
            b_def = BUILDING_DEFAULTS.get(action_id)
            if b_def:
                cost_credits = max(cost_credits, float(b_def["cost"].get("credits", 150)))
                cost_materials = float(b_def["cost"].get("materials", 1000))
                cost_energy = float(b_def["cost"].get("energy", 500))

        # Validate resource availability
        current_credits = float(econ["genesis_research_credits"] if econ else 1000.0)
        current_materials = float(econ["materials"] if econ else 1000.0)

        if current_credits < cost_credits:
            conn.close()
            self.repo.create_execution_record({
                "recommendation_id": rec_id,
                "world_id": world_id,
                "session_id": rec.get("session_id"),
                "executed_by": user_id,
                "execution_type": execution_type,
                "action_id": action_id,
                "status": "failed",
                "cost_credits": cost_credits,
                "cost_materials": cost_materials,
                "error_message": f"Insufficient treasury credits: required {cost_credits:.1f}, available {current_credits:.1f}."
            })
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Execution rejected: Insufficient treasury credits (Required: {cost_credits:.1f}, Available: {current_credits:.1f}). Recommendation remains Accepted for future execution."
            )

        if current_materials < cost_materials:
            conn.close()
            self.repo.create_execution_record({
                "recommendation_id": rec_id,
                "world_id": world_id,
                "session_id": rec.get("session_id"),
                "executed_by": user_id,
                "execution_type": execution_type,
                "action_id": action_id,
                "status": "failed",
                "cost_credits": cost_credits,
                "cost_materials": cost_materials,
                "error_message": f"Insufficient materials: required {cost_materials:.1f}, available {current_materials:.1f}."
            })
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Execution rejected: Insufficient materials (Required: {cost_materials:.1f}, Available: {current_materials:.1f}). Recommendation remains Accepted."
            )

        # Baseline snapshot
        sim_year = world["year"] or 2026
        sim_day = world["day"] or 1
        sim_tick = sim_year * 365 + sim_day

        baseline_metrics = {
            "population": econ["population"] if econ else 100,
            "treasury": current_credits,
            "happiness": econ["happiness"] if econ else 0.75,
            "civic_stability": econ["civic_stability"] if econ else 0.77,
            "education_index": 0.75,
            "health_index": 0.85,
            "environmental_health": econ["environmental_health"] if econ else 0.80,
            "gini_index": econ["gini_coefficient"] if econ else 0.28,
            "sim_year": sim_year,
            "sim_day": sim_day,
            "sim_tick": sim_tick,
        }

        # Apply simulation action through authoritative simulation database tables
        with conn:
            # 1. Deduct resources from economy_resources
            conn.execute("""
            UPDATE economy_resources
            SET genesis_research_credits = MAX(0.0, genesis_research_credits - ?),
                materials = MAX(0.0, materials - ?)
            WHERE world_id = ?
            """, (cost_credits, cost_materials, world_id))

            # 2. Enact policy or decree
            if execution_type == "policy":
                template = next((p for p in CATALOG_POLICIES if p["id"] == action_id), None)
                if template:
                    conn.execute("""
                    INSERT INTO policies (id, world_id, name, category, is_active, implementation_cost, parameters, effects)
                    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
                    ON CONFLICT(world_id, id) DO UPDATE SET
                        is_active = 1,
                        parameters = excluded.parameters
                    """, (
                        action_id, world_id, template["name"], template["category"],
                        cost_credits, json.dumps(template["parameters"]), json.dumps(template["effects"])
                    ))

            # 3. Record simulation event in authoritative events table
            event_title = f"Imperial Directive Implemented: {rec['title']}"
            conn.execute("""
            INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, 'council', ?, datetime('now'))
            """, (
                f"evt_exec_{uuid.uuid4().hex[:8]}",
                world_id,
                sim_year,
                sim_day,
                event_title,
                f"Executed by sovereign authority upon counsel of {rec.get('advisor_name', 'The Council')}. {execution_notes or rec['description']}"
            ))

        conn.close()

        # 4. Create implementation execution record
        exec_id = f"exec_rec_{uuid.uuid4().hex[:10]}"
        exec_record = self.repo.create_execution_record({
            "id": exec_id,
            "recommendation_id": rec_id,
            "world_id": world_id,
            "session_id": rec.get("session_id"),
            "executed_by": user_id,
            "execution_type": execution_type,
            "action_id": action_id,
            "status": "implemented",
            "sim_tick_at_execution": sim_tick,
            "sim_year": sim_year,
            "sim_day": sim_day,
            "cost_credits": cost_credits,
            "cost_materials": cost_materials,
            "cost_energy": cost_energy,
            "baseline_metrics": baseline_metrics,
            "outcome_metrics": {},
            "outcome_evaluation": "Implementation baseline established. Observation pending subsequent simulation ticks."
        })

        # 5. Update recommendation status to implemented
        self.repo.update_recommendation_status(
            rec_id=rec_id,
            new_status="implemented",
            reviewed_by=user_id,
            decision_notes=f"Implemented: {exec_id} ({action_id})",
            implementation_reference=exec_id
        )

        # 6. Record session event if associated with session
        if rec.get("session_id"):
            self.repo.record_session_event(
                session_id=rec["session_id"],
                event_type="execution_completed",
                description=f"Recommendation '{rec['title']}' implemented into live simulation ({exec_id}).",
                actor_id=user_id,
                metadata={"execution_id": exec_id, "recommendation_id": rec_id, "action_id": action_id}
            )

        return self._format_execution(exec_record)

    def evaluate_recommendation_outcome(self, rec_id: str) -> Dict[str, Any]:
        """
        Calculates observable post-implementation metric progression.
        Distinguishes observed changes from causal claims.
        """
        import json
        rec = self.repo.get_recommendation(rec_id)
        if not rec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Council recommendation '{rec_id}' not found."
            )

        exec_record = self.repo.get_execution_record_by_recommendation(rec_id)
        if not exec_record or exec_record["status"] != "implemented":
            return {
                "recommendationId": rec_id,
                "recommendation_id": rec_id,
                "executionId": "none",
                "execution_id": "none",
                "title": rec["title"],
                "status": rec["status"],
                "executionTick": 0,
                "execution_tick": 0,
                "currentTick": 0,
                "current_tick": 0,
                "ticksElapsed": 0,
                "ticks_elapsed": 0,
                "baselineMetrics": {},
                "baseline_metrics": {},
                "currentMetrics": {},
                "current_metrics": {},
                "metricDeltas": {},
                "metric_deltas": {},
                "observedOutcomeSummary": "Recommendation has not been executed into the simulation yet.",
                "observed_outcome_summary": "Recommendation has not been executed into the simulation yet.",
                "causalityDisclaimer": "No simulation execution reference found.",
                "causality_disclaimer": "No simulation execution reference found."
            }

        baseline = {}
        if exec_record.get("baseline_metrics_json"):
            try:
                baseline = json.loads(exec_record["baseline_metrics_json"])
            except Exception:
                baseline = {}

        from db.database import get_db_connection
        conn = get_db_connection()
        world = conn.execute("SELECT * FROM worlds WHERE id = ?", (rec["world_id"],)).fetchone()
        econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (rec["world_id"],)).fetchone()
        conn.close()

        if not world:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Civilisation world not found."
            )

        current_year = world["year"] or 2026
        current_day = world["day"] or 1
        current_tick = current_year * 365 + current_day
        exec_tick = exec_record.get("sim_tick_at_execution", current_tick)
        ticks_elapsed = max(0, current_tick - exec_tick)

        current_metrics = {
            "population": econ["population"] if econ else 100,
            "treasury": float(econ["genesis_research_credits"] if econ else 1000.0),
            "happiness": float(econ["happiness"] if econ else 0.75),
            "civic_stability": float(econ["civic_stability"] if econ else 0.77),
            "education_index": 0.75,
            "health_index": 0.85,
            "environmental_health": float(econ["environmental_health"] if econ else 0.80),
            "gini_index": float(econ["gini_coefficient"] if econ else 0.28),
            "sim_year": current_year,
            "sim_day": current_day,
            "sim_tick": current_tick,
        }

        # Calculate deltas
        deltas = {}
        for k in ["population", "treasury", "happiness", "civic_stability", "education_index", "health_index", "environmental_health", "gini_index"]:
            b_val = float(baseline.get(k, 0.0) or 0.0)
            c_val = float(current_metrics.get(k, 0.0) or 0.0)
            deltas[k] = round(c_val - b_val, 4)

        if ticks_elapsed == 0:
            summary = (
                f"Observation pending: Implementation executed at Epoch {exec_record.get('sim_year', 2026)} Day {exec_record.get('sim_day', 1)}. "
                "0 simulation ticks have elapsed since execution. Baseline metrics recorded."
            )
        else:
            summary = (
                f"Observed changes over {ticks_elapsed} ticks: Stability ({deltas['civic_stability']:+.3f}), "
                f"Health ({deltas['health_index']:+.3f}), Gini ({deltas['gini_index']:+.3f}), "
                f"Treasury ({deltas['treasury']:+.1f} CRC)."
            )

        disclaimer = (
            "Observed metric progression reflects aggregate civilisational dynamics over elapsed simulation ticks. "
            "Macro-systemic shifts correlate with execution epoch but must not be conflated with exclusive causality."
        )

        return {
            "recommendationId": rec_id,
            "recommendation_id": rec_id,
            "executionId": exec_record["id"],
            "execution_id": exec_record["id"],
            "title": rec["title"],
            "status": "implemented",
            "executionTick": exec_tick,
            "execution_tick": exec_tick,
            "currentTick": current_tick,
            "current_tick": current_tick,
            "ticksElapsed": ticks_elapsed,
            "ticks_elapsed": ticks_elapsed,
            "baselineMetrics": baseline,
            "baseline_metrics": baseline,
            "currentMetrics": current_metrics,
            "current_metrics": current_metrics,
            "metricDeltas": deltas,
            "metric_deltas": deltas,
            "observedOutcomeSummary": summary,
            "observed_outcome_summary": summary,
            "causalityDisclaimer": disclaimer,
            "causality_disclaimer": disclaimer,
        }

    def list_execution_records(self, world_id: str) -> List[Dict[str, Any]]:
        records = self.repo.list_execution_records(world_id)
        return [self._format_execution(r) for r in records]


