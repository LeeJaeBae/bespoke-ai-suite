/**
 * API Integration E2E Tests for Bespoke AI Suite
 * 
 * Tests direct API interactions:
 * - Content Service API
 * - User Service API
 * - Authentication API
 * - Error handling
 * - Performance testing
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { testConfig, testUsers } from '../config/test-config';
import { TestDataFactory, predefinedTestData } from '../fixtures/test-data';
import { APIHelpers, TestHelpers } from '../utils/test-helpers';

let apiContext: APIRequestContext;
let authToken: string;

test.describe.configure({ mode: 'serial' }); // Run API tests in sequence

test.describe('API Authentication @api @auth', () => {

  test.beforeAll(async ({ playwright }) => {
    // Create API request context
    apiContext = await playwright.request.newContext({
      baseURL: testConfig.services.content.url,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  });

  test.afterAll(async () => {
    // Clean up API context
    await apiContext.dispose();
  });

  test('should authenticate user via API', async () => {
    // Login via User Service API
    const loginResponse = await apiContext.post(`${testConfig.services.user.url}/api/auth/login`, {
      data: {
        email: testUsers.user.email,
        password: testUsers.user.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeTruthy();
    expect(loginData.user.email).toBe(testUsers.user.email);
    
    // Store token for subsequent tests
    authToken = loginData.token;
  });

  test('should reject invalid credentials', async () => {
    const loginResponse = await apiContext.post(`${testConfig.services.user.url}/api/auth/login`, {
      data: {
        email: 'invalid@email.com',
        password: 'wrongpassword',
      },
    });

    expect(loginResponse.status()).toBe(401);
    
    const errorData = await loginResponse.json();
    expect(errorData.error).toBeTruthy();
  });

  test('should validate token authentication', async () => {
    // Use token to access protected endpoint
    const profileResponse = await apiContext.get(`${testConfig.services.user.url}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(profileResponse.ok()).toBeTruthy();
    
    const profileData = await profileResponse.json();
    expect(profileData.user.email).toBe(testUsers.user.email);
  });

});

test.describe('Content Service API @api @content', () => {

  let createdContentId: string;

  test('should create content via API', async () => {
    const testContent = TestDataFactory.createContent({
      title: `API Test Content ${TestHelpers.generateTestId()}`,
      type: 'article',
      status: 'draft',
    });

    const createResponse = await apiContext.post('/api/content', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: testContent,
    });

    expect(createResponse.ok()).toBeTruthy();
    
    const createdContent = await createResponse.json();
    expect(createdContent.data.title).toBe(testContent.title);
    expect(createdContent.data.type).toBe(testContent.type);
    
    createdContentId = createdContent.data.id;
  });

  test('should retrieve content list via API', async () => {
    const listResponse = await apiContext.get('/api/content', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    
    const contentList = await listResponse.json();
    expect(Array.isArray(contentList.data)).toBeTruthy();
    expect(contentList.data.length).toBeGreaterThan(0);
    
    // Verify our created content is in the list
    const ourContent = contentList.data.find((item: any) => item.id === createdContentId);
    expect(ourContent).toBeTruthy();
  });

  test('should retrieve single content via API', async () => {
    const getResponse = await apiContext.get(`/api/content/${createdContentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    
    const contentData = await getResponse.json();
    expect(contentData.data.id).toBe(createdContentId);
  });

  test('should update content via API', async () => {
    const updatedTitle = `Updated API Content ${TestHelpers.generateTestId()}`;
    
    const updateResponse = await apiContext.put(`/api/content/${createdContentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        title: updatedTitle,
        status: 'published',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    
    const updatedContent = await updateResponse.json();
    expect(updatedContent.data.title).toBe(updatedTitle);
    expect(updatedContent.data.status).toBe('published');
  });

  test('should filter content by type via API', async () => {
    const filterResponse = await apiContext.get('/api/content?type=article', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(filterResponse.ok()).toBeTruthy();
    
    const filteredContent = await filterResponse.json();
    expect(Array.isArray(filteredContent.data)).toBeTruthy();
    
    // All items should be articles
    if (filteredContent.data.length > 0) {
      const allArticles = filteredContent.data.every((item: any) => item.type === 'article');
      expect(allArticles).toBeTruthy();
    }
  });

  test('should search content via API', async () => {
    const searchResponse = await apiContext.get(`/api/content?search=API`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(searchResponse.ok()).toBeTruthy();
    
    const searchResults = await searchResponse.json();
    expect(Array.isArray(searchResults.data)).toBeTruthy();
    
    // Results should contain search term
    if (searchResults.data.length > 0) {
      const hasMatchingResult = searchResults.data.some((item: any) => 
        item.title.toLowerCase().includes('api')
      );
      expect(hasMatchingResult).toBeTruthy();
    }
  });

  test('should paginate content via API', async () => {
    const paginatedResponse = await apiContext.get('/api/content?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(paginatedResponse.ok()).toBeTruthy();
    
    const paginatedData = await paginatedResponse.json();
    expect(Array.isArray(paginatedData.data)).toBeTruthy();
    expect(paginatedData.data.length).toBeLessThanOrEqual(5);
    
    // Should have pagination metadata
    expect(paginatedData.meta).toBeTruthy();
    expect(paginatedData.meta.page).toBe(1);
    expect(paginatedData.meta.limit).toBe(5);
  });

  test('should delete content via API', async () => {
    const deleteResponse = await apiContext.delete(`/api/content/${createdContentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    
    // Verify content is deleted
    const getResponse = await apiContext.get(`/api/content/${createdContentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(getResponse.status()).toBe(404);
  });

});

test.describe('AI Content Generation API @api @ai', () => {

  test('should generate content with AI via API', async () => {
    const aiRequest = {
      prompt: 'Write a short article about the benefits of automated testing',
      type: 'article',
      tone: 'professional',
    };

    const generateResponse = await apiContext.post('/api/content/generate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: aiRequest,
    });

    expect(generateResponse.ok()).toBeTruthy();
    
    const generatedContent = await generateResponse.json();
    expect(generatedContent.data.title).toBeTruthy();
    expect(generatedContent.data.content).toBeTruthy();
    expect(generatedContent.data.content.length).toBeGreaterThan(100);
    
    // Verify AI metadata
    expect(generatedContent.data.aiGenerated).toBe(true);
    expect(generatedContent.data.metadata.prompt).toBe(aiRequest.prompt);
  });

  test('should handle invalid AI generation requests', async () => {
    const invalidRequest = {
      prompt: '', // Empty prompt
      type: 'invalid-type',
    };

    const generateResponse = await apiContext.post('/api/content/generate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: invalidRequest,
    });

    expect(generateResponse.status()).toBe(400);
    
    const errorData = await generateResponse.json();
    expect(errorData.error).toBeTruthy();
  });

  test('should timeout AI generation appropriately', async () => {
    const complexRequest = {
      prompt: 'Write a comprehensive 5000-word research paper on quantum computing applications in artificial intelligence with detailed technical explanations and references',
      type: 'article',
    };

    const startTime = Date.now();
    
    const generateResponse = await apiContext.post('/api/content/generate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: complexRequest,
      timeout: 30000, // 30 second timeout
    });

    const duration = Date.now() - startTime;
    
    // Should either succeed within timeout or return appropriate error
    if (generateResponse.ok()) {
      expect(duration).toBeLessThan(30000);
      const generatedContent = await generateResponse.json();
      expect(generatedContent.data.content).toBeTruthy();
    } else {
      expect(generateResponse.status()).toBe(408); // Request timeout
    }
  });

});

test.describe('API Error Handling @api @error', () => {

  test('should handle unauthorized requests', async () => {
    const unauthorizedResponse = await apiContext.get('/api/content', {
      // No Authorization header
    });

    expect(unauthorizedResponse.status()).toBe(401);
    
    const errorData = await unauthorizedResponse.json();
    expect(errorData.error).toBeTruthy();
    expect(errorData.error.code).toMatch(/(UNAUTHORIZED|AUTH_REQUIRED)/i);
  });

  test('should handle invalid content ID', async () => {
    const invalidId = 'invalid-id-12345';
    
    const notFoundResponse = await apiContext.get(`/api/content/${invalidId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(notFoundResponse.status()).toBe(404);
    
    const errorData = await notFoundResponse.json();
    expect(errorData.error.code).toMatch(/(NOT_FOUND|RESOURCE_NOT_FOUND)/i);
  });

  test('should validate request payload', async () => {
    const invalidPayload = {
      // Missing required fields
      description: 'Test description',
    };

    const validationResponse = await apiContext.post('/api/content', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: invalidPayload,
    });

    expect(validationResponse.status()).toBe(400);
    
    const errorData = await validationResponse.json();
    expect(errorData.error.code).toMatch(/(VALIDATION_ERROR|BAD_REQUEST)/i);
    expect(errorData.error.details).toBeTruthy();
  });

  test('should handle malformed JSON', async () => {
    const malformedResponse = await apiContext.post('/api/content', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: '{ invalid json }',
    });

    expect(malformedResponse.status()).toBe(400);
  });

  test('should handle rate limiting', async () => {
    // Simulate rapid requests to test rate limiting
    const requests = Array(10).fill(null).map(() =>
      apiContext.get('/api/content', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
    );

    const responses = await Promise.allSettled(requests);
    
    // At least some requests should succeed
    const successfulRequests = responses.filter(
      r => r.status === 'fulfilled' && r.value.ok()
    );
    
    expect(successfulRequests.length).toBeGreaterThan(0);
    
    // Check if any requests were rate limited
    const rateLimitedRequests = responses.filter(
      r => r.status === 'fulfilled' && r.value.status() === 429
    );
    
    if (rateLimitedRequests.length > 0) {
      console.log('✅ Rate limiting is implemented');
    } else {
      console.log('ℹ️ No rate limiting detected - consider implementing for production');
    }
  });

});

test.describe('API Performance @api @performance', () => {

  test('should respond within acceptable time limits', async () => {
    const endpoints = [
      '/api/content',
      '/health',
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await apiContext.get(endpoint, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      });

      const responseTime = Date.now() - startTime;
      
      expect(response.ok() || response.status() === 401).toBeTruthy();
      expect(responseTime).toBeLessThan(testConfig.performance.apiResponseThreshold);
      
      console.log(`${endpoint}: ${responseTime}ms`);
    }
  });

  test('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = Array(5).fill(null).map(() =>
      apiContext.get('/api/content', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
    );

    const startTime = Date.now();
    const responses = await Promise.all(concurrentRequests);
    const totalTime = Date.now() - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });

    // Concurrent requests should be faster than sequential
    expect(totalTime).toBeLessThan(5000); // 5 seconds max for 5 concurrent requests
    
    console.log(`5 concurrent requests completed in ${totalTime}ms`);
  });

  test('should handle large response payloads efficiently', async () => {
    // Request large content list
    const largeListResponse = await apiContext.get('/api/content?limit=100', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(largeListResponse.ok()).toBeTruthy();
    
    // Check response size
    const responseText = await largeListResponse.text();
    const responseSize = Buffer.byteLength(responseText, 'utf8');
    
    console.log(`Large response size: ${responseSize} bytes`);
    
    // Response should be reasonable size (less than 10MB)
    expect(responseSize).toBeLessThan(10 * 1024 * 1024);
  });

});

test.describe('API Security @api @security', () => {

  test('should implement CORS properly', async () => {
    const corsResponse = await apiContext.fetch('/api/content', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3005',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // Should allow CORS for frontend origin
    const corsHeaders = corsResponse.headers();
    expect(corsHeaders['access-control-allow-origin']).toBeTruthy();
    expect(corsHeaders['access-control-allow-methods']).toContain('POST');
  });

  test('should sanitize input data', async () => {
    const maliciousInput = {
      title: '<script>alert("xss")</script>',
      description: 'javascript:alert("xss")',
      content: '<img src="x" onerror="alert(1)">',
    };

    const createResponse = await apiContext.post('/api/content', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      data: maliciousInput,
    });

    if (createResponse.ok()) {
      const createdContent = await createResponse.json();
      
      // Content should be sanitized
      expect(createdContent.data.title).not.toContain('<script>');
      expect(createdContent.data.description).not.toContain('javascript:');
      expect(createdContent.data.content).not.toContain('onerror');
    }
  });

  test('should protect against SQL injection', async () => {
    const sqlInjectionAttempt = "'; DROP TABLE content; --";
    
    const searchResponse = await apiContext.get(`/api/content?search=${encodeURIComponent(sqlInjectionAttempt)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Should handle gracefully without server error
    expect(searchResponse.status()).not.toBe(500);
    
    if (searchResponse.ok()) {
      const searchResults = await searchResponse.json();
      expect(Array.isArray(searchResults.data)).toBeTruthy();
    }
  });

  test('should validate JWT tokens properly', async () => {
    const invalidToken = 'invalid.jwt.token';
    
    const invalidTokenResponse = await apiContext.get('/api/content', {
      headers: {
        'Authorization': `Bearer ${invalidToken}`,
      },
    });

    expect(invalidTokenResponse.status()).toBe(401);
    
    const errorData = await invalidTokenResponse.json();
    expect(errorData.error.code).toMatch(/(INVALID_TOKEN|UNAUTHORIZED)/i);
  });

});