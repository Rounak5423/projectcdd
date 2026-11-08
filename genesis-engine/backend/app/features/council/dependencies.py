"""
CIVORA — Council of Advisors FastAPI Dependencies
Manages database sessions, authentication, and world authorization checks.
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Header, status

from db.database import get_db_connection
from auth.security import get_current_user_optional, get_current_user
from app.features.council.repository import CouncilRepository

_repo_instance = CouncilRepository()


def get_council_repo() -> CouncilRepository:
    return _repo_instance


def _resolve_world_id(id: str) -> str:
    aliases = {
        "civ-aurora-01": "aurora-prime",
        "civ-default": "aurora-prime",
        "prime": "aurora-prime",
        "default": "aurora-prime",
    }
    return aliases.get(id, id)


def verify_world_access(
    world_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Verifies that the requested world exists and the user is authorized to access it.
    Admins can access any world; regular users can only access their owned worlds.
    """
    target_id = _resolve_world_id(world_id)
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM worlds WHERE id = ?", (target_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Civilisation world '{world_id}' does not exist."
        )

    world = dict(row)

    # Check ownership if authenticated
    if current_user:
        # Admin bypasses
        if current_user.get("role") == "admin":
            return world

        # If world has an owner_id, enforce ownership
        owner_id = world.get("owner_id")
        if owner_id and owner_id != current_user.get("id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not possess sovereign authority over this civilisation."
            )

    return world

