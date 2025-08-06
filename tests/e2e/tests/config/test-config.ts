/**
 * Test Configuration for Bespoke AI Suite E2E Tests
 * 
 * Centralizes all test configuration following Clean Architecture principles:
 * - Environment-specific settings
 * - Service endpoints
 * - Test data configuration
 * - Timeout and retry settings
 */

export interface TestConfig {
  frontend: {
    url: string;
    timeout: number;
  };
  services: {
    content: {
      url: string;
      timeout: number;
    };
    user: {
      url: string;
      timeout: number;
    };
    campaign: {
      url: string;
      timeout: number;
    };
    analytics: {
      url: string;
      timeout: number;
    };
  };
  auth: {
    tokenExpiry: number;
    refreshThreshold: number;
  };
  test: {
    retries: number;
    timeout: number;
    slowMo: number;
    headless: boolean;
  };
  performance: {
    loadTimeThreshold: number;
    apiResponseThreshold: number;
    bundleSizeThreshold: number;
  };
}

const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

export const testConfig: TestConfig = {
  frontend: {
    url: getEnv('FRONTEND_URL', 'http://localhost:3005'),
    timeout: parseInt(getEnv('FRONTEND_TIMEOUT', '30000')),
  },
  
  services: {
    content: {
      url: getEnv('CONTENT_SERVICE_URL', 'http://localhost:8081'),
      timeout: parseInt(getEnv('CONTENT_SERVICE_TIMEOUT', '10000')),
    },
    user: {
      url: getEnv('USER_SERVICE_URL', 'http://localhost:8082'),
      timeout: parseInt(getEnv('USER_SERVICE_TIMEOUT', '10000')),
    },
    campaign: {
      url: getEnv('CAMPAIGN_SERVICE_URL', 'http://localhost:8083'),
      timeout: parseInt(getEnv('CAMPAIGN_SERVICE_TIMEOUT', '10000')),
    },
    analytics: {
      url: getEnv('ANALYTICS_SERVICE_URL', 'http://localhost:8084'),
      timeout: parseInt(getEnv('ANALYTICS_SERVICE_TIMEOUT', '10000')),
    },
  },
  
  auth: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
  },
  
  test: {
    retries: parseInt(getEnv('TEST_RETRIES', '2')),
    timeout: parseInt(getEnv('TEST_TIMEOUT', '30000')),
    slowMo: parseInt(getEnv('SLOW_MO', '0')),
    headless: getEnv('HEADLESS', 'true') === 'true',
  },
  
  performance: {
    loadTimeThreshold: parseInt(getEnv('LOAD_TIME_THRESHOLD', '3000')), // 3 seconds
    apiResponseThreshold: parseInt(getEnv('API_RESPONSE_THRESHOLD', '1000')), // 1 second
    bundleSizeThreshold: parseInt(getEnv('BUNDLE_SIZE_THRESHOLD', '2000000')), // 2MB
  },
};

export const testUsers = {
  admin: {
    email: getEnv('TEST_ADMIN_EMAIL', 'admin@bespoke.ai'),
    password: getEnv('TEST_ADMIN_PASSWORD', 'AdminTest123!'),
    role: 'admin',
  },
  user: {
    email: getEnv('TEST_USER_EMAIL', 'user@bespoke.ai'),
    password: getEnv('TEST_USER_PASSWORD', 'UserTest123!'),
    role: 'user',
  },
  editor: {
    email: getEnv('TEST_EDITOR_EMAIL', 'editor@bespoke.ai'),
    password: getEnv('TEST_EDITOR_PASSWORD', 'EditorTest123!'),
    role: 'editor',
  },
};

export const testData = {
  content: {
    title: 'Test Content Title',
    description: 'This is a test content description for E2E testing',
    tags: ['test', 'e2e', 'automation'],
    type: 'article',
    status: 'draft',
  },
  campaign: {
    name: 'Test Campaign',
    description: 'Test campaign for E2E testing',
    budget: 1000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
};