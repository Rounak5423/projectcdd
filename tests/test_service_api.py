import os
import tempfile
import unittest
from genesis.errors import GenesisError
from genesis.service import GenesisService
from genesis.settings import Settings
from tests.helpers import free_tile


def make_service(**kw):
    d = tempfile.mkdtemp()
    return GenesisService(Settings(db_path=os.path.join(d, "g.db"), **kw))


class ServiceTests(unittest.TestCase):
    def test_confirmation_is_required_before_spending(self):
        s = make_service()
        x, z = free_tile(s.main)
        t = s.main.s["economy"]["treasury"]
        r = s.construct("farm", x, z, confirm=False)
        self.assertFalse(r["executed"])
        self.assertEqual(s.main.s["economy"]["treasury"], t)
        self.assertTrue(s.construct("farm", x, z, confirm=True)["executed"])
        self.assertLess(s.main.s["economy"]["treasury"], t)
        r = s.policy_activate("education_investment")
        self.assertFalse(r["executed"])

    def test_save_load_across_restart_and_no_silent_offline_progress(self):
        s = make_service()
        s.step(7)
        day, pop = s.main.day, len(s.main.s["citizens"])
        s2 = GenesisService(s.cfg)
        self.assertEqual((s2.main.day, len(s2.main.s["citizens"])), (day, pop))
        self.assertEqual(s2.main.s["meta"]["status"], "paused")

    def test_offline_progression_is_explicit(self):
        s = make_service(offline_progression=True, offline_days_per_hour=10, offline_max_days=5)
        s.save()
        s.main.s["meta"]["saved_at"] -= 3600 * 3          # pretend GENESIS was closed for 3 hours
        s.store.save_world(s.main)
        s2 = GenesisService(s.cfg)
        self.assertEqual(s2.main.day, 5)
        self.assertTrue(any(f["title"] == "While you were away" for f in s2.main.s["feed"]))

    def test_snapshot_branch_compare_flow(self):
        s = make_service()
        s.step(3)
        snap = s.snapshot_create("start")
        a = s.branch_create("education_focus", snapshot_id=snap["id"])
        b = s.branch_create("environment_focus", snapshot_id=snap["id"])
        s.branch_advance(a["id"], 20)
        self.assertEqual(s.main.day, 3)
        self.assertEqual(len(s.branches()), 2)
        cmp = s.compare(["main", a["id"], b["id"]])
        self.assertEqual(len(cmp["rows"][0]["values"]), 3)
        with self.assertRaises(GenesisError):
            s.compare(["main"])
        s.branch_delete(b["id"])
        self.assertEqual(len(s.branches()), 1)

    def test_inspection_and_errors(self):
        s = make_service()
        cid = next(iter(s.main.s["citizens"]))
        self.assertIn("summary", s.citizen(cid))
        bid = next(iter(s.main.s["buildings"]))
        self.assertIn("info", s.building(bid))
        with self.assertRaises(GenesisError):
            s.citizen("C9999")
        with self.assertRaises(GenesisError):
            s.set_speed(77)
        with self.assertRaises(GenesisError):
            s.step(99)

    def test_experiment_via_service(self):
        s = make_service()
        s.main.s["grc"]["balance"] = 40
        r = s.experiment_start("food_decline", confirm=True)
        s.experiment_run(r["experiment"]["id"])
        self.assertEqual(s.experiments()["experiments"][0]["status"], "completed")


try:
    from fastapi.testclient import TestClient
    HAVE_FASTAPI = True
except Exception:  # noqa: BLE001
    HAVE_FASTAPI = False


@unittest.skipUnless(HAVE_FASTAPI, "fastapi is not installed")
class ApiTests(unittest.TestCase):
    def setUp(self):
        from genesis.api import deps
        from genesis.api.main import app
        deps.set_service(make_service())
        self.svc = deps.get_service()
        self.client = TestClient(app)

    def test_state_catalog_and_history(self):
        s = self.client.get("/api/state").json()
        self.assertEqual(s["metrics"]["population"], len(s["citizens"]))
        self.assertIn("buildings", self.client.get("/api/catalog").json())
        self.assertIsInstance(self.client.get("/api/history").json(), list)

    def test_build_flow_and_errors(self):
        x, z = free_tile(self.svc.main)
        r = self.client.post("/api/buildings", json={"type": "farm", "x": x, "z": z}).json()
        self.assertTrue(r["needs_confirmation"])
        r = self.client.post("/api/buildings", json={"type": "farm", "x": x, "z": z, "confirm": True}).json()
        self.assertTrue(r["executed"])
        bad = self.client.post("/api/buildings", json={"type": "farm", "x": 0, "z": 0, "confirm": True})
        self.assertEqual(bad.status_code, 400)
        self.assertIn("road", bad.json()["detail"])
        self.assertEqual(self.client.post("/api/buildings", json={"type": "farm"}).status_code, 422)

    def test_step_and_websocket(self):
        self.assertEqual(self.client.post("/api/sim/step", json={"days": 2}).json()["day"], 2)
        with self.client.websocket_connect("/ws") as ws:
            msg = ws.receive_json()
            self.assertEqual(msg["type"], "state")
            self.assertEqual(msg["data"]["meta"]["day"], 2)

    def test_scenarios_over_api(self):
        sid = self.client.post("/api/snapshots", json={"name": "x"}).json()["id"]
        b = self.client.post("/api/branches", json={"preset": "environment_focus", "snapshot_id": sid}).json()
        self.client.post(f"/api/branches/{b['id']}/advance", json={"days": 5})
        c = self.client.get(f"/api/compare?ids=main,{b['id']}").json()
        self.assertEqual(len(c["worlds"]), 2)


if __name__ == "__main__":
    unittest.main()
