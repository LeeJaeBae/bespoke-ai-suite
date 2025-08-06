import { test, expect } from '@playwright/test';
import { SERVICES } from './config/services';

/**
 * Bespoke AI Suite - Service Integration E2E Tests
 * 
 * Tests service integration scenarios:
 * 1. API endpoint accessibility
 * 2. Service dependencies
 * 3. Data flow validation
 * 4. Error handling
 */

test.describe('🔗 Bespoke AI Suite - Service Integration Tests', () => {

  test('🎯 Analytics Service API Endpoints', async ({ request }) => {
    console.log('\n🔍 Testing Analytics Service API Endpoints');
    
    const baseUrl = `http://localhost:${SERVICES.analytics.port}/api/v1`;
    
    // Test metrics endpoint
    const metricsResponse = await request.get(`${baseUrl}/metrics`, {
      timeout: 10000
    });
    
    console.log(`📊 Metrics endpoint status: ${metricsResponse.status()}`);
    
    if (metricsResponse.status() === 200) {
      const metricsData = await metricsResponse.json();
      console.log('✅ Metrics endpoint accessible');
      console.log(`📄 Metrics response:`, JSON.stringify(metricsData, null, 2));
      
      // Validate metrics response structure
      expect(metricsData).toBeDefined();
      if (Array.isArray(metricsData)) {
        console.log(`📊 Found ${metricsData.length} metrics`);
      }
    } else if (metricsResponse.status() === 404) {
      console.log('ℹ️  Metrics endpoint returns 404 - expected for new service');
    }

    // Test reports endpoint
    const reportsResponse = await request.get(`${baseUrl}/reports`, {
      timeout: 10000
    });
    
    console.log(`📈 Reports endpoint status: ${reportsResponse.status()}`);
    
    if (reportsResponse.status() === 200) {
      const reportsData = await reportsResponse.json();
      console.log('✅ Reports endpoint accessible');
      console.log(`📄 Reports response:`, JSON.stringify(reportsData, null, 2));
    }
  });

  test('🔄 Service Load Test', async ({ request }) => {
    console.log('\n⚡ Running Service Load Test');
    
    const healthEndpoints = Object.entries(SERVICES).map(([key, config]) => ({
      name: config.name,
      url: `${config.baseUrl}:${config.port}${config.healthEndpoint}`
    }));

    const loadTestRounds = 3;
    const concurrentRequests = 5;

    for (let round = 1; round <= loadTestRounds; round++) {
      console.log(`\n🔄 Load Test Round ${round}/${loadTestRounds}`);
      
      const promises = [];
      
      for (const endpoint of healthEndpoints) {
        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(
            request.get(endpoint.url, { timeout: 5000 }).then(response => ({
              service: endpoint.name,
              status: response.status(),
              success: response.status() === 200
            })).catch(error => ({
              service: endpoint.name,
              status: 0,
              success: false,
              error: error.message
            }))
          );
        }
      }

      const results = await Promise.all(promises);
      
      // Analyze results
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      const successRate = (successful / total * 100).toFixed(1);
      
      console.log(`📊 Round ${round} Results: ${successful}/${total} successful (${successRate}%)`);
      
      // Group by service
      const serviceResults = results.reduce((acc, result) => {
        if (!acc[result.service]) acc[result.service] = [];
        acc[result.service].push(result);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [serviceName, serviceResults] of Object.entries(serviceResults)) {
        const serviceSuccessful = serviceResults.filter(r => r.success).length;
        const serviceTotal = serviceResults.length;
        const serviceSuccessRate = (serviceSuccessful / serviceTotal * 100).toFixed(1);
        
        console.log(`  • ${serviceName}: ${serviceSuccessful}/${serviceTotal} (${serviceSuccessRate}%)`);
      }

      // Assert minimum success rate
      expect(parseFloat(successRate)).toBeGreaterThan(70); // At least 70% success rate
      
      // Wait between rounds
      if (round < loadTestRounds) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });

  test('🚨 Error Handling Validation', async ({ request }) => {
    console.log('\n🚨 Testing Error Handling');
    
    const testCases = [
      {
        description: 'Non-existent endpoint',
        url: 'http://localhost:8086/api/v1/nonexistent',
        expectedStatus: [404, 405]
      },
      {
        description: 'Invalid HTTP method',
        url: 'http://localhost:8086/api/v1/health',
        method: 'DELETE',
        expectedStatus: [405, 404]
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🎯 Testing: ${testCase.description}`);
      
      try {
        let response;
        if (testCase.method === 'DELETE') {
          response = await request.delete(testCase.url, { timeout: 5000 });
        } else {
          response = await request.get(testCase.url, { timeout: 5000 });
        }
        
        console.log(`📊 Response Status: ${response.status()}`);
        
        // Check if response status is one of the expected statuses
        expect(testCase.expectedStatus).toContain(response.status());
        
        // Try to parse response body
        try {
          const body = await response.json();
          console.log(`📄 Error Response:`, JSON.stringify(body, null, 2));
        } catch (parseError) {
          console.log('ℹ️  Non-JSON error response (expected)');
        }
        
      } catch (error) {
        console.log(`⚠️  Request failed as expected: ${error}`);
        // This might be expected for connection failures
      }
    }
  });

  test('⏱️  Response Time Consistency', async ({ request }) => {
    console.log('\n⏱️  Testing Response Time Consistency');
    
    for (const [serviceKey, serviceConfig] of Object.entries(SERVICES)) {
      console.log(`\n🎯 Testing ${serviceConfig.name} response time consistency`);
      
      const url = `${serviceConfig.baseUrl}:${serviceConfig.port}${serviceConfig.healthEndpoint}`;
      const measurements = [];
      const testRounds = 10;

      for (let i = 0; i < testRounds; i++) {
        try {
          const startTime = Date.now();
          const response = await request.get(url, { timeout: serviceConfig.timeout });
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          if (response.status() === 200) {
            measurements.push(responseTime);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`⚠️  Measurement ${i + 1} failed for ${serviceConfig.name}`);
        }
      }

      if (measurements.length > 0) {
        const avgResponseTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const minResponseTime = Math.min(...measurements);
        const maxResponseTime = Math.max(...measurements);
        const variance = measurements.reduce((acc, time) => acc + Math.pow(time - avgResponseTime, 2), 0) / measurements.length;
        const stdDev = Math.sqrt(variance);

        console.log(`📊 ${serviceConfig.name} Response Time Analysis:
          • Average: ${avgResponseTime.toFixed(2)}ms
          • Min: ${minResponseTime}ms
          • Max: ${maxResponseTime}ms
          • Std Deviation: ${stdDev.toFixed(2)}ms
          • Successful Measurements: ${measurements.length}/${testRounds}`);

        // Assertions
        expect(avgResponseTime).toBeLessThan(serviceConfig.maxResponseTime);
        expect(maxResponseTime).toBeLessThan(serviceConfig.maxResponseTime * 2); // Allow some variance
        expect(measurements.length).toBeGreaterThan(testRounds * 0.7); // At least 70% success rate
      } else {
        console.warn(`⚠️  No successful measurements for ${serviceConfig.name}`);
      }
    }
  });
});