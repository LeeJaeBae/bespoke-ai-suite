from enum import Enum


class CampaignStatus(Enum):
    """Campaign lifecycle status"""
    
    DRAFT = "DRAFT"  # 초안 - 편집 가능
    SCHEDULED = "SCHEDULED"  # 예약됨 - 시작 대기 중
    ACTIVE = "ACTIVE"  # 활성 - 현재 실행 중
    PAUSED = "PAUSED"  # 일시정지
    COMPLETED = "COMPLETED"  # 완료
    CANCELLED = "CANCELLED"  # 취소됨
    
    @classmethod
    def can_edit(cls, status: "CampaignStatus") -> bool:
        """Check if campaign can be edited in current status"""
        return status in [cls.DRAFT, cls.SCHEDULED]
    
    @classmethod
    def can_activate(cls, status: "CampaignStatus") -> bool:
        """Check if campaign can be activated"""
        return status in [cls.DRAFT, cls.SCHEDULED, cls.PAUSED]
    
    @classmethod
    def can_pause(cls, status: "CampaignStatus") -> bool:
        """Check if campaign can be paused"""
        return status == cls.ACTIVE
    
    @classmethod
    def is_running(cls, status: "CampaignStatus") -> bool:
        """Check if campaign is currently running"""
        return status == cls.ACTIVE
    
    @classmethod
    def is_finished(cls, status: "CampaignStatus") -> bool:
        """Check if campaign has finished"""
        return status in [cls.COMPLETED, cls.CANCELLED]