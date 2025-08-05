from dataclasses import dataclass, field
from datetime import datetime, time, timezone
from enum import Enum
from typing import Self
from uuid import UUID, uuid4


class ScheduleType(Enum):
    """Schedule type options"""
    
    IMMEDIATE = "IMMEDIATE"  # 즉시 실행
    ONCE = "ONCE"  # 특정 시간에 한 번
    DAILY = "DAILY"  # 매일
    WEEKLY = "WEEKLY"  # 매주 특정 요일
    MONTHLY = "MONTHLY"  # 매월 특정 날짜


class DayOfWeek(Enum):
    """Days of the week"""
    
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


@dataclass
class Schedule:
    """Campaign schedule entity"""
    
    # Identity
    id: UUID
    campaign_id: UUID
    
    # Schedule configuration
    schedule_type: ScheduleType
    
    # Time settings
    start_time: time | None = None  # Time of day to run
    timezone: str = "UTC"  # Timezone for schedule
    
    # Recurrence settings
    days_of_week: list[DayOfWeek] = field(default_factory=list)  # For weekly
    day_of_month: int | None = None  # For monthly (1-31)
    
    # Tracking
    last_run: datetime | None = None
    next_run: datetime | None = None
    is_active: bool = True
    
    # Metadata
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Private constructor enforcement
    _allow_construction: bool = field(default=False, init=False)
    
    def __post_init__(self) -> None:
        if not self._allow_construction:
            raise ValueError(
                "Use Schedule.create() or Schedule.reconstruct() to create instances"
            )
        
        # Validate schedule configuration
        self._validate()
    
    @classmethod
    def create_immediate(cls, campaign_id: UUID) -> Self:
        """Create immediate schedule"""
        schedule = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            schedule_type=ScheduleType.IMMEDIATE,
            is_active=True,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        
        return schedule
    
    @classmethod
    def create_once(
        cls,
        campaign_id: UUID,
        run_at: datetime,
        timezone_str: str = "UTC"
    ) -> Self:
        """Create one-time schedule"""
        schedule = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            schedule_type=ScheduleType.ONCE,
            start_time=run_at.time(),
            timezone=timezone_str,
            next_run=run_at,
            is_active=True,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        
        return schedule
    
    @classmethod
    def create_daily(
        cls,
        campaign_id: UUID,
        start_time: time,
        timezone_str: str = "UTC"
    ) -> Self:
        """Create daily schedule"""
        schedule = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            schedule_type=ScheduleType.DAILY,
            start_time=start_time,
            timezone=timezone_str,
            is_active=True,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        schedule._calculate_next_run()
        
        return schedule
    
    @classmethod
    def create_weekly(
        cls,
        campaign_id: UUID,
        days_of_week: list[DayOfWeek],
        start_time: time,
        timezone_str: str = "UTC"
    ) -> Self:
        """Create weekly schedule"""
        if not days_of_week:
            raise ValueError("Weekly schedule must specify at least one day")
        
        schedule = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            schedule_type=ScheduleType.WEEKLY,
            start_time=start_time,
            timezone=timezone_str,
            days_of_week=days_of_week,
            is_active=True,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        schedule._calculate_next_run()
        
        return schedule
    
    @classmethod
    def create_monthly(
        cls,
        campaign_id: UUID,
        day_of_month: int,
        start_time: time,
        timezone_str: str = "UTC"
    ) -> Self:
        """Create monthly schedule"""
        schedule = cls(
            id=uuid4(),
            campaign_id=campaign_id,
            schedule_type=ScheduleType.MONTHLY,
            start_time=start_time,
            timezone=timezone_str,
            day_of_month=day_of_month,
            is_active=True,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        schedule._calculate_next_run()
        
        return schedule
    
    @classmethod
    def reconstruct(
        cls,
        id: UUID,
        campaign_id: UUID,
        schedule_type: ScheduleType,
        start_time: time | None,
        timezone: str,
        days_of_week: list[DayOfWeek],
        day_of_month: int | None,
        last_run: datetime | None,
        next_run: datetime | None,
        is_active: bool,
        created_at: datetime,
        updated_at: datetime,
    ) -> Self:
        """Reconstruct schedule from persistence"""
        schedule = cls(
            id=id,
            campaign_id=campaign_id,
            schedule_type=schedule_type,
            start_time=start_time,
            timezone=timezone,
            days_of_week=days_of_week,
            day_of_month=day_of_month,
            last_run=last_run,
            next_run=next_run,
            is_active=is_active,
            created_at=created_at,
            updated_at=updated_at,
        )
        
        object.__setattr__(schedule, '_allow_construction', True)
        schedule.__post_init__()
        
        return schedule
    
    def _validate(self) -> None:
        """Validate schedule configuration"""
        if self.schedule_type == ScheduleType.WEEKLY and not self.days_of_week:
            raise ValueError("Weekly schedule must specify days of week")
        
        if self.schedule_type == ScheduleType.MONTHLY:
            if not self.day_of_month or not 1 <= self.day_of_month <= 31:
                raise ValueError("Monthly schedule must specify valid day (1-31)")
        
        if self.schedule_type in [
            ScheduleType.DAILY, 
            ScheduleType.WEEKLY, 
            ScheduleType.MONTHLY
        ]:
            if not self.start_time:
                raise ValueError(f"{self.schedule_type.value} schedule must specify start time")
    
    def _calculate_next_run(self) -> None:
        """Calculate next run time based on schedule type"""
        from datetime import timedelta
        import pytz
        
        if not self.is_active:
            self.next_run = None
            return
        
        tz = pytz.timezone(self.timezone)
        now = datetime.now(tz)
        
        if self.schedule_type == ScheduleType.IMMEDIATE:
            self.next_run = now
            
        elif self.schedule_type == ScheduleType.ONCE:
            # Already set during creation
            pass
            
        elif self.schedule_type == ScheduleType.DAILY:
            # Find next occurrence of start_time
            next_run = now.replace(
                hour=self.start_time.hour,
                minute=self.start_time.minute,
                second=0,
                microsecond=0
            )
            
            if next_run <= now:
                next_run += timedelta(days=1)
            
            self.next_run = next_run
            
        elif self.schedule_type == ScheduleType.WEEKLY:
            # Find next occurrence of specified day and time
            current_weekday = now.weekday()
            days_ahead = None
            
            for day in sorted(self.days_of_week, key=lambda d: d.value):
                if day.value > current_weekday:
                    days_ahead = day.value - current_weekday
                    break
                elif day.value == current_weekday:
                    # Check if time has passed today
                    target_time = now.replace(
                        hour=self.start_time.hour,
                        minute=self.start_time.minute,
                        second=0,
                        microsecond=0
                    )
                    if target_time > now:
                        days_ahead = 0
                        break
            
            if days_ahead is None:
                # Next occurrence is next week
                days_ahead = 7 - current_weekday + self.days_of_week[0].value
            
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(
                hour=self.start_time.hour,
                minute=self.start_time.minute,
                second=0,
                microsecond=0
            )
            
            self.next_run = next_run
            
        elif self.schedule_type == ScheduleType.MONTHLY:
            # Find next occurrence of day_of_month
            next_run = now.replace(
                day=min(self.day_of_month, self._days_in_month(now.year, now.month)),
                hour=self.start_time.hour,
                minute=self.start_time.minute,
                second=0,
                microsecond=0
            )
            
            if next_run <= now:
                # Move to next month
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
                
                # Handle months with fewer days
                next_run = next_run.replace(
                    day=min(
                        self.day_of_month, 
                        self._days_in_month(next_run.year, next_run.month)
                    )
                )
            
            self.next_run = next_run
    
    def _days_in_month(self, year: int, month: int) -> int:
        """Get number of days in a month"""
        import calendar
        return calendar.monthrange(year, month)[1]
    
    def mark_run(self) -> None:
        """Mark schedule as run and calculate next run"""
        self.last_run = datetime.now(timezone.utc)
        
        if self.schedule_type == ScheduleType.ONCE:
            # One-time schedule becomes inactive after running
            self.is_active = False
            self.next_run = None
        else:
            self._calculate_next_run()
        
        self.updated_at = datetime.now(timezone.utc)
    
    def activate(self) -> None:
        """Activate the schedule"""
        self.is_active = True
        self._calculate_next_run()
        self.updated_at = datetime.now(timezone.utc)
    
    def deactivate(self) -> None:
        """Deactivate the schedule"""
        self.is_active = False
        self.next_run = None
        self.updated_at = datetime.now(timezone.utc)
    
    def should_run_now(self, tolerance_minutes: int = 5) -> bool:
        """Check if schedule should run now"""
        if not self.is_active or not self.next_run:
            return False
        
        now = datetime.now(timezone.utc)
        if self.next_run.tzinfo is None:
            self.next_run = self.next_run.replace(tzinfo=timezone.utc)
        
        # Allow some tolerance for delayed execution
        from datetime import timedelta
        
        return (
            self.next_run <= now <= 
            self.next_run + timedelta(minutes=tolerance_minutes)
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization"""
        return {
            "id": str(self.id),
            "campaign_id": str(self.campaign_id),
            "schedule_type": self.schedule_type.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "timezone": self.timezone,
            "days_of_week": [day.name for day in self.days_of_week],
            "day_of_month": self.day_of_month,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }