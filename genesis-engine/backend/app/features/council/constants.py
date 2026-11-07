"""
CIVORA — Council of Advisors Constants & System Definitions
Defines permanent system advisor identities, allowed statuses, and domain taxonomies.
"""

from typing import List, Dict, Any

# Permanent Advisor IDs
ADVISOR_CHANCELLOR = "adv-chancellor"
ADVISOR_TREASURER = "adv-treasurer"
ADVISOR_SCHOLAR = "adv-scholar"
ADVISOR_ARCHITECT = "adv-architect"
ADVISOR_PHYSICIAN = "adv-physician"
ADVISOR_KEEPER = "adv-keeper"

PERMANENT_ADVISOR_IDS = [
    ADVISOR_CHANCELLOR,
    ADVISOR_TREASURER,
    ADVISOR_SCHOLAR,
    ADVISOR_ARCHITECT,
    ADVISOR_PHYSICIAN,
    ADVISOR_KEEPER,
]

# Domains
DOMAINS = [
    "Governance and Society",
    "Economy and Finance",
    "Science and Knowledge",
    "Infrastructure and Development",
    "Health and Wellbeing",
    "Environment and Ecology",
]

# Roles
ROLES = [
    "chancellor",
    "treasurer",
    "scholar",
    "architect",
    "physician",
    "keeper",
]

# Session Statuses
SESSION_STATUS_SCHEDULED = "scheduled"
SESSION_STATUS_ACTIVE = "active"
SESSION_STATUS_COMPLETED = "completed"
SESSION_STATUS_CANCELLED = "cancelled"

ALLOWED_SESSION_STATUSES = {
    SESSION_STATUS_SCHEDULED,
    SESSION_STATUS_ACTIVE,
    SESSION_STATUS_COMPLETED,
    SESSION_STATUS_CANCELLED,
}

# Frontend session state mapping
SESSION_STATE_MAPPING = {
    SESSION_STATUS_SCHEDULED: "Scheduled",
    SESSION_STATUS_ACTIVE: "In Progress",
    SESSION_STATUS_COMPLETED: "Concluded",
    SESSION_STATUS_CANCELLED: "Archived",
}

# Recommendation Statuses
# Rule: ACCEPTED DOES NOT MEAN IMPLEMENTED.
REC_STATUS_PROPOSED = "proposed"
REC_STATUS_UNDER_REVIEW = "under_review"
REC_STATUS_ACCEPTED = "accepted"
REC_STATUS_REJECTED = "rejected"
REC_STATUS_IMPLEMENTED = "implemented"
REC_STATUS_EXPIRED = "expired"

ALLOWED_REC_STATUSES = {
    REC_STATUS_PROPOSED,
    REC_STATUS_UNDER_REVIEW,
    REC_STATUS_ACCEPTED,
    REC_STATUS_REJECTED,
    REC_STATUS_IMPLEMENTED,
    REC_STATUS_EXPIRED,
}

# Frontend recommendation status mapping
REC_STATUS_FRONTEND_MAPPING = {
    REC_STATUS_PROPOSED: "Proposed",
    REC_STATUS_UNDER_REVIEW: "Under Review",
    REC_STATUS_ACCEPTED: "Accepted",
    REC_STATUS_REJECTED: "Rejected",
    REC_STATUS_IMPLEMENTED: "Implemented",
    REC_STATUS_EXPIRED: "Expired",
}

# Recommendation Priorities
PRIORITY_LOW = "low"
PRIORITY_MEDIUM = "medium"
PRIORITY_HIGH = "high"
PRIORITY_CRITICAL = "critical"
PRIORITY_URGENT = "urgent"

ALLOWED_PRIORITIES = {
    PRIORITY_LOW,
    PRIORITY_MEDIUM,
    PRIORITY_HIGH,
    PRIORITY_CRITICAL,
    PRIORITY_URGENT,
}

# Decision Outcomes
OUTCOME_RATIFIED = "Ratified"
OUTCOME_VETOED = "Vetoed"
OUTCOME_REFERRED = "Referred to Committee"

ALLOWED_OUTCOMES = {
    OUTCOME_RATIFIED,
    OUTCOME_VETOED,
    OUTCOME_REFERRED,
}

# Session Event Types
EVENT_SESSION_STARTED = "session_started"
EVENT_BRIEFING_ADDED = "briefing_added"
EVENT_RECOMMENDATION_DISCUSSED = "recommendation_discussed"
EVENT_RECOMMENDATION_ACCEPTED = "recommendation_accepted"
EVENT_RECOMMENDATION_REJECTED = "recommendation_rejected"
EVENT_DECISION_RECORDED = "decision_recorded"
EVENT_SESSION_COMPLETED = "session_completed"

# Six Permanent System Advisor Identities
SYSTEM_ADVISORS: List[Dict[str, Any]] = [
    {
        "id": ADVISOR_CHANCELLOR,
        "role": "chancellor",
        "name": "Aurelius Valerius",
        "title": "The High Chancellor",
        "domain": "Governance and Society",
        "description": "Keeper of civic laws, imperial stability, and societal cohesion. Coordinates directives across ministries.",
        "responsibilities": [
            "Preserving civic harmony and public order",
            "Administering legislative mandates and decrees",
            "Managing social unrest and political stability",
            "Coordinating inter-ministerial council proceedings",
        ],
        "portrait_url": "/assets/portraits/advisor_chancellor.png",
        "portrait_symbol": "🏛️",
        "accent_color": "#C5A66A",
        "motto": "Order preserves the eternity that ambition builds.",
        "display_order": 1,
        "is_active": True,
    },
    {
        "id": ADVISOR_TREASURER,
        "role": "treasurer",
        "name": "Cassian Drake",
        "title": "The Grand Treasurer",
        "domain": "Economy and Finance",
        "description": "Master of the Imperial Ledger, fiscal resource allocation, trade routes, and sovereign credit reserve.",
        "responsibilities": [
            "Balancing treasury revenue and public expenditure",
            "Optimizing taxation and resource production rates",
            "Regulating trade reserves and credit flow",
            "Guarding against fiscal bankruptcy and economic shocks",
        ],
        "portrait_url": "/assets/portraits/advisor_treasurer.png",
        "portrait_symbol": "⚖️",
        "accent_color": "#D6A75E",
        "motto": "Wealth is the lifeblood of sovereign dominion.",
        "display_order": 2,
        "is_active": True,
    },
    {
        "id": ADVISOR_SCHOLAR,
        "role": "scholar",
        "name": "Dr. Elenora Vance",
        "title": "The Grand Scholar",
        "domain": "Science and Knowledge",
        "description": "Director of the Great Academy, algorithmic intelligence research, and civilization epistemology.",
        "responsibilities": [
            "Guiding breakthroughs across scientific discovery trees",
            "Monitoring cognitive independence vs AI dependency",
            "Overseeing academic research facilities and discoveries",
            "Assessing long-term civilizational existential risks",
        ],
        "portrait_url": "/assets/portraits/advisor_scholar.png",
        "portrait_symbol": "📜",
        "accent_color": "#8FA879",
        "motto": "Ignorance is the sole architect of ruin.",
        "display_order": 3,
        "is_active": True,
    },
    {
        "id": ADVISOR_ARCHITECT,
        "role": "architect",
        "name": "Severus Thorne",
        "title": "The Royal Architect",
        "domain": "Infrastructure and Development",
        "description": "Supreme master of monumental works, civil engineering, zoning grids, and architectural marvels.",
        "responsibilities": [
            "Supervising city planning and structural expansions",
            "Optimizing logistical arteries, transport, and energy networks",
            "Ensuring housing capacity outpaces demographic growth",
            "Directing construction of monumental wonders",
        ],
        "portrait_url": "/assets/portraits/advisor_architect.png",
        "portrait_symbol": "📐",
        "accent_color": "#B39D7E",
        "motto": "Stone and steel outlive empires.",
        "display_order": 4,
        "is_active": True,
    },
    {
        "id": ADVISOR_PHYSICIAN,
        "role": "physician",
        "name": "Lady Maeve Linnea",
        "title": "The High Physician",
        "domain": "Health and Wellbeing",
        "description": "Guardian of citizen vitality, biosecurity, sanitation, and life expectancy across all provinces.",
        "responsibilities": [
            "Safeguarding public sanitation and clean water reserves",
            "Monitoring pandemic vectors and psychological well-being",
            "Managing hospital capacities and medical stockpiles",
            "Promoting citizen longevity and quality of life",
        ],
        "portrait_url": "/assets/portraits/advisor_physician.png",
        "portrait_symbol": "🌿",
        "accent_color": "#96B8A0",
        "motto": "A broken populace yields a crumbling throne.",
        "display_order": 5,
        "is_active": True,
    },
    {
        "id": ADVISOR_KEEPER,
        "role": "keeper",
        "name": "Thalric Ironwood",
        "title": "The Keeper of Nature",
        "domain": "Environment and Ecology",
        "description": "Protector of ecological balances, biosphere conservation, renewable resources, and climate stability.",
        "responsibilities": [
            "Preventing industrial ecocide and resource depletion",
            "Regulating carbon emissions and industrial waste",
            "Preserving biodiversity and planetary biomes",
            "Overseeing sustainable forestry, agriculture, and water reserves",
        ],
        "portrait_url": "/assets/portraits/advisor_keeper.png",
        "portrait_symbol": "🌱",
        "accent_color": "#687653",
        "motto": "Nature commands that which mankind merely borrows.",
        "display_order": 6,
        "is_active": True,
    },
]

