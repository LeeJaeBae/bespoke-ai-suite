package com.bespoke.analytics.application.dto;

import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Metric Data Transfer Objects
 * 
 * DTOs for metric-related operations in the application layer
 */
public class MetricDTO {
    
    /**
     * Request DTO for creating a metric
     */
    public static class CreateMetricRequest {
        
        @NotNull(message = "Metric type is required")
        @JsonProperty("type")
        private String type;
        
        @NotNull(message = "Value is required")
        @JsonProperty("value")
        private BigDecimal value;
        
        @NotNull(message = "Unit is required")
        @JsonProperty("unit")
        private String unit;
        
        @NotNull(message = "Timestamp is required")
        @PastOrPresent(message = "Timestamp cannot be in the future")
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        @JsonProperty("entity_id")
        private String entityId;
        
        @JsonProperty("entity_type")
        private String entityType;
        
        @JsonProperty("dimensions")
        private Map<String, String> dimensions;
        
        @JsonProperty("metadata")
        private Map<String, Object> metadata;
        
        // Constructors
        public CreateMetricRequest() {}
        
        public CreateMetricRequest(String type, BigDecimal value, String unit, LocalDateTime timestamp) {
            this.type = type;
            this.value = value;
            this.unit = unit;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
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
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
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
        
        public Map<String, String> getDimensions() {
            return dimensions;
        }
        
        public void setDimensions(Map<String, String> dimensions) {
            this.dimensions = dimensions;
        }
        
        public Map<String, Object> getMetadata() {
            return metadata;
        }
        
        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }
    }
    
    /**
     * Request DTO for batch creating metrics
     */
    public static class BatchCreateMetricsRequest {
        
        @NotNull(message = "Metrics list is required")
        @JsonProperty("metrics")
        private java.util.List<CreateMetricRequest> metrics;
        
        public BatchCreateMetricsRequest() {}
        
        public BatchCreateMetricsRequest(java.util.List<CreateMetricRequest> metrics) {
            this.metrics = metrics;
        }
        
        public java.util.List<CreateMetricRequest> getMetrics() {
            return metrics;
        }
        
        public void setMetrics(java.util.List<CreateMetricRequest> metrics) {
            this.metrics = metrics;
        }
    }
    
    /**
     * Response DTO for metric
     */
    public static class MetricResponse {
        
        @JsonProperty("id")
        private UUID id;
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("type_display_name")
        private String typeDisplayName;
        
        @JsonProperty("value")
        private BigDecimal value;
        
        @JsonProperty("unit")
        private String unit;
        
        @JsonProperty("formatted_value")
        private String formattedValue;
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        @JsonProperty("entity_id")
        private String entityId;
        
        @JsonProperty("entity_type")
        private String entityType;
        
        @JsonProperty("dimensions")
        private Map<String, String> dimensions;
        
        @JsonProperty("metadata")
        private Map<String, Object> metadata;
        
        // Constructors
        public MetricResponse() {}
        
        public MetricResponse(UUID id, String type, String typeDisplayName, BigDecimal value,
                             String unit, String formattedValue, LocalDateTime timestamp) {
            this.id = id;
            this.type = type;
            this.typeDisplayName = typeDisplayName;
            this.value = value;
            this.unit = unit;
            this.formattedValue = formattedValue;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public UUID getId() {
            return id;
        }
        
        public void setId(UUID id) {
            this.id = id;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public String getTypeDisplayName() {
            return typeDisplayName;
        }
        
        public void setTypeDisplayName(String typeDisplayName) {
            this.typeDisplayName = typeDisplayName;
        }
        
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
        
        public LocalDateTime getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
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
        
        public Map<String, String> getDimensions() {
            return dimensions;
        }
        
        public void setDimensions(Map<String, String> dimensions) {
            this.dimensions = dimensions;
        }
        
        public Map<String, Object> getMetadata() {
            return metadata;
        }
        
        public void setMetadata(Map<String, Object> metadata) {
            this.metadata = metadata;
        }
    }
    
    /**
     * Query DTO for metrics
     */
    public static class MetricQuery {
        
        @JsonProperty("types")
        private java.util.List<String> types;
        
        @JsonProperty("entity_id")
        private String entityId;
        
        @JsonProperty("entity_type")
        private String entityType;
        
        @JsonProperty("start_time")
        private LocalDateTime startTime;
        
        @JsonProperty("end_time")
        private LocalDateTime endTime;
        
        @JsonProperty("dimensions")
        private Map<String, String> dimensions;
        
        @JsonProperty("aggregation")
        private String aggregation; // SUM, AVERAGE, MIN, MAX, COUNT
        
        @JsonProperty("interval")
        private String interval; // HOUR, DAY, WEEK, MONTH
        
        @JsonProperty("limit")
        private Integer limit;
        
        @JsonProperty("offset")
        private Integer offset;
        
        // Constructors
        public MetricQuery() {}
        
        // Getters and Setters
        public java.util.List<String> getTypes() {
            return types;
        }
        
        public void setTypes(java.util.List<String> types) {
            this.types = types;
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
        
        public Map<String, String> getDimensions() {
            return dimensions;
        }
        
        public void setDimensions(Map<String, String> dimensions) {
            this.dimensions = dimensions;
        }
        
        public String getAggregation() {
            return aggregation;
        }
        
        public void setAggregation(String aggregation) {
            this.aggregation = aggregation;
        }
        
        public String getAggregationType() {
            return aggregation;
        }
        
        public void setAggregationType(String aggregationType) {
            this.aggregation = aggregationType;
        }
        
        public String getInterval() {
            return interval;
        }
        
        public void setInterval(String interval) {
            this.interval = interval;
        }
        
        public Integer getLimit() {
            return limit;
        }
        
        public void setLimit(Integer limit) {
            this.limit = limit;
        }
        
        public Integer getOffset() {
            return offset;
        }
        
        public void setOffset(Integer offset) {
            this.offset = offset;
        }
    }
    
    /**
     * Aggregated metric response
     */
    public static class AggregatedMetricResponse {
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("value")
        private BigDecimal value;
        
        @JsonProperty("unit")
        private String unit;
        
        @JsonProperty("formatted_value")
        private String formattedValue;
        
        @JsonProperty("aggregation_type")
        private String aggregationType;
        
        @JsonProperty("data_points")
        private long dataPoints;
        
        @JsonProperty("time_window")
        private TimeWindowDTO timeWindow;
        
        // Constructors
        public AggregatedMetricResponse() {}
        
        public AggregatedMetricResponse(String type, BigDecimal value, String unit,
                                       String formattedValue, String aggregationType, long dataPoints) {
            this.type = type;
            this.value = value;
            this.unit = unit;
            this.formattedValue = formattedValue;
            this.aggregationType = aggregationType;
            this.dataPoints = dataPoints;
        }
        
        // Getters and Setters
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
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
        
        public String getAggregationType() {
            return aggregationType;
        }
        
        public void setAggregationType(String aggregationType) {
            this.aggregationType = aggregationType;
        }
        
        public long getDataPoints() {
            return dataPoints;
        }
        
        public void setDataPoints(long dataPoints) {
            this.dataPoints = dataPoints;
        }
        
        public TimeWindowDTO getTimeWindow() {
            return timeWindow;
        }
        
        public void setTimeWindow(TimeWindowDTO timeWindow) {
            this.timeWindow = timeWindow;
        }
    }
    
    /**
     * Time window DTO
     */
    public static class TimeWindowDTO {
        
        @JsonProperty("start_time")
        private LocalDateTime startTime;
        
        @JsonProperty("end_time")
        private LocalDateTime endTime;
        
        @JsonProperty("duration_seconds")
        private long durationSeconds;
        
        // Constructors
        public TimeWindowDTO() {}
        
        public TimeWindowDTO(LocalDateTime startTime, LocalDateTime endTime, long durationSeconds) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.durationSeconds = durationSeconds;
        }
        
        // Getters and Setters
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
        
        public long getDurationSeconds() {
            return durationSeconds;
        }
        
        public void setDurationSeconds(long durationSeconds) {
            this.durationSeconds = durationSeconds;
        }
    }
    
    /**
     * Time Series Query DTO
     */
    public static class TimeSeriesQuery {
        
        @NotNull(message = "Metric type is required")
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("entity_id")
        private String entityId;
        
        @JsonProperty("entity_type")
        private String entityType;
        
        @NotNull(message = "Start time is required")
        @JsonProperty("start_time")
        private LocalDateTime startTime;
        
        @NotNull(message = "End time is required")
        @JsonProperty("end_time")
        private LocalDateTime endTime;
        
        @JsonProperty("interval")
        private String interval; // 1h, 1d, etc.
        
        @JsonProperty("aggregation_type")
        private String aggregationType;
        
        // Constructors
        public TimeSeriesQuery() {}
        
        // Getters and Setters
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
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
        
        public String getInterval() {
            return interval;
        }
        
        public void setInterval(String interval) {
            this.interval = interval;
        }
        
        public String getAggregationType() {
            return aggregationType;
        }
        
        public void setAggregationType(String aggregationType) {
            this.aggregationType = aggregationType;
        }
    }
    
    /**
     * Time Series Response DTO
     */
    public static class TimeSeriesResponse {
        
        @JsonProperty("timestamp")
        private LocalDateTime timestamp;
        
        @JsonProperty("value")
        private BigDecimal value;
        
        @JsonProperty("dimensions")
        private Map<String, String> dimensions;
        
        // Constructors
        public TimeSeriesResponse() {}
        
        public TimeSeriesResponse(LocalDateTime timestamp, BigDecimal value, Map<String, String> dimensions) {
            this.timestamp = timestamp;
            this.value = value;
            this.dimensions = dimensions;
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
        
        public Map<String, String> getDimensions() {
            return dimensions;
        }
        
        public void setDimensions(Map<String, String> dimensions) {
            this.dimensions = dimensions;
        }
    }
}