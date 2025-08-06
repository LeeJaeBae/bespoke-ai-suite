package com.bespoke.analytics.domain.valueobjects;

/**
 * Aggregation Type Value Object
 * 
 * Represents different types of metric aggregations
 * Immutable value object for statistical operations
 */
public enum AggregationType {
    /**
     * Sum aggregation - total of all values
     */
    SUM("SUM", "Sum of all values"),
    
    /**
     * Average aggregation - arithmetic mean
     */
    AVG("AVG", "Average (arithmetic mean) of all values"),
    
    /**
     * Count aggregation - number of data points
     */
    COUNT("COUNT", "Count of data points"),
    
    /**
     * Minimum value aggregation
     */
    MIN("MIN", "Minimum value"),
    
    /**
     * Maximum value aggregation
     */
    MAX("MAX", "Maximum value"),
    
    /**
     * Standard deviation aggregation
     */
    STDDEV("STDDEV", "Standard deviation of values"),
    
    /**
     * Percentile aggregation (typically 95th percentile)
     */
    P95("P95", "95th percentile value"),
    
    /**
     * Percentile aggregation (typically 99th percentile)
     */
    P99("P99", "99th percentile value"),
    
    /**
     * Median aggregation (50th percentile)
     */
    MEDIAN("MEDIAN", "Median (50th percentile) value"),
    
    /**
     * First value in time series
     */
    FIRST("FIRST", "First value in time series"),
    
    /**
     * Last value in time series
     */
    LAST("LAST", "Last value in time series");
    
    private final String code;
    private final String description;
    
    AggregationType(String code, String description) {
        this.code = code;
        this.description = description;
    }
    
    /**
     * Get aggregation code
     */
    public String getCode() {
        return code;
    }
    
    /**
     * Get aggregation description
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Create from string representation
     */
    public static AggregationType fromString(String type) {
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("Aggregation type cannot be null or empty");
        }
        
        try {
            return AggregationType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid aggregation type: " + type);
        }
    }
    
    /**
     * Check if aggregation type is statistical
     */
    public boolean isStatistical() {
        return this == AVG || this == STDDEV || this == MEDIAN || 
               this == P95 || this == P99 || this == MIN || this == MAX;
    }
    
    /**
     * Check if aggregation type is cumulative
     */
    public boolean isCumulative() {
        return this == SUM || this == COUNT;
    }
    
    /**
     * Check if aggregation type is time-based
     */
    public boolean isTimeBased() {
        return this == FIRST || this == LAST;
    }
    
    /**
     * Check if aggregation type is percentile-based
     */
    public boolean isPercentile() {
        return this == P95 || this == P99 || this == MEDIAN;
    }
    
    /**
     * Get default aggregation type for numeric metrics
     */
    public static AggregationType getDefault() {
        return AVG;
    }
    
    @Override
    public String toString() {
        return code;
    }
}