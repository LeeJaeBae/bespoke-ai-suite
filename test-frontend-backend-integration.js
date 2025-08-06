const jwt = require('jsonwebtoken');

// JWT 토큰 생성
const token = jwt.sign(
  { 
    sub: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
  },
  'bespoke-ai-super-secret-key-change-this-in-production',
  { 
    expiresIn: '1h',
    issuer: 'bespoke-ai-content-service'
  }
);

console.log('🔐 JWT Token generated:', token);

// AI 콘텐츠 생성 테스트
async function testAIContentGeneration() {
  console.log('\n🚀 Testing AI Content Generation...\n');
  
  const requestData = {
    title: "여름 휴가 준비 가이드",
    description: "2025년 여름 휴가를 위한 완벽한 준비 가이드",
    type: "text",
    platform: "instagram",
    status: "draft",
    tags: ["여행", "여름휴가", "가이드"],
    aiGeneration: {
      enabled: true,
      prompt: "여름 휴가 시즌을 맞아 해외여행 준비 팁에 대한 인스타그램 콘텐츠를 작성해주세요. 비행기 예약, 숙소 선택, 짐 싸기 팁 등을 포함해주세요.",
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
      console.log('✅ Content created successfully!');
      console.log('📋 Content ID:', result.data.id);
      console.log('📝 Title:', result.data.title);
      console.log('🤖 AI Generated:', result.data.body ? 'Yes' : 'No');
      
      if (result.data.body) {
        console.log('\n📄 Generated Content:');
        console.log('-------------------');
        console.log(result.data.body.substring(0, 500) + '...');
        console.log('-------------------');
      }
      
      if (result.data.metadata?.qualityScore) {
        console.log('\n📊 Quality Score:', result.data.metadata.qualityScore);
      }
      
      if (result.data.metadata?.aiPipeline) {
        console.log('\n🔄 AI Pipeline Steps:');
        result.data.metadata.aiPipeline.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step.agent}: ${step.status}`);
        });
      }
      
      return result.data;
    } else {
      console.error('❌ Failed to create content:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error during content creation:', error.message);
    return null;
  }
}

// 콘텐츠 목록 조회 테스트
async function testFetchContents() {
  console.log('\n📋 Testing Fetch Contents...\n');
  
  try {
    const response = await fetch('http://localhost:8081/contents?page=1&limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Contents fetched successfully!');
      console.log('📊 Total contents:', result.data.total || result.data.length);
      
      const contents = result.data.items || result.data.contents || result.data;
      if (Array.isArray(contents) && contents.length > 0) {
        console.log('\n📝 Recent Contents:');
        contents.slice(0, 3).forEach((content, index) => {
          console.log(`  ${index + 1}. ${content.title} (${content.status})`);
        });
      }
      
      return result.data;
    } else {
      console.error('❌ Failed to fetch contents:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error during content fetch:', error.message);
    return null;
  }
}

// Frontend API 통합 테스트
async function testFrontendIntegration() {
  console.log('\n🌐 Testing Frontend Integration...\n');
  
  try {
    // Frontend가 실행 중인지 확인
    const frontendResponse = await fetch('http://localhost:3005/');
    if (frontendResponse.ok) {
      console.log('✅ Frontend is running on http://localhost:3005');
    } else {
      console.log('⚠️ Frontend might not be running on port 3005');
    }
  } catch (error) {
    console.log('⚠️ Could not connect to frontend:', error.message);
  }
}

// 실행
async function runIntegrationTests() {
  console.log('====================================');
  console.log('  Frontend-Backend Integration Test');
  console.log('====================================');
  
  // 1. AI 콘텐츠 생성 테스트
  const createdContent = await testAIContentGeneration();
  
  // 2. 콘텐츠 목록 조회 테스트
  await testFetchContents();
  
  // 3. Frontend 통합 확인
  await testFrontendIntegration();
  
  console.log('\n====================================');
  console.log('  Integration Test Complete!');
  console.log('====================================');
  console.log('\n📱 Open http://localhost:3005/content in your browser');
  console.log('🔑 Use this token for authentication:', token);
  console.log('\n💡 To test the full flow:');
  console.log('   1. Open the frontend in your browser');
  console.log('   2. Click "콘텐츠 생성" button');
  console.log('   3. Enable AI generation toggle');
  console.log('   4. Fill in the form and submit');
  console.log('   5. Watch the AI generate content!');
}

// 테스트 실행
runIntegrationTests().catch(console.error);