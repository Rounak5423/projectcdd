"""Income, taxes, treasury, GDP and inequality."""
from collections import Counter
from .config import PROFESSIONS, LIVING_COST

TAX_RATE = 0.10
BUSINESS_TAX = 0.03
PENSION = 4.0
BENEFIT = 2.0
REF_GDP_PER_WORKER = 10.5


def new_economy(treasury):
    return {"gdp": 0.0, "gdp_hist": [], "gdp_avg7": 0.0, "growth": 0.0, "prosperity": 1.0,
            "income_total": 0.0, "tax_revenue": 0.0, "treasury": float(treasury),
            "spend_today": {"maintenance": 0.0, "policies": 0.0, "pensions": 0.0, "benefits": 0.0},
            "gini": 0.0, "poverty_rate": 0.0, "condition": "Stable", "avg_income": 0.0}


def gini(values):
    v = sorted(values)
    n = len(v)
    tot = sum(v)
    if n == 0 or tot <= 0:
        return 0.0
    cum = sum((i + 1) * x for i, x in enumerate(v))
    return max(0.0, min(1.0, (2 * cum) / (n * tot) - (n + 1) / n))


def step_economy(w, mods):
    s = w.s
    eco = s["economy"]
    R = s["resources"]
    cits = list(s["citizens"].values())
    eco["spend_today"] = {"maintenance": 0.0, "policies": 0.0, "pensions": 0.0, "benefits": 0.0}
    cnt = Counter(c["profession"] for c in cits if c["employed"])
    gdp = (s["industry"]["output"] * 2.0 + R["food"]["production"] * 1.2 + R["energy"]["production"] * 0.4
           + R["materials"]["production"] * 0.8 + cnt["service_worker"] * 10 + cnt["government_employee"] * 8
           + (cnt["teacher"] + cnt["doctor"] + cnt["nurse"]) * 14 + cnt["construction_worker"] * 10
           + cnt["business_owner"] * 14 + s["research"]["rp_today"] * 20)
    gdp *= mods["income"]
    workers = sum(cnt.values())
    prosperity = max(0.6, min(1.4, gdp / (max(1, workers) * REF_GDP_PER_WORKER)))
    income_total = tax = pensions = benefits = 0.0
    adults, poor = 0, 0
    for c in cits:
        inc = 0.0
        if c["employed"]:
            prim, wage, _, _ = PROFESSIONS[c["profession"]]
            inc = wage * (0.8 + c["skills"][prim] / 200) * prosperity
            t = inc * TAX_RATE
            tax += t
        elif c["profession"] == "retired":
            inc = PENSION
            pensions += inc
            t = 0.0
        elif c["profession"] == "unemployed" and c["age"] >= 18 and eco["treasury"] > 0:
            inc = BENEFIT
            benefits += inc
            t = 0.0
        else:
            t = 0.0
        c["income"] = round(inc, 2)
        income_total += inc
        if c["age"] >= 18 and c["profession"] != "student":     # students are supported by their families
            adults += 1
            net = inc - t - LIVING_COST
            sv = c["savings"] + net
            if sv > 200:
                sv -= 0.02 * (sv - 200)                          # rich citizens spend part of their savings
            c["savings"] = max(0.0, round(sv, 2))
            if inc < LIVING_COST:
                poor += 1
    revenue = tax + gdp * BUSINESS_TAX
    out = min(pensions + benefits, eco["treasury"] + revenue)
    eco["treasury"] += revenue - out
    eco["spend_today"]["pensions"] = pensions
    eco["spend_today"]["benefits"] = benefits
    eco["tax_revenue"] = revenue
    eco["income_total"] = income_total
    eco["gdp"] = gdp
    eco["prosperity"] = prosperity
    eco["gdp_hist"].append(gdp)
    del eco["gdp_hist"][:-14]
    h = eco["gdp_hist"]
    recent = sum(h[-7:]) / len(h[-7:])
    older = h[:-7]
    eco["gdp_avg7"] = recent
    eco["growth"] = round(100 * (recent / (sum(older) / len(older)) - 1), 2) if older and sum(older) > 0 else 0.0
    eco["gini"] = round(gini([c["savings"] for c in cits if c["age"] >= 18 and c["profession"] != "student"]), 3)
    eco["poverty_rate"] = round(poor / adults, 3) if adults else 0.0
    eco["avg_income"] = round(income_total / max(1, workers), 2)
    labour = [c for c in cits if c["profession"] not in ("child", "student", "retired")]
    unemp = sum(1 for c in labour if not c["employed"]) / len(labour) if labour else 0.0
    g = eco["growth"]
    eco["condition"] = ("In recession" if unemp > 0.2 or g < -3 else "Booming" if g > 2 else
                        "Growing" if g > 0.3 else "Stable" if g > -0.5 else "Struggling")
