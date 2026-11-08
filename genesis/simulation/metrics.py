"""Metrics computed from the real simulation state, plus plain-language explanations of them."""
from collections import Counter
from .config import GLOSSARY

HISTORY_KEYS = ["population", "employed", "unemployed", "unemployment_rate", "students", "avg_health", "avg_happiness",
                "avg_education", "education_pct", "food_availability", "water_availability", "energy_availability",
                "materials_availability", "resource_availability", "food_stock", "gdp", "treasury", "inequality",
                "poverty_rate", "pollution", "green_cover", "env_health", "births", "deaths", "research_total", "level"]


def compute_metrics(w):
    s = w.s
    cits = list(s["citizens"].values())
    n = len(cits)
    R, env, eco, sv = s["resources"], s["environment"], s["economy"], s["services"]
    prof = Counter(c["profession"] for c in cits)
    labour = [c for c in cits if c["profession"] not in ("child", "student", "retired")]
    employed = sum(1 for c in labour if c["employed"])
    unemployed = len(labour) - employed
    adults = [c for c in cits if c["age"] >= 18]

    def avg(key):
        return round(sum(c[key] for c in cits) / n, 2) if n else 0.0

    m = {
        "day": w.day, "population": n, "employed": employed, "unemployed": unemployed,
        "labour_force": len(labour),
        "unemployment_rate": round(unemployed / len(labour), 4) if labour else 0.0,
        "employment_rate": round(employed / len(labour), 4) if labour else 1.0,
        "students": prof["student"], "children": prof["child"], "retired": prof["retired"],
        "avg_health": avg("health"), "avg_happiness": avg("happiness"),
        "avg_education": round(sum(c["education"] for c in adults) / len(adults), 2) if adults else 0.0,
        "education_pct": round(sum(1 for c in adults if c["education"] >= 2) / len(adults), 3) if adults else 0.0,
        "school_coverage": round(sv["school_cov"], 3), "healthcare_coverage": round(sv["health_coverage"], 3),
        "homeless": sv["homeless"], "housing_capacity": sv["housing_capacity"],
        "gdp": round(eco["gdp"], 1), "gdp_growth": eco["growth"], "treasury": round(eco["treasury"], 1),
        "inequality": eco["gini"], "poverty_rate": eco["poverty_rate"], "economy_condition": eco["condition"],
        "pollution": round(env["pollution"], 2), "green_cover": round(env["green_cover"], 2),
        "env_health": round(env["env_health"], 2), "water_env": round(env["water_availability"], 2),
        "research_total": round(s["research"]["points_total"], 1), "techs": len(s["research"]["unlocked"]),
        "level": s["progression"]["level"], "grc": s["grc"]["balance"],
        "births": s["daily"].get("births", 0), "deaths": s["daily"].get("deaths", 0),
        "buildings": sum(1 for b in s["buildings"].values() if b["status"] == "active"),
        "professions": dict(prof),
    }
    for r in R:
        m[f"{r}_availability"] = round(R[r]["availability"], 3)
        m[f"{r}_stock"] = round(R[r]["stock"], 1)
        m[f"{r}_production"] = round(R[r]["production"], 1)
        m[f"{r}_demand"] = round(R[r]["demand"], 1)
    m["resource_availability"] = round(sum(R[r]["availability"] for r in R) / 4, 3)
    return m


def record_history(w):
    m = compute_metrics(w)
    s = w.s
    s["metrics"] = m
    s["history"].append({k: m[k] for k in HISTORY_KEYS} | {"day": m["day"]})
    return m


def _status(value, good, warn, higher_is_better=True):
    if higher_is_better:
        return "good" if value >= good else "warn" if value >= warn else "bad"
    return "good" if value <= good else "warn" if value <= warn else "bad"


LABEL = {"good": "Healthy", "warn": "Needs attention", "bad": "Critical", "info": "Information"}


def dashboard_cards(w, m):
    R = w.s["resources"]

    def res_card(key, label):
        a = m[f"{key}_availability"]
        st = _status(a, 0.98, 0.8)
        r = R[key]
        net = r["production"] - r["demand"]
        txt = (f"{label} is sufficient: {r['production']:.0f} made vs {r['demand']:.0f} needed per day." if st == "good" else
               f"{label} is short: {r['production']:.0f} made vs {r['demand']:.0f} needed per day; stock {r['stock']:.0f}.")
        return dict(key=f"{key}_availability", label=f"{label} availability", value=f"{a * 100:.0f}%", status=st,
                    text=txt, glossary="resource_shortage", net=net)

    cards = [
        dict(key="population", label="Total population", value=str(m["population"]), status="info",
             text=f"{m['births']} births and {m['deaths']} deaths today; {w.s['totals']['births']} born and {w.s['totals']['deaths']} died so far.",
             glossary="population"),
        dict(key="employed", label="Employed citizens", value=str(m["employed"]), status=_status(m["unemployment_rate"], 0.08, 0.15, False),
             text=f"{m['employed']} of {m['labour_force']} working-age citizens have a job ({m['employment_rate'] * 100:.0f}%).", glossary="employment_rate"),
        dict(key="unemployed", label="Unemployed citizens", value=str(m["unemployed"]), status=_status(m["unemployment_rate"], 0.08, 0.15, False),
             text=f"{m['unemployment_rate'] * 100:.1f}% of the workforce is looking for work; many are retraining.", glossary="unemployed"),
        dict(key="students", label="Students", value=str(m["students"]),
             status=_status(m["school_coverage"], 0.95, 0.7), text=f"School places cover {m['school_coverage'] * 100:.0f}% of pupils. "
             f"{m['education_pct'] * 100:.0f}% of adults finished secondary school.", glossary="education"),
        dict(key="avg_health", label="Average health", value=f"{m['avg_health']:.0f}/100", status=_status(m["avg_health"], 75, 55),
             text=f"Hospitals can treat {m['healthcare_coverage'] * 100:.0f}% of the people who need care.", glossary="health"),
        dict(key="avg_happiness", label="Average happiness", value=f"{m['avg_happiness']:.0f}/100", status=_status(m["avg_happiness"], 65, 45),
             text=f"{m['homeless']} citizens have no home; unemployment and pollution also lower mood.", glossary="happiness"),
        res_card("food", "Food"), res_card("water", "Water"), res_card("energy", "Energy"),
        dict(key="gdp", label="GDP per day", value=f"{m['gdp']:.0f}", status="info",
             text=f"Economy trend: {m['gdp_growth']:+.1f}% vs last week. Treasury {m['treasury']:.0f}.", glossary="gdp"),
        dict(key="economy_condition", label="Economic condition", value=m["economy_condition"],
             status=_status({"Booming": 3, "Growing": 3, "Stable": 2}.get(m["economy_condition"], 0), 3, 2),
             text=f"Inequality {m['inequality']:.2f} (0 = equal), poverty {m['poverty_rate'] * 100:.0f}% of adults.", glossary="inequality"),
        dict(key="env_health", label="Environmental condition", value=f"{m['env_health']:.0f}/100", status=_status(m["env_health"], 65, 45),
             text=f"Pollution {m['pollution']:.0f}/100, green cover {m['green_cover']:.0f}/100.", glossary="environmental_health"),
    ]
    for c in cards:
        c["status_text"] = LABEL[c["status"]]
        c["meaning"] = GLOSSARY.get(c["glossary"], "")
    return cards


def today_lines(w, prev, m):
    """Plain-language summary of what happened today, built only from real numbers."""
    d = w.s["daily"]
    lines = []
    net = d["births"] + d["immigrants"] - d["deaths"] - d["emigrants"]
    if net or d["births"] or d["deaths"]:
        parts = [f"{d['births']} born", f"{d['immigrants']} arrived", f"{d['deaths']} died", f"{d['emigrants']} left"]
        lines.append(dict(kind="good" if net > 0 else "warning" if net < 0 else "info",
                          what=f"Your population {'increased' if net > 0 else 'decreased' if net < 0 else 'stayed the same'}"
                               f"{' by ' + str(abs(net)) + (' person' if abs(net) == 1 else ' people') if net else ''} today.",
                          why=", ".join(parts) + ".",
                          effect=f"Population is now {m['population']}.", action=""))
    if d["jobs_found"] or d["jobs_lost"]:
        lines.append(dict(kind="good" if d["jobs_found"] >= d["jobs_lost"] else "warning",
                          what=f"{d['jobs_found']} citizens found work and {d['jobs_lost']} lost a job today.",
                          why="New vacancies appear when buildings open or get upgraded; jobs vanish when buildings lack staff slots or people retire.",
                          effect=f"Unemployment is {m['unemployment_rate'] * 100:.1f}%.", action=""))
    if d["graduates"]:
        lines.append(dict(kind="good", what=f"{d['graduates']} students graduated from university today.",
                          why="They attended enough classes.", effect="Doctors, engineers and scientists need this education.", action=""))
    for res, label in (("food", "Food"), ("water", "Water"), ("energy", "Energy"), ("materials", "Raw materials")):
        r = w.s["resources"][res]
        if r["shortage"]:
            lines.append(dict(kind="critical" if r["availability"] < 0.6 else "warning",
                              what=f"{label} production is lower than consumption.",
                              why=f"Production is {r['production']:.0f} a day but citizens and buildings need {r['demand']:.0f}.",
                              effect=f"Only {r['availability'] * 100:.0f}% of the need was met.",
                              action="See the recommendations in the Control tab."))
    if d["sick_new"] >= 3:
        lines.append(dict(kind="warning", what=f"{d['sick_new']} citizens fell ill today.", why="Illness spreads more with pollution or an outbreak.",
                          effect="Hospitals have more patients.", action="Consider a hospital or healthcare policy."))
    if prev and m["pollution"] - prev["pollution"] > 0.4:
        lines.append(dict(kind="warning", what="Pollution has increased.", why=f"Industrial activity and power plants added {w.s['environment']['emission_today']:.1f} pollution today.",
                          effect="Health and harvests suffer if it keeps rising.", action="Consider environmental protection or parks."))
    return lines


def explain_day(w, prev, m):
    """Write a few lasting feed entries for milestones (weekly summaries, threshold crossings)."""
    notified = w.s["meta"].setdefault("notified", {})

    def once(key, cooldown=15):
        if w.day - notified.get(key, -999) >= cooldown:
            notified[key] = w.day
            return True
        return False

    if prev:
        for lim in (40, 60):
            if prev["pollution"] < lim <= m["pollution"] and once(f"poll{lim}", 20):
                w.feed("warning", f"Pollution passed {lim}/100", f"Pollution rose to {m['pollution']:.0f}/100.",
                       why=f"Factories and power plants emit pollution (today {w.s['environment']['emission_today']:.1f}) faster than nature and parks clean it.",
                       effect="Citizens' health and harvests will decline.", action="Consider environmental protection, parks or renewable energy.")
        for lim in (0.1, 0.2):
            if prev["unemployment_rate"] < lim <= m["unemployment_rate"] and once(f"unemp{lim}", 20):
                w.feed("warning", f"Unemployment passed {lim * 100:.0f}%", f"{m['unemployed']} citizens are looking for work.",
                       why="The population grew faster than the number of jobs.", effect="Income and happiness fall.",
                       action="Build farms or factories, or start Industrial development.")
    if w.day % 7 == 0:
        h = w.s["history"]
        old = h[-7] if len(h) >= 7 else None
        if old:
            dp = m["population"] - old["population"]
            w.feed("info", f"Week summary (day {w.day})",
                   f"Population {'grew' if dp > 0 else 'fell' if dp < 0 else 'held steady'} by {abs(dp)} to {m['population']}; "
                   f"GDP is {m['gdp']:.0f}/day ({m['gdp_growth']:+.1f}%).",
                   why=f"Over the week there were {sum(x['births'] for x in h[-7:])} births and {sum(x['deaths'] for x in h[-7:])} deaths.",
                   effect=f"Unemployment {m['unemployment_rate'] * 100:.1f}%, happiness {m['avg_happiness']:.0f}/100, environment {m['env_health']:.0f}/100.", action="")
