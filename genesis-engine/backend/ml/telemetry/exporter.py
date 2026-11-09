"""
GENESIS Engine Asynchronous Telemetry Exporter
Collects compact simulation state snapshots (citizens, trips, incidents, demographics, city_metrics)
and writes them asynchronously in batches to Parquet files under ml/data/generated/<run_id>/
"""

import os
import time
import json
import uuid
import queue
import threading
import logging
from typing import Dict, Any, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from ..config import GENERATED_DATA_DIR, TELEMETRY_ENABLED, TELEMETRY_INTERVAL_TICKS

logger = logging.getLogger("genesis.ml.telemetry")


class TelemetryBatchExporter:
    """
    Asynchronous, non-blocking telemetry recorder for the simulation engine.
    Batches state snapshots and writes them in a background daemon thread
    to ensure simulation tick performance degrades by < 10%.
    """
    def __init__(
        self,
        run_id: Optional[str] = None,
        output_dir: Optional[str] = None,
        enabled: Optional[bool] = None,
        interval_ticks: int = 1,
        batch_size: int = 100
    ):
        self.run_id = run_id or f"run_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        self.enabled = TELEMETRY_ENABLED if enabled is None else enabled
        self.interval_ticks = interval_ticks or TELEMETRY_INTERVAL_TICKS
        self.batch_size = batch_size
        
        base_dir = output_dir or str(GENERATED_DATA_DIR)
        self.run_dir = os.path.join(base_dir, self.run_id)
        if self.enabled:
            os.makedirs(self.run_dir, exist_ok=True)
            
        self._queue = queue.Queue(maxsize=10000)
        self._shutdown_event = threading.Event()
        
        # Buffer collections
        self._buffers: Dict[str, List[Dict[str, Any]]] = {
            "citizens": [],
            "trips": [],
            "incidents": [],
            "demographics": [],
            "city_metrics": []
        }
        self._lock = threading.Lock()
        
        # Start background writer thread if enabled
        if self.enabled:
            self._worker_thread = threading.Thread(target=self._worker_loop, daemon=True, name="TelemetryWorker")
            self._worker_thread.start()
        else:
            self._worker_thread = None

    def record_snapshot(
        self,
        world_id: str,
        tick: int,
        seed: int,
        policies: Dict[str, Any],
        citizens: Optional[List[Dict[str, Any]]] = None,
        trips: Optional[List[Dict[str, Any]]] = None,
        incidents: Optional[List[Dict[str, Any]]] = None,
        demographics: Optional[List[Dict[str, Any]]] = None,
        city_metrics: Optional[Dict[str, Any]] = None
    ):
        """
        Non-blocking ingestion method called by the simulation tick loop.
        Immediately enqueues payload and returns.
        """
        if not self.enabled or (tick % self.interval_ticks != 0):
            return

        payload = {
            "world_id": world_id,
            "tick": tick,
            "seed": seed,
            "policies_json": json.dumps(policies, sort_keys=True),
            "citizens": citizens or [],
            "trips": trips or [],
            "incidents": incidents or [],
            "demographics": demographics or [],
            "city_metrics": city_metrics
        }
        try:
            self._queue.put_nowait(payload)
        except queue.Full:
            logger.warning("Telemetry queue full; dropping frame to preserve simulation tick SLA.")

    def _worker_loop(self):
        """Background thread loop flushing batches to disk."""
        while not self._shutdown_event.is_set():
            try:
                payload = self._queue.get(timeout=0.1)
                self._process_payload(payload)
                self._queue.task_done()
            except queue.Empty:
                self._flush_buffers_if_needed(force=False)
                continue
            except Exception as e:
                logger.error(f"Error in telemetry worker loop: {e}")
                
        # Final flush on shutdown
        self._flush_buffers_if_needed(force=True)

    def _process_payload(self, p: Dict[str, Any]):
        w_id = p["world_id"]
        tick = p["tick"]
        seed = p["seed"]
        pol = p["policies_json"]

        with self._lock:
            # 1. Citizens
            for c in p["citizens"]:
                self._buffers["citizens"].append({
                    "id": str(c.get("id")),
                    "age": float(c.get("age", 25.0)),
                    "education": float(c.get("education", 1.0)),
                    "health": float(c.get("health", 0.85)),
                    "wealth": float(c.get("wealth", 100.0)),
                    "household_id": str(c.get("household_id", f"hh_{c.get('id')}")),
                    "home_id": str(c.get("home_id", "bld_res_01")),
                    "work_id": str(c.get("work_id", "bld_ind_01")),
                    "school_id": str(c.get("school_id", "bld_edu_01")),
                    "current_activity": str(c.get("current_activity", "home")),
                    "world_id": w_id,
                    "tick": tick,
                    "seed": seed,
                    "policies": pol
                })

            # 2. Trips
            for t in p["trips"]:
                self._buffers["trips"].append({
                    "trip_id": str(t.get("trip_id", f"trp_{uuid.uuid4().hex[:8]}")),
                    "citizen_id": str(t.get("citizen_id")),
                    "origin_id": str(t.get("origin_id", "node_01")),
                    "destination_id": str(t.get("destination_id", "node_02")),
                    "mode": str(t.get("mode", "car")),
                    "departure_time": float(t.get("departure_time", tick % 24)),
                    "travel_time": float(t.get("travel_time", 15.0)),
                    "cost": float(t.get("cost", 2.5)),
                    "world_id": w_id,
                    "tick": tick,
                    "seed": seed
                })

            # 3. Incidents
            for inc in p["incidents"]:
                self._buffers["incidents"].append({
                    "incident_id": str(inc.get("incident_id", f"inc_{uuid.uuid4().hex[:8]}")),
                    "type": str(inc.get("type", "traffic")),
                    "severity": int(inc.get("severity", 2)),
                    "location_x": float(inc.get("location_x", 0.0)),
                    "location_y": float(inc.get("location_y", 0.0)),
                    "response_time": float(inc.get("response_time", 5.2)),
                    "casualties": int(inc.get("casualties", 1)),
                    "world_id": w_id,
                    "tick": tick,
                    "seed": seed
                })

            # 4. Demographics
            for d in p["demographics"]:
                self._buffers["demographics"].append({
                    "event_id": str(d.get("event_id", f"dem_{uuid.uuid4().hex[:8]}")),
                    "event_type": str(d.get("event_type", "birth")),
                    "age": float(d.get("age", 0.0)),
                    "cause": str(d.get("cause", "natural")),
                    "world_id": w_id,
                    "tick": tick,
                    "seed": seed
                })

            # 5. City Metrics
            if p["city_metrics"]:
                cm = p["city_metrics"]
                self._buffers["city_metrics"].append({
                    "tick": tick,
                    "population": int(cm.get("population", 1000)),
                    "gdp": float(cm.get("gdp", 10000000.0)),
                    "gini": float(cm.get("gini", 0.35)),
                    "happiness": float(cm.get("happiness", 0.75)),
                    "pollution": float(cm.get("pollution", 0.15)),
                    "civic_stability": float(cm.get("civic_stability", 0.80)),
                    "average_health": float(cm.get("average_health", 0.85)),
                    "average_education": float(cm.get("average_education", 0.70)),
                    "traffic_congestion": float(cm.get("traffic_congestion", 0.20)),
                    "world_id": w_id,
                    "seed": seed,
                    "policies": pol
                })

        # Check batch threshold
        if any(len(buf) >= self.batch_size for buf in self._buffers.values()):
            self._flush_buffers_if_needed(force=True)

    def _flush_buffers_if_needed(self, force: bool = False):
        with self._lock:
            for table_name, records in self._buffers.items():
                if not records:
                    continue
                if force or len(records) >= self.batch_size:
                    self._append_to_parquet(table_name, records)
                    self._buffers[table_name] = []

    def _append_to_parquet(self, table_name: str, records: List[Dict[str, Any]]):
        if not records:
            return
        os.makedirs(self.run_dir, exist_ok=True)
        file_path = os.path.join(self.run_dir, f"{table_name}.parquet")
        df_new = pd.DataFrame(records)

        # Write or append using pyarrow
        table_new = pa.Table.from_pandas(df_new, preserve_index=False)
        if os.path.exists(file_path):
            existing_table = pq.read_table(file_path)
            combined = pa.concat_tables([existing_table, table_new])
            pq.write_table(combined, file_path, compression="snappy")
        else:
            pq.write_table(table_new, file_path, compression="snappy")

    def flush(self):
        """Blocks until all queued items are processed and written to disk."""
        if not self.enabled:
            return
        # Drain queue
        while not self._queue.empty():
            try:
                payload = self._queue.get(timeout=0.05)
                self._process_payload(payload)
                self._queue.task_done()
            except queue.Empty:
                break
        self._flush_buffers_if_needed(force=True)

    def shutdown(self):
        """Gracefully shuts down the background worker."""
        if not self.enabled:
            return
        self.flush()
        self._shutdown_event.set()
        if self._worker_thread and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)

    close = shutdown


# Global active exporter singleton
_GLOBAL_EXPORTER: Optional[TelemetryBatchExporter] = None


def get_telemetry_exporter() -> Optional[TelemetryBatchExporter]:
    global _GLOBAL_EXPORTER
    if _GLOBAL_EXPORTER is None and TELEMETRY_ENABLED:
        _GLOBAL_EXPORTER = TelemetryBatchExporter(enabled=True)
    return _GLOBAL_EXPORTER


def set_telemetry_exporter(exporter: Optional[TelemetryBatchExporter]):
    global _GLOBAL_EXPORTER
    _GLOBAL_EXPORTER = exporter
