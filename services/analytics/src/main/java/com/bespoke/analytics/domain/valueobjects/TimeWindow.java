package com.bespoke.analytics.domain.valueobjects;

import jakarta.persistence.Embeddable;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Objects;

/**
 * Time Window Value Object
 * 
 * Represents a time range for analytics data aggregation
 * Immutable value object following Clean Architecture principles
 */
@Embeddable
public final class TimeWindow {
    
    private final LocalDateTime startTime;
    private final LocalDateTime endTime;
    private final Duration duration;
    
    // JPA default constructor
    protected TimeWindow() {
        this.startTime = null;
        this.endTime = null;
        this.duration = null;
    }
    
    private TimeWindow(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time cannot be null");
        }
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time cannot be after end time");
        }
        
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = Duration.between(startTime, endTime);
    }
    
    /**
     * Create a time window from start and end times
     */
    public static TimeWindow of(LocalDateTime startTime, LocalDateTime endTime) {
        return new TimeWindow(startTime, endTime);
    }
    
    /**
     * Create a time window from start time and duration
     */
    public static TimeWindow from(LocalDateTime startTime, Duration duration) {
        if (duration.isNegative()) {
            throw new IllegalArgumentException("Duration cannot be negative");
        }
        return new TimeWindow(startTime, startTime.plus(duration));
    }
    
    /**
     * Create a time window for the last N hours
     */
    public static TimeWindow lastHours(int hours) {
        if (hours <= 0) {
            throw new IllegalArgumentException("Hours must be positive");
        }
        LocalDateTime now = LocalDateTime.now();
        return new TimeWindow(now.minusHours(hours), now);
    }
    
    /**
     * Create a time window for the last N days
     */
    public static TimeWindow lastDays(int days) {
        if (days <= 0) {
            throw new IllegalArgumentException("Days must be positive");
        }
        LocalDateTime now = LocalDateTime.now();
        return new TimeWindow(now.minusDays(days), now);
    }
    
    /**
     * Create a time window for today
     */
    public static TimeWindow today() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        return new TimeWindow(startOfDay, now);
    }
    
    /**
     * Create a time window for this week
     */
    public static TimeWindow thisWeek() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfWeek = now.minusDays(now.getDayOfWeek().getValue() - 1).toLocalDate().atStartOfDay();
        return new TimeWindow(startOfWeek, now);
    }
    
    /**
     * Create a time window for this month
     */
    public static TimeWindow thisMonth() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        return new TimeWindow(startOfMonth, now);
    }
    
    /**
     * Check if this time window contains the given timestamp
     */
    public boolean contains(LocalDateTime timestamp) {
        return !timestamp.isBefore(startTime) && !timestamp.isAfter(endTime);
    }
    
    /**
     * Check if this time window overlaps with another time window
     */
    public boolean overlaps(TimeWindow other) {
        return startTime.isBefore(other.endTime) && endTime.isAfter(other.startTime);
    }
    
    /**
     * Split this time window into smaller windows of the given duration
     */
    public java.util.List<TimeWindow> split(Duration intervalDuration) {
        if (intervalDuration.isNegative() || intervalDuration.isZero()) {
            throw new IllegalArgumentException("Interval duration must be positive");
        }
        
        java.util.List<TimeWindow> windows = new java.util.ArrayList<>();
        LocalDateTime current = startTime;
        
        while (current.isBefore(endTime)) {
            LocalDateTime intervalEnd = current.plus(intervalDuration);
            if (intervalEnd.isAfter(endTime)) {
                intervalEnd = endTime;
            }
            windows.add(new TimeWindow(current, intervalEnd));
            current = intervalEnd;
        }
        
        return windows;
    }
    
    /**
     * Get the start time as epoch seconds
     */
    public long getStartEpochSecond() {
        return startTime.toEpochSecond(ZoneOffset.UTC);
    }
    
    /**
     * Get the end time as epoch seconds
     */
    public long getEndEpochSecond() {
        return endTime.toEpochSecond(ZoneOffset.UTC);
    }
    
    /**
     * Get duration in seconds
     */
    public long getDurationSeconds() {
        return duration.getSeconds();
    }
    
    /**
     * Get duration in minutes
     */
    public long getDurationMinutes() {
        return duration.toMinutes();
    }
    
    /**
     * Get duration in hours
     */
    public long getDurationHours() {
        return duration.toHours();
    }
    
    /**
     * Get duration in days
     */
    public long getDurationDays() {
        return duration.toDays();
    }
    
    // Getters
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public Duration getDuration() {
        return duration;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TimeWindow that = (TimeWindow) o;
        return Objects.equals(startTime, that.startTime) && 
               Objects.equals(endTime, that.endTime);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(startTime, endTime);
    }
    
    @Override
    public String toString() {
        return String.format("TimeWindow{startTime=%s, endTime=%s, duration=%s}", 
                           startTime, endTime, duration);
    }
}