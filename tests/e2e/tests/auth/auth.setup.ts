/**
 * Authentication Setup for Bespoke AI Suite E2E Tests
 * 
 * Sets up authentication state for test sessions:
 * - Creates authenticated user sessions
 * - Saves authentication state for reuse
 * - Tests different user roles
 */

import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testUsers } from '../config/test-config';

const authFile = 'test-results/.auth/user.json';
const adminAuthFile = 'test-results/.auth/admin.json';
const editorAuthFile = 'test-results/.auth/editor.json';

/**
 * Setup authentication for regular user
 */
setup('authenticate as user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Go to login page
  await loginPage.goto();
  
  // Validate login page is loaded
  await loginPage.validatePageContent();
  
  // Perform login
  await loginPage.loginWithUser(testUsers.user);
  
  // Validate successful login
  const isSuccessful = await loginPage.isLoginSuccessful();
  expect(isSuccessful).toBeTruthy();
  
  // Validate user is on dashboard
  await dashboardPage.validateDashboardElements();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('✅ User authentication setup completed');
});

/**
 * Setup authentication for admin user
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Go to login page
  await loginPage.goto();
  
  // Perform admin login
  await loginPage.loginWithUser(testUsers.admin);
  
  // Validate successful login
  const isSuccessful = await loginPage.isLoginSuccessful();
  expect(isSuccessful).toBeTruthy();
  
  // Validate admin is on dashboard
  await dashboardPage.validateDashboardElements();
  
  // Save admin authentication state
  await page.context().storageState({ path: adminAuthFile });
  
  console.log('✅ Admin authentication setup completed');
});

/**
 * Setup authentication for editor user
 */
setup('authenticate as editor', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Go to login page
  await loginPage.goto();
  
  // Perform editor login
  await loginPage.loginWithUser(testUsers.editor);
  
  // Validate successful login
  const isSuccessful = await loginPage.isLoginSuccessful();
  expect(isSuccessful).toBeTruthy();
  
  // Validate editor is on dashboard
  await dashboardPage.validateDashboardElements();
  
  // Save editor authentication state
  await page.context().storageState({ path: editorAuthFile });
  
  console.log('✅ Editor authentication setup completed');
});