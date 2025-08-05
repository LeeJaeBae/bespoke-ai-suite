from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Self
from uuid import UUID, uuid4


class ContentType(Enum):
    """Content type for campaigns"""
    
    EMAIL = "EMAIL"
    SOCIAL_POST = "SOCIAL_POST"
    DISPLAY_AD = "DISPLAY_AD"
    VIDEO_AD = "VIDEO_AD"
    BLOG_POST = "BLOG_POST"
    LANDING_PAGE = "LANDING_PAGE"


class ContentStatus(Enum):
    """Content status in campaign"""
    
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


@dataclass
class CampaignContent:
    """Campaign content entity"""
    
    # Identity
    id: UUID
    campaign_id: UUID
    content_service_id: str  # Reference to content service
    
    # Content details
    content_type: ContentType
    title: str
    description: str | None = None
    
    # Campaign-specific settings
    status: ContentStatus = ContentStatus.DRAFT
    variant_name: str | None = None  # For A/B testing
    weight: int = 100  # Weight for content rotation (0-100)
    
    # Scheduling
    start_date: datetime | None = None
    end_date: datetime | None = None
    
    # Performance tracking
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    
    # Metadata
    metadata: dict[str, Any] = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    
    # Timestamps
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Private constructor enforcement
    _allow_construction: bool = field(default=False, init=False)
    
    def __post_init__(self) -> None:
        if not self._allow_construction:
            raise ValueError(
                "Use CampaignContent.create() or CampaignContent.reconstruct() "
                "to create instances"
            )
        
        # Validate content configuration
        self._validate()
    
    @classmethod
    def create(
        cls,
        campaign_id: UUID,
        content_service_id: str,
        content_type: ContentType,
        title: str,
        description: str | None = None,
        variant_name: str | None = None,
        weight: int = 100,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        metadata: dict[str, Any] | None = None,
        tags: list[str] | None = None,
    ) -> Self:
        """Factory method to create campaign content"""
        content = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            content_service_id=content_service_id,
            content_type=content_type,
            title=title,
            description=description,
            variant_name=variant_name,
            weight=weight,
            start_date=start_date,
            end_date=end_date,
            metadata=metadata or {},
            tags=tags or [],
        )
        
        object.__setattr__(content, '_allow_construction', True)
        content.__post_init__()
        
        return content
    
    @classmethod
    def reconstruct(
        cls,
        id: UUID,
        campaign_id: UUID,
        content_service_id: str,
        content_type: ContentType,
        title: str,
        description: str | None,
        status: ContentStatus,
        variant_name: str | None,
        weight: int,
        start_date: datetime | None,
        end_date: datetime | None,
        impressions: int,
        clicks: int,
        conversions: int,
        metadata: dict[str, Any],
        tags: list[str],
        created_at: datetime,
        updated_at: datetime,
    ) -> Self:
        """Reconstruct campaign content from persistence"""
        content = cls(
            id=id,
            campaign_id=campaign_id,
            content_service_id=content_service_id,
            content_type=content_type,
            title=title,
            description=description,
            status=status,
            variant_name=variant_name,
            weight=weight,
            start_date=start_date,
            end_date=end_date,
            impressions=impressions,
            clicks=clicks,
            conversions=conversions,
            metadata=metadata,
            tags=tags,
            created_at=created_at,
            updated_at=updated_at,
        )
        
        object.__setattr__(content, '_allow_construction', True)
        content.__post_init__()
        
        return content
    
    def _validate(self) -> None:
        """Validate content configuration"""
        # Title validation
        if not self.title or len(self.title.strip()) < 3:
            raise ValueError("Content title must be at least 3 characters")
        
        if len(self.title) > 200:
            raise ValueError("Content title cannot exceed 200 characters")
        
        # Weight validation
        if not 0 <= self.weight <= 100:
            raise ValueError("Content weight must be between 0 and 100")
        
        # Date validation
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError("End date must be after start date")
        
        # Performance metrics validation
        if any(value < 0 for value in [self.impressions, self.clicks, self.conversions]):
            raise ValueError("Performance metrics cannot be negative")
        
        if self.clicks > self.impressions:
            raise ValueError("Clicks cannot exceed impressions")
        
        if self.conversions > self.clicks:
            raise ValueError("Conversions cannot exceed clicks")
    
    def update_info(
        self, 
        title: str | None = None, 
        description: str | None = None
    ) -> None:
        """Update content information"""
        if self.status not in [ContentStatus.DRAFT, ContentStatus.APPROVED]:
            raise ValueError(f"Cannot edit content in {self.status.value} status")
        
        if title is not None:
            self.title = title
        
        if description is not None:
            self.description = description
        
        self.updated_at = datetime.now(timezone.utc)
        self._validate()
    
    def update_scheduling(
        self, 
        start_date: datetime | None = None, 
        end_date: datetime | None = None
    ) -> None:
        """Update content scheduling"""
        if self.status == ContentStatus.COMPLETED:
            raise ValueError("Cannot update scheduling for completed content")
        
        if start_date is not None:
            self.start_date = start_date
        
        if end_date is not None:
            self.end_date = end_date
        
        self.updated_at = datetime.now(timezone.utc)
        self._validate()
    
    def update_weight(self, weight: int) -> None:
        """Update content weight for rotation"""
        if not 0 <= weight <= 100:
            raise ValueError("Weight must be between 0 and 100")
        
        self.weight = weight
        self.updated_at = datetime.now(timezone.utc)
    
    def approve(self) -> None:
        """Approve content for campaign"""
        if self.status != ContentStatus.DRAFT:
            raise ValueError("Can only approve draft content")
        
        self.status = ContentStatus.APPROVED
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate content in campaign"""
        if self.status not in [ContentStatus.APPROVED, ContentStatus.PAUSED]:
            raise ValueError(
                f"Cannot activate content from {self.status.value} status"
            )
        
        # Check if content should be active based on dates
        now = datetime.now(timezone.utc)
        
        if self.start_date and now < self.start_date:
            raise ValueError("Cannot activate content before start date")
        
        if self.end_date and now > self.end_date:
            raise ValueError("Cannot activate content after end date")
        
        self.status = ContentStatus.ACTIVE
        self.updated_at = datetime.now(timezone.utc)
    
    def pause(self) -> None:
        """Pause active content"""
        if self.status != ContentStatus.ACTIVE:
            raise ValueError("Can only pause active content")
        
        self.status = ContentStatus.PAUSED
        self.updated_at = datetime.now(timezone.utc)
    
    def complete(self) -> None:
        """Mark content as completed"""
        if self.status not in [ContentStatus.ACTIVE, ContentStatus.PAUSED]:
            raise ValueError(
                f"Cannot complete content from {self.status.value} status"
            )
        
        self.status = ContentStatus.COMPLETED
        self.updated_at = datetime.now(timezone.utc)
    
    def record_impression(self) -> None:
        """Record an impression"""
        if self.status != ContentStatus.ACTIVE:
            raise ValueError("Can only record metrics for active content")
        
        self.impressions += 1
        self.updated_at = datetime.now(timezone.utc)
    
    def record_click(self) -> None:
        """Record a click"""
        if self.status != ContentStatus.ACTIVE:
            raise ValueError("Can only record metrics for active content")
        
        self.clicks += 1
        self.updated_at = datetime.now(timezone.utc)
    
    def record_conversion(self) -> None:
        """Record a conversion"""
        if self.status != ContentStatus.ACTIVE:
            raise ValueError("Can only record metrics for active content")
        
        self.conversions += 1
        self.updated_at = datetime.now(timezone.utc)
    
    def is_active_now(self) -> bool:
        """Check if content is currently active"""
        if self.status != ContentStatus.ACTIVE:
            return False
        
        now = datetime.now(timezone.utc)
        
        # Check start date
        if self.start_date and now < self.start_date:
            return False
        
        # Check end date
        if self.end_date and now > self.end_date:
            return False
        
        return True
    
    def get_click_through_rate(self) -> float:
        """Calculate click-through rate"""
        if self.impressions == 0:
            return 0.0
        return (self.clicks / self.impressions) * 100
    
    def get_conversion_rate(self) -> float:
        """Calculate conversion rate"""
        if self.clicks == 0:
            return 0.0
        return (self.conversions / self.clicks) * 100
    
    def add_metadata(self, key: str, value: Any) -> None:
        """Add metadata"""
        self.metadata[key] = value
        self.updated_at = datetime.now(timezone.utc)
    
    def remove_metadata(self, key: str) -> None:
        """Remove metadata"""
        if key in self.metadata:
            del self.metadata[key]
            self.updated_at = datetime.now(timezone.utc)
    
    def add_tag(self, tag: str) -> None:
        """Add tag"""
        if tag not in self.tags:
            self.tags.append(tag)
            self.updated_at = datetime.now(timezone.utc)
    
    def remove_tag(self, tag: str) -> None:
        """Remove tag"""
        if tag in self.tags:
            self.tags.remove(tag)
            self.updated_at = datetime.now(timezone.utc)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            "id": str(self.id),
            "campaign_id": str(self.campaign_id),
            "content_service_id": self.content_service_id,
            "content_type": self.content_type.value,
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "variant_name": self.variant_name,
            "weight": self.weight,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "impressions": self.impressions,
            "clicks": self.clicks,
            "conversions": self.conversions,
            "click_through_rate": round(self.get_click_through_rate(), 2),
            "conversion_rate": round(self.get_conversion_rate(), 2),
            "is_active_now": self.is_active_now(),
            "metadata": self.metadata,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }