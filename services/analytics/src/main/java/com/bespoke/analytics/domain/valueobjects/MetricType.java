package com.bespoke.analytics.domain.valueobjects;

/**
 * Analytics Metric Types
 * 
 * Defines the types of metrics that can be tracked and analyzed
 */
public enum MetricType {
    // User Metrics
    USER_REGISTRATION("user.registration", "User Registration"),
    USER_LOGIN("user.login", "User Login"),
    USER_ACTIVITY("user.activity", "User Activity"),
    USER_RETENTION("user.retention", "User Retention"),
    
    // Content Metrics
    CONTENT_CREATION("content.creation", "Content Creation"),
    CONTENT_VIEW("content.view", "Content View"),
    CONTENT_ENGAGEMENT("content.engagement", "Content Engagement"),
    CONTENT_SHARING("content.sharing", "Content Sharing"),
    CONTENT_PERFORMANCE("content.performance", "Content Performance"),
    
    // Campaign Metrics
    CAMPAIGN_IMPRESSION("campaign.impression", "Campaign Impression"),
    CAMPAIGN_CLICK("campaign.click", "Campaign Click"),
    CAMPAIGN_CONVERSION("campaign.conversion", "Campaign Conversion"),
    CAMPAIGN_SPEND("campaign.spend", "Campaign Spend"),
    CAMPAIGN_REVENUE("campaign.revenue", "Campaign Revenue"),
    CAMPAIGN_ROI("campaign.roi", "Campaign ROI"),
    
    // Business Metrics
    REVENUE("business.revenue", "Revenue"),
    CONVERSION_RATE("business.conversion_rate", "Conversion Rate"),
    CUSTOMER_ACQUISITION_COST("business.cac", "Customer Acquisition Cost"),
    LIFETIME_VALUE("business.ltv", "Customer Lifetime Value"),
    CHURN_RATE("business.churn_rate", "Churn Rate"),
    
    // System Metrics
    API_REQUEST("system.api_request", "API Request"),
    API_RESPONSE_TIME("system.response_time", "API Response Time"),
    ERROR_RATE("system.error_rate", "Error Rate"),
    SYSTEM_LOAD("system.load", "System Load");
    
    private final String code;
    private final String displayName;
    
    MetricType(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public static MetricType fromCode(String code) {
        for (MetricType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown metric type code: " + code);
    }
    
    public static MetricType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Metric type cannot be null or empty");
        }
        
        // Try by enum name first
        try {
            return MetricType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            // Try by code
            return fromCode(value);
        }
    }
    
    /**
     * Check if this metric type is a user-related metric
     */
    public boolean isUserMetric() {
        return this.code.startsWith("user.");
    }
    
    /**
     * Check if this metric type is a content-related metric
     */
    public boolean isContentMetric() {
        return this.code.startsWith("content.");
    }
    
    /**
     * Check if this metric type is a campaign-related metric
     */
    public boolean isCampaignMetric() {
        return this.code.startsWith("campaign.");
    }
    
    /**
     * Check if this metric type is a business metric
     */
    public boolean isBusinessMetric() {
        return this.code.startsWith("business.");
    }
    
    /**
     * Check if this metric type is a system metric
     */
    public boolean isSystemMetric() {
        return this.code.startsWith("system.");
    }
}