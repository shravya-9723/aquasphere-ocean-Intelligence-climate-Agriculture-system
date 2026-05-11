from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.config.settings import get_settings


settings = get_settings()
connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {"connect_timeout": 5}
    if settings.database_url.startswith("postgresql")
    else {}
)
engine = create_engine(settings.database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
