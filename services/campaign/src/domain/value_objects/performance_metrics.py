from dataclasses import dataclass, field
from decimal import Decimal
from typing import Self


@dataclass
class PerformanceMetrics:
    """Campaign performance metrics"""
    
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: Decimal = Decimal("0")
    revenue: Decimal = Decimal("0")
    
    # Engagement metrics
    likes: int = 0
    shares: int = 0
    comments: int = 0
    
    # Email metrics (if applicable)
    emails_sent: int = 0
    emails_opened: int = 0
    emails_clicked: int = 0
    
    # Custom metrics
    custom_metrics: dict[str, float] = field(default_factory=dict)
    
    def __post_init__(self) -> None:
        # Validate non-negative values
        if any(value < 0 for value in [
            self.impressions, self.clicks, self.conversions,
            self.likes, self.shares, self.comments,
            self.emails_sent, self.emails_opened, self.emails_clicked
        ]):
            raise ValueError("Metrics cannot be negative")
        
        if self.spend < 0 or self.revenue < 0:
            raise ValueError("Financial metrics cannot be negative")
        
        # Validate logical constraints
        if self.clicks > self.impressions:
            raise ValueError("Clicks cannot exceed impressions")
        
        if self.conversions > self.clicks:
            raise ValueError("Conversions cannot exceed clicks")
        
        if self.emails_opened > self.emails_sent:
            raise ValueError("Emails opened cannot exceed emails sent")
        
        if self.emails_clicked > self.emails_opened:
            raise ValueError("Emails clicked cannot exceed emails opened")
    
    @property
    def click_through_rate(self) -> float:
        """Calculate Click-Through Rate (CTR)"""
        if self.impressions == 0:
            return 0.0
        return (self.clicks / self.impressions) * 100
    
    @property
    def conversion_rate(self) -> float:
        """Calculate Conversion Rate"""
        if self.clicks == 0:
            return 0.0
        return (self.conversions / self.clicks) * 100
    
    @property
    def cost_per_click(self) -> Decimal:
        """Calculate Cost Per Click (CPC)"""
        if self.clicks == 0:
            return Decimal("0")
        return self.spend / self.clicks
    
    @property
    def cost_per_conversion(self) -> Decimal:
        """Calculate Cost Per Conversion"""
        if self.conversions == 0:
            return Decimal("0")
        return self.spend / self.conversions
    
    @property
    def return_on_ad_spend(self) -> float:
        """Calculate Return on Ad Spend (ROAS)"""
        if self.spend == 0:
            return 0.0
        return float(self.revenue / self.spend)
    
    @property
    def engagement_rate(self) -> float:
        """Calculate overall engagement rate"""
        if self.impressions == 0:
            return 0.0
        
        total_engagements = self.likes + self.shares + self.comments
        return (total_engagements / self.impressions) * 100
    
    @property
    def email_open_rate(self) -> float:
        """Calculate email open rate"""
        if self.emails_sent == 0:
            return 0.0
        return (self.emails_opened / self.emails_sent) * 100
    
    @property
    def email_click_rate(self) -> float:
        """Calculate email click rate"""
        if self.emails_opened == 0:
            return 0.0
        return (self.emails_clicked / self.emails_opened) * 100
    
    def add_impression(self) -> None:
        """Add an impression"""
        self.impressions += 1
    
    def add_click(self, cost: Decimal | None = None) -> None:
        """Add a click with optional cost"""
        self.clicks += 1
        if cost:
            self.spend += cost
    
    def add_conversion(self, revenue: Decimal | None = None) -> None:
        """Add a conversion with optional revenue"""
        self.conversions += 1
        if revenue:
            self.revenue += revenue
    
    def add_engagement(
        self, 
        likes: int = 0, 
        shares: int = 0, 
        comments: int = 0
    ) -> None:
        """Add engagement metrics"""
        self.likes += likes
        self.shares += shares
        self.comments += comments
    
    def merge(self, other: "PerformanceMetrics") -> Self:
        """Merge with another metrics instance"""
        return PerformanceMetrics(
            impressions=self.impressions + other.impressions,
            clicks=self.clicks + other.clicks,
            conversions=self.conversions + other.conversions,
            spend=self.spend + other.spend,
            revenue=self.revenue + other.revenue,
            likes=self.likes + other.likes,
            shares=self.shares + other.shares,
            comments=self.comments + other.comments,
            emails_sent=self.emails_sent + other.emails_sent,
            emails_opened=self.emails_opened + other.emails_opened,
            emails_clicked=self.emails_clicked + other.emails_clicked,
            custom_metrics={
                **self.custom_metrics,
                **other.custom_metrics
            }
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary with calculated metrics"""
        return {
            # Raw metrics
            "impressions": self.impressions,
            "clicks": self.clicks,
            "conversions": self.conversions,
            "spend": str(self.spend),
            "revenue": str(self.revenue),
            "likes": self.likes,
            "shares": self.shares,
            "comments": self.comments,
            "emails_sent": self.emails_sent,
            "emails_opened": self.emails_opened,
            "emails_clicked": self.emails_clicked,
            
            # Calculated metrics
            "click_through_rate": round(self.click_through_rate, 2),
            "conversion_rate": round(self.conversion_rate, 2),
            "cost_per_click": str(self.cost_per_click),
            "cost_per_conversion": str(self.cost_per_conversion),
            "return_on_ad_spend": round(self.return_on_ad_spend, 2),
            "engagement_rate": round(self.engagement_rate, 2),
            "email_open_rate": round(self.email_open_rate, 2),
            "email_click_rate": round(self.email_click_rate, 2),
            
            # Custom metrics
            "custom_metrics": self.custom_metrics
        }