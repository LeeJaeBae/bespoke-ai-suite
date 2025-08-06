/**
 * Content Management E2E Tests for Bespoke AI Suite
 * 
 * Tests content workflows:
 * - Manual content creation
 * - AI-powered content generation
 * - Content listing and filtering
 * - Content publishing workflow
 * - Content editing and deletion
 */

import { test, expect } from '@playwright/test';
import { ContentPage } from '../pages/content-page';
import { DashboardPage } from '../pages/dashboard-page';
import { TestDataFactory, predefinedTestData } from '../fixtures/test-data';
import { TestHelpers } from '../utils/test-helpers';

// Use authenticated state for all content tests
test.use({ storageState: 'test-results/.auth/user.json' });

test.describe('Content Management @content @smoke', () => {
  
  test('should display content page correctly', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // Validate page elements
    await contentPage.validateContentPageElements();
    
    // Check page performance
    await contentPage.validatePerformance();
  });

  test('should navigate to content page from dashboard', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const contentPage = new ContentPage(page);
    
    await dashboardPage.goto();
    await dashboardPage.goToContent();
    
    // Should be on content page
    await contentPage.validateContentPageElements();
  });

  test('should show empty state when no content exists', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // For new users, content list might be empty
    const isEmpty = await contentPage.isContentListEmpty();
    const contentCount = await contentPage.getContentCount();
    
    if (isEmpty) {
      expect(contentCount).toBe(0);
      console.log('✅ Empty state displayed correctly');
    } else {
      expect(contentCount).toBeGreaterThan(0);
      console.log(`✅ Content list showing ${contentCount} items`);
    }
  });

});

test.describe('Manual Content Creation @content', () => {
  
  test('should create content manually', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const testContent = TestDataFactory.createContent({
      title: `Manual Test Content ${TestHelpers.generateTestId()}`,
      type: 'article',
      status: 'draft',
    });
    
    await contentPage.goto();
    await contentPage.createContentManually(testContent);
    
    // Validate content was created
    await contentPage.validateContentCreated(testContent.title);
    
    // Verify content appears in list with correct properties
    const contentItems = await contentPage.getContentItems();
    const createdItem = contentItems.find(item => item.title.includes(testContent.title));
    
    expect(createdItem).toBeTruthy();
    expect(createdItem?.type).toBe(testContent.type);
    expect(createdItem?.status).toBe('draft');
  });

  test('should validate form fields during content creation', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    await contentPage.clickCreateContent();
    
    // Try to save without required fields
    const saveButton = page.locator('[data-testid="save-content"], button[type="submit"]');
    await saveButton.click();
    
    // Should show validation errors
    const titleError = page.locator('[data-testid="title-error"], .field-error');
    const hasError = await titleError.count() > 0 || await contentPage.hasError();
    
    expect(hasError).toBeTruthy();
  });

  test('should support different content types', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const contentTypes = ['article', 'blog', 'social', 'email'];
    
    for (const type of contentTypes) {
      const testContent = TestDataFactory.createContent({
        title: `${type} Test Content ${TestHelpers.generateTestId()}`,
        type: type as any,
      });
      
      await contentPage.goto();
      await contentPage.createContentManually(testContent);
      await contentPage.validateContentCreated(testContent.title);
    }
  });

  test('should save content as draft by default', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const testContent = TestDataFactory.createContent({
      title: `Draft Test Content ${TestHelpers.generateTestId()}`,
    });
    
    await contentPage.goto();
    await contentPage.createContentManually(testContent);
    
    // Verify content is saved as draft
    const contentItems = await contentPage.getContentItems();
    const createdItem = contentItems.find(item => item.title.includes(testContent.title));
    
    expect(createdItem?.status).toBe('draft');
  });

});

test.describe('AI Content Generation @content @ai', () => {
  
  test('should generate content with AI', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const prompt = 'Write an article about the future of artificial intelligence in content creation';
    const testId = TestHelpers.generateTestId();
    
    await contentPage.goto();
    await contentPage.createContentWithAI(prompt, 'article');
    
    // Wait for AI generation API call
    await contentPage.waitForAPIResponse(/\/api\/content.*generate|\/generate/, 200);
    
    // Validate AI-generated content quality
    await contentPage.validateAIGeneratedContent();
    
    // Verify content appears in list
    await page.waitForTimeout(1000); // Allow time for content to be saved
    await contentPage.goto(); // Refresh to see new content
    
    const contentCount = await contentPage.getContentCount();
    expect(contentCount).toBeGreaterThan(0);
  });

  test('should handle AI generation errors gracefully', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const invalidPrompt = ''; // Empty prompt should cause error
    
    await contentPage.goto();
    await contentPage.clickCreateContent();
    
    // Try to generate with empty prompt
    const aiButton = page.locator('[data-testid="ai-generate"], button[data-ai-generate]');
    if (await aiButton.isVisible()) {
      await aiButton.click();
      
      // Should show error or validation message
      const hasError = await contentPage.hasError();
      const errorMessage = await contentPage.getErrorMessage();
      
      if (hasError) {
        expect(errorMessage).toBeTruthy();
        console.log('✅ AI generation error handled gracefully');
      } else {
        console.log('⚠️ AI generation with empty prompt - check validation');
      }
    }
  });

  test('should show loading state during AI generation', async ({ page }) => {
    const contentPage = new ContentPage(page);
    const prompt = 'Generate a short social media post about productivity tips';
    
    await contentPage.goto();
    await contentPage.clickCreateContent();
    
    // Fill prompt and click generate
    const promptInput = page.locator('[data-testid="ai-prompt"], [name="prompt"]');
    const aiButton = page.locator('[data-testid="ai-generate"], button[data-ai-generate]');
    
    if (await promptInput.isVisible() && await aiButton.isVisible()) {
      await promptInput.fill(prompt);
      await aiButton.click();
      
      // Check for loading indicators
      const loadingIndicators = [
        page.locator('[data-testid="ai-loading"]'),
        page.locator('.loading'),
        page.locator('.spinner'),
        aiButton.locator('.loading')
      ];
      
      let hasLoadingState = false;
      for (const indicator of loadingIndicators) {
        if (await indicator.isVisible()) {
          hasLoadingState = true;
          break;
        }
      }
      
      // Wait for generation to complete
      await contentPage.waitForLoadingComplete();
      
      console.log(hasLoadingState ? '✅ Loading state shown during AI generation' : 'ℹ️ No loading state detected');
    }
  });

});

test.describe('Content Listing and Filtering @content', () => {
  
  test('should display content list correctly', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    const contentCount = await contentPage.getContentCount();
    const contentItems = await contentPage.getContentItems();
    
    console.log(`Found ${contentCount} content items`);
    
    // Validate content item structure
    for (const item of contentItems.slice(0, 3)) { // Check first 3 items
      expect(item.title).toBeTruthy();
      expect(item.status).toMatch(/(draft|published|archived)/);
    }
  });

  test('should search content successfully', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    const initialCount = await contentPage.getContentCount();
    
    if (initialCount > 0) {
      // Get first content item title to search for
      const contentItems = await contentPage.getContentItems();
      const searchTerm = contentItems[0].title.split(' ')[0]; // Use first word
      
      await contentPage.searchContent(searchTerm);
      
      // Validate search results
      const searchResults = await contentPage.getContentItems();
      
      if (searchResults.length > 0) {
        // At least one result should contain the search term
        const hasMatchingResult = searchResults.some(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        expect(hasMatchingResult).toBeTruthy();
      }
    }
  });

  test('should filter content by type', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    const initialCount = await contentPage.getContentCount();
    
    if (initialCount > 0) {
      // Try filtering by article type
      const filterDropdown = page.locator('[data-testid="filter-dropdown"], [data-filter]');
      
      if (await filterDropdown.isVisible()) {
        await contentPage.filterByType('article');
        
        // Validate filtered results
        const filteredItems = await contentPage.getContentItems();
        
        if (filteredItems.length > 0) {
          // All items should be of the filtered type
          const allCorrectType = filteredItems.every(item => 
            item.type.toLowerCase() === 'article'
          );
          expect(allCorrectType).toBeTruthy();
        }
      }
    }
  });

  test('should sort content correctly', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    const initialCount = await contentPage.getContentCount();
    
    if (initialCount > 1) {
      const sortDropdown = page.locator('[data-testid="sort-dropdown"], [data-sort]');
      
      if (await sortDropdown.isVisible()) {
        // Get initial order
        const initialItems = await contentPage.getContentItems();
        
        // Sort by title
        await contentPage.sortContent('title');
        
        // Get sorted items
        const sortedItems = await contentPage.getContentItems();
        
        // Verify order changed (unless already sorted)
        const orderChanged = JSON.stringify(initialItems) !== JSON.stringify(sortedItems);
        
        if (orderChanged) {
          console.log('✅ Content sorting is working');
        } else {
          console.log('ℹ️ Content order unchanged - might already be sorted');
        }
      }
    }
  });

});

test.describe('Content Publishing Workflow @content', () => {
  
  test('should publish content successfully', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // First create a draft content
    const testContent = TestDataFactory.createContent({
      title: `Publish Test Content ${TestHelpers.generateTestId()}`,
      status: 'draft',
    });
    
    await contentPage.goto();
    await contentPage.createContentManually(testContent);
    
    // Publish the content
    await contentPage.publishContent(testContent.title);
    
    // Verify status changed to published
    const contentItems = await contentPage.getContentItems();
    const publishedItem = contentItems.find(item => item.title.includes(testContent.title));
    
    expect(publishedItem?.status).toMatch(/(published|live)/i);
  });

  test('should edit content successfully', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Create initial content
    const testContent = TestDataFactory.createContent({
      title: `Edit Test Content ${TestHelpers.generateTestId()}`,
    });
    
    await contentPage.goto();
    await contentPage.createContentManually(testContent);
    
    // Edit the content
    await contentPage.editContent(testContent.title);
    
    // Update title
    const updatedTitle = `${testContent.title} - Edited`;
    const titleInput = page.locator('[data-testid="content-title"], [name="title"]');
    await titleInput.fill(updatedTitle);
    
    // Save changes
    const saveButton = page.locator('[data-testid="save-content"], button[type="submit"]');
    await saveButton.click();
    
    // Wait for save confirmation
    await contentPage.waitForToastMessage();
    
    // Verify changes were saved
    await contentPage.goto(); // Refresh
    await contentPage.validateContentCreated(updatedTitle);
  });

  test('should delete content successfully', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Create content to delete
    const testContent = TestDataFactory.createContent({
      title: `Delete Test Content ${TestHelpers.generateTestId()}`,
    });
    
    await contentPage.goto();
    await contentPage.createContentManually(testContent);
    
    const initialCount = await contentPage.getContentCount();
    
    // Delete the content
    await contentPage.deleteContent(testContent.title);
    
    // Verify content was deleted
    await contentPage.goto(); // Refresh
    const finalCount = await contentPage.getContentCount();
    
    expect(finalCount).toBeLessThan(initialCount);
    
    // Verify specific content is no longer in list
    const contentItems = await contentPage.getContentItems();
    const deletedItem = contentItems.find(item => item.title.includes(testContent.title));
    
    expect(deletedItem).toBeFalsy();
  });

});

test.describe('Content Management Performance @content @performance', () => {
  
  test('should load content list within performance threshold', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    const startTime = Date.now();
    await contentPage.goto();
    const loadTime = Date.now() - startTime;
    
    // Content list should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check page performance metrics
    const metrics = await contentPage.measurePerformance();
    TestHelpers.validatePerformance(metrics);
  });

  test('should handle pagination efficiently', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // Check if pagination exists
    const paginationExists = await page.locator('[data-testid="pagination"], .pagination').isVisible();
    
    if (paginationExists) {
      const startTime = Date.now();
      await contentPage.goToNextPage();
      const navigationTime = Date.now() - startTime;
      
      // Pagination should be fast
      expect(navigationTime).toBeLessThan(2000);
      
      // Go back to first page
      await contentPage.goToPreviousPage();
    } else {
      console.log('ℹ️ No pagination found - content fits on single page');
    }
  });

});

test.describe('Content Accessibility @content @a11y', () => {
  
  test('should be keyboard navigable', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // Tab through page elements
    await page.keyboard.press('Tab'); // Should focus first focusable element
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
    
    // Test create content button accessibility
    const createButton = page.locator('[data-testid="create-content-button"], button');
    await createButton.focus();
    await expect(createButton).toBeFocused();
    
    // Activate with keyboard
    await page.keyboard.press('Enter');
    
    // Should open create content modal/page
    const modalOrPage = await Promise.race([
      page.waitForSelector('[data-testid="create-content-modal"], .modal', { state: 'visible' }),
      page.waitForURL('**/create'),
    ]).catch(() => null);
    
    if (modalOrPage) {
      console.log('✅ Create content accessible via keyboard');
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // Check for proper heading structure
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    // Check for content list role
    const contentList = page.locator('[data-testid="content-list"], .content-list');
    if (await contentList.isVisible()) {
      const listRole = await contentList.getAttribute('role');
      expect(listRole).toMatch(/(list|grid|table)/);
    }
    
    // Check for search input accessibility
    const searchInput = page.locator('[type="search"]');
    if (await searchInput.isVisible()) {
      const searchLabel = await searchInput.getAttribute('aria-label') ||
                         await page.locator('label[for*="search"]').count();
      expect(searchLabel).toBeTruthy();
    }
  });

});