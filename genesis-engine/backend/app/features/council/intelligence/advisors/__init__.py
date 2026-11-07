"""
CIVORA — Council Domain Advisors Package
"""

from app.features.council.intelligence.advisors.chancellor import ChancellorAdvisor
from app.features.council.intelligence.advisors.treasurer import TreasurerAdvisor
from app.features.council.intelligence.advisors.grand_scholar import GrandScholarAdvisor
from app.features.council.intelligence.advisors.royal_architect import RoyalArchitectAdvisor
from app.features.council.intelligence.advisors.high_physician import HighPhysicianAdvisor
from app.features.council.intelligence.advisors.keeper_of_nature import KeeperOfNatureAdvisor

__all__ = [
    "ChancellorAdvisor",
    "TreasurerAdvisor",
    "GrandScholarAdvisor",
    "RoyalArchitectAdvisor",
    "HighPhysicianAdvisor",
    "KeeperOfNatureAdvisor",
]
