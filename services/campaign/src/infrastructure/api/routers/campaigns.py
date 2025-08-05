from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer

from ....application.dto.campaign_dto import (
    CreateCampaignRequest,
    UpdateCampaignRequest,
    CampaignResponse,
    CampaignListResponse,
    CampaignActionRequest,
    EnableABTestRequest
)
from ....application.use_cases import (
    CreateCampaignUseCase,
    GetCampaignUseCase,
    ListCampaignsUseCase,
    ActivateCampaignUseCase
)
from ....domain.repositories import CampaignFilter, PaginationOptions
from ....domain.value_objects import CampaignStatus
from ..dependencies import (
    get_current_user,
    get_create_campaign_use_case,
    get_get_campaign_use_case,
    get_list_campaigns_use_case,
    get_activate_campaign_use_case
)


logger = structlog.get_logger()
security = HTTPBearer()

router = APIRouter()


@router.post(
    "/",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Campaign",
    description="Create a new marketing campaign"
)
async def create_campaign(
    request: CreateCampaignRequest,
    current_user: dict = Depends(get_current_user),
    use_case: CreateCampaignUseCase = Depends(get_create_campaign_use_case)
) -> CampaignResponse:
    """Create a new campaign"""
    try:
        logger.info(
            "Creating campaign",
            user_id=current_user["user_id"],
            campaign_name=request.name
        )
        
        result = await use_case.execute(
            user_id=current_user["user_id"],
            request=request
        )
        
        logger.info(
            "Campaign created successfully",
            campaign_id=str(result.id),
            user_id=current_user["user_id"]
        )
        
        return result
        
    except ValueError as e:
        logger.error("Campaign creation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Unexpected error during campaign creation", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/{campaign_id}",
    response_model=CampaignResponse,
    summary="Get Campaign",
    description="Get campaign by ID"
)
async def get_campaign(
    campaign_id: UUID,
    current_user: dict = Depends(get_current_user),
    use_case: GetCampaignUseCase = Depends(get_get_campaign_use_case)
) -> CampaignResponse:
    """Get campaign by ID"""
    try:
        result = await use_case.execute(
            campaign_id=campaign_id,
            user_id=current_user["user_id"]
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        return result
        
    except ValueError as e:
        logger.error("Campaign access denied", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Unexpected error getting campaign", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/",
    response_model=CampaignListResponse,
    summary="List Campaigns",
    description="List campaigns with filtering and pagination"
)
async def list_campaigns(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str | None = Query(default=None),
    name_contains: str | None = Query(default=None),
    tags: str | None = Query(default=None),
    channels: str | None = Query(default=None),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    current_user: dict = Depends(get_current_user),
    use_case: ListCampaignsUseCase = Depends(get_list_campaigns_use_case)
) -> CampaignListResponse:
    """List campaigns with filtering and pagination"""
    try:
        # Build filter
        campaign_filter = CampaignFilter(
            user_id=None,  # Will be set by use case
            name_contains=name_contains,
            tags=tags.split(",") if tags else None,
            channels=channels.split(",") if channels else None
        )
        
        # Parse status if provided
        if status:
            try:
                campaign_filter.status = CampaignStatus(status.upper())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status}"
                )
        
        # Build pagination
        pagination = PaginationOptions(
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        result = await use_case.execute(
            user_id=current_user["user_id"],
            filter=campaign_filter,
            pagination=pagination
        )
        
        return result
        
    except Exception as e:
        logger.error("Unexpected error listing campaigns", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/{campaign_id}/activate",
    response_model=CampaignResponse,
    summary="Activate Campaign",
    description="Activate a campaign"
)
async def activate_campaign(
    campaign_id: UUID,
    current_user: dict = Depends(get_current_user),
    use_case: ActivateCampaignUseCase = Depends(get_activate_campaign_use_case)
) -> CampaignResponse:
    """Activate campaign"""
    try:
        logger.info(
            "Activating campaign",
            campaign_id=str(campaign_id),
            user_id=current_user["user_id"]
        )
        
        result = await use_case.execute(
            campaign_id=campaign_id,
            user_id=current_user["user_id"]
        )
        
        logger.info(
            "Campaign activated successfully",
            campaign_id=str(campaign_id),
            user_id=current_user["user_id"]
        )
        
        return result
        
    except ValueError as e:
        logger.error("Campaign activation failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Unexpected error activating campaign", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )