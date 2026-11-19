"""One friendly error type used everywhere. The API turns it into HTTP 400."""


class GenesisError(Exception):
    """Raised when a user action is invalid (not enough money, bad tile, ...)."""
