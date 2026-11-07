"""
CIVORA — Council of Advisors Repository
Database access operations using SQLite with foreign keys and WAL mode.
Keeps SQL queries separate from business services and API endpoints.
"""

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple

from db.database import get_db_connection
from app.features.council.constants import (
    SYSTEM_ADVISORS,
    SESSION_STATUS_SCHEDULED,
    SESSION_STATUS_ACTIVE,
    SESSION_STATUS_COMPLETED,
    SESSION_STATUS_CANCELLED,
    REC_STATUS_PROPOSED,
    EVENT_SESSION_STARTED,
    EVENT_SESSION_COMPLETED,
    EVENT_DECISION_RECORDED,
    EVENT_RECOMMENDATION_DISCUSSED,
    EVENT_RECOMMENDATION_ACCEPTED,
    EVENT_RECOMMENDATION_REJECTED,
)


def init_council_tables(conn: Optional[sqlite3.Connection] = None) -> None:
    """Creates Council database tables and indexes safely and idempotently."""
    close_after = False
    if conn is None:
        conn = get_db_connection()
        close_after = True

    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS council_advisors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            domain TEXT NOT NULL,
            role TEXT NOT NULL,
            description TEXT NOT NULL,
            responsibilities TEXT NOT NULL DEFAULT '[]',
            portrait_url TEXT,
            portrait_symbol TEXT,
            accent_color TEXT,
            motto TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS council_sessions (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            session_number INTEGER NOT NULL DEFAULT 1,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled',
            sim_year INTEGER NOT NULL DEFAULT 2026,
            sim_day INTEGER NOT NULL DEFAULT 1,
            convened_by TEXT NOT NULL DEFAULT 'The Sovereign High Directorate',
            agenda_topics TEXT NOT NULL DEFAULT '[]',
            summary TEXT,
            opening_address TEXT,
            started_at TEXT,
            ended_at TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS council_session_advisors (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            advisor_id TEXT NOT NULL,
            participation_status TEXT NOT NULL DEFAULT 'present',
            briefing_snapshot TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES council_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (advisor_id) REFERENCES council_advisors(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS council_recommendations (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            session_id TEXT,
            advisor_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            justification TEXT NOT NULL DEFAULT '',
            expected_benefits TEXT NOT NULL DEFAULT '[]',
            potential_risks TEXT NOT NULL DEFAULT '[]',
            estimated_cost_crc REAL NOT NULL DEFAULT 0.0,
            political_capital_req REAL NOT NULL DEFAULT 0.0,
            category TEXT NOT NULL DEFAULT 'Policy',
            priority TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'proposed',
            proposed_at TEXT NOT NULL,
            reviewed_at TEXT,
            reviewed_by TEXT,
            decision_notes TEXT,
            implementation_reference TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES council_sessions(id) ON DELETE SET NULL,
            FOREIGN KEY (advisor_id) REFERENCES council_advisors(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS council_decisions (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            recommendation_id TEXT,
            advisor_id TEXT,
            decision_type TEXT NOT NULL DEFAULT 'ratification',
            decision_text TEXT NOT NULL,
            outcome TEXT NOT NULL,
            decided_by TEXT,
            decided_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            FOREIGN KEY (session_id) REFERENCES council_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (recommendation_id) REFERENCES council_recommendations(id) ON DELETE SET NULL,
            FOREIGN KEY (advisor_id) REFERENCES council_advisors(id) ON DELETE SET NULL,
            FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS council_session_events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            actor_id TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES council_sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS council_execution_records (
            id TEXT PRIMARY KEY,
            recommendation_id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            session_id TEXT,
            executed_by TEXT,
            execution_type TEXT NOT NULL,
            action_id TEXT,
            status TEXT NOT NULL DEFAULT 'awaiting_execution',
            sim_tick_at_execution INTEGER NOT NULL DEFAULT 1,
            sim_year INTEGER NOT NULL DEFAULT 2026,
            sim_day INTEGER NOT NULL DEFAULT 1,
            cost_credits REAL NOT NULL DEFAULT 0.0,
            cost_materials REAL NOT NULL DEFAULT 0.0,
            cost_energy REAL NOT NULL DEFAULT 0.0,
            baseline_metrics_json TEXT NOT NULL DEFAULT '{}',
            outcome_metrics_json TEXT DEFAULT '{}',
            outcome_evaluation TEXT,
            error_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (recommendation_id) REFERENCES council_recommendations(id) ON DELETE CASCADE,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES council_sessions(id) ON DELETE SET NULL,
            FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_council_sessions_world ON council_sessions(world_id);
        CREATE INDEX IF NOT EXISTS idx_council_sessions_status ON council_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_council_session_advisors_session ON council_session_advisors(session_id);
        CREATE INDEX IF NOT EXISTS idx_council_session_advisors_advisor ON council_session_advisors(advisor_id);
        CREATE INDEX IF NOT EXISTS idx_council_recommendations_world ON council_recommendations(world_id);
        CREATE INDEX IF NOT EXISTS idx_council_recommendations_session ON council_recommendations(session_id);
        CREATE INDEX IF NOT EXISTS idx_council_recommendations_advisor ON council_recommendations(advisor_id);
        CREATE INDEX IF NOT EXISTS idx_council_recommendations_status ON council_recommendations(status);
        CREATE INDEX IF NOT EXISTS idx_council_recommendations_created ON council_recommendations(created_at);
        CREATE INDEX IF NOT EXISTS idx_council_decisions_session ON council_decisions(session_id);
        CREATE INDEX IF NOT EXISTS idx_council_decisions_rec ON council_decisions(recommendation_id);
        CREATE INDEX IF NOT EXISTS idx_council_events_session ON council_session_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_council_exec_rec ON council_execution_records(recommendation_id);
        CREATE INDEX IF NOT EXISTS idx_council_exec_world ON council_execution_records(world_id);
        """)

    if close_after:
        conn.close()


class CouncilRepository:
    """Data access repository for Council entities."""

    def __init__(self, conn_factory=get_db_connection):
        self.get_conn = conn_factory

    # -----------------------------------------------------------------------
    # Advisors
    # -----------------------------------------------------------------------

    def seed_advisors_idempotent(self) -> int:
        """
        Seeds the 6 permanent advisor identities idempotently.
        Returns the number of advisors inserted or confirmed.
        """
        conn = self.get_conn()
        now = datetime.now(timezone.utc).isoformat()
        seeded_count = 0

        with conn:
            for adv in SYSTEM_ADVISORS:
                existing = conn.execute(
                    "SELECT id FROM council_advisors WHERE id = ?", (adv["id"],)
                ).fetchone()

                if not existing:
                    conn.execute("""
                    INSERT INTO council_advisors (
                        id, name, title, domain, role, description, responsibilities,
                        portrait_url, portrait_symbol, accent_color, motto,
                        display_order, is_active, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        adv["id"],
                        adv["name"],
                        adv["title"],
                        adv["domain"],
                        adv["role"],
                        adv["description"],
                        json.dumps(adv["responsibilities"]),
                        adv.get("portrait_url"),
                        adv.get("portrait_symbol", "🏛️"),
                        adv.get("accent_color", "#C5A66A"),
                        adv.get("motto", ""),
                        adv["display_order"],
                        1 if adv["is_active"] else 0,
                        now,
                        now
                    ))
                    seeded_count += 1
                else:
                    seeded_count += 1

        conn.close()
        return seeded_count

    def get_all_advisors(self) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        rows = conn.execute(
            "SELECT * FROM council_advisors ORDER BY display_order ASC"
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_advisor_by_id(self, advisor_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute(
            "SELECT * FROM council_advisors WHERE id = ?", (advisor_id,)
        ).fetchone()
        conn.close()
        return dict(row) if row else None

    # -----------------------------------------------------------------------
    # Sessions
    # -----------------------------------------------------------------------

    def create_session(
        self,
        world_id: str,
        title: str,
        created_by: Optional[str] = None,
        sim_year: int = 2026,
        sim_day: int = 1,
        agenda_topics: Optional[List[str]] = None,
        invited_advisor_ids: Optional[List[str]] = None,
        opening_address: Optional[str] = None
    ) -> Dict[str, Any]:
        conn = self.get_conn()
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        topics = agenda_topics or []
        invited = invited_advisor_ids or []

        with conn:
            # Determine session number for this world
            count_row = conn.execute(
                "SELECT COUNT(*) as c FROM council_sessions WHERE world_id = ?",
                (world_id,)
            ).fetchone()
            session_number = (count_row["c"] if count_row else 0) + 1

            conn.execute("""
            INSERT INTO council_sessions (
                id, world_id, session_number, title, status, sim_year, sim_day,
                convened_by, agenda_topics, summary, opening_address,
                started_at, ended_at, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
            """, (
                session_id,
                world_id,
                session_number,
                title,
                SESSION_STATUS_ACTIVE,
                sim_year,
                sim_day,
                "The Sovereign High Directorate",
                json.dumps(topics),
                "",
                opening_address or "The Imperial Council is officially convened to deliberate upon high state matters.",
                now,
                created_by,
                now,
                now
            ))

            # Add participating advisors
            for adv_id in invited:
                conn.execute("""
                INSERT INTO council_session_advisors (
                    id, session_id, advisor_id, participation_status, briefing_snapshot, created_at
                ) VALUES (?, ?, ?, 'present', '{}', ?)
                """, (f"sa_{uuid.uuid4().hex[:8]}", session_id, adv_id, now))

            # Record session started event
            conn.execute("""
            INSERT INTO council_session_events (
                id, session_id, event_type, description, actor_id, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, '{}', ?)
            """, (
                f"evt_{uuid.uuid4().hex[:8]}",
                session_id,
                EVENT_SESSION_STARTED,
                f"Council session '{title}' formally convened in chamber.",
                created_by,
                now
            ))

        conn.close()
        return self.get_session(session_id)

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        session_row = conn.execute(
            "SELECT * FROM council_sessions WHERE id = ?", (session_id,)
        ).fetchone()

        if not session_row:
            conn.close()
            return None

        session_data = dict(session_row)

        # Get participating advisor IDs
        advisor_rows = conn.execute(
            "SELECT advisor_id FROM council_session_advisors WHERE session_id = ?",
            (session_id,)
        ).fetchall()
        session_data["attendees"] = [r["advisor_id"] for r in advisor_rows]
        session_data["briefingsDelivered"] = len(session_data["attendees"])

        # Get recommendations associated with this session
        rec_rows = conn.execute(
            "SELECT r.*, a.name as advisor_name, a.title as advisor_title, a.domain "
            "FROM council_recommendations r "
            "JOIN council_advisors a ON r.advisor_id = a.id "
            "WHERE r.session_id = ? ORDER BY r.created_at ASC",
            (session_id,)
        ).fetchall()
        session_data["recommendations"] = [dict(r) for r in rec_rows]

        # Get decisions recorded during this session
        dec_rows = conn.execute(
            "SELECT d.*, r.title as rec_title, a.title as adv_title "
            "FROM council_decisions d "
            "LEFT JOIN council_recommendations r ON d.recommendation_id = r.id "
            "LEFT JOIN council_advisors a ON d.advisor_id = a.id "
            "WHERE d.session_id = ? ORDER BY d.decided_at ASC",
            (session_id,)
        ).fetchall()
        session_data["decisions"] = [dict(d) for d in dec_rows]

        # Get events
        evt_rows = conn.execute(
            "SELECT * FROM council_session_events WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        ).fetchall()
        session_data["events"] = [dict(e) for e in evt_rows]

        conn.close()
        return session_data

    def list_sessions(
        self,
        world_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        query = "SELECT * FROM council_sessions WHERE 1=1"
        params: List[Any] = []

        if world_id:
            query += " AND world_id = ?"
            params.append(world_id)

        if status and status != "all":
            # Support both frontend state ("In Progress") and backend status ("active")
            normalized_status = status.lower()
            if normalized_status in ["in progress", "active"]:
                query += " AND status = 'active'"
            elif normalized_status in ["concluded", "completed"]:
                query += " AND status = 'completed'"
            elif normalized_status in ["archived", "cancelled"]:
                query += " AND status = 'cancelled'"
            elif normalized_status in ["scheduled"]:
                query += " AND status = 'scheduled'"
            else:
                query += " AND status = ?"
                params.append(status)

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        conn.close()

        # Hydrate sessions
        return [self.get_session(r["id"]) for r in rows if r]

    def complete_session(self, session_id: str, summary: Optional[str] = None) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        now = datetime.now(timezone.utc).isoformat()

        with conn:
            session = conn.execute(
                "SELECT id, status FROM council_sessions WHERE id = ?", (session_id,)
            ).fetchone()

            if not session:
                conn.close()
                return None

            conn.execute("""
            UPDATE council_sessions
            SET status = 'completed', ended_at = ?, summary = COALESCE(?, summary), updated_at = ?
            WHERE id = ?
            """, (now, summary, now, session_id))

            # Record event
            conn.execute("""
            INSERT INTO council_session_events (
                id, session_id, event_type, description, actor_id, metadata_json, created_at
            ) VALUES (?, ?, ?, 'Council session successfully concluded and sealed in archives.', NULL, '{}', ?)
            """, (f"evt_{uuid.uuid4().hex[:8]}", session_id, EVENT_SESSION_COMPLETED, now))

        conn.close()
        return self.get_session(session_id)

    # -----------------------------------------------------------------------
    # Recommendations
    # -----------------------------------------------------------------------

    def create_recommendation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        conn = self.get_conn()
        rec_id = f"rec_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        with conn:
            conn.execute("""
            INSERT INTO council_recommendations (
                id, world_id, session_id, advisor_id, title, description,
                justification, expected_benefits, potential_risks,
                estimated_cost_crc, political_capital_req, category,
                priority, status, proposed_at, reviewed_at, reviewed_by,
                decision_notes, implementation_reference, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)
            """, (
                rec_id,
                data["world_id"],
                data.get("session_id"),
                data["advisor_id"],
                data["title"],
                data["description"],
                data.get("justification", ""),
                json.dumps(data.get("expected_benefits", [])),
                json.dumps(data.get("potential_risks", [])),
                data.get("estimated_cost_crc", 0.0),
                data.get("political_capital_req", 0.0),
                data.get("category", "Policy"),
                data.get("priority", "medium").lower(),
                data.get("status", REC_STATUS_PROPOSED).lower(),
                now,
                now,
                now
            ))

            # If tied to a session, record discussion event
            if data.get("session_id"):
                conn.execute("""
                INSERT INTO council_session_events (
                    id, session_id, event_type, description, actor_id, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, NULL, ?, ?)
                """, (
                    f"evt_{uuid.uuid4().hex[:8]}",
                    data["session_id"],
                    EVENT_RECOMMENDATION_DISCUSSED,
                    f"Advisor tabled directive proposal: '{data['title']}'",
                    json.dumps({"recommendation_id": rec_id}),
                    now
                ))

        conn.close()
        return self.get_recommendation(rec_id)

    def get_recommendation(self, rec_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute("""
        SELECT r.*, a.name as advisor_name, a.title as advisor_title, a.domain
        FROM council_recommendations r
        JOIN council_advisors a ON r.advisor_id = a.id
        WHERE r.id = ?
        """, (rec_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def list_recommendations(
        self,
        world_id: Optional[str] = None,
        session_id: Optional[str] = None,
        advisor_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        query = """
        SELECT r.*, a.name as advisor_name, a.title as advisor_title, a.domain
        FROM council_recommendations r
        JOIN council_advisors a ON r.advisor_id = a.id
        WHERE 1=1
        """
        params: List[Any] = []

        if world_id:
            query += " AND r.world_id = ?"
            params.append(world_id)
        if session_id:
            query += " AND r.session_id = ?"
            params.append(session_id)
        if advisor_id:
            query += " AND r.advisor_id = ?"
            params.append(advisor_id)
        if status and status != "all":
            # Map frontend casing like "Proposed" or "Accepted" to lowercase
            query += " AND LOWER(r.status) = LOWER(?)"
            params.append(status)
        if priority and priority != "all":
            query += " AND LOWER(r.priority) = LOWER(?)"
            params.append(priority)

        query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, params).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def update_recommendation_status(
        self,
        rec_id: str,
        new_status: str,
        reviewed_by: Optional[str] = None,
        decision_notes: Optional[str] = None,
        implementation_reference: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        now = datetime.now(timezone.utc).isoformat()

        with conn:
            rec = conn.execute(
                "SELECT * FROM council_recommendations WHERE id = ?", (rec_id,)
            ).fetchone()

            if not rec:
                conn.close()
                return None

            notes = decision_notes if decision_notes is not None else rec["decision_notes"]
            impl_ref = implementation_reference if implementation_reference is not None else rec["implementation_reference"]

            conn.execute("""
            UPDATE council_recommendations
            SET status = ?, reviewed_at = ?, reviewed_by = ?, decision_notes = ?, implementation_reference = ?, updated_at = ?
            WHERE id = ?
            """, (new_status.lower(), now, reviewed_by, notes, impl_ref, now, rec_id))

            # Record event if tied to a session
            session_id = rec["session_id"]
            if session_id:
                event_type = (
                    EVENT_RECOMMENDATION_ACCEPTED if new_status.lower() == "accepted"
                    else EVENT_RECOMMENDATION_REJECTED if new_status.lower() == "rejected"
                    else "recommendation_reviewed"
                )
                conn.execute("""
                INSERT INTO council_session_events (
                    id, session_id, event_type, description, actor_id, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"evt_{uuid.uuid4().hex[:8]}",
                    session_id,
                    event_type,
                    f"Recommendation '{rec['title']}' status updated to {new_status}.",
                    reviewed_by,
                    json.dumps({"recommendation_id": rec_id, "status": new_status}),
                    now
                ))

        conn.close()
        return self.get_recommendation(rec_id)

    # -----------------------------------------------------------------------
    # Decisions
    # -----------------------------------------------------------------------

    def create_decision(
        self,
        session_id: str,
        recommendation_id: Optional[str],
        advisor_id: Optional[str],
        decision_type: str,
        decision_text: str,
        outcome: str,
        decided_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        conn = self.get_conn()
        decision_id = f"dec_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        meta = metadata or {}

        with conn:
            conn.execute("""
            INSERT INTO council_decisions (
                id, session_id, recommendation_id, advisor_id, decision_type,
                decision_text, outcome, decided_by, decided_at, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                decision_id,
                session_id,
                recommendation_id,
                advisor_id,
                decision_type,
                decision_text,
                outcome,
                decided_by,
                now,
                json.dumps(meta)
            ))

            # Record event
            conn.execute("""
            INSERT INTO council_session_events (
                id, session_id, event_type, description, actor_id, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                f"evt_{uuid.uuid4().hex[:8]}",
                session_id,
                EVENT_DECISION_RECORDED,
                f"Decree registered: {outcome} — '{decision_text[:60]}...'",
                decided_by,
                json.dumps({"decision_id": decision_id, "outcome": outcome}),
                now
            ))

        conn.close()
        return self.get_decision(decision_id)

    def get_decision(self, decision_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute("""
        SELECT d.*, r.title as rec_title, a.title as adv_title
        FROM council_decisions d
        LEFT JOIN council_recommendations r ON d.recommendation_id = r.id
        LEFT JOIN council_advisors a ON d.advisor_id = a.id
        WHERE d.id = ?
        """, (decision_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def list_session_decisions(self, session_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        rows = conn.execute("""
        SELECT d.*, r.title as rec_title, a.title as adv_title
        FROM council_decisions d
        LEFT JOIN council_recommendations r ON d.recommendation_id = r.id
        LEFT JOIN council_advisors a ON d.advisor_id = a.id
        WHERE d.session_id = ? ORDER BY d.decided_at ASC
        """, (session_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def list_session_events(self, session_id: str) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        rows = conn.execute(
            "SELECT * FROM council_session_events WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def record_session_event(
        self,
        session_id: str,
        event_type: str,
        description: str,
        actor_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        conn = self.get_conn()
        event_id = f"evt_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("""
            INSERT INTO council_session_events (
                id, session_id, event_type, description, actor_id, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                session_id,
                event_type,
                description,
                actor_id,
                json.dumps(metadata or {}),
                now
            ))
        conn.close()
        return {
            "id": event_id,
            "session_id": session_id,
            "event_type": event_type,
            "description": description,
            "actor_id": actor_id,
            "metadata_json": json.dumps(metadata or {}),
            "created_at": now
        }

    def get_active_session_for_world(self, world_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute(
            "SELECT * FROM council_sessions WHERE world_id = ? AND status IN ('active', 'scheduled') ORDER BY created_at DESC LIMIT 1",
            (world_id,)
        ).fetchone()
        conn.close()
        if not row:
            return None
        return self.get_session(row["id"])

    def create_execution_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        conn = self.get_conn()
        exec_id = data.get("id") or f"exec_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("""
            INSERT INTO council_execution_records (
                id, recommendation_id, world_id, session_id, executed_by,
                execution_type, action_id, status, sim_tick_at_execution,
                sim_year, sim_day, cost_credits, cost_materials, cost_energy,
                baseline_metrics_json, outcome_metrics_json, outcome_evaluation,
                error_message, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                exec_id,
                data["recommendation_id"],
                data["world_id"],
                data.get("session_id"),
                data.get("executed_by"),
                data.get("execution_type", "policy"),
                data.get("action_id"),
                data.get("status", "awaiting_execution"),
                data.get("sim_tick_at_execution", 1),
                data.get("sim_year", 2026),
                data.get("sim_day", 1),
                data.get("cost_credits", 0.0),
                data.get("cost_materials", 0.0),
                data.get("cost_energy", 0.0),
                json.dumps(data.get("baseline_metrics", {})),
                json.dumps(data.get("outcome_metrics", {})),
                data.get("outcome_evaluation"),
                data.get("error_message"),
                now,
                now
            ))
        conn.close()
        return self.get_execution_record(exec_id) # type: ignore

    def get_execution_record(self, exec_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute("SELECT * FROM council_execution_records WHERE id = ?", (exec_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def get_execution_record_by_recommendation(self, rec_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        row = conn.execute(
            "SELECT * FROM council_execution_records WHERE recommendation_id = ? ORDER BY created_at DESC LIMIT 1",
            (rec_id,)
        ).fetchone()
        conn.close()
        return dict(row) if row else None

    def update_execution_record(self, exec_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = self.get_conn()
        now = datetime.now(timezone.utc).isoformat()
        fields = []
        vals = []
        for k, v in updates.items():
            if k in ["baseline_metrics", "outcome_metrics"]:
                fields.append(f"{k}_json = ?")
                vals.append(json.dumps(v))
            else:
                fields.append(f"{k} = ?")
                vals.append(v)
        fields.append("updated_at = ?")
        vals.append(now)
        vals.append(exec_id)

        with conn:
            conn.execute(f"UPDATE council_execution_records SET {', '.join(fields)} WHERE id = ?", tuple(vals))
        conn.close()
        return self.get_execution_record(exec_id)

    def list_execution_records(self, world_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        conn = self.get_conn()
        rows = conn.execute(
            "SELECT * FROM council_execution_records WHERE world_id = ? ORDER BY created_at DESC LIMIT ?",
            (world_id, limit)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]

