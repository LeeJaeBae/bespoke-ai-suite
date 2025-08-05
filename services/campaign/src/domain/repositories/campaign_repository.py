from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from ..entities import Campaign
from ..value_objects import CampaignStatus


T = TypeVar('T')


@dataclass
class PaginatedResult(Generic[T]):
    """Paginated result container"""
    
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


@dataclass
class CampaignFilter:
    """Campaign filtering criteria"""
    
    user_id: str | None = None
    status: CampaignStatus | None = None
    name_contains: str | None = None
    tags: list[str] | None = None
    channels: list[str] | None = None
    start_date_from: datetime | None = None
    start_date_to: datetime | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None
    is_ab_test: bool | None = None
    budget_min: float | None = None
    budget_max: float | None = None


@dataclass 
class PaginationOptions:
    """Pagination options"""
    
    page: int = 1
    page_size: int = 20
    sort_by: str = "created_at"
    sort_order: str = "desc"  # asc or desc


class CampaignRepository(ABC):
    """Campaign repository interface"""
    
    @abstractmethod
    async def save(self, campaign: Campaign) -> None:
        """Save campaign"""
        pass
    
    @abstractmethod
    async def find_by_id(self, campaign_id: UUID) -> Campaign | None:
        """Find campaign by ID"""
        pass
    
    @abstractmethod
    async def find_by_user(
        self, 
        user_id: str, 
        pagination: PaginationOptions
    ) -> PaginatedResult[Campaign]:
        """Find campaigns by user with pagination"""
        pass
    
    @abstractmethod
    async def find_all(
        self, 
        filter: CampaignFilter, 
        pagination: PaginationOptions
    ) -> PaginatedResult[Campaign]:
        """Find campaigns with filter and pagination"""
        pass
    
    @abstractmethod
    async def find_active_campaigns(self) -> list[Campaign]:
        """Find all active campaigns"""
        pass
    
    @abstractmethod
    async def find_campaigns_by_status(
        self, 
        status: CampaignStatus
    ) -> list[Campaign]:
        """Find campaigns by status"""
        pass
    
    @abstractmethod
    async def find_campaigns_to_schedule(
        self, 
        current_time: datetime
    ) -> list[Campaign]:
        """Find scheduled campaigns that should be activated"""
        pass
    
    @abstractmethod
    async def find_campaigns_to_complete(
        self, 
        current_time: datetime
    ) -> list[Campaign]:
        """Find active campaigns that should be completed"""
        pass
    
    @abstractmethod
    async def update(self, campaign: Campaign) -> None:
        """Update existing campaign"""
        pass
    
    @abstractmethod
    async def delete(self, campaign_id: UUID) -> None:
        """Delete campaign (soft delete recommended)"""
        pass
    
    @abstractmethod
    async def exists(self, campaign_id: UUID) -> bool:
        """Check if campaign exists"""
        pass
    
    @abstractmethod
    async def count_by_user(self, user_id: str) -> int:
        """Count campaigns by user"""
        pass
    
    @abstractmethod
    async def count_by_status(self, status: CampaignStatus) -> int:
        """Count campaigns by status"""
        pass
    
    @abstractmethod
    async def find_by_content_id(self, content_id: str) -> list[Campaign]:
        """Find campaigns using specific content"""
        pass
    
    @abstractmethod
    async def bulk_update_status(
        self, 
        campaign_ids: list[UUID], 
        status: CampaignStatus
    ) -> int:
        """Bulk update campaign status, returns count of updated campaigns"""
        pass