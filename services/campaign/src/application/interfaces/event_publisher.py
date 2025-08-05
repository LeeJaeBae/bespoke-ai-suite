from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4


@dataclass
class DomainEvent:
    """Base domain event"""
    
    event_id: str
    event_type: str
    aggregate_id: str
    payload: dict[str, Any]
    timestamp: datetime
    version: int = 1
    
    def __post_init__(self) -> None:
        if not self.event_id:
            self.event_id = str(uuid4())
        
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc)


@dataclass
class CampaignCreatedEvent(DomainEvent):
    """Campaign created event"""
    
    def __init__(self, campaign_id: UUID, user_id: str, campaign_name: str):
        super().__init__(
            event_id=str(uuid4()),
            event_type="campaign.created",
            aggregate_id=str(campaign_id),
            payload={
                "campaign_id": str(campaign_id),
                "user_id": user_id,
                "campaign_name": campaign_name
            },
            timestamp=datetime.now(timezone.utc)
        )


@dataclass
class CampaignActivatedEvent(DomainEvent):
    """Campaign activated event"""
    
    def __init__(self, campaign_id: UUID, user_id: str, campaign_name: str):
        super().__init__(
            event_id=str(uuid4()),
            event_type="campaign.activated",
            aggregate_id=str(campaign_id),
            payload={
                "campaign_id": str(campaign_id),
                "user_id": user_id,
                "campaign_name": campaign_name
            },
            timestamp=datetime.now(timezone.utc)
        )


@dataclass
class CampaignPausedEvent(DomainEvent):
    """Campaign paused event"""
    
    def __init__(self, campaign_id: UUID, user_id: str, campaign_name: str, reason: str | None = None):
        super().__init__(
            event_id=str(uuid4()),
            event_type="campaign.paused",
            aggregate_id=str(campaign_id),
            payload={
                "campaign_id": str(campaign_id),
                "user_id": user_id,
                "campaign_name": campaign_name,
                "reason": reason
            },
            timestamp=datetime.now(timezone.utc)
        )


@dataclass
class CampaignCompletedEvent(DomainEvent):
    """Campaign completed event"""
    
    def __init__(self, campaign_id: UUID, user_id: str, campaign_name: str, performance_summary: dict):
        super().__init__(
            event_id=str(uuid4()),
            event_type="campaign.completed",
            aggregate_id=str(campaign_id),
            payload={
                "campaign_id": str(campaign_id),
                "user_id": user_id,
                "campaign_name": campaign_name,
                "performance_summary": performance_summary
            },
            timestamp=datetime.now(timezone.utc)
        )


@dataclass
class CampaignBudgetExhaustedEvent(DomainEvent):
    """Campaign budget exhausted event"""
    
    def __init__(self, campaign_id: UUID, user_id: str, campaign_name: str, total_spend: str):
        super().__init__(
            event_id=str(uuid4()),
            event_type="campaign.budget_exhausted",
            aggregate_id=str(campaign_id),
            payload={
                "campaign_id": str(campaign_id),
                "user_id": user_id,
                "campaign_name": campaign_name,
                "total_spend": total_spend
            },
            timestamp=datetime.now(timezone.utc)
        )


class EventPublisher(ABC):
    """Event publisher interface"""
    
    @abstractmethod
    async def publish(self, event: DomainEvent) -> None:
        """Publish domain event"""
        pass
    
    @abstractmethod
    async def publish_batch(self, events: list[DomainEvent]) -> None:
        """Publish multiple events"""
        pass