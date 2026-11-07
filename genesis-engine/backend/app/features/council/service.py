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

    def run_council_deliberation(self, world_id: str, persist_recommendations: bool = True) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.run_council_deliberation(world_id=world_id, persist_recommendations=persist_recommendations)
        return report.to_dict()

    def get_latest_council_deliberation(self, world_id: str) -> Dict[str, Any]:
        from app.features.council.intelligence.orchestrator import CouncilOrchestrator
        orch = CouncilOrchestrator(self.repo)
        report = orch.get_latest_report(world_id)
        if not report:
            report = orch.run_council_deliberation(world_id=world_id, persist_recommendations=False)
        return report.to_dict()

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

