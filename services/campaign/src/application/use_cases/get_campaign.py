from uuid import UUID

from ...domain.repositories import CampaignRepository
from ..dto.campaign_dto import CampaignResponse


class GetCampaignUseCase:
    """Get campaign use case"""
    
    def __init__(self, campaign_repository: CampaignRepository) -> None:
        self._campaign_repository = campaign_repository
    
    async def execute(self, campaign_id: UUID, user_id: str) -> CampaignResponse | None:
        """Execute get campaign use case"""
        
        # 1. Find campaign
        campaign = await self._campaign_repository.find_by_id(campaign_id)
        
        if not campaign:
            return None
        
        # 2. Check ownership (or admin access)
        if campaign.user_id != user_id:
            # In a real system, you might check for admin role here
            raise ValueError("Unauthorized access to campaign")
        
        # 3. Convert to response
        campaign_dict = campaign.to_dict()
        campaign_dict["id"] = UUID(campaign_dict["id"])
        
        return CampaignResponse(**campaign_dict)