from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class AddContentRequest(BaseModel):
    """Add content to campaign request"""
    
    content_service_id: str = Field(..., min_length=1)
    content_type: str = Field(..., pattern="^(EMAIL|SOCIAL_POST|DISPLAY_AD|VIDEO_AD|BLOG_POST|LANDING_PAGE)$")
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = Field(None, max_length=1000)
    variant_name: str | None = Field(None, max_length=50)
    weight: int = Field(default=100, ge=0, le=100)
    start_date: datetime | None = None
    end_date: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)


class UpdateContentRequest(BaseModel):
    """Update campaign content request"""
    
    title: str | None = Field(None, min_length=3, max_length=200)
    description: str | None = Field(None, max_length=1000)
    weight: int | None = Field(None, ge=0, le=100)
    start_date: datetime | None = None
    end_date: datetime | None = None
    metadata: dict[str, Any] | None = None
    tags: list[str] | None = None


class ContentResponse(BaseModel):
    """Campaign content response"""
    
    id: UUID
    campaign_id: UUID
    content_service_id: str
    content_type: str
    title: str
    description: str | None
    status: str
    variant_name: str | None
    weight: int
    start_date: datetime | None
    end_date: datetime | None
    impressions: int
    clicks: int
    conversions: int
    click_through_rate: float
    conversion_rate: float
    is_active_now: bool
    metadata: dict[str, Any]
    tags: list[str]
    created_at: datetime
    updated_at: datetime


class ContentMetricsUpdate(BaseModel):
    """Content metrics update"""
    
    impressions: int | None = Field(None, ge=0)
    clicks: int | None = Field(None, ge=0)
    conversions: int | None = Field(None, ge=0)


class ContentActionRequest(BaseModel):
    """Content action request"""
    
    action: str = Field(..., pattern="^(approve|activate|pause|complete)$")
    reason: str | None = Field(None, max_length=500)