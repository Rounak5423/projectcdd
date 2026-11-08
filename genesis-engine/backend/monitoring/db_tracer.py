"""
CIVORA — Database Query Execution Tracer
Transparently measures SQLite query execution durations without altering queries or schemas.
"""

import time
import sqlite3
from typing import Any, Tuple, Optional
from monitoring.collector import perf_collector


class TracedCursor(sqlite3.Cursor):
    """Cursor that wraps execution methods with high-resolution performance timers."""

    def execute(self, sql: str, parameters: Any = ()):
        t0 = time.perf_counter()
        try:
            return super().execute(sql, parameters)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql)

    def executemany(self, sql: str, seq_of_parameters: Any):
        t0 = time.perf_counter()
        try:
            return super().executemany(sql, seq_of_parameters)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql)

    def executescript(self, sql_script: str):
        t0 = time.perf_counter()
        try:
            return super().executescript(sql_script)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql_script[:120])


class TracedConnection(sqlite3.Connection):
    """Connection class returning traced cursors and measuring direct connection executions."""

    def cursor(self, factory=TracedCursor):
        return super().cursor(factory=factory)

    def execute(self, sql: str, *args, **kwargs):
        t0 = time.perf_counter()
        try:
            return super().execute(sql, *args, **kwargs)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql)

    def executemany(self, sql: str, *args, **kwargs):
        t0 = time.perf_counter()
        try:
            return super().executemany(sql, *args, **kwargs)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql)

    def executescript(self, sql_script: str):
        t0 = time.perf_counter()
        try:
            return super().executescript(sql_script)
        except Exception as e:
            perf_collector.record_db_error()
            raise e
        finally:
            dt = (time.perf_counter() - t0) * 1000.0
            perf_collector.record_db_query(dt, sql_script[:120])
