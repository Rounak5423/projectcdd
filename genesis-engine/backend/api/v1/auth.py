import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from db.database import get_db_connection
from engine.models_v1 import (
    UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
)
from auth.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    conn = get_db_connection()
    # Check if username or email is already taken
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
        VALUES (?, ?, ?, ?, ?, 'user', 1, ?, ?)
        """, (user_id, req.username.strip(), req.email.strip().lower(), p_hash, salt, now, now))

    conn.close()

    user_obj = UserResponse(
        id=user_id,
        username=req.username.strip(),
        email=req.email.strip().lower(),
        role="user",
        is_active=True,
        created_at=now,
        updated_at=now
    )
    token = create_access_token({"sub": user_id, "username": user_obj.username, "role": user_obj.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_obj
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    conn = get_db_connection()
    user = conn.execute("""
    SELECT id, username, email, password_hash, salt, role, is_active, created_at, updated_at
    FROM users
    WHERE username = ? OR email = ?
    """, (req.username.strip(), req.username.strip().lower())).fetchone()
    conn.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been suspended by an administrator."
        )

    if not verify_password(req.password, user["password_hash"], user["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_obj = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        is_active=bool(user["is_active"]),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )
    token = create_access_token({"sub": user["id"], "username": user["username"], "role": user["role"]})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_obj
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db_connection()
    user = conn.execute("""
    SELECT id, username, email, role, is_active, created_at, updated_at
    FROM users
    WHERE id = ?
    """, (current_user["id"],)).fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User record not found")

    return UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        is_active=bool(user["is_active"]),
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )


@router.post("/logout")
async def logout():
    return {"status": "success", "message": "Session terminated successfully."}

