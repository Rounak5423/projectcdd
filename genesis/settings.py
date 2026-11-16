"""Settings read from environment variables or an optional .env file (see .env.example)."""
import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _load_env_file():
    f = ROOT / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


@dataclass
class Settings:
    db_path: str = str(ROOT / "data" / "genesis.db")
    seed: int = 42
    autosave_days: int = 5
    offline_progression: bool = False
    offline_days_per_hour: float = 2.0
    offline_max_days: int = 30

    @classmethod
    def load(cls):
        _load_env_file()
        g = os.environ.get
        return cls(db_path=g("GENESIS_DB", str(ROOT / "data" / "genesis.db")), seed=int(g("GENESIS_SEED", "42")),
                   autosave_days=int(g("GENESIS_AUTOSAVE_DAYS", "5")),
                   offline_progression=g("GENESIS_OFFLINE_PROGRESSION", "off").lower() in ("on", "true", "1", "yes"),
                   offline_days_per_hour=float(g("GENESIS_OFFLINE_DAYS_PER_HOUR", "2")),
                   offline_max_days=int(g("GENESIS_OFFLINE_MAX_DAYS", "30")))
