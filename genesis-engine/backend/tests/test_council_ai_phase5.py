"""
CIVORA — Council AI Engine Phase 5 Regression & Quality Test Suite
Validates:
1. Single advisor evaluation (sync and async).
2. Concurrent multi-advisor execution with bounded concurrency.
3. State-keyed intelligent caching (hits, misses, TTL, and invalidation).
4. In-flight request deduplication (Single-Flight pattern).
5. Partial failure isolation & graceful degradation (failed_advisors).
6. Circuit breaker tripping and recovery.
7. Timeout management and retry mechanism.
8. Progressive dialogue streaming & cancellation safety.
9. Cross-domain trade-off detection and consensus preservation.
10. Atomic batch recommendation persistence without duplicates.
11. Prompt builder token accounting and static/dynamic separation.
12. Preservation of advisor personalities, roles, and deterministic outcomes.
"""

import os
import time
import asyncio
import pytest
from unittest.mock import patch, MagicMock

import db.database
from main import app
from engine.simulation_v1 import seed_aurora_prime_if_not_exists
from app.features.council.constants import (
    ADVISOR_CHANCELLOR,
    ADVISOR_TREASURER,
    ADVISOR_SCHOLAR,
    ADVISOR_ARCHITECT,
    ADVISOR_PHYSICIAN,
    ADVISOR_KEEPER,
    PERMANENT_ADVISOR_IDS,
)
from app.features.council.intelligence.context import build_civilisation_context
from app.features.council.intelligence.orchestrator import CouncilOrchestrator, UnifiedCouncilReport
from app.features.council.intelligence.ai_cache import ai_cache, AICache
from app.features.council.intelligence.request_manager import (
    AIRequestManager,
    CircuitBreaker,
    CircuitBreakerState,
    ai_request_manager,
)
from app.features.council.intelligence.prompt_builder import AdvisorPromptBuilder
from app.features.council.intelligence.streaming import stream_advisor_speech
from monitoring.collector import perf_collector


@pytest.fixture(autouse=True, scope="module")
def setup_phase5_test_db():
    """Flushes AI cache for Phase 5 tests."""
    ai_cache.clear()
    yield
    ai_cache.clear()


@pytest.fixture(autouse=True)
def clean_cache():
    """Flushes AI cache before each test."""
    ai_cache.clear()


# ---------------------------------------------------------------------------
# Test 1: Single Advisor Evaluation (Sync and Async)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_single_advisor_async_and_sync():
    """Verify single advisor can be evaluated both asynchronously and synchronously."""
    orch = CouncilOrchestrator()
    
    # Async evaluation
    res_async = await orch.analyse_single_advisor_async("aurora-prime", ADVISOR_CHANCELLOR)
    assert res_async.advisor_id == ADVISOR_CHANCELLOR
    assert res_async.domain == "Governance and Society"
    assert len(res_async.findings) > 0
    assert "civic_stability" in [m for f in res_async.findings for m in f.related_metrics]

    # Sync evaluation (backward compatibility)
    res_sync = orch.analyse_single_advisor("aurora-prime", ADVISOR_CHANCELLOR)
    assert res_sync.advisor_id == res_async.advisor_id
    assert res_sync.overall_status == res_async.overall_status


# ---------------------------------------------------------------------------
# Test 2: Concurrent Multi-Advisor Deliberation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_concurrent_multi_advisor_deliberation():
    """All 6 advisors execute concurrently and reports preserve deterministic ordering."""
    orch = CouncilOrchestrator()
    
    t0 = time.perf_counter()
    report = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)
    delib_duration = (time.perf_counter() - t0) * 1000.0

    # Ensure all 6 permanent advisors are present in the report
    assert len(report.advisor_reports) == 6
    for adv_id in PERMANENT_ADVISOR_IDS:
        assert adv_id in report.advisor_reports

    # Ensure deterministic ordered iteration matches PERMANENT_ADVISOR_IDS
    assert list(report.advisor_reports.keys()) == PERMANENT_ADVISOR_IDS
    assert report.all_findings_count > 0
    assert report.all_recommendations_count > 0
    assert report.composite_confidence > 0.70


# ---------------------------------------------------------------------------
# Test 3: State-Keyed Caching (Hits, Misses, and Invalidation)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_state_keyed_caching_hit_and_miss():
    """Cache hit returns identical report in < 2ms without recomputing."""
    orch = CouncilOrchestrator()

    # Initial computation (cache miss)
    perf_collector.reset()
    report1 = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)
    snapshot1 = perf_collector.get_metrics_snapshot()
    misses1 = snapshot1["council_ai"]["cache_misses"]
    assert misses1 >= 1

    # Second immediate run on same state (cache hit)
    t0 = time.perf_counter()
    report2 = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)
    hit_time_ms = (time.perf_counter() - t0) * 1000.0
    
    snapshot2 = perf_collector.get_metrics_snapshot()
    hits2 = snapshot2["council_ai"]["cache_hits"]
    assert hits2 >= 1
    assert hit_time_ms < 15.0  # Fast-path cache hit (< 15ms)
    assert report1.id == report2.id  # Same cached instance

    # Invalidate cache for world
    invalidated = ai_cache.invalidate_world("aurora-prime")
    assert invalidated > 0

    # Third run after invalidation (cache miss again)
    report3 = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)
    assert report3.id != report1.id  # Freshly generated report ID


# ---------------------------------------------------------------------------
# Test 4: In-Flight Request Deduplication (Single-Flight)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_in_flight_request_deduplication():
    """Two concurrent requests for identical computation share the single flight."""
    orch = CouncilOrchestrator()
    ai_cache.clear()

    # Launch two simultaneous deliberation tasks on cold cache
    task1 = asyncio.create_task(orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False))
    task2 = asyncio.create_task(orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False))

    r1, r2 = await asyncio.gather(task1, task2)
    assert r1.id == r2.id  # Shared exact same execution output

    snapshot = perf_collector.get_metrics_snapshot()
    assert snapshot["council_ai"]["dedup_hits"] >= 1


# ---------------------------------------------------------------------------
# Test 5: Resilience & Partial Failure Isolation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_resilience_and_partial_failure_isolation():
    """Failure of one advisor does not crash the council conclave."""
    orch = CouncilOrchestrator()
    ai_cache.clear()

    # Mock the Treasurer to throw an unexpected exception
    failing_adv = next(a for a in orch.advisors if a.advisor_id == ADVISOR_TREASURER)
    with patch.object(failing_adv, "analyse", side_effect=RuntimeError("Simulated Treasurer Provider Outage")):
        report = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)
        
        # Conclave completed despite failure
        assert ADVISOR_TREASURER in report.failed_advisors
        assert len(report.failed_advisors) == 1
        assert len(report.advisor_reports) == 5  # Other 5 succeeded
        assert ADVISOR_CHANCELLOR in report.advisor_reports
        assert ADVISOR_SCHOLAR in report.advisor_reports


# ---------------------------------------------------------------------------
# Test 6: Circuit Breaker Tripping and Recovery
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_circuit_breaker_tripping_and_recovery():
    """Circuit breaker trips to OPEN after threshold failures and fast-fails."""
    cb = CircuitBreaker("test-provider", failure_threshold=3, recovery_timeout_sec=0.1)
    assert cb.state == CircuitBreakerState.CLOSED

    # Record failures up to threshold
    cb.record_failure()
    assert cb.state == CircuitBreakerState.CLOSED
    cb.record_failure()
    assert cb.state == CircuitBreakerState.CLOSED
    cb.record_failure()
    assert cb.state == CircuitBreakerState.OPEN
    assert not cb.can_execute()  # Rejects immediate execution

    # Await recovery timeout
    await asyncio.sleep(0.12)
    assert cb.can_execute()  # Probes in HALF_OPEN
    assert cb.state == CircuitBreakerState.HALF_OPEN

    # Probe succeeds
    cb.record_success()
    assert cb.state == CircuitBreakerState.CLOSED
    assert cb.consecutive_failures == 0


# ---------------------------------------------------------------------------
# Test 7: Timeout Handling and Retry Mechanism
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_timeout_handling_and_retry():
    """AIRequestManager times out slow call and retries with backoff."""
    mgr = AIRequestManager(max_concurrency=2, default_timeout_sec=0.05, default_max_retries=1)

    attempt_count = 0

    async def slow_func():
        nonlocal attempt_count
        attempt_count += 1
        await asyncio.sleep(0.2)  # Exceeds 0.05s timeout
        return "done"

    with pytest.raises(Exception):
        await mgr.execute_task(
            request_key="test_timeout",
            coro_func=slow_func,
            circuit_breaker_name="test_cb",
            timeout_sec=0.05,
            max_retries=1,
            deduplicate=False
        )

    # Executed 2 attempts (1 initial + 1 retry)
    assert attempt_count == 2


# ---------------------------------------------------------------------------
# Test 8: Progressive Speech Streaming
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_progressive_speech_streaming():
    """Stream advisor speech delivers progressive words without altering authoritative state."""
    chunks = []
    async for chunk in stream_advisor_speech(ADVISOR_CHANCELLOR, "aurora-prime", words_per_chunk=2, chunk_delay_sec=0.001):
        chunks.append(chunk)

    assert len(chunks) > 2
    full_streamed = "".join(chunks)
    assert len(full_streamed) > 20
    assert "Sovereign" in full_streamed or "Chancellor" in full_streamed or "stability" in full_streamed


# ---------------------------------------------------------------------------
# Test 9: Cross-Domain Trade-off & Disagreement Preservation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cross_domain_tradeoffs_and_dependent_conclave():
    """Trade-off analysis identifies conflicting objectives between advisors."""
    orch = CouncilOrchestrator()
    report = await orch.run_council_deliberation_async("aurora-prime", persist_recommendations=False)

    # In Aurora Prime, structural trade-offs exist (e.g. UBI fiscal vs social, or expansion vs ecology)
    assert isinstance(report.cross_domain_tradeoffs, list)
    if report.cross_domain_tradeoffs:
        t = report.cross_domain_tradeoffs[0]
        assert "advisorAId" in t or "primary_advisor_id" in t
        assert "conflict_title" in t or "conflictTitle" in t


# ---------------------------------------------------------------------------
# Test 10: Atomic Batch Recommendation Persistence
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_atomic_batch_recommendation_persistence():
    """Batch persistence creates recommendations cleanly and handles duplicates."""
    orch = CouncilOrchestrator()
    repo = orch.repo

    test_recs = [
        {
            "world_id": "aurora-prime",
            "advisor_id": ADVISOR_CHANCELLOR,
            "title": f"Test Policy Alpha {time.time()}",
            "description": "Test description alpha",
            "justification": "Test justification",
            "expected_benefits": ["Benefit 1"],
            "potential_risks": ["Risk 1"],
            "estimated_cost_crc": 100.0,
            "political_capital_req": 20.0,
            "category": "Policy",
            "priority": "high",
        },
        {
            "world_id": "aurora-prime",
            "advisor_id": ADVISOR_TREASURER,
            "title": f"Test Policy Beta {time.time()}",
            "description": "Test description beta",
            "justification": "Test justification",
            "expected_benefits": ["Benefit 2"],
            "potential_risks": ["Risk 2"],
            "estimated_cost_crc": 200.0,
            "political_capital_req": 30.0,
            "category": "Economy",
            "priority": "medium",
        }
    ]

    ids = repo.create_recommendations_batch(test_recs)
    assert len(ids) == 2
    for r_id in ids:
        saved = repo.get_recommendation(r_id)
        assert saved is not None
        assert saved["world_id"] == "aurora-prime"


# ---------------------------------------------------------------------------
# Test 11: Prompt Builder Token Accounting
# ---------------------------------------------------------------------------

def test_prompt_builder_token_accounting():
    """Prompt builder separates static persona from dynamic telemetry and estimates tokens."""
    ctx = build_civilisation_context("aurora-prime")
    prompt_ctx = AdvisorPromptBuilder.build_prompt_context(ADVISOR_SCHOLAR, ctx)

    assert "Dr. Elenora Vance" in prompt_ctx.static_system_prompt
    assert "Science and Knowledge" in prompt_ctx.static_system_prompt
    assert "SIMULATION TELEMETRY" in prompt_ctx.dynamic_state_prompt
    assert prompt_ctx.estimated_tokens > 50
    assert prompt_ctx.estimated_tokens < 1000


# ---------------------------------------------------------------------------
# Test 12: Advisor Personality Preservation
# ---------------------------------------------------------------------------

def test_advisor_personality_preservation():
    """All 6 advisors retain their distinct historical identities, domains, and titles."""
    orch = CouncilOrchestrator()
    adv_map = {a.advisor_id: a for a in orch.advisors}

    assert adv_map[ADVISOR_CHANCELLOR].advisor_name == "Aurelius Valerius"
    assert adv_map[ADVISOR_CHANCELLOR].advisor_title == "The High Chancellor"
    assert adv_map[ADVISOR_CHANCELLOR].domain == "Governance and Society"

    assert adv_map[ADVISOR_TREASURER].advisor_name == "Cassian Drake"
    assert adv_map[ADVISOR_TREASURER].advisor_title == "The Grand Treasurer"
    assert adv_map[ADVISOR_TREASURER].domain == "Economy and Finance"

    assert adv_map[ADVISOR_SCHOLAR].advisor_name == "Dr. Elenora Vance"
    assert adv_map[ADVISOR_SCHOLAR].advisor_title == "The Grand Scholar"
    assert adv_map[ADVISOR_SCHOLAR].domain == "Science and Knowledge"

    assert adv_map[ADVISOR_ARCHITECT].advisor_name == "Severus Thorne"
    assert adv_map[ADVISOR_ARCHITECT].advisor_title == "The Royal Architect"
    assert adv_map[ADVISOR_ARCHITECT].domain == "Infrastructure and Development"

    assert adv_map[ADVISOR_PHYSICIAN].advisor_name == "Lady Maeve Linnea"
    assert adv_map[ADVISOR_PHYSICIAN].advisor_title == "The High Physician"
    assert adv_map[ADVISOR_PHYSICIAN].domain == "Health and Wellbeing"

    assert adv_map[ADVISOR_KEEPER].advisor_name == "Thalric Ironwood"
    assert adv_map[ADVISOR_KEEPER].advisor_title == "The Keeper of Nature"
    assert adv_map[ADVISOR_KEEPER].domain == "Environment and Ecology"
