from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Self


@dataclass(frozen=True)
class DateRange:
    """Date range for campaign duration"""
    
    start_date: datetime
    end_date: datetime
    
    def __post_init__(self) -> None:
        # Ensure dates are timezone-aware
        if self.start_date.tzinfo is None:
            object.__setattr__(
                self, 
                'start_date', 
                self.start_date.replace(tzinfo=timezone.utc)
            )
        
        if self.end_date.tzinfo is None:
            object.__setattr__(
                self, 
                'end_date', 
                self.end_date.replace(tzinfo=timezone.utc)
            )
        
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
    
    @classmethod
    def create(
        cls,
        start_date: datetime | str,
        end_date: datetime | str
    ) -> Self:
        """Factory method to create DateRange"""
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date)
        
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date)
        
        return cls(start_date=start_date, end_date=end_date)
    
    def contains(self, date: datetime) -> bool:
        """Check if date is within range"""
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        
        return self.start_date <= date <= self.end_date
    
    def is_active(self, current_time: datetime | None = None) -> bool:
        """Check if date range is currently active"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        return self.contains(current_time)
    
    def is_future(self, current_time: datetime | None = None) -> bool:
        """Check if date range is in the future"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=timezone.utc)
        
        return self.start_date > current_time
    
    def is_past(self, current_time: datetime | None = None) -> bool:
        """Check if date range is in the past"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        if current_time.tzinfo is None:
            current_time = current_time.replace(tzinfo=timezone.utc)
        
        return self.end_date < current_time
    
    def duration_days(self) -> int:
        """Get duration in days"""
        return (self.end_date - self.start_date).days
    
    def overlaps_with(self, other: "DateRange") -> bool:
        """Check if this date range overlaps with another"""
        return not (
            self.end_date < other.start_date or 
            self.start_date > other.end_date
        )
    
    def extend(self, days: int) -> Self:
        """Extend the date range by specified days"""
        from datetime import timedelta
        
        new_end_date = self.end_date + timedelta(days=days)
        return DateRange(start_date=self.start_date, end_date=new_end_date)
    
    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "duration_days": self.duration_days()
        }
    
    def __str__(self) -> str:
        return (
            f"{self.start_date.strftime('%Y-%m-%d')} - "
            f"{self.end_date.strftime('%Y-%m-%d')} "
            f"({self.duration_days()} days)"
        )