from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://toolkit:toolkit_dev_pass@postgres:5432/toolkit"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: list[str] = ["http://localhost", "http://localhost:3000"]
    secret_key: str = "dev_secret_key_not_for_production"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
