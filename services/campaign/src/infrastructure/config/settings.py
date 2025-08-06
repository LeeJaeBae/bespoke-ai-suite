from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    # Server settings
    server_host: str = Field(default="0.0.0.0")
    server_port: int = Field(default=8085)
    debug: bool = Field(default=False)
    
    # API settings
    api_v1_str: str = Field(default="/api/v1")
    
    # CORS settings
    backend_cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )
    
    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database settings
    mongodb_url: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = Field(default="bespoke_campaigns")
    
    # Redis settings
    redis_url: str = Field(default="redis://localhost:6379")
    
    # Kafka settings
    kafka_bootstrap_servers: str = Field(default="localhost:9092")
    kafka_client_id: str = Field(default="campaign-service")
    kafka_group_id: str = Field(default="campaign-service-group")
    
    # JWT settings
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=30)
    
    # External services
    content_service_url: str = Field(default="http://localhost:8081")
    user_service_url: str = Field(default="http://localhost:8080")
    notification_service_url: str = Field(default="http://localhost:8083")
    
    # Monitoring
    enable_metrics: bool = Field(default=True)
    log_level: str = Field(default="INFO")
    
    # Feature flags
    enable_ab_testing: bool = Field(default=True)
    enable_advanced_targeting: bool = Field(default=True)
    enable_real_time_analytics: bool = Field(default=True)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()