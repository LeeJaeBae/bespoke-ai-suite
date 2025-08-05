import asyncio
import logging
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from .infrastructure.api.routers import campaigns
from .infrastructure.config.settings import get_settings


# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    settings = get_settings()
    
    # Startup
    logger.info("Starting Campaign Service", version="1.0.0")
    
    # TODO: Initialize database connections, message brokers, etc.
    # await database.connect()
    # await message_broker.connect()
    
    yield
    
    # Shutdown
    logger.info("Shutting down Campaign Service")
    
    # TODO: Clean up connections
    # await database.disconnect()
    # await message_broker.disconnect()


def create_app() -> FastAPI:
    """Create FastAPI application"""
    settings = get_settings()
    
    app = FastAPI(
        title="Bespoke Campaign Service",
        description="AI-powered marketing campaign management service",
        version="1.0.0",
        openapi_url=f"{settings.api_v1_str}/openapi.json",
        docs_url=f"{settings.api_v1_str}/docs",
        redoc_url=f"{settings.api_v1_str}/redoc",
        lifespan=lifespan
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Prometheus metrics
    instrumentator = Instrumentator(
        should_group_status_codes=False,
        should_ignore_untemplated=True,
        should_respect_env_var=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=[".*admin.*", "/metrics"],
        env_var_name="ENABLE_METRICS",
        inprogress_name="inprogress",
        inprogress_labels=True,
    )
    instrumentator.instrument(app).expose(app)
    
    # Include routers
    app.include_router(
        campaigns.router,
        prefix=f"{settings.api_v1_str}/campaigns",
        tags=["campaigns"]
    )
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "service": "campaign-service",
            "version": "1.0.0"
        }
    
    return app


app = create_app()


if __name__ == "__main__":
    settings = get_settings()
    
    uvicorn.run(
        "src.main:app",
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.debug,
        access_log=True,
        log_level="info" if not settings.debug else "debug"
    )