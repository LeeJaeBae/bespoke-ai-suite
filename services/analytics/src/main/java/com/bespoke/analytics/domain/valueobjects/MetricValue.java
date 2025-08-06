package com.bespoke.analytics.domain.valueobjects;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Metric Value Object
 * 
 * Represents a measured value with its unit and precision
 * Handles different types of metric values (count, percentage, currency, etc.)
 */
public final class MetricValue {
    
    private final BigDecimal value;
    private final MetricUnit unit;
    private final int precision;
    
    private MetricValue(BigDecimal value, MetricUnit unit, int precision) {
        if (value == null) {
            throw new IllegalArgumentException("Value cannot be null");
        }
        if (unit == null) {
            throw new IllegalArgumentException("Unit cannot be null");
        }
        if (precision < 0) {
            throw new IllegalArgumentException("Precision cannot be negative");
        }
        
        this.value = value.setScale(precision, RoundingMode.HALF_UP);
        this.unit = unit;
        this.precision = precision;
    }
    
    /**
     * Simple constructor for basic usage (uses COUNT unit with no decimal places)
     */
    public MetricValue(BigDecimal value) {
        this(value, MetricUnit.COUNT, 0);
    }
    
    /**
     * Create a metric value with default precision
     */
    public static MetricValue of(BigDecimal value, MetricUnit unit) {
        return new MetricValue(value, unit, unit.getDefaultPrecision());
    }
    
    /**
     * Create a metric value with custom precision
     */
    public static MetricValue of(BigDecimal value, MetricUnit unit, int precision) {
        return new MetricValue(value, unit, precision);
    }
    
    /**
     * Create a metric value from double
     */
    public static MetricValue of(double value, MetricUnit unit) {
        return new MetricValue(BigDecimal.valueOf(value), unit, unit.getDefaultPrecision());
    }
    
    /**
     * Create a metric value from long (for counts)
     */
    public static MetricValue count(long value) {
        return new MetricValue(BigDecimal.valueOf(value), MetricUnit.COUNT, 0);
    }
    
    /**
     * Create a percentage metric value
     */
    public static MetricValue percentage(double value) {
        return new MetricValue(BigDecimal.valueOf(value), MetricUnit.PERCENTAGE, 2);
    }
    
    /**
     * Create a currency metric value
     */
    public static MetricValue currency(BigDecimal value) {
        return new MetricValue(value, MetricUnit.CURRENCY, 2);
    }
    
    /**
     * Create a duration metric value in milliseconds
     */
    public static MetricValue duration(long milliseconds) {
        return new MetricValue(BigDecimal.valueOf(milliseconds), MetricUnit.MILLISECONDS, 0);
    }
    
    /**
     * Add another metric value (must have same unit)
     */
    public MetricValue add(MetricValue other) {
        if (!this.unit.equals(other.unit)) {
            throw new IllegalArgumentException("Cannot add values with different units");
        }
        BigDecimal result = this.value.add(other.value);
        return new MetricValue(result, this.unit, Math.max(this.precision, other.precision));
    }
    
    /**
     * Subtract another metric value (must have same unit)
     */
    public MetricValue subtract(MetricValue other) {
        if (!this.unit.equals(other.unit)) {
            throw new IllegalArgumentException("Cannot subtract values with different units");
        }
        BigDecimal result = this.value.subtract(other.value);
        return new MetricValue(result, this.unit, Math.max(this.precision, other.precision));
    }
    
    /**
     * Multiply by a scalar value
     */
    public MetricValue multiply(BigDecimal factor) {
        BigDecimal result = this.value.multiply(factor);
        return new MetricValue(result, this.unit, this.precision);
    }
    
    /**
     * Divide by a scalar value
     */
    public MetricValue divide(BigDecimal divisor) {
        if (divisor.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Cannot divide by zero");
        }
        BigDecimal result = this.value.divide(divisor, this.precision + 2, RoundingMode.HALF_UP);
        return new MetricValue(result, this.unit, this.precision);
    }
    
    /**
     * Calculate percentage change from another value
     */
    public MetricValue percentageChange(MetricValue baseline) {
        if (!this.unit.equals(baseline.unit)) {
            throw new IllegalArgumentException("Cannot calculate percentage change with different units");
        }
        if (baseline.value.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Cannot calculate percentage change from zero baseline");
        }
        
        BigDecimal change = this.value.subtract(baseline.value);
        BigDecimal percentageChange = change.divide(baseline.value, 4, RoundingMode.HALF_UP)
                                           .multiply(BigDecimal.valueOf(100));
        
        return MetricValue.percentage(percentageChange.doubleValue());
    }
    
    /**
     * Check if this value is zero
     */
    public boolean isZero() {
        return value.compareTo(BigDecimal.ZERO) == 0;
    }
    
    /**
     * Check if this value is positive
     */
    public boolean isPositive() {
        return value.compareTo(BigDecimal.ZERO) > 0;
    }
    
    /**
     * Check if this value is negative
     */
    public boolean isNegative() {
        return value.compareTo(BigDecimal.ZERO) < 0;
    }
    
    /**
     * Compare with another metric value
     */
    public int compareTo(MetricValue other) {
        if (!this.unit.equals(other.unit)) {
            throw new IllegalArgumentException("Cannot compare values with different units");
        }
        return this.value.compareTo(other.value);
    }
    
    /**
     * Get the value as double
     */
    public double asDouble() {
        return value.doubleValue();
    }
    
    /**
     * Get the value as long (for counts)
     */
    public long asLong() {
        return value.longValue();
    }
    
    /**
     * Get formatted string representation
     */
    public String format() {
        return unit.format(value);
    }
    
    // Getters
    public BigDecimal getValue() {
        return value;
    }
    
    public MetricUnit getUnit() {
        return unit;
    }
    
    public int getPrecision() {
        return precision;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MetricValue that = (MetricValue) o;
        return precision == that.precision &&
               Objects.equals(value, that.value) &&
               unit == that.unit;
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(value, unit, precision);
    }
    
    @Override
    public String toString() {
        return format();
    }
    
    /**
     * Metric Units
     */
    public enum MetricUnit {
        COUNT("", 0),
        PERCENTAGE("%", 2),
        CURRENCY("$", 2),
        MILLISECONDS("ms", 0),
        SECONDS("s", 2),
        BYTES("B", 0),
        KILOBYTES("KB", 2),
        MEGABYTES("MB", 2),
        RATE("/s", 2);
        
        private final String symbol;
        private final int defaultPrecision;
        
        MetricUnit(String symbol, int defaultPrecision) {
            this.symbol = symbol;
            this.defaultPrecision = defaultPrecision;
        }
        
        public String getSymbol() {
            return symbol;
        }
        
        public int getDefaultPrecision() {
            return defaultPrecision;
        }
        
        public String format(BigDecimal value) {
            if (this == CURRENCY) {
                return String.format("$%,.2f", value);
            } else if (this == PERCENTAGE) {
                return String.format("%.2f%%", value);
            } else {
                return String.format("%s%s", value.toPlainString(), symbol);
            }
        }
    }
}