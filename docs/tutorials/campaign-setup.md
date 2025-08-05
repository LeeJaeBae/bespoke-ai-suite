# 캠페인 설정 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 예상 소요 시간: 20분  
> 난이도: 중급

## 개요

이 튜토리얼에서는 Bespoke AI Suite의 캠페인 기능을 사용하여 여러 콘텐츠를 조직화하고, 성과를 추적하며, A/B 테스트를 수행하는 방법을 알아봅니다. 효과적인 AI 기반 마케팅 캠페인을 구축하는 단계별 가이드입니다.

## 학습 목표

- 캠페인 생성 및 설정
- 콘텐츠 일정 관리
- A/B 테스트 설정
- 성과 모니터링
- 캠페인 최적화

## 사전 준비사항

- Bespoke AI Suite Pro 이상 계정
- API 키
- 기본적인 마케팅 캠페인 이해

## 1단계: 첫 번째 캠페인 생성

### 대시보드에서 캠페인 생성

1. [캠페인 대시보드](https://dashboard.thebespoke-ai.com/campaigns) 접속
2. "새 캠페인" 버튼 클릭
3. 캠페인 정보 입력:
   - 이름: "2025 여름 프로모션"
   - 목표: "브랜드 인지도 향상"
   - 기간: 2025-06-01 ~ 2025-08-31

### API를 통한 캠페인 생성

```bash
curl -X POST https://api.thebespoke-ai.com/v1/campaigns \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2025 여름 프로모션",
    "type": "multi_channel",
    "objectives": {
      "primary": "brand_awareness",
      "secondary": ["engagement", "lead_generation"]
    },
    "target_audience": {
      "demographics": {
        "age_range": [25, 45],
        "gender": "all",
        "location": ["KR", "US", "JP"]
      },
      "interests": ["technology", "lifestyle", "innovation"]
    },
    "budget": {
      "total": 50000,
      "currency": "USD"
    },
    "schedule": {
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-08-31T23:59:59Z",
      "timezone": "Asia/Seoul"
    }
  }'
```

### 응답 예시

```json
{
  "status": "success",
  "data": {
    "id": "campaign_789xyz",
    "name": "2025 여름 프로모션",
    "status": "draft",
    "created_at": "2025-08-04T10:45:00Z",
    "dashboard_url": "https://dashboard.thebespoke-ai.com/campaigns/campaign_789xyz"
  }
}
```

## 2단계: 콘텐츠 계획 수립

### 콘텐츠 캘린더 생성

```bash
curl -X POST https://api.thebespoke-ai.com/v1/campaigns/campaign_789xyz/content-plan \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content_types": {
      "blog_posts": {
        "frequency": "weekly",
        "count": 12
      },
      "social_media": {
        "frequency": "daily",
        "platforms": ["instagram", "twitter", "linkedin"],
        "count": 90
      },
      "email_newsletters": {
        "frequency": "bi-weekly",
        "count": 6
      },
      "videos": {
        "frequency": "monthly",
        "count": 3
      }
    },
    "themes": [
      "innovation",
      "summer_lifestyle",
      "product_highlights",
      "customer_success"
    ]
  }'
```

### 자동 콘텐츠 생성 일정

```javascript
const BespokeAI = require('@bespoke-ai/sdk');
const client = new BespokeAI({ apiKey: process.env.BESPOKE_API_KEY });

async function scheduleContentGeneration() {
  const campaign = await client.campaigns.get('campaign_789xyz');
  
  // 주간 블로그 포스트 예약
  for (let week = 1; week <= 12; week++) {
    const publishDate = new Date('2025-06-01');
    publishDate.setDate(publishDate.getDate() + (week - 1) * 7);
    
    await client.contents.create({
      campaign_id: campaign.id,
      type: 'text',
      scheduled_for: publishDate.toISOString(),
      prompt: {
        main: `Week ${week}: Summer tech trends and innovations`,
        style: 'blog-post',
        tone: 'engaging',
        length: 1500
      },
      auto_publish: true
    });
  }
  
  console.log('콘텐츠 일정이 생성되었습니다.');
}
```

## 3단계: A/B 테스트 설정

### 이메일 제목 A/B 테스트

```bash
curl -X POST https://api.thebespoke-ai.com/v1/campaigns/campaign_789xyz/ab-tests \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "이메일 제목 최적화",
    "type": "email_subject",
    "variants": [
      {
        "name": "A",
        "subject": "🚀 이번 여름, AI와 함께 비즈니스를 혁신하세요",
        "weight": 50
      },
      {
        "name": "B",
        "subject": "귀사의 마케팅 효율을 10배 높이는 방법",
        "weight": 50
      }
    ],
    "metrics": ["open_rate", "click_rate", "conversion_rate"],
    "sample_size": 1000,
    "confidence_level": 0.95
  }'
```

### 콘텐츠 스타일 A/B 테스트

```javascript
async function createContentABTest() {
  // 변형 A: 전문적인 톤
  const variantA = await client.contents.create({
    campaign_id: 'campaign_789xyz',
    type: 'text',
    variant_group: 'style_test_001',
    variant_name: 'professional',
    prompt: {
      main: 'AI 마케팅 자동화의 이점',
      style: 'professional',
      tone: 'authoritative'
    }
  });

  // 변형 B: 친근한 톤
  const variantB = await client.contents.create({
    campaign_id: 'campaign_789xyz',
    type: 'text',
    variant_group: 'style_test_001',
    variant_name: 'casual',
    prompt: {
      main: 'AI 마케팅 자동화의 이점',
      style: 'conversational',
      tone: 'friendly'
    }
  });

  // A/B 테스트 설정
  const abTest = await client.campaigns.createABTest({
    campaign_id: 'campaign_789xyz',
    name: '콘텐츠 톤 테스트',
    variants: [variantA.id, variantB.id],
    split_ratio: [50, 50],
    success_metric: 'engagement_rate'
  });

  console.log('A/B 테스트가 시작되었습니다:', abTest.id);
}
```

## 4단계: 멀티채널 캠페인 실행

### 채널별 콘텐츠 최적화

```python
import bespoke_ai
from datetime import datetime, timedelta

client = bespoke_ai.Client(api_key=os.getenv('BESPOKE_API_KEY'))

def create_multichannel_content(campaign_id, topic):
    channels = {
        'blog': {
            'type': 'text',
            'style': 'long-form',
            'length': 1500,
            'seo_optimized': True
        },
        'instagram': {
            'type': 'text',
            'style': 'social-media',
            'max_length': 2200,
            'include_hashtags': True,
            'include_emojis': True
        },
        'twitter': {
            'type': 'text',
            'style': 'social-media',
            'max_length': 280,
            'thread_enabled': True
        },
        'linkedin': {
            'type': 'text',
            'style': 'professional-social',
            'max_length': 3000
        },
        'youtube': {
            'type': 'video',
            'duration': 180,
            'style': 'educational'
        }
    }
    
    contents = {}
    for channel, config in channels.items():
        content = client.contents.create(
            campaign_id=campaign_id,
            type=config['type'],
            channel=channel,
            prompt={
                'main': topic,
                'adapt_for_channel': True,
                **config
            }
        )
        contents[channel] = content
    
    return contents

# 주제별 멀티채널 콘텐츠 생성
topics = [
    "AI가 바꾸는 마케팅의 미래",
    "데이터 기반 의사결정의 중요성",
    "개인화 마케팅 전략 가이드"
]

for topic in topics:
    contents = create_multichannel_content('campaign_789xyz', topic)
    print(f"'{topic}' 콘텐츠가 모든 채널에 생성되었습니다.")
```

## 5단계: 성과 모니터링

### 실시간 대시보드 설정

```javascript
// 웹소켓을 통한 실시간 모니터링
const WebSocket = require('ws');

function monitorCampaignPerformance(campaignId) {
  const ws = new WebSocket('wss://api.thebespoke-ai.com/v1/campaigns/stream');
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'subscribe',
      campaign_id: campaignId,
      metrics: ['impressions', 'clicks', 'conversions', 'roi'],
      interval: 'real-time'
    }));
  });
  
  ws.on('message', (data) => {
    const performance = JSON.parse(data);
    console.log('실시간 성과:', performance);
    
    // 성과 기반 자동 조정
    if (performance.ctr < 0.02) {
      console.log('CTR이 낮습니다. 콘텐츠 최적화를 시작합니다...');
      optimizeContent(campaignId);
    }
  });
}

async function optimizeContent(campaignId) {
  // 저성과 콘텐츠 식별
  const underperforming = await client.campaigns.getUnderperformingContent(campaignId);
  
  for (const content of underperforming) {
    // 새로운 변형 생성
    await client.contents.regenerate(content.id, {
      improve_based_on: 'performance_data',
      optimization_goal: 'increase_ctr'
    });
  }
}
```

### 주간 성과 리포트

```python
def generate_weekly_report(campaign_id):
    # 주간 데이터 수집
    performance = client.campaigns.get_performance(
        campaign_id,
        start_date=datetime.now() - timedelta(days=7),
        end_date=datetime.now(),
        metrics=['all']
    )
    
    # 주요 인사이트 생성
    insights = client.analytics.generate_insights(performance)
    
    # 리포트 생성
    report = client.contents.create(
        type='text',
        prompt={
            'main': f'주간 캠페인 성과 리포트 생성',
            'data': performance,
            'insights': insights,
            'style': 'executive-summary',
            'include_recommendations': True
        }
    )
    
    return report

# 매주 월요일 자동 실행
import schedule

schedule.every().monday.at("09:00").do(
    lambda: generate_weekly_report('campaign_789xyz')
)
```

## 6단계: 캠페인 최적화

### 자동 최적화 설정

```bash
curl -X POST https://api.thebespoke-ai.com/v1/campaigns/campaign_789xyz/optimization \
  -H "Authorization: Bearer $BESPOKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_optimize": true,
    "optimization_goals": {
      "primary": "maximize_roi",
      "constraints": {
        "min_quality_score": 80,
        "max_cost_per_conversion": 50
      }
    },
    "strategies": [
      "content_personalization",
      "timing_optimization",
      "audience_segmentation",
      "creative_testing"
    ],
    "ml_models": {
      "predictive_analytics": true,
      "sentiment_analysis": true,
      "conversion_prediction": true
    }
  }'
```

### 수동 최적화 전략

```javascript
async function manualOptimization(campaignId) {
  // 1. 최고 성과 콘텐츠 분석
  const topPerformers = await client.campaigns.getTopContent(campaignId, {
    limit: 10,
    metric: 'engagement_rate'
  });
  
  // 2. 성공 패턴 추출
  const patterns = await client.analytics.extractPatterns(topPerformers);
  
  // 3. 새로운 콘텐츠에 패턴 적용
  const optimizedContent = await client.contents.create({
    campaign_id: campaignId,
    type: 'text',
    prompt: {
      main: '새로운 제품 소개',
      apply_patterns: patterns,
      optimization_hints: {
        tone: patterns.successful_tone,
        structure: patterns.successful_structure,
        keywords: patterns.high_performing_keywords
      }
    }
  });
  
  console.log('최적화된 콘텐츠 생성 완료:', optimizedContent.id);
}
```

## 7단계: 고급 기능 활용

### 다이나믹 콘텐츠 개인화

```python
def create_personalized_campaign(campaign_id, audience_segments):
    for segment in audience_segments:
        # 세그먼트별 페르소나 생성
        persona = client.personas.create({
            'name': segment['name'],
            'demographics': segment['demographics'],
            'interests': segment['interests'],
            'pain_points': segment['pain_points']
        })
        
        # 페르소나 기반 콘텐츠 생성
        content_batch = client.contents.create_batch([
            {
                'campaign_id': campaign_id,
                'type': 'text',
                'persona_id': persona.id,
                'prompt': {
                    'main': 'AI 솔루션 소개',
                    'personalize_for': persona.id,
                    'address_pain_points': True
                }
            }
            for _ in range(5)  # 각 페르소나당 5개 변형
        ])
        
        print(f"{segment['name']} 세그먼트용 콘텐츠 생성 완료")
```

### 크로스 캠페인 학습

```javascript
async function crossCampaignLearning() {
  // 과거 성공 캠페인 분석
  const successfulCampaigns = await client.campaigns.list({
    filter: {
      roi: { $gt: 2.0 },
      status: 'completed'
    },
    limit: 10
  });
  
  // 성공 요인 추출
  const successFactors = await client.analytics.analyzeSuccessFactors(
    successfulCampaigns.map(c => c.id)
  );
  
  // 새 캠페인에 적용
  const newCampaign = await client.campaigns.create({
    name: '학습 기반 캠페인',
    apply_learnings: successFactors,
    auto_adapt: true
  });
  
  return newCampaign;
}
```

## 모범 사례

### 1. 명확한 목표 설정
- SMART 목표 (구체적, 측정가능, 달성가능, 관련성, 시간제한)
- KPI 우선순위 정의
- 성공 지표 사전 정의

### 2. 타겟 오디언스 세분화
```json
{
  "segments": [
    {
      "name": "얼리어답터",
      "characteristics": ["기술 친화적", "혁신 추구"],
      "content_preference": "detailed, technical"
    },
    {
      "name": "실용주의자",
      "characteristics": ["ROI 중시", "사례 연구 선호"],
      "content_preference": "case-studies, data-driven"
    }
  ]
}
```

### 3. 콘텐츠 다양성
- 형식 다양화 (텍스트, 이미지, 비디오)
- 톤 & 스타일 변화
- 플랫폼별 최적화

### 4. 지속적인 테스트
- A/B 테스트 상시 운영
- 다변량 테스트 활용
- 통계적 유의성 확보

### 5. 데이터 기반 의사결정
```javascript
// 의사결정 자동화 예시
if (campaign.metrics.ctr < benchmark.ctr * 0.8) {
  await adjustStrategy('increase_personalization');
} else if (campaign.metrics.conversion_rate < target.conversion_rate) {
  await adjustStrategy('optimize_landing_pages');
}
```

## 문제 해결

### 낮은 참여율
1. 콘텐츠 품질 점검
2. 타이밍 최적화
3. 타겟 오디언스 재검토
4. 메시지 A/B 테스트

### 예산 초과
1. 자동 예산 제한 설정
2. 비용 효율적인 채널 우선순위
3. 저성과 콘텐츠 조기 중단

### 기술적 문제
```bash
# 캠페인 상태 확인
curl -X GET https://api.thebespoke-ai.com/v1/campaigns/campaign_789xyz/health

# 로그 확인
curl -X GET https://api.thebespoke-ai.com/v1/campaigns/campaign_789xyz/logs
```

## 다음 단계

1. [API 통합 예제](./api-integration.md) - 기존 시스템과 통합
2. [고급 분석](../guides/analytics-guide.md) - 심층 데이터 분석
3. [자동화 워크플로우](../guides/automation-workflows.md) - 완전 자동화 구축

## 체크리스트

- [ ] 캠페인 목표 설정
- [ ] 타겟 오디언스 정의
- [ ] 콘텐츠 계획 수립
- [ ] A/B 테스트 설정
- [ ] 모니터링 대시보드 구성
- [ ] 최적화 전략 수립
- [ ] 성과 리뷰 일정 설정

---

*성공적인 AI 기반 캠페인 운영을 축하드립니다! 🎯*