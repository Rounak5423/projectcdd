import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

results = []

def record(test_name: str, passed: bool, details: str):
    results.append({"test": test_name, "passed": passed, "details": details})
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | {test_name}: {details}")

def make_request(path: str, method: str = "GET", data: dict = None, headers: dict = None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read()
            if "application/json" in content_type:
                return resp.status, json.loads(raw.decode("utf-8"))
            elif "image/" in content_type:
                return resp.status, f"binary_image({len(raw)} bytes)"
            else:
                return resp.status, raw.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return 0, str(e)

print("\n" + "="*80)
print("🚀 GENESIS ENGINE LIVE REQUIREMENTS VERIFICATION SUITE")
print("="*80 + "\n")

# 1. AUTHENTICATION & RBAC
# 1.1 Admin login
status, data = make_request("/api/v1/auth/login", method="POST", data={"username": "admin", "password": "AdminPassword123!"})
admin_token = data.get("access_token") if status == 200 else None
record("AUTH-01: Seeded Admin Login", status == 200 and data.get("user", {}).get("role") == "admin", f"Status: {status}, Role: {data.get('user', {}).get('role') if status == 200 else 'None'}")

# 1.2 User login
status, data = make_request("/api/v1/auth/login", method="POST", data={"username": "player1", "password": "UserPassword123!"})
user_token = data.get("access_token") if status == 200 else None
record("AUTH-02: Seeded User Login", status == 200 and data.get("user", {}).get("role") == "user", f"Status: {status}, Username: {data.get('user', {}).get('username') if status == 200 else 'None'}")

# 1.3 Invalid credentials
status, data = make_request("/api/v1/auth/login", method="POST", data={"username": "player1", "password": "BadPassword!"})
record("AUTH-03: Invalid Credentials Rejection", status == 401, f"Status: {status}, Detail: {data.get('detail') if isinstance(data, dict) else data}")

# 1.4 Register new user
test_user = "pilot_test_88"
status, data = make_request("/api/v1/auth/register", method="POST", data={"username": test_user, "email": f"{test_user}@genesis.ai", "password": "SafePassword123!"})
new_user_token = data.get("access_token") if status == 201 else None
record("AUTH-04: User Registration", status == 201 or status == 409, f"Status: {status}, Registered: {test_user}")

# 1.5 Duplicate registration rejection
status, data = make_request("/api/v1/auth/register", method="POST", data={"username": "player1", "email": "duplicate@genesis.ai", "password": "SafePassword123!"})
record("AUTH-05: Duplicate Username Prevention", status == 409, f"Status: {status}")

# 1.6 Profile me route with token
status, data = make_request("/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"})
record("AUTH-06: Profile Self-Inspection (/auth/me)", status == 200 and data.get("username") == "player1", f"Status: {status}, User: {data.get('username') if status == 200 else 'None'}")

# 1.7 RBAC Security Boundary: Standard user blocked from Admin Console
status, data = make_request("/api/v1/admin/users", headers={"Authorization": f"Bearer {user_token}"})
record("RBAC-01: Non-Admin Access Forbidden", status == 403, f"Status: {status}, Detail: {data.get('detail') if isinstance(data, dict) else data}")

# 1.8 RBAC Admin Access: Admin accesses roster
status, data = make_request("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
record("RBAC-02: Admin Access Permitted", status == 200 and isinstance(data, list) and len(data) >= 2, f"Status: {status}, Users Count: {len(data) if isinstance(data, list) else 0}")

# 1.9 Admin System Telemetry
status, data = make_request("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
record("RBAC-03: Admin System Telemetry Stats", status == 200 and "total_users" in data, f"Status: {status}, Total Users: {data.get('total_users')}, Total Worlds: {data.get('total_worlds')}")

# 2. PERSISTENT CIVILISATION & WORLD STATE
# 2.1 Aurora Prime state
status, data = make_request("/api/v1/worlds/aurora-prime", headers={"Authorization": f"Bearer {user_token}"})
record("WORLD-01: Persistent World State Loading", status == 200 and data.get("name") == "Aurora Prime", f"Status: {status}, Name: {data.get('name')}, Level: {data.get('level')}")

# 2.2 Civilisation state alias endpoint (/api/civilisations/{id}/state)
status, data = make_request("/api/civilisations/aurora-prime/state")
record("WORLD-02: Universal Civilisation State Endpoint", status == 200 and "grc_balance" in data, f"Status: {status}, GRC: {data.get('grc_balance')}, Pop: {data.get('demographics', {}).get('population')}")

# 2.3 Advance simulation ticks
status, data = make_request("/api/v1/worlds/aurora-prime/simulation/advance", method="POST", data={"ticks": 5}, headers={"Authorization": f"Bearer {user_token}"})
record("SIM-01: Discrete Simulation Step Execution", status == 200 and "current_tick" in data, f"Status: {status}, New Tick: {data.get('current_tick')}, Yr: {data.get('year')}, Day: {data.get('day')}")

# 3. 9 SIMULATION ENGINES
# 3.1 Economy & Resources
status, data = make_request("/api/v1/worlds/aurora-prime/economy", headers={"Authorization": f"Bearer {user_token}"})
record("SIM-02: Economy Engine & Gini Metric", status == 200 and "gini_coefficient" in data, f"Status: {status}, Gini: {data.get('gini_coefficient')}, GDP: ${data.get('gdp', 0):,.2f}")

# 3.2 Population Cohorts
status, data = make_request("/api/v1/worlds/aurora-prime/population", headers={"Authorization": f"Bearer {user_token}"})
record("SIM-03: Population Engine & Demographics", status == 200 and "total_population" in data, f"Status: {status}, Population: {data.get('total_population')}, Employment: {data.get('employment_rate')*100:.1f}%")

# 3.3 Infrastructure & Buildings
status, data = make_request("/api/v1/worlds/aurora-prime/buildings", headers={"Authorization": f"Bearer {user_token}"})
record("SIM-04: Infrastructure Engine Facilities", status == 200 and isinstance(data, list) and len(data) > 0, f"Status: {status}, Placed Buildings: {len(data) if isinstance(data, list) else 0}")

# 3.4 Governance & Policies
status, data = make_request("/api/v1/worlds/aurora-prime/policies", headers={"Authorization": f"Bearer {user_token}"})
record("SIM-05: Governance Engine & Policies", status == 200 and isinstance(data, list) and len(data) > 0, f"Status: {status}, Active Policies: {len(data) if isinstance(data, list) else 0}")

# 3.5 Technology Tree Progression
status, data = make_request("/api/v1/worlds/aurora-prime/technology", headers={"Authorization": f"Bearer {user_token}"})
record("SIM-06: Science & Technology Tree Progression", status == 200 and isinstance(data, list) and len(data) > 0, f"Status: {status}, Unlocked Techs: {len(data) if isinstance(data, list) else 0}")

# 4. GRC ECONOMY & EXPERIMENT BRANCHING
# 4.1 GRC Deduction Safety: Insufficient GRC should return HTTP 402
status, data = make_request("/api/v1/experiments", method="POST", data={
    "world_id": "aurora-prime",
    "title": "Unfunded Super-Experiment",
    "research_question": "Can we execute an experiment without credits?",
    "variable_tested": "Quantum AI Fusion",
    "credit_cost": 999999999.0
}, headers={"Authorization": f"Bearer {user_token}"})
record("GRC-01: Zero-Negative Balance Enforcement (HTTP 402)", status == 402, f"Status: {status}, Detail: {data.get('detail') if isinstance(data, dict) else data}")

# 4.2 Counterfactual Experiment Execution with atomic deduction
status, data = make_request("/api/experiments/execute", method="POST", data={
    "civ_id": "aurora-prime",
    "horizon_years": 5,
    "policy_overrides": {
        "cognitive_scaffolding": 0.90,
        "ai_automation_tier": 0.80
    }
})
record("GRC-02: Counterfactual Experiment Branching", status == 200 and "baseline_trajectory" in data, f"Status: {status}, GRC Deducted: {data.get('grc_deducted')}, Remaining: {data.get('remaining_grc')}")

# 5. FRONTEND INTEGRATION
# 5.1 Root SPA serving
status, data = make_request("/")
has_app = "index-CZhcXYwD.js" in data or "CIVORA" in data or "genesis-ui" in data
record("UI-01: React Single Page Application Distribution", status == 200 and has_app, f"Status: {status}, Index HTML Size: {len(data)} bytes")

# 5.2 Brand assets accessibility
status, data = make_request("/brand/civora-banner.jpg")
record("UI-02: Brand Assets Delivery", status == 200, f"Status: {status}")

print("\n" + "="*80)
total = len(results)
passed = sum(1 for r in results if r["passed"])
print(f"SUMMARY: {passed}/{total} Live System Tests Passed ({passed/total*100:.1f}%)")
print("="*80 + "\n")

if passed != total:
    sys.exit(1)
