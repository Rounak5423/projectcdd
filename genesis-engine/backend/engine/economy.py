from typing import List, Tuple
from .models import Citizen, Resources, EconomyStats


def calculate_gini_coefficient(wealth_list: List[float]) -> float:
    """
    Computes Gini coefficient using the discrete formulation:
    Gini = (2 * sum(i * w_i)) / (n * sum(w_i)) - (n + 1) / n
    where w_i are sorted ascending wealth values (1-indexed).
    """
    valid_wealth = [max(0.0, w) for w in wealth_list]
    n = len(valid_wealth)
    if n <= 1:
        return 0.0

    valid_wealth.sort()
    total_wealth = sum(valid_wealth)
    if total_wealth <= 0.0:
        return 0.0

    # 1-indexed i * w_i sum
    weighted_sum = sum((i + 1) * w for i, w in enumerate(valid_wealth))
    gini = (2.0 * weighted_sum) / (n * total_wealth) - ((n + 1.0) / n)
    return round(max(0.0, min(1.0, gini)), 4)


def calculate_civic_stability(gini: float) -> float:
    """
    Civic Stability: S_civic = max(0.2, 1.0 - 0.8 * Gini)
    """
    stability = 1.0 - 0.8 * gini
    return round(max(0.2, min(1.0, stability)), 4)


def process_economy_tick(
    citizens: List[Citizen],
    resources: Resources,
    ubi_amount: float = 0.0,
    automation_tax_rate: float = 0.0
) -> Tuple[Resources, EconomyStats]:
    """
    Simulates one tick of resource consumption, production, and wealth updates.
    """
    alive_citizens = [c for c in citizens if c.is_alive]
    n = len(alive_citizens)

    if n == 0:
        return resources, EconomyStats(
            gini=0.0,
            civic_stability=0.2,
            average_wealth=0.0,
            total_wealth=0.0,
            macro_innovation_index=0.0,
            avg_ai_dependency=0.0,
            avg_reasoning=0.0,
            avg_problem_solving=0.0
        )

    # 1. Resource Consumption
    food_needed = n * 1.0
    water_needed = n * 1.0
    energy_needed = n * 0.8

    food_deficit = max(0.0, food_needed - resources.food)
    water_deficit = max(0.0, water_needed - resources.water)
    energy_deficit = max(0.0, energy_needed - resources.energy)

    resources.food = max(0.0, resources.food - food_needed)
    resources.water = max(0.0, resources.water - water_needed)
    resources.energy = max(0.0, resources.energy - energy_needed)

    scarcity_ratio = (food_deficit + water_deficit + energy_deficit) / (food_needed + water_needed + energy_needed + 1e-6)

    # 2. Production & Wealth Earnings
    tax_pool = 0.0

    for c in alive_citizens:
        # Needs update based on scarcity
        if food_deficit > 0:
            c.needs.hunger = min(1.0, c.needs.hunger + 0.15)
            c.needs.wellbeing = max(0.0, c.needs.wellbeing - 0.1)
        else:
            c.needs.hunger = max(0.0, c.needs.hunger - 0.1)
            c.needs.wellbeing = min(1.0, c.needs.wellbeing + 0.02)

        efficiency = 0.5 + (0.5 * c.cognitive.problem_solving) * (1.0 - c.needs.hunger * 0.5)

        # Base productivity by occupation
        occ = c.demographics.occupation
        earned_wealth = 0.0

        if occ == "Farmer":
            produced = 4.0 * efficiency
            resources.food += produced
            earned_wealth = 8.0 * efficiency
        elif occ == "Engineer":
            resources.water += 3.5 * efficiency
            resources.energy += 3.0 * efficiency
            earned_wealth = 12.0 * efficiency
        elif occ == "Builder":
            resources.materials += 3.0 * efficiency
            earned_wealth = 10.0 * efficiency
        elif occ == "Scholar":
            resources.energy += 0.5 * efficiency
            earned_wealth = 14.0 * efficiency
        elif occ == "Merchant":
            earned_wealth = 18.0 * efficiency

        # Automation tax on high earners if active
        if automation_tax_rate > 0.0 and earned_wealth > 10.0:
            tax = earned_wealth * automation_tax_rate
            tax_pool += tax
            earned_wealth -= tax

        cost_of_living = 3.0 + (scarcity_ratio * 4.0)
        c.demographics.wealth = max(0.0, c.demographics.wealth + earned_wealth - cost_of_living)

    # 3. UBI & Tax Pool Redistribution
    if ubi_amount > 0.0 or tax_pool > 0.0:
        redistribution_per_citizen = ubi_amount + (tax_pool / n)
        for c in alive_citizens:
            c.demographics.wealth += redistribution_per_citizen

    # 4. Economic Telemetry Calculations
    wealth_list = [c.demographics.wealth for c in alive_citizens]
    gini = calculate_gini_coefficient(wealth_list)
    civic_stability = calculate_civic_stability(gini)
    total_wealth = sum(wealth_list)
    average_wealth = round(total_wealth / n, 2)

    # Cognitive Averages
    avg_ai_dependency = round(sum(c.cognitive.ai_dependency for c in alive_citizens) / n, 4)
    avg_reasoning = round(sum(c.cognitive.independent_reasoning for c in alive_citizens) / n, 4)
    avg_problem_solving = round(sum(c.cognitive.problem_solving for c in alive_citizens) / n, 4)

    from .cognitive import calculate_macro_innovation_index
    macro_innovation = calculate_macro_innovation_index(alive_citizens)

    stats = EconomyStats(
        gini=gini,
        civic_stability=civic_stability,
        average_wealth=average_wealth,
        total_wealth=round(total_wealth, 2),
        macro_innovation_index=macro_innovation,
        avg_ai_dependency=avg_ai_dependency,
        avg_reasoning=avg_reasoning,
        avg_problem_solving=avg_problem_solving
    )

    return resources, stats

