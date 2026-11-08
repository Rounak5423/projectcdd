"""SQLite persistence: worlds (main + branches), snapshots. State is stored as JSON text."""
import json
import os
import sqlite3
import threading
import time
from ..models.world import World

SCHEMA = """
CREATE TABLE IF NOT EXISTS worlds (id TEXT PRIMARY KEY, name TEXT, kind TEXT, parent_id TEXT, day INTEGER,
    summary TEXT, state TEXT, updated REAL);
CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, world_id TEXT, name TEXT, day INTEGER, summary TEXT,
    state TEXT, created REAL);
"""


class Store:
    def __init__(self, path):
        self.path = path
        self._lock = threading.Lock()
        if path != ":memory:":
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with self._conn() as c:
            c.executescript(SCHEMA)

    def _conn(self):
        c = sqlite3.connect(self.path, timeout=15)
        c.row_factory = sqlite3.Row
        return c

    @staticmethod
    def _summary(w):
        m = w.s.get("metrics") or {}
        return json.dumps({k: m.get(k) for k in ("population", "gdp", "avg_happiness", "env_health", "treasury")})

    def save_world(self, w):
        meta = w.s["meta"]
        with self._lock, self._conn() as c:        # one transaction: all-or-nothing
            c.execute("INSERT OR REPLACE INTO worlds VALUES (?,?,?,?,?,?,?,?)",
                      (meta["world_id"], meta["name"], meta["kind"], meta.get("parent_id"), meta["day"],
                       self._summary(w), w.to_json(), time.time()))

    def load_world(self, wid):
        with self._conn() as c:
            row = c.execute("SELECT state FROM worlds WHERE id=?", (wid,)).fetchone()
        return World.from_json(row["state"]) if row else None

    def list_worlds(self, kind=None):
        q = "SELECT id,name,kind,parent_id,day,summary,updated FROM worlds" + (" WHERE kind=?" if kind else "") + " ORDER BY updated"
        with self._conn() as c:
            rows = c.execute(q, (kind,) if kind else ()).fetchall()
        return [dict(r) | {"summary": json.loads(r["summary"])} for r in rows]

    def delete_world(self, wid):
        with self._lock, self._conn() as c:
            return c.execute("DELETE FROM worlds WHERE id=? AND kind!='main'", (wid,)).rowcount > 0

    def save_snapshot(self, sid, world_id, snap, w):
        with self._lock, self._conn() as c:
            c.execute("INSERT OR REPLACE INTO snapshots VALUES (?,?,?,?,?,?,?)",
                      (sid, world_id, snap["name"], snap["day"], self._summary(w), snap["state"], time.time()))

    def list_snapshots(self):
        with self._conn() as c:
            rows = c.execute("SELECT id,world_id,name,day,summary,created FROM snapshots ORDER BY created").fetchall()
        return [dict(r) | {"summary": json.loads(r["summary"])} for r in rows]

    def get_snapshot_state(self, sid):
        with self._conn() as c:
            row = c.execute("SELECT state FROM snapshots WHERE id=?", (sid,)).fetchone()
        return row["state"] if row else None
