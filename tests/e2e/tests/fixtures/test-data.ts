/**
 * Test Data Fixtures for Bespoke AI Suite E2E Tests
 * 
 * Provides reusable test data following Clean Architecture principles:
 * - Domain-specific test data
 * - Factory methods for dynamic data generation
 * - Realistic mock data
 */

import { faker } from '@faker-js/faker';

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'editor';
}

export interface TestContent {
  id?: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'blog' | 'social' | 'email';
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  aiGenerated: boolean;
  metadata?: Record<string, any>;
}

export interface TestCampaign {
  id?: string;
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: {
    ageRange: string;
    interests: string[];
    location: string;
  };
}

export class TestDataFactory {
  /**
   * Generate a random test user
   */
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      email: faker.internet.email(),
      password: 'Test123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: 'user',
      ...overrides,
    };
  }

  /**
   * Generate a random test content
   */
  static createContent(overrides: Partial<TestContent> = {}): TestContent {
    return {
      title: faker.lorem.sentence(6),
      description: faker.lorem.paragraph(2),
      content: faker.lorem.paragraphs(5, '\n\n'),
      type: faker.helpers.arrayElement(['article', 'blog', 'social', 'email']),
      status: 'draft',
      tags: faker.helpers.arrayElements(
        ['technology', 'business', 'marketing', 'ai', 'automation', 'content'],
        { min: 1, max: 3 }
      ),
      aiGenerated: faker.datatype.boolean(),
      metadata: {
        author: faker.person.fullName(),
        createdAt: faker.date.recent().toISOString(),
        estimatedReadTime: faker.number.int({ min: 1, max: 10 }),
      },
      ...overrides,
    };
  }

  /**
   * Generate a random test campaign
   */
  static createCampaign(overrides: Partial<TestCampaign> = {}): TestCampaign {
    const startDate = faker.date.future();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later

    return {
      name: faker.company.name() + ' Campaign',
      description: faker.lorem.paragraph(3),
      budget: faker.number.int({ min: 1000, max: 50000 }),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'draft',
      targetAudience: {
        ageRange: faker.helpers.arrayElement(['18-24', '25-34', '35-44', '45-54', '55+']),
        interests: faker.helpers.arrayElements(
          ['technology', 'business', 'health', 'travel', 'food', 'sports'],
          { min: 2, max: 4 }
        ),
        location: faker.location.country(),
      },
      ...overrides,
    };
  }

  /**
   * Generate multiple test users
   */
  static createUsers(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * Generate multiple test contents
   */
  static createContents(count: number, overrides: Partial<TestContent> = {}): TestContent[] {
    return Array.from({ length: count }, () => this.createContent(overrides));
  }

  /**
   * Generate multiple test campaigns
   */
  static createCampaigns(count: number, overrides: Partial<TestCampaign> = {}): TestCampaign[] {
    return Array.from({ length: count }, () => this.createCampaign(overrides));
  }
}

// Predefined test data for consistent testing
export const predefinedTestData = {
  users: {
    admin: {
      email: 'admin@bespoke.ai',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin' as const,
    },
    regularUser: {
      email: 'user@bespoke.ai',
      password: 'User123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user' as const,
    },
    editor: {
      email: 'editor@bespoke.ai',
      password: 'Editor123!',
      firstName: 'Content',
      lastName: 'Editor',
      role: 'editor' as const,
    },
  },

  content: {
    article: {
      title: 'How AI is Transforming Content Creation',
      description: 'Explore the revolutionary impact of artificial intelligence on modern content creation workflows.',
      content: `# How AI is Transforming Content Creation

Artificial Intelligence is revolutionizing the way we create, manage, and optimize content across all digital platforms. This comprehensive guide explores the current landscape and future possibilities.

## The Current State of AI in Content Creation

Today's AI-powered tools are capable of generating high-quality text, images, and multimedia content that rivals human creativity. From blog posts to social media updates, AI is becoming an indispensable tool for content creators.

## Key Benefits

1. **Speed**: Generate content in minutes rather than hours
2. **Consistency**: Maintain brand voice across all content
3. **Scalability**: Create content for multiple platforms simultaneously
4. **Personalization**: Tailor content for specific audiences

## Future Outlook

As AI technology continues to advance, we can expect even more sophisticated content generation capabilities, including real-time adaptation and advanced personalization features.`,
      type: 'article' as const,
      status: 'draft' as const,
      tags: ['ai', 'content-creation', 'technology'],
      aiGenerated: false,
    },

    blogPost: {
      title: '10 Tips for Better Content Marketing',
      description: 'Proven strategies to improve your content marketing effectiveness and drive better results.',
      content: `# 10 Tips for Better Content Marketing

Content marketing is essential for modern businesses. Here are ten proven strategies to improve your results.

## 1. Know Your Audience
Understanding your target audience is the foundation of successful content marketing.

## 2. Create Valuable Content
Focus on providing real value to your readers rather than just promoting your products.

## 3. Be Consistent
Maintain a regular publishing schedule to keep your audience engaged.

## 4. Use Data to Guide Decisions
Analyze your content performance and adjust your strategy accordingly.

## 5. Optimize for SEO
Ensure your content is discoverable by search engines.

## Continue reading for more tips...`,
      type: 'blog' as const,
      status: 'published' as const,
      tags: ['marketing', 'content-strategy', 'business'],
      aiGenerated: true,
    },
  },

  campaigns: {
    productLaunch: {
      name: 'AI Suite Product Launch Campaign',
      description: 'Comprehensive marketing campaign for the launch of our new AI-powered content suite.',
      budget: 25000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      status: 'draft' as const,
      targetAudience: {
        ageRange: '25-44',
        interests: ['technology', 'business', 'marketing', 'ai'],
        location: 'United States',
      },
    },

    contentMarketing: {
      name: 'Content Marketing Excellence Campaign',
      description: 'Educational campaign focused on helping businesses improve their content marketing strategies.',
      budget: 15000,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(), // 37 days from now
      status: 'active' as const,
      targetAudience: {
        ageRange: '30-54',
        interests: ['marketing', 'business', 'content'],
        location: 'Global',
      },
    },
  },
};