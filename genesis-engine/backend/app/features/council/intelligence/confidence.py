"""
CIVORA — Council Intelligence Confidence Calculation
Computes defensible confidence metrics grounded in real data completeness and history depth.
"""

from typing import Set
from app.features.council.intelligence.context import CivilisationContext


def calculate_domain_confidence(
    context: CivilisationContext,
    required_indicators: Set[str]
) -> float:
    """
    Computes a mathematically defensible confidence score in [0.50, 0.98]:
    - Data completeness (50% weight): ratio of available domain indicators.
    - Historical depth (30% weight): presence of longitudinal trend telemetry.
    - Demographics validity (20% weight): size of citizen sampling backing the state.
    """
    # 1. Data completeness
    missing_count = len(required_indicators.intersection(context.missing_indicators))
    total_count = max(len(required_indicators), 1)
    available_ratio = (total_count - missing_count) / total_count

    # 2. Historical telemetry depth
    history_depth = len(context.history_points)
    if history_depth >= 10:
        history_score = 1.0
    elif history_depth >= 2:
        history_score = 0.75
    else:
        history_score = 0.40  # Insufficient longitudinal points

    # 3. Sampling validity
    if context.sampled_citizens_count >= 100:
        sample_score = 1.0
    elif context.sampled_citizens_count > 0:
        sample_score = 0.8
    else:
        sample_score = 0.5

    raw_score = (0.50 * available_ratio) + (0.30 * history_score) + (0.20 * sample_score)
    # Clamp between 0.50 and 0.98 (no advisor claims 100% prophetic certainty)
    return round(max(0.50, min(0.98, raw_score)), 2)

