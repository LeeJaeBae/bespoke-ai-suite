package com.bespoke.analytics.application.usecases;

import com.bespoke.analytics.application.dto.HealthDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Get Health Use Case
 * 
 * Clean Architecture - Application Layer
 * Business logic for health check functionality
 */
@Service
public class GetHealthUseCase {

    /**
     * Execute health check
     * 
     * @return HealthDTO containing service health status
     */
    public HealthDTO execute() {
        // In a real implementation, you might check:
        // - Database connectivity
        // - External service availability  
        // - Cache health
        // - Memory usage
        // - Disk space
        
        return HealthDTO.builder()
                .service("analytics-service")
                .status("healthy")
                .version("1.0.0")
                .timestamp(LocalDateTime.now())
                .build();
    }
}