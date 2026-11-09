import pytest
from fastapi.testclient import TestClient
from main import app
from engine.simulation_v1 import seed_aurora_prime_if_not_exists
import db.database

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_auth_db(tmp_path_factory):
    test_db = str(tmp_path_factory.mktemp("auth_db") / "test_auth.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


def test_default_seeded_accounts_login():
    # 1. Admin login
    admin_login = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    })
    assert admin_login.status_code == 200
    admin_data = admin_login.json()
    assert admin_data["user"]["role"] == "admin"
    assert "access_token" in admin_data
    assert admin_data["token_type"] == "bearer"

    # 2. Player1 login
    player_login = client.post("/api/v1/auth/login", json={
        "username": "player1",
        "password": "UserPassword123!"
    })
    assert player_login.status_code == 200
    player_data = player_login.json()
    assert player_data["user"]["role"] == "user"
    assert player_data["user"]["username"] == "player1"


def test_auth_invalid_credentials():
    bad_login = client.post("/api/v1/auth/login", json={
        "username": "player1",
        "password": "WrongPassword999!"
    })
    assert bad_login.status_code == 401
    assert "Invalid username or password" in bad_login.json()["detail"]


def test_auth_register_and_me():
    # 1. Register new user
    reg_res = client.post("/api/v1/auth/register", json={
        "username": "stellar_voyager",
        "email": "voyager@genesis.ai",
        "password": "MySecretPass123!"
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    assert reg_data["user"]["role"] == "user"
    assert reg_data["user"]["username"] == "stellar_voyager"

    # 2. Duplicate registration should fail
    dup_res = client.post("/api/v1/auth/register", json={
        "username": "stellar_voyager",
        "email": "different@genesis.ai",
        "password": "AnotherPassword123!"
    })
    assert dup_res.status_code == 409

    # 3. Check /me with token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "stellar_voyager"

    # 4. Check /me without token fails
    me_unauth = client.get("/api/v1/auth/me")
    assert me_unauth.status_code == 401


def test_user_game_access_and_admin_boundary():
    # Get player1 token
    player_token = client.post("/api/v1/auth/login", json={
        "username": "player1",
        "password": "UserPassword123!"
    }).json()["access_token"]

    # Player can access game endpoints
    civ_res = client.get("/api/v1/worlds/aurora-prime", headers={"Authorization": f"Bearer {player_token}"})
    assert civ_res.status_code == 200
    assert civ_res.json()["name"] == "Aurora Prime"

    # Player creates a world
    new_world_res = client.post("/api/v1/worlds", json={
        "name": "Player 1 Colony",
        "climate": "Temperate",
        "technology_level": "Automated",
        "initial_population": 300
    }, headers={"Authorization": f"Bearer {player_token}"})
    assert new_world_res.status_code == 201
    colony_id = new_world_res.json()["id"]

    # Player can advance simulation
    advance_res = client.post(f"/api/v1/worlds/{colony_id}/simulation/advance", json={"ticks": 1}, headers={"Authorization": f"Bearer {player_token}"})
    assert advance_res.status_code == 200

    # BOUNDARY TEST: Regular user CANNOT access Admin endpoints!
    admin_stats_as_user = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {player_token}"})
    assert admin_stats_as_user.status_code == 403
    assert "Administrative privileges required" in admin_stats_as_user.json()["detail"]

    admin_users_as_user = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {player_token}"})
    assert admin_users_as_user.status_code == 403


def test_admin_full_control_and_user_management():
    # 1. Admin login
    admin_token = client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Admin inspects stats
    stats_res = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_users"] >= 2
    assert stats["admin_count"] >= 1
    assert stats["user_count"] >= 1
    assert stats["total_worlds"] >= 1

    # 3. Admin lists all users with their civilisations
    users_res = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_res.status_code == 200
    users = users_res.json()
    assert len(users) >= 2
    usernames = [u["username"] for u in users]
    assert "admin" in usernames
    assert "player1" in usernames

    # Find player1
    p1 = next(u for u in users if u["username"] == "player1")
    p1_id = p1["id"]

    # 4. Admin inspects specific user detail
    detail_res = client.get(f"/api/v1/admin/users/{p1_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["username"] == "player1"
    assert "worlds" in detail

    # 5. Admin creates a new user directly
    create_u = client.post("/api/v1/admin/users", json={
        "username": "test_moderator",
        "email": "mod@genesis.ai",
        "password": "ModPassword123!",
        "role": "admin"
    }, headers=admin_headers)
    assert create_u.status_code == 201
    mod_id = create_u.json()["id"]
    assert create_u.json()["role"] == "admin"

    # 6. Admin suspends test_moderator
    suspend_res = client.put(f"/api/v1/admin/users/{mod_id}", json={
        "is_active": False
    }, headers=admin_headers)
    assert suspend_res.status_code == 200
    assert suspend_res.json()["is_active"] is False

    # Suspended user login attempt fails with 403
    suspended_login = client.post("/api/v1/auth/login", json={
        "username": "test_moderator",
        "password": "ModPassword123!"
    })
    assert suspended_login.status_code == 403
    assert "suspended" in suspended_login.json()["detail"].lower()

    # 7. Admin reactivates and changes role to user
    reactivate_res = client.put(f"/api/v1/admin/users/{mod_id}", json={
        "is_active": True,
        "role": "user"
    }, headers=admin_headers)
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["is_active"] is True
    assert reactivate_res.json()["role"] == "user"

    # Now login works again
    relogin = client.post("/api/v1/auth/login", json={
        "username": "test_moderator",
        "password": "ModPassword123!"
    })
    assert relogin.status_code == 200
    assert relogin.json()["user"]["role"] == "user"

    # 8. Admin cannot suspend or demote self
    admin_info = client.get("/api/v1/auth/me", headers=admin_headers).json()
    self_suspend = client.put(f"/api/v1/admin/users/{admin_info['id']}", json={
        "is_active": False
    }, headers=admin_headers)
    assert self_suspend.status_code == 400

    self_delete = client.delete(f"/api/v1/admin/users/{admin_info['id']}", headers=admin_headers)
    assert self_delete.status_code == 400

    # 9. Admin deletes the test user
    del_res = client.delete(f"/api/v1/admin/users/{mod_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

