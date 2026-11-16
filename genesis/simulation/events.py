"""Dynamic events. Some are random (seeded), some emerge from real conditions in the simulation."""
from .config import RESOURCES

DEFS = {
    "drought": dict(name="Drought", kind="warning", dur=(12, 20), mods={"water": 0.65, "food": 0.85},
        consequences="Water supply drops by 35% and harvests shrink by 15%.",
        responses=["Reduce water demand by avoiding new housing for now.", "Start the Infrastructure investment policy for +10% water.",
                   "Research Precision agriculture to use water more efficiently."]),
    "disease_outbreak": dict(name="Disease outbreak", kind="warning", dur=(10, 18), mods={"add_disease": 0.02},
        consequences="More citizens fall ill each day and hospitals fill up.",
        responses=["Build or upgrade a hospital.", "Start the Healthcare investment policy.", "Research Public health systems."]),
    "supply_disruption": dict(name="Supply disruption", kind="warning", dur=(6, 10), mods={"materials": 0.5, "industry": 0.9},
        consequences="Raw material supply is cut in half and factories slow down.",
        responses=["Avoid expensive construction until supplies recover.", "Research Advanced materials."]),
    "economic_challenge": dict(name="Economic challenge", kind="warning", dur=(15, 25), mods={"income": 0.88},
        consequences="Economic output and wages fall by about 12%.",
        responses=["Support industrial development to create jobs.", "Keep the treasury healthy."]),
    "environmental_crisis": dict(name="Environmental crisis", kind="critical", dur=(15, 30), mods={"water": 0.9, "food": 0.9, "add_disease": 0.005},
        consequences="Dirty air and water reduce harvests and water supply, and more people fall ill.",
        responses=["Start the Environmental protection policy.", "Build parks.", "Research Renewable energy."]),
    "festival": dict(name="Festival", kind="good", dur=(3, 3), mods={"add_happiness": 2.5},
        consequences="Citizens celebrate; happiness rises. The festival costs 60 from the treasury.", responses=["Enjoy it!"]),
    "agricultural_breakthrough": dict(name="Agricultural breakthrough", kind="good", dur=(20, 25), mods={"food": 1.12},
        consequences="Farmers discover better methods: +12% food.", responses=["Store the surplus food for harder times."]),
    "scientific_discovery": dict(name="Scientific discovery", kind="good", dur=(1, 1), mods={},
        consequences="Researchers made a surprise breakthrough worth +25 research points.", responses=["Choose a technology to research."]),
}
for _res in RESOURCES:
    DEFS[f"shortage_{_res}"] = dict(name=f"{_res.capitalize()} shortage", kind="warning", dur=(1, 1), mods={},
        consequences="Citizens and buildings receive less than they need.", responses=[])

RANDOM = [("drought", 0.010), ("supply_disruption", 0.008), ("festival", 0.012), ("agricultural_breakthrough", 0.008),
          ("scientific_discovery", 0.008), ("disease_outbreak", 0.003), ("economic_challenge", 0.003)]
COOLDOWN = 20


def new_events_state():
    return {"active": [], "log": [], "cooldowns": {}, "unemp_days": 0}


def _start(w, etype, cause, origin, action_extra=None, duration=None):
    s = w.s
    d = DEFS[etype]
    dur = duration or w.rng.randint(*d["dur"])
    e = {"id": w.next_id("E"), "type": etype, "name": d["name"], "start": w.day, "duration": dur, "ends": w.day + dur,
         "active": True, "origin": origin, "cause": cause, "consequences": d["consequences"],
         "responses": action_extra or d["responses"], "mods": dict(d["mods"]), "kind": d["kind"]}
    s["events"]["active"].append(e)
    s["events"]["cooldowns"][etype] = w.day
    w.feed(d["kind"], d["name"] + " begins", f"{d['name']} has started and will last about {dur} days.",
           why=cause, effect=d["consequences"], action=" ".join(e["responses"][:2]))
    return e


def step_events(w, mods):
    s = w.s
    r = w.rng
    ev = s["events"]
    R, env, sv = s["resources"], s["environment"], s["services"]
    day = w.day
    # end finished events
    for e in list(ev["active"]):
        done = day >= e["ends"]
        if e["type"].startswith("shortage_"):
            done = R[e["type"].split("_")[1]]["shortage_days"] == 0
        elif e["type"] == "environmental_crisis":
            done = day >= e["ends"] and env["pollution"] < 50 and env["env_health"] >= 50
        if done:
            e["active"] = False
            e["ended"] = day
            ev["active"].remove(e)
            ev["log"].append(e)
            del ev["log"][:-60]
            if e["type"] != "scientific_discovery" and e["type"] != "festival":
                w.feed("info", e["name"] + " has ended", f"{e['name']} is over after {day - e['start']} days.",
                       why="Its duration ran out or conditions improved.", effect="Normal conditions return.")
    active = {e["type"] for e in ev["active"]}

    def can(t):
        return t not in active and day - ev["cooldowns"].get(t, -999) >= COOLDOWN

    rolls = [(t, r.random() < p) for t, p in RANDOM]          # fixed number of draws per day
    extra = r.random()
    labour = [c for c in s["citizens"].values() if c["profession"] not in ("child", "student", "retired")]
    unemp = sum(1 for c in labour if not c["employed"]) / len(labour) if labour else 0.0
    ev["unemp_days"] = ev["unemp_days"] + 1 if unemp > 0.18 else 0
    # emergent events, driven by actual conditions
    for res in RESOURCES:
        t = f"shortage_{res}"
        if R[res]["shortage_days"] >= 3 and t not in active:
            rr = R[res]
            _start(w, t, f"{res.capitalize()} demand ({rr['demand']:.0f}/day) is higher than production ({rr['production']:.0f}/day) "
                         f"and the stock is nearly empty.", "conditions",
                   {"food": ["Build another farm.", "Start Agricultural development."],
                    "water": ["Start Infrastructure investment or Environmental protection.", "Build fewer new homes for now."],
                    "energy": ["Build another power plant.", "Research Renewable energy."],
                    "materials": ["Build fewer buildings for now.", "Research Advanced materials."]}[res])
            active.add(t)
    if can("disease_outbreak") and (sv["health_coverage"] < 0.8 or env["pollution"] > 45) and extra < 0.004 * (1 + env["pollution"] / 40):
        cause = ("Hospitals cannot treat everyone, so illness spreads." if sv["health_coverage"] < 0.8
                 else f"Pollution ({env['pollution']:.0f}/100) weakens people's health.")
        _start(w, "disease_outbreak", cause, "conditions")
        active.add("disease_outbreak")
    if can("environmental_crisis") and (env["pollution"] > 65 or env["env_health"] < 45):
        _start(w, "environmental_crisis", f"Pollution reached {env['pollution']:.0f}/100 and environmental health is {env['env_health']:.0f}/100.", "conditions")
        active.add("environmental_crisis")
    if can("economic_challenge") and ev["unemp_days"] >= 5:
        _start(w, "economic_challenge", f"Unemployment has stayed above 18% for {ev['unemp_days']} days.", "conditions")
        active.add("economic_challenge")
    # random events
    farms = any(b["type"] == "farm" and b["status"] == "active" for b in s["buildings"].values())
    labs = any(b["type"] == "research_centre" and b["status"] == "active" for b in s["buildings"].values())
    for t, hit in rolls:
        if not hit or not can(t):
            continue
        if t == "festival":
            if s["economy"]["treasury"] < 160:
                continue
            s["economy"]["treasury"] -= 60
            s["economy"]["spend_today"]["policies"] += 60
            _start(w, t, "Citizens organised a festival.", "random")
        elif t == "scientific_discovery":
            if not labs:
                continue
            s["research"]["pool"] += 25
            _start(w, t, "A research team had a lucky breakthrough.", "random", duration=1)
        elif t == "agricultural_breakthrough":
            if farms:
                _start(w, t, "Farmers shared a better planting technique.", "random")
        elif t in ("disease_outbreak", "economic_challenge"):
            _start(w, t, "A sudden outside shock hit the civilisation.", "random")
        else:
            _start(w, t, "Unlucky weather and trade conditions.", "random")
        active.add(t)
