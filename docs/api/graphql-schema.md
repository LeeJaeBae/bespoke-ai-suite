# GraphQL API 스키마

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> GraphQL Endpoint: `https://api.thebespoke-ai.com/graphql`

## 목차

1. [개요](#1-개요)
2. [인증](#2-인증)
3. [스칼라 타입](#3-스칼라-타입)
4. [객체 타입](#4-객체-타입)
5. [쿼리](#5-쿼리)
6. [뮤테이션](#6-뮤테이션)
7. [서브스크립션](#7-서브스크립션)
8. [에러 처리](#8-에러-처리)
9. [페이지네이션](#9-페이지네이션)
10. [사용 예제](#10-사용-예제)

---

## 1. 개요

Bespoke AI Suite GraphQL API는 RESTful API의 대안으로, 클라이언트가 필요한 데이터만 정확히 요청할 수 있는 유연한 쿼리 인터페이스를 제공합니다.

### 주요 특징
- 단일 엔드포인트
- 타입 안전성
- 실시간 서브스크립션
- 효율적인 데이터 페칭

### GraphQL Playground
개발 환경에서는 `https://api.thebespoke-ai.com/graphql` 에서 인터랙티브 문서와 쿼리 테스트를 제공합니다.

## 2. 인증

### HTTP 헤더
```
Authorization: Bearer {access_token}
```

### GraphQL 쿼리 예시
```graphql
query {
  me {
    id
    email
    subscription {
      plan
      expiresAt
    }
  }
}
```

## 3. 스칼라 타입

### 커스텀 스칼라
```graphql
scalar DateTime
scalar URL
scalar JSON
scalar Upload
```

### 열거형 타입
```graphql
enum ContentType {
  TEXT
  IMAGE
  VIDEO
}

enum ContentStatus {
  PROCESSING
  COMPLETED
  FAILED
}

enum SubscriptionPlan {
  FREE
  PRO
  ENTERPRISE
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
}
```

## 4. 객체 타입

### User 타입
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  subscription: Subscription!
  usage: Usage!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Subscription {
  plan: SubscriptionPlan!
  status: String!
  expiresAt: DateTime
  features: [String!]!
}

type Usage {
  contentsCreated: Int!
  contentsLimit: Int!
  apiCalls: Int!
  apiCallsLimit: Int!
}
```

### Content 타입
```graphql
type Content {
  id: ID!
  type: ContentType!
  status: ContentStatus!
  title: String
  body: String
  metadata: JSON
  qualityScore: Float
  campaign: Campaign
  createdBy: User!
  createdAt: DateTime!
  completedAt: DateTime
  downloadUrl: URL
}
```

### Campaign 타입
```graphql
type Campaign {
  id: ID!
  name: String!
  type: String!
  status: CampaignStatus!
  objectives: CampaignObjectives!
  targetAudience: TargetAudience!
  budget: Budget!
  schedule: Schedule!
  performance: Performance
  contents: [Content!]!
  createdBy: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type CampaignObjectives {
  primary: String!
  secondary: [String!]!
}

type TargetAudience {
  demographics: Demographics!
  interests: [String!]!
}

type Budget {
  total: Float!
  currency: String!
  spent: Float!
  remaining: Float!
}

type Performance {
  impressions: Int!
  clicks: Int!
  ctr: Float!
  conversions: Int!
  conversionRate: Float!
  roi: Float!
}
```

## 5. 쿼리

### 사용자 쿼리
```graphql
type Query {
  # 현재 사용자 정보
  me: User!
  
  # 사용자 ID로 조회
  user(id: ID!): User
  
  # 사용자 사용량 통계
  userUsage(
    period: String!
    startDate: DateTime
    endDate: DateTime
  ): UsageStats!
}
```

### 콘텐츠 쿼리
```graphql
type Query {
  # 단일 콘텐츠 조회
  content(id: ID!): Content
  
  # 콘텐츠 목록 조회
  contents(
    type: ContentType
    status: ContentStatus
    campaignId: ID
    createdAfter: DateTime
    createdBefore: DateTime
    first: Int = 20
    after: String
  ): ContentConnection!
  
  # 콘텐츠 검색
  searchContents(
    query: String!
    type: ContentType
    first: Int = 20
  ): ContentConnection!
}
```

### 캠페인 쿼리
```graphql
type Query {
  # 단일 캠페인 조회
  campaign(id: ID!): Campaign
  
  # 캠페인 목록 조회
  campaigns(
    status: CampaignStatus
    first: Int = 20
    after: String
  ): CampaignConnection!
  
  # 캠페인 성과 조회
  campaignPerformance(
    id: ID!
    startDate: DateTime!
    endDate: DateTime!
  ): PerformanceReport!
}
```

## 6. 뮤테이션

### 콘텐츠 뮤테이션
```graphql
type Mutation {
  # 콘텐츠 생성
  createContent(input: CreateContentInput!): Content!
  
  # 콘텐츠 수정
  updateContent(
    id: ID!
    input: UpdateContentInput!
  ): Content!
  
  # 콘텐츠 삭제
  deleteContent(id: ID!): Boolean!
  
  # 콘텐츠 재생성
  regenerateContent(id: ID!): Content!
}

input CreateContentInput {
  type: ContentType!
  prompt: PromptInput!
  options: ContentOptions
  campaignId: ID
}

input PromptInput {
  main: String!
  style: String
  tone: String
  length: Int
  keywords: [String!]
}

input ContentOptions {
  language: String = "ko"
  format: String
  includeImages: Boolean
}
```

### 캠페인 뮤테이션
```graphql
type Mutation {
  # 캠페인 생성
  createCampaign(input: CreateCampaignInput!): Campaign!
  
  # 캠페인 수정
  updateCampaign(
    id: ID!
    input: UpdateCampaignInput!
  ): Campaign!
  
  # 캠페인 상태 변경
  updateCampaignStatus(
    id: ID!
    status: CampaignStatus!
  ): Campaign!
  
  # 캠페인 삭제
  deleteCampaign(id: ID!): Boolean!
  
  # A/B 테스트 생성
  createABTest(
    campaignId: ID!
    input: CreateABTestInput!
  ): ABTest!
}

input CreateCampaignInput {
  name: String!
  type: String!
  objectives: CampaignObjectivesInput!
  targetAudience: TargetAudienceInput!
  budget: BudgetInput!
  schedule: ScheduleInput!
}
```

### 사용자 뮤테이션
```graphql
type Mutation {
  # 프로필 업데이트
  updateProfile(input: UpdateProfileInput!): User!
  
  # 구독 플랜 변경
  updateSubscription(plan: SubscriptionPlan!): User!
  
  # API 키 재생성
  regenerateApiKey: ApiKey!
}
```

## 7. 서브스크립션

### 실시간 업데이트
```graphql
type Subscription {
  # 콘텐츠 상태 업데이트
  contentStatusUpdated(contentId: ID!): Content!
  
  # 캠페인 성과 업데이트
  campaignPerformanceUpdated(campaignId: ID!): Performance!
  
  # 사용량 알림
  usageAlert(userId: ID!): UsageAlert!
}

type UsageAlert {
  type: String!
  message: String!
  currentUsage: Int!
  limit: Int!
  percentageUsed: Float!
}
```

### WebSocket 연결
```javascript
const wsClient = new SubscriptionClient(
  'wss://api.thebespoke-ai.com/graphql',
  {
    reconnect: true,
    connectionParams: {
      authToken: 'Bearer {access_token}'
    }
  }
);
```

## 8. 에러 처리

### GraphQL 에러 형식
```json
{
  "errors": [
    {
      "message": "리소스를 찾을 수 없습니다",
      "extensions": {
        "code": "RESOURCE_NOT_FOUND",
        "resourceId": "content_123456"
      },
      "path": ["content"],
      "locations": [{ "line": 2, "column": 3 }]
    }
  ],
  "data": null
}
```

### 에러 코드
| 코드 | 설명 |
|------|------|
| `UNAUTHENTICATED` | 인증 실패 |
| `FORBIDDEN` | 권한 없음 |
| `RESOURCE_NOT_FOUND` | 리소스 없음 |
| `VALIDATION_ERROR` | 입력 검증 실패 |
| `INTERNAL_ERROR` | 서버 오류 |
| `RATE_LIMITED` | 요청 한도 초과 |

## 9. 페이지네이션

### Relay 스타일 커서 페이지네이션
```graphql
type ContentConnection {
  edges: [ContentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ContentEdge {
  cursor: String!
  node: Content!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 페이지네이션 쿼리 예시
```graphql
query {
  contents(first: 10, after: "cursor_abc123") {
    edges {
      cursor
      node {
        id
        title
        type
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

## 10. 사용 예제

### 콘텐츠 생성 및 조회
```graphql
# 콘텐츠 생성
mutation CreateBlogPost {
  createContent(input: {
    type: TEXT
    prompt: {
      main: "AI 마케팅의 미래에 대한 블로그 포스트"
      style: "professional"
      tone: "informative"
      length: 1500
      keywords: ["AI", "마케팅", "자동화"]
    }
    options: {
      language: "ko"
      format: "markdown"
      includeImages: true
    }
  }) {
    id
    status
    estimatedCompletion
  }
}

# 콘텐츠 상태 구독
subscription WatchContent {
  contentStatusUpdated(contentId: "content_123456") {
    id
    status
    title
    qualityScore
    downloadUrl
  }
}

# 완성된 콘텐츠 조회
query GetContent {
  content(id: "content_123456") {
    id
    type
    status
    title
    body
    metadata
    qualityScore
    createdAt
    completedAt
  }
}
```

### 캠페인 관리
```graphql
# 캠페인 생성
mutation CreateCampaign {
  createCampaign(input: {
    name: "2025 여름 프로모션"
    type: "multi_channel"
    objectives: {
      primary: "brand_awareness"
      secondary: ["lead_generation", "engagement"]
    }
    targetAudience: {
      demographics: {
        ageRange: [25, 45]
        gender: "all"
        location: ["KR", "US"]
      }
      interests: ["technology", "startup"]
    }
    budget: {
      total: 50000
      currency: "USD"
    }
    schedule: {
      startDate: "2025-06-01"
      endDate: "2025-08-31"
      timezone: "Asia/Seoul"
    }
  }) {
    id
    name
    status
  }
}

# 캠페인 성과 조회
query CampaignPerformance {
  campaign(id: "campaign_789") {
    id
    name
    performance {
      impressions
      clicks
      ctr
      conversions
      roi
    }
    contents {
      id
      type
      qualityScore
    }
  }
}
```

### 복잡한 쿼리 예시
```graphql
query Dashboard {
  me {
    id
    name
    subscription {
      plan
      expiresAt
    }
    usage {
      contentsCreated
      contentsLimit
    }
  }
  
  recentContents: contents(
    first: 5
    status: COMPLETED
  ) {
    edges {
      node {
        id
        title
        type
        qualityScore
        createdAt
      }
    }
  }
  
  activeCampaigns: campaigns(
    status: ACTIVE
    first: 3
  ) {
    edges {
      node {
        id
        name
        performance {
          roi
          conversions
        }
      }
    }
  }
}
```

---

*GraphQL API는 지속적으로 개선되고 있습니다. 최신 스키마는 GraphQL Playground에서 확인하세요.*