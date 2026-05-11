from fastapi import APIRouter

from server.app.api.routes.analytics import router as analytics_router
from server.app.api.routes.ask import router as ask_router
from server.app.api.routes.map import router as map_router
from server.app.api.routes.region import router as region_router
from server.app.api.routes.user import router as user_router


api_router = APIRouter()
api_router.include_router(map_router)
api_router.include_router(region_router)
api_router.include_router(analytics_router)
api_router.include_router(ask_router)
api_router.include_router(user_router)
