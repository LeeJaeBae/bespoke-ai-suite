# Bespoke AI Suite API 명세서

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> API 버전: v1  
> 기본 URL: `https://api.bespoke-ai.com/v1`

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [공통 응답 형식](#3-공통-응답-형식)
4. [콘텐츠 API](#4-콘텐츠-api)
5. [캠페인 API](#5-캠페인-api)
6. [사용자 API](#6-사용자-api)
7. [분석 API](#7-분석-api)
8. [웹훅](#8-웹훅)
9. [에러 코드](#9-에러-코드)
10. [Rate Limiting](#10-rate-limiting)

---

## 1. 개요

### API 설계 원칙
- RESTful 아키텍처 준수
- JSON 기반 요청/응답
- UTF-8 인코딩
- ISO 8601 날짜 형식
- 페이지네이션 지원
- HATEOAS 원칙 적용

### 버전 관리
- URL 경로 기반 버전 관리 (`/v1`, `/v2`)
- 하위 호환성 보장 (최소 6개월)
- Deprecation 공지 (3개월 전)

## 2. 인증

### Bearer Token 인증
```http
Authorization: Bearer {access_token}
```

### OAuth 2.0 플로우
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={client_id}
&client_secret={client_secret}
&scope=content:write campaign:read
```

**응답 예시**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "content:write campaign:read"
}
```

### API 키 인증 (간단한 통합용)
```http
X-API-Key: {api_key}
```

## 3. 공통 응답 형식

### 성공 응답
```json
{
  "status": "success",
  "data": {
    // 리소스 데이터
  },
  "meta": {
    "timestamp": "2025-08-04T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### 에러 응답
```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 리소스를 찾을 수 없습니다.",
    "details": {
      "resource_id": "content_123456"
    }
  },
  "meta": {
    "timestamp": "2025-08-04T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 페이지네이션
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 10,
    "total_count": 200
  },
  "links": {
    "self": "/v1/contents?page=1",
    "next": "/v1/contents?page=2",
    "prev": null,
    "first": "/v1/contents?page=1",
    "last": "/v1/contents?page=10"
  }
}
```

## 4. 콘텐츠 API

### 4.1 콘텐츠 생성

**엔드포인트**: `POST /v1/contents`

**요청 본문**:
```json
{
  "type": "text|image|video",
  "prompt": {
    "main": "스타트업을 위한 마케팅 전략 블로그 포스트",
    "style": "professional",
    "tone": "informative",
    "length": 1500,
    "keywords": ["스타트업", "마케팅", "성장전략"]
  },
  "options": {
    "language": "ko",
    "format": "markdown",
    "include_images": true
  },
  "campaign_id": "campaign_789"
}
```

**응답**:
```json
{
  "status": "success",
  "data": {
    "id": "content_123456",
    "type": "text",
    "status": "processing",
    "created_at": "2025-08-04T10:30:00Z",
    "estimated_completion": "2025-08-04T10:32:00Z",
    "preview_url": "https://preview.bespoke-ai.com/content_123456",
    "webhook_url": "https://api.customer.com/webhooks/content"
  }
}
```

### 4.2 콘텐츠 조회

**엔드포인트**: `GET /v1/contents/{content_id}`

**응답**:
```json
{
  "status": "success",
  "data": {
    "id": "content_123456",
    "type": "text",
    "status": "completed",
    "title": "스타트업 성공을 위한 7가지 마케팅 전략",
    "content": {
      "body": "# 스타트업 성공을 위한 7가지 마케팅 전략\n\n...",
      "summary": "이 글에서는 스타트업이 성장하기 위한...",
      "metadata": {
        "word_count": 1523,
        "reading_time": "6 minutes",
        "seo_score": 85
      }
    },
    "quality_score": 92,
    "created_at": "2025-08-04T10:30:00Z",
    "completed_at": "2025-08-04T10:31:45Z",
    "campaign_id": "campaign_789"
  }
}
```

### 4.3 콘텐츠 목록 조회

**엔드포인트**: `GET /v1/contents`

**쿼리 파라미터**:
- `type`: 콘텐츠 타입 필터 (text, image, video)
- `status`: 상태 필터 (processing, completed, failed)
- `campaign_id`: 캠페인 ID 필터
- `created_after`: 생성일 필터 (ISO 8601)
- `created_before`: 생성일 필터 (ISO 8601)
- `quality_score_min`: 최소 품질 점수
- `sort`: 정렬 기준 (created_at, quality_score)
- `order`: 정렬 방향 (asc, desc)
- `page`: 페이지 번호
- `per_page`: 페이지당 항목 수 (최대 100)

### 4.4 콘텐츠 수정

**엔드포인트**: `PATCH /v1/contents/{content_id}`

**요청 본문**:
```json
{
  "title": "수정된 제목",
  "content": {
    "body": "수정된 내용..."
  },
  "metadata": {
    "tags": ["수정됨", "검토완료"]
  }
}
```

### 4.5 콘텐츠 삭제

**엔드포인트**: `DELETE /v1/contents/{content_id}`

## 5. 캠페인 API

### 5.1 캠페인 생성

**엔드포인트**: `POST /v1/campaigns`

**요청 본문**:
```json
{
  "name": "2025 여름 프로모션",
  "type": "multi_channel",
  "objectives": {
    "primary": "brand_awareness",
    "secondary": ["lead_generation", "engagement"]
  },
  "target_audience": {
    "demographics": {
      "age_range": [25, 45],
      "gender": "all",
      "location": ["KR", "US"]
    },
    "interests": ["technology", "startup", "marketing"]
  },
  "budget": {
    "total": 50000,
    "currency": "USD",
    "allocation": {
      "content_creation": 0.3,
      "paid_advertising": 0.5,
      "influencer": 0.2
    }
  },
  "schedule": {
    "start_date": "2025-06-01",
    "end_date": "2025-08-31",
    "timezone": "Asia/Seoul"
  }
}
```

### 5.2 캠페인 성과 조회

**엔드포인트**: `GET /v1/campaigns/{campaign_id}/performance`

**응답**:
```json
{
  "status": "success",
  "data": {
    "campaign_id": "campaign_789",
    "period": {
      "start": "2025-06-01",
      "end": "2025-08-04"
    },
    "metrics": {
      "impressions": 1250000,
      "clicks": 45000,
      "ctr": 0.036,
      "conversions": 890,
      "conversion_rate": 0.0198,
      "roi": 2.34,
      "spend": 32500
    },
    "performance_by_channel": {
      "social_media": {
        "impressions": 800000,
        "engagement_rate": 0.045
      },
      "email": {
        "open_rate": 0.23,
        "click_rate": 0.054
      }
    }
  }
}
```

### 5.3 A/B 테스트 생성

**엔드포인트**: `POST /v1/campaigns/{campaign_id}/ab-tests`

**요청 본문**:
```json
{
  "name": "헤드라인 테스트",
  "type": "headline",
  "variants": [
    {
      "name": "A",
      "content": "스타트업 성장의 비밀",
      "allocation": 0.5
    },
    {
      "name": "B",
      "content": "매출 300% 성장시킨 비법",
      "allocation": 0.5
    }
  ],
  "success_metric": "click_through_rate",
  "minimum_sample_size": 1000,
  "confidence_level": 0.95
}
```

## 6. 사용자 API

### 6.1 사용자 프로필 조회

**엔드포인트**: `GET /v1/users/me`

**응답**:
```json
{
  "status": "success",
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "김철수",
    "subscription": {
      "plan": "pro",
      "status": "active",
      "expires_at": "2025-12-31T23:59:59Z"
    },
    "usage": {
      "contents_created": 245,
      "contents_limit": 1000,
      "api_calls": 15420,
      "api_calls_limit": 100000
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### 6.2 사용량 통계 조회

**엔드포인트**: `GET /v1/users/me/usage`

**쿼리 파라미터**:
- `period`: 기간 (daily, weekly, monthly)
- `start_date`: 시작일
- `end_date`: 종료일

## 7. 분석 API

### 7.1 대시보드 데이터 조회

**엔드포인트**: `GET /v1/analytics/dashboard`

**응답**:
```json
{
  "status": "success",
  "data": {
    "summary": {
      "total_campaigns": 15,
      "active_campaigns": 5,
      "total_contents": 342,
      "average_quality_score": 87.5
    },
    "trends": {
      "engagement": {
        "current": 4.5,
        "previous": 3.8,
        "change_percent": 18.4
      }
    },
    "top_performing_content": [
      {
        "id": "content_789",
        "title": "AI 마케팅의 미래",
        "engagement_score": 95
      }
    ]
  }
}
```

### 7.2 커스텀 리포트 생성

**엔드포인트**: `POST /v1/analytics/reports`

**요청 본문**:
```json
{
  "name": "월간 성과 리포트",
  "type": "performance",
  "metrics": ["impressions", "clicks", "conversions", "roi"],
  "dimensions": ["campaign", "content_type", "channel"],
  "filters": {
    "date_range": {
      "start": "2025-07-01",
      "end": "2025-07-31"
    }
  },
  "format": "pdf",
  "schedule": {
    "frequency": "monthly",
    "day": 1,
    "email": "report@example.com"
  }
}
```

## 8. 웹훅

### 웹훅 등록

**엔드포인트**: `POST /v1/webhooks`

**요청 본문**:
```json
{
  "url": "https://api.customer.com/webhooks/bespoke",
  "events": [
    "content.completed",
    "content.failed",
    "campaign.performance_update"
  ],
  "secret": "webhook_secret_key"
}
```

### 웹훅 페이로드 예시

**콘텐츠 완료 이벤트**:
```json
{
  "event": "content.completed",
  "timestamp": "2025-08-04T10:31:45Z",
  "data": {
    "content_id": "content_123456",
    "type": "text",
    "quality_score": 92,
    "download_url": "https://download.bespoke-ai.com/content_123456"
  },
  "signature": "sha256=..."
}
```

## 9. 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `RESOURCE_NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `RATE_LIMIT_EXCEEDED` | 429 | API 호출 한도 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 일시적 사용 불가 |

## 10. Rate Limiting

### 제한 정책

| 구독 등급 | 시간당 요청 | 일일 요청 | 동시 요청 |
|----------|------------|----------|----------|
| Free | 100 | 1,000 | 5 |
| Pro | 1,000 | 10,000 | 20 |
| Enterprise | 10,000 | 100,000 | 100 |

### Rate Limit 헤더
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1627891200
```

---

*API 문서 최종 업데이트: 2025년 8월 4일*