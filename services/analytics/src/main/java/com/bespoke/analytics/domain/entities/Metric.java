package com.bespoke.analytics.domain.entities;

import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Metric Entity
 * 
 * Core domain entity representing a single metric measurement
 * Follows Clean Architecture principles with rich domain logic
 */
@Entity
@Table(name = "metrics", schema = "analytics")
public class Metric {
    
    @Id
    @Column(name = "id")
    private final UUID id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false)
    private final MetricType type;
    
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "value", column = @Column(name = "value")),
        @AttributeOverride(name = "unit", column = @Column(name = "unit"))
    })
    private final MetricValue value;
    
    @Column(name = "timestamp", nullable = false)
    private final LocalDateTime timestamp;
    
    @Column(name = "entity_id")
    private final String entityId; // ID of the entity this metric relates to (user, campaign, content, etc.)
    
    @Column(name = "entity_type")
    private final String entityType; // Type of entity (user, campaign, content, etc.)
    
    @Transient
    private final Map<String, String> dimensions; // Additional dimensions for filtering/grouping
    
    @Transient
    private final Map<String, Object> metadata; // Additional metadata
    
    @Column(name = "created_at", nullable = false)
    private final LocalDateTime createdAt; // Creation timestamp
    
    // JPA default constructor
    protected Metric() {
        this.id = null;
        this.type = null;
        this.value = null;
        this.timestamp = null;
        this.entityId = null;
        this.entityType = null;
        this.dimensions = new HashMap<>();
        this.metadata = new HashMap<>();
        this.createdAt = null;
    }
    
    private Metric(UUID id, MetricType type, MetricValue value, LocalDateTime timestamp,
                   String entityId, String entityType, Map<String, String> dimensions,
                   Map<String, Object> metadata, LocalDateTime createdAt) {
        this.id = Objects.requireNonNull(id, "ID cannot be null");
        this.type = Objects.requireNonNull(type, "Type cannot be null");
        this.value = Objects.requireNonNull(value, "Value cannot be null");
        this.timestamp = Objects.requireNonNull(timestamp, "Timestamp cannot be null");
        this.entityId = entityId;
        this.entityType = entityType;
        this.dimensions = dimensions != null ? new HashMap<>(dimensions) : new HashMap<>();
        this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        
        validateBusinessRules();
    }
    
    /**
     * Factory method to create a new metric
     */
    public static Metric create(MetricType type, MetricValue value, LocalDateTime timestamp,
                               String entityId, String entityType) {
        return new Metric(UUID.randomUUID(), type, value, timestamp, entityId, entityType, 
                         null, null, LocalDateTime.now());
    }
    
    /**
     * Factory method to create a metric with dimensions
     */
    public static Metric create(MetricType type, MetricValue value, LocalDateTime timestamp,
                               String entityId, String entityType, Map<String, String> dimensions) {
        return new Metric(UUID.randomUUID(), type, value, timestamp, entityId, entityType,
                         dimensions, null, LocalDateTime.now());
    }
    
    /**
     * Factory method to create a metric with dimensions and metadata
     */
    public static Metric create(MetricType type, MetricValue value, LocalDateTime timestamp,
                               String entityId, String entityType, Map<String, String> dimensions,
                               Map<String, Object> metadata) {
        return new Metric(UUID.randomUUID(), type, value, timestamp, entityId, entityType,
                         dimensions, metadata, LocalDateTime.now());
    }
    
    /**
     * Reconstruct metric from persistence (for repository)
     */
    public static Metric reconstruct(UUID id, MetricType type, MetricValue value, LocalDateTime timestamp,
                                    String entityId, String entityType, Map<String, String> dimensions,
                                    Map<String, Object> metadata, LocalDateTime createdAt) {
        return new Metric(id, type, value, timestamp, entityId, entityType, dimensions, metadata, createdAt);
    }
    
    /**
     * Validate business rules
     */
    private void validateBusinessRules() {
        // Timestamp should not be in the future
        if (timestamp.isAfter(LocalDateTime.now().plusMinutes(5))) { // Allow 5 minute buffer for clock skew
            throw new IllegalArgumentException("Metric timestamp cannot be in the future");
        }
        
        // Timestamp should not be too old (more than 1 year)
        if (timestamp.isBefore(LocalDateTime.now().minusYears(1))) {
            throw new IllegalArgumentException("Metric timestamp is too old");
        }
        
        // Entity ID should be provided for entity-specific metrics
        if (isEntitySpecificMetric() && (entityId == null || entityId.trim().isEmpty())) {
            throw new IllegalArgumentException("Entity ID is required for entity-specific metrics");
        }
        
        // Entity type should be provided when entity ID is provided
        if (entityId != null && !entityId.trim().isEmpty() && 
            (entityType == null || entityType.trim().isEmpty())) {
            throw new IllegalArgumentException("Entity type is required when entity ID is provided");
        }
        
        // Value should be non-negative for count metrics
        if (isCountMetric() && value.isNegative()) {
            throw new IllegalArgumentException("Count metrics cannot have negative values");
        }
    }
    
    /**
     * Check if this is an entity-specific metric
     */
    private boolean isEntitySpecificMetric() {
        return type.isUserMetric() || type.isContentMetric() || type.isCampaignMetric();
    }
    
    /**
     * Check if this is a count metric
     */
    private boolean isCountMetric() {
        return value.getUnit() == MetricValue.MetricUnit.COUNT;
    }
    
    /**
     * Check if this metric is stale (older than specified hours)
     */
    public boolean isStale(int hours) {
        return timestamp.isBefore(LocalDateTime.now().minusHours(hours));
    }
    
    /**
     * Check if this metric matches the given entity
     */
    public boolean belongsToEntity(String entityId, String entityType) {
        return Objects.equals(this.entityId, entityId) && 
               Objects.equals(this.entityType, entityType);
    }
    
    /**
     * Check if this metric has a specific dimension
     */
    public boolean hasDimension(String key) {
        return dimensions.containsKey(key);
    }
    
    /**
     * Get dimension value
     */
    public String getDimension(String key) {
        return dimensions.get(key);
    }
    
    /**
     * Check if this metric has specific metadata
     */
    public boolean hasMetadata(String key) {
        return metadata.containsKey(key);
    }
    
    /**
     * Get metadata value
     */
    public Object getMetadata(String key) {
        return metadata.get(key);
    }
    
    /**
     * Get formatted display string
     */
    public String getDisplayString() {
        StringBuilder sb = new StringBuilder();
        sb.append(type.getDisplayName())
          .append(": ")
          .append(value.format());
        
        if (entityId != null) {
            sb.append(" (").append(entityType).append(": ").append(entityId).append(")");
        }
        
        return sb.toString();
    }
    
    /**
     * Add dimension to the metric
     */
    public void addDimension(String key, String value) {
        if (key != null && value != null) {
            this.dimensions.put(key, value);
        }
    }
    
    /**
     * Add metadata to the metric
     */
    public void addMetadata(String key, Object value) {
        if (key != null && value != null) {
            this.metadata.put(key, value);
        }
    }
    
    /**
     * Create a copy with updated value (for aggregations)
     */
    public Metric withValue(MetricValue newValue) {
        return new Metric(this.id, this.type, newValue, this.timestamp, this.entityId,
                         this.entityType, this.dimensions, this.metadata, this.createdAt);
    }
    
    /**
     * Create a copy with updated timestamp
     */
    public Metric withTimestamp(LocalDateTime newTimestamp) {
        return new Metric(this.id, this.type, this.value, newTimestamp, this.entityId,
                         this.entityType, this.dimensions, this.metadata, this.createdAt);
    }
    
    // Getters
    public UUID getId() {
        return id;
    }
    
    public MetricType getType() {
        return type;
    }
    
    public MetricValue getValue() {
        return value;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public String getEntityId() {
        return entityId;
    }
    
    public String getEntityType() {
        return entityType;
    }
    
    public Map<String, String> getDimensions() {
        return Map.copyOf(dimensions);
    }
    
    public Map<String, Object> getMetadata() {
        return Map.copyOf(metadata);
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Metric metric = (Metric) o;
        return Objects.equals(id, metric.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return String.format("Metric{id=%s, type=%s, value=%s, timestamp=%s, entityId='%s', entityType='%s'}",
                           id, type, value, timestamp, entityId, entityType);
    }
}