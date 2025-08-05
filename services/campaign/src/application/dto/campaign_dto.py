from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TargetAudienceDTO(BaseModel):
    """Target audience DTO"""
    
    age_range: dict[str, int] | None = None  # {"min": 18, "max": 65}
    gender: str = "ALL"
    locations: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    devices: list[str] = Field(default_factory=list)
    custom_segments: list[str] = Field(default_factory=list)


class BudgetDTO(BaseModel):
    """Budget DTO"""
    
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    daily_limit: Decimal | None = Field(None, gt=0)
    
    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        valid_currencies = ["USD", "EUR", "GBP", "JPY", "KRW", "CNY"]
        if v not in valid_currencies:
            raise ValueError(f"Currency must be one of {valid_currencies}")
        return v


class DateRangeDTO(BaseModel):
    """Date range DTO"""
    
    start_date: datetime
    end_date: datetime
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v: datetime, info) -> datetime:
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError("End date must be after start date")
        return v


class CreateCampaignRequest(BaseModel):
    """Create campaign request"""
    
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    target_audience: TargetAudienceDTO
    budget: BudgetDTO
    date_range: DateRangeDTO
    channels: list[str] = Field(..., min_length=1)
    content_ids: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    
    @field_validator('channels')
    @classmethod
    def validate_channels(cls, v: list[str]) -> list[str]:
        valid_channels = {"email", "social", "display", "search", "video", "native"}
        invalid = set(v) - valid_channels
        if invalid:
            raise ValueError(f"Invalid channels: {invalid}")
        return v


class UpdateCampaignRequest(BaseModel):
    """Update campaign request"""
    
    name: str | None = Field(None, min_length=3, max_length=100)
    description: str | None = Field(None, min_length=10, max_length=1000)
    target_audience: TargetAudienceDTO | None = None
    budget: BudgetDTO | None = None
    date_range: DateRangeDTO | None = None
    channels: list[str] | None = None
    tags: list[str] | None = None
    
    @field_validator('channels')
    @classmethod
    def validate_channels(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        
        valid_channels = {"email", "social", "display", "search", "video", "native"}
        invalid = set(v) - valid_channels
        if invalid:
            raise ValueError(f"Invalid channels: {invalid}")
        return v


class PerformanceMetricsDTO(BaseModel):
    """Performance metrics DTO"""
    
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: Decimal = Decimal("0")
    revenue: Decimal = Decimal("0")
    likes: int = 0
    shares: int = 0
    comments: int = 0
    emails_sent: int = 0
    emails_opened: int = 0
    emails_clicked: int = 0
    
    # Calculated metrics
    click_through_rate: float = 0.0
    conversion_rate: float = 0.0
    cost_per_click: Decimal = Decimal("0")
    cost_per_conversion: Decimal = Decimal("0")
    return_on_ad_spend: float = 0.0
    engagement_rate: float = 0.0
    email_open_rate: float = 0.0
    email_click_rate: float = 0.0


class CampaignResponse(BaseModel):
    """Campaign response"""
    
    id: UUID
    user_id: str
    name: str
    description: str
    target_audience: TargetAudienceDTO
    budget: BudgetDTO
    date_range: DateRangeDTO
    status: str
    performance_metrics: PerformanceMetricsDTO
    content_ids: list[str]
    channels: list[str]
    tags: list[str]
    is_ab_test: bool
    ab_test_variants: list[dict[str, Any]]
    remaining_budget: Decimal
    days_remaining: int
    can_run: bool
    created_at: datetime
    updated_at: datetime


class CampaignListResponse(BaseModel):
    """Campaign list response with pagination"""
    
    campaigns: list[CampaignResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


class CampaignStatsResponse(BaseModel):
    """Campaign statistics response"""
    
    total_campaigns: int
    active_campaigns: int
    paused_campaigns: int
    completed_campaigns: int
    draft_campaigns: int
    total_spend: Decimal
    total_revenue: Decimal
    average_roi: float
    top_performing_campaigns: list[CampaignResponse]


class ABTestVariantRequest(BaseModel):
    """A/B test variant request"""
    
    name: str = Field(..., min_length=1, max_length=50)
    percentage: int = Field(..., ge=1, le=100)
    content_ids: list[str] = Field(..., min_length=1)


class EnableABTestRequest(BaseModel):
    """Enable A/B test request"""
    
    variants: list[ABTestVariantRequest] = Field(..., min_length=2)
    
    @field_validator('variants')
    @classmethod
    def validate_variants(cls, v: list[ABTestVariantRequest]) -> list[ABTestVariantRequest]:
        total_percentage = sum(variant.percentage for variant in v)
        if total_percentage != 100:
            raise ValueError("Variant percentages must sum to 100")
        
        names = [variant.name for variant in v]
        if len(names) != len(set(names)):
            raise ValueError("Variant names must be unique")
        
        return v


class CampaignActionRequest(BaseModel):
    """Campaign action request (activate, pause, etc.)"""
    
    action: str = Field(..., pattern="^(activate|pause|resume|cancel|complete)$")
    reason: str | None = Field(None, max_length=500)