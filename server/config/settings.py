from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AquaSphere AI"
    app_description: str = "Climate intelligence for ocean temperature and agriculture trends."
    frontend_origin: str = "http://localhost:3000"
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"
    openrouter_primary_model: str = "openrouter/free"
    openrouter_fallback_model: str = "meta-llama/llama-3.3-8b-instruct:free"
    ollama_base_url: str = "http://127.0.0.1:11434/api/chat"
    ollama_model: str = "llama3.1:8b"
    database_url: str = f"sqlite:///{(BASE_DIR / 'server' / 'data' / 'aquasphere.db').as_posix()}"
    chroma_directory: Path = BASE_DIR / "server" / "data" / "chroma"
    noaa_source_url: str = "https://www.ncei.noaa.gov/access/services/data/v1"
    fao_source_url: str = "https://fenixservices.fao.org/faostat/api/v1/en/Production_Crops/Crops"


@lru_cache
def get_settings() -> Settings:
    return Settings()
