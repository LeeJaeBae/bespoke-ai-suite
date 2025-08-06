package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.domain.entities.AnalyticsReport;
import com.bespoke.analytics.domain.repositories.AnalyticsReportRepository;

import java.util.UUID;

/**
 * Delete Report Use Case
 * 
 * Application service for deleting analytics reports
 * Handles report deletion with proper validation and access control
 */
public class DeleteReportUseCase {
    
    private final AnalyticsReportRepository reportRepository;
    
    public DeleteReportUseCase(AnalyticsReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }
    
    /**
     * Delete report by ID
     */
    public void deleteById(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("Report ID cannot be null");
        }
        
        // Find report
        AnalyticsReport report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Analytics report not found with ID: " + id));
        
        // Validate deletion is allowed
        validateDeletion(report);
        
        // Perform deletion
        reportRepository.deleteById(id);
    }
    
    /**
     * Delete report by ID with user validation
     */
    public void deleteByIdForUser(UUID id, String userId) {
        if (id == null) {
            throw new IllegalArgumentException("Report ID cannot be null");
        }
        
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        // Find report
        AnalyticsReport report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Analytics report not found with ID: " + id));
        
        // Validate user ownership
        if (!report.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied: User does not own this report");
        }
        
        // Validate deletion is allowed
        validateDeletion(report);
        
        // Perform deletion
        reportRepository.deleteById(id);
    }
    
    /**
     * Delete multiple reports by user
     */
    public void deleteMultipleForUser(String userId, int maxCount) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        if (maxCount <= 0 || maxCount > 100) {
            throw new IllegalArgumentException("Max count must be between 1 and 100");
        }
        
        // Get old reports for the user
        var reports = reportRepository.findOldestByUser(userId, maxCount);
        
        // Delete each report with validation
        for (AnalyticsReport report : reports) {
            validateDeletion(report);
            reportRepository.deleteById(report.getId());
        }
    }
    
    /**
     * Delete old completed reports (cleanup function)
     */
    public int deleteOldCompletedReports(int daysOld, int maxCount) {
        if (daysOld <= 0) {
            throw new IllegalArgumentException("Days old must be positive");
        }
        
        if (maxCount <= 0 || maxCount > 1000) {
            throw new IllegalArgumentException("Max count must be between 1 and 1000");
        }
        
        // Find old completed reports
        var oldReports = reportRepository.findOldCompletedReports(daysOld, maxCount);
        
        int deletedCount = 0;
        for (AnalyticsReport report : oldReports) {
            try {
                // Only delete completed reports to avoid data loss
                if (report.getStatus() == AnalyticsReport.ReportStatus.COMPLETED) {
                    reportRepository.deleteById(report.getId());
                    deletedCount++;
                }
            } catch (Exception e) {
                // Log error but continue with other reports
                System.err.println("Failed to delete report " + report.getId() + ": " + e.getMessage());
            }
        }
        
        return deletedCount;
    }
    
    /**
     * Cancel report generation (for pending reports)
     */
    public void cancelReportGeneration(UUID id, String userId) {
        if (id == null) {
            throw new IllegalArgumentException("Report ID cannot be null");
        }
        
        if (userId == null || userId.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        
        // Find report
        AnalyticsReport report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Analytics report not found with ID: " + id));
        
        // Validate user ownership
        if (!report.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied: User does not own this report");
        }
        
        // Can only cancel pending or processing reports
        if (report.getStatus() != AnalyticsReport.ReportStatus.REQUESTED && report.getStatus() != AnalyticsReport.ReportStatus.GENERATING) {
            throw new IllegalArgumentException("Cannot cancel report with status: " + report.getStatus());
        }
        
        // Cancel the report by marking it as failed
        report.failGeneration("Report generation cancelled by user");
        reportRepository.save(report);
    }
    
    /**
     * Validate if report deletion is allowed
     */
    private void validateDeletion(AnalyticsReport report) {
        if (report == null) {
            throw new IllegalArgumentException("Report cannot be null");
        }
        
        // Don't allow deletion of reports that are currently being processed
        if (report.getStatus() == AnalyticsReport.ReportStatus.GENERATING) {
            throw new IllegalArgumentException("Cannot delete report that is currently being processed");
        }
        
        // Additional business rules can be added here
        // For example: Don't delete reports that are shared with other users
        // Or: Don't delete reports that are referenced by other entities
    }
}