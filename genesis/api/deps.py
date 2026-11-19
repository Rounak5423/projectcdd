"""Holds the one GenesisService instance (tests can replace it with set_service)."""
from ..service import GenesisService
from ..settings import Settings

_svc = None


def get_service():
    global _svc
    if _svc is None:
        _svc = GenesisService(Settings.load())
    return _svc


def set_service(svc):
    global _svc
    _svc = svc
