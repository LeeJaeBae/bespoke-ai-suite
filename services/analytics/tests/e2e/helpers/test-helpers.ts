import { expect, APIResponse } from '@playwright/test';
import { ServiceConfig } from '../config/services';

/**
 * Test Helpers for Bespoke AI Suite E2E Tests
 * Utilities for service testing and validation
 */

export interface HealthCheckResult {
  serviceName: string;
  url: string;
  status: number;
  responseTime: number;
  body: any;
  success: boolean;
  error?: string;
}

export interface ServiceMetrics {
  totalServices: number;
  successfulServices: number;
  failedServices: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}

/**
 * Validates health check response structure
 */
export function validateHealthResponse(body: any, expectedFields: string[], serviceName: string): void {
  // Validate expected fields exist
  for (const field of expectedFields) {
    expect(body).toHaveProperty(field);
  }
  
  // Service-specific validation logic
  let statusField, serviceField, timestampField, versionField;
  
  if (serviceName === 'Content Service') {
    // Content Service has nested structure
    expect(body.data).toBeDefined();
    statusField = body.data.status;
    serviceField = body.data.service;
    timestampField = body.data.timestamp;
  } else {
    // Other services have direct structure
    statusField = body.status;
    serviceField = body.service;
    timestampField = body.timestamp;
    versionField = body.version;
  }
  
  // Common validations
  if (statusField) {
    expect(['healthy', 'ok', 'up', 'ready', 'success']).toContain(statusField.toLowerCase());
  }
  
  if (timestampField) {
    expect(new Date(timestampField)).toBeInstanceOf(Date);
  }
  
  if (serviceField) {
    expect(typeof serviceField).toBe('string');
    expect(serviceField.length).toBeGreaterThan(0);
  }
  
  if (versionField) {
    expect(typeof versionField).toBe('string');
  }
}

/**
 * Measures response time and validates it's within acceptable limits
 */
export function validateResponseTime(responseTime: number, maxResponseTime: number): void {
  expect(responseTime).toBeLessThan(maxResponseTime);
  console.log(`⏱️  Response time: ${responseTime}ms (limit: ${maxResponseTime}ms)`);
}

/**
 * Validates HTTP status code
 */
export function validateStatusCode(response: APIResponse, expectedStatus: number = 200): void {
  expect(response.status()).toBe(expectedStatus);
}

/**
 * Calculates service metrics from health check results
 */
export function calculateServiceMetrics(results: HealthCheckResult[]): ServiceMetrics {
  const successfulResults = results.filter(r => r.success);
  const responseTimes = results.map(r => r.responseTime);
  
  return {
    totalServices: results.length,
    successfulServices: successfulResults.length,
    failedServices: results.length - successfulResults.length,
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    maxResponseTime: Math.max(...responseTimes),
    minResponseTime: Math.min(...responseTimes)
  };
}

/**
 * Formats health check result for console output
 */
export function formatHealthCheckResult(result: HealthCheckResult): string {
  const status = result.success ? '✅' : '❌';
  const responseTimeColor = result.responseTime > 1000 ? '🐌' : result.responseTime > 500 ? '⚡' : '🚀';
  
  return `${status} ${result.serviceName}: ${result.status} (${result.responseTime}ms) ${responseTimeColor}`;
}

/**
 * Formats service metrics for console output
 */
export function formatServiceMetrics(metrics: ServiceMetrics): string {
  const successRate = ((metrics.successfulServices / metrics.totalServices) * 100).toFixed(1);
  
  return `
📊 System Health Summary:
  • Total Services: ${metrics.totalServices}
  • Success Rate: ${successRate}% (${metrics.successfulServices}/${metrics.totalServices})
  • Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
  • Fastest Service: ${metrics.minResponseTime}ms
  • Slowest Service: ${metrics.maxResponseTime}ms
  `;
}

/**
 * Sleeps for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}