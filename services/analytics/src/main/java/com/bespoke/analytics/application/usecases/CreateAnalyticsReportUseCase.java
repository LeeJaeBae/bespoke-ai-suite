package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.AnalyticsReportDTO;
import com.bespoke.analytics.domain.entities.AnalyticsReport;
import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.repositories.AnalyticsReportRepository;
import com.bespoke.analytics.domain.repositories.MetricRepository;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import com.bespoke.analytics.domain.valueobjects.TimeWindow;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Create Analytics Report Use Case
 * 
 * Application service for creating analytics reports
 * Orchestrates report generation with metrics collection and insights
 */
public class CreateAnalyticsReportUseCase {
    
    private final AnalyticsReportRepository reportRepository;
    private final MetricRepository metricRepository;
    
    public CreateAnalyticsReportUseCase(
            AnalyticsReportRepository reportRepository,
            MetricRepository metricRepository) {
        this.reportRepository = reportRepository;
        this.metricRepository = metricRepository;
    }
    
    /**
     * Execute report creation
     */
    public AnalyticsReportDTO.ReportResponse execute(AnalyticsReportDTO.CreateReportRequest request) {
        // Validate request
        validateRequest(request);
        
        // Create report entity
        AnalyticsReport report = AnalyticsReport.create(
            request.getTitle(),
            request.getDescription(),
            TimeWindow.of(request.getStartDate(), request.getEndDate()),
            AnalyticsReport.ReportType.valueOf(request.getReportType().toUpperCase()),
            request.getUserId()
        );
        
        // Save initial report
        AnalyticsReport savedReport = reportRepository.save(report);
        
        // Start asynchronous report generation
        if (Boolean.TRUE.equals(request.getGenerateAsync())) {
            generateReportAsync(savedReport, request);
        } else {
            // Synchronous generation
            generateReportSync(savedReport, request);
            savedReport = reportRepository.save(savedReport);
        }
        
        return convertToResponse(savedReport);
    }
    
    /**
     * Synchronous report generation
     */
    private void generateReportSync(AnalyticsReport report, AnalyticsReportDTO.CreateReportRequest request) {
        try {
            report.startGeneration();
            
            // Collect metrics
            collectMetrics(report, request);
            
            // Generate insights if requested
            if (Boolean.TRUE.equals(request.getIncludeInsights())) {
                generateInsights(report);
            }
            
            report.completeGeneration();
            
        } catch (Exception e) {
            report.failGeneration("Report generation failed: " + e.getMessage());
            throw new RuntimeException("Failed to generate report", e);
        }
    }
    
    /**
     * Asynchronous report generation
     */
    private void generateReportAsync(AnalyticsReport report, AnalyticsReportDTO.CreateReportRequest request) {
        CompletableFuture.runAsync(() -> {
            try {
                report.startGeneration();
                reportRepository.save(report);
                
                // Collect metrics
                collectMetrics(report, request);
                
                // Generate insights if requested
                if (Boolean.TRUE.equals(request.getIncludeInsights())) {
                    generateInsights(report);
                }
                
                report.completeGeneration();
                reportRepository.save(report);
                
            } catch (Exception e) {
                report.failGeneration("Async report generation failed: " + e.getMessage());
                reportRepository.save(report);
            }
        });
    }
    
    /**
     * Collect metrics for the report
     */
    private void collectMetrics(AnalyticsReport report, AnalyticsReportDTO.CreateReportRequest request) {
        // Convert metric types from strings
        List<MetricType> metricTypes = request.getMetricTypes().stream()
            .map(MetricType::fromString)
            .collect(Collectors.toList());
        
        // Query metrics within time window
        List<Metric> metrics = metricRepository.findByFilters(
            metricTypes,
            request.getEntityId(),
            request.getEntityType(),
            report.getTimeWindow(),
            10000,  // Large limit for report generation
            0
        );
        
        // Add metrics to report
        for (Metric metric : metrics) {
            report.addMetric(
                metric.getType().toString(),
                metric.getValue().getValue(),
                metric.getTimestamp(),
                metric.getDimensions()
            );
        }
        
        // Update report summary
        report.updateSummary(
            "totalMetrics", String.valueOf(metrics.size())
        );
        
        // Add metric type breakdown
        metricTypes.forEach(type -> {
            long count = metrics.stream()
                .filter(m -> m.getType().equals(type))
                .count();
            report.updateSummary(
                type.toString() + "_count", String.valueOf(count)
            );
        });
    }
    
    /**
     * Generate insights for the report
     */
    private void generateInsights(AnalyticsReport report) {
        // Calculate basic insights
        List<Metric> metrics = report.getMetrics();
        
        if (!metrics.isEmpty()) {
            // Average values by type
            metrics.stream()
                .collect(Collectors.groupingBy(
                    metric -> metric.getType().toString(),
                    Collectors.averagingDouble(metric -> metric.getValue().getValue().doubleValue())
                ))
                .forEach((type, avg) -> {
                    report.addInsight(
                        "Average " + type,
                        String.format("%.2f", avg)
                    );
                });
            
            // Find peak times
            String peakTime = metrics.stream()
                .max((m1, m2) -> Double.compare(m1.getValue().getValue().doubleValue(), m2.getValue().getValue().doubleValue()))
                .map(m -> m.getTimestamp().toString())
                .orElse("No peak found");
            
            report.addInsight(
                "Peak Time",
                peakTime
            );
            
            // Data quality insights
            long totalDataPoints = metrics.size();
            report.addInsight(
                "Data Coverage",
                totalDataPoints + " data points collected"
            );
        }
    }
    
    /**
     * Validate create report request
     */
    private void validateRequest(AnalyticsReportDTO.CreateReportRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Report title is required");
        }
        
        if (request.getUserId() == null || request.getUserId().trim().isEmpty()) {
            throw new IllegalArgumentException("User ID is required");
        }
        
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        
        if (request.getMetricTypes() == null || request.getMetricTypes().isEmpty()) {
            throw new IllegalArgumentException("At least one metric type is required");
        }
        
        // Validate time window is not too large (max 1 year)
        if (request.getStartDate().isBefore(request.getEndDate().minusYears(1))) {
            throw new IllegalArgumentException("Time window cannot exceed 1 year");
        }
    }
    
    /**
     * Convert domain entity to response DTO
     */
    private AnalyticsReportDTO.ReportResponse convertToResponse(AnalyticsReport report) {
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
}