package com.bespoke.analytics.infrastructure.repositories;

import com.bespoke.analytics.domain.entities.AnalyticsReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JpaAnalyticsReportRepository extends JpaRepository<AnalyticsReport, UUID> {
    
    @Query("SELECT r FROM AnalyticsReport r WHERE r.updatedAt BETWEEN :startDate AND :endDate AND r.status = 'COMPLETED'")
    List<AnalyticsReport> findByGeneratedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    List<AnalyticsReport> findByReportType(AnalyticsReport.ReportType reportType);

    List<AnalyticsReport> findByTitleContainingIgnoreCase(String title);
    
    List<AnalyticsReport> findByRequestedBy(String userId);
    
    List<AnalyticsReport> findByStatus(AnalyticsReport.ReportStatus status);
}