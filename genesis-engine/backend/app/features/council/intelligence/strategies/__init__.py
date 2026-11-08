"""
CIVORA — Council Intelligence Strategies Package
"""

from app.features.council.intelligence.strategies.tradeoff_analysis import (
    AdvisorTradeoffConflict,
    detect_cross_domain_tradeoffs,
)

__all__ = [
    "AdvisorTradeoffConflict",
    "detect_cross_domain_tradeoffs",
]

