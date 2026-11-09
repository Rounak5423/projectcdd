"""
CIVORA — High-Performance SQLite Connection Pool (Phase 7)
Reuses open, traced connections safely, eliminates PRAGMA renegotiation on every query,
enforces busy timeout protection against lock contention, and prevents connection leaks.
"""

import sqlite3
import queue
import threading
from typing import Optional, Any
from monitoring.db_tracer import TracedConnection
from monitoring.collector import perf_collector


class PooledConnectionWrapper:
    """
    Transparent proxy for an underlying TracedConnection that returns the connection
    to the pool upon close() instead of destroying the file descriptor.
    """

    def __init__(self, raw_conn: sqlite3.Connection, pool: 'SQLiteConnectionPool'):
        self._raw_conn: sqlite3.Connection = raw_conn
        self._pool: 'SQLiteConnectionPool' = pool
        self._is_closed: bool = False

    def close(self):
        if not self._is_closed:
            self._is_closed = True
            self._pool.return_connection(self._raw_conn)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._raw_conn, name)

    def __setattr__(self, name: str, value: Any):
        if name in ("_raw_conn", "_pool", "_is_closed"):
            super().__setattr__(name, value)
        else:
            setattr(self._raw_conn, name, value)

    def __enter__(self):
        return self._raw_conn.__enter__()

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._raw_conn.__exit__(exc_type, exc_val, exc_tb)


class SQLiteConnectionPool:
    """
    Thread-safe connection pool for SQLite.
    Maintains a pool of pre-configured, traced connections.
    """

    def __init__(self, db_path: str, max_connections: int = 16, timeout: float = 10.0):
        self.db_path = db_path
        self.max_connections = max_connections
        self.timeout = timeout
        self._pool: queue.Queue = queue.Queue(maxsize=max_connections)
        self._created_count: int = 0
        self._lock = threading.Lock()

    def _create_raw_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            timeout=self.timeout,
            factory=TracedConnection,
            check_same_thread=False
        )
        conn.row_factory = sqlite3.Row
        # Configure connection-level pragmas once
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA cache_size = -64000")
        conn.execute("PRAGMA temp_store = MEMORY")
        conn.execute("PRAGMA mmap_size = 268435456")
        conn.execute("PRAGMA busy_timeout = 10000")
        return conn

    def get_connection(self) -> PooledConnectionWrapper:
        """Acquires a pooled connection or instantiates a new configured connection."""
        raw_conn: Optional[sqlite3.Connection] = None
        try:
            raw_conn = self._pool.get_nowait()
            perf_collector.record_db_pool_hit()
        except queue.Empty:
            with self._lock:
                self._created_count += 1
            raw_conn = self._create_raw_connection()
            perf_collector.record_db_pool_creation()

        return PooledConnectionWrapper(raw_conn, self)

    def return_connection(self, raw_conn: sqlite3.Connection):
        """Returns a connection to the pool after rolling back any open transaction."""
        try:
            if raw_conn.in_transaction:
                raw_conn.rollback()
            self._pool.put_nowait(raw_conn)
        except queue.Full:
            # Pool is saturated; close excess connection
            try:
                raw_conn.close()
            except Exception:
                pass
        except Exception:
            try:
                raw_conn.close()
            except Exception:
                pass

    def reset_path(self, new_path: str):
        """Closes all current pooled connections and updates database target path."""
        with self._lock:
            self.close_all()
            self.db_path = new_path
            self._created_count = 0

    def close_all(self):
        """Drains and closes all idle pooled connections."""
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except Exception:
                break
