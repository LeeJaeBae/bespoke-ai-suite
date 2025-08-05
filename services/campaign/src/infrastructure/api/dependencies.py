import jwt
import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ...application.use_cases import (
    CreateCampaignUseCase,
    GetCampaignUseCase,
    ListCampaignsUseCase,
    ActivateCampaignUseCase
)
from ...application.interfaces import EventPublisher, ContentService, NotificationService
from ...domain.repositories import CampaignRepository
from ..config.settings import get_settings
from ..external.kafka_event_publisher import KafkaEventPublisher
from ..external.content_service_client import ContentServiceClient
from ..external.notification_service_client import NotificationServiceClient
from ..repositories.mongo_campaign_repository import MongoCampaignRepository


logger = structlog.get_logger()
security = HTTPBearer()


# Repository dependencies
async def get_campaign_repository() -> CampaignRepository:
    """Get campaign repository instance"""
    # In a real application, you would initialize with actual database connection
    return MongoCampaignRepository()


# External service dependencies
async def get_event_publisher() -> EventPublisher:
    """Get event publisher instance"""
    settings = get_settings()
    return KafkaEventPublisher(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        client_id=settings.kafka_client_id
    )


async def get_content_service() -> ContentService:
    """Get content service client"""
    settings = get_settings()
    return ContentServiceClient(base_url=settings.content_service_url)


async def get_notification_service() -> NotificationService:
    """Get notification service client"""
    settings = get_settings()
    return NotificationServiceClient(base_url=settings.notification_service_url)


# Use case dependencies
async def get_create_campaign_use_case(
    repository: CampaignRepository = Depends(get_campaign_repository),
    event_publisher: EventPublisher = Depends(get_event_publisher)
) -> CreateCampaignUseCase:
    """Get create campaign use case"""
    return CreateCampaignUseCase(repository, event_publisher)


async def get_get_campaign_use_case(
    repository: CampaignRepository = Depends(get_campaign_repository)
) -> GetCampaignUseCase:
    """Get campaign use case"""
    return GetCampaignUseCase(repository)


async def get_list_campaigns_use_case(
    repository: CampaignRepository = Depends(get_campaign_repository)
) -> ListCampaignsUseCase:
    """Get list campaigns use case"""
    return ListCampaignsUseCase(repository)


async def get_activate_campaign_use_case(
    repository: CampaignRepository = Depends(get_campaign_repository),
    event_publisher: EventPublisher = Depends(get_event_publisher),
    content_service: ContentService = Depends(get_content_service),
    notification_service: NotificationService = Depends(get_notification_service)
) -> ActivateCampaignUseCase:
    """Get activate campaign use case"""
    return ActivateCampaignUseCase(
        repository, 
        event_publisher, 
        content_service, 
        notification_service
    )


# Authentication dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Get current authenticated user"""
    settings = get_settings()
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "user_id": user_id,
            "role": payload.get("role", "user"),
            "permissions": payload.get("permissions", [])
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        logger.error("Authentication error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )