# CIVORA — Phase 5: Council & Advisor AI Engine Architecture Audit

## 1. Executive Summary

This audit provides a comprehensive diagnostic of the Council and Advisor Intelligence system in CIVORA.
The system is responsible for generating ministerial briefings, domain-specific findings, systemic risk assessments, policy recommendations, cross-domain trade-offs, and sovereign decision evaluations across six permanent imperial advisors:
1. **The Chancellor** (`adv-chancellor`): Governance & Society
2. **The Treasurer** (`adv-treasurer`): Economy & Finance
3. **The Grand Scholar** (`adv-scholar`): Science & Knowledge
4. **The Royal Architect** (`adv-architect`): Infrastructure & Development
5. **The High Physician** (`adv-physician`): Health & Wellbeing
6. **The Keeper of Nature** (`adv-keeper`): Environment & Ecology

The audit examines computational bottlenecks, concurrency limitations, caching opportunities, failure vulnerabilities, and asynchronous orchestration.

---

## 2. Inventory of AI & Intelligence Modules

| Module / File Path | Architectural Role | Current Implementation & Behavior |
| :--- | :--- | :--- |
| `app/features/council/intelligence/orchestrator.py` | Central AI Deliberation Orchestrator | Instantiates the 6 advisor engines, builds `CivilisationContext`, executes each advisor sequentially in a synchronous `for` loop, detects trade-offs, and persists recommendations. |
| `app/features/council/intelligence/base.py` | Abstract Base Advisor Contract | Defines `BaseAdvisor` pipeline: `evaluate_findings()`, `identify_risks()`, `generate_recommendations()`, `compose_formal_speech()`, and `calculate_confidence()`. |
| `app/features/council/intelligence/context.py` | Immutable Civilisation Context | Executes 8 sequential SQLite queries on `genesis.db` to assemble a frozen, immutable `CivilisationContext` snapshot for the active simulation tick. |
| `app/features/council/intelligence/advisors/*.py` | Domain Advisor Implementations | Six domain-specific analytical engines (`ChancellorAdvisor`, `TreasurerAdvisor`, `GrandScholarAdvisor`, `RoyalArchitectAdvisor`, `HighPhysicianAdvisor`, `KeeperOfNatureAdvisor`) evaluating indicator thresholds, regressions, and formulas. |
| `app/features/council/intelligence/strategies/tradeoff_analysis.py` | Cross-Domain Conflict Detection | Compares multi-advisor recommendations against contradictory domain pressures (e.g. UBI fiscal burden vs wealth disparity, demographic expansion vs biosphere pollution). |
| `app/features/council/service.py` | Council Business Service | High-level coordinator bridging FastAPI routes to the repository and intelligence orchestrator; handles session lifecycle, convocation, recommendation reviews, and execution. |
| `app/features/council/router.py` | FastAPI REST Endpoints | Exposes `/council/intelligence/analyse/{world_id}`, `/sessions/{id}/convoke`, `/advisors/{id}/briefing`, etc. Defines endpoints as `async def` but invokes blocking synchronous service routines directly. |
| `app/features/council/repository.py` | SQLite Persistence Layer | Manages tables for advisors, sessions, recommendations, decisions, session events, and execution records. |
| `monitoring/collector.py` | Phase 1 Telemetry Collector | Collects rolling AI metrics (`_ai_advisor_durations`, `_ai_deliberation_durations`, `_ai_total_requests`, `_ai_failed_requests`, `_ai_pending_operations`). |

---

## 3. Detailed Architectural Bottleneck Analysis

### Bottleneck 1: Sequential Advisor Execution
- **Location**: `app/features/council/intelligence/orchestrator.py:153-167`
- **Current Pattern**:
  ```python
  for advisor in self.advisors:
      t_adv = time.perf_counter()
      try:
          res = advisor.analyse(context)
          advisor_reports[advisor.advisor_id] = res
          ...
  ```
- **Problem**:
  The six advisors evaluate the immutable `CivilisationContext` snapshot with zero data dependencies between each other. The Chancellor does not need the Treasurer's output to evaluate civic stability; the Physician does not need the Architect's output to evaluate health capacity.
  Executing them in sequence multiplies total deliberation latency by 6x.
- **Evidence**:
  Under CPU load or complex telemetry samples (300+ citizens), sequential evaluation takes 25–60 ms. When integrating future LLM dialogue generation (1–3s per advisor), sequential execution would result in an unacceptable 6–18 second deliberation freeze.
- **Optimization**:
  Execute independent advisor evaluations concurrently using bounded asynchronous concurrency (`asyncio.gather` with an `asyncio.Semaphore` or non-blocking worker pool). Maintain deterministic aggregation order when collecting final results.

### Bottleneck 2: Event Loop Thread Blocking in FastAPI Routes
- **Location**: `app/features/council/router.py:440-458`, `router.py:549-570`
- **Current Pattern**:
  The route handlers are declared `async def run_council_intelligence`, but invoke synchronous methods:
  ```python
  report = council_service.run_council_deliberation(...)
  ```
  which calls `CouncilOrchestrator.run_council_deliberation()`, performing 8 SQLite queries, heavy formula processing, and database writes directly on the main async event loop.
- **Problem**:
  While a council deliberation or convocation runs, the entire FastAPI event loop is blocked. Incoming HTTP requests, health checks, and WebSocket frames are stalled.
- **Optimization**:
  Offload CPU-bound and synchronous database operations using `asyncio.to_thread` or native async execution, completely isolating AI processing from the event loop.

### Bottleneck 3: Complete Lack of State-Keyed Caching
- **Location**: `app/features/council/intelligence/orchestrator.py:100-104`
- **Current Pattern**:
  `self._latest_reports` only stores the single most recent report in memory by `world_id`.
  When a user or frontend polls `/intelligence/latest/{world_id}`, or when multiple components on the Council dashboard mount simultaneously (Briefing, Disagreements, Recommendations, Overview), each endpoint recalculates or re-queries state repeatedly even if the simulation tick has not changed.
- **Problem**:
  Excessive redundant calculations and database reads during static simulation ticks.
- **Optimization**:
  Implement an intelligent, state-keyed LRU cache. Cache keys incorporate `(world_id, simulation_tick, context_checksum, advisor_id)`. If the simulation has not ticked, return the cached evaluation in < 0.2 ms with a recorded cache hit.

### Bottleneck 4: Duplicate In-Flight Requests (Thundering Herd)
- **Location**: `app/features/council/service.py` & `orchestrator.py`
- **Current Pattern**:
  No single-flight tracking exists.
  If two clients or background jobs trigger `/intelligence/analyse/aurora-prime` at the same instant, two full deliberation pipelines run simultaneously, querying the database twice and executing 12 advisor pipelines concurrently with race conditions on recommendation persistence.
- **Optimization**:
  Implement an in-flight request deduplication manager (Single-Flight pattern). Subsequent callers awaiting an identical in-flight computation join the active pending `asyncio.Future` and share the result upon completion.

### Bottleneck 5: Fragile Recommendation Persistence Loop
- **Location**: `app/features/council/intelligence/orchestrator.py:200-225`
- **Current Pattern**:
  ```python
  for rec in all_recs:
      if rec.title.lower() not in existing_titles:
          self.repo.create_recommendation(...)
  ```
  Each recommendation insert opens an individual SQLite transaction via `get_db_connection()`, performing disk fsyncs in an unbatched loop.
- **Optimization**:
  Batch insert new recommendations within a single atomic database transaction, reducing disk operations from $N$ to 1.

### Bottleneck 6: Absence of Resilience, Timeouts & Circuit Breakers
- **Location**: `app/features/council/intelligence/orchestrator.py:161-166`
- **Current Pattern**:
  While individual advisor exceptions are caught with `try/except Exception`, there is:
  - No timeout enforcement (a hanging provider or external LLM service would hang the server indefinitely).
  - No retry mechanism with exponential backoff and jitter.
  - No circuit breaker pattern (repeated failures will continuously attempt failing endpoints, consuming credits and compounding latency).
- **Optimization**:
  Introduce a Centralized AI Request Manager featuring bounded concurrency, per-advisor timeouts, exponential backoff retries with jitter, and a three-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`).

### Bottleneck 7: Missing Progressive Streaming Support
- **Location**: `app/features/council/intelligence/base.py:149-151`
- **Current Pattern**:
  Formal speech is constructed monolithically via `compose_formal_speech()` and returned as a static string.
  The UI must wait for the entire report to conclude before displaying any dialogue.
- **Optimization**:
  Provide an asynchronous token/chunk streaming generator for advisor formal counsel, allowing progressive frontend delivery while keeping authoritative decision committing strictly separated from presentation.

---

## 4. Prioritized Phase 5 Implementation Roadmap

1. **Centralized AI Request Manager (`request_manager.py`)**:
   - Bounded concurrency via `asyncio.Semaphore`.
   - In-flight request deduplication (Single-Flight).
   - Timeouts, retries with exponential backoff & jitter, and circuit breaker.
2. **Intelligent Response Cache (`ai_cache.py`)**:
   - Composite state-keyed cache (`world_id`, `tick`, `context_hash`, `advisor_id`).
   - Bounded LRU with TTL expiration.
3. **Concurrent Advisor Orchestrator (`orchestrator.py`)**:
   - Concurrently evaluate all 6 advisors via `asyncio.gather()`.
   - Maintain deterministic order for findings, trade-offs, and reports.
   - Non-blocking thread offloading for SQLite operations.
4. **Progressive Speech Streaming**:
   - Asynchronous speech stream generator supporting chunked/SSE delivery.
5. **Consensus & Trade-off Optimization**:
   - Single-pass conflict matrix evaluation and batch recommendation persistence.
6. **Telemetry & Observability Integration**:
   - Extend `monitoring/collector.py` with cache hit rates, dedup counts, circuit breaker states, and token counts.
7. **Regression Test Suite (`test_council_ai_phase5.py`)**:
   - 12 automated test cases verifying concurrency, caching, deduplication, timeouts, fallbacks, and zero regression of advisor personalities or gameplay outcomes.
