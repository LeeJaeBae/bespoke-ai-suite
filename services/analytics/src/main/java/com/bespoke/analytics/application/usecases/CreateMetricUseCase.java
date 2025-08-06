package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.MetricDTO;
import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.repositories.MetricRepository;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.MetricValue;

import java.time.LocalDateTime;

/**
 * Create Metric Use Case
 * 
 * Application service for creating individual metrics
 * Handles validation, domain entity creation, and persistence
 */
public class CreateMetricUseCase {
    
    private final MetricRepository metricRepository;
    
    public CreateMetricUseCase(MetricRepository metricRepository) {
        this.metricRepository = metricRepository;
    }
    
    /**
     * Execute the use case to create a metric
     */
    public MetricDTO.MetricResponse execute(MetricDTO.CreateMetricRequest request) {
        // Validate request
        validateRequest(request);
        
        // Convert to domain value objects
        MetricType metricType = MetricType.fromString(request.getType());
        MetricValue metricValue = new MetricValue(request.getValue());
        
        // Create domain entity
        Metric metric = Metric.create(
            metricType, 
            metricValue, 
            request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now(),
            request.getEntityId(), 
            request.getEntityType()
        );
        
        // Add dimensions if provided
        if (request.getDimensions() != null && !request.getDimensions().isEmpty()) {
            request.getDimensions().forEach(metric::addDimension);
        }
        
        // Add metadata if provided
        if (request.getMetadata() != null && !request.getMetadata().isEmpty()) {
            request.getMetadata().forEach(metric::addMetadata);
        }
        
        // Persist entity
        Metric savedMetric = metricRepository.save(metric);
        
        // Convert to response DTO
        return convertToResponse(savedMetric);
    }
    
    /**
     * Validate the create metric request
     */
    private void validateRequest(MetricDTO.CreateMetricRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        
        if (request.getType() == null || request.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Metric type is required");
        }
        
        if (request.getValue() == null) {
            throw new IllegalArgumentException("Metric value is required");
        }
        
        if (request.getEntityId() == null || request.getEntityId().trim().isEmpty()) {
            throw new IllegalArgumentException("Entity ID is required");
        }
        
        if (request.getEntityType() == null || request.getEntityType().trim().isEmpty()) {
            throw new IllegalArgumentException("Entity type is required");
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