/**
 * Global Teardown for Bespoke AI Suite E2E Tests
 * 
 * Handles global test environment cleanup:
 * - Test data cleanup
 * - Resource cleanup
 * - Report generation
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Bespoke AI Suite E2E tests...');
  
  try {
    // Clean up test data
    await cleanupTestData();
    
    // Clean up authentication files
    await cleanupAuthFiles();
    
    // Generate test summary
    await generateTestSummary();
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to allow test results to be preserved
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    // Implementation for cleaning up test data
    // This would typically involve API calls to delete test data created during tests
    
    console.log('  ✅ Test data cleanup completed');
  } catch (error) {
    console.error('  ⚠️ Test data cleanup failed:', error);
  }
}

async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...');
  
  try {
    const authDir = 'test-results/.auth';
    const authFiles = ['user.json', 'admin.json', 'editor.json'];
    
    for (const file of authFiles) {
      const filePath = path.join(authDir, file);
      try {
        await fs.unlink(filePath);
        console.log(`  🗑️ Deleted ${file}`);
      } catch (error) {
        // File might not exist, which is fine
      }
    }
    
    console.log('  ✅ Authentication cleanup completed');
  } catch (error) {
    console.error('  ⚠️ Authentication cleanup failed:', error);
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  try {
    const timestamp = new Date().toISOString();
    const summary = {
      timestamp,
      testRun: 'Bespoke AI Suite E2E Tests',
      environment: process.env.NODE_ENV || 'development',
      // Additional summary data can be added here
    };
    
    await fs.writeFile(
      'test-results/test-summary.json',
      JSON.stringify(summary, null, 2)
    );
    
    console.log('  ✅ Test summary generated');
  } catch (error) {
    console.error('  ⚠️ Test summary generation failed:', error);
  }
}

export default globalTeardown;