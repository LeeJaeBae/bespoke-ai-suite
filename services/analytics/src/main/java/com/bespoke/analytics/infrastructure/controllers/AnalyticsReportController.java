package com.bespoke.analytics.infrastructure.controllers;

import com.bespoke.analytics.application.dto.AnalyticsReportDTO;
import com.bespoke.analytics.application.usecases.CreateAnalyticsReportUseCase;
import com.bespoke.analytics.application.usecases.DeleteReportUseCase;
import com.bespoke.analytics.application.usecases.GetAnalyticsReportUseCase;
import com.bespoke.analytics.domain.repositories.AnalyticsReportRepository;
import com.bespoke.analytics.infrastructure.controllers.MetricController.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Analytics Report Controller
 * 
 * REST API controller for analytics report operations
 * Provides endpoints for creating, retrieving, and managing analytics reports
 */
@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Analytics Reports", description = "Analytics report management API")
@CrossOrigin(origins = {"${app.cors.allowed-origins}"})
public class AnalyticsReportController {
    
    private final CreateAnalyticsReportUseCase createReportUseCase;
    private final GetAnalyticsReportUseCase getReportUseCase;
    private final DeleteReportUseCase deleteReportUseCase;
    
    public AnalyticsReportController(CreateAnalyticsReportUseCase createReportUseCase,
                                   GetAnalyticsReportUseCase getReportUseCase,
                                   DeleteReportUseCase deleteReportUseCase) {
        this.createReportUseCase = createReportUseCase;
        this.getReportUseCase = getReportUseCase;
        this.deleteReportUseCase = deleteReportUseCase;
    }
    
    /**
     * Create an analytics report
     */
    @PostMapping
    @Operation(summary = "Create analytics report", description = "Create a new analytics report")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Report created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request data"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsReportDTO.ReportResponse>> createReport(
            @Valid @RequestBody AnalyticsReportDTO.CreateReportRequest request) {
        
        try {
            AnalyticsReportDTO.ReportResponse response = createReportUseCase.execute(request);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Analytics report created successfully"));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to create analytics report"));
        }
    }
    
    /**
     * Get report by ID with full details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get report by ID", description = "Retrieve a complete analytics report by its ID")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsReportDTO.ReportResponse>> getReportById(
            @Parameter(description = "Report ID") @PathVariable UUID id) {
        
        try {
            AnalyticsReportDTO.ReportResponse response = getReportUseCase.getById(id);
            
            return ResponseEntity.ok(ApiResponse.success(response, "Report retrieved successfully"));
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            if (e.getMessage().contains("Access denied")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to retrieve report"));
        }
    }
    
    /**
     * Get reports by user with pagination
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get reports by user", description = "Get paginated list of reports for a specific user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AnalyticsReportRepository.Page<AnalyticsReportDTO.ReportSummaryResponse>>> getReportsByUser(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDirection) {
        
        try {
            AnalyticsReportRepository.Page<AnalyticsReportDTO.ReportSummaryResponse> reportPage = 
                getReportUseCase.getByUser(userId, page, size, sortBy, sortDirection);
            
            return ResponseEntity.ok(ApiResponse.success(reportPage, 
                String.format("%d reports retrieved for user %s", reportPage.getTotalElements(), userId)));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to retrieve user reports"));
        }
    }
    
    /**
     * Get reports by status (admin only)
     */
    @GetMapping("/status/{status}")
    @Operation(summary = "Get reports by status", description = "Get reports filtered by status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AnalyticsReportDTO.ReportSummaryResponse>>> getReportsByStatus(
            @Parameter(description = "Report status") @PathVariable String status) {
        
        try {
            List<AnalyticsReportDTO.ReportSummaryResponse> reports = getReportUseCase.getByStatus(status);
            
            return ResponseEntity.ok(ApiResponse.success(reports, 
                String.format("%d reports found with status %s", reports.size(), status)));
                
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to retrieve reports by status"));
        }
    }
    
    /**
     * Delete report by ID
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete report", description = "Delete an analytics report by ID")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @Parameter(description = "Report ID") @PathVariable UUID id) {
        
        try {
            deleteReportUseCase.deleteById(id);
            
            return ResponseEntity.ok(ApiResponse.success(null, "Report deleted successfully"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
                
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            if (e.getMessage().contains("Access denied")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("ACCESS_DENIED", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "Failed to delete report"));
        }
    }
}