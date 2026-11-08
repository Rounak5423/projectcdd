"""World container: plain JSON-friendly state + a seeded random generator.

Everything about a civilisation lives in `World.s` (a dict), so it can be saved to
SQLite, copied into an independent branch, and sent to the browser unchanged.
"""
import json
import random


class World:
    def __init__(self, state):
        self.s = state
        self.rng = random.Random()
        r = state.get("rng")
        if r:
            self.rng.setstate((r[0], tuple(r[1]), r[2]))

    # -- persistence helpers -------------------------------------------------
    @classmethod
    def from_json(cls, text):
        return cls(json.loads(text))

    def to_json(self):
        v, internal, gauss = self.rng.getstate()
        self.s["rng"] = [v, list(internal), gauss]
        return json.dumps(self.s, separators=(",", ":"))

    def copy(self, **meta):
        """Fully independent deep copy (used for snapshots, branches, experiments)."""
        w = World.from_json(self.to_json())
        w.s["meta"].update(meta)
        return w

    # -- small helpers -------------------------------------------------------
    @property
    def day(self):
        return self.s["meta"]["day"]

    def next_id(self, prefix, width=4):
        c = self.s["meta"]["counters"]
        c[prefix] = c.get(prefix, 0) + 1
        return f"{prefix}{c[prefix]:0{width}d}"

    def feed(self, kind, title, what, why="", effect="", action=""):
        """Add a plain-language explanation (what / why / effect / what you can do)."""
        f = self.s["feed"]
        f.append({"day": self.day, "kind": kind, "title": title, "what": what,
                  "why": why, "effect": effect, "action": action})
        if len(f) > 150:
            del f[:len(f) - 150]
