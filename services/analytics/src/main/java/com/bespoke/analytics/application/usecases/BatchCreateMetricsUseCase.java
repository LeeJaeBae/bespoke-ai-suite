package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.MetricDTO;
import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.repositories.MetricRepository;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Batch Create Metrics Use Case
 * 
 * Application service for creating multiple metrics in a single operation
 * Provides batch processing with transactional consistency
 */
public class BatchCreateMetricsUseCase {
    
    private final MetricRepository metricRepository;
    
    public BatchCreateMetricsUseCase(MetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }
    
    /**
     * Execute batch creation of metrics
     */
    public List<MetricDTO.MetricResponse> execute(MetricDTO.BatchCreateMetricsRequest request) {
        // Validate request
        validateRequest(request);
        
        List<Metric> metrics = new ArrayList<>();
        
        // Convert each request to domain entity
        for (MetricDTO.CreateMetricRequest metricRequest : request.getMetrics()) {
            // Validate individual metric request
            validateIndividualRequest(metricRequest);
            
            // Convert to domain value objects
            MetricType metricType = MetricType.fromString(metricRequest.getType());
            MetricValue metricValue = new MetricValue(metricRequest.getValue());
            
            // Create domain entity
            Metric metric = Metric.create(
                metricType, 
                metricValue, 
                metricRequest.getTimestamp() != null ? metricRequest.getTimestamp() : LocalDateTime.now(),
                metricRequest.getEntityId(), 
                metricRequest.getEntityType()
            );
            
            // Add dimensions if provided
            if (metricRequest.getDimensions() != null && !metricRequest.getDimensions().isEmpty()) {
                metricRequest.getDimensions().forEach(metric::addDimension);
            }
            
            // Add metadata if provided
            if (metricRequest.getMetadata() != null && !metricRequest.getMetadata().isEmpty()) {
                metricRequest.getMetadata().forEach(metric::addMetadata);
            }
            
            metrics.add(metric);
        }
        
        // Batch save all metrics
        List<Metric> savedMetrics = metricRepository.saveAll(metrics);
        
        // Convert to response DTOs
        List<MetricDTO.MetricResponse> responses = new ArrayList<>();
        for (Metric savedMetric : savedMetrics) {
            responses.add(convertToResponse(savedMetric));
        }
        
        return responses;
    }
    
    /**
     * Validate the batch create request
     */
    private void validateRequest(MetricDTO.BatchCreateMetricsRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        
        if (request.getMetrics() == null || request.getMetrics().isEmpty()) {
            throw new IllegalArgumentException("Metrics list cannot be null or empty");
        }
        
        if (request.getMetrics().size() > 1000) {
            throw new IllegalArgumentException("Cannot create more than 1000 metrics in a single batch");
        }
    }
    
    /**
     * Validate individual metric request within batch
     */
    private void validateIndividualRequest(MetricDTO.CreateMetricRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Individual metric request cannot be null");
        }
        
        if (request.getType() == null || request.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Metric type is required for all metrics");
        }
        
        if (request.getValue() == null) {
            throw new IllegalArgumentException("Metric value is required for all metrics");
        }
        
        if (request.getEntityId() == null || request.getEntityId().trim().isEmpty()) {
            throw new IllegalArgumentException("Entity ID is required for all metrics");
        }
        
        if (request.getEntityType() == null || request.getEntityType().trim().isEmpty()) {
            throw new IllegalArgumentException("Entity type is required for all metrics");
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
}