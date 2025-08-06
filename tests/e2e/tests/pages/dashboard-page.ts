/**
 * Dashboard Page Object for Bespoke AI Suite E2E Tests
 * 
 * Handles all dashboard page interactions:
 * - Navigation verification
 * - Dashboard widgets
 * - User menu actions
 * - Quick actions
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  // Page elements
  private readonly pageTitle: Locator;
  private readonly userMenu: Locator;
  private readonly logoutButton: Locator;
  private readonly contentLink: Locator;
  private readonly campaignsLink: Locator;
  private readonly analyticsLink: Locator;
  private readonly createContentButton: Locator;
  private readonly createCampaignButton: Locator;
  private readonly quickStatsWidget: Locator;
  private readonly recentContentWidget: Locator;
  private readonly navigationMenu: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.pageTitle = this.getByTestId('page-title').or(this.page.locator('h1'));
    this.userMenu = this.getByTestId('user-menu').or(this.page.locator('[data-user-menu]'));
    this.logoutButton = this.getByTestId('logout-button').or(this.getByRole('button', { name: /logout/i }));
    this.contentLink = this.getByTestId('content-link').or(this.page.locator('[href*="content"]'));
    this.campaignsLink = this.getByTestId('campaigns-link').or(this.page.locator('[href*="campaigns"]'));
    this.analyticsLink = this.getByTestId('analytics-link').or(this.page.locator('[href*="analytics"]'));
    this.createContentButton = this.getByTestId('create-content').or(this.getByRole('button', { name: /create.*content/i }));
    this.createCampaignButton = this.getByTestId('create-campaign').or(this.getByRole('button', { name: /create.*campaign/i }));
    this.quickStatsWidget = this.getByTestId('quick-stats').or(this.page.locator('.stats, .metrics'));
    this.recentContentWidget = this.getByTestId('recent-content').or(this.page.locator('.recent-content'));
    this.navigationMenu = this.getByTestId('navigation').or(this.page.locator('nav, .navigation'));
  }

  /**
   * Navigate to dashboard page
   */
  async goto(): Promise<void> {
    await super.goto('/dashboard');
  }

  /**
   * Wait for dashboard page to be ready
   */
  protected async waitForPageReady(): Promise<void> {
    await Promise.all([
      this.pageTitle.waitFor({ state: 'visible' }),
      this.navigationMenu.waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Validate dashboard page elements
   */
  async validateDashboardElements(): Promise<void> {
    // Check page title
    await expect(this.pageTitle).toBeVisible();
    const titleText = await this.pageTitle.textContent();
    expect(titleText).toMatch(/dashboard/i);

    // Check navigation menu
    await expect(this.navigationMenu).toBeVisible();

    // Check main navigation links
    await expect(this.contentLink).toBeVisible();
    await expect(this.campaignsLink).toBeVisible();
    await expect(this.analyticsLink).toBeVisible();
  }

  /**
   * Navigate to content page
   */
  async goToContent(): Promise<void> {
    await this.contentLink.click();
    await this.waitForNavigation('/content');
  }

  /**
   * Navigate to campaigns page
   */
  async goToCampaigns(): Promise<void> {
    await this.campaignsLink.click();
    await this.waitForNavigation('/campaigns');
  }

  /**
   * Navigate to analytics page
   */
  async goToAnalytics(): Promise<void> {
    await this.analyticsLink.click();
    await this.waitForNavigation('/analytics');
  }

  /**
   * Click create content button
   */
  async clickCreateContent(): Promise<void> {
    await this.createContentButton.click();
    
    // Wait for either modal to appear or navigation to content creation page
    await Promise.race([
      this.page.waitForSelector('[data-testid="create-content-modal"], .modal', { state: 'visible' }),
      this.page.waitForURL('**/content/create'),
    ]);
  }

  /**
   * Click create campaign button
   */
  async clickCreateCampaign(): Promise<void> {
    await this.createCampaignButton.click();
    
    // Wait for either modal to appear or navigation to campaign creation page
    await Promise.race([
      this.page.waitForSelector('[data-testid="create-campaign-modal"], .modal', { state: 'visible' }),
      this.page.waitForURL('**/campaigns/create'),
    ]);
  }

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
    
    // Wait for menu dropdown to appear
    const menuDropdown = this.page.locator('[data-testid="user-menu-dropdown"], .user-menu-dropdown, .dropdown-menu');
    await menuDropdown.waitFor({ state: 'visible' });
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Open user menu if not already open
    const isMenuOpen = await this.logoutButton.isVisible();
    if (!isMenuOpen) {
      await this.openUserMenu();
    }
    
    await this.logoutButton.click();
    
    // Wait for redirect to login page
    await this.page.waitForURL('**/login');
  }

  /**
   * Check if user is authenticated (on dashboard)
   */
  async isAuthenticated(): Promise<boolean> {
    const currentUrl = this.getCurrentURL();
    return currentUrl.includes('/dashboard') && await this.pageTitle.isVisible();
  }

  /**
   * Get quick stats data
   */
  async getQuickStats(): Promise<Record<string, string>> {
    const stats: Record<string, string> = {};
    
    if (await this.quickStatsWidget.isVisible()) {
      const statElements = await this.quickStatsWidget.locator('[data-testid*="stat"], .stat-item').all();
      
      for (const element of statElements) {
        const label = await element.locator('.label, .stat-label, [data-testid*="label"]').textContent();
        const value = await element.locator('.value, .stat-value, [data-testid*="value"]').textContent();
        
        if (label && value) {
          stats[label.trim()] = value.trim();
        }
      }
    }
    
    return stats;
  }

  /**
   * Get recent content list
   */
  async getRecentContent(): Promise<Array<{ title: string; status: string; date: string }>> {
    const contentList: Array<{ title: string; status: string; date: string }> = [];
    
    if (await this.recentContentWidget.isVisible()) {
      const contentItems = await this.recentContentWidget.locator('[data-testid="content-item"], .content-item').all();
      
      for (const item of contentItems) {
        const title = await item.locator('.title, [data-testid="title"]').textContent();
        const status = await item.locator('.status, [data-testid="status"]').textContent();
        const date = await item.locator('.date, [data-testid="date"]').textContent();
        
        if (title) {
          contentList.push({
            title: title.trim(),
            status: status?.trim() || '',
            date: date?.trim() || '',
          });
        }
      }
    }
    
    return contentList;
  }

  /**
   * Validate dashboard widgets are loaded
   */
  async validateWidgetsLoaded(): Promise<void> {
    // Check if widgets are present and contain data
    if (await this.quickStatsWidget.isVisible()) {
      const stats = await this.getQuickStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    }
    
    if (await this.recentContentWidget.isVisible()) {
      // Widget should at least be visible, content list can be empty for new users
      await expect(this.recentContentWidget).toBeVisible();
    }
  }

  /**
   * Check for welcome message for new users
   */
  async hasWelcomeMessage(): Promise<boolean> {
    const welcomeMessage = this.page.locator('[data-testid="welcome-message"], .welcome-message, .onboarding');
    return await welcomeMessage.isVisible();
  }

  /**
   * Click welcome message CTA if present
   */
  async clickWelcomeCTA(): Promise<void> {
    const welcomeCTA = this.page.locator('[data-testid="welcome-cta"], .welcome-cta, .get-started');
    
    if (await welcomeCTA.isVisible()) {
      await welcomeCTA.click();
    }
  }

  /**
   * Validate navigation breadcrumbs if present
   */
  async validateBreadcrumbs(): Promise<void> {
    const breadcrumbs = this.page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label="breadcrumb"]');
    
    if (await breadcrumbs.isVisible()) {
      const breadcrumbText = await breadcrumbs.textContent();
      expect(breadcrumbText).toContain('Dashboard');
    }
  }

  /**
   * Check if dashboard has dark mode toggle
   */
  async hasDarkModeToggle(): Promise<boolean> {
    const darkModeToggle = this.page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="dark"]');
    return await darkModeToggle.isVisible();
  }

  /**
   * Toggle dark mode if available
   */
  async toggleDarkMode(): Promise<void> {
    const darkModeToggle = this.page.locator('[data-testid="theme-toggle"], .theme-toggle, [aria-label*="dark"]');
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      
      // Wait for theme change to apply
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Search functionality if present
   */
  async search(query: string): Promise<void> {
    const searchInput = this.page.locator('[data-testid="search"], [type="search"], .search-input');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await this.page.keyboard.press('Enter');
      
      // Wait for search results or navigation
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Validate responsive design on mobile viewport
   */
  async validateMobileLayout(): Promise<void> {
    // Check if mobile menu button is visible
    const mobileMenuButton = this.page.locator('[data-testid="mobile-menu"], .mobile-menu-button, .hamburger');
    
    if (await mobileMenuButton.isVisible()) {
      // Click to open mobile menu
      await mobileMenuButton.click();
      
      // Check if navigation menu becomes visible
      const mobileNav = this.page.locator('[data-testid="mobile-navigation"], .mobile-nav');
      await expect(mobileNav).toBeVisible();
      
      // Close mobile menu
      await mobileMenuButton.click();
    }
  }

  /**
   * Get notification count if notifications are present
   */
  async getNotificationCount(): Promise<number> {
    const notificationBadge = this.page.locator('[data-testid="notification-badge"], .notification-badge, .badge');
    
    if (await notificationBadge.isVisible()) {
      const countText = await notificationBadge.textContent();
      return parseInt(countText || '0');
    }
    
    return 0;
  }

  /**
   * Open notifications panel if present
   */
  async openNotifications(): Promise<void> {
    const notificationButton = this.page.locator('[data-testid="notifications"], .notifications-button');
    
    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      
      // Wait for notifications panel to open
      const notificationsPanel = this.page.locator('[data-testid="notifications-panel"], .notifications-panel');
      await notificationsPanel.waitFor({ state: 'visible' });
    }
  }
}