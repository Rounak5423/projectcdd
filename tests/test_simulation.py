import os
import tempfile
import unittest
from genesis.errors import GenesisError
from genesis.models.world import World
from genesis.persistence.store import Store
from genesis.simulation import experiments as ex, governance as gov, research as rs
from genesis.simulation.citizens import new_citizen
from genesis.simulation.engine import advance, public_state
from genesis.simulation.infrastructure import construct, plan_construct, upgrade, compute_services
from genesis.simulation.metrics import compute_metrics
from genesis.simulation.progression import grant_grc, spend_grc
from genesis.simulation.scenarios import make_branch, make_snapshot, compare_worlds
from tests.helpers import world, clean, free_tile


class CitizenTests(unittest.TestCase):
    def test_seeded_population_is_diverse(self):
        w = world()
        profs = {c["profession"] for c in w.s["citizens"].values()}
        for p in ("farmer", "doctor", "nurse", "teacher", "student", "engineer", "scientist", "researcher",
                  "factory_worker", "business_owner", "construction_worker", "government_employee", "service_worker"):
            self.assertIn(p, profs)
        self.assertTrue(any(c["profession"] == "unemployed" for c in w.s["citizens"].values()))
        ids = list(w.s["citizens"])
        self.assertEqual(len(ids), len(set(ids)))

    def test_citizen_has_required_attributes(self):
        c = next(iter(world().s["citizens"].values()))
        for k in ("id", "age", "profession", "education", "intel", "health", "happiness", "skills", "learning", "income",
                  "needs", "goal", "partner", "children", "memories", "x", "z"):
            self.assertIn(k, c)

    def test_creation_is_reproducible(self):
        a, b = world(5), world(5)
        self.assertEqual(clean(a), clean(b))
        self.assertNotEqual(clean(a), clean(world(6)))

    def test_citizens_behave_differently_and_learn(self):
        w = world(days=20)
        acts = {c["activity"] for c in w.s["citizens"].values()}
        self.assertGreaterEqual(len(acts), 4)
        w2 = world()
        before = {i: dict(c["skills"]) for i, c in w2.s["citizens"].items()}
        advance(w2, 30)
        improved = sum(1 for i, c in w2.s["citizens"].items() if i in before and any(c["skills"][k] > before[i][k] for k in c["skills"]))
        self.assertGreater(improved, 50)


class PopulationTests(unittest.TestCase):
    def test_population_balance_adds_up(self):
        w = world()
        start = len(w.s["citizens"])
        advance(w, 60)
        t = w.s["totals"]
        self.assertEqual(len(w.s["citizens"]), start + t["births"] + t["immigrants"] - t["deaths"] - t["emigrants"])

    def test_births_happen_with_high_birth_modifier(self):
        w = world()
        w.s["custom_mods"]["birth"] = 40.0
        advance(w, 30)
        self.assertGreater(w.s["totals"]["births"], 0)
        baby = [c for c in w.s["citizens"].values() if c["profession"] == "child" and c["age"] == 0]
        self.assertTrue(baby)
        self.assertEqual(len(baby[0]["parents"]), 2)

    def test_deaths_happen_to_frail_elders(self):
        w = world()
        for c in list(w.s["citizens"].values())[:40]:
            c["birth_day"] = w.day - 98 * 60
            c["health"] = 5
        advance(w, 40)
        self.assertGreater(w.s["totals"]["deaths"], 5)

    def test_students_finish_school_and_graduate(self):
        w = world()
        students = {i for i, c in w.s["citizens"].items() if c["profession"] == "student" and c["age"] >= 12}
        advance(w, 240)
        grown = [w.s["citizens"][i] for i in students if i in w.s["citizens"] and w.s["citizens"][i]["profession"] != "student"]
        self.assertTrue(grown)
        self.assertTrue(any(c["education"] >= 2 for c in grown))
        self.assertTrue(any(c["education"] == 3 for c in w.s["citizens"].values()))
        self.assertTrue(any("Graduated" in m["text"] or "secondary" in m["text"] for c in grown for m in c["memories"]))

    def test_unemployed_retrain_and_find_jobs(self):
        w = world()
        for c in list(w.s["citizens"].values()):
            if c["profession"] == "service_worker":
                c.update(profession="unemployed", employed=False)
        advance(w, 10)
        self.assertGreater(w.s["totals"]["immigrants"] + sum(1 for c in w.s["citizens"].values() if c["employed"]), 100)


class ResourceEconomyTests(unittest.TestCase):
    def test_food_production_matches_farms_and_consumption_matches_people(self):
        w = world(days=3)
        f = w.s["resources"]["food"]
        self.assertGreater(f["production"], 100)
        self.assertAlmostEqual(f["demand"], len(w.s["citizens"]) * 0.9, places=3)

    def test_shortage_has_consequences(self):
        ctrl, hurt = world(days=1), world(days=1)
        for bid in [b for b, v in hurt.s["buildings"].items() if v["type"] == "farm"]:
            del hurt.s["buildings"][bid]
        advance(ctrl, 60)
        advance(hurt, 60)
        self.assertTrue(hurt.s["resources"]["food"]["shortage"])
        self.assertLess(hurt.s["resources"]["food"]["availability"], 0.6)
        self.assertLess(compute_metrics(hurt)["avg_health"], compute_metrics(ctrl)["avg_health"])
        self.assertLess(compute_metrics(hurt)["avg_happiness"], compute_metrics(ctrl)["avg_happiness"])
        self.assertTrue(any(e["type"] == "shortage_food" for e in hurt.s["events"]["active"] + hurt.s["events"]["log"]))

    def test_energy_loss_slows_production(self):
        w = world(days=2)
        base = w.s["resources"]["food"]["production"]
        for b in [b for b, v in w.s["buildings"].items() if v["type"] == "power_plant"]:
            del w.s["buildings"][b]
        advance(w, 3)
        self.assertLess(w.s["resources"]["food"]["production"], base)

    def test_economy_values_come_from_activity(self):
        w = world(days=5)
        e = w.s["economy"]
        gdp0 = e["gdp"]
        self.assertGreater(e["gdp"], 0)
        self.assertGreater(e["tax_revenue"], 0)
        self.assertTrue(0 <= e["gini"] <= 1)
        for b in [b for b, v in w.s["buildings"].items() if v["type"] == "factory"]:
            del w.s["buildings"][b]
        advance(w, 3)
        self.assertLess(w.s["economy"]["gdp"], gdp0)
        self.assertEqual(compute_metrics(w)["gdp"], round(w.s["economy"]["gdp"], 1))


class BuildingTests(unittest.TestCase):
    def test_construction_costs_and_completes(self):
        w = world()
        mods = gov.get_modifiers(w)
        t0, m0 = w.s["economy"]["treasury"], w.s["resources"]["materials"]["stock"]
        x, z = free_tile(w)
        b = construct(w, "hospital", x, z, mods)
        self.assertEqual(b["status"], "building")
        self.assertLess(w.s["economy"]["treasury"], t0)
        self.assertLess(w.s["resources"]["materials"]["stock"], m0 + 1)
        cap0 = w.s["services"]["health_capacity"]
        advance(w, 5)
        self.assertEqual(w.s["buildings"][b["id"]]["status"], "active")
        advance(w, 30)
        self.assertGreater(w.s["buildings"][b["id"]]["workers"], 0)
        self.assertGreater(w.s["services"]["health_capacity"], cap0)

    def test_invalid_actions_are_rejected(self):
        w = world()
        mods = gov.get_modifiers(w)
        with self.assertRaises(GenesisError):
            plan_construct(w, "farm", 0, 0, mods)              # road
        with self.assertRaises(GenesisError):
            plan_construct(w, "farm", 99, 1, mods)             # outside
        b = next(iter(w.s["buildings"].values()))
        with self.assertRaises(GenesisError):
            plan_construct(w, "farm", b["x"], b["z"], mods)    # occupied
        with self.assertRaises(GenesisError):
            plan_construct(w, "castle", *free_tile(w), mods)
        w.s["economy"]["treasury"] = 10
        with self.assertRaises(GenesisError):
            plan_construct(w, "farm", *free_tile(w), mods)

    def test_upgrade_raises_output_and_cost(self):
        w = world(days=2)
        mods = gov.get_modifiers(w)
        farm = next(b for b in w.s["buildings"].values() if b["type"] == "farm")
        before = w.s["resources"]["food"]["potential"]
        upgrade(w, farm["id"], mods)
        advance(w, 1)
        self.assertGreater(w.s["resources"]["food"]["potential"], before)
        self.assertEqual(farm["level"], 2)

    def test_hospital_improves_healthcare_capacity_and_school_education(self):
        w = world(days=2)
        compute_services(w)
        self.assertGreater(w.s["services"]["health_capacity"], 0)
        self.assertGreater(w.s["services"]["school_seats"], 0)


class PolicyEnvironmentTests(unittest.TestCase):
    def test_environment_policy_reduces_pollution(self):
        a, b = world(days=5), world(days=5)
        gov.activate_policy(b, "environmental_protection")
        advance(a, 35)
        advance(b, 35)
        self.assertLess(b.s["environment"]["pollution"], a.s["environment"]["pollution"])
        self.assertLess(b.s["industry"]["potential"], a.s["industry"]["potential"])   # the stated disadvantage is real

    def test_policy_costs_money_and_reports_results(self):
        w = world()
        t = w.s["economy"]["treasury"]
        gov.activate_policy(w, "agricultural_development")
        self.assertEqual(w.s["economy"]["treasury"], t - 300)
        advance(w, 5)
        rep = gov.policy_report(w, "agricultural_development")
        self.assertTrue(rep and rep[0]["before"] is not None)
        with self.assertRaises(GenesisError):
            gov.activate_policy(w, "agricultural_development")

    def test_policy_requires_money_and_expires(self):
        w = world()
        w.s["economy"]["treasury"] = 100
        with self.assertRaises(GenesisError):
            gov.activate_policy(w, "healthcare_investment")
        w.s["economy"]["treasury"] = 5000
        gov.activate_policy(w, "healthcare_investment")
        advance(w, 41)
        self.assertFalse(w.s["policies"]["healthcare_investment"]["active"])

    def test_pollution_rises_with_more_factories(self):
        a, b = world(days=1), world(days=1)
        mods = gov.get_modifiers(b)
        for _ in range(3):
            b.s["economy"]["treasury"] += 2000
            b.s["resources"]["materials"]["stock"] += 500
            construct(b, "factory", *free_tile(b), mods)
        advance(a, 60)
        advance(b, 60)
        self.assertGreater(b.s["environment"]["pollution"], a.s["environment"]["pollution"])


class EventTests(unittest.TestCase):
    def test_events_occur_and_are_reproducible(self):
        a, b = world(days=150), world(days=150)
        names = [e["name"] for e in a.s["events"]["log"]] + [e["name"] for e in a.s["events"]["active"]]
        self.assertTrue(names)
        self.assertEqual(names, [e["name"] for e in b.s["events"]["log"]] + [e["name"] for e in b.s["events"]["active"]])

    def test_events_have_cause_duration_and_responses(self):
        w = world(days=150)
        e = (w.s["events"]["log"] + w.s["events"]["active"])[0]
        for k in ("cause", "consequences", "duration", "responses", "mods"):
            self.assertIn(k, e)

    def test_drought_reduces_water_supply(self):
        w = world(days=1)
        base = w.s["resources"]["water"]["production"]
        w.s["custom_mods"]["water"] = 0.5
        advance(w, 1)
        self.assertLess(w.s["resources"]["water"]["production"], base * 0.7)

    def test_explanations_are_generated_from_events(self):
        w = world(days=40)
        self.assertTrue(any(f["why"] and f["effect"] for f in w.s["feed"]))


class ResearchProgressionGRCTests(unittest.TestCase):
    def test_research_unlocks_technology_and_applies_effect(self):
        w = world(days=2)
        with self.assertRaises(GenesisError):
            rs.start_research(w, "industrial_automation")       # locked
        rs.start_research(w, "precision_agriculture")
        g0 = w.s["grc"]["balance"]
        for _ in range(200):
            advance(w, 1)
            if rs.is_unlocked(w, "precision_agriculture"):
                break
        self.assertTrue(rs.is_unlocked(w, "precision_agriculture"))
        w.s["events"]["active"] = []          # ignore temporary events such as droughts
        self.assertGreater(gov.get_modifiers(w)["food"], 1.15)
        self.assertGreater(w.s["grc"]["balance"], g0)

    def test_grc_rules(self):
        w = world()
        b = w.s["grc"]["balance"]
        self.assertTrue(grant_grc(w, 5, "test", "k1"))
        self.assertFalse(grant_grc(w, 5, "test again", "k1"))          # duplicate reward blocked
        self.assertEqual(w.s["grc"]["balance"], b + 5)
        with self.assertRaises(GenesisError):
            spend_grc(w, 10 ** 6, "too much", "s1")                    # no negative balances
        with self.assertRaises(GenesisError):
            spend_grc(w, -3, "negative", "s2")
        spend_grc(w, 5, "ok", "s3")
        self.assertEqual(w.s["grc"]["balance"], b)
        self.assertTrue(all(l["balance_after"] >= 0 for l in w.s["grc"]["ledger"]))

    def test_achievements_and_missions_reward_once(self):
        w = world(days=40)
        achieved = [a["id"] for a in w.s["progression"]["achievements"]]
        self.assertEqual(len(achieved), len(set(achieved)))
        self.assertGreater(w.s["progression"]["xp"], 0)


class ExperimentTests(unittest.TestCase):
    def test_experiment_lifecycle(self):
        w = world(days=5)
        w.s["grc"]["balance"] = 100
        rec = ex.start_experiment(w, "renewable_energy")
        self.assertEqual(rec["status"], "queued")
        self.assertEqual(w.s["grc"]["balance"], 80)
        day = w.day
        ex.run_experiment(w, rec["id"])
        self.assertEqual(rec["status"], "completed")
        self.assertEqual(w.day, day)                                    # the real civilisation is untouched
        r = rec["result"]
        self.assertEqual(len(r["branches"]), 2)
        self.assertEqual(r["kind"], "Actual simulation result")
        self.assertLess(r["branches"][1]["metrics"]["pollution"], r["branches"][0]["metrics"]["pollution"])

    def test_validation_and_failure_refund(self):
        w = world()
        w.s["grc"]["balance"] = 5
        with self.assertRaises(GenesisError):
            ex.start_experiment(w, "education_boost")
        w.s["grc"]["balance"] = 50
        rec = ex.start_experiment(w, "education_boost")
        with self.assertRaises(GenesisError):
            ex.start_experiment(w, "education_boost")                   # already queued
        original = ex.advance
        ex.advance = lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom"))
        try:
            ex.run_experiment(w, rec["id"])
        finally:
            ex.advance = original
        self.assertEqual(rec["status"], "failed")
        self.assertEqual(w.s["grc"]["balance"], 50)                     # refunded


class ScenarioPersistenceTests(unittest.TestCase):
    def test_branches_are_independent(self):
        w = world(days=10)
        snap = make_snapshot(w, "now")
        orig = clean(w)
        a = make_branch(snap["state"], "A", "education_focus", "W1", "main")
        b = make_branch(snap["state"], "B", "environment_focus", "W2", "main")
        advance(a, 30)
        advance(b, 30)
        self.assertEqual(clean(w), orig)                                # original unchanged
        self.assertTrue(a.s["policies"]["education_investment"]["active"])
        self.assertFalse(a.s["policies"]["environmental_protection"]["active"])
        self.assertFalse(b.s["policies"]["education_investment"]["active"])
        self.assertNotEqual(a.s["metrics"]["pollution"], b.s["metrics"]["pollution"])
        advance(w, 3)
        self.assertEqual(a.day, 40)
        table = compare_worlds([("main", "Original", w), ("W1", "A", a), ("W2", "B", b)])
        self.assertEqual(len(table["worlds"]), 3)
        self.assertIn("pollution", [r["key"] for r in table["rows"]])

    def test_save_and_load_round_trip(self):
        w = world(days=15)
        with tempfile.TemporaryDirectory() as d:
            st = Store(os.path.join(d, "t.db"))
            st.save_world(w)
            w2 = st.load_world("main")
            self.assertEqual(clean(w), clean(w2))
            advance(w, 5)
            advance(w2, 5)
            self.assertEqual(clean(w), clean(w2))                       # random state was saved too
            self.assertEqual(len(w2.s["history"]), len(w.s["history"]))

    def test_public_state_matches_world(self):
        w = world(days=3)
        st = public_state(w)
        self.assertEqual(len(st["citizens"]), len(w.s["citizens"]))
        self.assertEqual(len(st["buildings"]), len(w.s["buildings"]))
        self.assertEqual(st["metrics"]["population"], len(w.s["citizens"]))
        self.assertTrue(st["cards"] and st["recommendations"] is not None)


if __name__ == "__main__":
    unittest.main()
