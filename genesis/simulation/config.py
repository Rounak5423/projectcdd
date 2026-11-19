"""Static game data. Change numbers here to rebalance the civilisation."""

DAYS_PER_YEAR = 60      # 1 simulation day = 1 tick; a citizen ages one year every 60 days
MAP_SIZE = 36           # tiles per side
ROAD_STEP = 6           # roads run on every 6th tile row/column
MAX_LEVEL = 3
LIVING_COST = 7.0       # daily cost of living for an adult
FOOD_PER_CITIZEN = 0.9
WATER_PER_CITIZEN = 0.8
ENERGY_PER_CITIZEN = 0.25
FARM_OUTPUT = 44.0
POWER_OUTPUT = 110.0
FACTORY_GOODS = 50.0
FACTORY_MATERIAL_USE = 10.0
BASE_EXTRACTION = 30.0
RESEARCH_RATE = 3.0     # research points per research centre at full staffing
BIRTH_RATE_YEAR = 0.50  # births per eligible woman per simulated year
RESOURCES = ("food", "water", "energy", "materials")

SKILLS = ["farming", "medicine", "teaching", "engineering", "science",
          "industry", "business", "construction", "admin", "service"]

# profession: (primary skill, daily wage, minimum education level, minimum skill)
PROFESSIONS = {
    "farmer": ("farming", 9, 0, 8),
    "doctor": ("medicine", 30, 3, 30),
    "nurse": ("medicine", 16, 2, 15),
    "teacher": ("teaching", 15, 2, 20),
    "engineer": ("engineering", 22, 3, 30),
    "scientist": ("science", 26, 3, 30),
    "researcher": ("science", 22, 3, 25),
    "factory_worker": ("industry", 12, 1, 8),
    "business_owner": ("business", 28, 1, 20),
    "construction_worker": ("construction", 13, 1, 8),
    "government_employee": ("admin", 17, 2, 15),
    "service_worker": ("service", 10, 0, 5),
}
EDUCATION_NAMES = ["No schooling", "Primary", "Secondary", "University"]

BUILDINGS = {
    "residential": dict(
        label="Housing block", cost=350, materials=50, build_days=3, capacity=14, jobs={},
        energy=3, water=0, maintenance=3, storage={"water": 60},
        purpose="Gives citizens a place to live.",
        benefit="Each block houses 14 people (more when upgraded). Homeless citizens are unhappy, and new families need homes.",
        limitation="Costs money and a little energy every day."),
    "farm": dict(
        label="Farm", cost=300, materials=30, build_days=3, capacity=0, jobs={"farmer": 6},
        energy=2, water=10, maintenance=3, storage={"food": 150},
        purpose="Grows food for everyone.",
        benefit="Produces about 44 food a day when fully staffed and the environment is healthy.",
        limitation="Needs water and farmers. Drought and pollution reduce harvests."),
    "hospital": dict(
        label="Hospital", cost=800, materials=80, build_days=5, capacity=40,
        jobs={"doctor": 3, "nurse": 5}, energy=10, water=4, maintenance=8, storage={},
        purpose="Improves healthcare capacity.",
        benefit="Treats up to 40 sick or weak citizens a day, so more people recover and fewer die.",
        limitation="Needs doctors and nurses (educated citizens) and costs money to run."),
    "school": dict(
        label="School", cost=500, materials=60, build_days=4, capacity=45,
        jobs={"teacher": 5}, energy=3, water=0, maintenance=5, storage={},
        purpose="Educates children and teenagers.",
        benefit="Gives 45 school places. Pupils who attend regularly finish primary and secondary education.",
        limitation="Needs teachers. Too few places leaves children without schooling."),
    "university": dict(
        label="University", cost=1400, materials=140, build_days=7, capacity=25,
        jobs={"teacher": 4, "researcher": 3}, energy=8, water=0, maintenance=12, storage={},
        purpose="Advanced education and research.",
        benefit="25 university places for talented students, plus it boosts research centres.",
        limitation="Expensive and needs highly educated staff."),
    "factory": dict(
        label="Factory", cost=900, materials=90, build_days=5, capacity=0,
        jobs={"factory_worker": 10, "engineer": 1}, energy=25, water=8, maintenance=7,
        storage={"materials": 120},
        purpose="Makes goods and creates jobs.",
        benefit="Boosts the economy (GDP) and employs 11 people.",
        limitation="Uses energy, water and raw materials, and causes pollution."),
    "power_plant": dict(
        label="Power plant", cost=1000, materials=100, build_days=6, capacity=0,
        jobs={"engineer": 4, "factory_worker": 2}, energy=0, water=0, maintenance=9,
        storage={"energy": 150},
        purpose="Generates energy for homes and buildings.",
        benefit="Produces about 110 energy a day. Without energy, farms and factories slow down.",
        limitation="Causes pollution until renewable energy is researched."),
    "research_centre": dict(
        label="Research centre", cost=1200, materials=100, build_days=6, capacity=0,
        jobs={"scientist": 4, "researcher": 2}, energy=12, water=0, maintenance=10, storage={},
        purpose="Produces research points to unlock technologies.",
        benefit="About 3 research points a day when fully staffed; universities make it faster.",
        limitation="Needs scientists, which only come from university education."),
    "park": dict(
        label="Park", cost=200, materials=10, build_days=2, capacity=0, jobs={"service_worker": 1},
        energy=0, water=0, maintenance=2, storage={},
        purpose="Green space for wellbeing and cleaner air.",
        benefit="Citizens socialise and relax here, and parks absorb pollution and add green cover.",
        limitation="Costs upkeep and takes up land."),
}

GLOSSARY = {
    "gdp": "GDP means the total value of goods and services produced by the civilisation each day.",
    "population": "Population is the number of living citizens. It grows through births and newcomers, and shrinks through deaths and people leaving.",
    "population_growth": "Population growth is the change in the number of citizens over time.",
    "resource_shortage": "A resource shortage happens when the civilisation needs more of a resource than it currently has available.",
    "environmental_health": "Environmental health is a 0-100 score combining clean air, green land and water. Low scores make people ill and harvests smaller.",
    "employment_rate": "The employment rate is the share of working-age citizens who have a job.",
    "unemployed": "Unemployed citizens are adults who want a job but do not have one yet. They may retrain to learn new skills.",
    "inequality": "Economic inequality measures how unevenly savings are shared. 0 means everyone is equal; 1 means one person owns everything.",
    "research_points": "Research points are produced by research centres and spent automatically on the technology you are researching.",
    "grc": "Genesis Research Credits (GRC) are earned from achievements, missions and technologies. You spend them to run experiments. They never change an experiment's result.",
    "simulation_ticks": "A tick is one simulation day. Each tick, everyone in the civilisation acts once, then resources, economy and environment update.",
    "happiness": "Happiness is the average mood of citizens. It depends on food, water, rest, health, income, housing, jobs and the environment.",
    "health": "Health is the average physical condition of citizens (0-100). Hunger, illness, pollution and old age reduce it; hospitals help it recover.",
    "treasury": "The treasury is the government's money. Taxes fill it; buildings, policies, pensions and benefits drain it.",
    "education": "Education level runs from none to primary, secondary and university. Doctors, engineers and scientists need university.",
}
