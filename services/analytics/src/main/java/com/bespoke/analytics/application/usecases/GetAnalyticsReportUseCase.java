package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.AnalyticsReportDTO;
import com.bespoke.analytics.domain.entities.AnalyticsReport;
import com.bespoke.analytics.domain.repositories.AnalyticsReportRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Get Analytics Report Use Case
 * 
 * Application service for retrieving analytics reports
 * Provides various query methods with proper access control
 */
public class GetAnalyticsReportUseCase {
    
    private final AnalyticsReportRepository reportRepository;
    
    public GetAnalyticsReportUseCase(AnalyticsReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }
    
    /**
     * Get report by ID with full details
     */
    public AnalyticsReportDTO.ReportResponse getById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("Report ID cannot be null");
        }
        
        AnalyticsReport report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Analytics report not found with ID: " + id));
        
        return convertToFullResponse(report);
    }
    
    /**
     * Get reports by user with pagination
     */
    public AnalyticsReportRepository.Page<AnalyticsReportDTO.ReportSummaryResponse> getByUser(
            String userId, int page, int size, String sortBy, String sortDirection) {
        
        // Validate parameters
        validatePaginationParams(userId, page, size, sortBy, sortDirection);
        
        // Query reports with pagination
        AnalyticsReportRepository.Page<AnalyticsReport> reportPage = reportRepository.findByUser(
            userId, page, size, sortBy, sortDirection
        );
        
        // Convert to summary responses
        List<AnalyticsReportDTO.ReportSummaryResponse> summaryResponses = reportPage.getContent()
            .stream()
            .map(this::convertToSummaryResponse)
            .collect(Collectors.toList());
        
        return new AnalyticsReportRepository.SimplePage<>(
            summaryResponses,
            reportPage.getTotalPages(),
            reportPage.getTotalElements(),
            reportPage.getPageSize(),
            reportPage.getPageNumber()
        );
    }
    
    /**
     * Get reports by status (admin function)
     */
    public List<AnalyticsReportDTO.ReportSummaryResponse> getByStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be null or empty");
        }
        
        // Validate status
        AnalyticsReport.ReportStatus reportStatus;
        try {
            reportStatus = AnalyticsReport.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid report status: " + status);
        }
        
        // Query reports by status
        List<AnalyticsReport> reports = reportRepository.findByStatus(reportStatus);
        
        // Convert to summary responses
        return reports.stream()
            .map(this::convertToSummaryResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get recent reports for user
     */
    public List<AnalyticsReportDTO.ReportSummaryResponse> getRecentReports(String userId, int limit) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        if (limit <= 0 || limit > 100) {
            throw new IllegalArgumentException("Limit must be between 1 and 100");
        }
        
        // Query recent reports
        List<AnalyticsReport> reports = reportRepository.findRecentByUser(userId, limit);
        
        // Convert to summary responses
        return reports.stream()
            .map(this::convertToSummaryResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get report summary statistics for user
     */
    public AnalyticsReportDTO.ReportStatsResponse getReportStats(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        // Get stats from repository
        long totalReports = reportRepository.countByUser(userId);
        long completedReports = reportRepository.countByUserAndStatus(userId, AnalyticsReport.ReportStatus.COMPLETED);
        long pendingReports = reportRepository.countByUserAndStatus(userId, AnalyticsReport.ReportStatus.GENERATING);
        long failedReports = reportRepository.countByUserAndStatus(userId, AnalyticsReport.ReportStatus.FAILED);
        
        return new AnalyticsReportDTO.ReportStatsResponse(
            userId,
            totalReports,
            completedReports,
            pendingReports,
            failedReports,
            totalReports > 0 ? (double) completedReports / totalReports * 100 : 0.0
        );
    }
    
    /**
     * Search reports by title or description
     */
    public List<AnalyticsReportDTO.ReportSummaryResponse> searchReports(
            String userId, String searchTerm, int limit) {
        
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            throw new IllegalArgumentException("Search term cannot be null or empty");
        }
        
        if (limit <= 0 || limit > 100) {
            throw new IllegalArgumentException("Limit must be between 1 and 100");
        }
        
        // Search reports
        List<AnalyticsReport> reports = reportRepository.searchByUserAndTerm(
            userId, searchTerm.trim(), limit
        );
        
        // Convert to summary responses
        return reports.stream()
            .map(this::convertToSummaryResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Validate pagination parameters
     */
    private void validatePaginationParams(String userId, int page, int size, String sortBy, String sortDirection) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }
        
        if (sortBy == null || sortBy.trim().isEmpty()) {
            throw new IllegalArgumentException("Sort field cannot be null or empty");
        }
        
        // Validate allowed sort fields
        List<String> allowedSortFields = List.of("createdAt", "updatedAt", "title", "status");
        if (!allowedSortFields.contains(sortBy)) {
            throw new IllegalArgumentException("Invalid sort field: " + sortBy);
        }
        
        if (sortDirection == null || sortDirection.trim().isEmpty()) {
            throw new IllegalArgumentException("Sort direction cannot be null or empty");
        }
        
        // Validate sort direction
        if (!"asc".equalsIgnoreCase(sortDirection) && !"desc".equalsIgnoreCase(sortDirection)) {
            throw new IllegalArgumentException("Sort direction must be 'asc' or 'desc'");
        }
    }
    
    /**
     * Convert domain entity to full response DTO
     */
    private AnalyticsReportDTO.ReportResponse convertToFullResponse(AnalyticsReport report) {
        return new AnalyticsReportDTO.ReportResponse(
            report.getId(),
            report.getTitle(),
            report.getDescription(),
            report.getUserId(),
            report.getStatus().toString(),
            report.getTimeWindow().getStartTime(),
            report.getTimeWindow().getEndTime(),
            report.getMetrics(),
            report.getInsights(),
            report.getSummary(),
            report.getErrorMessage(),
            report.getCreatedAt(),
            report.getUpdatedAt(),
            report.getGeneratedAt()
        );
    }
    
    /**
     * Convert domain entity to summary response DTO
     */
    private AnalyticsReportDTO.ReportSummaryResponse convertToSummaryResponse(AnalyticsReport report) {
        return new AnalyticsReportDTO.ReportSummaryResponse(
            report.getId(),
            report.getTitle(),
            report.getDescription(),
            report.getStatus().toString(),
            report.getTimeWindow().getStartTime(),
            report.getTimeWindow().getEndTime(),
            report.getMetrics() != null ? report.getMetrics().size() : 0,
            report.getInsights() != null ? report.getInsights().size() : 0,
            report.getCreatedAt(),
            report.getUpdatedAt(),
            report.getGeneratedAt()
        );
    }
}