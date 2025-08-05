import httpx
import structlog

from ...application.interfaces.content_service import ContentService, ContentInfo


logger = structlog.get_logger()


class ContentServiceClient(ContentService):
    """Content service HTTP client"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info("Initialized content service client", base_url=base_url)
    
    async def get_content(self, content_id: str) -> ContentInfo | None:
        """Get content information"""
        try:
            response = await self.client.get(f"{self.base_url}/api/v1/contents/{content_id}")
            
            if response.status_code == 404:
                return None
                
            response.raise_for_status()
            data = response.json()
            
            return ContentInfo(
                id=data["data"]["id"],
                title=data["data"]["title"],
                content_type=data["data"]["type"],
                status=data["data"]["status"],
                metadata=data["data"]["metadata"]
            )
            
        except httpx.RequestError as e:
            logger.error("Content service request failed", content_id=content_id, error=str(e))
            return None
        except Exception as e:
            logger.error("Unexpected error getting content", content_id=content_id, error=str(e))
            return None
    
    async def validate_content_ids(self, content_ids: list[str]) -> list[str]:
        """Validate content IDs and return valid ones"""
        valid_ids = []
        
        for content_id in content_ids:
            content = await self.get_content(content_id)
            if content:
                valid_ids.append(content_id)
        
        return valid_ids
    
    async def get_content_batch(self, content_ids: list[str]) -> list[ContentInfo]:
        """Get multiple content items"""
        contents = []
        
        for content_id in content_ids:
            content = await self.get_content(content_id)
            if content:
                contents.append(content)
        
        return contents
    
    async def is_content_published(self, content_id: str) -> bool:
        """Check if content is published"""
        content = await self.get_content(content_id)
        return content is not None and content.status == "PUBLISHED"