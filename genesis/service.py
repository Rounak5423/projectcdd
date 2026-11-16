"""GenesisService: the single place where user actions are validated and applied to the world.

The browser never calculates anything authoritative; it only asks this service. Routes in genesis/api
are thin wrappers, which also makes this class easy to test without a web server.
"""
import asyncio
import threading
import time
from .errors import GenesisError
from .persistence.store import Store
from .simulation import experiments as ex, infrastructure as infra, governance as gov, research as rs
from .simulation.config import BUILDINGS, GLOSSARY, EDUCATION_NAMES, DAYS_PER_YEAR, PROFESSIONS
from .simulation.engine import tick, advance, public_state
from .simulation.progression import ACHIEVEMENTS, mission_progress
from .simulation.scenarios import PRESETS, make_snapshot, make_branch, compare_worlds
from .simulation.seed import create_world

SPEEDS = (1, 2, 5, 10)
ACTIVITY_TEXT = {"work": "working", "study": "studying", "retrain": "training for a new job", "seek_work": "looking for work",
                 "rest": "resting", "socialise": "spending time with others", "play": "playing", "healthcare": "getting medical care"}
GOAL_TEXT = {"find_job": "find a job", "retrain": "learn new skills to get a job", "study": "finish their education",
             "get_healthy": "get healthy again", "save_money": "build up some savings", "raise_family": "raise a family",
             "contribute": "contribute to the community"}


class GenesisService:
    def __init__(self, settings):
        self.cfg = settings
        self.store = Store(settings.db_path)
        self.lock = threading.RLock()
        self.running = False
        self._task = None
        self.broadcast = None            # async callable(dict) set by the API for WebSocket updates
        w = self.store.load_world("main")
        if w is None:
            w = create_world(settings.seed, "My Civilisation")
            self.store.save_world(w)
        else:
            self._offline(w)
        w.s["meta"]["status"] = "paused"    # the world never starts by itself after a restart
        self.main = w

    # ---------------------------------------------------------------- basics
    def _offline(self, w):
        """Optional, explicit offline progression. Off by default; never advances silently."""
        c = self.cfg
        saved = w.s["meta"].get("saved_at")
        if not (c.offline_progression and saved):
            return
        days = min(c.offline_max_days, int((time.time() - saved) / 3600 * c.offline_days_per_hour))
        if days > 0:
            advance(w, days)
            w.feed("info", "While you were away", f"{days} simulation days passed while GENESIS was closed.",
                   why=f"Offline progression is ON ({c.offline_days_per_hour} days per hour, max {c.offline_max_days}).",
                   effect="Your civilisation kept developing.", action="You can turn this off in your .env file.")

    def save(self):
        with self.lock:
            self.main.s["meta"]["saved_at"] = time.time()
            self.store.save_world(self.main)

    async def notify(self):
        if self.broadcast:
            await self.broadcast({"type": "state", "data": self.state()})

    def state(self):
        with self.lock:
            st = public_state(self.main)
            st["running"] = self.running
            st["speeds"] = list(SPEEDS)
            return st

    # ------------------------------------------------------------ simulation
    async def _runner(self):
        while self.running:
            with self.lock:
                tick(self.main)
                if self.main.day % self.cfg.autosave_days == 0:
                    self.save()
            await self.notify()
            await asyncio.sleep(max(0.05, 2.0 / self.main.s["meta"]["speed"]))

    def start(self):
        with self.lock:
            if self.running:
                return
            self.running = True
            self.main.s["meta"]["status"] = "running"
        self._task = asyncio.get_running_loop().create_task(self._runner())

    def pause(self):
        with self.lock:
            self.running = False
            self.main.s["meta"]["status"] = "paused"
            self.save()
        if self._task:
            self._task.cancel()
            self._task = None

    def step(self, days=1):
        with self.lock:
            if self.running:
                raise GenesisError("Pause the simulation before advancing day by day.")
            if not 1 <= days <= 30:
                raise GenesisError("You can advance between 1 and 30 days at a time.")
            advance(self.main, days)
            self.save()

    def set_speed(self, speed):
        if speed not in SPEEDS:
            raise GenesisError(f"Speed must be one of {list(SPEEDS)}.")
        with self.lock:
            self.main.s["meta"]["speed"] = speed

    # ------------------------------------------------------------ construction
    def construct(self, btype, x, z, confirm=False):
        with self.lock:
            w = self.main
            mods = gov.get_modifiers(w)
            plan = infra.plan_construct(w, btype, x, z, mods)
            if not confirm:
                return {"executed": False, "needs_confirmation": True, "preview": plan}
            b = infra.construct(w, btype, x, z, mods)
            self.save()
            return {"executed": True, "building": b, "message": f"Construction of the {plan['label'].lower()} has started."}

    def upgrade(self, bid, confirm=False):
        with self.lock:
            w = self.main
            mods = gov.get_modifiers(w)
            plan = infra.plan_upgrade(w, bid, mods)
            if not confirm:
                return {"executed": False, "needs_confirmation": True, "preview": plan}
            b = infra.upgrade(w, bid, mods)
            infra.compute_services(w)
            self.save()
            return {"executed": True, "building": b, "message": f"{plan['label']} upgraded to level {b['level']}."}

    # ---------------------------------------------------------------- policies
    def policy_preview(self, key):
        p = gov.check_policy(self.main, key)
        return {"key": key, "label": p["label"], "cost": p["cost"], "upkeep": p["upkeep"], "duration": p["duration"],
                "intended": p["intended"], "advantages": p["advantages"], "disadvantages": p["disadvantages"]}

    def policy_activate(self, key, confirm=False):
        with self.lock:
            prev = self.policy_preview(key)
            if not confirm:
                return {"executed": False, "needs_confirmation": True, "preview": prev}
            gov.activate_policy(self.main, key)
            self.save()
            return {"executed": True, "message": f"{prev['label']} is now active for {prev['duration']} days."}

    def policy_cancel(self, key):
        with self.lock:
            gov.cancel_policy(self.main, key)
            self.save()
            return {"executed": True, "message": "Policy cancelled."}

    def policies(self):
        with self.lock:
            out = []
            for k, p in gov.POLICIES.items():
                st = self.main.s["policies"][k]
                out.append({"key": k, "label": p["label"], "cost": p["cost"], "upkeep": p["upkeep"], "duration": p["duration"],
                            "intended": p["intended"], "advantages": p["advantages"], "disadvantages": p["disadvantages"],
                            "active": st["active"], "started": st["started"], "ends": st["ends"],
                            "report": gov.policy_report(self.main, k) if st["active"] else []})
            return out

    # ---------------------------------------------------------------- research
    def research_start(self, tech):
        with self.lock:
            rs.start_research(self.main, tech)
            self.save()
            return {"executed": True, "message": f"Now researching {rs.TECHS[tech]['label']}."}

    def research(self):
        with self.lock:
            w = self.main
            r = w.s["research"]
            techs = []
            for k, t in rs.TECHS.items():
                status, missing = rs.tech_status(w, k)
                techs.append({"key": k, "label": t["label"], "area": t["area"], "cost": t["cost"], "desc": t["desc"],
                              "status": status, "missing": missing, "progress": round(r["progress"].get(k, 0.0), 1)})
            return {"points_total": round(r["points_total"], 1), "rp_today": r["rp_today"], "pool": round(r["pool"], 1),
                    "current": r["current"], "techs": techs}

    # ------------------------------------------------------------- experiments
    def experiment_catalog(self):
        return [ex.experiment_info(k) for k in ex.EXPERIMENTS]

    def experiment_start(self, key, confirm=False):
        with self.lock:
            info = ex.check_experiment(self.main, key)
            if not confirm:
                return {"executed": False, "needs_confirmation": True, "preview": info,
                        "grc_balance": self.main.s["grc"]["balance"]}
            rec = ex.start_experiment(self.main, key)
            self.save()
            return {"executed": True, "experiment": rec, "message": "Experiment queued. Results appear in a moment."}

    def experiment_run(self, xid):
        with self.lock:
            rec = ex.run_experiment(self.main, xid)
            self.save()
            return rec

    def experiments(self):
        with self.lock:
            return {"experiments": self.main.s["experiments"], "grc": self.main.s["grc"],
                    "achievements": [dict(id=a["id"], name=a["name"], desc=a["desc"], grc=a["grc"],
                                          done=any(x["id"] == a["id"] for x in self.main.s["progression"]["achievements"]))
                                     for a in ACHIEVEMENTS],
                    "missions": mission_progress(self.main)}

    # ----------------------------------------------------- snapshots / branches
    def snapshot_create(self, name=""):
        with self.lock:
            w = self.main
            snap = make_snapshot(w, name.strip()[:60])
            sid = w.next_id("S")
            self.store.save_snapshot(sid, "main", snap, w)
            self.save()
            return {"id": sid, "name": snap["name"], "day": snap["day"]}

    def snapshots(self):
        return self.store.list_snapshots()

    def branch_create(self, preset="none", name="", snapshot_id=None):
        with self.lock:
            if snapshot_id:
                state = self.store.get_snapshot_state(snapshot_id)
                if state is None:
                    raise GenesisError("Snapshot not found.")
            else:
                self.main.s["meta"]["saved_at"] = time.time()
                state = self.main.to_json()
            bid = self.main.next_id("W")
            b = make_branch(state, name.strip()[:60], preset, bid, "main")
            self.store.save_world(b)
            self.save()
            return {"id": bid, "name": b.s["meta"]["name"], "day": b.day, "preset": preset}

    def branches(self):
        return self.store.list_worlds("branch")

    def branch_advance(self, bid, days):
        if not 1 <= days <= 120:
            raise GenesisError("You can advance a branch by 1 to 120 days.")
        with self.lock:
            b = self.store.load_world(bid)
            if not b or b.s["meta"]["kind"] != "branch":
                raise GenesisError("Branch not found.")
            advance(b, days)
            self.store.save_world(b)
            return {"id": bid, "day": b.day}

    def branch_delete(self, bid):
        if not self.store.delete_world(bid):
            raise GenesisError("Branch not found.")
        return {"deleted": bid}

    def compare(self, ids):
        with self.lock:
            items = []
            for i in ids:
                w = self.main if i == "main" else self.store.load_world(i)
                if not w:
                    raise GenesisError(f"World {i} not found.")
                items.append((i, w.s["meta"]["name"] if i != "main" else "Original civilisation", w))
            if len(items) < 2:
                raise GenesisError("Choose at least two civilisations to compare.")
            return compare_worlds(items)

    # ----------------------------------------------------------------- reading
    def citizen(self, cid):
        with self.lock:
            s = self.main.s
            c = s["citizens"].get(cid)
            if not c:
                raise GenesisError("That citizen is no longer in the civilisation.")
            def brief(i):
                o = s["citizens"].get(i)
                return {"id": i, "name": o["name"], "age": o["age"]} if o else None
            home = s["buildings"].get(c["home"])
            work = s["buildings"].get(c["employer"]) if c["employer"] else None
            job = c["profession"].replace("_", " ")
            summary = (f"{c['name']} is a {c['age']}-year-old {job} ({EDUCATION_NAMES[c['education']].lower()} education). "
                       f"Today they are {ACTIVITY_TEXT.get(c['activity'], c['activity'])}. Their goal is to {GOAL_TEXT.get(c['goal'], c['goal'])}.")
            return {"citizen": c, "education_name": EDUCATION_NAMES[c["education"]], "summary": summary,
                    "partner": brief(c["partner"]), "children": [x for x in (brief(i) for i in c["children"]) if x],
                    "home": home and {"id": home["id"], "x": home["x"], "z": home["z"]},
                    "workplace": work and {"id": work["id"], "type": work["type"], "x": work["x"], "z": work["z"]},
                    "activity_text": ACTIVITY_TEXT.get(c["activity"], c["activity"]), "goal_text": GOAL_TEXT.get(c["goal"], c["goal"])}

    def building(self, bid):
        with self.lock:
            s = self.main.s
            b = s["buildings"].get(bid)
            if not b:
                raise GenesisError("Building not found.")
            d = BUILDINGS[b["type"]]
            workers = [{"id": c["id"], "name": c["name"], "profession": c["profession"]}
                       for c in s["citizens"].values() if c["employer"] == bid][:40]
            residents = sum(1 for c in s["citizens"].values() if c["home"] == bid) if b["type"] == "residential" else None
            mods = gov.get_modifiers(self.main)
            up = None
            if b["status"] == "active" and b["level"] < 3:
                cost, mats = infra.upgrade_cost(self.main, b, mods)
                up = {"cost": cost, "materials": mats}
            return {"building": b, "info": {k: d[k] for k in ("label", "purpose", "benefit", "limitation", "maintenance", "capacity")},
                    "workers": workers, "residents": residents, "upgrade": up,
                    "maintenance_per_day": round(d["maintenance"] * infra.level_mult(b["level"]) * mods["maintenance"], 1)}

    def history(self, limit=400):
        with self.lock:
            return self.main.s["history"][-limit:]

    def catalog(self):
        with self.lock:
            mods = gov.get_modifiers(self.main)
            b = {}
            for k, d in BUILDINGS.items():
                cost, mats = infra.construction_cost(self.main, k, mods)
                b[k] = {**{f: d[f] for f in ("label", "build_days", "purpose", "benefit", "limitation", "maintenance", "capacity", "jobs")},
                        "cost": cost, "materials": mats}
            return {"buildings": b, "policies": self.policies(), "glossary": GLOSSARY, "presets": PRESETS_PUBLIC(),
                    "days_per_year": DAYS_PER_YEAR, "speeds": list(SPEEDS), "professions": list(PROFESSIONS),
                    "offline": {"enabled": self.cfg.offline_progression, "days_per_hour": self.cfg.offline_days_per_hour,
                                "max_days": self.cfg.offline_max_days},
                    "experiments": self.experiment_catalog()}

    # -------------------------------------------------------------- new world
    def new_world(self, seed, name, confirm=False):
        if not confirm:
            return {"executed": False, "needs_confirmation": True,
                    "preview": {"warning": "This replaces your current civilisation. Snapshots and branches are kept."}}
        with self.lock:
            self.running = False
            if self._task:
                self._task.cancel()
                self._task = None
            self.main = create_world(seed, name.strip()[:60] or "My Civilisation")
            self.save()
        return {"executed": True, "message": "A new civilisation was founded."}


def PRESETS_PUBLIC():
    return {k: {"label": v["label"], "description": v["description"]} for k, v in PRESETS.items()}
