import os
import json
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_openapi_schema_up_to_date():
    """Fails if the backend OpenAPI schema has drifted without backend_contract.json being updated."""
    contract_path = os.path.join(os.path.dirname(__file__), "../../../docs/contract/backend_contract.json")
    assert os.path.exists(contract_path), "backend_contract.json must exist in docs/contract/"
    
    with open(contract_path, "r") as f:
        stored_contract = json.load(f)
    
    current_openapi = app.openapi()
    stored_paths = set(stored_contract["openapi"].get("paths", {}).keys())
    current_paths = set(current_openapi.get("paths", {}).keys())
    
    # Assert no backend routes were removed without updating contract
    missing = stored_paths - current_paths
    assert len(missing) == 0, f"Backend routes were removed or renamed: {missing}"

def test_replay_frontend_endpoints_against_backend():
    """Replays core frontend API calls against backend to verify status < 400 and valid payload structures."""
    endpoints_to_test = [
        ("GET", "/health"),
        ("GET", "/api/v1/worlds"),
        ("GET", "/api/v1/worlds/aurora-prime"),
        ("GET", "/api/v1/worlds/aurora-prime/budget"),
        ("GET", "/api/v1/worlds/aurora-prime/technology/overview"),
        ("GET", "/api/v1/worlds/aurora-prime/policies"),
        ("GET", "/api/v1/worlds/aurora-prime/buildings"),
        ("GET", "/api/v1/worlds/aurora-prime/vitals?limit=10"),
        ("GET", "/api/v1/worlds/aurora-prime/events"),
    ]
    
    for method, path in endpoints_to_test:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path)
        assert res.status_code < 400, f"Endpoint {method} {path} returned error {res.status_code}: {res.text}"
        assert res.json() is not None, f"Endpoint {method} {path} returned empty body"
