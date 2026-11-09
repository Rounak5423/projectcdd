"""
CIVORA — Council of Advisors FastAPI Router
Provides REST HTTP endpoints for Advisors, Sessions, Recommendations, and Decrees.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from auth.security import get_current_user_optional, get_current_user
from app.features.council.dependencies import verify_world_access, _resolve_world_id
from app.features.council.service import CouncilService
from app.features.council.intelligence.streaming import stream_advisor_speech
from app.features.council.schemas import (
    CouncilEnvelope,
    CouncilAdvisorDetail,
    AdvisorBriefingDataSchema,
    CouncilSessionCreate,
    CouncilSessionResponse,
    CouncilRecommendationCreate,
    CouncilRecommendationReview,
    CouncilRecommendationResponse,
    CouncilDecisionCreate,
    CouncilDecisionResponse,
    CouncilExecutionRequest,
    CouncilExecutionResponse,
    CouncilEvaluationResponse,
    CouncilOverviewResponse,
)

router = APIRouter(prefix="/council", tags=["Council of Advisors"])
council_service = CouncilService()


# ---------------------------------------------------------------------------
# Advisor Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/advisors",
    response_model=CouncilEnvelope[List[CouncilAdvisorDetail]],
    summary="Retrieve all permanent council advisors"
)
async def list_advisors():
    """Returns the six permanent council advisor identities in display order."""
    advisors = council_service.get_all_advisors()
    return CouncilEnvelope(
        success=True,
        data=advisors,
        message="Imperial council advisors retrieved successfully."
    )


@router.get(
    "/advisors/{advisor_id}",
    response_model=CouncilEnvelope[CouncilAdvisorDetail],
    summary="Retrieve an advisor's profile"
)
async def get_advisor(advisor_id: str):
    """Returns complete profile, responsibilities, and status for one advisor."""
    advisor = council_service.get_advisor_by_id(advisor_id)
    return CouncilEnvelope(
        success=True,
        data=advisor,
        message=f"Advisor '{advisor['officialTitle']}' profile retrieved."
    )


@router.get(
    "/advisors/{advisor_id}/briefing",
    response_model=CouncilEnvelope[AdvisorBriefingDataSchema],
    summary="Retrieve standing briefing data for an advisor"
)
async def get_advisor_briefing(
    advisor_id: str,
    world_id: str = Query("aurora-prime", alias="worldId")
):
    """Returns structured standing briefing for the specified advisor based on live simulation state."""
    briefing = council_service.get_advisor_briefing(advisor_id=advisor_id, world_id=world_id)
    return CouncilEnvelope(
        success=True,
        data=briefing,
        message="Advisor briefing data retrieved."
    )


# ---------------------------------------------------------------------------
# Session Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/sessions",
    response_model=CouncilEnvelope[CouncilSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Convene a new council session"
)
async def create_session(
    payload: CouncilSessionCreate,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Creates a new formal council deliberation session for a civilisation world.
    Validates world access and participating advisors.
    """
    target_world_id = payload.get_world_id()
    verify_world_access(target_world_id, current_user)

    session = council_service.create_session(
        world_id=target_world_id,
        title=payload.title,
        sim_year=payload.get_year(),
        sim_day=payload.get_day(),
        agenda_topics=payload.get_topics(),
        invited_advisor_ids=payload.get_invited_advisors(),
        opening_address=payload.get_opening_address(),
        created_by=current_user["id"] if current_user else None
    )

    return CouncilEnvelope(
        success=True,
        data=session,
        message="Council session convened in royal chambers."
    )


@router.get(
    "/sessions",
    response_model=CouncilEnvelope[List[CouncilSessionResponse]],
    summary="List council sessions"
)
async def list_sessions(
    world_id: Optional[str] = Query(None, alias="worldId"),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Lists council sessions for a civilisation world, newest first."""
    if world_id:
        verify_world_access(world_id, current_user)

    sessions = council_service.list_sessions(
        world_id=world_id,
        status_filter=status,
        limit=limit,
        offset=offset
    )

    return CouncilEnvelope(
        success=True,
        data=sessions,
        message="Council sessions retrieved."
    )


@router.get(
    "/sessions/{session_id}",
    response_model=CouncilEnvelope[CouncilSessionResponse],
    summary="Retrieve session details"
)
async def get_session(
    session_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns complete session details including attendees, recommendations, decisions, and events."""
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    return CouncilEnvelope(
        success=True,
        data=session,
        message="Council session retrieved."
    )


@router.post(
    "/sessions/{session_id}/complete",
    response_model=CouncilEnvelope[CouncilSessionResponse],
    summary="Conclude an active council session"
)
async def complete_session(
    session_id: str,
    summary: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Concludes an active council session and seals its decrees in the Imperial Archives.
    Cannot conclude an already completed or cancelled session.
    """
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    completed = council_service.complete_session(session_id, summary)
    return CouncilEnvelope(
        success=True,
        data=completed,
        message="Council session successfully concluded and archived."
    )


# ---------------------------------------------------------------------------
# Recommendation Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/recommendations",
    response_model=CouncilEnvelope[List[CouncilRecommendationResponse]],
    summary="List council recommendations"
)
async def list_recommendations(
    world_id: Optional[str] = Query(None, alias="worldId"),
    session_id: Optional[str] = Query(None, alias="sessionId"),
    advisor_id: Optional[str] = Query(None, alias="advisorId"),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Lists policy and civil recommendations filtered by world, advisor, or status."""
    if world_id:
        verify_world_access(world_id, current_user)

    recs = council_service.list_recommendations(
        world_id=world_id,
        session_id=session_id,
        advisor_id=advisor_id,
        status_filter=status,
        priority_filter=priority,
        limit=limit,
        offset=offset
    )

    return CouncilEnvelope(
        success=True,
        data=recs,
        message="Council recommendations retrieved."
    )


@router.post(
    "/recommendations",
    response_model=CouncilEnvelope[CouncilRecommendationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Propose a new recommendation"
)
async def create_recommendation(
    payload: CouncilRecommendationCreate,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Creates an official recommendation proposed by an advisor.
    Suitable for direct creation and Phase 3 intelligence engine integration.
    """
    world_id = payload.get_world_id()
    verify_world_access(world_id, current_user)

    rec = council_service.create_recommendation(
        world_id=world_id,
        advisor_id=payload.get_advisor_id(),
        title=payload.title,
        description=payload.description,
        session_id=payload.get_session_id(),
        justification=payload.justification,
        expected_benefits=payload.get_benefits(),
        potential_risks=payload.get_risks(),
        estimated_cost_crc=payload.get_cost(),
        political_capital_req=payload.get_capital(),
        category=payload.category or "Policy",
        priority=payload.priority or "medium"
    )

    return CouncilEnvelope(
        success=True,
        data=rec,
        message="Recommendation proposed to the Sovereign Directorate."
    )


@router.get(
    "/recommendations/{recommendation_id}",
    response_model=CouncilEnvelope[CouncilRecommendationResponse],
    summary="Retrieve recommendation details"
)
async def get_recommendation(
    recommendation_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns complete details of a specific recommendation."""
    rec = council_service.get_recommendation(recommendation_id)
    verify_world_access(rec["worldId"], current_user)

    return CouncilEnvelope(
        success=True,
        data=rec,
        message="Recommendation details retrieved."
    )


@router.post(
    "/recommendations/{recommendation_id}/review",
    response_model=CouncilEnvelope[CouncilRecommendationResponse],
    summary="Review a recommendation (Accept, Reject, or Under Review)"
)
async def review_recommendation(
    recommendation_id: str,
    payload: CouncilRecommendationReview,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Executes a formal review of a recommendation.
    Enforces business rule: ACCEPTED DOES NOT MEAN IMPLEMENTED.
    """
    rec = council_service.get_recommendation(recommendation_id)
    verify_world_access(rec["worldId"], current_user)

    updated = council_service.review_recommendation(
        rec_id=recommendation_id,
        action=payload.action,
        target_status=payload.status,
        reviewer_id=current_user["id"] if current_user else None,
        notes=payload.notes or payload.review_note
    )

    return CouncilEnvelope(
        success=True,
        data=updated,
        message=f"Recommendation successfully marked as '{updated['status']}'."
    )


@router.get(
    "/recommendations/{recommendation_id}/history",
    response_model=CouncilEnvelope[List[Dict[str, Any]]],
    summary="Retrieve recommendation review history"
)
async def get_recommendation_history(
    recommendation_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns review events associated with the recommendation."""
    rec = council_service.get_recommendation(recommendation_id)
    verify_world_access(rec["worldId"], current_user)

    history = [
        {
            "timestamp": rec["dateProposed"],
            "action": "Proposed",
            "reviewer": rec["advisorTitle"],
            "status": "Proposed",
            "notes": "Initiated into deliberation docket."
        }
    ]

    if rec.get("reviewedDate"):
        history.append({
            "timestamp": rec["reviewedDate"],
            "action": rec["status"],
            "reviewer": rec.get("reviewedBy") or "High Council",
            "status": rec["status"],
            "notes": rec.get("decisionNotes") or "Sovereign review decree recorded."
        })

    return CouncilEnvelope(
        success=True,
        data=history,
        message="Recommendation history retrieved."
    )


# ---------------------------------------------------------------------------
# Decision Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/sessions/{session_id}/decisions",
    response_model=CouncilEnvelope[CouncilDecisionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record a sovereign council decree"
)
async def record_session_decision(
    session_id: str,
    payload: CouncilDecisionCreate,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Records an authoritative council decree on a recommendation.
    Locked: Concluded or cancelled sessions cannot accept new decisions.
    """
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    decision_text = payload.get_text()

    decision = council_service.record_decision(
        session_id=session_id,
        outcome=payload.outcome,
        decision_text=decision_text,
        recommendation_id=payload.get_rec_id(),
        decision_type=payload.decision_type or "ratification",
        decided_by=current_user["id"] if current_user else None,
        metadata=payload.metadata
    )

    return CouncilEnvelope(
        success=True,
        data=decision,
        message="Decision registered into Imperial Archives."
    )


@router.get(
    "/sessions/{session_id}/decisions",
    response_model=CouncilEnvelope[List[CouncilDecisionResponse]],
    summary="Retrieve all decisions for a council session"
)
async def list_session_decisions(
    session_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns all decrees and ratifications recorded during a council session."""
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    decisions = council_service.list_session_decisions(session_id)
    return CouncilEnvelope(
        success=True,
        data=decisions,
        message="Council session decisions retrieved."
    )


# ---------------------------------------------------------------------------
# Intelligence & Deliberation Endpoints (Phase 3)
# ---------------------------------------------------------------------------

@router.post(
    "/intelligence/analyse/{world_id}",
    response_model=CouncilEnvelope[Dict[str, Any]],
    summary="Execute multi-domain Council deliberation"
)
async def run_council_intelligence(
    world_id: str,
    persist_recommendations: bool = Query(True),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Executes full multi-domain intelligence analysis across all six advisors on authoritative simulation state.
    Evaluates domain findings, identifies risks, checks cross-domain trade-offs, and persists new recommendations.
    """
    verify_world_access(world_id, current_user)
    report = await council_service.run_council_deliberation_async(
        world_id=world_id,
        persist_recommendations=persist_recommendations
    )
    return CouncilEnvelope(
        success=True,
        data=report,
        message="Council multi-domain intelligence deliberation executed successfully."
    )


@router.get(
    "/intelligence/latest/{world_id}",
    response_model=CouncilEnvelope[Dict[str, Any]],
    summary="Retrieve latest Council deliberation report"
)
async def get_latest_council_intelligence(
    world_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns the most recent unified Council deliberation report for the civilisation."""
    verify_world_access(world_id, current_user)
    report = await council_service.get_latest_council_deliberation_async(world_id)
    return CouncilEnvelope(
        success=True,
        data=report,
        message="Latest Council intelligence report retrieved."
    )


@router.post(
    "/intelligence/analyse/{world_id}/advisor/{advisor_id}",
    response_model=CouncilEnvelope[Dict[str, Any]],
    summary="Execute domain intelligence for a single advisor"
)
async def analyse_single_advisor(
    world_id: str,
    advisor_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Runs domain analytical logic for an individual advisor on the specified world state."""
    verify_world_access(world_id, current_user)
    res = await council_service.analyse_single_advisor_intelligence_async(world_id=world_id, advisor_id=advisor_id)
    return CouncilEnvelope(
        success=True,
        data=res,
        message=f"Domain intelligence analysis generated for '{advisor_id}'."
    )


@router.get(
    "/advisors/{advisor_id}/findings",
    response_model=CouncilEnvelope[List[Dict[str, Any]]],
    summary="Retrieve active findings for an advisor"
)
async def get_advisor_findings(
    advisor_id: str,
    world_id: str = Query("aurora-prime", alias="worldId"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns evidence-backed analytical findings for an advisor on the current world state."""
    verify_world_access(world_id, current_user)
    res = council_service.analyse_single_advisor_intelligence(world_id=world_id, advisor_id=advisor_id)
    return CouncilEnvelope(
        success=True,
        data=res.get("findings", []),
        message="Advisor analytical findings retrieved."
    )


@router.get(
    "/advisors/{advisor_id}/recommendations",
    response_model=CouncilEnvelope[List[Dict[str, Any]]],
    summary="Retrieve proposed recommendations for an advisor"
)
async def get_advisor_generated_recommendations(
    advisor_id: str,
    world_id: str = Query("aurora-prime", alias="worldId"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns prospective recommendations formulated by the advisor's intelligence engine."""
    verify_world_access(world_id, current_user)
    res = council_service.analyse_single_advisor_intelligence(world_id=world_id, advisor_id=advisor_id)
    return CouncilEnvelope(
        success=True,
        data=res.get("recommendations", []),
        message="Advisor proposed recommendations retrieved."
    )


# ---------------------------------------------------------------------------
# Convocation, Trade-Offs, & Overview Endpoints (Phase 5)
# ---------------------------------------------------------------------------

@router.post(
    "/sessions/{session_id}/convoke",
    response_model=CouncilEnvelope[Dict[str, Any]],
    summary="Convoke all six advisors in royal session"
)
async def convoke_session_advisors(
    session_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Executes formal convocation of all six advisors for an active council session.
    Runs analytical logic, generates findings, risks, and recommendations, and performs trade-off analysis.
    """
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    user_id = current_user.get("id") if current_user else None
    report = await council_service.convoke_council_advisors_async(
        world_id=session["worldId"],
        session_id=session_id,
        user_id=user_id
    )
    return CouncilEnvelope(
        success=True,
        data=report,
        message="High Council convoked and ministerial deliberation concluded."
    )


@router.get(
    "/advisors/{advisor_id}/speech/stream",
    summary="Progressive streaming of advisor formal counsel"
)
async def stream_advisor_speech_endpoint(
    advisor_id: str,
    world_id: str = Query("aurora-prime", alias="worldId"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Streams the formal speech of an advisor progressively using chunked text.
    Provides responsive UI delivery while isolating presentation from authoritative decisions.
    """
    verify_world_access(world_id, current_user)
    return StreamingResponse(
        stream_advisor_speech(advisor_id=advisor_id, world_id=world_id),
        media_type="text/plain"
    )


@router.get(
    "/sessions/{session_id}/tradeoffs",
    response_model=CouncilEnvelope[List[Dict[str, Any]]],
    summary="Retrieve cross-domain trade-offs and disagreements"
)
async def get_session_tradeoffs(
    session_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns detected genuine disagreements and competing objectives between advisors."""
    session = council_service.get_session(session_id)
    verify_world_access(session["worldId"], current_user)

    tradeoffs = council_service.get_tradeoffs(world_id=session["worldId"], session_id=session_id)
    return CouncilEnvelope(
        success=True,
        data=tradeoffs,
        message="Council trade-offs and disagreements retrieved."
    )


@router.get(
    "/overview/{world_id}",
    response_model=CouncilEnvelope[CouncilOverviewResponse],
    summary="Retrieve unified Council status overview"
)
async def get_council_overview(
    world_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns comprehensive council overview: assessment, live advisor states, pending recs, and active session."""
    world_id = _resolve_world_id(world_id)
    verify_world_access(world_id, current_user)
    overview = council_service.get_council_overview(world_id)
    return CouncilEnvelope(
        success=True,
        data=overview,
        message="Council overview status retrieved."
    )


# ---------------------------------------------------------------------------
# Execution and Post-Implementation Evaluation Endpoints (Phase 5)
# ---------------------------------------------------------------------------

@router.post(
    "/recommendations/{recommendation_id}/execute",
    response_model=CouncilEnvelope[CouncilExecutionResponse],
    summary="Authorize and execute an accepted recommendation into simulation"
)
async def execute_recommendation(
    recommendation_id: str,
    payload: CouncilExecutionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Submits an accepted recommendation for authorized execution into the simulation engine.
    Validates resource availability, executes policy/decree, snapshots baseline metrics, and records implementation.
    """
    rec = council_service.get_recommendation(recommendation_id)
    verify_world_access(rec["worldId"], current_user)

    user_id = current_user.get("id") if current_user else None
    exec_res = council_service.execute_recommendation(
        rec_id=recommendation_id,
        confirmation=payload.confirmation,
        execution_notes=payload.execution_notes or payload.executionNotes,
        user_id=user_id,
        target_action_override=payload.target_action_override or payload.targetActionOverride
    )
    return CouncilEnvelope(
        success=True,
        data=exec_res,
        message="Recommendation successfully executed into live simulation."
    )


@router.get(
    "/recommendations/{recommendation_id}/evaluation",
    response_model=CouncilEnvelope[CouncilEvaluationResponse],
    summary="Retrieve post-implementation metric evaluation"
)
async def evaluate_recommendation(
    recommendation_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Calculates observable post-implementation metric deltas comparing baseline to current simulation state."""
    rec = council_service.get_recommendation(recommendation_id)
    verify_world_access(rec["worldId"], current_user)

    evaluation = council_service.evaluate_recommendation_outcome(recommendation_id)
    return CouncilEnvelope(
        success=True,
        data=evaluation,
        message="Post-implementation outcome evaluation calculated."
    )


@router.get(
    "/executions",
    response_model=CouncilEnvelope[List[CouncilExecutionResponse]],
    summary="List all recommendation execution records for a world"
)
async def list_executions(
    world_id: str = Query("aurora-prime", alias="worldId"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Returns historical implementation execution records."""
    verify_world_access(world_id, current_user)
    records = council_service.list_execution_records(world_id)
    return CouncilEnvelope(
        success=True,
        data=records,
        message="Council execution audit records retrieved."
    )



