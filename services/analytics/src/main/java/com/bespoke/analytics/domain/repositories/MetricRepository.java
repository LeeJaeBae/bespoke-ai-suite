package com.bespoke.analytics.domain.repositories;

import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;
import com.bespoke.analytics.domain.valueobjects.TimeWindow;
import com.bespoke.analytics.domain.valueobjects.AggregationType;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Metric Repository Interface
 * 
 * Domain repository interface for metric persistence and querying
 * Follows Clean Architecture principles - no infrastructure dependencies
 */
public interface MetricRepository {
    
    /**
     * Save a metric
     */
    Metric save(Metric metric);
    
    /**
     * Save multiple metrics in batch
     */
    List<Metric> saveAll(List<Metric> metrics);
    
    /**
     * Find metric by ID
     */
    Optional<Metric> findById(UUID id);
    
    /**
     * Find metrics by type within time window
     */
    List<Metric> findByTypeAndTimeWindow(MetricType type, TimeWindow timeWindow);
    
    /**
     * Find metrics for specific entity within time window
     */
    List<Metric> findByEntityAndTimeWindow(String entityId, String entityType, TimeWindow timeWindow);
    
    /**
     * Find metrics by type for specific entity within time window
     */
    List<Metric> findByTypeAndEntityAndTimeWindow(MetricType type, String entityId, 
                                                  String entityType, TimeWindow timeWindow);
    
    /**
     * Find metrics by multiple types within time window
     */
    List<Metric> findByTypesAndTimeWindow(List<MetricType> types, TimeWindow timeWindow);
    
    /**
     * Find metrics with dimension filter within time window
     */
    List<Metric> findByDimensionAndTimeWindow(String dimensionKey, String dimensionValue, 
                                              TimeWindow timeWindow);
    
    /**
     * Find metrics with multiple dimension filters within time window
     */
    List<Metric> findByDimensionsAndTimeWindow(Map<String, String> dimensions, TimeWindow timeWindow);
    
    /**
     * Find metrics by filters with pagination
     */
    List<Metric> findByFilters(List<MetricType> types, String entityId, String entityType, 
                              TimeWindow timeWindow, int limit, int offset);
    
    /**
     * Get time series data for specific metric type and entity
     */
    List<Metric> getTimeSeries(MetricType type, String entityId, String entityType, 
                              TimeWindow timeWindow, String interval);
    
    /**
     * Aggregate metrics by type within time window
     */
    Map<MetricType, MetricValue> aggregateByType(List<MetricType> types, TimeWindow timeWindow, 
                                                 AggregationType aggregationType);
    
    /**
     * Aggregate metrics for entity within time window
     */
    Map<MetricType, MetricValue> aggregateByEntity(String entityId, String entityType, 
                                                   TimeWindow timeWindow, AggregationType aggregationType);
    
    /**
     * Get time series data for metric type
     * Returns aggregated values for each time interval within the window
     */
    Map<java.time.LocalDateTime, MetricValue> getTimeSeries(MetricType type, TimeWindow timeWindow, 
                                                            java.time.Duration interval, 
                                                            AggregationType aggregationType);
    
    /**
     * Get time series data for entity
     */
    Map<java.time.LocalDateTime, Map<MetricType, MetricValue>> getTimeSeriesForEntity(
            String entityId, String entityType, List<MetricType> types, TimeWindow timeWindow,
            java.time.Duration interval, AggregationType aggregationType);
    
    /**
     * Count metrics by type within time window
     */
    long countByType(MetricType type, TimeWindow timeWindow);
    
    /**
     * Count metrics for entity within time window
     */
    long countByEntity(String entityId, String entityType, TimeWindow timeWindow);
    
    /**
     * Get unique entity IDs for given entity type within time window
     */
    List<String> getUniqueEntityIds(String entityType, TimeWindow timeWindow);
    
    /**
     * Get unique dimension values for given dimension key within time window
     */
    List<String> getUniqueDimensionValues(String dimensionKey, TimeWindow timeWindow);
    
    /**
     * Calculate percentile values for metric type within time window
     */
    Map<Integer, MetricValue> calculatePercentiles(MetricType type, TimeWindow timeWindow, 
                                                   List<Integer> percentiles);
    
    /**
     * Find top N entities by metric value within time window
     */
    List<EntityMetric> findTopEntitiesByMetric(MetricType type, String entityType, 
                                              TimeWindow timeWindow, int limit, 
                                              AggregationType aggregationType);
    
    /**
     * Compare metrics between two time windows
     */
    Map<MetricType, MetricComparison> compareTimeWindows(List<MetricType> types, 
                                                         TimeWindow current, TimeWindow previous, 
                                                         AggregationType aggregationType);
    
    /**
     * Delete metrics older than specified time window
     */
    int deleteOlderThan(TimeWindow timeWindow);
    
    /**
     * Check if repository is healthy and accessible
     */
    boolean isHealthy();
    
    /**
     * Entity metric result
     */
    class EntityMetric {
        private final String entityId;
        private final MetricValue value;
        private final long count;
        
        public EntityMetric(String entityId, MetricValue value, long count) {
            this.entityId = entityId;
            this.value = value;
            this.count = count;
        }
        
        public String getEntityId() {
            return entityId;
        }
        
        public MetricValue getValue() {
            return value;
        }
        
        public long getCount() {
            return count;
        }
    }
    
    /**
     * Metric comparison result
     */
    class MetricComparison {
        private final MetricValue currentValue;
        private final MetricValue previousValue;
        private final MetricValue change;
        private final MetricValue percentageChange;
        
        public MetricComparison(MetricValue currentValue, MetricValue previousValue, 
                               MetricValue change, MetricValue percentageChange) {
            this.currentValue = currentValue;
            this.previousValue = previousValue;
            this.change = change;
            this.percentageChange = percentageChange;
        }
        
        public MetricValue getCurrentValue() {
            return currentValue;
        }
        
        public MetricValue getPreviousValue() {
            return previousValue;
        }
        
        public MetricValue getChange() {
            return change;
        }
        
        public MetricValue getPercentageChange() {
            return percentageChange;
        }
        
        public boolean hasImproved() {
            return change.isPositive();
        }
        
        public boolean hasDeclined() {
            return change.isNegative();
        }
    }
}