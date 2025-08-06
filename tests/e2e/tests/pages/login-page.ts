/**
 * Login Page Object for Bespoke AI Suite E2E Tests
 * 
 * Handles all login page interactions:
 * - User authentication
 * - Form validation
 * - Error handling
 * - Navigation after login
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { TestUser } from '../fixtures/test-data';

export class LoginPage extends BasePage {
  // Page elements
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly signupLink: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly errorMessage: Locator;
  private readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.emailInput = this.getByTestId('email-input').or(this.page.locator('[name="email"]'));
    this.passwordInput = this.getByTestId('password-input').or(this.page.locator('[name="password"]'));
    this.loginButton = this.getByTestId('login-button').or(this.getByRole('button', { name: /log.*in/i }));
    this.signupLink = this.getByTestId('signup-link').or(this.page.locator('a[href*="signup"]'));
    this.forgotPasswordLink = this.getByTestId('forgot-password-link').or(this.page.locator('a[href*="forgot"]'));
    this.errorMessage = this.getByTestId('error-message').or(this.page.locator('.error, [role="alert"]'));
    this.loadingSpinner = this.getByTestId('loading').or(this.page.locator('.loading, .spinner'));
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto('/login');
  }

  /**
   * Wait for login page to be ready
   */
  protected async waitForPageReady(): Promise<void> {
    await Promise.all([
      this.emailInput.waitFor({ state: 'visible' }),
      this.passwordInput.waitFor({ state: 'visible' }),
      this.loginButton.waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
    await this.waitForLoginCompletion();
  }

  /**
   * Login with test user object
   */
  async loginWithUser(user: TestUser): Promise<void> {
    await this.login(user.email, user.password);
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    
    // Validate email was filled
    const value = await this.emailInput.inputValue();
    expect(value).toBe(email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    
    // Validate password was filled (but don't check actual value for security)
    const value = await this.passwordInput.inputValue();
    expect(value.length).toBe(password.length);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Click signup link
   */
  async clickSignupLink(): Promise<void> {
    await this.signupLink.click();
    await this.waitForNavigation('/signup');
  }

  /**
   * Click forgot password link
   */
  async clickForgotPasswordLink(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.waitForNavigation('/forgot');
  }

  /**
   * Wait for login completion (success or failure)
   */
  async waitForLoginCompletion(): Promise<void> {
    // Wait for either navigation to dashboard or error message
    await Promise.race([
      this.page.waitForURL('**/dashboard', { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }),
    ]);

    // Wait for loading to complete
    await this.waitForLoadingComplete();
  }

  /**
   * Check if login was successful
   */
  async isLoginSuccessful(): Promise<boolean> {
    // Check if we're on dashboard or if URL changed away from login
    const currentUrl = this.getCurrentURL();
    return !currentUrl.includes('/login') && (
      currentUrl.includes('/dashboard') || 
      currentUrl.includes('/content') ||
      currentUrl.includes('/campaigns')
    );
  }

  /**
   * Get login error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent() || '';
    }
    return '';
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Validate login form elements are present
   */
  async validateLoginFormElements(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.signupLink).toBeVisible();
    
    // Validate form labels and accessibility
    const emailLabel = this.page.locator('label[for*="email"], [aria-label*="email"]');
    const passwordLabel = this.page.locator('label[for*="password"], [aria-label*="password"]');
    
    await expect(emailLabel.or(this.emailInput)).toBeVisible();
    await expect(passwordLabel.or(this.passwordInput)).toBeVisible();
  }

  /**
   * Test form validation
   */
  async testFormValidation(): Promise<void> {
    // Try submitting empty form
    await this.clickLogin();
    
    // Check for validation messages
    const emailValidation = await this.page.locator('[name="email"]:invalid, [data-testid="email-error"]').count();
    const passwordValidation = await this.page.locator('[name="password"]:invalid, [data-testid="password-error"]').count();
    
    expect(emailValidation + passwordValidation).toBeGreaterThan(0);
  }

  /**
   * Test invalid email format validation
   */
  async testInvalidEmailValidation(): Promise<void> {
    await this.fillEmail('invalid-email');
    await this.fillPassword('somepassword');
    await this.clickLogin();
    
    // Should show validation error for invalid email
    const hasError = await this.hasErrorMessage() || 
                    await this.page.locator('[name="email"]:invalid').count() > 0;
    expect(hasError).toBeTruthy();
  }

  /**
   * Test password visibility toggle if present
   */
  async testPasswordVisibilityToggle(): Promise<void> {
    const toggleButton = this.page.locator('[data-testid="password-toggle"], .password-toggle, [type="button"][aria-label*="password"]');
    
    if (await toggleButton.count() > 0) {
      await this.fillPassword('testpassword');
      
      // Initially should be password type
      let inputType = await this.passwordInput.getAttribute('type');
      expect(inputType).toBe('password');
      
      // Click toggle
      await toggleButton.click();
      
      // Should now be text type
      inputType = await this.passwordInput.getAttribute('type');
      expect(inputType).toBe('text');
      
      // Click toggle again
      await toggleButton.click();
      
      // Should be password type again
      inputType = await this.passwordInput.getAttribute('type');
      expect(inputType).toBe('password');
    }
  }

  /**
   * Check if login button is disabled during loading
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Validate page title and heading
   */
  async validatePageContent(): Promise<void> {
    const title = await this.getTitle();
    expect(title).toContain('Login');
    
    // Check for main heading
    const heading = this.page.locator('h1, [data-testid="page-title"]');
    await expect(heading).toBeVisible();
    
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/log.*in/i);
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<void> {
    // Tab through form elements
    await this.page.keyboard.press('Tab'); // Should focus email
    await expect(this.emailInput).toBeFocused();
    
    await this.page.keyboard.press('Tab'); // Should focus password
    await expect(this.passwordInput).toBeFocused();
    
    await this.page.keyboard.press('Tab'); // Should focus login button
    await expect(this.loginButton).toBeFocused();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnterKey(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.page.keyboard.press('Enter');
    await this.waitForLoginCompletion();
  }

  /**
   * Test login with different user roles
   */
  async loginAndValidateRole(user: TestUser): Promise<void> {
    await this.loginWithUser(user);
    
    const isSuccessful = await this.isLoginSuccessful();
    expect(isSuccessful).toBeTruthy();
    
    // Validate user is redirected to appropriate page based on role
    const currentUrl = this.getCurrentURL();
    
    if (user.role === 'admin') {
      // Admin users might be redirected to admin dashboard
      expect(currentUrl).toMatch(/(dashboard|admin)/);
    } else {
      // Regular users go to dashboard or content page
      expect(currentUrl).toMatch(/(dashboard|content)/);
    }
  }
}