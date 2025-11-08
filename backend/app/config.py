from __future__ import annotations

from functools import lru_cache
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseSettings, Field, validator
from redis import Redis as SyncRedis
from redis.asyncio import Redis as AsyncRedis

# Load environment variables from an optional .env file early in the import cycle.
load_dotenv()


class Settings(BaseSettings):
    # Core settings
    project_name: str = Field("FastAPI Celery Demo", env="PROJECT_NAME")
    environment: str = Field("development", env="ENVIRONMENT")
    log_level: str = Field("info", env="LOG_LEVEL")
    
    # Redis & Celery
    redis_url: str = Field("redis://redis:6379/0", env="REDIS_URL")
    celery_broker_url: Optional[str] = Field(None, env="CELERY_BROKER_URL")
    celery_result_backend: Optional[str] = Field(None, env="CELERY_RESULT_BACKEND")
    
    # CORS
    backend_cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000"], env="BACKEND_CORS_ORIGINS"
    )
    
    # Supabase (Optional - set to enable authentication)
    supabase_url: Optional[str] = Field(None, env="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(None, env="SUPABASE_ANON_KEY")
    supabase_service_key: Optional[str] = Field(None, env="SUPABASE_SERVICE_KEY")
    
    # Rate limiting
    rate_limit_per_minute: int = Field(60, env="RATE_LIMIT_PER_MINUTE")
    
    # Job settings
    max_job_n: int = Field(1000000, env="MAX_JOB_N")  # 1 million max for demo
    max_chunks: int = Field(100, env="MAX_CHUNKS")
    default_retry_limit: int = Field(3, env="DEFAULT_RETRY_LIMIT")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        # Prevent Pydantic from trying to parse as JSON
        json_loads = lambda x: x

    @validator("backend_cors_origins", pre=True)
    def split_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def broker_url(self) -> str:
        return self.celery_broker_url or self.redis_url

    @property
    def result_backend(self) -> str:
        return self.celery_result_backend or self.redis_url


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_async_redis_client() -> AsyncRedis:
    settings = get_settings()
    return AsyncRedis.from_url(settings.redis_url, decode_responses=True)


def get_sync_redis_client() -> SyncRedis:
    settings = get_settings()
    return SyncRedis.from_url(settings.redis_url, decode_responses=True)
