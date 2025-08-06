package com.bespoke.analytics.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Health Data Transfer Object
 * 
 * Clean Architecture - Application Layer
 * Represents health check response
 */
@Data
@Builder
public class HealthDTO {
    
    private String service;
    private String status;
    private String version;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
}