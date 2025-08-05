from uuid import UUID

from ...domain.repositories import CampaignRepository, CampaignFilter, PaginationOptions
from ..dto.campaign_dto import CampaignListResponse, CampaignResponse


class ListCampaignsUseCase:
    """List campaigns use case"""
    
    def __init__(self, campaign_repository: CampaignRepository) -> None:
        self._campaign_repository = campaign_repository
    
    async def execute(
        self,
        user_id: str,
        filter: CampaignFilter,
        pagination: PaginationOptions
    ) -> CampaignListResponse:
        """Execute list campaigns use case"""
        
        # 1. Ensure user can only see their own campaigns (unless admin)
        filter.user_id = user_id
        
        # 2. Get paginated campaigns
        result = await self._campaign_repository.find_all(filter, pagination)
        
        # 3. Convert to response DTOs
        campaign_responses = []
        for campaign in result.items:
            campaign_dict = campaign.to_dict()
            campaign_dict["id"] = UUID(campaign_dict["id"])
            campaign_responses.append(CampaignResponse(**campaign_dict))
        
        # 4. Return paginated response
        return CampaignListResponse(
            campaigns=campaign_responses,
            total=result.total,
            page=result.page,
            page_size=result.page_size,
            total_pages=result.total_pages,
            has_next=result.has_next,
            has_previous=result.has_previous
        )