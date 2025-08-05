# 첫 번째 콘텐츠 생성하기

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 예상 소요 시간: 10분  
> 난이도: 초급

## 개요

이 튜토리얼에서는 Bespoke AI Suite를 사용하여 첫 번째 AI 콘텐츠를 생성하는 방법을 단계별로 안내합니다. 텍스트, 이미지, 비디오 콘텐츠를 생성하는 기본적인 방법을 배워보겠습니다.

## 사전 준비사항

- Bespoke AI Suite 계정
- API 키 (대시보드에서 발급)
- 기본적인 HTTP 클라이언트 (curl, Postman 등)

## 1단계: API 키 설정

### 대시보드에서 API 키 발급

1. [Bespoke AI Suite 대시보드](https://dashboard.thebespoke-ai.com)에 로그인
2. 설정 > API 키 메뉴로 이동
3. "새 API 키 생성" 클릭
4. 키 이름 입력 (예: "개발용 키")
5. 생성된 키를 안전한 곳에 보관

### 환경 변수 설정

```bash
# Linux/macOS
export BESPOKE_API_KEY="your_api_key_here"

# Windows (PowerShell)
$env:BESPOKE_API_KEY="your_api_key_here"
```

## 2단계: 텍스트 콘텐츠 생성

### 기본 텍스트 생성

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "prompt": {
      "main": "AI 기술이 마케팅에 미치는 영향에 대한 블로그 포스트를 작성해주세요.",
      "style": "professional",
      "tone": "informative"
    }
  }'
```

### 응답 예시

```json
{
  "status": "success",
  "data": {
    "id": "content_abc123",
    "status": "processing",
    "type": "text",
    "created_at": "2025-08-04T10:30:00Z",
    "estimated_completion": "2025-08-04T10:32:00Z"
  }
}
```

### 콘텐츠 상태 확인

```bash
curl -X GET https://api.thebespoke-ai.com/v1/contents/content_abc123 \
  -H "Authorization: Bearer $BESPOKE_API_KEY"
```

### 완성된 콘텐츠 응답

```json
{
  "status": "success",
  "data": {
    "id": "content_abc123",
    "status": "completed",
    "type": "text",
    "title": "AI 혁명: 마케팅의 미래를 재정의하다",
    "body": "인공지능(AI)은 마케팅 산업에 전례 없는 변화를 가져오고 있습니다...",
    "metadata": {
      "word_count": 1523,
      "reading_time": "6 minutes",
      "quality_score": 92
    },
    "created_at": "2025-08-04T10:30:00Z",
    "completed_at": "2025-08-04T10:31:45Z"
  }
}
```

## 3단계: 고급 텍스트 옵션

### SEO 최적화된 콘텐츠

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "prompt": {
      "main": "전자상거래 SEO 가이드",
      "style": "seo-optimized",
      "tone": "helpful",
      "keywords": ["전자상거래 SEO", "온라인 쇼핑몰 최적화", "이커머스 마케팅"],
      "length": 2000
    },
    "options": {
      "language": "ko",
      "format": "markdown",
      "include_meta_description": true,
      "include_headers": true
    }
  }'
```

### 소셜 미디어 콘텐츠

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "prompt": {
      "main": "새로운 제품 출시 소식",
      "style": "social-media",
      "platform": "instagram",
      "hashtags": ["신제품", "혁신", "기술"]
    },
    "options": {
      "include_emojis": true,
      "max_length": 280
    }
  }'
```

## 4단계: 이미지 콘텐츠 생성

### 기본 이미지 생성

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "prompt": {
      "main": "미래적인 사무실에서 AI와 함께 일하는 사람들",
      "style": "photorealistic",
      "mood": "professional, innovative"
    },
    "options": {
      "size": "1920x1080",
      "format": "png"
    }
  }'
```

### 브랜드 스타일 이미지

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "image",
    "prompt": {
      "main": "모던한 테크 스타트업 로고",
      "style": "minimalist",
      "colors": ["#007AFF", "#FFFFFF", "#000000"]
    },
    "options": {
      "size": "512x512",
      "variations": 3,
      "transparent_background": true
    }
  }'
```

## 5단계: 비디오 콘텐츠 생성

### 짧은 프로모션 비디오

```bash
curl -X POST https://api.thebespoke-ai.com/v1/contents \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "prompt": {
      "main": "AI 제품 소개 비디오",
      "script": "Bespoke AI Suite로 콘텐츠 제작의 미래를 경험하세요",
      "style": "modern, tech-focused",
      "duration": 30
    },
    "options": {
      "resolution": "1080p",
      "fps": 30,
      "include_subtitles": true,
      "background_music": "upbeat-tech"
    }
  }'
```

## 6단계: 콘텐츠 다운로드

### 완성된 콘텐츠 다운로드

```bash
# 텍스트 콘텐츠
curl -X GET https://api.thebespoke-ai.com/v1/contents/content_abc123/download \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -o "my-content.md"

# 이미지 콘텐츠
curl -X GET https://api.thebespoke-ai.com/v1/contents/content_def456/download \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -o "my-image.png"
```

## JavaScript/Node.js 예제

### SDK 설치

```bash
npm install @bespoke-ai/sdk
```

### 콘텐츠 생성 코드

```javascript
const BespokeAI = require('@bespoke-ai/sdk');

const client = new BespokeAI({
  apiKey: process.env.BESPOKE_API_KEY
});

async function createContent() {
  try {
    // 텍스트 콘텐츠 생성
    const content = await client.contents.create({
      type: 'text',
      prompt: {
        main: 'AI 마케팅 트렌드 2025',
        style: 'professional',
        tone: 'insightful',
        length: 1500
      }
    });

    console.log('콘텐츠 생성 시작:', content.id);

    // 완성될 때까지 대기
    const completed = await client.contents.waitForCompletion(content.id, {
      pollInterval: 2000, // 2초마다 확인
      timeout: 300000 // 5분 타임아웃
    });

    console.log('콘텐츠 생성 완료!');
    console.log('제목:', completed.title);
    console.log('품질 점수:', completed.metadata.quality_score);

    // 콘텐츠 다운로드
    const downloadUrl = await client.contents.getDownloadUrl(content.id);
    console.log('다운로드 URL:', downloadUrl);

  } catch (error) {
    console.error('에러 발생:', error.message);
  }
}

createContent();
```

## Python 예제

### SDK 설치

```bash
pip install bespoke-ai
```

### 콘텐츠 생성 코드

```python
import os
from bespoke_ai import BespokeAI

client = BespokeAI(api_key=os.getenv('BESPOKE_API_KEY'))

def create_content():
    try:
        # 텍스트 콘텐츠 생성
        content = client.contents.create(
            type='text',
            prompt={
                'main': 'AI 마케팅 트렌드 2025',
                'style': 'professional',
                'tone': 'insightful',
                'length': 1500
            }
        )
        
        print(f'콘텐츠 생성 시작: {content.id}')
        
        # 완성될 때까지 대기
        completed = client.contents.wait_for_completion(
            content.id,
            poll_interval=2,  # 2초마다 확인
            timeout=300  # 5분 타임아웃
        )
        
        print('콘텐츠 생성 완료!')
        print(f'제목: {completed.title}')
        print(f'품질 점수: {completed.metadata.quality_score}')
        
        # 콘텐츠 다운로드
        client.contents.download(content.id, 'my-content.md')
        print('콘텐츠가 다운로드되었습니다.')
        
    except Exception as e:
        print(f'에러 발생: {str(e)}')

if __name__ == '__main__':
    create_content()
```

## 모범 사례

### 1. 명확한 프롬프트 작성

```json
{
  "prompt": {
    "main": "구체적이고 명확한 요청",
    "context": "타겟 독자와 목적 설명",
    "examples": "원하는 스타일의 예시"
  }
}
```

### 2. 적절한 옵션 활용

- **언어**: 타겟 시장에 맞는 언어 선택
- **형식**: 용도에 맞는 형식 (markdown, html, plain)
- **길이**: 플랫폼에 적합한 길이 지정

### 3. 품질 확인

- 생성된 콘텐츠의 품질 점수 확인
- 필요시 재생성 요청
- A/B 테스트를 위한 변형 생성

### 4. 에러 처리

```javascript
try {
  const content = await client.contents.create({...});
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // 잠시 후 재시도
    await sleep(60000);
    return retry();
  }
  // 다른 에러 처리
}
```

## 다음 단계

1. [캠페인 설정 튜토리얼](./campaign-setup.md) - 여러 콘텐츠를 조직화하고 관리하기
2. [API 통합 예제](./api-integration.md) - 애플리케이션에 API 통합하기
3. [웹훅 설정](../api/webhooks.md) - 실시간 알림 받기

## 문제 해결

### 자주 발생하는 문제

**인증 오류 (401)**
- API 키가 올바른지 확인
- Bearer 토큰 형식 확인

**요청 제한 (429)**
- Rate limit 확인
- 요청 간격 조정

**콘텐츠 생성 실패**
- 프롬프트 검증
- 크레딧 잔액 확인

## 지원

- 문서: https://docs.thebespoke-ai.com
- 지원팀: support@thebespoke-ai.com
- 커뮤니티: https://community.thebespoke-ai.com

---

*축하합니다! 첫 번째 AI 콘텐츠를 성공적으로 생성했습니다. 🎉*