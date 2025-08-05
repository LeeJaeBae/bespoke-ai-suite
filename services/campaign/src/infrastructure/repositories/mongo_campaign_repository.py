import math
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any
from uuid import UUID

import structlog
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

from ...domain.entities import Campaign
from ...domain.repositories import (
    CampaignRepository,
    CampaignFilter,
    PaginationOptions,
    PaginatedResult
)
from ...domain.value_objects import (
    Budget,
    CampaignStatus,
    Currency,
    DateRange,
    PerformanceMetrics,
    TargetAudience
)


logger = structlog.get_logger()


class MongoCampaignRepository(CampaignRepository):
    """MongoDB implementation of campaign repository"""
    
    def __init__(self, client: AsyncIOMotorClient | None = None, database_name: str = "campaign_db"):
        # In a real implementation, you would inject the client
        self._client = client or AsyncIOMotorClient("mongodb://localhost:27017")
        self._database = self._client[database_name]
        self._collection: AsyncIOMotorCollection = self._database.campaigns
        
        logger.info("Initialized MongoDB campaign repository", database=database_name)
    
    async def save(self, campaign: Campaign) -> None:
        """Save campaign"""
        try:
            document = self._campaign_to_document(campaign)
            
            # Use upsert to handle both create and update
            await self._collection.replace_one(
                {"_id": str(campaign.id)},
                document,
                upsert=True
            )
            
            logger.info("Campaign saved successfully", campaign_id=str(campaign.id))
            
        except Exception as e:
            logger.error("Failed to save campaign", campaign_id=str(campaign.id), error=str(e))
            raise
    
    async def find_by_id(self, campaign_id: UUID) -> Campaign | None:
        """Find campaign by ID"""
        try:
            document = await self._collection.find_one({"_id": str(campaign_id)})
            
            if not document:
                return None
            
            return self._document_to_campaign(document)
            
        except Exception as e:
            logger.error("Failed to find campaign by ID", campaign_id=str(campaign_id), error=str(e))
            raise
    
    async def find_by_user(
        self, 
        user_id: str, 
        pagination: PaginationOptions
    ) -> PaginatedResult[Campaign]:
        """Find campaigns by user with pagination"""
        try:
            filter_query = {"user_id": user_id}
            
            return await self._find_with_pagination(filter_query, pagination)
            
        except Exception as e:
            logger.error("Failed to find campaigns by user", user_id=user_id, error=str(e))
            raise
    
    async def find_all(
        self, 
        filter: CampaignFilter, 
        pagination: PaginationOptions
    ) -> PaginatedResult[Campaign]:
        """Find campaigns with filter and pagination"""
        try:
            query = self._build_filter_query(filter)
            return await self._find_with_pagination(query, pagination)
            
        except Exception as e:
            logger.error("Failed to find campaigns with filter", error=str(e))
            raise
    
    async def find_active_campaigns(self) -> list[Campaign]:
        """Find all active campaigns"""
        try:
            cursor = self._collection.find({"status": CampaignStatus.ACTIVE.value})
            documents = await cursor.to_list(length=None)
            
            return [self._document_to_campaign(doc) for doc in documents]
            
        except Exception as e:
            logger.error("Failed to find active campaigns", error=str(e))
            raise
    
    async def find_campaigns_by_status(
        self, 
        status: CampaignStatus
    ) -> list[Campaign]:
        """Find campaigns by status"""
        try:
            cursor = self._collection.find({"status": status.value})
            documents = await cursor.to_list(length=None)
            
            return [self._document_to_campaign(doc) for doc in documents]
            
        except Exception as e:
            logger.error("Failed to find campaigns by status", status=status.value, error=str(e))
            raise
    
    async def find_campaigns_to_schedule(
        self, 
        current_time: datetime
    ) -> list[Campaign]:
        """Find scheduled campaigns that should be activated"""
        try:
            query = {
                "status": CampaignStatus.SCHEDULED.value,
                "date_range.start_date": {"$lte": current_time}
            }
            
            cursor = self._collection.find(query)
            documents = await cursor.to_list(length=None)
            
            return [self._document_to_campaign(doc) for doc in documents]
            
        except Exception as e:
            logger.error("Failed to find campaigns to schedule", error=str(e))
            raise
    
    async def find_campaigns_to_complete(
        self, 
        current_time: datetime
    ) -> list[Campaign]:
        """Find active campaigns that should be completed"""
        try:
            query = {
                "status": CampaignStatus.ACTIVE.value,
                "date_range.end_date": {"$lte": current_time}
            }
            
            cursor = self._collection.find(query)
            documents = await cursor.to_list(length=None)
            
            return [self._document_to_campaign(doc) for doc in documents]
            
        except Exception as e:
            logger.error("Failed to find campaigns to complete", error=str(e))
            raise
    
    async def update(self, campaign: Campaign) -> None:
        """Update existing campaign"""
        await self.save(campaign)  # MongoDB upsert handles this
    
    async def delete(self, campaign_id: UUID) -> None:
        """Delete campaign (soft delete recommended)"""
        try:
            # Implement soft delete by updating status
            await self._collection.update_one(
                {"_id": str(campaign_id)},
                {
                    "$set": {
                        "status": CampaignStatus.CANCELLED.value,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info("Campaign soft deleted", campaign_id=str(campaign_id))
            
        except Exception as e:
            logger.error("Failed to delete campaign", campaign_id=str(campaign_id), error=str(e))
            raise
    
    async def exists(self, campaign_id: UUID) -> bool:
        """Check if campaign exists"""
        try:
            count = await self._collection.count_documents({"_id": str(campaign_id)})
            return count > 0
            
        except Exception as e:
            logger.error("Failed to check campaign existence", campaign_id=str(campaign_id), error=str(e))
            raise
    
    async def count_by_user(self, user_id: str) -> int:
        """Count campaigns by user"""
        try:
            return await self._collection.count_documents({"user_id": user_id})
            
        except Exception as e:
            logger.error("Failed to count campaigns by user", user_id=user_id, error=str(e))
            raise
    
    async def count_by_status(self, status: CampaignStatus) -> int:
        """Count campaigns by status"""
        try:
            return await self._collection.count_documents({"status": status.value})
            
        except Exception as e:
            logger.error("Failed to count campaigns by status", status=status.value, error=str(e))
            raise
    
    async def find_by_content_id(self, content_id: str) -> list[Campaign]:
        """Find campaigns using specific content"""
        try:
            cursor = self._collection.find({"content_ids": content_id})
            documents = await cursor.to_list(length=None)
            
            return [self._document_to_campaign(doc) for doc in documents]
            
        except Exception as e:
            logger.error("Failed to find campaigns by content ID", content_id=content_id, error=str(e))
            raise
    
    async def bulk_update_status(
        self, 
        campaign_ids: list[UUID], 
        status: CampaignStatus
    ) -> int:
        """Bulk update campaign status, returns count of updated campaigns"""
        try:
            string_ids = [str(cid) for cid in campaign_ids]
            
            result = await self._collection.update_many(
                {"_id": {"$in": string_ids}},
                {
                    "$set": {
                        "status": status.value,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(
                "Bulk status update completed",
                updated_count=result.modified_count,
                status=status.value
            )
            
            return result.modified_count
            
        except Exception as e:
            logger.error("Failed to bulk update campaign status", error=str(e))
            raise
    
    async def _find_with_pagination(
        self, 
        query: Dict[str, Any], 
        pagination: PaginationOptions
    ) -> PaginatedResult[Campaign]:
        """Helper method for paginated queries"""
        # Count total
        total = await self._collection.count_documents(query)
        
        # Calculate pagination
        skip = (pagination.page - 1) * pagination.page_size
        total_pages = math.ceil(total / pagination.page_size)
        
        # Build sort
        sort_direction = 1 if pagination.sort_order == "asc" else -1
        sort_spec = [(pagination.sort_by, sort_direction)]
        
        # Execute query
        cursor = self._collection.find(query).sort(sort_spec).skip(skip).limit(pagination.page_size)
        documents = await cursor.to_list(length=pagination.page_size)
        
        campaigns = [self._document_to_campaign(doc) for doc in documents]
        
        return PaginatedResult(
            items=campaigns,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
            has_next=pagination.page < total_pages,
            has_previous=pagination.page > 1
        )
    
    def _build_filter_query(self, filter: CampaignFilter) -> Dict[str, Any]:
        """Build MongoDB query from filter"""
        query = {}
        
        if filter.user_id:
            query["user_id"] = filter.user_id
        
        if filter.status:
            query["status"] = filter.status.value
        
        if filter.name_contains:
            query["name"] = {"$regex": filter.name_contains, "$options": "i"}
        
        if filter.tags:
            query["tags"] = {"$in": filter.tags}
        
        if filter.channels:
            query["channels"] = {"$in": filter.channels}
        
        if filter.is_ab_test is not None:
            query["is_ab_test"] = filter.is_ab_test
        
        # Date range filters
        date_filters = {}
        if filter.start_date_from:
            date_filters["$gte"] = filter.start_date_from
        if filter.start_date_to:
            date_filters["$lte"] = filter.start_date_to
        if date_filters:
            query["date_range.start_date"] = date_filters
        
        # Created date filters
        created_filters = {}
        if filter.created_from:
            created_filters["$gte"] = filter.created_from
        if filter.created_to:
            created_filters["$lte"] = filter.created_to
        if created_filters:
            query["created_at"] = created_filters
        
        # Budget filters
        budget_filters = {}
        if filter.budget_min is not None:
            budget_filters["$gte"] = str(filter.budget_min)
        if filter.budget_max is not None:
            budget_filters["$lte"] = str(filter.budget_max)
        if budget_filters:
            query["budget.amount"] = budget_filters
        
        return query
    
    def _campaign_to_document(self, campaign: Campaign) -> Dict[str, Any]:
        """Convert campaign entity to MongoDB document"""
        return {
            "_id": str(campaign.id),
            "user_id": campaign.user_id,
            "name": campaign.name,
            "description": campaign.description,
            "target_audience": {
                "demographics": campaign.target_audience.demographics,
                "interests": campaign.target_audience.interests,
                "behaviors": campaign.target_audience.behaviors,
                "custom_audiences": campaign.target_audience.custom_audiences,
                "exclusions": campaign.target_audience.exclusions
            },
            "budget": {
                "amount": str(campaign.budget.amount),
                "currency": campaign.budget.currency.value,
                "daily_limit": str(campaign.budget.daily_limit) if campaign.budget.daily_limit else None
            },
            "date_range": {
                "start_date": campaign.date_range.start_date,
                "end_date": campaign.date_range.end_date,
                "timezone": campaign.date_range.timezone
            },
            "status": campaign.status.value,
            "performance_metrics": {
                "impressions": campaign.performance_metrics.impressions,
                "clicks": campaign.performance_metrics.clicks,
                "conversions": campaign.performance_metrics.conversions,
                "spend": str(campaign.performance_metrics.spend),
                "revenue": str(campaign.performance_metrics.revenue)
            },
            "content_ids": campaign.content_ids,
            "channels": campaign.channels,
            "tags": campaign.tags,
            "is_ab_test": campaign.is_ab_test,
            "ab_test_variants": campaign.ab_test_variants,
            "created_at": campaign.created_at,
            "updated_at": campaign.updated_at
        }
    
    def _document_to_campaign(self, document: Dict[str, Any]) -> Campaign:
        """Convert MongoDB document to campaign entity"""
        # Reconstruct value objects
        budget = Budget(
            amount=Decimal(document["budget"]["amount"]),
            currency=Currency(document["budget"]["currency"]),
            daily_limit=Decimal(document["budget"]["daily_limit"]) if document["budget"]["daily_limit"] else None
        )
        
        date_range = DateRange(
            start_date=document["date_range"]["start_date"],
            end_date=document["date_range"]["end_date"],
            timezone=document["date_range"]["timezone"]
        )
        
        target_audience = TargetAudience(
            demographics=document["target_audience"]["demographics"],
            interests=document["target_audience"]["interests"],
            behaviors=document["target_audience"]["behaviors"],
            custom_audiences=document["target_audience"]["custom_audiences"],
            exclusions=document["target_audience"]["exclusions"]
        )
        
        performance_metrics = PerformanceMetrics(
            impressions=document["performance_metrics"]["impressions"],
            clicks=document["performance_metrics"]["clicks"],
            conversions=document["performance_metrics"]["conversions"],
            spend=Decimal(document["performance_metrics"]["spend"]),
            revenue=Decimal(document["performance_metrics"]["revenue"])
        )
        
        # Reconstruct campaign entity
        return Campaign.reconstruct(
            id=UUID(document["_id"]),
            user_id=document["user_id"],
            name=document["name"],
            description=document["description"],
            target_audience=target_audience,
            budget=budget,
            date_range=date_range,
            status=CampaignStatus(document["status"]),
            performance_metrics=performance_metrics,
            content_ids=document["content_ids"],
            channels=document["channels"],
            tags=document["tags"],
            created_at=document["created_at"],
            updated_at=document["updated_at"],
            is_ab_test=document["is_ab_test"],
            ab_test_variants=document["ab_test_variants"]
        )