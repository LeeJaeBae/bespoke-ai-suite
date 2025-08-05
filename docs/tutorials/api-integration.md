# API 통합 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 예상 소요 시간: 30분  
> 난이도: 중급-고급

## 개요

이 가이드에서는 Bespoke AI Suite API를 기존 애플리케이션에 통합하는 방법을 상세히 다룹니다. RESTful API와 GraphQL API 모두를 활용하여 강력한 AI 기능을 애플리케이션에 추가하는 방법을 알아봅니다.

## 학습 목표

- API 인증 및 보안 설정
- SDK를 활용한 빠른 통합
- 웹훅을 통한 실시간 업데이트
- 에러 처리 및 재시도 로직
- 성능 최적화 기법

## 사전 준비사항

- Bespoke AI Suite API 키
- 프로그래밍 언어 기본 지식 (JavaScript, Python, Go 중 하나)
- HTTP/REST API 기본 이해
- 선택사항: GraphQL 기본 지식

## 1. API 인증 설정

### API 키 관리

```javascript
// 환경 변수를 통한 안전한 API 키 관리
// .env 파일
BESPOKE_API_KEY=sk_live_your_api_key_here
BESPOKE_API_SECRET=your_secret_key_here

// Node.js에서 사용
require('dotenv').config();

const config = {
  apiKey: process.env.BESPOKE_API_KEY,
  apiSecret: process.env.BESPOKE_API_SECRET,
  baseURL: 'https://api.bespoke-ai.com/v1'
};
```

### Bearer 토큰 인증

```python
import os
import requests
from requests.auth import HTTPBearerAuth

class BespokeAPIClient:
    def __init__(self):
        self.api_key = os.getenv('BESPOKE_API_KEY')
        self.base_url = 'https://api.bespoke-ai.com/v1'
        self.session = requests.Session()
        self.session.auth = HTTPBearerAuth(self.api_key)
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'BespokeAI-Python/1.0'
        })
    
    def make_request(self, method, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()
```

## 2. SDK 초기화 및 설정

### JavaScript/TypeScript SDK

```typescript
// 설치
// npm install @bespoke-ai/sdk

import { BespokeAI, Configuration } from '@bespoke-ai/sdk';

// 기본 설정
const configuration = new Configuration({
  apiKey: process.env.BESPOKE_API_KEY,
  // 선택적 설정
  maxRetries: 3,
  timeout: 30000, // 30초
  rateLimitRetry: true
});

const client = new BespokeAI(configuration);

// 고급 설정
const advancedClient = new BespokeAI({
  apiKey: process.env.BESPOKE_API_KEY,
  // 커스텀 HTTP 클라이언트
  httpClient: axios.create({
    timeout: 60000,
    proxy: {
      host: 'proxy.company.com',
      port: 8080
    }
  }),
  // 커스텀 에러 핸들러
  errorHandler: (error) => {
    console.error('API Error:', error);
    // 커스텀 에러 처리 로직
  }
});
```

### Python SDK

```python
# 설치
# pip install bespoke-ai

from bespoke_ai import BespokeAI, Configuration
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)

# 기본 설정
config = Configuration(
    api_key=os.getenv('BESPOKE_API_KEY'),
    max_retries=3,
    timeout=30,
    rate_limit_retry=True
)

client = BespokeAI(configuration=config)

# 비동기 클라이언트
import asyncio
from bespoke_ai.async_client import AsyncBespokeAI

async_client = AsyncBespokeAI(configuration=config)

async def create_content_async():
    content = await async_client.contents.create(
        type='text',
        prompt={'main': 'AI 마케팅 트렌드'}
    )
    return content
```

### Go SDK

```go
// 설치
// go get github.com/bespoke-ai/go-sdk

package main

import (
    "context"
    "log"
    "os"
    
    bespoke "github.com/bespoke-ai/go-sdk"
)

func main() {
    // 클라이언트 초기화
    client := bespoke.NewClient(
        bespoke.WithAPIKey(os.Getenv("BESPOKE_API_KEY")),
        bespoke.WithMaxRetries(3),
        bespoke.WithTimeout(30),
    )
    
    // 컨텍스트 설정
    ctx := context.Background()
    
    // API 호출
    content, err := client.Contents.Create(ctx, &bespoke.CreateContentRequest{
        Type: "text",
        Prompt: &bespoke.Prompt{
            Main: "AI 마케팅 트렌드",
        },
    })
    
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Content created: %s", content.ID)
}
```

## 3. 핵심 API 통합 패턴

### 콘텐츠 생성 워크플로우

```javascript
class ContentManager {
  constructor(client) {
    this.client = client;
    this.queue = [];
  }

  async createContentWithRetry(params, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 콘텐츠 생성
        const content = await this.client.contents.create(params);
        
        // 완성 대기
        const completed = await this.waitForCompletion(content.id);
        
        // 품질 검증
        if (completed.metadata.quality_score < 80) {
          console.log('품질 점수가 낮습니다. 재생성합니다...');
          return this.regenerateContent(content.id);
        }
        
        return completed;
        
      } catch (error) {
        lastError = error;
        
        if (error.code === 'RATE_LIMITED') {
          // Rate limit 처리
          const waitTime = error.retry_after || Math.pow(2, attempt) * 1000;
          console.log(`Rate limited. ${waitTime}ms 후 재시도...`);
          await this.sleep(waitTime);
          continue;
        }
        
        if (error.code === 'INTERNAL_ERROR' && attempt < maxRetries) {
          // 서버 에러는 재시도
          console.log(`서버 에러. 재시도 ${attempt}/${maxRetries}...`);
          await this.sleep(1000 * attempt);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  async waitForCompletion(contentId, options = {}) {
    const {
      pollInterval = 2000,
      timeout = 300000,
      onProgress = null
    } = options;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const content = await this.client.contents.get(contentId);
      
      if (onProgress) {
        onProgress(content);
      }
      
      if (content.status === 'completed') {
        return content;
      }
      
      if (content.status === 'failed') {
        throw new Error(`Content generation failed: ${content.error}`);
      }
      
      await this.sleep(pollInterval);
    }
    
    throw new Error('Content generation timeout');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 사용 예시
const contentManager = new ContentManager(client);

const content = await contentManager.createContentWithRetry({
  type: 'text',
  prompt: {
    main: 'AI 마케팅 자동화 가이드',
    style: 'professional',
    length: 2000
  }
}, 5);
```

### 배치 처리 최적화

```python
import asyncio
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor

class BatchProcessor:
    def __init__(self, client, max_concurrent=10):
        self.client = client
        self.max_concurrent = max_concurrent
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent)
    
    async def process_batch(self, items: List[Dict[str, Any]]) -> List[Any]:
        """대량 콘텐츠 생성을 위한 배치 처리"""
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def process_item(item):
            async with semaphore:
                try:
                    # 콘텐츠 생성
                    content = await self.client.contents.create(**item)
                    
                    # 완성 대기
                    completed = await self._wait_for_completion(content.id)
                    
                    return {
                        'status': 'success',
                        'content': completed,
                        'original_request': item
                    }
                except Exception as e:
                    return {
                        'status': 'error',
                        'error': str(e),
                        'original_request': item
                    }
        
        # 모든 항목을 동시에 처리
        tasks = [process_item(item) for item in items]
        results = await asyncio.gather(*tasks)
        
        # 결과 분석
        successful = [r for r in results if r['status'] == 'success']
        failed = [r for r in results if r['status'] == 'error']
        
        print(f"성공: {len(successful)}, 실패: {len(failed)}")
        
        # 실패한 항목 재시도
        if failed:
            retry_results = await self._retry_failed(failed)
            results.extend(retry_results)
        
        return results
    
    async def _retry_failed(self, failed_items, max_retries=3):
        """실패한 항목 재시도"""
        retry_results = []
        
        for item in failed_items:
            for attempt in range(max_retries):
                try:
                    content = await self.client.contents.create(
                        **item['original_request']
                    )
                    completed = await self._wait_for_completion(content.id)
                    
                    retry_results.append({
                        'status': 'success',
                        'content': completed,
                        'original_request': item['original_request'],
                        'retry_count': attempt + 1
                    })
                    break
                    
                except Exception as e:
                    if attempt == max_retries - 1:
                        retry_results.append({
                            'status': 'failed',
                            'error': str(e),
                            'original_request': item['original_request'],
                            'retry_count': attempt + 1
                        })
                    else:
                        await asyncio.sleep(2 ** attempt)  # 지수 백오프
        
        return retry_results

# 사용 예시
processor = BatchProcessor(client, max_concurrent=20)

# 100개의 콘텐츠 생성 요청
batch_requests = [
    {
        'type': 'text',
        'prompt': {
            'main': f'마케팅 팁 #{i+1}',
            'style': 'social-media',
            'platform': 'instagram'
        }
    }
    for i in range(100)
]

results = await processor.process_batch(batch_requests)
```

## 4. 웹훅 통합

### 웹훅 서버 구현

```javascript
const express = require('express');
const crypto = require('crypto');

class WebhookServer {
  constructor(secret) {
    this.secret = secret;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Raw body 필요 (서명 검증용)
    this.app.use(express.raw({ type: 'application/json' }));
  }

  setupRoutes() {
    this.app.post('/webhooks/bespoke', async (req, res) => {
      try {
        // 서명 검증
        if (!this.verifySignature(req)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        // 이벤트 파싱
        const event = JSON.parse(req.body);
        
        // 비동기 처리를 위해 즉시 응답
        res.status(200).json({ received: true });

        // 이벤트 처리 (비동기)
        this.processEvent(event).catch(error => {
          console.error('Event processing error:', error);
        });

      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  verifySignature(req) {
    const signature = req.headers['x-bespoke-signature'];
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(req.body)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  async processEvent(event) {
    console.log(`Processing event: ${event.event}`);

    switch (event.event) {
      case 'content.completed':
        await this.handleContentCompleted(event.data);
        break;
      
      case 'content.failed':
        await this.handleContentFailed(event.data);
        break;
      
      case 'campaign.performance_updated':
        await this.handleCampaignUpdate(event.data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }
  }

  async handleContentCompleted(data) {
    // 완성된 콘텐츠 처리
    console.log(`Content completed: ${data.content.id}`);
    
    // 데이터베이스 업데이트
    await db.contents.update(data.content.id, {
      status: 'completed',
      download_url: data.content.download_url,
      quality_score: data.content.metadata.quality_score
    });

    // 사용자에게 알림
    await notificationService.send({
      user_id: data.user_id,
      message: `콘텐츠 "${data.content.title}"가 준비되었습니다!`
    });
  }

  async handleContentFailed(data) {
    // 실패 처리
    console.error(`Content failed: ${data.content.id}`, data.error);
    
    // 자동 재시도
    if (data.retry_count < 3) {
      await contentService.retry(data.content.id);
    } else {
      // 최종 실패 처리
      await notificationService.sendError({
        user_id: data.user_id,
        message: `콘텐츠 생성 실패: ${data.error.message}`
      });
    }
  }

  async handleCampaignUpdate(data) {
    // 캠페인 성과 업데이트
    const performance = data.performance;
    
    // 성과 분석
    if (performance.metrics.ctr < 0.01) {
      // CTR이 낮으면 자동 최적화
      await campaignService.optimize(data.campaign.id, {
        focus: 'increase_ctr',
        method: 'content_variation'
      });
    }
    
    // 대시보드 업데이트
    await dashboardService.updateMetrics(data.campaign.id, performance);
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Webhook server listening on port ${port}`);
    });
  }
}

// 서버 시작
const webhookServer = new WebhookServer(process.env.WEBHOOK_SECRET);
webhookServer.start();
```

### 웹훅 보안 강화

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import json
import redis
from datetime import datetime, timedelta

class SecureWebhookHandler:
    def __init__(self, secret, redis_client):
        self.secret = secret
        self.redis = redis_client
        self.app = Flask(__name__)
        self.setup_routes()
    
    def setup_routes(self):
        @self.app.route('/webhooks/bespoke', methods=['POST'])
        def handle_webhook():
            # IP 화이트리스트 검증
            if not self._verify_ip(request.remote_addr):
                return jsonify({'error': 'Unauthorized IP'}), 403
            
            # 서명 검증
            if not self._verify_signature(request):
                return jsonify({'error': 'Invalid signature'}), 401
            
            # 이벤트 파싱
            event = request.get_json()
            
            # 중복 방지
            if self._is_duplicate(event['id']):
                return jsonify({'status': 'already_processed'}), 200
            
            # Rate limiting
            if not self._check_rate_limit(request.remote_addr):
                return jsonify({'error': 'Rate limited'}), 429
            
            # 이벤트 큐에 추가
            self._queue_event(event)
            
            return jsonify({'status': 'accepted'}), 200
    
    def _verify_ip(self, ip):
        """IP 화이트리스트 확인"""
        allowed_ips = [
            '52.89.214.238',
            '34.212.75.30',
            '54.218.53.128'
        ]
        return ip in allowed_ips
    
    def _verify_signature(self, request):
        """HMAC 서명 검증"""
        signature = request.headers.get('X-Bespoke-Signature')
        if not signature:
            return False
        
        payload = request.get_data()
        expected = hmac.new(
            self.secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return f'sha256={expected}' == signature
    
    def _is_duplicate(self, event_id):
        """중복 이벤트 확인"""
        key = f'webhook:event:{event_id}'
        if self.redis.exists(key):
            return True
        
        # 24시간 동안 이벤트 ID 저장
        self.redis.setex(key, 86400, '1')
        return False
    
    def _check_rate_limit(self, ip):
        """Rate limiting 확인"""
        key = f'webhook:rate:{ip}'
        current = self.redis.incr(key)
        
        if current == 1:
            # 첫 요청이면 TTL 설정 (1분)
            self.redis.expire(key, 60)
        
        # 분당 100개 요청 제한
        return current <= 100
    
    def _queue_event(self, event):
        """이벤트를 처리 큐에 추가"""
        self.redis.lpush('webhook:queue', json.dumps(event))
        
        # 워커 프로세스가 큐를 처리
        # celery나 rq 같은 태스크 큐 사용 가능

# 사용 예시
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)
handler = SecureWebhookHandler(
    secret=os.getenv('WEBHOOK_SECRET'),
    redis_client=redis_client
)

if __name__ == '__main__':
    handler.app.run(port=3000)
```

## 5. GraphQL 통합

### GraphQL 클라이언트 설정

```javascript
import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-tag';

class BespokeGraphQLClient {
  constructor(apiKey) {
    this.client = new GraphQLClient('https://api.bespoke-ai.com/graphql', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async createContent(input) {
    const mutation = gql`
      mutation CreateContent($input: CreateContentInput!) {
        createContent(input: $input) {
          id
          status
          type
          createdAt
          estimatedCompletion
        }
      }
    `;

    const variables = { input };
    const data = await this.client.request(mutation, variables);
    return data.createContent;
  }

  async getContentWithCampaign(contentId) {
    const query = gql`
      query GetContent($id: ID!) {
        content(id: $id) {
          id
          title
          body
          status
          qualityScore
          campaign {
            id
            name
            performance {
              impressions
              clicks
              ctr
              conversions
            }
          }
          createdBy {
            id
            email
            subscription {
              plan
            }
          }
        }
      }
    `;

    const variables = { id: contentId };
    const data = await this.client.request(query, variables);
    return data.content;
  }

  async subscribeToContentUpdates(contentId, onUpdate) {
    const subscription = gql`
      subscription ContentUpdates($contentId: ID!) {
        contentStatusUpdated(contentId: $contentId) {
          id
          status
          title
          qualityScore
          downloadUrl
        }
      }
    `;

    // WebSocket 연결 설정
    const wsClient = new SubscriptionClient(
      'wss://api.bespoke-ai.com/graphql',
      {
        reconnect: true,
        connectionParams: {
          authToken: this.apiKey,
        },
      }
    );

    const observable = wsClient.request({
      query: subscription,
      variables: { contentId },
    });

    const subscription = observable.subscribe({
      next: (data) => onUpdate(data.contentStatusUpdated),
      error: (err) => console.error('Subscription error:', err),
      complete: () => console.log('Subscription complete'),
    });

    return subscription;
  }
}

// 사용 예시
const graphqlClient = new BespokeGraphQLClient(process.env.BESPOKE_API_KEY);

// 콘텐츠 생성 및 실시간 업데이트 구독
async function createAndMonitorContent() {
  const content = await graphqlClient.createContent({
    type: 'TEXT',
    prompt: {
      main: 'GraphQL API 튜토리얼',
      style: 'technical',
    },
  });

  console.log('Content created:', content.id);

  // 실시간 업데이트 구독
  const subscription = await graphqlClient.subscribeToContentUpdates(
    content.id,
    (update) => {
      console.log('Content updated:', update);
      
      if (update.status === 'completed') {
        console.log('Content completed! Download URL:', update.downloadUrl);
        subscription.unsubscribe();
      }
    }
  );
}
```

### 복잡한 GraphQL 쿼리

```python
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
import asyncio

class GraphQLIntegration:
    def __init__(self, api_key):
        transport = AIOHTTPTransport(
            url='https://api.bespoke-ai.com/graphql',
            headers={'Authorization': f'Bearer {api_key}'}
        )
        self.client = Client(transport=transport, fetch_schema_from_transport=True)
    
    async def get_dashboard_data(self, user_id):
        """대시보드용 종합 데이터 조회"""
        query = gql("""
            query DashboardData($userId: ID!) {
              user(id: $userId) {
                id
                name
                email
                subscription {
                  plan
                  expiresAt
                  features
                }
                usage {
                  contentsCreated
                  contentsLimit
                  percentageUsed
                }
              }
              
              recentContents: contents(
                createdBy: $userId
                first: 10
                orderBy: CREATED_AT_DESC
              ) {
                edges {
                  node {
                    id
                    title
                    type
                    status
                    qualityScore
                    createdAt
                  }
                }
                totalCount
              }
              
              activeCampaigns: campaigns(
                createdBy: $userId
                status: ACTIVE
                first: 5
              ) {
                edges {
                  node {
                    id
                    name
                    performance {
                      impressions
                      clicks
                      conversions
                      roi
                    }
                    budget {
                      total
                      spent
                      remaining
                    }
                  }
                }
              }
              
              analytics {
                contentPerformance(period: LAST_30_DAYS) {
                  averageQualityScore
                  totalGenerated
                  successRate
                }
                
                campaignPerformance(period: LAST_30_DAYS) {
                  averageROI
                  totalConversions
                  totalRevenue
                }
              }
            }
        """)
        
        variables = {"userId": user_id}
        result = await self.client.execute_async(query, variable_values=variables)
        return result
    
    async def batch_content_operations(self, operations):
        """배치 뮤테이션 실행"""
        mutation = gql("""
            mutation BatchOperations($operations: [ContentOperation!]!) {
              batchContentOperations(operations: $operations) {
                successful {
                  id
                  status
                }
                failed {
                  index
                  error
                }
              }
            }
        """)
        
        variables = {"operations": operations}
        result = await self.client.execute_async(mutation, variable_values=variables)
        return result['batchContentOperations']

# 사용 예시
async def main():
    client = GraphQLIntegration(os.getenv('BESPOKE_API_KEY'))
    
    # 대시보드 데이터 조회
    dashboard_data = await client.get_dashboard_data('user_123')
    print(f"사용자: {dashboard_data['user']['name']}")
    print(f"구독 플랜: {dashboard_data['user']['subscription']['plan']}")
    print(f"최근 콘텐츠: {dashboard_data['recentContents']['totalCount']}개")
    
    # 배치 작업
    batch_result = await client.batch_content_operations([
        {
            'type': 'CREATE',
            'input': {
                'type': 'TEXT',
                'prompt': {'main': '콘텐츠 1'}
            }
        },
        {
            'type': 'UPDATE',
            'id': 'content_456',
            'input': {'title': '업데이트된 제목'}
        },
        {
            'type': 'DELETE',
            'id': 'content_789'
        }
    ])
    
    print(f"성공: {len(batch_result['successful'])}")
    print(f"실패: {len(batch_result['failed'])}")

asyncio.run(main())
```

## 6. 고급 통합 패턴

### 마이크로서비스 통합

```go
package bespokeintegration

import (
    "context"
    "fmt"
    "sync"
    "time"
    
    "github.com/bespoke-ai/go-sdk"
    "github.com/go-redis/redis/v8"
    "github.com/sirupsen/logrus"
)

type ContentService struct {
    client      *bespoke.Client
    cache       *redis.Client
    logger      *logrus.Logger
    workerPool  chan struct{}
}

func NewContentService(apiKey string, redisAddr string) *ContentService {
    return &ContentService{
        client: bespoke.NewClient(bespoke.WithAPIKey(apiKey)),
        cache: redis.NewClient(&redis.Options{
            Addr: redisAddr,
        }),
        logger: logrus.New(),
        workerPool: make(chan struct{}, 10), // 최대 10개 동시 작업
    }
}

// 캐싱을 활용한 콘텐츠 조회
func (s *ContentService) GetContent(ctx context.Context, id string) (*bespoke.Content, error) {
    // 캐시 확인
    cacheKey := fmt.Sprintf("content:%s", id)
    cached, err := s.cache.Get(ctx, cacheKey).Result()
    if err == nil {
        // 캐시 히트
        var content bespoke.Content
        if err := json.Unmarshal([]byte(cached), &content); err == nil {
            s.logger.Info("Cache hit for content ", id)
            return &content, nil
        }
    }
    
    // API 호출
    content, err := s.client.Contents.Get(ctx, id)
    if err != nil {
        return nil, err
    }
    
    // 캐시 저장 (5분간)
    data, _ := json.Marshal(content)
    s.cache.Set(ctx, cacheKey, data, 5*time.Minute)
    
    return content, nil
}

// 비동기 콘텐츠 생성 with 워커 풀
func (s *ContentService) CreateContentAsync(
    ctx context.Context,
    requests []bespoke.CreateContentRequest,
) <-chan ContentResult {
    results := make(chan ContentResult, len(requests))
    var wg sync.WaitGroup
    
    for _, req := range requests {
        wg.Add(1)
        go func(r bespoke.CreateContentRequest) {
            defer wg.Done()
            
            // 워커 풀에서 슬롯 획득
            s.workerPool <- struct{}{}
            defer func() { <-s.workerPool }()
            
            // 콘텐츠 생성
            content, err := s.client.Contents.Create(ctx, &r)
            if err != nil {
                results <- ContentResult{Error: err, Request: r}
                return
            }
            
            // 완성 대기
            completed, err := s.waitForCompletion(ctx, content.ID)
            if err != nil {
                results <- ContentResult{Error: err, Request: r}
                return
            }
            
            results <- ContentResult{Content: completed, Request: r}
        }(req)
    }
    
    go func() {
        wg.Wait()
        close(results)
    }()
    
    return results
}

// Circuit Breaker 패턴
type CircuitBreaker struct {
    maxFailures  int
    resetTimeout time.Duration
    failures     int
    lastFailTime time.Time
    mu           sync.Mutex
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    
    // 서킷 오픈 상태 확인
    if cb.failures >= cb.maxFailures {
        if time.Since(cb.lastFailTime) < cb.resetTimeout {
            return fmt.Errorf("circuit breaker is open")
        }
        // 타임아웃 지나면 리셋
        cb.failures = 0
    }
    
    // 함수 실행
    err := fn()
    if err != nil {
        cb.failures++
        cb.lastFailTime = time.Now()
        return err
    }
    
    // 성공시 카운터 리셋
    cb.failures = 0
    return nil
}

// 사용 예시
func (s *ContentService) CreateWithCircuitBreaker(
    ctx context.Context,
    req *bespoke.CreateContentRequest,
) (*bespoke.Content, error) {
    cb := &CircuitBreaker{
        maxFailures:  3,
        resetTimeout: 30 * time.Second,
    }
    
    var content *bespoke.Content
    err := cb.Call(func() error {
        var err error
        content, err = s.client.Contents.Create(ctx, req)
        return err
    })
    
    return content, err
}
```

### 이벤트 기반 아키텍처

```javascript
const EventEmitter = require('events');
const { Kafka } = require('kafkajs');

class EventDrivenIntegration extends EventEmitter {
  constructor(config) {
    super();
    this.bespokeClient = new BespokeAI({ apiKey: config.apiKey });
    this.kafka = new Kafka({
      clientId: 'bespoke-integration',
      brokers: config.kafkaBrokers,
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'content-processor' });
  }

  async initialize() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.setupConsumers();
  }

  async setupConsumers() {
    // 콘텐츠 생성 요청 구독
    await this.consumer.subscribe({
      topic: 'content-creation-requests',
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const request = JSON.parse(message.value.toString());
        await this.processContentRequest(request);
      },
    });
  }

  async processContentRequest(request) {
    try {
      // 콘텐츠 생성
      const content = await this.bespokeClient.contents.create(request);
      
      // 이벤트 발행
      await this.publishEvent('content.created', {
        contentId: content.id,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
      });

      // 완성 모니터링 시작
      this.monitorContent(content.id);

    } catch (error) {
      // 에러 이벤트 발행
      await this.publishEvent('content.failed', {
        requestId: request.requestId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async monitorContent(contentId) {
    const checkInterval = setInterval(async () => {
      try {
        const content = await this.bespokeClient.contents.get(contentId);
        
        if (content.status === 'completed') {
          clearInterval(checkInterval);
          
          // 완성 이벤트 발행
          await this.publishEvent('content.completed', {
            contentId: content.id,
            title: content.title,
            qualityScore: content.metadata.quality_score,
            downloadUrl: content.download_url,
            timestamp: new Date().toISOString(),
          });

          // 다운스트림 처리 트리거
          await this.triggerDownstreamProcessing(content);
        }
        
        if (content.status === 'failed') {
          clearInterval(checkInterval);
          
          await this.publishEvent('content.failed', {
            contentId: content.id,
            error: content.error,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 5000); // 5초마다 체크
  }

  async publishEvent(eventType, data) {
    await this.producer.send({
      topic: 'bespoke-events',
      messages: [
        {
          key: eventType,
          value: JSON.stringify({
            eventType,
            data,
            metadata: {
              source: 'bespoke-integration',
              version: '1.0.0',
            },
          }),
        },
      ],
    });
  }

  async triggerDownstreamProcessing(content) {
    // 콘텐츠 타입에 따른 후처리
    switch (content.type) {
      case 'text':
        await this.publishEvent('process.text', {
          contentId: content.id,
          tasks: ['translate', 'summarize', 'seo_optimize'],
        });
        break;
      
      case 'image':
        await this.publishEvent('process.image', {
          contentId: content.id,
          tasks: ['resize', 'optimize', 'watermark'],
        });
        break;
      
      case 'video':
        await this.publishEvent('process.video', {
          contentId: content.id,
          tasks: ['transcode', 'thumbnail', 'subtitle'],
        });
        break;
    }
  }
}

// 사용 예시
const integration = new EventDrivenIntegration({
  apiKey: process.env.BESPOKE_API_KEY,
  kafkaBrokers: ['localhost:9092'],
});

integration.initialize()
  .then(() => console.log('Event-driven integration started'))
  .catch(console.error);
```

## 7. 성능 최적화

### 응답 캐싱 전략

```python
import hashlib
import json
from functools import wraps
from datetime import datetime, timedelta
import redis

class CacheManager:
    def __init__(self, redis_client, default_ttl=3600):
        self.redis = redis_client
        self.default_ttl = default_ttl
    
    def cache_key(self, prefix, params):
        """파라미터 기반 캐시 키 생성"""
        param_str = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(param_str.encode()).hexdigest()
        return f"{prefix}:{param_hash}"
    
    def cached(self, prefix, ttl=None):
        """캐싱 데코레이터"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # 캐시 키 생성
                cache_params = {
                    'args': args[1:],  # self 제외
                    'kwargs': kwargs
                }
                key = self.cache_key(prefix, cache_params)
                
                # 캐시 확인
                cached = self.redis.get(key)
                if cached:
                    return json.loads(cached)
                
                # 함수 실행
                result = await func(*args, **kwargs)
                
                # 캐시 저장
                self.redis.setex(
                    key,
                    ttl or self.default_ttl,
                    json.dumps(result)
                )
                
                return result
            return wrapper
        return decorator
    
    def invalidate_pattern(self, pattern):
        """패턴 기반 캐시 무효화"""
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)

class OptimizedBespokeClient:
    def __init__(self, api_key, cache_manager):
        self.client = BespokeAI(api_key=api_key)
        self.cache = cache_manager
    
    @cached('content', ttl=300)  # 5분 캐싱
    async def get_content(self, content_id):
        """캐싱된 콘텐츠 조회"""
        return await self.client.contents.get(content_id)
    
    async def create_content(self, **params):
        """콘텐츠 생성 with 스마트 재시도"""
        # 비슷한 요청 중복 방지
        request_key = self.cache.cache_key('pending', params)
        
        # 이미 처리 중인 요청인지 확인
        if self.cache.redis.exists(request_key):
            # 기존 요청 결과 대기
            return await self._wait_for_existing(request_key)
        
        # 새 요청 시작
        self.cache.redis.setex(request_key, 300, 'processing')
        
        try:
            content = await self.client.contents.create(**params)
            
            # 결과 저장
            self.cache.redis.setex(
                request_key,
                300,
                json.dumps({'status': 'success', 'content': content})
            )
            
            return content
            
        except Exception as e:
            # 실패 기록
            self.cache.redis.setex(
                request_key,
                300,
                json.dumps({'status': 'error', 'error': str(e)})
            )
            raise
    
    async def batch_get_contents(self, content_ids):
        """배치 조회 with 부분 캐싱"""
        results = {}
        uncached_ids = []
        
        # 캐시 확인
        for content_id in content_ids:
            cached = await self.get_content(content_id)
            if cached:
                results[content_id] = cached
            else:
                uncached_ids.append(content_id)
        
        # 캐시되지 않은 항목만 API 호출
        if uncached_ids:
            # 병렬 요청
            tasks = [
                self.client.contents.get(cid)
                for cid in uncached_ids
            ]
            
            api_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for content_id, result in zip(uncached_ids, api_results):
                if not isinstance(result, Exception):
                    results[content_id] = result
                    # 캐시 저장
                    await self._cache_content(content_id, result)
        
        return results
```

### 연결 풀링 및 재사용

```javascript
const http = require('http');
const https = require('https');
const { URL } = require('url');

class ConnectionPool {
  constructor(options = {}) {
    this.maxSockets = options.maxSockets || 50;
    this.maxFreeSockets = options.maxFreeSockets || 10;
    this.timeout = options.timeout || 60000;
    this.keepAlive = options.keepAlive !== false;
    this.keepAliveMsecs = options.keepAliveMsecs || 1000;

    // HTTP/HTTPS 에이전트 생성
    this.agents = {
      http: new http.Agent({
        keepAlive: this.keepAlive,
        keepAliveMsecs: this.keepAliveMsecs,
        maxSockets: this.maxSockets,
        maxFreeSockets: this.maxFreeSockets,
        timeout: this.timeout,
      }),
      https: new https.Agent({
        keepAlive: this.keepAlive,
        keepAliveMsecs: this.keepAliveMsecs,
        maxSockets: this.maxSockets,
        maxFreeSockets: this.maxFreeSockets,
        timeout: this.timeout,
      }),
    };
  }

  getAgent(url) {
    const { protocol } = new URL(url);
    return protocol === 'https:' ? this.agents.https : this.agents.http;
  }

  destroy() {
    this.agents.http.destroy();
    this.agents.https.destroy();
  }
}

// Axios 인터셉터로 연결 풀 사용
const axios = require('axios');
const connectionPool = new ConnectionPool({
  maxSockets: 100,
  keepAlive: true,
});

const optimizedClient = axios.create({
  baseURL: 'https://api.bespoke-ai.com/v1',
  timeout: 30000,
  httpAgent: connectionPool.getAgent('http://api.bespoke-ai.com'),
  httpsAgent: connectionPool.getAgent('https://api.bespoke-ai.com'),
});

// 요청/응답 인터셉터
optimizedClient.interceptors.request.use(
  (config) => {
    // 요청 시작 시간 기록
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

optimizedClient.interceptors.response.use(
  (response) => {
    // 응답 시간 측정
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`API call took ${duration}ms`);
    
    // 느린 요청 경고
    if (duration > 5000) {
      console.warn(`Slow API call: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // 재시도 로직
    if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
      config.retryCount = config.retryCount || 0;
      
      if (config.retryCount < 3) {
        config.retryCount++;
        
        // 지수 백오프
        const delay = Math.pow(2, config.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return optimizedClient(config);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 8. 모니터링 및 로깅

### 종합 모니터링 시스템

```python
import logging
import time
from datadog import statsd
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

class MonitoringSystem:
    def __init__(self, service_name):
        self.service_name = service_name
        self.setup_logging()
        self.setup_metrics()
        self.setup_tracing()
    
    def setup_logging(self):
        """구조화된 로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(self.service_name)
    
    def setup_metrics(self):
        """메트릭 수집 설정"""
        self.metrics = statsd
    
    def setup_tracing(self):
        """분산 트레이싱 설정"""
        trace.set_tracer_provider(TracerProvider())
        tracer_provider = trace.get_tracer_provider()
        
        # Jaeger 익스포터
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )
        
        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)
        
        self.tracer = trace.get_tracer(self.service_name)
    
    def track_api_call(self, operation):
        """API 호출 추적 데코레이터"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # 트레이싱 시작
                with self.tracer.start_as_current_span(operation) as span:
                    start_time = time.time()
                    
                    try:
                        # 함수 실행
                        result = await func(*args, **kwargs)
                        
                        # 성공 메트릭
                        self.metrics.increment(f'{self.service_name}.{operation}.success')
                        
                        return result
                        
                    except Exception as e:
                        # 에러 추적
                        span.set_status(trace.StatusCode.ERROR, str(e))
                        span.record_exception(e)
                        
                        # 에러 메트릭
                        self.metrics.increment(f'{self.service_name}.{operation}.error')
                        
                        # 에러 로깅
                        self.logger.error(
                            f"{operation} failed",
                            extra={
                                'operation': operation,
                                'error': str(e),
                                'trace_id': span.get_span_context().trace_id
                            }
                        )
                        
                        raise
                        
                    finally:
                        # 실행 시간 기록
                        duration = (time.time() - start_time) * 1000
                        self.metrics.timing(
                            f'{self.service_name}.{operation}.duration',
                            duration
                        )
                        
                        span.set_attribute("duration_ms", duration)
            
            return wrapper
        return decorator

# 사용 예시
monitoring = MonitoringSystem('bespoke-integration')

class MonitoredBespokeClient:
    def __init__(self, api_key):
        self.client = BespokeAI(api_key=api_key)
        self.monitoring = monitoring
    
    @monitoring.track_api_call('create_content')
    async def create_content(self, **params):
        """모니터링이 적용된 콘텐츠 생성"""
        content = await self.client.contents.create(**params)
        
        # 커스텀 메트릭
        self.monitoring.metrics.gauge(
            'bespoke.content.quality_score',
            content.metadata.quality_score
        )
        
        return content
    
    @monitoring.track_api_call('get_campaign_performance')
    async def get_campaign_performance(self, campaign_id):
        """캠페인 성과 조회 with 모니터링"""
        performance = await self.client.campaigns.get_performance(campaign_id)
        
        # 비즈니스 메트릭
        self.monitoring.metrics.gauge('bespoke.campaign.roi', performance.roi)
        self.monitoring.metrics.gauge('bespoke.campaign.ctr', performance.ctr)
        
        return performance
```

## 9. 보안 모범 사례

### API 키 로테이션

```javascript
class SecureAPIManager {
  constructor(vaultClient) {
    this.vault = vaultClient;
    this.currentKey = null;
    this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30일
    this.startKeyRotation();
  }

  async getCurrentKey() {
    if (!this.currentKey || this.isKeyExpired()) {
      await this.rotateKey();
    }
    return this.currentKey;
  }

  async rotateKey() {
    try {
      // Vault에서 새 키 가져오기
      const newKey = await this.vault.read('secret/bespoke-api-key');
      
      // 이전 키 보관 (롤백용)
      if (this.currentKey) {
        await this.vault.write('secret/bespoke-api-key-previous', {
          key: this.currentKey.key,
          rotated_at: new Date().toISOString()
        });
      }
      
      this.currentKey = {
        key: newKey.data.key,
        created_at: new Date(),
        expires_at: new Date(Date.now() + this.keyRotationInterval)
      };
      
      console.log('API key rotated successfully');
      
    } catch (error) {
      console.error('Key rotation failed:', error);
      // 알림 발송
      await this.notifySecurityTeam('API key rotation failed', error);
    }
  }

  isKeyExpired() {
    if (!this.currentKey) return true;
    return new Date() > this.currentKey.expires_at;
  }

  startKeyRotation() {
    // 주기적 키 로테이션
    setInterval(() => {
      this.rotateKey();
    }, this.keyRotationInterval);
  }

  async createSecureClient() {
    const apiKey = await this.getCurrentKey();
    
    return new BespokeAI({
      apiKey: apiKey.key,
      // 추가 보안 설정
      validateSSL: true,
      timeout: 30000,
      headers: {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': generateRequestId()
      }
    });
  }
}

// 사용 예시
const vault = require('node-vault')({
  endpoint: 'https://vault.company.com',
  token: process.env.VAULT_TOKEN
});

const apiManager = new SecureAPIManager(vault);

async function performSecureOperation() {
  const client = await apiManager.createSecureClient();
  
  // 안전한 API 호출
  const content = await client.contents.create({
    type: 'text',
    prompt: { main: 'Secure content generation' }
  });
  
  return content;
}
```

## 10. 통합 테스트

### 통합 테스트 스위트

```python
import pytest
import asyncio
from unittest.mock import Mock, patch
import vcr

class TestBespokeIntegration:
    @pytest.fixture
    async def client(self):
        """테스트용 클라이언트"""
        return BespokeAI(api_key='test_key')
    
    @pytest.fixture
    def mock_webhooks(self):
        """웹훅 모킹"""
        with patch('requests.post') as mock_post:
            yield mock_post
    
    @vcr.use_cassette('tests/cassettes/create_content.yaml')
    async def test_create_content_integration(self, client):
        """콘텐츠 생성 통합 테스트"""
        # 콘텐츠 생성
        content = await client.contents.create(
            type='text',
            prompt={
                'main': 'Test content',
                'style': 'professional'
            }
        )
        
        assert content.id is not None
        assert content.status in ['processing', 'completed']
        
        # 완성 대기
        completed = await client.contents.wait_for_completion(
            content.id,
            timeout=60000
        )
        
        assert completed.status == 'completed'
        assert completed.title is not None
        assert completed.metadata.quality_score >= 0
    
    async def test_webhook_integration(self, mock_webhooks):
        """웹훅 통합 테스트"""
        # 웹훅 이벤트 시뮬레이션
        webhook_payload = {
            'id': 'evt_test123',
            'event': 'content.completed',
            'data': {
                'content': {
                    'id': 'content_123',
                    'status': 'completed'
                }
            }
        }
        
        # 웹훅 핸들러 호출
        response = await handle_webhook(webhook_payload)
        
        # 검증
        assert response['status'] == 'processed'
        mock_webhooks.assert_called_once()
    
    @pytest.mark.integration
    async def test_end_to_end_workflow(self, client):
        """전체 워크플로우 테스트"""
        # 1. 캠페인 생성
        campaign = await client.campaigns.create(
            name='Test Campaign',
            objectives={'primary': 'testing'}
        )
        
        # 2. 콘텐츠 생성
        contents = []
        for i in range(3):
            content = await client.contents.create(
                campaign_id=campaign.id,
                type='text',
                prompt={'main': f'Test content {i}'}
            )
            contents.append(content)
        
        # 3. 완성 대기
        completed_contents = await asyncio.gather(*[
            client.contents.wait_for_completion(c.id)
            for c in contents
        ])
        
        # 4. 성과 확인
        performance = await client.campaigns.get_performance(campaign.id)
        
        # 검증
        assert len(completed_contents) == 3
        assert all(c.status == 'completed' for c in completed_contents)
        assert performance is not None

# 부하 테스트
class LoadTest:
    def __init__(self, client, concurrent_users=10):
        self.client = client
        self.concurrent_users = concurrent_users
    
    async def run_load_test(self, duration_seconds=60):
        """부하 테스트 실행"""
        start_time = time.time()
        tasks = []
        
        async def user_simulation():
            while time.time() - start_time < duration_seconds:
                try:
                    # 랜덤한 작업 수행
                    operation = random.choice([
                        self.create_content,
                        self.get_content,
                        self.list_campaigns
                    ])
                    
                    await operation()
                    
                    # 실제 사용자 패턴 시뮬레이션
                    await asyncio.sleep(random.uniform(1, 5))
                    
                except Exception as e:
                    print(f"Error during load test: {e}")
        
        # 동시 사용자 시뮬레이션
        for _ in range(self.concurrent_users):
            tasks.append(asyncio.create_task(user_simulation()))
        
        await asyncio.gather(*tasks)
        
        print(f"Load test completed. Duration: {time.time() - start_time}s")
```

## 문제 해결

### 일반적인 통합 문제

1. **인증 실패**
   - API 키 확인
   - 헤더 형식 검증
   - 토큰 만료 확인

2. **Rate Limiting**
   - 재시도 로직 구현
   - 요청 속도 조절
   - 캐싱 활용

3. **타임아웃**
   - 타임아웃 값 조정
   - 비동기 처리 활용
   - 웹훅 사용 고려

4. **데이터 일관성**
   - 트랜잭션 처리
   - 멱등성 보장
   - 에러 복구 전략

## 다음 단계

1. [배포 가이드](../operations/deployment.md) - 프로덕션 배포
2. [모니터링 설정](../operations/monitoring.md) - 운영 모니터링
3. [성능 최적화](../guides/performance-guide.md) - 고급 최적화

---

*Bespoke AI Suite API를 성공적으로 통합하신 것을 축하드립니다! 🚀*