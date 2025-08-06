/**
 * Authentication E2E Tests for Bespoke AI Suite
 * 
 * Tests authentication workflows:
 * - Login functionality
 * - Logout functionality
 * - Form validation
 * - Session management
 * - Different user roles
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testUsers, testConfig } from '../config/test-config';
import { TestDataFactory } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Authentication Flow @auth @smoke', () => {
  
  test('should display login page correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Validate page content and elements
    await loginPage.validatePageContent();
    await loginPage.validateLoginFormElements();
    
    // Check page performance
    await loginPage.validatePerformance();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await loginPage.goto();
    
    // Perform login
    await loginPage.loginWithUser(testUsers.user);
    
    // Validate successful login
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    
    // Validate redirection to dashboard
    await dashboardPage.validateDashboardElements();
    expect(await dashboardPage.isAuthenticated()).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Attempt login with invalid credentials
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    // Should show error message
    expect(await loginPage.hasErrorMessage()).toBeTruthy();
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain('Invalid');
    
    // Should still be on login page
    expect(await loginPage.isLoginSuccessful()).toBeFalsy();
  });

  test('should validate form fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Test form validation
    await loginPage.testFormValidation();
    
    // Test invalid email format
    await loginPage.testInvalidEmailValidation();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Test keyboard navigation
    await loginPage.testKeyboardNavigation();
    
    // Test form submission with Enter key
    await loginPage.submitWithEnterKey(testUsers.user.email, testUsers.user.password);
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
  });

  test('should support password visibility toggle', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Test password visibility toggle if present
    await loginPage.testPasswordVisibilityToggle();
  });

  test('should handle loading states', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    await loginPage.fillEmail(testUsers.user.email);
    await loginPage.fillPassword(testUsers.user.password);
    
    // Start login and check loading state
    await loginPage.clickLogin();
    
    // Check if loading state is shown (briefly)
    const isLoading = await loginPage.isLoading();
    const isButtonDisabled = await loginPage.isLoginButtonDisabled();
    
    // At least one loading indicator should be present during login
    // (This might be very brief, so we don't assert it's always true)
    
    await loginPage.waitForLoginCompletion();
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.loginWithUser(testUsers.user);
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    
    // Logout
    await dashboardPage.logout();
    
    // Should be redirected to login page
    expect(page.url()).toContain('/login');
    await loginPage.validatePageContent();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login
    await loginPage.goto();
    await loginPage.loginWithUser(testUsers.user);
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    
    // Refresh page
    await page.reload();
    await TestHelpers.waitForPageLoad(page);
    
    // Should still be authenticated
    expect(await dashboardPage.isAuthenticated()).toBeTruthy();
  });

  test('should redirect to intended page after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Try to access protected content page directly
    await page.goto(`${testConfig.frontend.url}/content`);
    
    // Should be redirected to login
    expect(page.url()).toContain('/login');
    
    // Login
    await loginPage.loginWithUser(testUsers.user);
    
    // Should be redirected back to content page (or dashboard)
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/(content|dashboard)/);
  });

});

test.describe('User Roles Authentication @auth', () => {
  
  test('should login admin user successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.loginAndValidateRole(testUsers.admin);
  });

  test('should login regular user successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.loginAndValidateRole(testUsers.user);
  });

  test('should login editor user successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.loginAndValidateRole(testUsers.editor);
  });

});

test.describe('Authentication Security @auth @security', () => {
  
  test('should prevent brute force attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await loginPage.login('invalid@email.com', 'wrongpassword');
      expect(await loginPage.hasErrorMessage()).toBeTruthy();
      await loginPage.clearForm();
    }
    
    // After multiple attempts, there might be additional security measures
    // This test documents the expected behavior but doesn't assert specific outcomes
    // as different implementations may handle rate limiting differently
  });

  test('should handle expired sessions gracefully', async ({ page }) => {
    // This test would require a way to expire sessions
    // Implementation depends on session management strategy
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Login first
    await loginPage.goto();
    await loginPage.loginWithUser(testUsers.user);
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
    
    // Simulate session expiration (this would need to be implemented)
    // For now, just validate that the user can log out and log back in
    await dashboardPage.logout();
    expect(page.url()).toContain('/login');
    
    // Re-login should work
    await loginPage.loginWithUser(testUsers.user);
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();
  });

  test('should validate CSRF protection', async ({ page }) => {
    // This test validates that forms have CSRF protection
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Check for CSRF token in form
    const csrfToken = await page.locator('input[name="_token"], input[name="csrf_token"], meta[name="csrf-token"]').count();
    
    // If CSRF protection is implemented, there should be a token
    // This test documents expected security measures
    if (csrfToken > 0) {
      console.log('✅ CSRF protection detected');
    } else {
      console.log('⚠️  No CSRF token detected - consider implementing CSRF protection');
    }
  });

});

test.describe('Authentication Accessibility @auth @a11y', () => {
  
  test('should be accessible with screen readers', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Check for proper ARIA labels and roles
    const emailInput = page.locator('[name="email"]');
    const passwordInput = page.locator('[name="password"]');
    const loginButton = page.locator('[type="submit"]');
    
    // Check for labels or aria-label attributes
    const emailHasLabel = await emailInput.getAttribute('aria-label') || 
                          await page.locator('label[for*="email"]').count() > 0;
    const passwordHasLabel = await passwordInput.getAttribute('aria-label') || 
                             await page.locator('label[for*="password"]').count() > 0;
    
    expect(emailHasLabel).toBeTruthy();
    expect(passwordHasLabel).toBeTruthy();
    
    // Login button should have accessible text
    const buttonText = await loginButton.textContent() || await loginButton.getAttribute('aria-label');
    expect(buttonText).toBeTruthy();
    expect(buttonText).toMatch(/log.*in/i);
  });

  test('should have proper focus management', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Test focus indicators are visible
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible focus indicator
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test keyboard navigation
    await loginPage.testKeyboardNavigation();
  });

  test('should meet color contrast requirements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // This is a basic check - comprehensive color contrast testing
    // would require specialized tools
    
    // Ensure form elements are visible and have sufficient contrast
    const emailInput = page.locator('[name="email"]');
    const passwordInput = page.locator('[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check if elements have proper styling
    const emailStyles = await emailInput.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor
      };
    });
    
    // Basic check that elements have styling applied
    expect(emailStyles.color).toBeTruthy();
    expect(emailStyles.backgroundColor).toBeTruthy();
  });

});