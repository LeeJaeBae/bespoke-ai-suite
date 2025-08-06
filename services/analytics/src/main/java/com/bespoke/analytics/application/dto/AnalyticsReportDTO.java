package com.bespoke.analytics.application.dto;

import com.bespoke.analytics.domain.entities.Metric;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Analytics Report Data Transfer Objects
 * 
 * DTOs for analytics report operations in the application layer
 */
public class AnalyticsReportDTO {
    
    /**
     * Request DTO for creating an analytics report
     */
    public static class CreateReportRequest {
        
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        @JsonProperty("title")
        private String title;
        
        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        @JsonProperty("description")
        private String description;
        
        @NotNull(message = "Report type is required")
        @JsonProperty("report_type")
        private String reportType;
        
        @NotNull(message = "Start time is required")
        @JsonProperty("start_time")
        private LocalDateTime startTime;
        
        @NotNull(message = "End time is required")
        @JsonProperty("end_time")
        private LocalDateTime endTime;
        
        @JsonProperty("entity_ids")
        private List<String> entityIds;
        
        @JsonProperty("entity_types")
        private List<String> entityTypes;
        
        @JsonProperty("metric_types")
        private List<String> metricTypes;
        
        @JsonProperty("filters")
        private Map<String, String> filters;
        
        @NotBlank(message = "User ID is required")
        @JsonProperty("user_id")
        private String userId;
        
        @JsonProperty("include_trends")
        private Boolean includeTrends = true;
        
        @JsonProperty("include_insights")
        private Boolean includeInsights = true;
        
        @JsonProperty("generate_async")
        private Boolean generateAsync = false;
        
        @JsonProperty("entity_id")
        private String entityId;
        
        @JsonProperty("entity_type")
        private String entityType;
        
        // Constructors
        public CreateReportRequest() {}
        
        public CreateReportRequest(String title, String reportType, LocalDateTime startTime, LocalDateTime endTime) {
            this.title = title;
            this.reportType = reportType;
            this.startTime = startTime;
            this.endTime = endTime;
        }
        
        // Getters and Setters
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public String getReportType() {
            return reportType;
        }
        
        public void setReportType(String reportType) {
            this.reportType = reportType;
        }
        
        public LocalDateTime getStartTime() {
            return startTime;
        }
        
        public void setStartTime(LocalDateTime startTime) {
            this.startTime = startTime;
        }
        
        public LocalDateTime getEndTime() {
            return endTime;
        }
        
        public void setEndTime(LocalDateTime endTime) {
            this.endTime = endTime;
        }
        
        public List<String> getEntityIds() {
            return entityIds;
        }
        
        public void setEntityIds(List<String> entityIds) {
            this.entityIds = entityIds;
        }
        
        public List<String> getEntityTypes() {
            return entityTypes;
        }
        
        public void setEntityTypes(List<String> entityTypes) {
            this.entityTypes = entityTypes;
        }
        
        public List<String> getMetricTypes() {
            return metricTypes;
        }
        
        public void setMetricTypes(List<String> metricTypes) {
            this.metricTypes = metricTypes;
        }
        
        public Map<String, String> getFilters() {
            return filters;
        }
        
        public void setFilters(Map<String, String> filters) {
            this.filters = filters;
        }
        
        public Boolean getIncludeTrends() {
            return includeTrends;
        }
        
        public void setIncludeTrends(Boolean includeTrends) {
            this.includeTrends = includeTrends;
        }
        
        public Boolean getIncludeInsights() {
            return includeInsights;
        }
        
        public void setIncludeInsights(Boolean includeInsights) {
            this.includeInsights = includeInsights;
        }
        
        public String getUserId() {
            return userId;
        }
        
        public void setUserId(String userId) {
            this.userId = userId;
        }
        
        public Boolean getGenerateAsync() {
            return generateAsync;
        }
        
        public void setGenerateAsync(Boolean generateAsync) {
            this.generateAsync = generateAsync;
        }
        
        public String getEntityId() {
            return entityId;
        }
        
        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }
        
        public String getEntityType() {
            return entityType;
        }
        
        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }
        
        // Convenience methods for compatibility with use cases  
        public LocalDateTime getStartDate() {
            return startTime;
        }
        
        public LocalDateTime getEndDate() {
            return endTime;
        }
    }
    
    /**
     * Response DTO for analytics report
     */
    public static class ReportResponse {
        
        @JsonProperty("id")
        private UUID id;
        
        @JsonProperty("title")
        private String title;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("report_type")
        private String reportType;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("requested_by")
        private String requestedBy;
        
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
        
        @JsonProperty("time_window")
        private MetricDTO.TimeWindowDTO timeWindow;
        
        @JsonProperty("summary_metrics")
        private Map<String, MetricSummary> summaryMetrics;
        
        @JsonProperty("detailed_metrics")
        private List<MetricDTO.MetricResponse> detailedMetrics;
        
        @JsonProperty("insights")
        private Map<String, Object> insights;
        
        @JsonProperty("trends")
        private Map<String, List<TrendDataPoint>> trends;
        
        @JsonProperty("filters")
        private Map<String, String> filters;
        
        @JsonProperty("metrics_count")
        private Integer metricsCount;
        
        @JsonProperty("insights_count")
        private Integer insightsCount;
        
        @JsonProperty("generation_duration_seconds")
        private Long generationDurationSeconds;
        
        // Constructors
        public ReportResponse() {}
        
        public ReportResponse(UUID id, String title, String description, String userId, String status,
                             LocalDateTime startTime, LocalDateTime endTime, List<Metric> metrics,
                             Map<String, Object> insights, String summary, String errorMessage,
                             LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime generatedAt) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.requestedBy = userId;
            this.status = status;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            // Note: Additional fields may need mapping based on actual usage
        }
        
        // Getters and Setters
        public UUID getId() {
            return id;
        }
        
        public void setId(UUID id) {
            this.id = id;
        }
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public String getReportType() {
            return reportType;
        }
        
        public void setReportType(String reportType) {
            this.reportType = reportType;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getRequestedBy() {
            return requestedBy;
        }
        
        public void setRequestedBy(String requestedBy) {
            this.requestedBy = requestedBy;
        }
        
        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
        
        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
        
        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
        
        public MetricDTO.TimeWindowDTO getTimeWindow() {
            return timeWindow;
        }
        
        public void setTimeWindow(MetricDTO.TimeWindowDTO timeWindow) {
            this.timeWindow = timeWindow;
        }
        
        public Map<String, MetricSummary> getSummaryMetrics() {
            return summaryMetrics;
        }
        
        public void setSummaryMetrics(Map<String, MetricSummary> summaryMetrics) {
            this.summaryMetrics = summaryMetrics;
        }
        
        public List<MetricDTO.MetricResponse> getDetailedMetrics() {
            return detailedMetrics;
        }
        
        public void setDetailedMetrics(List<MetricDTO.MetricResponse> detailedMetrics) {
            this.detailedMetrics = detailedMetrics;
        }
        
        public Map<String, Object> getInsights() {
            return insights;
        }
        
        public void setInsights(Map<String, Object> insights) {
            this.insights = insights;
        }
        
        public Map<String, List<TrendDataPoint>> getTrends() {
            return trends;
        }
        
        public void setTrends(Map<String, List<TrendDataPoint>> trends) {
            this.trends = trends;
        }
        
        public Map<String, String> getFilters() {
            return filters;
        }
        
        public void setFilters(Map<String, String> filters) {
            this.filters = filters;
        }
        
        public Integer getMetricsCount() {
            return metricsCount;
        }
        
        public void setMetricsCount(Integer metricsCount) {
            this.metricsCount = metricsCount;
        }
        
        public Integer getInsightsCount() {
            return insightsCount;
        }
        
        public void setInsightsCount(Integer insightsCount) {
            this.insightsCount = insightsCount;
        }
        
        public Long getGenerationDurationSeconds() {
            return generationDurationSeconds;
        }
        
        public void setGenerationDurationSeconds(Long generationDurationSeconds) {
            this.generationDurationSeconds = generationDurationSeconds;
        }
    }
    
    /**
     * Summary report response (without detailed data)
     */
    public static class ReportSummaryResponse {
        
        @JsonProperty("id")
        private UUID id;
        
        @JsonProperty("title")
        private String title;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("report_type")
        private String reportType;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("requested_by")
        private String requestedBy;
        
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
        
        @JsonProperty("time_window")
        private MetricDTO.TimeWindowDTO timeWindow;
        
        @JsonProperty("metrics_count")
        private Integer metricsCount;
        
        @JsonProperty("insights_count")
        private Integer insightsCount;
        
        // Constructors
        public ReportSummaryResponse() {}
        
        public ReportSummaryResponse(UUID id, String title, String description, String status,
                                   LocalDateTime startTime, LocalDateTime endTime, int metricsCount,
                                   int insightsCount, LocalDateTime createdAt, LocalDateTime updatedAt,
                                   LocalDateTime generatedAt) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.status = status;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            this.metricsCount = metricsCount;
            this.insightsCount = insightsCount;
        }
        
        // Getters and Setters
        public UUID getId() {
            return id;
        }
        
        public void setId(UUID id) {
            this.id = id;
        }
        
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getDescription() {
            return description;
        }
        
        public void setDescription(String description) {
            this.description = description;
        }
        
        public String getReportType() {
            return reportType;
        }
        
        public void setReportType(String reportType) {
            this.reportType = reportType;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getRequestedBy() {
            return requestedBy;
        }
        
        public void setRequestedBy(String requestedBy) {
            this.requestedBy = requestedBy;
        }
        
        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
        
        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
        
        public LocalDateTime getUpdatedAt() {
            return updatedAt;
        }
        
        public void setUpdatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
        
        public MetricDTO.TimeWindowDTO getTimeWindow() {
            return timeWindow;
        }
        
        public void setTimeWindow(MetricDTO.TimeWindowDTO timeWindow) {
            this.timeWindow = timeWindow;
        }
        
        public Integer getMetricsCount() {
            return metricsCount;
        }
        
        public void setMetricsCount(Integer metricsCount) {
            this.metricsCount = metricsCount;
        }
        
        public Integer getInsightsCount() {
            return insightsCount;
        }
        
        public void setInsightsCount(Integer insightsCount) {
            this.insightsCount = insightsCount;
        }
    }
    
    /**
     * Metric summary DTO
     */
    public static class MetricSummary {
        
        @JsonProperty("value")
        private BigDecimal value;
        
        @JsonProperty("unit")
        private String unit;
        
        @JsonProperty("formatted_value")
        private String formattedValue;
        
        @JsonProperty("data_points")
        private long dataPoints;
        
        @JsonProperty("change_from_previous")
        private BigDecimal changeFromPrevious;
        
        @JsonProperty("percentage_change")
        private BigDecimal percentageChange;
        
        // Constructors
        public MetricSummary() {}
        
        public MetricSummary(BigDecimal value, String unit, String formattedValue, long dataPoints) {
            this.value = value;
            this.unit = unit;
            this.formattedValue = formattedValue;
            this.dataPoints = dataPoints;
        }
        
        // Getters and Setters
        public BigDecimal getValue() {
            return value;
        }
        
        public void setValue(BigDecimal value) {
            this.value = value;
        }
        
        public String getUnit() {
            return unit;
        }
        
        public void setUnit(String unit) {
            this.unit = unit;
        }
        
        public String getFormattedValue() {
            return formattedValue;
        }
        
        public void setFormattedValue(String formattedValue) {
            this.formattedValue = formattedValue;
        }
        
        public long getDataPoints() {
            return dataPoints;
        }
        
        public void setDataPoints(long dataPoints) {
            this.dataPoints = dataPoints;
        }
        
        public BigDecimal getChangeFromPrevious() {
            return changeFromPrevious;
        }
        
        public void setChangeFromPrevious(BigDecimal changeFromPrevious) {
            this.changeFromPrevious = changeFromPrevious;
        }
        
        public BigDecimal getPercentageChange() {
            return percentageChange;
        }
        
        public void setPercentageChange(BigDecimal percentageChange) {
            this.percentageChange = percentageChange;
        }
    }
    
    /**
     * Trend data point DTO
     */
    public static class TrendDataPoint {
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        @JsonProperty("value")
        private BigDecimal value;
        
        @JsonProperty("formatted_value")
        private String formattedValue;
        
        // Constructors
        public TrendDataPoint() {}
        
        public TrendDataPoint(LocalDateTime timestamp, BigDecimal value, String formattedValue) {
            this.timestamp = timestamp;
            this.value = value;
            this.formattedValue = formattedValue;
        }
        
        // Getters and Setters
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
        
        public BigDecimal getValue() {
            return value;
        }
        
        public void setValue(BigDecimal value) {
            this.value = value;
        }
        
        public String getFormattedValue() {
            return formattedValue;
        }
        
        public void setFormattedValue(String formattedValue) {
            this.formattedValue = formattedValue;
        }
    }
    
    /**
     * Report query parameters
     */
    public static class ReportQuery {
        
        @JsonProperty("report_type")
        private String reportType;
        
        @JsonProperty("status")
        private String status;
        
        @JsonProperty("requested_by")
        private String requestedBy;
        
        @JsonProperty("created_after")
        private LocalDateTime createdAfter;
        
        @JsonProperty("created_before")
        private LocalDateTime createdBefore;
        
        @JsonProperty("page")
        private Integer page = 0;
        
        @JsonProperty("size")
        private Integer size = 20;
        
        @JsonProperty("sort_by")
        private String sortBy = "createdAt";
        
        @JsonProperty("sort_direction")
        private String sortDirection = "desc";
        
        // Constructors
        public ReportQuery() {}
        
        // Getters and Setters
        public String getReportType() {
            return reportType;
        }
        
        public void setReportType(String reportType) {
            this.reportType = reportType;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getRequestedBy() {
            return requestedBy;
        }
        
        public void setRequestedBy(String requestedBy) {
            this.requestedBy = requestedBy;
        }
        
        public LocalDateTime getCreatedAfter() {
            return createdAfter;
        }
        
        public void setCreatedAfter(LocalDateTime createdAfter) {
            this.createdAfter = createdAfter;
        }
        
        public LocalDateTime getCreatedBefore() {
            return createdBefore;
        }
        
        public void setCreatedBefore(LocalDateTime createdBefore) {
            this.createdBefore = createdBefore;
        }
        
        public Integer getPage() {
            return page;
        }
        
        public void setPage(Integer page) {
            this.page = page;
        }
        
        public Integer getSize() {
            return size;
        }
        
        public void setSize(Integer size) {
            this.size = size;
        }
        
        public String getSortBy() {
            return sortBy;
        }
        
        public void setSortBy(String sortBy) {
            this.sortBy = sortBy;
        }
        
        public String getSortDirection() {
            return sortDirection;
        }
        
        public void setSortDirection(String sortDirection) {
            this.sortDirection = sortDirection;
        }
    }
    
    /**
     * Report Statistics Response DTO
     */
    public static class ReportStatsResponse {
        
        @JsonProperty("user_id")
        private String userId;
        
        @JsonProperty("total_reports")
        private long totalReports;
        
        @JsonProperty("completed_reports")
        private long completedReports;
        
        @JsonProperty("pending_reports")
        private long pendingReports;
        
        @JsonProperty("failed_reports")
        private long failedReports;
        
        @JsonProperty("success_rate")
        private double successRate;
        
        // Constructors
        public ReportStatsResponse() {}
        
        public ReportStatsResponse(String userId, long totalReports, long completedReports, 
                                  long pendingReports, long failedReports, double successRate) {
            this.userId = userId;
            this.totalReports = totalReports;
            this.completedReports = completedReports;
            this.pendingReports = pendingReports;
            this.failedReports = failedReports;
            this.successRate = successRate;
        }
        
        // Getters and Setters
        public String getUserId() {
            return userId;
        }
        
        public void setUserId(String userId) {
            this.userId = userId;
        }
        
        public long getTotalReports() {
            return totalReports;
        }
        
        public void setTotalReports(long totalReports) {
            this.totalReports = totalReports;
        }
        
        public long getCompletedReports() {
            return completedReports;
        }
        
        public void setCompletedReports(long completedReports) {
            this.completedReports = completedReports;
        }
        
        public long getPendingReports() {
            return pendingReports;
        }
        
        public void setPendingReports(long pendingReports) {
            this.pendingReports = pendingReports;
        }
        
        public long getFailedReports() {
            return failedReports;
        }
        
        public void setFailedReports(long failedReports) {
            this.failedReports = failedReports;
        }
        
        public double getSuccessRate() {
            return successRate;
        }
        
        public void setSuccessRate(double successRate) {
            this.successRate = successRate;
        }
    }
    
    /**
     * Metric Data for analytics processing
     */
    public static class MetricData {
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("value")
        private java.math.BigDecimal value;
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        // Constructors
        public MetricData() {}
        
        public MetricData(String type, java.math.BigDecimal value, LocalDateTime timestamp) {
            this.type = type;
            this.value = value;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public java.math.BigDecimal getValue() {
            return value;
        }
        
        public void setValue(java.math.BigDecimal value) {
            this.value = value;
        }
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }
}