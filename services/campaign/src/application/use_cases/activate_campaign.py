from uuid import UUID

from ...domain.repositories import CampaignRepository
from ..dto.campaign_dto import CampaignResponse
from ..interfaces.event_publisher import EventPublisher, CampaignActivatedEvent
from ..interfaces.content_service import ContentService
from ..interfaces.notification_service import NotificationService, Notification, NotificationType


class ActivateCampaignUseCase:
    """Activate campaign use case"""
    
    def __init__(
        self,
        campaign_repository: CampaignRepository,
        event_publisher: EventPublisher,
        content_service: ContentService,
        notification_service: NotificationService
    ) -> None:
        self._campaign_repository = campaign_repository
        self._event_publisher = event_publisher
        self._content_service = content_service
        self._notification_service = notification_service
    
    async def execute(self, campaign_id: UUID, user_id: str) -> CampaignResponse:
        """Execute activate campaign use case"""
        
        # 1. Find campaign
        campaign = await self._campaign_repository.find_by_id(campaign_id)
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        # 2. Check ownership
        if campaign.user_id != user_id:
            raise ValueError("Unauthorized access to campaign")
        
        # 3. Validate content exists and is published
        if campaign.content_ids:
            valid_content_ids = await self._content_service.validate_content_ids(
                campaign.content_ids
            )
            
            if len(valid_content_ids) != len(campaign.content_ids):
                invalid_ids = set(campaign.content_ids) - set(valid_content_ids)
                raise ValueError(f"Invalid or unpublished content IDs: {invalid_ids}")
        
        # 4. Activate campaign
        try:
            campaign.activate()
        except ValueError as e:
            raise ValueError(f"Cannot activate campaign: {str(e)}")
        
        # 5. Save updated campaign
        await self._campaign_repository.update(campaign)
        
        # 6. Publish domain event
        event = CampaignActivatedEvent(
            campaign_id=campaign.id,
            user_id=user_id,
            campaign_name=campaign.name
        )
        await self._event_publisher.publish(event)
        
        # 7. Send notification
        notification = Notification(
            user_id=user_id,
            type=NotificationType.IN_APP,
            title="Campaign Activated",
            message=f"Your campaign '{campaign.name}' has been activated successfully.",
            metadata={"campaign_id": str(campaign.id)}
        )
        await self._notification_service.send_notification(notification)
        
        # 8. Return response
        campaign_dict = campaign.to_dict()
        campaign_dict["id"] = UUID(campaign_dict["id"])
        
        return CampaignResponse(**campaign_dict)