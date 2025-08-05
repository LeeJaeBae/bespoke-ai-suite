from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Self
from uuid import UUID, uuid4

from ..value_objects import (
    Budget,
    CampaignStatus,
    DateRange,
    PerformanceMetrics,
    TargetAudience,
)


@dataclass
class Campaign:
    """Campaign aggregate root"""
    
    # Identity
    id: UUID
    user_id: str  # Campaign owner
    
    # Basic info
    name: str
    description: str
    
    # Campaign configuration
    target_audience: TargetAudience
    budget: Budget
    date_range: DateRange
    
    # Status and tracking
    status: CampaignStatus
    performance_metrics: PerformanceMetrics
    
    # Content and channels
    content_ids: list[str]  # References to content service
    channels: list[str]  # email, social, display, etc.
    
    # Metadata
    tags: list[str]
    created_at: datetime
    updated_at: datetime
    
    # A/B testing
    is_ab_test: bool = False
    ab_test_variants: list[dict] = field(default_factory=list)
    
    # Private constructor enforcement
    _allow_construction: bool = field(default=False, init=False)
    
    def __post_init__(self) -> None:
        if not self._allow_construction:
            raise ValueError(
                "Use Campaign.create() or Campaign.reconstruct() to create instances"
            )
        
        # Validate business rules
        self._validate()
    
    @classmethod
    def create(
        cls,
        user_id: str,
        name: str,
        description: str,
        target_audience: TargetAudience,
        budget: Budget,
        date_range: DateRange,
        channels: list[str],
        content_ids: list[str] | None = None,
        tags: list[str] | None = None,
    ) -> Self:
        """Factory method to create new campaign"""
        now = datetime.now(timezone.utc)
        
        campaign = cls(
            id=uuid4(),
            user_id=user_id,
            name=name,
            description=description,
            target_audience=target_audience,
            budget=budget,
            date_range=date_range,
            status=CampaignStatus.DRAFT,
            performance_metrics=PerformanceMetrics(),
            content_ids=content_ids or [],
            channels=channels,
            tags=tags or [],
            created_at=now,
            updated_at=now,
            is_ab_test=False,
            ab_test_variants=[],
        )
        
        # Allow construction
        object.__setattr__(campaign, '_allow_construction', True)
        campaign.__post_init__()
        
        return campaign
    
    @classmethod
    def reconstruct(
        cls,
        id: UUID,
        user_id: str,
        name: str,
        description: str,
        target_audience: TargetAudience,
        budget: Budget,
        date_range: DateRange,
        status: CampaignStatus,
        performance_metrics: PerformanceMetrics,
        content_ids: list[str],
        channels: list[str],
        tags: list[str],
        created_at: datetime,
        updated_at: datetime,
        is_ab_test: bool = False,
        ab_test_variants: list[dict] | None = None,
    ) -> Self:
        """Reconstruct campaign from persistence"""
        campaign = cls(
            id=id,
            user_id=user_id,
            name=name,
            description=description,
            target_audience=target_audience,
            budget=budget,
            date_range=date_range,
            status=status,
            performance_metrics=performance_metrics,
            content_ids=content_ids,
            channels=channels,
            tags=tags,
            created_at=created_at,
            updated_at=updated_at,
            is_ab_test=is_ab_test,
            ab_test_variants=ab_test_variants or [],
        )
        
        # Allow construction
        object.__setattr__(campaign, '_allow_construction', True)
        campaign.__post_init__()
        
        return campaign
    
    def _validate(self) -> None:
        """Validate campaign business rules"""
        # Name validation
        if not self.name or len(self.name.strip()) < 3:
            raise ValueError("Campaign name must be at least 3 characters")
        
        if len(self.name) > 100:
            raise ValueError("Campaign name cannot exceed 100 characters")
        
        # Description validation
        if not self.description or len(self.description.strip()) < 10:
            raise ValueError("Campaign description must be at least 10 characters")
        
        # Channel validation
        if not self.channels:
            raise ValueError("At least one channel must be selected")
        
        valid_channels = {"email", "social", "display", "search", "video", "native"}
        invalid_channels = set(self.channels) - valid_channels
        if invalid_channels:
            raise ValueError(f"Invalid channels: {invalid_channels}")
        
        # Budget validation for active campaigns
        if self.status == CampaignStatus.ACTIVE and self.budget.amount == 0:
            raise ValueError("Active campaigns must have a budget")
        
        # Content validation for non-draft campaigns
        if (
            self.status not in [CampaignStatus.DRAFT, CampaignStatus.CANCELLED]
            and not self.content_ids
        ):
            raise ValueError("Campaign must have at least one content item")
    
    def update_info(self, name: str | None = None, description: str | None = None) -> None:
        """Update campaign basic information"""
        if not CampaignStatus.can_edit(self.status):
            raise ValueError(f"Cannot edit campaign in {self.status.value} status")
        
        if name is not None:
            self.name = name
        
        if description is not None:
            self.description = description
        
        self.updated_at = datetime.now(timezone.utc)
        self._validate()
    
    def update_target_audience(self, target_audience: TargetAudience) -> None:
        """Update target audience"""
        if not CampaignStatus.can_edit(self.status):
            raise ValueError(f"Cannot edit campaign in {self.status.value} status")
        
        self.target_audience = target_audience
        self.updated_at = datetime.now(timezone.utc)
    
    def update_budget(self, budget: Budget) -> None:
        """Update campaign budget"""
        if CampaignStatus.is_finished(self.status):
            raise ValueError("Cannot update budget for finished campaign")
        
        # Check if reducing budget below spent amount
        if budget.amount < self.performance_metrics.spend:
            raise ValueError(
                f"Cannot set budget below already spent amount "
                f"({self.performance_metrics.spend})"
            )
        
        self.budget = budget
        self.updated_at = datetime.now(timezone.utc)
    
    def update_date_range(self, date_range: DateRange) -> None:
        """Update campaign date range"""
        if not CampaignStatus.can_edit(self.status):
            raise ValueError(f"Cannot edit campaign in {self.status.value} status")
        
        # Cannot set past dates for future campaigns
        if date_range.is_past():
            raise ValueError("Cannot set campaign dates in the past")
        
        self.date_range = date_range
        self.updated_at = datetime.now(timezone.utc)
    
    def add_content(self, content_id: str) -> None:
        """Add content to campaign"""
        if content_id in self.content_ids:
            raise ValueError("Content already added to campaign")
        
        self.content_ids.append(content_id)
        self.updated_at = datetime.now(timezone.utc)
    
    def remove_content(self, content_id: str) -> None:
        """Remove content from campaign"""
        if not CampaignStatus.can_edit(self.status):
            raise ValueError(f"Cannot edit campaign in {self.status.value} status")
        
        if content_id not in self.content_ids:
            raise ValueError("Content not found in campaign")
        
        self.content_ids.remove(content_id)
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate the campaign"""
        if not CampaignStatus.can_activate(self.status):
            raise ValueError(f"Cannot activate campaign from {self.status.value} status")
        
        # Validate campaign is ready
        if not self.content_ids:
            raise ValueError("Cannot activate campaign without content")
        
        if self.budget.amount == 0:
            raise ValueError("Cannot activate campaign without budget")
        
        # Check if campaign should be scheduled or activated immediately
        if self.date_range.is_future():
            self.status = CampaignStatus.SCHEDULED
        else:
            self.status = CampaignStatus.ACTIVE
        
        self.updated_at = datetime.now(timezone.utc)
    
    def pause(self) -> None:
        """Pause the campaign"""
        if not CampaignStatus.can_pause(self.status):
            raise ValueError(f"Cannot pause campaign in {self.status.value} status")
        
        self.status = CampaignStatus.PAUSED
        self.updated_at = datetime.now(timezone.utc)
    
    def resume(self) -> None:
        """Resume paused campaign"""
        if self.status != CampaignStatus.PAUSED:
            raise ValueError("Can only resume paused campaigns")
        
        # Check if campaign period has ended
        if self.date_range.is_past():
            self.status = CampaignStatus.COMPLETED
        else:
            self.status = CampaignStatus.ACTIVE
        
        self.updated_at = datetime.now(timezone.utc)
    
    def cancel(self) -> None:
        """Cancel the campaign"""
        if CampaignStatus.is_finished(self.status):
            raise ValueError("Cannot cancel finished campaign")
        
        self.status = CampaignStatus.CANCELLED
        self.updated_at = datetime.now(timezone.utc)
    
    def complete(self) -> None:
        """Mark campaign as completed"""
        if self.status != CampaignStatus.ACTIVE:
            raise ValueError("Can only complete active campaigns")
        
        self.status = CampaignStatus.COMPLETED
        self.updated_at = datetime.now(timezone.utc)
    
    def record_spend(self, amount: Decimal) -> None:
        """Record campaign spend"""
        if not CampaignStatus.is_running(self.status):
            raise ValueError("Can only record spend for running campaigns")
        
        # Check budget limit
        new_spend = self.performance_metrics.spend + amount
        if new_spend > self.budget.amount:
            raise ValueError("Spend would exceed campaign budget")
        
        # Check daily limit
        # TODO: Implement daily spend tracking
        
        self.performance_metrics.spend = new_spend
        
        # Auto-pause if budget exhausted
        if new_spend >= self.budget.amount:
            self.pause()
    
    def update_metrics(self, metrics_update: dict) -> None:
        """Update performance metrics"""
        # This would typically be called by a background job or analytics service
        if "impressions" in metrics_update:
            self.performance_metrics.impressions += metrics_update["impressions"]
        
        if "clicks" in metrics_update:
            self.performance_metrics.clicks += metrics_update["clicks"]
        
        if "conversions" in metrics_update:
            self.performance_metrics.conversions += metrics_update["conversions"]
        
        if "revenue" in metrics_update:
            self.performance_metrics.revenue += Decimal(str(metrics_update["revenue"]))
        
        self.updated_at = datetime.now(timezone.utc)
    
    def enable_ab_testing(self, variants: list[dict]) -> None:
        """Enable A/B testing for campaign"""
        if self.status != CampaignStatus.DRAFT:
            raise ValueError("Can only enable A/B testing for draft campaigns")
        
        if len(variants) < 2:
            raise ValueError("A/B testing requires at least 2 variants")
        
        # Validate variant structure
        required_keys = {"name", "percentage", "content_ids"}
        for variant in variants:
            if not required_keys.issubset(variant.keys()):
                raise ValueError(f"Variant must contain keys: {required_keys}")
            
            if not 0 < variant["percentage"] <= 100:
                raise ValueError("Variant percentage must be between 0 and 100")
        
        # Validate percentages sum to 100
        total_percentage = sum(v["percentage"] for v in variants)
        if total_percentage != 100:
            raise ValueError("Variant percentages must sum to 100")
        
        self.is_ab_test = True
        self.ab_test_variants = variants
        self.updated_at = datetime.now(timezone.utc)
    
    def get_remaining_budget(self) -> Decimal:
        """Get remaining campaign budget"""
        return self.budget.amount - self.performance_metrics.spend
    
    def get_days_remaining(self) -> int:
        """Get days remaining in campaign"""
        if self.date_range.is_past():
            return 0
        
        now = datetime.now(timezone.utc)
        if now < self.date_range.start_date:
            return self.date_range.duration_days()
        
        remaining = (self.date_range.end_date - now).days
        return max(0, remaining)
    
    def is_budget_exhausted(self) -> bool:
        """Check if budget is exhausted"""
        return self.performance_metrics.spend >= self.budget.amount
    
    def can_run(self) -> bool:
        """Check if campaign can run"""
        return (
            self.status == CampaignStatus.ACTIVE
            and not self.is_budget_exhausted()
            and self.date_range.is_active()
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "target_audience": self.target_audience.to_dict(),
            "budget": self.budget.to_dict(),
            "date_range": self.date_range.to_dict(),
            "status": self.status.value,
            "performance_metrics": self.performance_metrics.to_dict(),
            "content_ids": self.content_ids,
            "channels": self.channels,
            "tags": self.tags,
            "is_ab_test": self.is_ab_test,
            "ab_test_variants": self.ab_test_variants,
            "remaining_budget": str(self.get_remaining_budget()),
            "days_remaining": self.get_days_remaining(),
            "can_run": self.can_run(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }