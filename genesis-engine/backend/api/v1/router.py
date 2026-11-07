from fastapi import APIRouter
from api.v1.auth import router as auth_router
from api.v1.admin import router as admin_router
from api.v1.worlds import router as worlds_router
from api.v1.infrastructure import router as infra_router
from api.v1.population import router as pop_router
from api.v1.simulation import router as sim_router
from api.v1.policies import router as policies_router
from api.v1.technology import router as tech_router
from api.v1.progression import router as prog_router
from api.v1.scenarios import router as scenarios_router
from app.features.council.router import router as council_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(worlds_router)
api_v1_router.include_router(infra_router)
api_v1_router.include_router(pop_router)
api_v1_router.include_router(sim_router)
api_v1_router.include_router(policies_router)
api_v1_router.include_router(tech_router)
api_v1_router.include_router(prog_router)
api_v1_router.include_router(scenarios_router)
api_v1_router.include_router(council_router)

