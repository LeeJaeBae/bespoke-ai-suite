package com.bespoke.analytics.infrastructure.repositories;

import com.bespoke.analytics.domain.entities.Metric;
import com.bespoke.analytics.domain.valueobjects.MetricType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JpaMetricRepository extends JpaRepository<Metric, UUID> {

    List<Metric> findByType(MetricType metricType);

    List<Metric> findByTimestampBetween(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT m FROM Metric m WHERE m.type = :metricType AND m.timestamp BETWEEN :startTime AND :endTime ORDER BY m.timestamp ASC")
    List<Metric> findByMetricTypeAndTimestampBetween(
        @Param("metricType") MetricType metricType,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    List<Metric> findByEntityIdAndType(String entityId, MetricType metricType);
    
    List<Metric> findByEntityTypeAndTimestampBetween(String entityType, LocalDateTime startTime, LocalDateTime endTime);
}