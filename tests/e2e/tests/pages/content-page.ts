/**
 * Content Page Object for Bespoke AI Suite E2E Tests
 * 
 * Handles all content page interactions:
 * - Content listing and filtering
 * - Content creation
 * - Content editing and publishing
 * - AI generation workflows
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { TestContent } from '../fixtures/test-data';

export class ContentPage extends BasePage {
  // Page elements
  private readonly pageTitle: Locator;
  private readonly createContentButton: Locator;
  private readonly contentList: Locator;
  private readonly contentItems: Locator;
  private readonly filterDropdown: Locator;
  private readonly searchInput: Locator;
  private readonly sortDropdown: Locator;
  private readonly loadingSpinner: Locator;
  private readonly emptyState: Locator;
  private readonly paginationControls: Locator;

  // Content creation modal elements
  private readonly createContentModal: Locator;
  private readonly contentTitleInput: Locator;
  private readonly contentDescriptionInput: Locator;
  private readonly contentTypeSelect: Locator;
  private readonly contentEditor: Locator;
  private readonly aiGenerateButton: Locator;
  private readonly aiPromptInput: Locator;
  private readonly saveContentButton: Locator;
  private readonly publishContentButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.pageTitle = this.getByTestId('page-title').or(this.page.locator('h1'));
    this.createContentButton = this.getByTestId('create-content-button').or(this.getByRole('button', { name: /create.*content/i }));
    this.contentList = this.getByTestId('content-list').or(this.page.locator('.content-list, .content-grid'));
    this.contentItems = this.contentList.locator('[data-testid="content-item"], .content-item');
    this.filterDropdown = this.getByTestId('filter-dropdown').or(this.page.locator('[data-filter]'));
    this.searchInput = this.getByTestId('search-input').or(this.page.locator('[type="search"]'));
    this.sortDropdown = this.getByTestId('sort-dropdown').or(this.page.locator('[data-sort]'));
    this.loadingSpinner = this.getByTestId('loading').or(this.page.locator('.loading, .spinner'));
    this.emptyState = this.getByTestId('empty-state').or(this.page.locator('.empty-state, .no-content'));
    this.paginationControls = this.getByTestId('pagination').or(this.page.locator('.pagination'));

    // Content creation modal
    this.createContentModal = this.getByTestId('create-content-modal').or(this.page.locator('.modal, .dialog'));
    this.contentTitleInput = this.getByTestId('content-title').or(this.page.locator('[name="title"]'));
    this.contentDescriptionInput = this.getByTestId('content-description').or(this.page.locator('[name="description"]'));
    this.contentTypeSelect = this.getByTestId('content-type').or(this.page.locator('[name="type"]'));
    this.contentEditor = this.getByTestId('content-editor').or(this.page.locator('.editor, textarea[name="content"]'));
    this.aiGenerateButton = this.getByTestId('ai-generate').or(this.getByRole('button', { name: /ai.*generate/i }));
    this.aiPromptInput = this.getByTestId('ai-prompt').or(this.page.locator('[name="prompt"]'));
    this.saveContentButton = this.getByTestId('save-content').or(this.getByRole('button', { name: /save/i }));
    this.publishContentButton = this.getByTestId('publish-content').or(this.getByRole('button', { name: /publish/i }));
    this.cancelButton = this.getByTestId('cancel').or(this.getByRole('button', { name: /cancel/i }));
  }

  /**
   * Navigate to content page
   */
  async goto(): Promise<void> {
    await super.goto('/content');
  }

  /**
   * Wait for content page to be ready
   */
  protected async waitForPageReady(): Promise<void> {
    await Promise.all([
      this.pageTitle.waitFor({ state: 'visible' }),
      this.createContentButton.waitFor({ state: 'visible' }),
    ]);

    // Wait for content to load or empty state to show
    await Promise.race([
      this.contentList.waitFor({ state: 'visible' }),
      this.emptyState.waitFor({ state: 'visible' }),
    ]);

    await this.waitForLoadingComplete();
  }

  /**
   * Validate content page elements
   */
  async validateContentPageElements(): Promise<void> {
    // Check page title
    await expect(this.pageTitle).toBeVisible();
    const titleText = await this.pageTitle.textContent();
    expect(titleText).toMatch(/content/i);

    // Check create button
    await expect(this.createContentButton).toBeVisible();

    // Check filtering/search controls if present
    if (await this.searchInput.count() > 0) {
      await expect(this.searchInput).toBeVisible();
    }
  }

  /**
   * Click create content button
   */
  async clickCreateContent(): Promise<void> {
    await this.createContentButton.click();
    
    // Wait for modal to appear or navigation to creation page
    await Promise.race([
      this.createContentModal.waitFor({ state: 'visible' }),
      this.page.waitForURL('**/content/create'),
    ]);
  }

  /**
   * Create content manually
   */
  async createContentManually(content: Partial<TestContent>): Promise<void> {
    await this.clickCreateContent();
    
    // Fill content form
    if (content.title) {
      await this.contentTitleInput.fill(content.title);
    }
    
    if (content.description) {
      await this.contentDescriptionInput.fill(content.description);
    }
    
    if (content.type) {
      await this.contentTypeSelect.selectOption(content.type);
    }
    
    if (content.content) {
      await this.contentEditor.fill(content.content);
    }
    
    // Save content
    await this.saveContentButton.click();
    
    // Wait for success message or content to appear in list
    await Promise.race([
      this.waitForToastMessage(),
      this.page.waitForURL('**/content'),
    ]);
  }

  /**
   * Create content with AI generation
   */
  async createContentWithAI(prompt: string, contentType: string = 'article'): Promise<void> {
    await this.clickCreateContent();
    
    // Select content type
    await this.contentTypeSelect.selectOption(contentType);
    
    // Fill AI prompt
    await this.aiPromptInput.fill(prompt);
    
    // Click AI generate button
    await this.aiGenerateButton.click();
    
    // Wait for AI generation to complete
    await this.waitForAIGeneration();
    
    // Save generated content
    await this.saveContentButton.click();
    
    // Wait for success message
    await this.waitForToastMessage();
  }

  /**
   * Wait for AI generation to complete
   */
  async waitForAIGeneration(): Promise<void> {
    // Wait for loading to start and then complete
    await this.loadingSpinner.waitFor({ state: 'visible' });
    await this.loadingSpinner.waitFor({ state: 'detached', timeout: 30000 }); // AI generation can take time
    
    // Verify content was generated
    const generatedContent = await this.contentEditor.inputValue();
    expect(generatedContent.length).toBeGreaterThan(0);
  }

  /**
   * Get content list items
   */
  async getContentItems(): Promise<Array<{
    title: string;
    status: string;
    type: string;
    createdAt: string;
  }>> {
    const items: Array<{
      title: string;
      status: string;
      type: string;
      createdAt: string;
    }> = [];

    const contentElements = await this.contentItems.all();
    
    for (const item of contentElements) {
      const title = await item.locator('[data-testid="title"], .title').textContent();
      const status = await item.locator('[data-testid="status"], .status').textContent();
      const type = await item.locator('[data-testid="type"], .type').textContent();
      const createdAt = await item.locator('[data-testid="created"], .created-at').textContent();
      
      items.push({
        title: title?.trim() || '',
        status: status?.trim() || '',
        type: type?.trim() || '',
        createdAt: createdAt?.trim() || '',
      });
    }

    return items;
  }

  /**
   * Search for content
   */
  async searchContent(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results to load
    await this.waitForLoadingComplete();
  }

  /**
   * Filter content by type
   */
  async filterByType(type: string): Promise<void> {
    await this.filterDropdown.click();
    
    // Select filter option
    const filterOption = this.page.locator(`[data-testid="filter-${type}"], .filter-option`, { hasText: type });
    await filterOption.click();
    
    // Wait for filtered results
    await this.waitForLoadingComplete();
  }

  /**
   * Sort content
   */
  async sortContent(sortBy: string): Promise<void> {
    await this.sortDropdown.click();
    
    // Select sort option
    const sortOption = this.page.locator(`[data-testid="sort-${sortBy}"], .sort-option`, { hasText: sortBy });
    await sortOption.click();
    
    // Wait for sorted results
    await this.waitForLoadingComplete();
  }

  /**
   * Click on content item to view details
   */
  async clickContentItem(title: string): Promise<void> {
    const contentItem = this.contentItems.filter({ hasText: title }).first();
    await contentItem.click();
    
    // Wait for navigation to content detail page
    await this.page.waitForURL('**/content/**');
  }

  /**
   * Publish content item
   */
  async publishContent(title: string): Promise<void> {
    const contentItem = this.contentItems.filter({ hasText: title }).first();
    const publishButton = contentItem.locator('[data-testid="publish"], .publish-button');
    
    await publishButton.click();
    
    // Wait for confirmation or status update
    await this.waitForToastMessage('published');
  }

  /**
   * Delete content item
   */
  async deleteContent(title: string): Promise<void> {
    const contentItem = this.contentItems.filter({ hasText: title }).first();
    const deleteButton = contentItem.locator('[data-testid="delete"], .delete-button');
    
    await deleteButton.click();
    
    // Handle confirmation dialog
    await this.handleDialog('accept');
    
    // Wait for deletion confirmation
    await this.waitForToastMessage('deleted');
  }

  /**
   * Edit content item
   */
  async editContent(title: string): Promise<void> {
    const contentItem = this.contentItems.filter({ hasText: title }).first();
    const editButton = contentItem.locator('[data-testid="edit"], .edit-button');
    
    await editButton.click();
    
    // Wait for navigation to edit page or modal
    await Promise.race([
      this.page.waitForURL('**/content/**/edit'),
      this.createContentModal.waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Check if content list is empty
   */
  async isContentListEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get content count
   */
  async getContentCount(): Promise<number> {
    if (await this.isContentListEmpty()) {
      return 0;
    }
    
    return await this.contentItems.count();
  }

  /**
   * Navigate to next page if pagination exists
   */
  async goToNextPage(): Promise<void> {
    if (await this.paginationControls.isVisible()) {
      const nextButton = this.paginationControls.locator('[data-testid="next"], .next');
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await this.waitForLoadingComplete();
      }
    }
  }

  /**
   * Navigate to previous page if pagination exists
   */
  async goToPreviousPage(): Promise<void> {
    if (await this.paginationControls.isVisible()) {
      const prevButton = this.paginationControls.locator('[data-testid="prev"], .prev');
      
      if (await prevButton.isEnabled()) {
        await prevButton.click();
        await this.waitForLoadingComplete();
      }
    }
  }

  /**
   * Bulk select content items
   */
  async selectContentItems(titles: string[]): Promise<void> {
    for (const title of titles) {
      const contentItem = this.contentItems.filter({ hasText: title }).first();
      const checkbox = contentItem.locator('[type="checkbox"], .checkbox');
      await checkbox.check();
    }
  }

  /**
   * Bulk delete selected items
   */
  async bulkDeleteSelected(): Promise<void> {
    const bulkDeleteButton = this.page.locator('[data-testid="bulk-delete"], .bulk-delete');
    
    if (await bulkDeleteButton.isVisible()) {
      await bulkDeleteButton.click();
      await this.handleDialog('accept');
      await this.waitForToastMessage('deleted');
    }
  }

  /**
   * Bulk publish selected items
   */
  async bulkPublishSelected(): Promise<void> {
    const bulkPublishButton = this.page.locator('[data-testid="bulk-publish"], .bulk-publish');
    
    if (await bulkPublishButton.isVisible()) {
      await bulkPublishButton.click();
      await this.waitForToastMessage('published');
    }
  }

  /**
   * Validate content was created successfully
   */
  async validateContentCreated(title: string): Promise<void> {
    // Refresh the content list
    await this.refresh();
    
    // Check if content appears in list
    const contentItems = await this.getContentItems();
    const createdContent = contentItems.find(item => item.title.includes(title));
    
    expect(createdContent).toBeTruthy();
    expect(createdContent?.title).toContain(title);
  }

  /**
   * Validate AI-generated content quality
   */
  async validateAIGeneratedContent(): Promise<void> {
    const content = await this.contentEditor.inputValue();
    
    // Basic quality checks for AI-generated content
    expect(content.length).toBeGreaterThan(100); // Minimum content length
    expect(content).not.toContain('Lorem ipsum'); // Should not contain placeholder text
    expect(content.split(' ').length).toBeGreaterThan(20); // Minimum word count
  }

  /**
   * Test content creation workflow end-to-end
   */
  async testCompleteContentWorkflow(content: TestContent): Promise<void> {
    // Create content
    await this.createContentManually(content);
    
    // Validate creation
    await this.validateContentCreated(content.title);
    
    // Edit content
    await this.editContent(content.title);
    
    // Update title
    const updatedTitle = `${content.title} - Updated`;
    await this.contentTitleInput.fill(updatedTitle);
    await this.saveContentButton.click();
    
    // Publish content
    await this.publishContent(updatedTitle);
    
    // Validate final state
    const contentItems = await this.getContentItems();
    const finalContent = contentItems.find(item => item.title.includes(updatedTitle));
    
    expect(finalContent?.status).toMatch(/(published|live)/i);
  }

  /**
   * Test responsive design on mobile
   */
  async testMobileLayout(): Promise<void> {
    // Check if content items are properly displayed on mobile
    const contentItems = await this.getContentItems();
    
    for (const item of contentItems.slice(0, 3)) { // Test first 3 items
      const contentElement = this.contentItems.filter({ hasText: item.title }).first();
      await expect(contentElement).toBeVisible();
      
      // Check if mobile actions menu exists
      const mobileMenu = contentElement.locator('[data-testid="mobile-menu"], .mobile-actions');
      if (await mobileMenu.count() > 0) {
        await mobileMenu.click();
        
        // Verify actions are accessible
        const editAction = this.page.locator('[data-testid="edit-action"], .edit-action');
        await expect(editAction).toBeVisible();
      }
    }
  }
}