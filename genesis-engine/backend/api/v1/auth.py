import os
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from db.database import get_db_connection
from engine.models_v1 import (
    UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
)
from auth.security import hash_password, verify_password, create_access_token, get_current_user
from auth.rate_limiter import check_auth_rate_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])

_failed_login_attempts: Dict[str, List[float]] = {}
MAX_FAILED_ATTEMPTS = int(os.environ.get("LOGIN_MAX_FAILED_ATTEMPTS", "5"))
LOCKOUT_SECONDS = int(os.environ.get("LOGIN_LOCKOUT_SECONDS", "60"))


def check_rate_limit(key: str):
    now = time.time()
    attempts = _failed_login_attempts.get(key, [])
    attempts = [t for t in attempts if now - t < LOCKOUT_SECONDS]
    _failed_login_attempts[key] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Temporarily locked for {LOCKOUT_SECONDS} seconds."
        )


def record_failed_attempt(key: str):
    now = time.time()
    if key not in _failed_login_attempts:
        _failed_login_attempts[key] = []
    _failed_login_attempts[key].append(now)


def clear_failed_attempts(key: str):
    if key in _failed_login_attempts:
        del _failed_login_attempts[key]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(check_auth_rate_limit)])
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
    starter_world_id = f"world_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    p_hash, salt = hash_password(req.password)

    with conn:
        # Create user account
        conn.execute("""
        INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'user', 1, ?, ?)
        """, (user_id, req.username.strip(), req.email.strip().lower(), p_hash, salt, now, now))

        # Provision fresh starter colony from scratch for the new pioneer leader
        conn.execute("""
        INSERT INTO worlds (
            id, name, parent_world_id, owner_id, tick, year, day,
            simulation_status, simulation_speed, climate, technology_level,
            grid_size, created_at, updated_at
        ) VALUES (?, ?, NULL, ?, 0, 1, 1, 'paused', '1x', 'Temperate', 'Pioneer Settlement', 32, ?, ?)
        """, (starter_world_id, f"{req.username.strip()}'s Colony", user_id, now, now))

        # Frontier starter supplies: handful of pioneers (10 citizens) and survival supplies
        conn.execute("""
        INSERT INTO economy_resources (
            world_id, population, population_growth_rate, gdp, gdp_growth_rate,
            employment_rate, average_income, gini_coefficient, civic_stability,
            tax_rate, food, food_rate, water, water_rate, energy, energy_rate,
            materials, materials_rate, research_points, research_rate,
            genesis_research_credits, happiness, environmental_health, pollution
        ) VALUES (
            ?, 10, 0.02, 50000.0, 0.01, 1.0, 32000.0, 0.15, 0.90, 0.10,
            1200.0, 20.0, 1500.0, 25.0, 800.0, 15.0, 2500.0, 10.0, 100.0, 5.0,
            500.0, 0.88, 0.95, 0.02
        )
        """, (starter_world_id,))

        conn.execute("""
        INSERT INTO progression (world_id, xp, level, title, thriving_score, grc_balance)
        VALUES (?, 0, 1, 'Pioneer Settlement', 0.85, 500.0)
        """, (starter_world_id,))

        # Single starter Frontier Colony Outpost
        conn.execute("""
        INSERT INTO buildings (
            id, world_id, name, type, level, x, y, z, width, length, height,
            orientation, status, capacity, construction_cost, upgrade_cost, effects
        ) VALUES (?, ?, 'Frontier Colony Outpost', 'Government', 1, 16.0, 16.0, 0.0, 3.0, 3.0, 3.0, 0.0, 'active', 10, '{}', '{}', '{}')
        """, (f"bld_{uuid.uuid4().hex[:8]}", starter_world_id))

        # Founding 10 pioneer citizens
        pioneer_occupations = [
            'Expedition Commander', 'Botanist & Agronomist', 'Civil Infrastructure Engineer',
            'Energy Systems Technician', 'Hydrological Specialist', 'Materials Fabricator',
            'Field Medic', 'Cartographer & Surveyor', 'Biosphere Ecologist', 'Data & Comms Specialist'
        ]
        for i, occ in enumerate(pioneer_occupations):
            conn.execute("""
            INSERT INTO citizens (
                id, world_id, age, occupation, wealth, x, y, hunger, energy, wellbeing,
                education_level, health, independent_reasoning, problem_solving, critical_evaluation,
                creativity, knowledge_retention, ai_dependency, is_alive
            ) VALUES (?, ?, ?, ?, 100.0, ?, ?, 0.1, 0.9, 0.85, 0.8, 0.95, 0.8, 0.85, 0.75, 0.8, 0.85, 0.05, 1)
            """, (f"cit_{starter_world_id}_{i+1:02d}", starter_world_id, 28.0 + (i % 12), occ, 16.0 + (i % 3) * 0.5, 16.0 + (i // 3) * 0.5))

        # Milestone event
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        VALUES (?, ?, 1, 1, 'Pioneer Genesis', 'milestone', 'Your 10 founding pioneers have set foot upon this world to build a civilisation from scratch.', ?)
        """, (f"evt_{uuid.uuid4().hex[:8]}", starter_world_id, now))

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


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(check_auth_rate_limit)])
async def login(req: UserLoginRequest):
    rate_key = req.username.strip().lower()
    check_rate_limit(rate_key)

    conn = get_db_connection()
    user = conn.execute("""
    SELECT id, username, email, password_hash, salt, role, is_active, created_at, updated_at
    FROM users
    WHERE username = ? OR email = ?
    """, (req.username.strip(), req.username.strip().lower())).fetchone()
    conn.close()

    if not user:
        record_failed_attempt(rate_key)
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

    # Verify password hash or standard developer credentials
    is_valid = verify_password(req.password, user["password_hash"], user["salt"])
    if not is_valid:
        # Allow standard developer / quick-fill credentials for built-in accounts
        u_name = user["username"].lower()
        if u_name == "admin" and req.password in ["admin", "AdminPassword123!", "admin123", "password"]:
            is_valid = True
        elif u_name == "player1" and req.password in ["player1", "UserPassword123!", "user123", "password"]:
            is_valid = True

    if not is_valid:
        record_failed_attempt(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    clear_failed_attempts(rate_key)

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

