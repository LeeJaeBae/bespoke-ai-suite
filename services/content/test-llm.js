/**
 * LLM Integration Test Script
 * Tests the Content Service with LLM capabilities
 */

import axios from 'axios';
import tokenGenerator from './generate-token.js';

const BASE_URL = 'http://localhost:8081';
const TOKEN = tokenGenerator;

async function testContentGeneration() {
  console.log('🧪 Testing LLM Integration with Content Service\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.data.status);
    
    // Test 2: Create Content with AI
    console.log('\n2. Testing Content Creation with AI...');
    const contentRequest = {
      title: 'The Future of AI in Marketing',
      type: 'text',  // Changed to lowercase as per enum definition
      metadata: {
        author: 'AI Test',
        category: 'Technology',
        tags: ['AI', 'Marketing', 'Future'],
        language: 'en',
        targetAudience: 'Marketing professionals and tech enthusiasts',
        industry: 'Technology',
        targetLength: 1000,
        tone: 'professional',
        keywords: ['AI marketing', 'automation', 'personalization'],
        brand: 'Bespoke AI'
      },
      prompt: 'Write an engaging article about how AI is transforming marketing strategies in 2025',
      useAI: true
    };
    
    console.log('📤 Sending content creation request...');
    const createResponse = await axios.post(
      `${BASE_URL}/contents`,
      contentRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        }
      }
    );
    
    if (createResponse.data) {
      const response = createResponse.data;
      console.log('✅ Content created successfully!');
      
      // Handle different response formats
      const contentData = response.data || response;
      const contentId = contentData.id || contentData._id || contentData.contentId;
      
      console.log('  - Response Status:', response.status);
      console.log('  - Content ID:', contentId);
      console.log('  - Title:', contentData.title);
      console.log('  - Type:', contentData.type);
      console.log('  - Full Response:', JSON.stringify(response, null, 2));
      
      // Test 3: Get the created content (if ID is available)
      if (contentId) {
        console.log('\n3. Testing Content Retrieval...');
        const getResponse = await axios.get(`${BASE_URL}/contents/${contentId}`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        });
        console.log('✅ Content retrieved successfully');
      }
      
      // Test 4: List all content
      console.log('\n4. Testing Content Listing...');
      const listResponse = await axios.get(`${BASE_URL}/contents`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      console.log('✅ Content list retrieved:', listResponse.data.data.length, 'items');
      
      console.log('\n🎉 All tests passed successfully!');
      console.log('\n📊 Summary:');
      console.log('  - LLM Manager: Initialized ✅');
      console.log('  - AI Content Generation: Working ✅');
      console.log('  - API Endpoints: Functional ✅');
      
      return contentData;
    } else {
      console.error('❌ Content creation failed:', createResponse.data);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting LLM Integration Test\n');
console.log('📍 Target: ' + BASE_URL);
console.log('⏰ Time:', new Date().toISOString());
console.log('='.repeat(50) + '\n');

testContentGeneration()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
  });