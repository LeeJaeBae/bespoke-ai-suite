/**
 * Visual Regression E2E Tests for Bespoke AI Suite
 * 
 * Tests visual consistency:
 * - Screenshot comparisons
 * - Responsive design validation
 * - Theme consistency
 * - Cross-browser visual differences
 */

import { test, expect } from '@playwright/test';
import { ContentPage } from '../pages/content-page';
import { DashboardPage } from '../pages/dashboard-page';
import { LoginPage } from '../pages/login-page';
import { TestDataFactory } from '../fixtures/test-data';

// Use authenticated state for visual tests
test.use({ storageState: 'test-results/.auth/user.json' });

test.describe('Visual Regression Tests @visual @smoke', () => {
  
  test('should match dashboard page visual baseline', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goto();
    await dashboardPage.validateDashboardElements();
    
    // Wait for all content to load
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-full-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // Take viewport screenshot
    await expect(page).toHaveScreenshot('dashboard-viewport.png', {
      animations: 'disabled',
    });
  });

  test('should match content page visual baseline', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    await contentPage.validateContentPageElements();
    
    // Wait for content to load
    await contentPage.waitForLoadingComplete();
    
    // Take screenshot of content page
    await expect(page).toHaveScreenshot('content-page-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match login page visual baseline', async ({ page }) => {
    // Clear authentication for this test
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.validatePageContent();
    
    // Take screenshot of login page
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

});

test.describe('Responsive Design Visual Tests @visual @responsive', () => {

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'large-desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.goto();
      
      // Wait for responsive layout to settle
      await page.waitForTimeout(500);
      
      // Test mobile-specific features if on mobile viewport
      if (viewport.name === 'mobile') {
        await dashboardPage.validateMobileLayout();
      }
      
      // Take screenshot for this viewport
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test('should handle viewport transitions smoothly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Start with desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('responsive-desktop.png', {
      animations: 'disabled',
    });
    
    // Transition to tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('responsive-tablet.png', {
      animations: 'disabled',
    });
    
    // Transition to mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('responsive-mobile.png', {
      animations: 'disabled',
    });
  });

});

test.describe('Component Visual Tests @visual @components', () => {
  
  test('should match navigation component visual baseline', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Focus on navigation component
    const navigation = page.locator('[data-testid="navigation"], nav, .navigation').first();
    await expect(navigation).toBeVisible();
    
    // Screenshot of navigation component only
    await expect(navigation).toHaveScreenshot('navigation-component.png', {
      animations: 'disabled',
    });
  });

  test('should match content creation modal visual baseline', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Open create content modal
    await contentPage.clickCreateContent();
    
    // Wait for modal to be fully visible
    const modal = page.locator('[data-testid="create-content-modal"], .modal').first();
    await expect(modal).toBeVisible();
    
    // Screenshot of modal
    await expect(modal).toHaveScreenshot('create-content-modal.png', {
      animations: 'disabled',
    });
  });

  test('should match content list items visual baseline', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    const contentCount = await contentPage.getContentCount();
    
    if (contentCount > 0) {
      // Focus on content list
      const contentList = page.locator('[data-testid="content-list"], .content-list').first();
      await expect(contentList).toBeVisible();
      
      // Screenshot of content list
      await expect(contentList).toHaveScreenshot('content-list.png', {
        animations: 'disabled',
      });
    } else {
      // Screenshot empty state
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state').first();
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('content-empty-state.png', {
          animations: 'disabled',
        });
      }
    }
  });

});

test.describe('Theme and Color Scheme Tests @visual @theme', () => {
  
  test('should maintain consistent color scheme', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Check if dark mode toggle exists
    const hasDarkMode = await dashboardPage.hasDarkModeToggle();
    
    if (hasDarkMode) {
      // Test light theme (default)
      await expect(page).toHaveScreenshot('theme-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
      
      // Switch to dark theme
      await dashboardPage.toggleDarkMode();
      await page.waitForTimeout(500); // Allow theme transition
      
      await expect(page).toHaveScreenshot('theme-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
      
      // Switch back to light theme
      await dashboardPage.toggleDarkMode();
      await page.waitForTimeout(500);
    } else {
      console.log('ℹ️ Dark mode not available - testing default theme only');
      
      await expect(page).toHaveScreenshot('theme-default.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('should maintain consistent styling across pages', async ({ page }) => {
    const pages = [
      { name: 'dashboard', page: new DashboardPage(page) },
      { name: 'content', page: new ContentPage(page) },
    ];
    
    for (const pageInfo of pages) {
      await pageInfo.page.goto();
      await pageInfo.page.waitForLoadingComplete();
      
      // Take screenshot of each page for consistency comparison
      await expect(page).toHaveScreenshot(`consistency-${pageInfo.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

});

test.describe('Form and Interaction Visual Tests @visual @forms', () => {
  
  test('should show proper form states visually', async ({ page }) => {
    // Clear auth for login form test
    await page.context().clearCookies();
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Default form state
    await expect(page).toHaveScreenshot('login-form-default.png', {
      animations: 'disabled',
    });
    
    // Fill form
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('password123');
    
    // Form with data
    await expect(page).toHaveScreenshot('login-form-filled.png', {
      animations: 'disabled',
    });
    
    // Try invalid submission to show error state
    await loginPage.clickLogin();
    await page.waitForTimeout(1000); // Wait for error state
    
    // Error state
    if (await loginPage.hasErrorMessage()) {
      await expect(page).toHaveScreenshot('login-form-error.png', {
        animations: 'disabled',
      });
    }
  });

  test('should show loading states properly', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Try to capture loading state (this might be brief)
    await contentPage.clickCreateContent();
    
    const modal = page.locator('[data-testid="create-content-modal"], .modal').first();
    await expect(modal).toBeVisible();
    
    // Fill AI generation form if available
    const aiPrompt = modal.locator('[data-testid="ai-prompt"], [name="prompt"]');
    const aiButton = modal.locator('[data-testid="ai-generate"]');
    
    if (await aiPrompt.isVisible() && await aiButton.isVisible()) {
      await aiPrompt.fill('Generate a test article');
      
      // Click generate and try to capture loading state
      await aiButton.click();
      
      // Wait briefly for loading state
      await page.waitForTimeout(100);
      
      // Try to capture loading state (might be very brief)
      const loadingElement = page.locator('.loading, .spinner, [data-loading="true"]');
      if (await loadingElement.isVisible()) {
        await expect(modal).toHaveScreenshot('ai-generation-loading.png', {
          animations: 'disabled',
        });
      }
    }
  });

});

test.describe('Error State Visual Tests @visual @error', () => {
  
  test('should display 404 error page correctly', async ({ page }) => {
    // Try to access non-existent page
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
    
    // Check if 404 page is shown
    const is404 = page.url().includes('404') || 
                  await page.locator('h1, .error-title').textContent().then(text => 
                    text?.includes('404') || text?.includes('Not Found')
                  );
    
    if (is404) {
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('should display network error states', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Simulate network failure
    await page.route('**/api/content', route => route.abort());
    
    await contentPage.goto();
    await page.waitForTimeout(2000); // Wait for error state to appear
    
    // Check if error state is visible
    const hasError = await contentPage.hasError();
    
    if (hasError) {
      await expect(page).toHaveScreenshot('network-error-state.png', {
        animations: 'disabled',
      });
    }
  });

});

test.describe('Animation and Transition Tests @visual @animation', () => {
  
  test('should handle animations consistently', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Test page with animations enabled
    await expect(page).toHaveScreenshot('with-animations.png', {
      fullPage: true,
      // Don't disable animations for this test
    });
    
    // Test page with animations disabled
    await expect(page).toHaveScreenshot('without-animations.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should show smooth transitions between states', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Take screenshot of initial state
    await expect(page).toHaveScreenshot('transition-state-1.png', {
      animations: 'disabled',
    });
    
    // Perform action that triggers transition
    const searchInput = page.locator('[data-testid="search-input"], [type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      
      // Screenshot of focused state
      await expect(page).toHaveScreenshot('transition-state-2.png', {
        animations: 'disabled',
      });
    }
  });

});

test.describe('Cross-Browser Visual Consistency @visual @cross-browser', () => {
  
  test('should render consistently across browsers', async ({ page, browserName }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Browser-specific screenshot for comparison
    await expect(page).toHaveScreenshot(`dashboard-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should handle fonts consistently across browsers', async ({ page, browserName }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Focus on text content for font rendering comparison
    const contentArea = page.locator('main, .main-content, [role="main"]').first();
    
    if (await contentArea.isVisible()) {
      await expect(contentArea).toHaveScreenshot(`fonts-${browserName}.png`, {
        animations: 'disabled',
      });
    }
  });

});

test.describe('Accessibility Visual Tests @visual @a11y', () => {
  
  test('should show focus indicators clearly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Tab to focus first focusable element
    await page.keyboard.press('Tab');
    
    // Screenshot with focus indicator
    await expect(page).toHaveScreenshot('focus-indicators.png', {
      animations: 'disabled',
    });
    
    // Tab to next element
    await page.keyboard.press('Tab');
    
    // Screenshot with different focus indicator
    await expect(page).toHaveScreenshot('focus-indicators-2.png', {
      animations: 'disabled',
    });
  });

  test('should maintain proper contrast ratios', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Take screenshot for contrast analysis
    await expect(page).toHaveScreenshot('contrast-analysis.png', {
      fullPage: true,
      animations: 'disabled',
    });
    
    // This screenshot can be used with external tools to verify contrast ratios
  });

});