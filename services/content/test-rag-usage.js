/**
 * RAG 시스템 활용 예제
 * 평소에 RAG를 어떻게 사용할 수 있는지 보여주는 스크립트
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8081';

// JWT 토큰 생성 (실제로는 로그인 시 받아옴)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MzM0NzA1OTAsImV4cCI6MTczMzQ3NDE5MCwiaXNzIjoiYmVzcG9rZS1haS1jb250ZW50LXNlcnZpY2UifQ.example-token';

console.log('🔍 RAG 시스템 활용 예제\n');

// 1. 개인 문서를 RAG에 추가하기
async function addPersonalDocument() {
  console.log('1️⃣ 개인 문서를 RAG 시스템에 추가하기');
  
  const personalDoc = {
    title: "나의 여행 경험과 팁",
    content: `
    지난 3년간 20개국을 여행하면서 배운 소중한 팁들:
    
    1. 항공권 예약 팁:
       - 화요일 오후 3시경이 가장 저렴
       - 스카이스캐너와 구글 플라이트 동시 비교
       - 경유지를 활용하면 50% 절약 가능
    
    2. 숙소 선택 기준:
       - 지하철역 도보 10분 이내
       - 24시간 편의점 근처
       - 현지인들이 많이 사는 동네
    
    3. 현지 음식 탐방:
       - 줄 서는 맛집보다 동네 맛집
       - 현지인 추천 받기
       - 스트리트 푸드 도전하기
    
    4. 예산 관리:
       - 하루 예산을 현금으로 미리 분리
       - 기념품은 마지막 날에만 구매
       - 무료 액티비티 적극 활용
    `,
    type: "text",
    metadata: {
      category: "여행",
      author: "나",
      tags: ["여행팁", "예산관리", "항공권", "숙소"],
      language: "ko"
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/contents`, personalDoc, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 개인 문서가 RAG 시스템에 추가되었습니다!');
    console.log('📄 문서 ID:', response.data.data.id);
    return response.data.data.id;
  } catch (error) {
    console.error('❌ 문서 추가 실패:', error.response?.data || error.message);
  }
}

// 2. RAG 기반으로 개인화된 콘텐츠 생성하기
async function generatePersonalizedContent() {
  console.log('\n2️⃣ RAG 기반 개인화된 콘텐츠 생성하기');
  
  const contentRequest = {
    title: "동남아시아 배낭여행 가이드",
    type: "text",
    aiGeneration: {
      enabled: true,
      prompt: "동남아시아 배낭여행을 계획 중인 20대를 위한 실용적인 가이드를 작성해주세요. 내 개인적인 여행 경험과 팁을 참고해서 작성해주세요.",
      config: {
        targetAudience: "20대 배낭여행 초보자",
        tone: "친근하고 실용적인",
        usePersonalData: true, // 개인 RAG 데이터 활용
        keywords: ["배낭여행", "동남아시아", "예산여행", "여행팁"]
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/contents`, contentRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 개인화된 콘텐츠가 생성되었습니다!');
    console.log('📝 제목:', response.data.data.title);
    if (response.data.data.body) {
      console.log('\n📄 생성된 콘텐츠 미리보기:');
      console.log('-------------------');
      console.log(response.data.data.body.substring(0, 500) + '...');
      console.log('-------------------');
    }
  } catch (error) {
    console.error('❌ 콘텐츠 생성 실패:', error.response?.data || error.message);
  }
}

// 3. 업무 문서를 RAG에 추가하여 업무 자동화
async function addWorkDocument() {
  console.log('\n3️⃣ 업무 문서를 RAG에 추가하여 업무 자동화');
  
  const workDoc = {
    title: "회사 브랜드 가이드라인",
    content: `
    [회사명] 브랜드 가이드라인

    1. 브랜드 톤앤매너:
       - 전문적이면서도 친근한 톤
       - 고객을 '파트너'로 지칭
       - 기술 용어는 쉽게 풀어서 설명
    
    2. 핵심 메시지:
       - "혁신을 통한 고객 가치 창출"
       - "신뢰할 수 있는 기술 파트너"
       - "함께 성장하는 동반자"
    
    3. 금기 사항:
       - 경쟁사 직접적 비교 금지
       - 과장된 표현 지양
       - 기술적 우월감 표현 금지
    
    4. 선호 표현:
       - "혁신적인" → "실용적인"
       - "최고의" → "신뢰할 수 있는"
       - "완벽한" → "지속적으로 개선하는"
    `,
    type: "text",
    metadata: {
      category: "업무",
      department: "마케팅",
      confidentiality: "내부용",
      tags: ["브랜드", "가이드라인", "톤앤매너"]
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/contents`, workDoc, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 업무 문서가 RAG 시스템에 추가되었습니다!');
    return response.data.data.id;
  } catch (error) {
    console.error('❌ 업무 문서 추가 실패:', error.response?.data || error.message);
  }
}

// 4. RAG 기반으로 업무용 콘텐츠 자동 생성
async function generateWorkContent() {
  console.log('\n4️⃣ RAG 기반 업무용 콘텐츠 자동 생성');
  
  const workContentRequest = {
    title: "신제품 출시 보도자료",
    type: "text",
    aiGeneration: {
      enabled: true,
      prompt: "우리 회사의 새로운 AI 솔루션 출시에 대한 보도자료를 작성해주세요. 회사 브랜드 가이드라인을 준수해서 작성해주세요.",
      config: {
        targetAudience: "언론사 기자들",
        tone: "공식적이면서도 접근하기 쉬운",
        useBrandGuidelines: true,
        keywords: ["AI솔루션", "혁신", "파트너십", "가치창출"]
      }
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/contents`, workContentRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 브랜드 가이드라인을 준수한 보도자료가 생성되었습니다!');
    console.log('📝 제목:', response.data.data.title);
  } catch (error) {
    console.error('❌ 업무 콘텐츠 생성 실패:', error.response?.data || error.message);
  }
}

// 실행
async function runRAGExamples() {
  console.log('🚀 RAG 시스템 활용 예제 시작\n');
  
  // 개인 활용
  await addPersonalDocument();
  await generatePersonalizedContent();
  
  // 업무 활용
  await addWorkDocument();
  await generateWorkContent();
  
  console.log('\n✨ RAG 시스템 활용 예제 완료!');
  console.log('\n💡 이제 당신만의 지식 베이스가 구축되었습니다!');
  console.log('   - 개인 경험과 노하우가 담긴 콘텐츠 자동 생성');
  console.log('   - 회사 브랜드에 맞는 일관성 있는 콘텐츠 제작');
  console.log('   - 시간이 지날수록 더 똑똑해지는 AI 어시스턴트');
}

runRAGExamples().catch(console.error);