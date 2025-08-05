import httpx
import structlog
from typing import Dict, List, Any

from ...application.interfaces.notification_service import NotificationService, Notification


logger = structlog.get_logger()


class NotificationServiceClient(NotificationService):
    """Notification service HTTP client"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        logger.info("Initialized notification service client", base_url=base_url)
    
    async def send_campaign_notification(
        self, 
        user_id: str, 
        notification_type: str, 
        data: Dict[str, Any]
    ) -> bool:
        """Send campaign-related notification"""
        try:
            request_data = {
                "user_id": user_id,
                "type": notification_type,
                "data": data,
                "source": "campaign_service"
            }
            
            response = await self.client.post(
                f"{self.base_url}/api/v1/notifications",
                json=request_data
            )
            
            response.raise_for_status()
            logger.info(
                "Notification sent successfully",
                user_id=user_id,
                type=notification_type
            )
            return True
            
        except httpx.RequestError as e:
            logger.error(
                "Notification service request failed",
                user_id=user_id,
                error=str(e)
            )
            return False
        except Exception as e:
            logger.error(
                "Unexpected error sending notification",
                user_id=user_id,
                error=str(e)
            )
            return False
    
    async def send_batch_notifications(
        self, 
        notifications: List[Notification]
    ) -> Dict[str, bool]:
        """Send multiple notifications"""
        results = {}
        
        for notification in notifications:
            result = await self.send_campaign_notification(
                user_id=notification.user_id,
                notification_type=notification.type.value,
                data=notification.metadata
            )
            results[notification.user_id] = result
        
        return results
    
    async def notify_campaign_created(
        self, 
        user_id: str, 
        campaign_id: str, 
        campaign_name: str
    ) -> bool:
        """Notify user about campaign creation"""
        return await self.send_campaign_notification(
            user_id=user_id,
            notification_type="campaign_created",
            data={
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "message": f"캠페인 '{campaign_name}'이 성공적으로 생성되었습니다."
            }
        )
    
    async def notify_campaign_activated(
        self, 
        user_id: str, 
        campaign_id: str, 
        campaign_name: str
    ) -> bool:
        """Notify user about campaign activation"""
        return await self.send_campaign_notification(
            user_id=user_id,
            notification_type="campaign_activated",
            data={
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "message": f"캠페인 '{campaign_name}'이 활성화되었습니다."
            }
        )
    
    async def notify_campaign_completed(
        self, 
        user_id: str, 
        campaign_id: str, 
        campaign_name: str,
        performance_summary: Dict[str, Any]
    ) -> bool:
        """Notify user about campaign completion"""
        return await self.send_campaign_notification(
            user_id=user_id,
            notification_type="campaign_completed",
            data={
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "performance_summary": performance_summary,
                "message": f"캠페인 '{campaign_name}'이 완료되었습니다."
            }
        )
    
    async def notify_budget_alert(
        self, 
        user_id: str, 
        campaign_id: str, 
        campaign_name: str,
        remaining_budget: float,
        alert_threshold: float
    ) -> bool:
        """Notify user about budget alert"""
        return await self.send_campaign_notification(
            user_id=user_id,
            notification_type="budget_alert",
            data={
                "campaign_id": campaign_id,
                "campaign_name": campaign_name,
                "remaining_budget": remaining_budget,
                "alert_threshold": alert_threshold,
                "message": f"캠페인 '{campaign_name}'의 예산이 {alert_threshold}% 미만으로 남았습니다."
            }
        )