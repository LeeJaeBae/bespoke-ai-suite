package com.bespoke.analytics.domain.entities;

import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;
import com.bespoke.analytics.domain.valueobjects.TimeWindow;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Analytics Report Entity
 * 
 * Aggregate root for analytics reports containing multiple metrics and insights
 * Represents a comprehensive view of analytics data for a specific time period
 */
@Entity
@Table(name = "analytics_reports", schema = "analytics")
public class AnalyticsReport {
    
    @Id
    @Column(name = "id")
    private final UUID id;
    
    @Column(name = "title", nullable = false, length = 200)
    private final String title;
    
    @Column(name = "description", length = 1000)
    private final String description;
    
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "startTime", column = @Column(name = "start_time")),
        @AttributeOverride(name = "endTime", column = @Column(name = "end_time"))
    })
    private final TimeWindow timeWindow;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private final ReportType reportType;
    
    @Column(name = "requested_by", nullable = false)
    private final String requestedBy; // User ID who requested the report
    
    @Column(name = "created_at", nullable = false)
    private final LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReportStatus status;
    
    // Report data - stored as JSON or separate tables
    @Transient
    private final Map<MetricType, MetricValue> summaryMetrics;
    
    @Transient
    private final List<Metric> detailedMetrics;
    
    @Transient
    private final Map<String, Object> insights;
    
    @Transient
    private final Map<String, List<MetricValue>> trends;
    
    // Configuration
    @Transient
    private final Set<String> includedEntityIds;
    
    @Transient
    private final Set<String> includedEntityTypes;
    
    @Transient
    private final Map<String, String> filters;
    
    // JPA default constructor
    protected AnalyticsReport() {
        this.id = null;
        this.title = null;
        this.description = null;
        this.timeWindow = null;
        this.reportType = null;
        this.requestedBy = null;
        this.createdAt = null;
        this.summaryMetrics = new HashMap<>();
        this.detailedMetrics = new ArrayList<>();
        this.insights = new HashMap<>();
        this.trends = new HashMap<>();
        this.includedEntityIds = new HashSet<>();
        this.includedEntityTypes = new HashSet<>();
        this.filters = new HashMap<>();
    }

    private AnalyticsReport(UUID id, String title, String description, TimeWindow timeWindow,
                           ReportType reportType, String requestedBy, LocalDateTime createdAt) {
        this.id = Objects.requireNonNull(id, "ID cannot be null");
        this.title = Objects.requireNonNull(title, "Title cannot be null");
        this.description = description;
        this.timeWindow = Objects.requireNonNull(timeWindow, "Time window cannot be null");
        this.reportType = Objects.requireNonNull(reportType, "Report type cannot be null");
        this.requestedBy = Objects.requireNonNull(requestedBy, "Requested by cannot be null");
        this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
        this.updatedAt = createdAt;
        this.status = ReportStatus.REQUESTED;
        
        this.summaryMetrics = new HashMap<>();
        this.detailedMetrics = new ArrayList<>();
        this.insights = new HashMap<>();
        this.trends = new HashMap<>();
        this.includedEntityIds = new HashSet<>();
        this.includedEntityTypes = new HashSet<>();
        this.filters = new HashMap<>();
        
        validateBusinessRules();
    }
    
    /**
     * Factory method to create a new analytics report
     */
    public static AnalyticsReport create(String title, String description, TimeWindow timeWindow,
                                        ReportType reportType, String requestedBy) {
        return new AnalyticsReport(UUID.randomUUID(), title, description, timeWindow,
                                  reportType, requestedBy, LocalDateTime.now());
    }
    
    /**
     * Reconstruct report from persistence
     */
    public static AnalyticsReport reconstruct(UUID id, String title, String description,
                                             TimeWindow timeWindow, ReportType reportType,
                                             String requestedBy, LocalDateTime createdAt,
                                             LocalDateTime updatedAt, ReportStatus status) {
        AnalyticsReport report = new AnalyticsReport(id, title, description, timeWindow,
                                                    reportType, requestedBy, createdAt);
        report.updatedAt = updatedAt;
        report.status = status;
        return report;
    }
    
    /**
     * Validate business rules
     */
    private void validateBusinessRules() {
        if (title.trim().isEmpty()) {
            throw new IllegalArgumentException("Report title cannot be empty");
        }
        
        if (title.length() > 200) {
            throw new IllegalArgumentException("Report title cannot exceed 200 characters");
        }
        
        if (description != null && description.length() > 1000) {
            throw new IllegalArgumentException("Report description cannot exceed 1000 characters");
        }
        
        // Time window should not be in the future
        if (timeWindow.getEndTime().isAfter(LocalDateTime.now().plusMinutes(5))) {
            throw new IllegalArgumentException("Report time window cannot end in the future");
        }
        
        // Time window should not be too large (more than 1 year)
        if (timeWindow.getDurationDays() > 365) {
            throw new IllegalArgumentException("Report time window cannot exceed 1 year");
        }
    }
    
    /**
     * Start report generation
     */
    public void startGeneration() {
        if (status != ReportStatus.REQUESTED) {
            throw new IllegalStateException("Can only start generation for requested reports");
        }
        
        this.status = ReportStatus.GENERATING;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Complete report generation
     */
    public void completeGeneration() {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only complete generation for reports that are generating");
        }
        
        if (summaryMetrics.isEmpty()) {
            throw new IllegalStateException("Cannot complete report without summary metrics");
        }
        
        this.status = ReportStatus.COMPLETED;
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Mark report as failed
     */
    public void markAsFailed(String reason) {
        if (status == ReportStatus.COMPLETED) {
            throw new IllegalStateException("Cannot mark completed report as failed");
        }
        
        this.status = ReportStatus.FAILED;
        this.updatedAt = LocalDateTime.now();
        
        // Store failure reason in insights
        insights.put("failure_reason", reason);
        insights.put("failed_at", LocalDateTime.now());
    }
    
    /**
     * Fail report generation with reason
     */
    public void failGeneration(String reason) {
        markAsFailed(reason);
    }
    
    /**
     * Add summary metric
     */
    public void addSummaryMetric(MetricType type, MetricValue value) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only add metrics while generating report");
        }
        
        summaryMetrics.put(type, value);
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Add detailed metric
     */
    public void addDetailedMetric(Metric metric) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only add metrics while generating report");
        }
        
        // Validate metric is within report time window
        if (!timeWindow.contains(metric.getTimestamp())) {
            throw new IllegalArgumentException("Metric timestamp is outside report time window");
        }
        
        detailedMetrics.add(metric);
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Add insight
     */
    public void addInsight(String key, Object value) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only add insights while generating report");
        }
        
        insights.put(key, value);
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Add trend data
     */
    public void addTrend(String metric, List<MetricValue> values) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only add trends while generating report");
        }
        
        trends.put(metric, new ArrayList<>(values));
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Add metric with basic parameters
     */
    public void addMetric(String metricType, java.math.BigDecimal value, LocalDateTime timestamp, Map<String, String> dimensions) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only add metrics while generating report");
        }
        
        // Store basic metric information in insights for compatibility
        insights.put("metric_" + metricType + "_" + timestamp.toString(), value);
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Update summary with key-value information
     */
    public void updateSummary(String key, String value) {
        if (status != ReportStatus.GENERATING) {
            throw new IllegalStateException("Can only update summary while generating report");
        }
        
        insights.put("summary_" + key, value);
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Add entity filter
     */
    public void includeEntity(String entityId, String entityType) {
        includedEntityIds.add(entityId);
        includedEntityTypes.add(entityType);
    }
    
    /**
     * Add dimension filter
     */
    public void addFilter(String dimension, String value) {
        filters.put(dimension, value);
    }
    
    /**
     * Get summary metric value
     */
    public Optional<MetricValue> getSummaryMetric(MetricType type) {
        return Optional.ofNullable(summaryMetrics.get(type));
    }
    
    /**
     * Get insight value
     */
    public Optional<Object> getInsight(String key) {
        return Optional.ofNullable(insights.get(key));
    }
    
    /**
     * Get trend data
     */
    public Optional<List<MetricValue>> getTrend(String metric) {
        return Optional.ofNullable(trends.get(metric)).map(ArrayList::new);
    }
    
    /**
     * Check if report is ready
     */
    public boolean isReady() {
        return status == ReportStatus.COMPLETED;
    }
    
    /**
     * Check if report has failed
     */
    public boolean hasFailed() {
        return status == ReportStatus.FAILED;
    }
    
    /**
     * Check if report is in progress
     */
    public boolean isInProgress() {
        return status == ReportStatus.GENERATING;
    }
    
    /**
     * Check if report includes specific entity
     */
    public boolean includesEntity(String entityId, String entityType) {
        return includedEntityIds.contains(entityId) && includedEntityTypes.contains(entityType);
    }
    
    /**
     * Get metrics count
     */
    public int getMetricsCount() {
        return detailedMetrics.size();
    }
    
    /**
     * Get insights count
     */
    public int getInsightsCount() {
        return insights.size();
    }
    
    /**
     * Calculate report generation duration
     */
    public Optional<java.time.Duration> getGenerationDuration() {
        if (status == ReportStatus.REQUESTED) {
            return Optional.empty();
        }
        return Optional.of(java.time.Duration.between(createdAt, updatedAt));
    }
    
    // Additional convenience methods for Use Cases
    public String getUserId() {
        return requestedBy;
    }
    
    public List<Metric> getMetrics() {
        return getDetailedMetrics();
    }
    
    public String getSummary() {
        Object summaryObj = insights.get("summary");
        return summaryObj != null ? summaryObj.toString() : null;
    }
    
    public String getErrorMessage() {
        Object errorObj = insights.get("failure_reason");
        return errorObj != null ? errorObj.toString() : null;
    }
    
    public LocalDateTime getGeneratedAt() {
        return status == ReportStatus.COMPLETED ? updatedAt : null;
    }

    // Getters
    public UUID getId() {
        return id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public TimeWindow getTimeWindow() {
        return timeWindow;
    }
    
    public ReportType getReportType() {
        return reportType;
    }
    
    public String getRequestedBy() {
        return requestedBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public ReportStatus getStatus() {
        return status;
    }
    
    public Map<MetricType, MetricValue> getSummaryMetrics() {
        return Map.copyOf(summaryMetrics);
    }
    
    public List<Metric> getDetailedMetrics() {
        return List.copyOf(detailedMetrics);
    }
    
    public Map<String, Object> getInsights() {
        return Map.copyOf(insights);
    }
    
    public Map<String, List<MetricValue>> getTrends() {
        return Map.copyOf(trends);
    }
    
    public Set<String> getIncludedEntityIds() {
        return Set.copyOf(includedEntityIds);
    }
    
    public Set<String> getIncludedEntityTypes() {
        return Set.copyOf(includedEntityTypes);
    }
    
    public Map<String, String> getFilters() {
        return Map.copyOf(filters);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AnalyticsReport that = (AnalyticsReport) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return String.format("AnalyticsReport{id=%s, title='%s', type=%s, status=%s, timeWindow=%s}",
                           id, title, reportType, status, timeWindow);
    }
    
    /**
     * Report Types
     */
    public enum ReportType {
        DASHBOARD_SUMMARY("Dashboard Summary"),
        USER_ANALYTICS("User Analytics"),
        CONTENT_PERFORMANCE("Content Performance"),
        CAMPAIGN_ANALYTICS("Campaign Analytics"),
        BUSINESS_METRICS("Business Metrics"),
        SYSTEM_HEALTH("System Health"),
        CUSTOM("Custom Report");
        
        private final String displayName;
        
        ReportType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * Report Status
     */
    public enum ReportStatus {
        REQUESTED("Requested"),
        GENERATING("Generating"),
        COMPLETED("Completed"),
        FAILED("Failed");
        
        private final String displayName;
        
        ReportStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}