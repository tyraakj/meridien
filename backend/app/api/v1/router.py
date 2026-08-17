from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.plots import router as plots_router
from app.api.v1.mrv import router as mrv_router
from app.api.v1.registry import router as registry_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(plots_router)
api_router.include_router(mrv_router)
api_router.include_router(registry_router)
