package com.bespoke.analytics.infrastructure.config;

import com.bespoke.analytics.application.usecases.*;
import com.bespoke.analytics.domain.repositories.AnalyticsReportRepository;
import com.bespoke.analytics.domain.repositories.MetricRepository;
import com.bespoke.analytics.infrastructure.repositories.JpaAnalyticsReportRepository;
import com.bespoke.analytics.infrastructure.repositories.JpaMetricRepository;
import com.bespoke.analytics.infrastructure.repositories.AnalyticsReportRepositoryImpl;
import com.bespoke.analytics.infrastructure.repositories.MetricRepositoryImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Application Configuration
 * 
 * Spring configuration for application layer components
 * Configures Use Cases and their dependencies following Clean Architecture
 */
@Configuration
public class ApplicationConfig {
    
    /**
     * Analytics Report Repository Implementation
     */
    @Bean
    public AnalyticsReportRepository analyticsReportRepository(JpaAnalyticsReportRepository jpaRepository) {
        return new AnalyticsReportRepositoryImpl(jpaRepository);
    }
    
    /**
     * Metric Repository Implementation
     */
    @Bean
    public MetricRepository metricRepository(JpaMetricRepository jpaRepository) {
        return new MetricRepositoryImpl(jpaRepository);
    }
    
    /**
     * Create Metric Use Case
     */
    @Bean
    public CreateMetricUseCase createMetricUseCase(MetricRepository metricRepository) {
        return new CreateMetricUseCase(metricRepository);
    }
    
    /**
     * Batch Create Metrics Use Case
     */
    @Bean
    public BatchCreateMetricsUseCase batchCreateMetricsUseCase(MetricRepository metricRepository) {
        return new BatchCreateMetricsUseCase(metricRepository);
    }
    
    /**
     * Get Metric Use Case
     */
    @Bean
    public GetMetricUseCase getMetricUseCase(MetricRepository metricRepository) {
        return new GetMetricUseCase(metricRepository);
    }
    
    /**
     * Create Analytics Report Use Case
     */
    @Bean
    public CreateAnalyticsReportUseCase createAnalyticsReportUseCase(
            AnalyticsReportRepository reportRepository,
            MetricRepository metricRepository) {
        return new CreateAnalyticsReportUseCase(reportRepository, metricRepository);
    }
    
    /**
     * Get Analytics Report Use Case
     */
    @Bean
    public GetAnalyticsReportUseCase getAnalyticsReportUseCase(
            AnalyticsReportRepository reportRepository) {
        return new GetAnalyticsReportUseCase(reportRepository);
    }
    
    /**
     * Delete Report Use Case
     */
    @Bean
    public DeleteReportUseCase deleteReportUseCase(AnalyticsReportRepository reportRepository) {
        return new DeleteReportUseCase(reportRepository);
    }
}