# Architecture

## Layers
`static/ (browser)  ->  api/routes (HTTP/WebSocket)  ->  service.py (validation, confirmation, saving)  ->  simulation/ (pure Python)  ->  persistence/store.py (SQLite)`

The browser never calculates simulation results. The simulation package has no web or database imports, so it is easy to test and reuse.

## Time
One **tick = one simulation day**. 1x speed = 1 day per 2 seconds (`delay = 2 / speed`; speeds 1, 2, 5, 10). `DAYS_PER_YEAR = 60`:
citizens age one year per 60 days and annual birth/death rates are divided by 60. Seeds: `random.Random(seed)`; its state is saved with the world,
so a loaded world continues exactly as an uninterrupted one would.

## Daily update order (`simulation/engine.py::tick`)
1 citizen needs/activities/health/happiness -> 2 education & skills (and birthdays) -> 3 employment -> 4 births, deaths, migration ->
5 resources -> 6 economy -> 7 buildings (construction, upkeep, services) -> 8 environment -> 9 policies -> 10 events ->
11 research & progression -> 12 history -> 13 publish (service broadcasts over WebSocket).
`governance.get_modifiers` merges policies, technologies, events and experiment overrides once per tick (keys `add_*` are summed, others multiplied).

## World state (`World.s`, all JSON)
`meta, map, citizens, buildings, resources, industry, economy, environment, services, policies, events, progression, research, grc,
experiments, history, feed, daily, metrics, custom_mods, totals, settings, rng`.
Snapshots and branches live in SQLite as full copies of this state. A branch is created by JSON round-trip, so it shares no objects with the original.

## Persistence
SQLite tables `worlds` (main + branches), `snapshots`. Each save is one transaction. Autosave every `GENESIS_AUTOSAVE_DAYS` days, on pause and after each action.

## Extending
* Smarter citizens: replace `intelligence.decide`.
* New building: add to `config.BUILDINGS`, a builder in `world3d.js` (`BUILD`), and job/output logic in `resources.py`.
* New policy/tech/event: add an entry with `mods` in `governance.py` / `research.py` / `events.py`.
