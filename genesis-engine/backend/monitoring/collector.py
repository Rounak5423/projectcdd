"""
CIVORA — Centralized Performance Metrics Collector
Thread-safe, bounded rolling metrics collector for Phase 1 monitoring.
Captures API latencies, Database execution, Simulation ticks, Council AI and WebSockets.
"""

import time
import threading
import re
from collections import deque
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Deque


# Helper to calculate percentiles from a sequence of numbers
def calculate_percentile(data: List[float], percentile: float) -> float:
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (percentile / 100.0)
    f = int(k)
    c = f + 1
    if c < len(sorted_data):
        d0 = sorted_data[f] * (c - k)
        d1 = sorted_data[c] * (k - f)
        return round(d0 + d1, 2)
    return round(sorted_data[f], 2)


class PerformanceMetricsCollector:
    """Central singleton collecting rolling operational metrics with bounded memory."""

    def __init__(self, max_samples: int = 1000):
        self._lock = threading.Lock()
        self._enabled: bool = True
        self._start_time: float = time.time()
        self.max_samples = max_samples

        # API Metrics
        self._api_durations: Deque[float] = deque(maxlen=max_samples)
        self._api_timestamps: Deque[float] = deque(maxlen=max_samples)
        self._api_total_requests: int = 0
        self._api_total_errors: int = 0
        self._api_endpoints: Dict[str, Dict[str, Any]] = {}
        self._api_slow_requests: Deque[Dict[str, Any]] = deque(maxlen=30)

        # Database Metrics
        self._db_query_durations: Deque[float] = deque(maxlen=max_samples)
        self._db_total_queries: int = 0
        self._db_slow_queries_count: int = 0
        self._db_errors_count: int = 0
        self._db_slow_queries: Deque[Dict[str, Any]] = deque(maxlen=30)
        self.slow_query_threshold_ms: float = 50.0

        # Simulation Metrics
        self._sim_tick_durations: Deque[float] = deque(maxlen=200)
        self._sim_total_ticks: int = 0
        self._sim_last_tick_timestamp: Optional[float] = None
        self._sim_last_processed_agents: int = 0
        self._sim_last_state_updates: int = 0
        self._sim_total_events_generated: int = 0
        self._sim_total_db_writes: int = 0
        self._sim_errors_count: int = 0

        # Council AI Metrics
        self._ai_advisor_durations: Dict[str, Deque[float]] = {}
        self._ai_deliberation_durations: Deque[float] = deque(maxlen=100)
        self._ai_total_requests: int = 0
        self._ai_failed_requests: int = 0
        self._ai_timeouts_count: int = 0
        self._ai_retries_count: int = 0
        self._ai_pending_operations: int = 0

        # WebSocket Metrics
        self._ws_active_connections: int = 0
        self._ws_total_connected: int = 0
        self._ws_total_disconnected: int = 0
        self._ws_messages_sent: int = 0
        self._ws_messages_received: int = 0
        self._ws_bytes_sent_approx: int = 0
        self._ws_bytes_received_approx: int = 0
        self._ws_message_durations: Deque[float] = deque(maxlen=300)
        self._ws_errors_count: int = 0

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    def set_enabled(self, enabled: bool) -> None:
        with self._lock:
            self._enabled = enabled

    # -------------------------------------------------------------------------
    # API Recording
    # -------------------------------------------------------------------------
    def record_api_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        correlation_id: str,
    ) -> None:
        if not self._enabled:
            return

        now = time.time()
        is_error = status_code >= 400
        is_slow = duration_ms >= 250.0

        endpoint_key = f"{method.upper()} {path}"

        with self._lock:
            self._api_total_requests += 1
            if is_error:
                self._api_total_errors += 1

            self._api_durations.append(duration_ms)
            self._api_timestamps.append(now)

            if endpoint_key not in self._api_endpoints:
                self._api_endpoints[endpoint_key] = {
                    "count": 0,
                    "errors": 0,
                    "total_ms": 0.0,
                    "last_status": status_code,
                    "min_ms": duration_ms,
                    "max_ms": duration_ms,
                }

            ep = self._api_endpoints[endpoint_key]
            ep["count"] += 1
            if is_error:
                ep["errors"] += 1
            ep["total_ms"] += duration_ms
            ep["last_status"] = status_code
            ep["min_ms"] = min(ep["min_ms"], duration_ms)
            ep["max_ms"] = max(ep["max_ms"], duration_ms)

            if is_slow:
                self._api_slow_requests.append({
                    "correlation_id": correlation_id,
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": round(duration_ms, 2),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    # -------------------------------------------------------------------------
    # Database Recording
    # -------------------------------------------------------------------------
    def record_db_query(self, duration_ms: float, sql: str) -> None:
        if not self._enabled:
            return

        is_slow = duration_ms >= self.slow_query_threshold_ms

        # Sanitize query by stripping string and numeric literals to protect privacy
        sanitized_sql = re.sub(r"'[^']*'", "'?'", sql)
        sanitized_sql = re.sub(r"\b\d+\b", "?", sanitized_sql).strip()
        # Truncate overly long queries
        if len(sanitized_sql) > 160:
            sanitized_sql = sanitized_sql[:157] + "..."

        with self._lock:
            self._db_total_queries += 1
            self._db_query_durations.append(duration_ms)
            if is_slow:
                self._db_slow_queries_count += 1
                self._db_slow_queries.append({
                    "duration_ms": round(duration_ms, 2),
                    "query": sanitized_sql,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    def record_db_error(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._db_errors_count += 1

    # -------------------------------------------------------------------------
    # Simulation Recording
    # -------------------------------------------------------------------------
    def record_simulation_tick(
        self,
        tick_duration_ms: float,
        processed_agents: int = 0,
        state_updates: int = 1,
        events_generated: int = 0,
        db_writes: int = 0,
    ) -> None:
        if not self._enabled:
            return

        with self._lock:
            self._sim_total_ticks += 1
            self._sim_tick_durations.append(tick_duration_ms)
            self._sim_last_tick_timestamp = time.time()
            self._sim_last_processed_agents = processed_agents
            self._sim_last_state_updates = state_updates
            self._sim_total_events_generated += events_generated
            self._sim_total_db_writes += db_writes

    def record_simulation_error(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._sim_errors_count += 1

    # -------------------------------------------------------------------------
    # Council AI Recording
    # -------------------------------------------------------------------------
    def inc_ai_pending(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ai_pending_operations += 1

    def dec_ai_pending(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ai_pending_operations = max(0, self._ai_pending_operations - 1)

    def record_ai_advisor_run(self, advisor_id: str, duration_ms: float, success: bool = True) -> None:
        if not self._enabled:
            return

        with self._lock:
            self._ai_total_requests += 1
            if not success:
                self._ai_failed_requests += 1

            if advisor_id not in self._ai_advisor_durations:
                self._ai_advisor_durations[advisor_id] = deque(maxlen=50)
            self._ai_advisor_durations[advisor_id].append(duration_ms)

    def record_council_deliberation(
        self,
        duration_ms: float,
        success: bool = True,
        failed_advisors: int = 0
    ) -> None:
        if not self._enabled:
            return

        with self._lock:
            self._ai_deliberation_durations.append(duration_ms)
            if not success:
                self._ai_failed_requests += 1
            if failed_advisors > 0:
                self._ai_failed_requests += failed_advisors

    def record_ai_timeout(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ai_timeouts_count += 1

    def record_ai_retry(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ai_retries_count += 1

    # -------------------------------------------------------------------------
    # WebSocket Recording
    # -------------------------------------------------------------------------
    def record_ws_connect(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ws_active_connections += 1
            self._ws_total_connected += 1

    def record_ws_disconnect(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ws_active_connections = max(0, self._ws_active_connections - 1)
            self._ws_total_disconnected += 1

    def record_ws_message_sent(self, payload_bytes: int = 0) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ws_messages_sent += 1
            self._ws_bytes_sent_approx += payload_bytes

    def record_ws_message_received(self, payload_bytes: int = 0, processing_ms: float = 0.0) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ws_messages_received += 1
            self._ws_bytes_received_approx += payload_bytes
            if processing_ms > 0:
                self._ws_message_durations.append(processing_ms)

    def record_ws_error(self) -> None:
        if not self._enabled:
            return
        with self._lock:
            self._ws_errors_count += 1

    # -------------------------------------------------------------------------
    # Snapshot / Export for Dashboard
    # -------------------------------------------------------------------------
    def get_metrics_snapshot(self) -> Dict[str, Any]:
        """Produces comprehensive snapshot for development diagnostics API."""
        now = time.time()
        uptime_seconds = round(now - self._start_time, 1)

        with self._lock:
            # 1. API latency rolling stats
            api_durations_list = list(self._api_durations)
            api_avg_ms = (
                round(sum(api_durations_list) / len(api_durations_list), 2)
                if api_durations_list else 0.0
            )
            api_p50_ms = calculate_percentile(api_durations_list, 50)
            api_p95_ms = calculate_percentile(api_durations_list, 95)
            api_min_ms = round(min(api_durations_list), 2) if api_durations_list else 0.0
            api_max_ms = round(max(api_durations_list), 2) if api_durations_list else 0.0

            # Calculate throughput over the last 60 seconds
            recent_requests_60s = sum(1 for t in self._api_timestamps if now - t <= 60.0)
            throughput_req_per_sec = round(recent_requests_60s / 60.0, 2)

            # Per endpoint summaries
            endpoints_summary = []
            for ep_name, data in self._api_endpoints.items():
                avg = round(data["total_ms"] / max(data["count"], 1), 2)
                endpoints_summary.append({
                    "endpoint": ep_name,
                    "count": data["count"],
                    "errors": data["errors"],
                    "avg_duration_ms": avg,
                    "min_ms": round(data["min_ms"], 2),
                    "max_ms": round(data["max_ms"], 2),
                    "last_status": data["last_status"],
                })

            # 2. Database rolling stats
            db_durations_list = list(self._db_query_durations)
            db_avg_ms = (
                round(sum(db_durations_list) / len(db_durations_list), 2)
                if db_durations_list else 0.0
            )
            db_p95_ms = calculate_percentile(db_durations_list, 95)

            # 3. Simulation rolling stats
            sim_durations_list = list(self._sim_tick_durations)
            sim_avg_ms = (
                round(sum(sim_durations_list) / len(sim_durations_list), 2)
                if sim_durations_list else 0.0
            )
            sim_p95_ms = calculate_percentile(sim_durations_list, 95)
            sim_last_tick_ago_sec = (
                round(now - self._sim_last_tick_timestamp, 1)
                if self._sim_last_tick_timestamp else None
            )

            # 4. Council AI stats
            advisor_stats = {}
            for adv_id, dur_deque in self._ai_advisor_durations.items():
                d_list = list(dur_deque)
                advisor_stats[adv_id] = {
                    "count": len(d_list),
                    "avg_ms": round(sum(d_list) / max(len(d_list), 1), 2),
                    "p95_ms": calculate_percentile(d_list, 95),
                }

            delib_list = list(self._ai_deliberation_durations)
            delib_avg_ms = (
                round(sum(delib_list) / len(delib_list), 2)
                if delib_list else 0.0
            )
            delib_p95_ms = calculate_percentile(delib_list, 95)

            # 5. WebSocket stats
            ws_durations_list = list(self._ws_message_durations)
            ws_avg_proc_ms = (
                round(sum(ws_durations_list) / len(ws_durations_list), 2)
                if ws_durations_list else 0.0
            )

            return {
                "metadata": {
                    "status": "online",
                    "monitoring_enabled": self._enabled,
                    "uptime_seconds": uptime_seconds,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "environment": "development",
                },
                "api": {
                    "total_requests": self._api_total_requests,
                    "total_errors": self._api_total_errors,
                    "error_rate": round(
                        (self._api_total_errors / max(self._api_total_requests, 1)) * 100, 2
                    ),
                    "throughput_req_per_sec": throughput_req_per_sec,
                    "sample_count": len(api_durations_list),
                    "latency": {
                        "avg_ms": api_avg_ms,
                        "p50_ms": api_p50_ms,
                        "p95_ms": api_p95_ms,
                        "min_ms": api_min_ms,
                        "max_ms": api_max_ms,
                    },
                    "endpoints": sorted(endpoints_summary, key=lambda x: x["count"], reverse=True)[:15],
                    "recent_slow_requests": list(self._api_slow_requests),
                },
                "database": {
                    "total_queries": self._db_total_queries,
                    "slow_queries_count": self._db_slow_queries_count,
                    "errors_count": self._db_errors_count,
                    "slow_query_threshold_ms": self.slow_query_threshold_ms,
                    "latency": {
                        "avg_ms": db_avg_ms,
                        "p95_ms": db_p95_ms,
                    },
                    "recent_slow_queries": list(self._db_slow_queries),
                },
                "simulation": {
                    "total_ticks": self._sim_total_ticks,
                    "last_tick_seconds_ago": sim_last_tick_ago_sec,
                    "last_processed_agents": self._sim_last_processed_agents,
                    "last_state_updates": self._sim_last_state_updates,
                    "total_events_generated": self._sim_total_events_generated,
                    "total_db_writes": self._sim_total_db_writes,
                    "errors_count": self._sim_errors_count,
                    "tick_duration": {
                        "avg_ms": sim_avg_ms,
                        "p95_ms": sim_p95_ms,
                        "sample_count": len(sim_durations_list),
                    },
                },
                "council_ai": {
                    "total_requests": self._ai_total_requests,
                    "failed_requests": self._ai_failed_requests,
                    "timeouts_count": self._ai_timeouts_count,
                    "retries_count": self._ai_retries_count,
                    "pending_operations": self._ai_pending_operations,
                    "deliberation": {
                        "avg_ms": delib_avg_ms,
                        "p95_ms": delib_p95_ms,
                        "count": len(delib_list),
                    },
                    "advisors": advisor_stats,
                },
                "websocket": {
                    "active_connections": self._ws_active_connections,
                    "total_connected": self._ws_total_connected,
                    "total_disconnected": self._ws_total_disconnected,
                    "messages_sent": self._ws_messages_sent,
                    "messages_received": self._ws_messages_received,
                    "bytes_sent_approx": self._ws_bytes_sent_approx,
                    "bytes_received_approx": self._ws_bytes_received_approx,
                    "avg_processing_duration_ms": ws_avg_proc_ms,
                    "errors_count": self._ws_errors_count,
                    "limitations_note": "Server-side processing duration is measured. True client network round-trip latency requires client echo ping/pong.",
                },
            }

    def reset(self) -> None:
        with self._lock:
            self._api_durations.clear()
            self._api_timestamps.clear()
            self._api_total_requests = 0
            self._api_total_errors = 0
            self._api_endpoints.clear()
            self._api_slow_requests.clear()

            self._db_query_durations.clear()
            self._db_total_queries = 0
            self._db_slow_queries_count = 0
            self._db_errors_count = 0
            self._db_slow_queries.clear()

            self._sim_tick_durations.clear()
            self._sim_total_ticks = 0
            self._sim_errors_count = 0

            self._ai_advisor_durations.clear()
            self._ai_deliberation_durations.clear()
            self._ai_total_requests = 0
            self._ai_failed_requests = 0

            self._ws_messages_sent = 0
            self._ws_messages_received = 0
            self._ws_bytes_sent_approx = 0
            self._ws_bytes_received_approx = 0
            self._ws_message_durations.clear()
            self._ws_errors_count = 0


# Global singleton instance
perf_collector = PerformanceMetricsCollector()
