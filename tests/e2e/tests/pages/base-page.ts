/**
 * Base Page Object for Bespoke AI Suite E2E Tests
 * 
 * Provides common functionality for all page objects:
 * - Navigation methods
 * - Common element interactions
 * - Base assertions
 * - Error handling
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testConfig } from '../config/test-config';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = testConfig.frontend.url;
  }

  /**
   * Navigate to the page
   */
  async goto(path: string = ''): Promise<void> {
    const url = `${this.baseURL}${path}`;
    await this.page.goto(url);
    await TestHelpers.waitForPageLoad(this.page);
    await this.waitForPageReady();
  }

  /**
   * Wait for page-specific elements to be ready
   * Override in child classes for specific page loading logic
   */
  protected async waitForPageReady(): Promise<void> {
    // Default implementation - wait for body to be visible
    await this.page.waitForSelector('body', { state: 'visible' });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(expectedPath?: string): Promise<void> {
    await TestHelpers.waitForNavigation(this.page, expectedPath);
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element and click
   */
  async clickElement(selector: string): Promise<void> {
    await TestHelpers.waitForStableElement(this.page, selector);
    await TestHelpers.scrollAndClick(this.page, selector);
  }

  /**
   * Fill input field
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await TestHelpers.clearAndFill(this.page, selector, value);
  }

  /**
   * Get text content of element
   */
  async getTextContent(selector: string): Promise<string> {
    await this.page.waitForSelector(selector, { state: 'visible' });
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '.loader',
      '[data-loading="true"]'
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'detached', timeout: 2000 });
      } catch {
        // Loading indicator might not exist, which is fine
      }
    }
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(name: string): Promise<void> {
    await TestHelpers.takeTimestampedScreenshot(this.page, name);
  }

  /**
   * Validate common page elements
   */
  async validatePageLayout(): Promise<void> {
    // Check for navigation
    const hasNavigation = await this.isElementVisible('[data-testid="navigation"], nav, .navigation');
    expect(hasNavigation).toBeTruthy();

    // Check for main content area
    const hasMainContent = await this.isElementVisible('main, [role="main"], .main-content');
    expect(hasMainContent).toBeTruthy();
  }

  /**
   * Wait for and validate toast message
   */
  async waitForToastMessage(expectedMessage?: string): Promise<string> {
    return await TestHelpers.waitForToast(this.page, expectedMessage);
  }

  /**
   * Handle dialog/modal
   */
  async handleDialog(action: 'accept' | 'dismiss', expectedMessage?: string): Promise<void> {
    await TestHelpers.handleDialog(this.page, action, expectedMessage);
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for API response
   */
  async waitForAPIResponse(urlPattern: string | RegExp, expectedStatus: number = 200): Promise<any> {
    return await TestHelpers.waitForAPIResponse(this.page, urlPattern, expectedStatus);
  }

  /**
   * Measure page performance
   */
  async measurePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  }> {
    return await TestHelpers.measurePagePerformance(this.page);
  }

  /**
   * Validate performance metrics
   */
  async validatePerformance(): Promise<void> {
    const metrics = await this.measurePerformance();
    TestHelpers.validatePerformance(metrics);
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Get element by role
   */
  getByRole(role: string, options?: { name?: string | RegExp }): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Get element by label
   */
  getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Check if page has error state
   */
  async hasError(): Promise<boolean> {
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      '.alert-error',
      '[role="alert"]'
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get error message if present
   */
  async getErrorMessage(): Promise<string | null> {
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      '.alert-error',
      '[role="alert"]'
    ];

    for (const selector of errorSelectors) {
      if (await this.isElementVisible(selector)) {
        return await this.getTextContent(selector);
      }
    }

    return null;
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await TestHelpers.waitForPageLoad(this.page);
    await this.waitForPageReady();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await TestHelpers.waitForPageLoad(this.page);
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await TestHelpers.waitForPageLoad(this.page);
  }
}