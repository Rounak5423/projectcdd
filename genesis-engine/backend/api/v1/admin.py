import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from db.database import get_db_connection
from engine.models_v1 import (
    UserResponse, AdminUserCreateRequest, AdminUserUpdateRequest,
    AdminUserDetail, AdminStatsResponse
)
from auth.security import get_current_admin, hash_password

router = APIRouter(prefix="/admin", tags=["Admin Management"], dependencies=[Depends(get_current_admin)])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats():
    conn = get_db_connection()
    # User counts
    user_rows = conn.execute("""
    SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count
    FROM users
    """).fetchone()

    # World & economic aggregates
    world_rows = conn.execute("""
    SELECT
        COUNT(w.id) as total_worlds,
        COALESCE(SUM(e.population), 0) as total_population,
        COALESCE(SUM(e.gdp), 0.0) as total_gdp
    FROM worlds w
    LEFT JOIN economy_resources e ON w.id = e.world_id
    """).fetchone()
    conn.close()

    return AdminStatsResponse(
        total_users=user_rows["total_users"] or 0,
        active_users=user_rows["active_users"] or 0,
        admin_count=user_rows["admin_count"] or 0,
        user_count=user_rows["user_count"] or 0,
        total_worlds=world_rows["total_worlds"] or 0,
        total_population=int(world_rows["total_population"] or 0),
        total_gdp=float(world_rows["total_gdp"] or 0.0)
    )


@router.get("/users", response_model=List[AdminUserDetail])
async def list_users():
    conn = get_db_connection()
    users = conn.execute("""
    SELECT id, username, email, role, is_active, created_at, updated_at
    FROM users
    ORDER BY created_at ASC
    """).fetchall()

    results = []
    for u in users:
        worlds = conn.execute("""
        SELECT w.id, w.name, w.simulation_status, p.level, e.population, e.gdp, p.thriving_score
        FROM worlds w
        LEFT JOIN economy_resources e ON w.id = e.world_id
        LEFT JOIN progression p ON w.id = p.world_id
        WHERE w.owner_id = ?
        ORDER BY w.updated_at DESC
        """, (u["id"],)).fetchall()

        results.append(AdminUserDetail(
            id=u["id"],
            username=u["username"],
            email=u["email"],
            role=u["role"],
            is_active=bool(u["is_active"]),
            created_at=u["created_at"],
            updated_at=u["updated_at"],
            worlds_count=len(worlds),
            worlds=[dict(w) for w in worlds]
        ))
    conn.close()
    return results


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(req: AdminUserCreateRequest):
    conn = get_db_connection()
    existing = conn.execute(
        "SELECT id, username, email FROM users WHERE username = ? OR email = ?",
        (req.username.strip(), req.email.strip().lower())
    ).fetchone()
    if existing:
        conn.close()
        field = "username" if existing["username"] == req.username.strip() else "email"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with this {field} already exists."
        )

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    p_hash, salt = hash_password(req.password)

    with conn:
        conn.execute("""
        INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, req.username.strip(), req.email.strip().lower(), p_hash, salt, req.role, 1 if req.is_active else 0, now, now))

    conn.close()

    return UserResponse(
        id=user_id,
        username=req.username.strip(),
        email=req.email.strip().lower(),
        role=req.role,
        is_active=req.is_active,
        created_at=now,
        updated_at=now
    )


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(user_id: str):
    conn = get_db_connection()
    user = conn.execute("""
    SELECT id, username, email, role, is_active, created_at, updated_at
    FROM users
    WHERE id = ?
    """, (user_id,)).fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    worlds = conn.execute("""
    SELECT w.id, w.name, w.simulation_status, p.level, e.population, e.gdp, p.thriving_score, w.climate, w.technology_level
    FROM worlds w
    LEFT JOIN economy_resources e ON w.id = e.world_id
    LEFT JOIN progression p ON w.id = p.world_id
    WHERE w.owner_id = ?
    ORDER BY w.updated_at DESC
    """, (user_id,)).fetchall()
    conn.close()

    return AdminUserDetail(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        is_active=bool(user["is_active"]),
        created_at=user["created_at"],
        updated_at=user["updated_at"],
        worlds_count=len(worlds),
        worlds=[dict(w) for w in worlds]
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_by_admin(
    user_id: str,
    req: AdminUserUpdateRequest,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    conn = get_db_connection()
    user = conn.execute("SELECT id, username, email, role, is_active FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    # Safety: An admin cannot deactivate or demote their own account
    if user["id"] == current_admin["id"]:
        if req.is_active is False:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot deactivate their own account."
            )
        if req.role == "user":
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot revoke their own admin role."
            )

    updates = []
    params = []

    if req.email is not None:
        # Check uniqueness if changed
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            (req.email.strip().lower(), user_id)
        ).fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already used by another account.")
        updates.append("email = ?")
        params.append(req.email.strip().lower())

    if req.role is not None:
        updates.append("role = ?")
        params.append(req.role)

    if req.is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if req.is_active else 0)

    if req.password is not None and req.password.strip():
        new_hash, new_salt = hash_password(req.password.strip())
        updates.append("password_hash = ?")
        params.append(new_hash)
        updates.append("salt = ?")
        params.append(new_salt)

    updates.append("updated_at = ?")
    now = datetime.now(timezone.utc).isoformat()
    params.append(now)
    params.append(user_id)

    with conn:
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)

    updated_row = conn.execute("SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return UserResponse(
        id=updated_row["id"],
        username=updated_row["username"],
        email=updated_row["email"],
        role=updated_row["role"],
        is_active=bool(updated_row["is_active"]),
        created_at=updated_row["created_at"],
        updated_at=updated_row["updated_at"]
    )


@router.delete("/users/{user_id}")
async def delete_user_by_admin(
    user_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    if user_id == current_admin["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account."
        )

    conn = get_db_connection()
    user = conn.execute("SELECT id, username FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    with conn:
        # Reassign or nullify worlds owned by this user
        conn.execute("UPDATE worlds SET owner_id = NULL WHERE owner_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))

    conn.close()
    return {"status": "deleted", "user_id": user_id, "username": user["username"]}

