from uuid import UUID

from ...domain.entities import Campaign
from ...domain.repositories import CampaignRepository
from ...domain.value_objects import Budget, DateRange, TargetAudience
from ..dto.campaign_dto import CreateCampaignRequest, CampaignResponse
from ..interfaces.event_publisher import EventPublisher, CampaignCreatedEvent


class CreateCampaignUseCase:
    """Create campaign use case"""
    
    def __init__(
        self,
        campaign_repository: CampaignRepository,
        event_publisher: EventPublisher
    ) -> None:
        self._campaign_repository = campaign_repository
        self._event_publisher = event_publisher
    
    async def execute(
        self, 
        user_id: str, 
        request: CreateCampaignRequest
    ) -> CampaignResponse:
        """Execute create campaign use case"""
        
        # 1. Convert DTO to value objects
        target_audience = self._create_target_audience(request.target_audience)
        budget = self._create_budget(request.budget)
        date_range = self._create_date_range(request.date_range)
        
        # 2. Create campaign entity
        campaign = Campaign.create(
            user_id=user_id,
            name=request.name,
            description=request.description,
            target_audience=target_audience,
            budget=budget,
            date_range=date_range,
            channels=request.channels,
            content_ids=request.content_ids,
            tags=request.tags
        )
        
        # 3. Save to repository
        await self._campaign_repository.save(campaign)
        
        # 4. Publish domain event
        event = CampaignCreatedEvent(
            campaign_id=campaign.id,
            user_id=user_id,
            campaign_name=campaign.name
        )
        await self._event_publisher.publish(event)
        
        # 5. Return response
        return self._to_response(campaign)
    
    def _create_target_audience(self, dto) -> TargetAudience:
        """Convert target audience DTO to value object"""
        age_range = None
        if dto.age_range:
            age_range = (dto.age_range["min"], dto.age_range["max"])
        
        return TargetAudience.create(
            age_range=age_range,
            gender=dto.gender,
            locations=dto.locations,
            interests=dto.interests,
            languages=dto.languages,
            devices=dto.devices,
            custom_segments=dto.custom_segments
        )
    
    def _create_budget(self, dto) -> Budget:
        """Convert budget DTO to value object"""
        return Budget.create(
            amount=dto.amount,
            currency=dto.currency,
            daily_limit=dto.daily_limit
        )
    
    def _create_date_range(self, dto) -> DateRange:
        """Convert date range DTO to value object"""
        return DateRange.create(
            start_date=dto.start_date,
            end_date=dto.end_date
        )
    
    def _to_response(self, campaign: Campaign) -> CampaignResponse:
        """Convert campaign entity to response DTO"""
        campaign_dict = campaign.to_dict()
        
        # Convert string UUID back to UUID object for Pydantic
        campaign_dict["id"] = UUID(campaign_dict["id"])
        
        return CampaignResponse(**campaign_dict)