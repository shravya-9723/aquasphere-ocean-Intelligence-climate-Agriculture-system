from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.api.router import api_router
from server.app.core.rag_service import rag_service
from server.app.db.base import create_tables
from server.app.db.seed import seed_database
from server.config.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_tables()
    seed_database()
    try:
        rag_service.refresh_knowledge_base()
    except Exception as e:
        print("RAG skipped:", e)
    yield


app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    lifespan=lifespan,
)

# 🔥 FIXED CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- IMPORTANT FIX
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)