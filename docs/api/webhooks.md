# 웹훅 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 문서 상태: 승인됨

## 목차

1. [개요](#1-개요)
2. [웹훅 설정](#2-웹훅-설정)
3. [이벤트 타입](#3-이벤트-타입)
4. [페이로드 구조](#4-페이로드-구조)
5. [보안](#5-보안)
6. [재시도 정책](#6-재시도-정책)
7. [웹훅 관리](#7-웹훅-관리)
8. [테스트 및 디버깅](#8-테스트-및-디버깅)
9. [구현 예제](#9-구현-예제)
10. [베스트 프랙티스](#10-베스트-프랙티스)

---

## 1. 개요

웹훅은 Bespoke AI Suite에서 발생하는 이벤트를 실시간으로 알려주는 HTTP 콜백입니다. 콘텐츠 생성 완료, 캠페인 상태 변경 등의 이벤트가 발생하면 등록된 URL로 POST 요청을 보냅니다.

### 주요 특징
- 실시간 이벤트 알림
- 최대 3회 자동 재시도
- HMAC-SHA256 서명 검증
- 이벤트 필터링
- 대량 전송 지원

### 사용 사례
- 콘텐츠 생성 완료 시 자동 다운로드
- 캠페인 성과 실시간 모니터링
- 사용량 한도 도달 알림
- 외부 시스템과의 통합

## 2. 웹훅 설정

### 웹훅 등록
```http
POST /v1/webhooks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://api.example.com/webhooks/bespoke",
  "events": [
    "content.completed",
    "content.failed",
    "campaign.performance_updated"
  ],
  "secret": "whsec_your_webhook_secret_key",
  "description": "프로덕션 웹훅",
  "active": true
}
```

### 응답
```json
{
  "status": "success",
  "data": {
    "id": "webhook_123456",
    "url": "https://api.example.com/webhooks/bespoke",
    "events": [
      "content.completed",
      "content.failed",
      "campaign.performance_updated"
    ],
    "secret": "whsec_your_webhook_secret_key",
    "description": "프로덕션 웹훅",
    "active": true,
    "created_at": "2025-08-04T10:30:00Z"
  }
}
```

## 3. 이벤트 타입

### 콘텐츠 이벤트
| 이벤트 | 설명 | 발생 시점 |
|--------|------|-----------|
| `content.created` | 콘텐츠 생성 요청 접수 | 요청 검증 완료 후 |
| `content.processing` | 콘텐츠 생성 시작 | AI 처리 시작 시 |
| `content.completed` | 콘텐츠 생성 완료 | 품질 검증 통과 후 |
| `content.failed` | 콘텐츠 생성 실패 | 에러 발생 시 |
| `content.updated` | 콘텐츠 수정됨 | 메타데이터 변경 시 |
| `content.deleted` | 콘텐츠 삭제됨 | 삭제 완료 후 |

### 캠페인 이벤트
| 이벤트 | 설명 | 발생 시점 |
|--------|------|-----------|
| `campaign.created` | 캠페인 생성 | 캠페인 등록 후 |
| `campaign.started` | 캠페인 시작 | 활성화 시 |
| `campaign.paused` | 캠페인 일시정지 | 상태 변경 시 |
| `campaign.completed` | 캠페인 종료 | 종료일 도달 시 |
| `campaign.performance_updated` | 성과 업데이트 | 매 시간 |
| `campaign.budget_alert` | 예산 알림 | 80%, 90%, 100% 도달 시 |

### 사용자 이벤트
| 이벤트 | 설명 | 발생 시점 |
|--------|------|-----------|
| `user.subscription_updated` | 구독 변경 | 플랜 변경 시 |
| `user.usage_alert` | 사용량 알림 | 한도 도달 시 |
| `user.payment_failed` | 결제 실패 | 자동 결제 실패 시 |

## 4. 페이로드 구조

### 기본 구조
```json
{
  "id": "evt_1234567890",
  "event": "content.completed",
  "created": 1723456789,
  "data": {
    // 이벤트별 데이터
  },
  "object": "event",
  "api_version": "2025-08-01"
}
```

### 콘텐츠 완료 이벤트 예시
```json
{
  "id": "evt_abc123def456",
  "event": "content.completed",
  "created": 1723456789,
  "data": {
    "content": {
      "id": "content_123456",
      "type": "text",
      "status": "completed",
      "title": "AI 마케팅의 미래",
      "quality_score": 92,
      "word_count": 1523,
      "created_at": "2025-08-04T10:30:00Z",
      "completed_at": "2025-08-04T10:31:45Z",
      "download_url": "https://download.bespoke-ai.com/content_123456",
      "download_expires_at": "2025-08-11T10:31:45Z"
    },
    "campaign_id": "campaign_789",
    "user_id": "user_456"
  },
  "object": "event",
  "api_version": "2025-08-01"
}
```

### 캠페인 성과 업데이트 예시
```json
{
  "id": "evt_xyz789ghi012",
  "event": "campaign.performance_updated",
  "created": 1723460389,
  "data": {
    "campaign": {
      "id": "campaign_789",
      "name": "2025 여름 프로모션",
      "status": "active"
    },
    "performance": {
      "period": {
        "start": "2025-08-04T09:00:00Z",
        "end": "2025-08-04T10:00:00Z"
      },
      "metrics": {
        "impressions": 12500,
        "clicks": 450,
        "ctr": 0.036,
        "conversions": 23,
        "conversion_rate": 0.051,
        "spend": 125.50
      },
      "cumulative": {
        "impressions": 1250000,
        "conversions": 890,
        "roi": 2.34
      }
    }
  },
  "object": "event",
  "api_version": "2025-08-01"
}
```

## 5. 보안

### 서명 검증
모든 웹훅 요청은 HMAC-SHA256 서명을 포함합니다.

**HTTP 헤더**:
```
X-Bespoke-Signature: sha256=3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5
```

**검증 코드 (Node.js)**:
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}

// Express.js 미들웨어
app.post('/webhooks/bespoke', (req, res) => {
  const signature = req.headers['x-bespoke-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // 웹훅 처리
  handleWebhook(req.body);
  res.status(200).send('OK');
});
```

### IP 화이트리스트
웹훅은 다음 IP 대역에서 발송됩니다:
- `52.89.214.238/32`
- `34.212.75.30/32`
- `54.218.53.128/32`

## 6. 재시도 정책

### 재시도 조건
- HTTP 상태 코드 5xx
- 네트워크 타임아웃 (30초)
- 연결 실패

### 재시도 일정
| 시도 | 지연 시간 | 누적 시간 |
|------|----------|-----------|
| 1차 | 즉시 | 0초 |
| 2차 | 5분 | 5분 |
| 3차 | 30분 | 35분 |

### 실패 처리
3회 재시도 후에도 실패하면:
1. 웹훅 상태가 `failed`로 변경
2. 알림 이메일 발송
3. 대시보드에서 수동 재시도 가능

## 7. 웹훅 관리

### 웹훅 목록 조회
```http
GET /v1/webhooks
```

### 웹훅 상세 조회
```http
GET /v1/webhooks/{webhook_id}
```

### 웹훅 수정
```http
PATCH /v1/webhooks/{webhook_id}
Content-Type: application/json

{
  "events": [
    "content.completed",
    "content.failed",
    "campaign.started",
    "campaign.completed"
  ],
  "active": true
}
```

### 웹훅 삭제
```http
DELETE /v1/webhooks/{webhook_id}
```

### 웹훅 로그 조회
```http
GET /v1/webhooks/{webhook_id}/logs?limit=100
```

응답:
```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "log_123",
        "event": "content.completed",
        "status": "success",
        "http_status": 200,
        "duration_ms": 245,
        "created_at": "2025-08-04T10:31:50Z"
      }
    ]
  }
}
```

## 8. 테스트 및 디버깅

### 테스트 이벤트 발송
```http
POST /v1/webhooks/{webhook_id}/test
Content-Type: application/json

{
  "event": "content.completed"
}
```

### 웹훅 테스트 도구
개발 중에는 다음 도구들을 활용할 수 있습니다:
- [ngrok](https://ngrok.com/) - 로컬 개발 환경 터널링
- [Webhook.site](https://webhook.site/) - 웹훅 수신 테스트
- [RequestBin](https://requestbin.com/) - HTTP 요청 검사

### 디버깅 팁
1. **서명 검증 실패**: Secret 키 확인, 페이로드 문자열화 방식 확인
2. **타임아웃**: 30초 내 응답, 비동기 처리 권장
3. **중복 이벤트**: 이벤트 ID로 중복 제거
4. **순서 보장 안됨**: 타임스탬프 기반 정렬

## 9. 구현 예제

### Python (Flask)
```python
import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)
WEBHOOK_SECRET = 'whsec_your_webhook_secret_key'

def verify_signature(payload, signature):
    expected = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return f'sha256={expected}' == signature

@app.route('/webhooks/bespoke', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Bespoke-Signature')
    if not signature:
        abort(401)
    
    payload = request.get_data()
    if not verify_signature(payload, signature):
        abort(401)
    
    event = request.json
    
    # 이벤트 처리
    if event['event'] == 'content.completed':
        process_completed_content(event['data'])
    
    return '', 200

def process_completed_content(data):
    content_id = data['content']['id']
    download_url = data['content']['download_url']
    # 콘텐츠 다운로드 및 처리
    print(f"Content {content_id} completed: {download_url}")
```

### Go
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

const webhookSecret = "whsec_your_webhook_secret_key"

type WebhookEvent struct {
    ID      string                 `json:"id"`
    Event   string                 `json:"event"`
    Created int64                  `json:"created"`
    Data    map[string]interface{} `json:"data"`
}

func verifySignature(payload []byte, signature string) bool {
    h := hmac.New(sha256.New, []byte(webhookSecret))
    h.Write(payload)
    expected := fmt.Sprintf("sha256=%s", hex.EncodeToString(h.Sum(nil)))
    return expected == signature
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-Bespoke-Signature")
    if signature == "" {
        http.Error(w, "Missing signature", http.StatusUnauthorized)
        return
    }
    
    payload, err := ioutil.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Failed to read body", http.StatusBadRequest)
        return
    }
    
    if !verifySignature(payload, signature) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    
    var event WebhookEvent
    if err := json.Unmarshal(payload, &event); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    // 이벤트 처리
    switch event.Event {
    case "content.completed":
        processCompletedContent(event.Data)
    }
    
    w.WriteHeader(http.StatusOK)
}
```

## 10. 베스트 프랙티스

### 1. 신속한 응답
- 웹훅 수신 후 즉시 200 OK 응답
- 시간이 오래 걸리는 작업은 비동기로 처리
- 큐 시스템 활용 (Redis, RabbitMQ 등)

### 2. 멱등성 보장
```javascript
const processedEvents = new Set();

function handleWebhook(event) {
  if (processedEvents.has(event.id)) {
    return; // 이미 처리된 이벤트
  }
  
  processedEvents.add(event.id);
  // 이벤트 처리
}
```

### 3. 에러 처리
```javascript
try {
  await processWebhook(event);
} catch (error) {
  console.error('Webhook processing error:', error);
  // 에러 로깅 및 알림
  // 500 에러 반환하여 재시도 유도
  res.status(500).send('Processing error');
}
```

### 4. 모니터링
- 웹훅 수신률 모니터링
- 처리 시간 측정
- 실패율 추적
- 알림 설정

### 5. 보안 강화
- HTTPS 엔드포인트 필수
- IP 화이트리스트 설정
- Rate limiting 적용
- 로그에 민감정보 제외

### 6. 확장성 고려
```javascript
// Bull 큐 사용 예시
const Queue = require('bull');
const webhookQueue = new Queue('webhook processing');

app.post('/webhooks/bespoke', async (req, res) => {
  // 서명 검증
  
  // 큐에 추가
  await webhookQueue.add('process', req.body);
  
  // 즉시 응답
  res.status(200).send('OK');
});

// 워커에서 처리
webhookQueue.process('process', async (job) => {
  const event = job.data;
  await processWebhookEvent(event);
});
```

---

*웹훅 시스템은 지속적으로 개선되고 있습니다. 최신 업데이트는 [API 문서](https://api.bespoke-ai.com/docs)를 참조하세요.*