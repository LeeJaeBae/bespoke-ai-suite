from abc import ABC, abstractmethod
from uuid import UUID

from ..entities import CampaignContent
from ..entities.campaign_content import ContentStatus, ContentType


class CampaignContentRepository(ABC):
    """Campaign content repository interface"""
    
    @abstractmethod
    async def save(self, content: CampaignContent) -> None:
        """Save campaign content"""
        pass
    
    @abstractmethod
    async def find_by_id(self, content_id: UUID) -> CampaignContent | None:
        """Find content by ID"""
        pass
    
    @abstractmethod
    async def find_by_campaign(self, campaign_id: UUID) -> list[CampaignContent]:
        """Find all content for a campaign"""
        pass
    
    @abstractmethod
    async def find_by_campaign_and_status(
        self, 
        campaign_id: UUID, 
        status: ContentStatus
    ) -> list[CampaignContent]:
        """Find campaign content by status"""
        pass
    
    @abstractmethod
    async def find_active_content(self) -> list[CampaignContent]:
        """Find all currently active content"""
        pass
    
    @abstractmethod
    async def find_by_content_service_id(
        self, 
        content_service_id: str
    ) -> list[CampaignContent]:
        """Find campaign content by content service ID"""
        pass
    
    @abstractmethod
    async def find_by_type(self, content_type: ContentType) -> list[CampaignContent]:
        """Find content by type"""
        pass
    
    @abstractmethod
    async def find_by_variant(
        self, 
        campaign_id: UUID, 
        variant_name: str
    ) -> list[CampaignContent]:
        """Find content by A/B test variant"""
        pass
    
    @abstractmethod
    async def update(self, content: CampaignContent) -> None:
        """Update existing content"""
        pass
    
    @abstractmethod
    async def delete(self, content_id: UUID) -> None:
        """Delete content"""
        pass
    
    @abstractmethod
    async def delete_by_campaign(self, campaign_id: UUID) -> int:
        """Delete all content for a campaign, returns count"""
        pass
    
    @abstractmethod
    async def exists(self, content_id: UUID) -> bool:
        """Check if content exists"""
        pass
    
    @abstractmethod
    async def count_by_campaign(self, campaign_id: UUID) -> int:
        """Count content items for a campaign"""
        pass
    
    @abstractmethod
    async def count_by_status(self, status: ContentStatus) -> int:
        """Count content by status"""
        pass
    
    @abstractmethod
    async def bulk_update_status(
        self, 
        content_ids: list[UUID], 
        status: ContentStatus
    ) -> int:
        """Bulk update content status"""
        pass