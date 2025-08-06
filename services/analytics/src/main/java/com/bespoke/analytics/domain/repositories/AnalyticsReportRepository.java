package com.bespoke.analytics.domain.repositories;

import com.bespoke.analytics.domain.entities.AnalyticsReport;
import com.bespoke.analytics.domain.valueobjects.TimeWindow;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Analytics Report Repository Interface
 * 
 * Domain repository interface for analytics report persistence and querying
 * Follows Clean Architecture principles - no infrastructure dependencies
 */
public interface AnalyticsReportRepository {
    
    /**
     * Save an analytics report
     */
    AnalyticsReport save(AnalyticsReport report);
    
    /**
     * Find report by ID
     */
    Optional<AnalyticsReport> findById(UUID id);
    
    /**
     * Find reports by requester
     */
    List<AnalyticsReport> findByRequestedBy(String userId);
    
    /**
     * Find reports by requester with pagination
     */
    Page<AnalyticsReport> findByRequestedBy(String userId, Pageable pageable);
    
    /**
     * Find reports by user with pagination and sorting
     */
    Page<AnalyticsReport> findByUser(String userId, int pageNumber, int pageSize, String sortBy, String sortDirection);
    
    /**
     * Find recent reports by user with limit
     */
    List<AnalyticsReport> findRecentByUser(String userId, int limit);
    
    /**
     * Count reports by user
     */
    long countByUser(String userId);
    
    /**
     * Count reports by user and status
     */
    long countByUserAndStatus(String userId, AnalyticsReport.ReportStatus status);
    
    /**
     * Find reports by type
     */
    List<AnalyticsReport> findByType(AnalyticsReport.ReportType type);
    
    /**
     * Find reports by status
     */
    List<AnalyticsReport> findByStatus(AnalyticsReport.ReportStatus status);
    
    /**
     * Find reports created within time window
     */
    List<AnalyticsReport> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Find reports by type and status
     */
    List<AnalyticsReport> findByTypeAndStatus(AnalyticsReport.ReportType type, 
                                             AnalyticsReport.ReportStatus status);
    
    /**
     * Find reports by requester and status
     */
    List<AnalyticsReport> findByRequestedByAndStatus(String userId, AnalyticsReport.ReportStatus status);
    
    /**
     * Find reports that overlap with given time window
     */
    List<AnalyticsReport> findByTimeWindowOverlapping(TimeWindow timeWindow);
    
    /**
     * Find pending reports (requested or generating)
     */
    List<AnalyticsReport> findPendingReports();
    
    /**
     * Find failed reports that can be retried
     */
    List<AnalyticsReport> findRetryableFailedReports();
    
    /**
     * Find recently completed reports
     */
    List<AnalyticsReport> findRecentlyCompleted(int hours);
    
    /**
     * Count reports by requester
     */
    long countByRequestedBy(String userId);
    
    /**
     * Count reports by status
     */
    long countByStatus(AnalyticsReport.ReportStatus status);
    
    /**
     * Count reports by type
     */
    long countByType(AnalyticsReport.ReportType type);
    
    /**
     * Count reports created today by requester
     */
    long countTodayByRequestedBy(String userId);
    
    /**
     * Delete report by ID
     */
    void deleteById(UUID id);
    
    /**
     * Delete reports older than specified date
     */
    int deleteOlderThan(LocalDateTime date);
    
    /**
     * Delete failed reports older than specified date
     */
    int deleteFailedOlderThan(LocalDateTime date);
    
    /**
     * Update report status
     */
    void updateStatus(UUID reportId, AnalyticsReport.ReportStatus status);
    
    /**
     * Find reports requiring cleanup (old completed/failed reports)
     */
    List<AnalyticsReport> findReportsForCleanup(int daysOld);
    
    /**
     * Get report generation statistics
     */
    ReportStatistics getReportStatistics();
    
    /**
     * Check if user has reached report limit for today
     */
    boolean hasReachedDailyLimit(String userId, int dailyLimit);
    
    /**
     * Find duplicate reports (same type, time window, and requester)
     */
    List<AnalyticsReport> findDuplicateReports(AnalyticsReport.ReportType type, 
                                              TimeWindow timeWindow, String requestedBy);
    
    /**
     * Search reports by user and search term
     */
    List<AnalyticsReport> searchByUserAndTerm(String userId, String searchTerm, int limit);
    
    /**
     * Find oldest reports by user with limit
     */
    List<AnalyticsReport> findOldestByUser(String userId, int limit);
    
    /**
     * Find old completed reports for cleanup
     */
    List<AnalyticsReport> findOldCompletedReports(int daysOld, int limit);
    
    /**
     * Check if repository is healthy and accessible
     */
    boolean isHealthy();
    
    /**
     * Pagination support
     */
    interface Pageable {
        int getPageNumber();
        int getPageSize();
        String getSortBy();
        String getSortDirection();
        
        static Pageable of(int pageNumber, int pageSize) {
            return new SimplePageable(pageNumber, pageSize, "createdAt", "desc");
        }
        
        static Pageable of(int pageNumber, int pageSize, String sortBy, String sortDirection) {
            return new SimplePageable(pageNumber, pageSize, sortBy, sortDirection);
        }
    }
    
    /**
     * Page result
     */
    interface Page<T> {
        List<T> getContent();
        int getTotalPages();
        long getTotalElements();
        int getSize();
        int getNumber();
        int getPageNumber();
        int getPageSize();
        boolean hasNext();
        boolean hasPrevious();
    }
    
    /**
     * Simple pageable implementation
     */
    class SimplePageable implements Pageable {
        private final int pageNumber;
        private final int pageSize;
        private final String sortBy;
        private final String sortDirection;
        
        public SimplePageable(int pageNumber, int pageSize, String sortBy, String sortDirection) {
            this.pageNumber = pageNumber;
            this.pageSize = pageSize;
            this.sortBy = sortBy;
            this.sortDirection = sortDirection;
        }
        
        @Override
        public int getPageNumber() {
            return pageNumber;
        }
        
        @Override
        public int getPageSize() {
            return pageSize;
        }
        
        @Override
        public String getSortBy() {
            return sortBy;
        }
        
        @Override
        public String getSortDirection() {
            return sortDirection;
        }
    }
    
    /**
     * Simple page implementation
     */
    class SimplePage<T> implements Page<T> {
        private final List<T> content;
        private final int totalPages;
        private final long totalElements;
        private final int size;
        private final int number;
        
        public SimplePage(List<T> content, int totalPages, long totalElements, int size, int number) {
            this.content = content;
            this.totalPages = totalPages;
            this.totalElements = totalElements;
            this.size = size;
            this.number = number;
        }
        
        @Override
        public List<T> getContent() {
            return content;
        }
        
        @Override
        public int getTotalPages() {
            return totalPages;
        }
        
        @Override
        public long getTotalElements() {
            return totalElements;
        }
        
        @Override
        public int getSize() {
            return size;
        }
        
        @Override
        public int getNumber() {
            return number;
        }
        
        @Override
        public int getPageNumber() {
            return number;
        }
        
        @Override
        public int getPageSize() {
            return size;
        }
        
        @Override
        public boolean hasNext() {
            return number < totalPages - 1;
        }
        
        @Override
        public boolean hasPrevious() {
            return number > 0;
        }
    }
    
    /**
     * Report statistics
     */
    class ReportStatistics {
        private final long totalReports;
        private final long completedReports;
        private final long failedReports;
        private final long pendingReports;
        private final double averageGenerationTimeSeconds;
        private final Map<AnalyticsReport.ReportType, Long> reportsByType;
        
        public ReportStatistics(long totalReports, long completedReports, long failedReports,
                               long pendingReports, double averageGenerationTimeSeconds,
                               Map<AnalyticsReport.ReportType, Long> reportsByType) {
            this.totalReports = totalReports;
            this.completedReports = completedReports;
            this.failedReports = failedReports;
            this.pendingReports = pendingReports;
            this.averageGenerationTimeSeconds = averageGenerationTimeSeconds;
            this.reportsByType = reportsByType;
        }
        
        public long getTotalReports() {
            return totalReports;
        }
        
        public long getCompletedReports() {
            return completedReports;
        }
        
        public long getFailedReports() {
            return failedReports;
        }
        
        public long getPendingReports() {
            return pendingReports;
        }
        
        public double getAverageGenerationTimeSeconds() {
            return averageGenerationTimeSeconds;
        }
        
        public Map<AnalyticsReport.ReportType, Long> getReportsByType() {
            return reportsByType;
        }
        
        public double getSuccessRate() {
            if (totalReports == 0) return 0.0;
            return (double) completedReports / totalReports * 100;
        }
        
        public double getFailureRate() {
            if (totalReports == 0) return 0.0;
            return (double) failedReports / totalReports * 100;
        }
    }
}