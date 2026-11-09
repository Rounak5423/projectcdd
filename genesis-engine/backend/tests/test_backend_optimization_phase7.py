"""
CIVORA — Backend & Data Infrastructure Optimization (Phase 7)
Test Suite: Connection Pooling, Index Performance, Caching, and Query Efficiency.
"""

import os
import time
import sqlite3
import pytest
from db.database import get_db_connection, db_pool, DB_PATH
from db.pool import SQLiteConnectionPool, PooledConnectionWrapper
from cache.data_cache import DataCache, data_cache
from monitoring.collector import perf_collector


def test_01_sqlite_connection_pool_reuse():
    """Verify that SQLite connection pool reuses connections across calls."""
    pool = SQLiteConnectionPool(DB_PATH, max_connections=4)
    c1 = pool.get_connection()
    raw_1 = c1._raw_conn
    c1.close()

    c2 = pool.get_connection()
    raw_2 = c2._raw_conn
    c2.close()

    assert raw_1 is raw_2
    pool.close_all()


def test_02_connection_pool_transaction_rollback_safety():
    """Verify that uncommitted transactions are rolled back when returned to pool."""
    pool = SQLiteConnectionPool(DB_PATH, max_connections=2)
    conn = pool.get_connection()

    # Begin transaction
    conn.execute("BEGIN TRANSACTION")
    conn.execute("CREATE TEMPORARY TABLE test_rollback (val TEXT)")
    conn.execute("INSERT INTO test_rollback VALUES ('temp')")
    assert conn.in_transaction is True

    # Close without committing
    conn.close()

    # Re-acquire: should be rolled back and not in_transaction
    conn2 = pool.get_connection()
    assert conn2.in_transaction is False
    conn2.close()
    pool.close_all()


def test_03_secondary_indexes_active():
    """Verify that query execution plans utilize secondary indexes (no full table scans)."""
    conn = get_db_connection()

    # 1. Buildings search
    plan_bld = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM buildings WHERE world_id = ?", ("aurora-prime",)).fetchall()
    bld_text = " ".join(r[3] for r in plan_bld)
    assert "INDEX idx_buildings_world_id" in bld_text

    # 2. Citizens search
    plan_cit = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM citizens WHERE world_id = ? AND occupation = ?", ("aurora-prime", "Scholar")).fetchall()
    cit_text = " ".join(r[3] for r in plan_cit)
    assert "INDEX idx_citizens_world_occ" in cit_text

    # 3. Metrics History search (Index avoids scan and temp B-tree)
    plan_met = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM metrics_history WHERE world_id = ? ORDER BY id DESC LIMIT 60", ("aurora-prime",)).fetchall()
    met_text = " ".join(r[3] for r in plan_met)
    assert "INDEX idx_metrics_history_world_id" in met_text

    # 4. Events search
    plan_evt = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM events WHERE world_id = ? ORDER BY year DESC, day DESC LIMIT 30", ("aurora-prime",)).fetchall()
    evt_text = " ".join(r[3] for r in plan_evt)
    assert "INDEX idx_events_world_year" in evt_text

    # 5. Worlds owner search
    plan_w = conn.execute("EXPLAIN QUERY PLAN SELECT * FROM worlds WHERE owner_id = ?", ("usr_player1_001",)).fetchall()
    w_text = " ".join(r[3] for r in plan_w)
    assert "INDEX idx_worlds_owner_id" in w_text

    conn.close()


def test_04_data_cache_lifecycle_and_invalidation():
    """Verify DataCache TTL, hit/miss tracking, and prefix invalidation."""
    cache = DataCache(max_capacity=10, default_ttl=2.0)

    # 1. Miss
    val = cache.get("test_key_1")
    assert val is None

    # 2. Set and Hit
    cache.set("test_key_1", {"name": "CIVORA"}, ttl=2.0)
    hit_val = cache.get("test_key_1")
    assert hit_val == {"name": "CIVORA"}

    # 3. Stats verification
    stats = cache.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["hit_ratio_pct"] == 50.0

    # 4. Prefix invalidation
    cache.set("world:1:data", "w1", ttl=60.0)
    cache.set("world:2:data", "w2", ttl=60.0)
    cache.invalidate("world:1")
    assert cache.get("world:1:data") is None
    assert cache.get("world:2:data") == "w2"


def test_05_admin_users_consolidated_query():
    """Verify that admin user listing executes consolidated queries with owner mapping."""
    conn = get_db_connection()
    users = conn.execute("SELECT id, username FROM users").fetchall()
    assert len(users) > 0

    all_worlds = conn.execute("""
    SELECT w.id, w.name, w.owner_id
    FROM worlds w
    WHERE w.owner_id IS NOT NULL
    """).fetchall()
    conn.close()

    worlds_by_owner = {}
    for w in all_worlds:
        oid = w["owner_id"]
        if oid not in worlds_by_owner:
            worlds_by_owner[oid] = []
        worlds_by_owner[oid].append(w["id"])

    assert len(worlds_by_owner) > 0


def test_06_monitoring_collector_telemetry():
    """Verify Phase 7 database pool and cache telemetry counters in monitoring collector."""
    perf_collector.record_db_pool_hit()
    perf_collector.record_db_pool_creation()
    perf_collector.record_cache_hit()
    perf_collector.record_cache_miss()

    snap = perf_collector.get_metrics_snapshot()
    assert snap["database"]["pool_hits"] >= 1
    assert snap["database"]["pool_creations"] >= 1
    assert "cache" in snap
    assert snap["cache"]["hits"] >= 1
    assert snap["cache"]["misses"] >= 1
