package com.bespoke.analytics.infrastructure.controllers;

import com.bespoke.analytics.application.dto.MetricDTO;
import com.bespoke.analytics.application.usecases.BatchCreateMetricsUseCase;
import com.bespoke.analytics.application.usecases.CreateMetricUseCase;
import com.bespoke.analytics.application.usecases.GetMetricUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Metric Controller
 * 
 * REST API controller for metric operations
 * Provides endpoints for creating, querying, and aggregating metrics
 */
@RestController
@RequestMapping("/api/v1/metrics")
@Tag(name = "Metrics", description = "Metric management API")
@CrossOrigin(origins = {"${app.cors.allowed-origins}"})
public class MetricController {
    
    private final CreateMetricUseCase createMetricUseCase;
    private final BatchCreateMetricsUseCase batchCreateMetricsUseCase;
    private final GetMetricUseCase getMetricUseCase;
    
    public MetricController(CreateMetricUseCase createMetricUseCase,
                           BatchCreateMetricsUseCase batchCreateMetricsUseCase,
                           GetMetricUseCase getMetricUseCase) {
        this.createMetricUseCase = createMetricUseCase;
        this.batchCreateMetricsUseCase = batchCreateMetricsUseCase;
        this.getMetricUseCase = getMetricUseCase;
    }
    
    /**
     * Create a single metric
     */
    @PostMapping
    @Operation(summary = "Create a metric", description = "Create a single metric data point")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Metric created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request data"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('USER') or hasRole('SYSTEM')")
    public ResponseEntity<ApiResponse<MetricDTO.MetricResponse>> createMetric(
            @Valid @RequestBody MetricDTO.CreateMetricRequest request) {
        
        try {
            MetricDTO.MetricResponse response = createMetricUseCase.execute(request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Metric created successfully"));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to create metric"));
        }
    }
    
    /**
     * Create multiple metrics in batch
     */
    @PostMapping("/batch")
    @Operation(summary = "Create metrics in batch", description = "Create multiple metrics in a single operation")
    @PreAuthorize("hasRole('USER') or hasRole('SYSTEM')")
    public ResponseEntity<ApiResponse<List<MetricDTO.MetricResponse>>> createMetricsBatch(
            @Valid @RequestBody MetricDTO.BatchCreateMetricsRequest request) {
        
        try {
            List<MetricDTO.MetricResponse> responses = batchCreateMetricsUseCase.execute(request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(responses, 
                    String.format("%d metrics created successfully", responses.size())));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to create metrics in batch"));
        }
    }
    
    /**
     * Get metric by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get metric by ID", description = "Retrieve a specific metric by its ID")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MetricDTO.MetricResponse>> getMetricById(
            @Parameter(description = "Metric ID") @PathVariable UUID id) {
        
        try {
            MetricDTO.MetricResponse response = getMetricUseCase.getById(id);
            
            return ResponseEntity.ok(ApiResponse.success(response, "Metric retrieved successfully"));
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to retrieve metric"));
        }
    }
    
    /**
     * Query metrics with filters  
     */
    @GetMapping
    @Operation(summary = "Query metrics", description = "Query metrics with various filters")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MetricDTO.MetricResponse>>> queryMetrics(
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime,
            @RequestParam(defaultValue = "100") Integer limit,
            @RequestParam(defaultValue = "0") Integer offset) {
        
        try {
            MetricDTO.MetricQuery query = new MetricDTO.MetricQuery();
            
            if (types != null && !types.trim().isEmpty()) {
                query.setTypes(List.of(types.split(",")));
            }
            
            query.setEntityId(entityId);
            query.setEntityType(entityType);
            query.setStartTime(startTime);
            query.setEndTime(endTime);
            query.setLimit(limit);
            query.setOffset(offset);
            
            List<MetricDTO.MetricResponse> responses = getMetricUseCase.query(query);
            
            return ResponseEntity.ok(ApiResponse.success(responses, 
                String.format("%d metrics retrieved", responses.size())));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to query metrics"));
        }
    }
    
    /**
     * Standard API Response wrapper
     */
    public static class ApiResponse<T> {
        private String status;
        private T data;
        private String message;
        private String errorCode;
        private LocalDateTime timestamp;
        
        private ApiResponse(String status, T data, String message, String errorCode) {
            this.status = status;
            this.data = data;
            this.message = message;
            this.errorCode = errorCode;
            this.timestamp = LocalDateTime.now();
        }
        
        public static <T> ApiResponse<T> success(T data, String message) {
            return new ApiResponse<>("success", data, message, null);
        }
        
        public static <T> ApiResponse<T> error(String errorCode, String message) {
            return new ApiResponse<>("error", null, message, errorCode);
        }
        
        // Getters
        public String getStatus() { return status; }
        public T getData() { return data; }
        public String getMessage() { return message; }
        public String getErrorCode() { return errorCode; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}