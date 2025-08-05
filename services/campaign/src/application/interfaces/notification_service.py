from abc import ABC, abstractmethod
from enum import Enum
from typing import Any


class NotificationType(Enum):
    """Notification types"""
    
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    IN_APP = "IN_APP"


class NotificationPriority(Enum):
    """Notification priorities"""
    
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Notification:
    """Notification message"""
    
    def __init__(
        self,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        metadata: dict[str, Any] | None = None
    ):
        self.user_id = user_id
        self.type = type
        self.title = title
        self.message = message
        self.priority = priority
        self.metadata = metadata or {}


class NotificationService(ABC):
    """Notification service interface"""
    
    @abstractmethod
    async def send_notification(self, notification: Notification) -> bool:
        """Send notification to user"""
        pass
    
    @abstractmethod
    async def send_bulk_notifications(self, notifications: list[Notification]) -> dict[str, bool]:
        """Send multiple notifications, returns success status for each"""
        pass
    
    @abstractmethod
    async def send_campaign_alert(
        self, 
        user_id: str, 
        campaign_name: str, 
        alert_type: str, 
        message: str
    ) -> bool:
        """Send campaign-specific alert"""
        pass