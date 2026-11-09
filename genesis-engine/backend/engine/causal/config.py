"""
Causal Simulation Coupling Configuration.
Defines parameters, baseline hazard rates, and thresholds for the coupled simulation.
"""

from pydantic import BaseModel, Field


class CausalConfig(BaseModel):
    # Time step configuration
    days_per_tick: float = Field(default=1.0, description="Simulated days per engine tick")
    days_per_year: float = Field(default=365.0, description="Simulated days per engine year")

    # UN WPP / WHO Calibrated Baseline Demographic Rates (per 1,000 population per year)
    baseline_crude_birth_rate: float = Field(
        default=14.5,
        description="Crude birth rate per 1,000 population per year (UN WPP benchmark ~10-25)"
    )
    baseline_crude_death_rate: float = Field(
        default=7.8,
        description="Crude death rate per 1,000 population per year (WHO benchmark ~6-12)"
    )

    # Gompertz mortality parameters (calibrated to UN Life Tables)
    gompertz_a: float = Field(default=0.0001295, description="Gompertz initial mortality parameter")
    gompertz_b: float = Field(default=0.08016, description="Gompertz exponential aging acceleration")

    # Shortage Mortality Hazard Multipliers (per day of unmet need)
    starvation_hazard_coeff: float = Field(
        default=0.0018,
        description="Mortality hazard coefficient for acute food deprivation"
    )
    dehydration_hazard_coeff: float = Field(
        default=0.0045,
        description="Mortality hazard coefficient for acute water deprivation"
    )
    energy_deprivation_hazard_coeff: float = Field(
        default=0.0005,
        description="Mortality hazard coefficient from heating/power failure"
    )

    # Hospital & Healthcare Mechanics
    hospital_bed_retention_days: float = Field(
        default=4.0,
        description="Average length of hospital stay (days)"
    )
    hospital_overload_fatality_rate: float = Field(
        default=0.065,
        description="Daily fatality rate for critical overflow patients denied inpatient bed"
    )
    general_morbidity_rate: float = Field(
        default=0.085,
        description="Annual baseline fraction of population requiring acute medical admission (~85 per 1,000/yr)"
    )

    # Environmental Hazard
    pollution_hazard_threshold: float = Field(
        default=0.25,
        description="Pollution index above which respiratory/cardiovascular mortality begins"
    )
    pollution_hazard_coeff: float = Field(
        default=0.0004,
        description="Mortality hazard multiplier per unit of excess pollution"
    )

    # Citizen Satisfaction & Protest Parameters
    grievance_protest_threshold: float = Field(
        default=0.42,
        description="Citizen grievance score threshold that triggers public protests"
    )
    protest_contagion_rate: float = Field(
        default=0.55,
        description="Rate at which grievance escalates protest intensity"
    )
    protest_decay_rate: float = Field(
        default=0.25,
        description="Per-tick rate of protest de-escalation when grievances subside"
    )
    protest_mobilization_ratio: float = Field(
        default=0.045,
        description="Max fraction of population mobilized during high protest intensity"
    )

    # ML Safety Bounding
    ml_hazard_min_bound: float = Field(
        default=0.70,
        description="Lower multiplier bound for ML-inferred mortality hazards"
    )
    ml_hazard_max_bound: float = Field(
        default=1.40,
        description="Upper multiplier bound for ML-inferred mortality hazards"
    )


DEFAULT_CAUSAL_CONFIG = CausalConfig()
