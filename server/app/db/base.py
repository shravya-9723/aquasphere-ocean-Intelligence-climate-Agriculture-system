from sqlalchemy.orm import DeclarativeBase

from server.app.db.session import engine


class Base(DeclarativeBase):
    pass


def create_tables() -> None:
    from server.app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
