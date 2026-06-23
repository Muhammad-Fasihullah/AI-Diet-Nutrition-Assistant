from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # AI Provider — "groq" (free) or "openai"
    ai_provider: str = "groq"
    groq_api_key: str = ""
    openai_api_key: str = ""

    # Groq models
    groq_model: str = "llama-3.3-70b-versatile"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    # OpenAI models
    openai_model: str = "gpt-4o-mini"
    openai_vision_model: str = "gpt-4o-mini"

    # App
    app_name: str = "AI Diet & Nutrition Assistant"
    debug: bool = True
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Allow extra env vars without crashing (e.g. unknown future vars)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()