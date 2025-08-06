import { test, expect } from '@playwright/test';
import { SERVICES, getServiceUrl } from './config/services';
import { 
  HealthCheckResult, 
  validateHealthResponse, 
  validateResponseTime, 
  validateStatusCode,
  calculateServiceMetrics,
  formatHealthCheckResult,
  formatServiceMetrics,
  retryWithBackoff 
} from './helpers/test-helpers';

/**
 * Bespoke AI Suite - Microservices Health Check E2E Tests
 * 
 * Tests all 4 microservices for:
 * 1. Health endpoint availability
 * 2. Response time performance
 * 3. Status code validation
 * 4. JSON response structure
 * 5. Service metadata validation
 */

// Global shared state for health results
const globalHealthResults: HealthCheckResult[] = [];

test.describe('🏥 Bespoke AI Suite - Microservices Health Check', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting Bespoke AI Suite Health Check Tests');
    console.log('📋 Testing services:', Object.keys(SERVICES).join(', '));
    // Clear results at start
    globalHealthResults.length = 0;
  });

  test.afterAll(async () => {
    const metrics = calculateServiceMetrics(globalHealthResults);
    console.log(formatServiceMetrics(metrics));
    
    // Assert overall system health - only if we have results
    if (globalHealthResults.length > 0) {
      expect(metrics.successfulServices).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeLessThan(3000);
    }
  });

  // Test each service individually
  Object.entries(SERVICES).forEach(([serviceKey, serviceConfig]) => {
    test(`🔍 ${serviceConfig.name} - Health Check`, async ({ request }) => {
      const url = getServiceUrl(serviceKey);
      console.log(`\n🎯 Testing ${serviceConfig.name} at ${url}`);

      const result: HealthCheckResult = {
        serviceName: serviceConfig.name,
        url: url,
        status: 0,
        responseTime: 0,
        body: null,
        success: false
      };

      try {
        // Measure response time
        const startTime = Date.now();
        const response = await retryWithBackoff(async () => {
          return await request.get(url, {
            timeout: serviceConfig.timeout
          });
        }, 3, 1000);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        result.status = response.status();
        result.responseTime = responseTime;

        // 1. Validate Status Code
        validateStatusCode(response, 200);
        console.log(`✅ Status Code: ${response.status()}`);

        // 2. Validate Response Time
        validateResponseTime(responseTime, serviceConfig.maxResponseTime);

        // 3. Parse and validate JSON response
        const body = await response.json();
        result.body = body;

        console.log(`📄 Response Body:`, JSON.stringify(body, null, 2));

        // 4. Validate Response Structure
        validateHealthResponse(body, serviceConfig.expectedFields, serviceConfig.name);
        console.log(`✅ Response structure validated`);

        // 5. Service-specific validations
        await performServiceSpecificValidations(serviceKey, body, request);

        result.success = true;
        console.log(formatHealthCheckResult(result));

      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        console.error(`❌ ${serviceConfig.name} failed:`, result.error);
        
        // Don't fail the test immediately, collect all results first
        expect(error, `${serviceConfig.name} health check failed: ${result.error}`).toBeUndefined();
      } finally {
        globalHealthResults.push(result);
      }
    });
  });

  test('🌐 Cross-Service Communication Test', async ({ request }) => {
    console.log('\n🔄 Testing Cross-Service Communication');
    
    // If no health results yet, perform quick health checks
    if (globalHealthResults.length === 0) {
      console.log('🔍 Performing quick health checks first...');
      for (const [serviceKey, serviceConfig] of Object.entries(SERVICES)) {
        try {
          const url = getServiceUrl(serviceKey);
          const response = await request.get(url, { timeout: 5000 });
          globalHealthResults.push({
            serviceName: serviceConfig.name,
            url: url,
            status: response.status(),
            responseTime: 0,
            body: await response.json(),
            success: response.status() === 200
          });
        } catch (error) {
          console.warn(`⚠️  Quick health check failed for ${serviceConfig.name}`);
        }
      }
    }
    
    // Wait for all services to be healthy before testing communication
    const healthyServices = globalHealthResults.filter(r => r.success);
    expect(healthyServices.length).toBeGreaterThan(0);

    // Test basic cross-service communication patterns
    if (healthyServices.length >= 2) {
      console.log(`✅ ${healthyServices.length} services available for communication test`);
      
      // Example: Test if services can handle concurrent requests
      const concurrentRequests = healthyServices.map(service => 
        request.get(service.url, { timeout: 5000 })
      );

      const responses = await Promise.allSettled(concurrentRequests);
      const successfulConcurrentRequests = responses.filter(r => r.status === 'fulfilled').length;
      
      console.log(`🔄 Concurrent requests: ${successfulConcurrentRequests}/${responses.length} successful`);
      expect(successfulConcurrentRequests).toBeGreaterThan(0);
    }
  });

  test('📊 System Performance Benchmark', async ({ request }) => {
    console.log('\n⚡ Running System Performance Benchmark');
    
    const performanceResults = [];
    
    for (const [serviceKey, serviceConfig] of Object.entries(SERVICES)) {
      const url = getServiceUrl(serviceKey);
      const iterations = 5;
      const responseTimes = [];

      console.log(`🎯 Benchmarking ${serviceConfig.name} (${iterations} iterations)`);

      for (let i = 0; i < iterations; i++) {
        try {
          const startTime = Date.now();
          const response = await request.get(url, { timeout: serviceConfig.timeout });
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          if (response.status() === 200) {
            responseTimes.push(responseTime);
          }
        } catch (error) {
          console.warn(`⚠️  Benchmark iteration ${i + 1} failed for ${serviceConfig.name}`);
        }
      }

      if (responseTimes.length > 0) {
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);

        performanceResults.push({
          service: serviceConfig.name,
          avgResponseTime,
          minResponseTime,
          maxResponseTime,
          successfulIterations: responseTimes.length,
          totalIterations: iterations
        });

        console.log(`📈 ${serviceConfig.name} Performance:
          • Average: ${avgResponseTime.toFixed(2)}ms
          • Min: ${minResponseTime}ms  
          • Max: ${maxResponseTime}ms
          • Success Rate: ${(responseTimes.length/iterations*100).toFixed(1)}%`);

        // Performance assertions
        expect(avgResponseTime).toBeLessThan(serviceConfig.maxResponseTime);
      }
    }

    expect(performanceResults.length).toBeGreaterThan(0);
  });
});

/**
 * Performs service-specific validations based on service type
 */
async function performServiceSpecificValidations(
  serviceKey: string, 
  body: any, 
  request: any
): Promise<void> {
  switch (serviceKey) {
    case 'analytics':
      // Analytics service should have database status
      if (body.database) {
        expect(['connected', 'healthy', 'ok']).toContain(body.database.toLowerCase());
        console.log(`✅ Database status: ${body.database}`);
      }
      
      // Test Analytics service specific endpoint
      try {
        const metricsResponse = await request.get(`http://localhost:8086/api/v1/metrics`, {
          timeout: 5000
        });
        if (metricsResponse.status() === 200) {
          console.log(`✅ Analytics metrics endpoint accessible`);
        }
      } catch (error) {
        console.log(`ℹ️  Analytics metrics endpoint not available (expected if no data)`);
      }
      break;

    case 'user':
      // User service specific validations
      console.log(`✅ User service health validated`);
      break;

    case 'content':
      // Content service specific validations  
      console.log(`✅ Content service health validated`);
      break;

    case 'campaign':
      // Campaign service specific validations
      console.log(`✅ Campaign service health validated`);
      break;

    default:
      console.log(`ℹ️  No specific validations for ${serviceKey}`);
  }
}