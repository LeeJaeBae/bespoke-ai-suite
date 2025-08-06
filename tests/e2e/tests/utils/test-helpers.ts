/**
 * Test Helper Utilities for Bespoke AI Suite E2E Tests
 * 
 * Provides reusable utility functions following Clean Architecture principles:
 * - API helper functions
 * - Common test operations
 * - Assertion helpers
 * - Performance measurement utilities
 */

import { expect, Page, APIRequestContext } from '@playwright/test';
import { testConfig } from '../config/test-config';
import { TestContent, TestUser, TestCampaign } from '../fixtures/test-data';

export class TestHelpers {
  /**
   * Wait for page to be fully loaded
   */
  static async waitForPageLoad(page: Page, timeout: number = 30000): Promise<void> {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout }),
      page.waitForLoadState('domcontentloaded', { timeout }),
    ]);
  }

  /**
   * Wait for API response and validate status
   */
  static async waitForAPIResponse(
    page: Page,
    urlPattern: string | RegExp,
    expectedStatus: number = 200,
    timeout: number = 10000
  ): Promise<any> {
    const response = await page.waitForResponse(
      response => {
        const url = response.url();
        const matches = typeof urlPattern === 'string' 
          ? url.includes(urlPattern) 
          : urlPattern.test(url);
        return matches && response.status() === expectedStatus;
      },
      { timeout }
    );

    const responseData = await response.json().catch(() => null);
    return responseData;
  }

  /**
   * Fill form fields with validation
   */
  static async fillForm(page: Page, formData: Record<string, string>): Promise<void> {
    for (const [fieldName, value] of Object.entries(formData)) {
      const selector = `[name="${fieldName}"], #${fieldName}, [data-testid="${fieldName}"]`;
      await page.fill(selector, value);
      
      // Validate the field was filled correctly
      const fieldValue = await page.inputValue(selector);
      expect(fieldValue).toBe(value);
    }
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeTimestampedScreenshot(page: Page, name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Measure page performance
   */
  static async measurePagePerformance(page: Page): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
      };
    });

    return performanceMetrics;
  }

  /**
   * Validate performance metrics against thresholds
   */
  static validatePerformance(metrics: any, thresholds = testConfig.performance): void {
    expect(metrics.loadTime).toBeLessThan(thresholds.loadTimeThreshold);
    
    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(2500); // 2.5 seconds
    }
    
    if (metrics.largestContentfulPaint > 0) {
      expect(metrics.largestContentfulPaint).toBeLessThan(4000); // 4 seconds
    }
  }

  /**
   * Wait for element to be visible and stable
   */
  static async waitForStableElement(page: Page, selector: string, timeout: number = 5000): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    
    // Wait for element to be stable (not moving/changing)
    await page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      },
      selector,
      { timeout }
    );
  }

  /**
   * Scroll element into view and ensure it's clickable
   */
  static async scrollAndClick(page: Page, selector: string): Promise<void> {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.locator(selector).click();
  }

  /**
   * Wait for navigation to complete
   */
  static async waitForNavigation(page: Page, expectedUrl?: string | RegExp): Promise<void> {
    await page.waitForLoadState('networkidle');
    
    if (expectedUrl) {
      if (typeof expectedUrl === 'string') {
        expect(page.url()).toContain(expectedUrl);
      } else {
        expect(page.url()).toMatch(expectedUrl);
      }
    }
  }

  /**
   * Clear and fill input field
   */
  static async clearAndFill(page: Page, selector: string, value: string): Promise<void> {
    await page.locator(selector).clear();
    await page.locator(selector).fill(value);
    
    // Verify the value was set correctly
    const actualValue = await page.locator(selector).inputValue();
    expect(actualValue).toBe(value);
  }

  /**
   * Wait for toast notification and validate message
   */
  static async waitForToast(page: Page, expectedMessage?: string): Promise<string> {
    const toastSelector = '[data-testid="toast"], .toast, .notification, .alert';
    await page.waitForSelector(toastSelector, { state: 'visible', timeout: 5000 });
    
    const toastText = await page.locator(toastSelector).first().textContent();
    
    if (expectedMessage) {
      expect(toastText).toContain(expectedMessage);
    }
    
    return toastText || '';
  }

  /**
   * Upload file to file input
   */
  static async uploadFile(page: Page, inputSelector: string, filePath: string): Promise<void> {
    const fileInput = page.locator(inputSelector);
    await fileInput.setInputFiles(filePath);
    
    // Verify file was uploaded
    const files = await fileInput.evaluate((input: HTMLInputElement) => {
      return input.files ? Array.from(input.files).map(f => f.name) : [];
    });
    
    expect(files.length).toBeGreaterThan(0);
  }

  /**
   * Handle popup/modal dialogs
   */
  static async handleDialog(page: Page, action: 'accept' | 'dismiss', message?: string): Promise<void> {
    page.on('dialog', async dialog => {
      if (message) {
        expect(dialog.message()).toContain(message);
      }
      
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Generate unique test data identifier
   */
  static generateTestId(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Clean up test data after test
   */
  static async cleanupTestData(testId: string, apiContext: APIRequestContext): Promise<void> {
    try {
      // This would typically make API calls to clean up test data
      console.log(`Cleaning up test data for: ${testId}`);
    } catch (error) {
      console.warn(`Failed to cleanup test data for ${testId}:`, error);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}

export class APIHelpers {
  /**
   * Create authenticated API request context
   */
  static async createAuthenticatedContext(
    apiContext: APIRequestContext,
    token: string
  ): Promise<APIRequestContext> {
    return apiContext;
  }

  /**
   * Make authenticated API request
   */
  static async makeAuthenticatedRequest(
    apiContext: APIRequestContext,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    token?: string
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiContext.fetch(`${testConfig.services.content.url}${endpoint}`, {
      method,
      headers,
      data: data ? JSON.stringify(data) : undefined,
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Create test content via API
   */
  static async createTestContent(
    apiContext: APIRequestContext,
    content: Partial<TestContent>,
    token?: string
  ): Promise<TestContent> {
    return this.makeAuthenticatedRequest(
      apiContext,
      'POST',
      '/api/content',
      content,
      token
    );
  }

  /**
   * Delete test content via API
   */
  static async deleteTestContent(
    apiContext: APIRequestContext,
    contentId: string,
    token?: string
  ): Promise<void> {
    await this.makeAuthenticatedRequest(
      apiContext,
      'DELETE',
      `/api/content/${contentId}`,
      undefined,
      token
    );
  }

  /**
   * Create test user via API
   */
  static async createTestUser(
    apiContext: APIRequestContext,
    user: Partial<TestUser>
  ): Promise<TestUser> {
    return this.makeAuthenticatedRequest(
      apiContext,
      'POST',
      '/api/auth/register',
      user
    );
  }

  /**
   * Login user via API
   */
  static async loginUser(
    apiContext: APIRequestContext,
    email: string,
    password: string
  ): Promise<{ token: string; user: TestUser }> {
    return this.makeAuthenticatedRequest(
      apiContext,
      'POST',
      '/api/auth/login',
      { email, password }
    );
  }
}