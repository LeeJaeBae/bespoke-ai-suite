package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.MetricDTO;
import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.repositories.MetricRepository;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;
import com.bespoke.analytics.domain.valueobjects.AggregationType;
import com.bespoke.analytics.domain.valueobjects.TimeWindow;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Get Metric Use Case
 * 
 * Application service for querying and retrieving metrics
 * Handles metric queries with filters, aggregations, and time series
 */
public class GetMetricUseCase {
    
    private final MetricRepository metricRepository;
    
    public GetMetricUseCase(MetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }
    
    /**
     * Get metric by ID
     */
    public MetricDTO.MetricResponse getById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("Metric ID cannot be null");
        }
        
        Metric metric = metricRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Metric not found with ID: " + id));
        
        return convertToResponse(metric);
    }
    
    /**
     * Query metrics with filters
     */
    public List<MetricDTO.MetricResponse> query(MetricDTO.MetricQuery query) {
        // Validate query
        validateQuery(query);
        
        // Convert string types to MetricType enums
        List<MetricType> metricTypes = null;
        if (query.getTypes() != null && !query.getTypes().isEmpty()) {
            metricTypes = query.getTypes().stream()
                .map(MetricType::fromString)
                .collect(Collectors.toList());
        }
        
        // Build time window if start/end times provided
        TimeWindow timeWindow = null;
        if (query.getStartTime() != null && query.getEndTime() != null) {
            timeWindow = TimeWindow.of(query.getStartTime(), query.getEndTime());
        }
        
        // Execute query
        List<Metric> metrics = metricRepository.findByFilters(
            metricTypes,
            query.getEntityId(),
            query.getEntityType(),
            timeWindow,
            query.getLimit() != null ? query.getLimit() : 100,
            query.getOffset() != null ? query.getOffset() : 0
        );
        
        // Convert to response DTOs
        return metrics.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Query aggregated metrics
     */
    public List<MetricDTO.AggregatedMetricResponse> queryAggregated(MetricDTO.MetricQuery query) {
        // Validate query
        validateQuery(query);
        
        // Convert string types to MetricType enums
        List<MetricType> metricTypes = null;
        if (query.getTypes() != null && !query.getTypes().isEmpty()) {
            metricTypes = query.getTypes().stream()
                .map(MetricType::fromString)
                .collect(Collectors.toList());
        }
        
        // Build time window
        TimeWindow timeWindow = null;
        if (query.getStartTime() != null && query.getEndTime() != null) {
            timeWindow = TimeWindow.of(query.getStartTime(), query.getEndTime());
        }
        
        // Determine aggregation type (default to AVG)
        AggregationType aggregationType = query.getAggregationType() != null 
            ? AggregationType.valueOf(query.getAggregationType().toUpperCase())
            : AggregationType.AVG;
        
        // Execute aggregation query
        Map<MetricType, MetricValue> aggregatedResults = metricRepository.aggregateByType(
            metricTypes, timeWindow, aggregationType
        );
        
        // Convert to response DTOs
        return convertToAggregatedResponses(aggregatedResults, aggregationType, timeWindow);
    }
    
    /**
     * Get metric time series
     */
    public List<MetricDTO.TimeSeriesResponse> getTimeSeries(MetricDTO.TimeSeriesQuery query) {
        // Validate query
        validateTimeSeriesQuery(query);
        
        // Convert parameters
        MetricType metricType = MetricType.fromString(query.getType());
        TimeWindow timeWindow = TimeWindow.of(query.getStartTime(), query.getEndTime());
        AggregationType aggregationType = query.getAggregationType() != null 
            ? AggregationType.valueOf(query.getAggregationType().toUpperCase())
            : AggregationType.AVG;
        
        // Execute time series query
        List<Metric> timeSeriesData = metricRepository.getTimeSeries(
            metricType,
            query.getEntityId(),
            query.getEntityType(), 
            timeWindow,
            query.getInterval() != null ? query.getInterval() : "1h"
        );
        
        // Convert to time series response
        return timeSeriesData.stream()
            .map(this::convertToTimeSeriesResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Validate metric query
     */
    private void validateQuery(MetricDTO.MetricQuery query) {
        if (query == null) {
            throw new IllegalArgumentException("Query cannot be null");
        }
        
        if (query.getLimit() != null && query.getLimit() > 10000) {
            throw new IllegalArgumentException("Limit cannot exceed 10,000 records");
        }
        
        if (query.getOffset() != null && query.getOffset() < 0) {
            throw new IllegalArgumentException("Offset cannot be negative");
        }
        
        if (query.getStartTime() != null && query.getEndTime() != null) {
            if (query.getStartTime().isAfter(query.getEndTime())) {
                throw new IllegalArgumentException("Start time cannot be after end time");
            }
        }
    }
    
    /**
     * Validate time series query
     */
    private void validateTimeSeriesQuery(MetricDTO.TimeSeriesQuery query) {
        if (query == null) {
            throw new IllegalArgumentException("Time series query cannot be null");
        }
        
        if (query.getType() == null || query.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Metric type is required for time series query");
        }
        
        if (query.getStartTime() == null || query.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required for time series query");
        }
        
        if (query.getStartTime().isAfter(query.getEndTime())) {
            throw new IllegalArgumentException("Start time cannot be after end time");
        }
    }
    
    /**
     * Convert domain entity to response DTO
     */
    private MetricDTO.MetricResponse convertToResponse(Metric metric) {
        MetricDTO.MetricResponse response = new MetricDTO.MetricResponse(
            metric.getId(),
            metric.getType().toString(),
            metric.getType().getDisplayName(),
            metric.getValue().getValue(),
            metric.getValue().getUnit().toString(),
            metric.getValue().format(),
            metric.getTimestamp()
        );
        
        response.setEntityId(metric.getEntityId());
        response.setEntityType(metric.getEntityType());
        response.setDimensions(metric.getDimensions());
        response.setMetadata(metric.getMetadata());
        
        return response;
    }
    
    /**
     * Convert aggregated results to response DTOs
     */
    private List<MetricDTO.AggregatedMetricResponse> convertToAggregatedResponses(
            Map<MetricType, MetricValue> results, 
            AggregationType aggregationType, 
            TimeWindow timeWindow) {
        
        return results.entrySet().stream()
            .map(entry -> {
                MetricDTO.AggregatedMetricResponse response = new MetricDTO.AggregatedMetricResponse(
                    entry.getKey().toString(),
                    entry.getValue().getValue(),
                    entry.getValue().getUnit().toString(),
                    entry.getValue().format(),
                    aggregationType.toString(),
                    1L // placeholder for data points count
                );
                return response;
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Convert metric to time series response
     */
    private MetricDTO.TimeSeriesResponse convertToTimeSeriesResponse(Metric metric) {
        return new MetricDTO.TimeSeriesResponse(
            metric.getTimestamp(),
            metric.getValue().getValue(),
            metric.getDimensions()
        );
    }
}