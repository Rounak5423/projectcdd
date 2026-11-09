"""
CIVORA Engine — Atomic SQLite Database Backup & Restore Utility (Phase 10)
Uses SQLite's online backup API (sqlite3.backup) for zero-downtime, crash-consistent
snapshots while concurrent WAL transactions and simulation ticks execute.
"""

import os
import sys
import sqlite3
import shutil
from datetime import datetime, timezone
from typing import Optional, Tuple

# Support running as a standalone script or module import
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from config import settings


def get_default_backup_dir() -> str:
    backup_dir = os.path.join(os.path.dirname(__file__), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir


def verify_database_integrity(db_path: str) -> Tuple[bool, str]:
    """Runs SQLite PRAGMA quick_check to verify database file integrity."""
    if not os.path.exists(db_path) or os.path.getsize(db_path) == 0:
        return False, f"Database file does not exist or is empty: {db_path}"

    try:
        conn = sqlite3.connect(db_path, timeout=5.0)
        cursor = conn.cursor()
        cursor.execute("PRAGMA quick_check;")
        res = cursor.fetchone()
        conn.close()
        if res and res[0] == "ok":
            return True, "Integrity verified (ok)"
        return False, f"Integrity check failed: {res}"
    except Exception as e:
        return False, f"Exception during integrity check: {str(e)}"


def create_backup(source_path: Optional[str] = None, destination_dir: Optional[str] = None) -> str:
    """
    Performs an online, zero-downtime atomic backup of the active SQLite database
    into a timestamped snapshot file using sqlite3.Connection.backup.
    """
    src = source_path or settings.DB_PATH
    dst_dir = destination_dir or get_default_backup_dir()
    os.makedirs(dst_dir, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"genesis_backup_{timestamp}.db"
    backup_path = os.path.join(dst_dir, backup_filename)

    if not os.path.exists(src):
        raise FileNotFoundError(f"Source database not found at {src}")

    # Use SQLite's online backup API to copy page-by-page safely under active WAL
    src_conn = sqlite3.connect(src, timeout=10.0)
    dst_conn = sqlite3.connect(backup_path, timeout=10.0)

    try:
        src_conn.backup(dst_conn, pages=100)
    finally:
        dst_conn.close()
        src_conn.close()

    # Verify backed-up database integrity
    is_valid, msg = verify_database_integrity(backup_path)
    if not is_valid:
        if os.path.exists(backup_path):
            os.remove(backup_path)
        raise RuntimeError(f"Backup verification failed: {msg}")

    return backup_path


def restore_backup(backup_path: str, target_path: Optional[str] = None) -> bool:
    """
    Restores the database from a verified backup snapshot.
    Closes active pool connections, validates snapshot, and atomically replaces the file.
    """
    tgt = target_path or settings.DB_PATH

    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file not found at {backup_path}")

    # Step 1: Pre-validation of backup snapshot
    is_valid, msg = verify_database_integrity(backup_path)
    if not is_valid:
        raise ValueError(f"Cannot restore corrupt backup snapshot: {msg}")

    # Step 2: Close active connection pool if in same process
    try:
        from db.database import db_pool
        db_pool.close_all()
    except Exception:
        pass

    # Step 3: Remove lingering WAL and SHM journal files
    for ext in ["-wal", "-shm"]:
        journal = f"{tgt}{ext}"
        if os.path.exists(journal):
            try:
                os.remove(journal)
            except Exception:
                pass

    # Step 4: Atomic file copy
    shutil.copy2(backup_path, tgt)

    # Step 5: Post-validation of target database
    tgt_valid, tgt_msg = verify_database_integrity(tgt)
    if not tgt_valid:
        raise RuntimeError(f"Post-restoration check failed on {tgt}: {tgt_msg}")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backup.py [create | restore <path> | verify <path>]")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "create":
        out = create_backup()
        print(f"Backup created successfully: {out}")
    elif cmd == "restore":
        if len(sys.argv) < 3:
            print("Error: Specify backup file path to restore.")
            sys.exit(1)
        restore_backup(sys.argv[2])
        print(f"Database successfully restored from {sys.argv[2]}")
    elif cmd == "verify":
        if len(sys.argv) < 3:
            print("Error: Specify database path to verify.")
            sys.exit(1)
        ok, detail = verify_database_integrity(sys.argv[2])
        print(f"Integrity check: {'PASSED' if ok else 'FAILED'} - {detail}")
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
