"""Creating individual citizens."""
from .config import DAYS_PER_YEAR, SKILLS, PROFESSIONS

FIRST_F = ["Asha", "Maya", "Lena", "Priya", "Sofia", "Nadia", "Elena", "Ivy", "Zara", "Mei", "Amara",
           "Clara", "Dina", "Freya", "Hana", "Isla", "Jade", "Kira", "Lila", "Nora", "Rosa", "Tara"]
FIRST_M = ["Arjun", "Omar", "Leo", "Ravi", "Mateo", "Idris", "Noah", "Kai", "Sam", "Tomas", "Yusuf",
           "Dev", "Felix", "Gabe", "Hugo", "Ian", "Jonas", "Karan", "Liam", "Milo", "Owen", "Pavan"]
FAMILY = ["Rao", "Stone", "Okafor", "Silva", "Novak", "Chen", "Haddad", "Larsen", "Mehta", "Reyes",
          "Kovac", "Bauer", "Nair", "Ortiz", "Frost", "Ibrahim", "Moreau", "Tanaka", "Walker", "Young"]


def remember(c, day, text):
    c["memories"].append({"day": day, "text": text})
    if len(c["memories"]) > 12:
        del c["memories"][0]


def new_citizen(w, age, sex=None, profession="unemployed", education=0, surname=None,
                parents=None, savings=None, field=None, home=None):
    r = w.rng
    sex = sex or r.choice("FM")
    name = r.choice(FIRST_F if sex == "F" else FIRST_M)
    surname = surname or r.choice(FAMILY)
    intel = {k: round(min(1.0, max(0.0, r.gauss(0.5, 0.18))), 2)
             for k in ("analytical", "creativity", "social", "discipline")}
    learning = 0.35 + 0.45 * intel["analytical"] + 0.3 * intel["discipline"] + 0.25 * intel["creativity"]
    learning = round(min(1.3, max(0.3, learning + r.gauss(0, 0.05))), 2)
    skills = {k: round(r.uniform(0, 10), 1) for k in SKILLS}
    if age >= 18:
        for k in SKILLS:
            skills[k] = round(skills[k] + r.uniform(0, 12), 1)
    if profession in PROFESSIONS:
        prim, _, _, minskill = PROFESSIONS[profession]
        skills[prim] = round(max(skills[prim], minskill + r.uniform(2, 25)), 1)
    if field:
        skills[field] = round(max(skills[field], 35 + r.uniform(0, 10)), 1)
    cid = w.next_id("C")
    day = w.day
    c = {
        "id": cid, "name": f"{name} {surname}", "family_name": surname, "sex": sex,
        "birth_day": day - age * DAYS_PER_YEAR - r.randint(0, DAYS_PER_YEAR - 1), "age": age,
        "profession": profession, "employed": profession in PROFESSIONS, "employer": None,
        "education": education, "edu_days": 0.0, "uni_days": 0.0, "uni": False,
        "intel": intel, "learning": learning, "skills": skills,
        "health": round(min(100, max(50, r.gauss(85, 8))), 1), "happiness": round(r.uniform(55, 75), 1),
        "income": 0.0, "savings": round(savings if savings is not None else r.uniform(20, 200), 1),
        "needs": {"food": 80.0, "water": 80.0, "rest": 70.0, "social": 60.0, "purpose": 60.0},
        "goal": "contribute", "activity": "resting", "target_prof": None,
        "partner": None, "parents": parents or [], "children": [], "last_birth": -999,
        "home": home, "x": 18.0, "z": 18.0, "sick_days": 0, "memories": [],
    }
    remember(c, day, "Joined the civilisation." if age >= 1 else "Was born.")
    w.s["citizens"][cid] = c
    return c
