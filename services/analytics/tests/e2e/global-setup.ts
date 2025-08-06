import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Bespoke AI Suite E2E Tests
 * Prepares test environment and validates service availability
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Bespoke AI Suite E2E Tests Setup');
  console.log('📋 Test Configuration:');
  console.log(`  - Base URL: ${config.use?.baseURL || 'http://localhost'}`);
  console.log(`  - Timeout: ${config.timeout}ms`);
  console.log(`  - Workers: ${config.workers || 'default'}`);
  
  // Pre-test environment validation
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🔍 Pre-flight checks starting...');
  
  // Optional: Add pre-test validations here
  // For example, checking if Docker Compose is running
  
  await page.close();
  await context.close();
  await browser.close();
  
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;