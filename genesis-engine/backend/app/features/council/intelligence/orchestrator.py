"""
CIVORA — Council Intelligence Central Orchestrator
Coordinates all six independent advisor engines over a shared, read-only simulation context.
Optimized with:
- Bounded asynchronous concurrent advisor evaluations
- In-flight single-flight request deduplication
- State-keyed intelligent caching with TTL
- Atomic batch recommendation persistence
- Circuit-breaker resilience and graceful degradation
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

from monitoring.collector import perf_collector
from app.features.council.constants import PERMANENT_ADVISOR_IDS
from app.features.council.intelligence.context import build_civilisation_context, CivilisationContext
from app.features.council.intelligence.base import BaseAdvisor, AdvisorAnalysisResult
from app.features.council.intelligence.advisors import (
    ChancellorAdvisor,
    TreasurerAdvisor,
    GrandScholarAdvisor,
    RoyalArchitectAdvisor,
    HighPhysicianAdvisor,
    KeeperOfNatureAdvisor,
)
from app.features.council.intelligence.strategies.tradeoff_analysis import (
    AdvisorTradeoffConflict,
    detect_cross_domain_tradeoffs,
)
from app.features.council.intelligence.ai_cache import ai_cache
from app.features.council.intelligence.request_manager import ai_request_manager
from app.features.council.intelligence.prompt_builder import AdvisorPromptBuilder
from app.features.council.repository import CouncilRepository

logger = logging.getLogger(__name__)


@dataclass
class UnifiedCouncilReport:
    """Consolidated deliberation report from all six Council advisors."""
    id: str
    world_id: str
    world_name: str
    simulation_tick: int
    year: int
    day: int
    generated_at: str
    overall_civilisation_status: str
    executive_summary: str
    advisor_reports: Dict[str, Any] = field(default_factory=dict)
    all_findings_count: int = 0
    all_risks_count: int = 0
    all_recommendations_count: int = 0
    cross_domain_tradeoffs: List[Dict[str, Any]] = field(default_factory=list)
    composite_confidence: float = 0.88
    data_completeness: float = 0.90
    failed_advisors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        all_recs = [rec for adv in self.advisor_reports.values() for rec in adv.get("recommendations", [])]
        all_findings = [f for adv in self.advisor_reports.values() for f in adv.get("findings", [])]
        return {
            "id": self.id,
            "world_id": self.world_id,
            "worldId": self.world_id,
            "world_name": self.world_name,
            "simulation_tick": self.simulation_tick,
            "simulationTick": self.simulation_tick,
            "year": self.year,
            "day": self.day,
            "generated_at": self.generated_at,
            "timestamp": self.generated_at,
            "overall_civilisation_status": self.overall_civilisation_status,
            "status": self.overall_civilisation_status,
            "executive_summary": self.executive_summary,
            "advisor_reports": self.advisor_reports,
            "advisors": self.advisor_reports,
            "all_findings_count": self.all_findings_count,
            "all_risks_count": self.all_risks_count,
            "all_recommendations_count": self.all_recommendations_count,
            "cross_domain_tradeoffs": self.cross_domain_tradeoffs,
            "tradeoffs": self.cross_domain_tradeoffs,
            "recommendations": all_recs,
            "findings": all_findings,
            "composite_confidence": self.composite_confidence,
            "data_completeness": self.data_completeness,
            "failed_advisors": self.failed_advisors,
        }


class CouncilOrchestrator:
    """Central engine orchestrating the six advisor intelligence modules."""

    def __init__(self, repository: Optional[CouncilRepository] = None):
        self.repo = repository or CouncilRepository()
        self.advisors: List[BaseAdvisor] = [
            ChancellorAdvisor(),
            TreasurerAdvisor(),
            GrandScholarAdvisor(),
            RoyalArchitectAdvisor(),
            HighPhysicianAdvisor(),
            KeeperOfNatureAdvisor(),
        ]
        # In-memory cache for latest unified reports by world_id
        self._latest_reports: Dict[str, UnifiedCouncilReport] = {}

    def get_latest_report(self, world_id: str) -> Optional[UnifiedCouncilReport]:
        return self._latest_reports.get(world_id)

    # -----------------------------------------------------------------------
    # Asynchronous Advisor & Deliberation Pipeline (Phase 5)
    # -----------------------------------------------------------------------

    async def analyse_single_advisor_async(
        self,
        world_id: str,
        advisor_id: str
    ) -> AdvisorAnalysisResult:
        """
        Asynchronously executes analysis for a single advisor with caching,
        deduplication, timeout protection, and token telemetry.
        """
        target_adv = next((a for a in self.advisors if a.advisor_id == advisor_id), None)
        if not target_adv:
            raise ValueError(f"Advisor identity '{advisor_id}' not found in Imperial Roster.")

        # 1. Build immutable context asynchronously (non-blocking)
        context = await asyncio.to_thread(build_civilisation_context, world_id)
        state_sig = ai_cache.compute_context_signature(context)

        # 2. Check Cache
        cache_key = ai_cache.build_cache_key(
            world_id=world_id,
            tick=context.tick,
            state_signature=state_sig,
            operation="single_advisor",
            advisor_id=advisor_id
        )
        cached = ai_cache.get(cache_key, expected_signature=state_sig)
        if cached is not None:
            return cached

        # 3. Deduplicated Execution with AIRequestManager
        async def _run():
            perf_collector.inc_ai_pending()
            t0 = time.perf_counter()
            try:
                # Offload CPU evaluation to thread
                res = await asyncio.to_thread(target_adv.analyse, context)
                dt = (time.perf_counter() - t0) * 1000.0
                perf_collector.record_ai_advisor_run(advisor_id, dt, success=True)

                # Estimate and record tokens
                prompt_ctx = AdvisorPromptBuilder.build_prompt_context(advisor_id, context)
                perf_collector.record_ai_tokens(prompt_ctx.estimated_tokens)

                # Cache result
                ai_cache.set(cache_key, res, world_id=world_id, state_signature=state_sig, ttl_seconds=60.0)
                return res
            except Exception as e:
                dt = (time.perf_counter() - t0) * 1000.0
                perf_collector.record_ai_advisor_run(advisor_id, dt, success=False)
                raise e
            finally:
                perf_collector.dec_ai_pending()

        return await ai_request_manager.execute_task(
            request_key=cache_key,
            coro_func=_run,
            circuit_breaker_name=advisor_id,
            timeout_sec=5.0,
            max_retries=1
        )

    async def _analyse_advisor_with_manager(
        self,
        advisor: BaseAdvisor,
        context: CivilisationContext,
        state_sig: str
    ) -> AdvisorAnalysisResult:
        """Concurrently evaluates one advisor with caching and resilience."""
        cache_key = ai_cache.build_cache_key(
            world_id=context.world_id,
            tick=context.tick,
            state_signature=state_sig,
            operation="advisor_deliberation",
            advisor_id=advisor.advisor_id
        )

        cached = ai_cache.get(cache_key, expected_signature=state_sig)
        if cached is not None:
            return cached

        async def _exec():
            t_adv = time.perf_counter()
            try:
                res = await asyncio.to_thread(advisor.analyse, context)
                dt = (time.perf_counter() - t_adv) * 1000.0
                perf_collector.record_ai_advisor_run(advisor.advisor_id, dt, success=True)

                prompt_ctx = AdvisorPromptBuilder.build_prompt_context(advisor.advisor_id, context)
                perf_collector.record_ai_tokens(prompt_ctx.estimated_tokens)

                ai_cache.set(cache_key, res, world_id=context.world_id, state_signature=state_sig, ttl_seconds=60.0)
                return res
            except Exception as e:
                dt = (time.perf_counter() - t_adv) * 1000.0
                perf_collector.record_ai_advisor_run(advisor.advisor_id, dt, success=False)
                raise e

        return await ai_request_manager.execute_task(
            request_key=cache_key,
            coro_func=_exec,
            circuit_breaker_name=advisor.advisor_id,
            timeout_sec=5.0,
            max_retries=1
        )

    async def run_council_deliberation_async(
        self,
        world_id: str,
        persist_recommendations: bool = True
    ) -> UnifiedCouncilReport:
        """
        Asynchronously executes full multi-domain Council deliberation across all six advisors:
        1. Single-Flight in-flight request deduplication prevents thundering herds.
        2. Fast-path state-keyed cache returns existing report in < 1ms.
        3. Executes all 6 independent advisor evaluations concurrently via bounded task manager.
        4. Detects genuine cross-domain conflicts.
        5. Atomically batch-persists new recommendations.
        6. Caches report and returns unified structure in deterministic order.
        """
        # Fast-path cache check: if recent valid deliberation exists for this world and persistence mode, return immediately
        fast_cache_key = f"delib_report:{world_id}:{persist_recommendations}"
        cached_fast = ai_cache.get(fast_cache_key)
        if cached_fast is not None:
            if persist_recommendations:
                # Confirm database actually has persisted recommendations (handles test db switches cleanly)
                has_recs = await asyncio.to_thread(self.repo.list_recommendations, world_id=world_id, limit=1)
                if has_recs:
                    self._latest_reports[world_id] = cached_fast
                    return cached_fast
                else:
                    # Database was reset or cleared; invalidate stale cache for this world
                    ai_cache.invalidate_world(world_id)
            else:
                self._latest_reports[world_id] = cached_fast
                return cached_fast

        # In-Flight deduplication wrapping the deliberation execution
        request_key = f"delib_run:{world_id}:{persist_recommendations}"

        async def _run_deliberation():
            # Check fast-path cache inside lock in case another in-flight task just populated it
            cached = ai_cache.get(fast_cache_key)
            if cached is not None:
                if not persist_recommendations:
                    self._latest_reports[world_id] = cached
                    return cached
                has_recs = await asyncio.to_thread(self.repo.list_recommendations, world_id=world_id, limit=1)
                if has_recs:
                    self._latest_reports[world_id] = cached
                    return cached
                else:
                    ai_cache.invalidate_world(world_id)

            perf_collector.inc_ai_pending()
            t0 = time.perf_counter()
            now = datetime.now(timezone.utc).isoformat()
            report_id = f"rpt_{uuid.uuid4().hex[:12]}"

            # 1. Build immutable shared snapshot
            context = await asyncio.to_thread(build_civilisation_context, world_id)
            state_sig = ai_cache.compute_context_signature(context)

            # Secondary signature-based cache check
            delib_cache_key = ai_cache.build_cache_key(
                world_id=world_id,
                tick=context.tick,
                state_signature=state_sig,
                operation=f"council_deliberation:{persist_recommendations}"
            )
            cached_sig = ai_cache.get(delib_cache_key, expected_signature=state_sig)
            if cached_sig is not None:
                use_cached = True
                if persist_recommendations:
                    has_recs = await asyncio.to_thread(self.repo.list_recommendations, world_id=world_id, limit=1)
                    if not has_recs:
                        use_cached = False
                if use_cached:
                    ai_cache.set(fast_cache_key, cached_sig, world_id=world_id, state_signature=state_sig, ttl_seconds=60.0)
                    self._latest_reports[world_id] = cached_sig
                    perf_collector.dec_ai_pending()
                    return cached_sig

            # 2. Concurrently evaluate all 6 independent advisors
            tasks = [
                self._analyse_advisor_with_manager(adv, context, state_sig)
                for adv in self.advisors
            ]
            raw_results = await asyncio.gather(*tasks, return_exceptions=True)

            advisor_reports: Dict[str, AdvisorAnalysisResult] = {}
            failed_advisors: List[str] = []

            for adv, res in zip(self.advisors, raw_results):
                if isinstance(res, Exception):
                    logger.error(f"Advisor '{adv.advisor_id}' analysis failure: {res}", exc_info=True)
                    failed_advisors.append(adv.advisor_id)
                elif isinstance(res, AdvisorAnalysisResult):
                    advisor_reports[adv.advisor_id] = res

            # Preserve deterministic display order based on PERMANENT_ADVISOR_IDS
            ordered_reports = {}
            for aid in PERMANENT_ADVISOR_IDS:
                if aid in advisor_reports:
                    ordered_reports[aid] = advisor_reports[aid]

            # 3. Detect cross-domain trade-offs and disagreements
            tradeoffs = detect_cross_domain_tradeoffs(context, ordered_reports)

            # 4. Aggregates
            total_findings = sum(len(r.findings) for r in ordered_reports.values())
            total_risks = sum(len(r.risks) for r in ordered_reports.values())
            all_recs = [rec for r in ordered_reports.values() for rec in r.recommendations]

            # 5. Determine overall civilisational status
            all_statuses = [r.overall_status for r in ordered_reports.values()]
            if "Critical" in all_statuses:
                overall_status = "Critical"
                exec_summary = "High Imperial Council reports critical civil distress requiring immediate sovereign intervention."
            elif "Attention Required" in all_statuses:
                overall_status = "Attention Required"
                exec_summary = "Imperial advisors highlight emerging systemic vulnerabilities across governance, ecology, or infrastructure."
            elif "Stable" in all_statuses:
                overall_status = "Stable"
                exec_summary = "Civilisational equilibria maintained across primary domains with steady progress."
            else:
                overall_status = "Optimal"
                exec_summary = "The empire flourishes under harmonious governance, robust reserves, and pristine biomes."

            # Composite metrics
            avg_confidence = round(
                sum(r.confidence for r in ordered_reports.values()) / max(len(ordered_reports), 1), 2
            )
            avg_completeness = round(
                sum(r.data_completeness for r in ordered_reports.values()) / max(len(ordered_reports), 1), 2
            )

            # 6. Optionally persist recommendations atomically in batch
            if persist_recommendations and all_recs:
                existing_recs = await asyncio.to_thread(self.repo.list_recommendations, world_id=world_id, limit=200)
                existing_titles = {r["title"].lower() for r in existing_recs}

                new_recs_to_insert = []
                for rec in all_recs:
                    if rec.title.lower() not in existing_titles:
                        new_recs_to_insert.append({
                            "world_id": world_id,
                            "session_id": None,
                            "advisor_id": rec.advisor_id,
                            "title": rec.title,
                            "description": rec.description,
                            "justification": rec.reason,
                            "expected_benefits": rec.expected_benefits,
                            "potential_risks": rec.potential_risks,
                            "estimated_cost_crc": rec.estimated_cost_crc,
                            "political_capital_req": rec.political_capital_req,
                            "category": rec.category,
                            "priority": rec.priority.lower(),
                            "status": "proposed",
                        })
                        existing_titles.add(rec.title.lower())

                if new_recs_to_insert:
                    try:
                        await asyncio.to_thread(self.repo.create_recommendations_batch, new_recs_to_insert)
                    except Exception as err:
                        logger.warning(f"Could not batch persist recommendations: {err}")

            # 7. Construct unified report
            report = UnifiedCouncilReport(
                id=report_id,
                world_id=context.world_id,
                world_name=context.world_name,
                simulation_tick=context.tick,
                year=context.year,
                day=context.day,
                generated_at=now,
                overall_civilisation_status=overall_status,
                executive_summary=exec_summary,
                advisor_reports={k: v.to_dict() for k, v in ordered_reports.items()},
                all_findings_count=total_findings,
                all_risks_count=total_risks,
                all_recommendations_count=len(all_recs),
                cross_domain_tradeoffs=[t.to_dict() for t in tradeoffs],
                composite_confidence=avg_confidence,
                data_completeness=avg_completeness,
                failed_advisors=failed_advisors,
            )

            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_council_deliberation(
                duration_ms=dt,
                success=True,
                failed_advisors=len(failed_advisors)
            )
            perf_collector.dec_ai_pending()

            # Cache the unified deliberation report in both fast-path and state-keyed slots
            ai_cache.set(fast_cache_key, report, world_id=world_id, state_signature=state_sig, ttl_seconds=60.0)
            ai_cache.set(delib_cache_key, report, world_id=world_id, state_signature=state_sig, ttl_seconds=60.0)
            self._latest_reports[world_id] = report
            return report

        return await ai_request_manager.execute_task(
            request_key=request_key,
            coro_func=_run_deliberation,
            circuit_breaker_name="council_deliberation",
            timeout_sec=10.0,
            max_retries=1
        )

    # -----------------------------------------------------------------------
    # Synchronous Compatibility Layer
    # -----------------------------------------------------------------------

    def analyse_single_advisor(self, world_id: str, advisor_id: str) -> AdvisorAnalysisResult:
        """Synchronous wrapper ensuring backward-compatibility with tests & synchronous callers."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            # In an active event loop, run directly on worker thread to avoid deadlock
            with ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(
                    lambda: asyncio.run(self.analyse_single_advisor_async(world_id, advisor_id))
                ).result()
        else:
            return asyncio.run(self.analyse_single_advisor_async(world_id, advisor_id))

    def run_council_deliberation(
        self,
        world_id: str,
        persist_recommendations: bool = True
    ) -> UnifiedCouncilReport:
        """Synchronous wrapper ensuring backward-compatibility with tests & synchronous callers."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            with ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(
                    lambda: asyncio.run(self.run_council_deliberation_async(world_id, persist_recommendations))
                ).result()
        else:
            return asyncio.run(self.run_council_deliberation_async(world_id, persist_recommendations))
