from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CreateScheduleRequest(BaseModel):
    """Create schedule request"""
    
    schedule_type: str = Field(..., pattern="^(IMMEDIATE|ONCE|DAILY|WEEKLY|MONTHLY)$")
    start_time: time | None = None
    timezone: str = "UTC"
    run_at: datetime | None = None  # For ONCE type
    days_of_week: list[str] = Field(default_factory=list)  # For WEEKLY type
    day_of_month: int | None = Field(None, ge=1, le=31)  # For MONTHLY type
    
    @field_validator('days_of_week')
    @classmethod
    def validate_days_of_week(cls, v: list[str]) -> list[str]:
        valid_days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"}
        invalid = set(v) - valid_days
        if invalid:
            raise ValueError(f"Invalid days: {invalid}")
        return v
    
    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        import pytz
        try:
            pytz.timezone(v)
        except pytz.exceptions.UnknownTimeZoneError:
            raise ValueError(f"Unknown timezone: {v}")
        return v


class UpdateScheduleRequest(BaseModel):
    """Update schedule request"""
    
    start_time: time | None = None
    timezone: str | None = None
    days_of_week: list[str] | None = None
    day_of_month: int | None = Field(None, ge=1, le=31)
    is_active: bool | None = None
    
    @field_validator('days_of_week')
    @classmethod
    def validate_days_of_week(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        
        valid_days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"}
        invalid = set(v) - valid_days
        if invalid:
            raise ValueError(f"Invalid days: {invalid}")
        return v
    
    @field_validator('timezone')
    @classmethod
    def validate_timezone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        
        import pytz
        try:
            pytz.timezone(v)
        except pytz.exceptions.UnknownTimeZoneError:
            raise ValueError(f"Unknown timezone: {v}")
        return v


class ScheduleResponse(BaseModel):
    """Schedule response"""
    
    id: UUID
    campaign_id: UUID
    schedule_type: str
    start_time: time | None
    timezone: str
    days_of_week: list[str]
    day_of_month: int | None
    last_run: datetime | None
    next_run: datetime | None
    is_active: bool
    created_at: datetime
    updated_at: datetime