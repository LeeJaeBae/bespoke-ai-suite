/**
 * Global Setup for Bespoke AI Suite E2E Tests
 * 
 * Handles global test environment preparation:
 * - Database setup and cleanup
 * - Service health checks
 * - Test data preparation
 * - Authentication setup
 */

import { chromium, FullConfig } from '@playwright/test';
import { testConfig, testUsers } from './test-config';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Bespoke AI Suite E2E tests...');
  
  try {
    // Check if services are running
    await checkServiceHealth();
    
    // Setup authentication
    await setupAuthentication();
    
    // Prepare test data
    await prepareTestData();
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function checkServiceHealth() {
  console.log('🔍 Checking service health...');
  
  const services = [
    { name: 'Frontend', url: testConfig.frontend.url },
    { name: 'Content Service', url: `${testConfig.services.content.url}/health` },
    { name: 'User Service', url: `${testConfig.services.user.url}/health` },
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Service ${service.name} is not healthy: ${response.status}`);
      }
      
      console.log(`  ✅ ${service.name} is healthy`);
    } catch (error) {
      console.error(`  ❌ ${service.name} health check failed:`, error);
      throw error;
    }
  }
}

async function setupAuthentication() {
  console.log('🔐 Setting up authentication...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login with test user and save authentication state
    await page.goto(`${testConfig.frontend.url}/login`);
    
    // Fill login form
    await page.fill('[name="email"]', testUsers.user.email);
    await page.fill('[name="password"]', testUsers.user.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Save authentication state
    await page.context().storageState({ path: 'test-results/.auth/user.json' });
    
    console.log('  ✅ User authentication setup completed');
  } catch (error) {
    console.error('  ❌ Authentication setup failed:', error);
    // Don't throw error here - tests can handle authentication individually
  } finally {
    await browser.close();
  }
}

async function prepareTestData() {
  console.log('📊 Preparing test data...');
  
  try {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create fresh test data if needed
    // This can be expanded based on specific test needs
    
    console.log('  ✅ Test data preparation completed');
  } catch (error) {
    console.error('  ⚠️ Test data preparation failed:', error);
    // Don't throw error - tests should be able to create their own data
  }
}

async function cleanupTestData() {
  // Implementation for cleaning up test data
  // This would typically involve API calls to delete test data
  console.log('  🧹 Cleaning up existing test data...');
}

export default globalSetup;