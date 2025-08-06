import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Bespoke AI Suite E2E Tests
 * Cleans up test environment and generates final reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Bespoke AI Suite E2E Tests Teardown');
  
  // Optional: Add cleanup tasks here
  // For example, cleaning up test data or stopping test services
  
  console.log('📊 Test results available in:');
  console.log('  - HTML Report: ./playwright-report/index.html');
  console.log('  - JSON Results: ./test-results/results.json');
  console.log('  - JUnit XML: ./test-results/results.xml');
  
  console.log('✅ Global teardown completed successfully');
}

export default globalTeardown;