# CIVORA – Real-Time Event Engine Audit (Phase 6)
**Document Version:** 1.0.0  
**Phase:** 6 – Real-Time Event Engine Optimization  
**Scope:** Frontend WebSocket Client, FastAPI Backend WebSocket Server, Simulation Scheduler Integration, Council Event Publishing, Connection Lifecycle, State Synchronization, and Telemetry.

---

## 1. Executive Summary

A comprehensive architectural audit was performed on the existing CIVORA communication system across the React frontend and FastAPI backend. The objective is to identify communication bottlenecks, ordering assumptions, serialization overhead, connection vulnerabilities, and synchronization gaps before implementing the centralized real-time event engine.

### Core Findings
1. **Head-of-Line Blocking in Connection Manager**: The backend `ConnectionManager` iterates sequentially through connected client WebSockets. A slow or stalled client blocks message delivery to all other clients in that world.
2. **Absence of Monotonically Sequenced Event Envelopes**: Messages currently emit arbitrary schemas without `seq_num`, `event_id`, `schema_version`, or authoritative `world_state_version`.
3. **No Delta State Synchronization**: Every simulation tick broadcasts large payloads (including 40 full citizen records and raw dictionaries) rather than lightweight property-level delta diffs, generating substantial network and JSON serialization overhead at high simulation speeds.
4. **Lack of Idempotency & Duplicate Protection**: Client commands lack idempotency keys; duplicate packet deliveries or network reconnect retries can trigger duplicate simulation advances or policy enactments.
5. **No Event Prioritization or Controlled Batching**: High-frequency visual telemetry and critical gameplay events (council decisions, policy toggles) share an unbuffered channel without prioritization or backpressure controls.
6. **Frontend Real-Time Disconnect**: The frontend currently relies on periodic REST polling (e.g., in `GameStateContext.tsx` syncing ticks every 4 seconds) rather than a persistent, auto-reconnecting WebSocket connection.
7. **Isolated Council and AI Events**: Council deliberation conclusions, advisor speech streams, and consensus enactments are not published to real-time streams, forcing clients to make redundant REST queries.

---

## 2. Existing Communication Architecture Inventory

### 2.1 Backend WebSocket Endpoints
- **Endpoint**: `GET /ws/world/{world_id}` (`genesis-engine/backend/main.py:478`)
- **Connection Registration**:
  - `await ws_manager.connect(world_id, websocket)` accepts the socket and stores it in `self.active_connections[world_id] = set()`.
- **Inbound Message Handling**:
  - Accepts raw text JSON in a `while True:` loop.
  - Recognizes `action == "tick"` (`ticks: int`) and `action == "ping"` (replies with `{"type": "pong"}`).
  - Unhandled commands or decode errors log an error via `perf_collector.record_ws_error()`.
- **Outbound Event Types**:
  - `initial_state`: Emitted immediately upon connection with full world state or SQLite snapshot.
  - `tick_update`: Broadcast upon manual tick or auto-tick tick step.
  - `policy_updated`: Broadcast upon REST `POST /api/worlds/{world_id}/policies`.
  - `error`: Emitted if the requested world does not exist.
  - `pong`: Emitted in response to client ping.

### 2.2 REST Endpoints Interacting with Real-Time State
| Endpoint | Method | Triggered Action | Real-Time Broadcast? |
| :--- | :--- | :--- | :--- |
| `/api/worlds/{id}/tick` | `POST` | Steps in-memory or SQLite simulation | Yes (`tick_update`) |
| `/api/worlds/{id}/policies` | `POST` | Updates policy parameters | Yes (`policy_updated`) |
| `/api/worlds/{id}/autotick/start` | `POST` | Starts monotonic auto-tick loop | Yes (periodic `tick_update`) |
| `/api/worlds/{id}/autotick/stop` | `POST` | Cancels auto-tick task | No |
| `/api/v1/worlds/{id}/simulation/start` | `POST` | Starts `SimulationScheduler` | No broadcast emitted |
| `/api/v1/worlds/{id}/simulation/pause` | `POST` | Pauses `SimulationScheduler` | No broadcast emitted |
| `/api/v1/worlds/{id}/simulation/advance` | `POST` | Advances simulation ticks under lock | No broadcast emitted |
| `/api/council/sessions/convoke` | `POST` | Creates council session | No broadcast emitted |
| `/api/council/deliberation` | `POST` | Evaluates advisors & consensus | No broadcast emitted |
| `/api/council/recommendations/{id}/enact`| `POST` | Enacts council policy recommendation | No broadcast emitted |
| `/api/experiments/execute` | `POST` | Deducts GRC & runs counterfactuals | No broadcast emitted |

### 2.3 WebSocket Connection Management (`ConnectionManager`)
- **File**: `genesis-engine/backend/main.py:34-68`
- **State Structure**:
  ```python
  self.active_connections: Dict[str, Set[WebSocket]] = {}
  ```
- **Broadcast Implementation**:
  ```python
  async def broadcast(self, world_id: str, message: Dict[str, Any]):
      if world_id in self.active_connections:
          dead_connections = set()
          payload = json.dumps(message)
          payload_len = len(payload.encode('utf-8'))
          for connection in list(self.active_connections[world_id]):
              try:
                  await connection.send_text(payload)
                  perf_collector.record_ws_message_sent(payload_len)
              except Exception:
                  dead_connections.add(connection)
                  perf_collector.record_ws_error()
          for dead in dead_connections:
              self.disconnect(world_id, dead)
  ```
- **Flaws Identified**:
  - **Sequential Await**: `await connection.send_text(payload)` blocks the loop for every recipient. If 10 clients are connected and 1 client experiences a 200ms socket buffer delay, total broadcast time jumps to >200ms, stalling the simulation.
  - **No Per-Client Buffers**: There are no outbound queues (`asyncio.Queue`). High-frequency tick broadcasts can saturate slow connections, causing memory bloat or OS-level socket disconnects.
  - **No Heartbeat/Keepalive**: No server-initiated ping/pong ping loop to detect half-open TCP connections.
  - **Shutdown Leak**: No cleanup method to cleanly close connected WebSockets with status code `1001 (Going Away)` during FastAPI application lifespan shutdown.

### 2.4 Frontend WebSocket Client & Real-Time Usage
- **State**: The frontend currently does not possess a persistent centralized WebSocket client instance.
- **REST Fallback Pattern**:
  - `src/context/GameStateContext.tsx` accumulates simulation ticks in `accumulatedTicksRef` and issues `civilizationApi.advanceSimulationTicks(...)` every 4000ms.
  - `src/services/monitoring/performanceMonitor.ts` includes telemetry hooks (`setWebSocketStatus`, `recordWebSocketMessageSent`, `recordWebSocketMessageReceived`, `recordWebSocketError`) which are currently idle because no live WebSocket service feeds them.
- **Consequences**:
  - UI state and backend authoritative state drift between 4-second polling intervals.
  - In multi-tab or multi-client scenarios, changes made by one client are invisible to others until manual page refresh.

---

## 3. Detailed Bottleneck Analysis

### Bottleneck 1: Head-of-Line Blocking in WebSocket Broadcast Loop
- **Exact File**: `genesis-engine/backend/main.py:59-65`
- **Current Implementation**:
  `for connection in list(self.active_connections[world_id]): await connection.send_text(payload)`
- **Problem**: Synchronous sequential iteration over async network sockets. A single lagging client pauses delivery to all healthy clients.
- **Evidence**: Measured in Phase 1 profiling when high latency simulations dropped from 60 FPS to 12 FPS during burst broadcasts.
- **Recommended Optimization**: Decouple client writes into bounded asynchronous per-client worker queues (`asyncio.Queue(maxsize=64)`). The broadcast function places messages into each client's queue non-blockingly; if a client queue fills, that client is flagged as slow and handled via backpressure/drop policies.
- **Risk**: Low. Internal to `ConnectionManager`.
- **Dependencies**: `ConnectionManager`, `perf_collector`.

### Bottleneck 2: Lack of Monotonic Event Sequencing and Envelope Schema
- **Exact File**: `genesis-engine/backend/main.py:54, 340-348, 532-540`
- **Current Implementation**: Raw dictionaries with arbitrary keys are dumped directly to JSON.
- **Problem**:
  - No sequence numbers (`seq_num`).
  - No event IDs (`event_id`).
  - No state versions (`world_state_version`).
  - Clients cannot detect dropped messages or out-of-order execution across reconnection.
- **Recommended Optimization**: Create a unified `EventEnvelope` schema:
  - `event_id`: Unique identifier (UUID/timestamp-prefixed).
  - `event_type`: Categorized event string (e.g., `world.state.delta`, `council.decision.enacted`).
  - `schema_version`: Protocol version string (`"1.0"`).
  - `world_id`: Scope identifier.
  - `sequence_number`: Monotonically increasing stream sequence per world.
  - `world_state_version`: Monotonic world tick / state version.
  - `timestamp`: UTC ISO timestamp.
  - `payload`: Typed event payload.
- **Risk**: Moderate. Requires backward compatibility for legacy clients expecting raw payloads.
- **Dependencies**: Frontend listeners, backend broadcast calls.

### Bottleneck 3: Uncompressed Full-State Broadcast on Every Tick
- **Exact File**: `genesis-engine/backend/main.py:347, 539`
- **Current Implementation**: Every tick packages `sample_citizens: [c.model_dump() for i, c in enumerate(world.citizens) if i < 40]` and the full economy/resources dictionary.
- **Problem**: At 10 Hz (10x simulation speed), each client receives ~150 KB/sec of mostly redundant telemetry data.
- **Recommended Optimization**: Implement delta state tracking. Compare current state with the previous broadcast state per world:
  - Broadcast `world.state.delta` containing only changed keys.
  - Provide a `world.state.snapshot` on initial connect or upon client sequence gap recovery.
  - Reduce bandwidth by >75%.
- **Risk**: Low. Authoritative state remains strictly backend-owned.
- **Dependencies**: `world_manager`, `simulation_v1`, `ConnectionManager`.

### Bottleneck 4: Lack of Idempotent Command Processing
- **Exact File**: `genesis-engine/backend/main.py:526-550`, `genesis-engine/backend/api/v1/simulation.py:78-88`
- **Current Implementation**: Tick advance and policy update requests process immediately without validating whether the request was already submitted.
- **Problem**: Rapid double-clicks or network retry attempts trigger duplicate simulation ticks or repeated policy deductions.
- **Recommended Optimization**: Introduce an `idempotency_key` (UUID or client-assigned token) with an LRU deduplication cache on the backend.
- **Risk**: Low. Transparent to clients that do not provide keys; protective for clients that do.
- **Dependencies**: `api/v1`, WebSocket command handler.

### Bottleneck 5: Missing Event Prioritization & Bounded Queues
- **Exact File**: `genesis-engine/backend/main.py:54-68`
- **Current Implementation**: A single unbuffered pipeline for all messages.
- **Problem**: Telemetry bursts delay critical state transitions and player commands.
- **Recommended Optimization**: Implement priority classes:
  - `PRIORITY_HIGH` (Critical): Player decisions, council conclusions, authoritative state snapshots (immediate dispatch).
  - `PRIORITY_LOW` (Noncritical): High-frequency telemetry, cosmetic ticks (batched or throttled with bounded window).
- **Risk**: Low.
- **Dependencies**: `ConnectionManager`.

---

## 4. Prioritized Implementation Sequence

1. **Task 2: Central Event Architecture & Envelope Schema**:
   Define `EventEnvelope` model, sequence generator, and category registry with backwards compatibility.
2. **Task 3: Delta State Synchronization**:
   Implement `compute_state_delta()` and versioned snapshot vs delta emission.
3. **Task 4: Sequencing & Duplicate Protection**:
   Implement stream-scoped monotonic sequence tracking and LRU idempotency cache.
4. **Task 5: High-Performance WebSocket Connection Manager**:
   Replace basic `ConnectionManager` with bounded per-client queues, non-blocking broadcasts, heartbeat ping/pong, and graceful shutdown.
5. **Task 6: Event Batching & Prioritization**:
   Add priority dispatching and telemetry throttling.
6. **Task 7: Frontend Centralized Event Client**:
   Implement `CivoraEventClient` in React/TypeScript with auto-reconnect, delta patch application, and gap detection.
7. **Task 8: Backpressure and Recovery**:
   Add snapshot resynchronization protocol on sequence mismatch or buffer overflow.
8. **Task 9 & 10: REST-WebSocket Coordination & Reliability**:
   Unify simulation scheduler and council broadcast triggers; integrate outbox persistence for critical actions.
9. **Task 11: Performance Telemetry**:
   Expose queue depth, sequence gaps, deltas emitted, and latencies in `monitoring/collector.py`.
10. **Task 12: Comprehensive Regression & Load Testing**:
    Verify all 14 criteria with automated pytest suite.
11. **Task 13: Final Engineering Report**:
    Produce `docs/performance/phase-6-realtime-engine.md`.
