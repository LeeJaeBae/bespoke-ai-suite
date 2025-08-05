from abc import ABC, abstractmethod
from typing import Any


class ContentInfo:
    """Content information from content service"""
    
    def __init__(
        self,
        id: str,
        title: str,
        content_type: str,
        status: str,
        metadata: dict[str, Any]
    ):
        self.id = id
        self.title = title
        self.content_type = content_type
        self.status = status
        self.metadata = metadata


class ContentService(ABC):
    """Content service interface"""
    
    @abstractmethod
    async def get_content(self, content_id: str) -> ContentInfo | None:
        """Get content information"""
        pass
    
    @abstractmethod
    async def validate_content_ids(self, content_ids: list[str]) -> list[str]:
        """Validate content IDs and return valid ones"""
        pass
    
    @abstractmethod
    async def get_content_batch(self, content_ids: list[str]) -> list[ContentInfo]:
        """Get multiple content items"""
        pass
    
    @abstractmethod
    async def is_content_published(self, content_id: str) -> bool:
        """Check if content is published"""
        pass