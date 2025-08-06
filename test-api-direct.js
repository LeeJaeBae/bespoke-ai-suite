const jwt = require('jsonwebtoken');

// Generate a valid JWT token
const token = jwt.sign(
  { 
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'  // Required by auth middleware
  },
  'bespoke-ai-super-secret-key-change-this-in-production',  // Content Service JWT secret
  { 
    expiresIn: '1h',
    issuer: 'bespoke-ai-content-service'  // Required by auth middleware
  }
);

console.log('🔐 JWT Token:', token);

// Simple API test
async function testSimpleContentCreation() {
  console.log('\n🚀 Testing Simple Content Creation...\n');
  
  // Minimal request that should pass validation
  const requestData = {
    type: "text",
    title: "Test Content"
  };

  try {
    const response = await fetch('http://localhost:8081/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Simple content created successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.error('❌ Failed to create content:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during content creation:', error.message);
    return false;
  }
}

// Complex API test
async function testComplexContentCreation() {
  console.log('\n🚀 Testing Complex Content Creation (with AI)...\n');
  
  // Full request with all fields
  const requestData = {
    title: "여름 휴가 준비 가이드",
    description: "2025년 여름 휴가를 위한 완벽한 준비 가이드",
    type: "text",
    platform: "instagram",
    status: "draft",
    tags: ["여행", "여름휴가", "가이드"],
    aiGeneration: {
      enabled: true,
      prompt: "여름 휴가 시즌을 맞아 해외여행 준비 팁에 대한 인스타그램 콘텐츠를 작성해주세요.",
      config: {
        targetAudience: "20-30대 직장인",
        tone: "friendly",
        keywords: ["여행팁", "해외여행", "휴가준비"],
        platform: "instagram",
        type: "text"
      }
    }
  };

  try {
    const response = await fetch('http://localhost:8081/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Complex content created successfully!');
      console.log('📋 Content ID:', result.data.id);
      console.log('📝 Title:', result.data.title);
      console.log('🤖 AI Generated:', result.data.body ? 'Yes' : 'No');
      
      if (result.data.body) {
        console.log('\n📄 Generated Content:');
        console.log('-------------------');
        console.log(result.data.body.substring(0, 300) + '...');
        console.log('-------------------');
      }
      
      return true;
    } else {
      console.error('❌ Failed to create content:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error during content creation:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('====================================');
  console.log('     Direct API Validation Test');
  console.log('====================================');
  
  const simpleTest = await testSimpleContentCreation();
  
  if (simpleTest) {
    const complexTest = await testComplexContentCreation();
    
    if (complexTest) {
      console.log('\n✅ All tests passed! API validation is working correctly.');
    } else {
      console.log('\n⚠️ Complex test failed, but simple test passed. Check AI pipeline.');
    }
  } else {
    console.log('\n❌ Simple test failed. Check API configuration.');
  }
  
  console.log('\n====================================');
}

runTests().catch(console.error);