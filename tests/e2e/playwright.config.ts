import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../../.env.local' });

/**
 * Playwright Configuration for Bespoke AI Suite E2E Tests
 * 
 * This configuration follows Clean Architecture principles:
 * - Tests are organized by business domains
 * - Environment-specific configurations
 * - Comprehensive reporting and debugging
 * - CI/CD ready setup
 */
export default defineConfig({
  // Test directory structure
  testDir: './tests',
  
  // Timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  
  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration for comprehensive test reporting
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'test-results/allure-results' }],
  ],
  
  // Global test settings
  use: {
    // Base URL for the frontend application
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3005',
    
    // Browser settings
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // API settings for direct API testing
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    
    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
  },
  
  // Test projects for different environments and browsers
  projects: [
    // Setup project for authentication and data preparation
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    
    // Smoke tests - critical path verification
    {
      name: 'smoke-chrome',
      dependencies: ['setup'],
      grep: /@smoke/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // Chrome desktop tests
    {
      name: 'chrome',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // Firefox desktop tests
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // Safari desktop tests (Mac only)
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // Mobile Chrome tests
    {
      name: 'mobile-chrome',
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 7'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // Mobile Safari tests
    {
      name: 'mobile-safari',
      dependencies: ['setup'],
      use: {
        ...devices['iPhone 13'],
        storageState: 'test-results/.auth/user.json',
      },
    },
    
    // API testing project
    {
      name: 'api',
      grep: /@api/,
      use: {
        baseURL: process.env.CONTENT_SERVICE_URL || 'http://localhost:8081',
      },
    },
    
    // Performance testing project
    {
      name: 'performance',
      grep: /@performance/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/user.json',
      },
    },
  ],
  
  // Development server configuration
  webServer: [
    {
      command: 'cd ../../frontend && npm run dev',
      url: 'http://localhost:3005',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
      },
    },
    {
      command: 'cd ../../services/content && npm run dev',
      url: 'http://localhost:8081/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
      },
    },
  ],
  
  // Output directories
  outputDir: 'test-results/artifacts',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/config/global-setup.ts'),
  globalTeardown: require.resolve('./tests/config/global-teardown.ts'),
});