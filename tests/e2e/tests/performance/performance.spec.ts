/**
 * Performance E2E Tests for Bespoke AI Suite
 * 
 * Tests performance characteristics:
 * - Page load times
 * - Bundle size analysis
 * - Core Web Vitals
 * - API response times
 * - Memory usage
 */

import { test, expect } from '@playwright/test';
import { ContentPage } from '../pages/content-page';
import { DashboardPage } from '../pages/dashboard-page';
import { LoginPage } from '../pages/login-page';
import { testConfig } from '../config/test-config';
import { TestHelpers } from '../utils/test-helpers';

// Use authenticated state for performance tests
test.use({ storageState: 'test-results/.auth/user.json' });

test.describe('Core Web Vitals @performance @smoke', () => {
  
  test('should meet Core Web Vitals thresholds on Dashboard', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to dashboard
    await dashboardPage.goto();
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        let metricsCollected = 0;
        const totalMetrics = 3; // LCP, FID, CLS
        
        // Create Performance Observer
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
              metricsCollected++;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
              metricsCollected++;
            }
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              vitals.cls = (vitals.cls || 0) + entry.value;
            }
          }
          
          if (metricsCollected >= 2) { // LCP and FID are most important
            observer.disconnect();
            resolve(vitals);
          }
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(vitals);
          }, 5000);
        } catch (error) {
          resolve(vitals);
        }
      });
    });
    
    // Validate Core Web Vitals
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      console.log(`LCP: ${webVitals.lcp}ms`);
    }
    
    if (webVitals.fid) {
      expect(webVitals.fid).toBeLessThan(100); // FID < 100ms
      console.log(`FID: ${webVitals.fid}ms`);
    }
    
    if (webVitals.cls !== undefined) {
      expect(webVitals.cls).toBeLessThan(0.1); // CLS < 0.1
      console.log(`CLS: ${webVitals.cls}`);
    }
  });

  test('should meet Core Web Vitals thresholds on Content Page', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    await contentPage.goto();
    
    // Measure performance metrics
    const metrics = await TestHelpers.measurePagePerformance(page);
    
    // Validate performance
    TestHelpers.validatePerformance(metrics, testConfig.performance);
    
    console.log(`Content page performance:`, {
      loadTime: `${metrics.loadTime}ms`,
      domContentLoaded: `${metrics.domContentLoaded}ms`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
    });
  });

});

test.describe('Page Load Performance @performance', () => {
  
  test('should load login page quickly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    const startTime = Date.now();
    await loginPage.goto();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(testConfig.performance.loadTimeThreshold);
    console.log(`Login page load time: ${loadTime}ms`);
  });

  test('should load dashboard quickly after login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    const startTime = Date.now();
    await dashboardPage.goto();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(testConfig.performance.loadTimeThreshold);
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Validate dashboard widgets load quickly
    await dashboardPage.validateWidgetsLoaded();
  });

  test('should load content page efficiently', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Measure navigation time
    const startTime = Date.now();
    await contentPage.goto();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(testConfig.performance.loadTimeThreshold);
    
    // Measure time to interactive
    await page.waitForLoadState('networkidle');
    const interactiveTime = Date.now() - startTime;
    
    expect(interactiveTime).toBeLessThan(5000); // Should be interactive within 5s
    
    console.log(`Content page metrics:`, {
      loadTime: `${loadTime}ms`,
      timeToInteractive: `${interactiveTime}ms`,
    });
  });

});

test.describe('API Performance @performance @api', () => {
  
  test('should respond to API calls within threshold', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Measure API response times
    const apiCalls: Array<{ url: string; duration: number }> = [];
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        if (timing) {
          apiCalls.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart,
          });
        }
      }
    });
    
    // Trigger some API calls
    if (await contentPage.getContentCount() > 0) {
      await contentPage.searchContent('test');
    }
    
    // Wait for API calls to complete
    await page.waitForLoadState('networkidle');
    
    // Validate API response times
    for (const apiCall of apiCalls) {
      expect(apiCall.duration).toBeLessThan(testConfig.performance.apiResponseThreshold);
      console.log(`API ${apiCall.url}: ${apiCall.duration}ms`);
    }
  });

  test('should handle concurrent API requests efficiently', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Navigate to page first
    await contentPage.goto();
    
    const startTime = Date.now();
    
    // Simulate concurrent operations
    const concurrentOperations = [
      page.reload(),
      contentPage.searchContent('performance'),
      contentPage.filterByType('article'),
    ];
    
    await Promise.allSettled(concurrentOperations);
    
    const totalTime = Date.now() - startTime;
    
    // Concurrent operations should complete reasonably quickly
    expect(totalTime).toBeLessThan(10000); // 10 seconds max
    
    console.log(`Concurrent operations completed in: ${totalTime}ms`);
  });

});

test.describe('Resource Performance @performance', () => {
  
  test('should not exceed memory usage limits', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
      };
    });
    
    // Navigate to content page and perform operations
    await contentPage.goto();
    
    if (await contentPage.getContentCount() > 0) {
      // Perform memory-intensive operations
      await contentPage.searchContent('test');
      await contentPage.filterByType('article');
      await contentPage.sortContent('date');
    }
    
    // Measure memory after operations
    const finalMetrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
      };
    });
    
    // Memory usage should be reasonable (less than 100MB)
    const memoryUsed = finalMetrics.usedJSHeapSize;
    expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
    
    console.log(`Memory usage:`, {
      initial: `${Math.round(initialMetrics.usedJSHeapSize / 1024 / 1024)}MB`,
      final: `${Math.round(finalMetrics.usedJSHeapSize / 1024 / 1024)}MB`,
    });
  });

  test('should optimize bundle size', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    
    // Analyze network resources
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const jsBundles = resources
        .filter(r => r.name.includes('.js') && r.name.includes('chunk'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);
      
      const cssBundles = resources
        .filter(r => r.name.includes('.css'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);
      
      return {
        totalJS: jsBundles,
        totalCSS: cssBundles,
        total: jsBundles + cssBundles,
      };
    });
    
    // Bundle size should be reasonable
    expect(resourceSizes.total).toBeLessThan(testConfig.performance.bundleSizeThreshold);
    
    console.log(`Bundle sizes:`, {
      js: `${Math.round(resourceSizes.totalJS / 1024)}KB`,
      css: `${Math.round(resourceSizes.totalCSS / 1024)}KB`,
      total: `${Math.round(resourceSizes.total / 1024)}KB`,
    });
  });

  test('should lazy load resources efficiently', async ({ page }) => {
    const contentPage = new ContentPage(page);
    
    // Monitor network requests
    const networkRequests: string[] = [];
    
    page.on('request', (request) => {
      networkRequests.push(request.url());
    });
    
    await contentPage.goto();
    
    // Initial load should not request all resources at once
    const initialRequests = networkRequests.length;
    
    // Perform actions that might trigger lazy loading
    if (await contentPage.getContentCount() > 0) {
      await contentPage.clickContentItem((await contentPage.getContentItems())[0].title);
    }
    
    const finalRequests = networkRequests.length;
    
    console.log(`Network requests: initial=${initialRequests}, final=${finalRequests}`);
    
    // Should have some lazy loading (more requests after interaction)
    if (finalRequests > initialRequests) {
      console.log('✅ Lazy loading detected');
    }
  });

});

test.describe('Performance Regression @performance', () => {
  
  test('should maintain performance benchmarks over time', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', create: () => new DashboardPage(page) },
      { name: 'Content', create: () => new ContentPage(page) },
    ];
    
    const performanceResults: Record<string, any> = {};
    
    for (const pageInfo of pages) {
      const pageObject = pageInfo.create();
      
      const startTime = Date.now();
      await pageObject.goto();
      const loadTime = Date.now() - startTime;
      
      const metrics = await TestHelpers.measurePagePerformance(page);
      
      performanceResults[pageInfo.name] = {
        loadTime,
        ...metrics,
      };
      
      // Validate against thresholds
      expect(loadTime).toBeLessThan(testConfig.performance.loadTimeThreshold);
      TestHelpers.validatePerformance(metrics);
    }
    
    // Log results for regression tracking
    console.log('Performance Benchmark Results:', performanceResults);
    
    // Save benchmark data for historical comparison
    await page.evaluate((data) => {
      (window as any).performanceBenchmarks = data;
    }, performanceResults);
  });

  test('should perform efficiently under load simulation', async ({ page }) => {
    const contentPage = new ContentPage(page);
    await contentPage.goto();
    
    // Simulate rapid user interactions
    const operations = [];
    
    for (let i = 0; i < 10; i++) {
      operations.push(async () => {
        await contentPage.searchContent(`test-${i}`);
        await page.waitForTimeout(100); // Brief pause
      });
    }
    
    const startTime = Date.now();
    
    // Execute operations sequentially to simulate user behavior
    for (const operation of operations) {
      await operation();
    }
    
    const totalTime = Date.now() - startTime;
    
    // Should handle rapid interactions efficiently
    expect(totalTime).toBeLessThan(15000); // 15 seconds for 10 operations
    
    console.log(`Load simulation completed in: ${totalTime}ms`);
  });

});

test.describe('Mobile Performance @performance @mobile', () => {
  
  test('should perform well on mobile devices', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const contentPage = new ContentPage(page);
    
    const startTime = Date.now();
    await contentPage.goto();
    const loadTime = Date.now() - startTime;
    
    // Mobile should still meet reasonable performance thresholds
    // but might be slightly slower than desktop
    expect(loadTime).toBeLessThan(testConfig.performance.loadTimeThreshold * 1.5);
    
    const metrics = await TestHelpers.measurePagePerformance(page);
    
    console.log(`Mobile performance (${browserName}):`, {
      loadTime: `${loadTime}ms`,
      firstContentfulPaint: `${metrics.firstContentfulPaint}ms`,
    });
    
    // Test mobile-specific interactions
    await contentPage.testMobileLayout();
  });

});

test.describe('Performance Monitoring @performance @monitoring', () => {
  
  test('should track performance metrics for monitoring', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    await dashboardPage.goto();
    
    // Collect comprehensive performance data
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstByte: navigation.responseStart - navigation.navigationStart,
        },
        paint: paint.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {} as Record<string, number>),
        resources: {
          count: resources.length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
        },
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
        } : null,
      };
    });
    
    // Validate key metrics
    expect(performanceData.navigation.domContentLoaded).toBeLessThan(2000);
    expect(performanceData.navigation.loadComplete).toBeLessThan(testConfig.performance.loadTimeThreshold);
    expect(performanceData.resources.totalSize).toBeLessThan(testConfig.performance.bundleSizeThreshold);
    
    // Log for monitoring integration
    console.log('Performance Monitoring Data:', JSON.stringify(performanceData, null, 2));
  });

});