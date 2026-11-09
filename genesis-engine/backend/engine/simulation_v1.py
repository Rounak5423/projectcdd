"""
================================================================================
GENESIS Engine: Legacy Compatibility Layer (Consolidated into engine.simulation)
================================================================================
All simulation methods, models, and tickers have been consolidated into
`engine.simulation`. This module re-exports all symbols for full backward compatibility.
"""

from .simulation import (
    format_currency,
    seed_aurora_prime_if_not_exists,
    advance_world_simulation,
    perform_yearly_aggregation,
    perform_autosave,
    generate_buildings_and_infrastructure,
    create_initial_world,
    step_world,
    OCCUPATIONS
)
