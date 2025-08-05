from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from ..entities import Schedule
from ..entities.schedule import ScheduleType


class ScheduleRepository(ABC):
    """Schedule repository interface"""
    
    @abstractmethod
    async def save(self, schedule: Schedule) -> None:
        """Save schedule"""
        pass
    
    @abstractmethod
    async def find_by_id(self, schedule_id: UUID) -> Schedule | None:
        """Find schedule by ID"""
        pass
    
    @abstractmethod
    async def find_by_campaign(self, campaign_id: UUID) -> list[Schedule]:
        """Find all schedules for a campaign"""
        pass
    
    @abstractmethod
    async def find_active_schedules(self) -> list[Schedule]:
        """Find all active schedules"""
        pass
    
    @abstractmethod
    async def find_schedules_to_run(
        self, 
        current_time: datetime, 
        tolerance_minutes: int = 5
    ) -> list[Schedule]:
        """Find schedules that should run now"""
        pass
    
    @abstractmethod
    async def find_by_type(self, schedule_type: ScheduleType) -> list[Schedule]:
        """Find schedules by type"""
        pass
    
    @abstractmethod
    async def find_overdue_schedules(
        self, 
        current_time: datetime, 
        minutes_overdue: int = 30
    ) -> list[Schedule]:
        """Find schedules that are overdue"""
        pass
    
    @abstractmethod
    async def update(self, schedule: Schedule) -> None:
        """Update existing schedule"""
        pass
    
    @abstractmethod
    async def delete(self, schedule_id: UUID) -> None:
        """Delete schedule"""
        pass
    
    @abstractmethod
    async def delete_by_campaign(self, campaign_id: UUID) -> int:
        """Delete all schedules for a campaign, returns count"""
        pass
    
    @abstractmethod
    async def exists(self, schedule_id: UUID) -> bool:
        """Check if schedule exists"""
        pass
    
    @abstractmethod
    async def count_by_campaign(self, campaign_id: UUID) -> int:
        """Count schedules for a campaign"""
        pass
    
    @abstractmethod
    async def count_active_schedules(self) -> int:
        """Count active schedules"""
        pass
    
    @abstractmethod
    async def bulk_deactivate(self, schedule_ids: list[UUID]) -> int:
        """Bulk deactivate schedules"""
        pass