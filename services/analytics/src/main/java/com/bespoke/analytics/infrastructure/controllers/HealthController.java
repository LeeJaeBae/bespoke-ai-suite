package com.bespoke.analytics.infrastructure.controllers;

import com.bespoke.analytics.application.dto.HealthDTO;
import com.bespoke.analytics.application.usecases.GetHealthUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health Controller
 * 
 * Clean Architecture - Infrastructure Layer
 * HTTP adapter for health check functionality
 */
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final GetHealthUseCase getHealthUseCase;

    /**
     * Get service health status
     * 
     * @return ResponseEntity containing HealthDTO
     */
    @GetMapping
    public ResponseEntity<HealthDTO> getHealth() {
        log.debug("Health check requested");
        
        HealthDTO health = getHealthUseCase.execute();
        
        log.debug("Health check completed: {}", health.getStatus());
        return ResponseEntity.ok(health);
    }
}