# Bespoke AI Suite - Claude 개발 규칙

이 파일은 Bespoke AI Suite 프로젝트에서 Claude가 준수해야 할 아키텍처 원칙과 개발 규칙을 정의합니다.

> 최종 업데이트: 2025년 8월 6일
> 기술 스택 분석 완료: v2.0
> 구현 진행 상황: User Service 완료

## 📊 기술 스택 평가 요약 (2025년 8월 기준)

### 전체 평가: 8.7/10 (매우 우수)
- **강점**: Clean Architecture, Zero Trust 보안, AI/ML 통합, 마이크로서비스
- **개선 기회**: Express.js 현대화, MLOps 간소화, RAG 시스템 도입, WebAuthn 추가

### 우선순위별 개선 권장사항
1. **즉시 (0-3개월)**
   - Express.js → Fastify 마이그레이션 검토
   - RAG 시스템 PoC 구축 (Weaviate + LangChain)
   - OpenTelemetry 도입
   
2. **중기 (3-6개월)**
   - Kubeflow → MLflow + Ray Serve
   - WebAuthn/Passkey 구현
   - Platform Engineering (Backstage IDP)
   
3. **장기 (6-12개월)**
   - 마이크로 프론트엔드 전환
   - Edge Computing 전략
   - Svelte/Solid.js 평가

## 🏗️ Clean Architecture 원칙

### 계층 구조 (의존성 방향: 외부 → 내부)
1. **Entities (엔티티)**: 핵심 비즈니스 로직
2. **Use Cases (유스케이스)**: 애플리케이션 비즈니스 로직
3. **Interface Adapters**: Controllers, Presenters, Gateways
4. **Frameworks & Drivers**: 외부 도구 (DB, Web, UI)

### 의존성 규칙
- 의존성은 항상 안쪽으로만 향해야 함
- 내부 계층은 외부 계층을 모름
- 계층 간 직접 참조 금지
- 인터페이스를 통한 의존성 역전

## 📁 프로젝트 구조

```
services/{service-name}/
├── src/
│   ├── domain/              # 엔티티 계층
│   │   ├── entities/        # 비즈니스 엔티티
│   │   └── value-objects/   # 값 객체
│   ├── application/         # 유스케이스 계층
│   │   ├── use-cases/       # 비즈니스 로직
│   │   └── interfaces/      # 포트 인터페이스
│   ├── infrastructure/      # 인프라 계층
│   │   ├── controllers/     # HTTP 컨트롤러
│   │   ├── repositories/    # 데이터 접근
│   │   ├── external/        # 외부 서비스
│   │   └── config/          # 설정
│   └── main.ts              # 진입점
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

## 🎯 마이크로서비스 구성

### 서비스별 기술 스택 (2025년 8월 업데이트)
- **Content Service**: Node.js/Express.js, TypeScript
- **Campaign Service**: Python/FastAPI, asyncio ✅ (유지)
- **User Service**: Go/Gin, gRPC ✅ (Go 1.22+ 권장)
- **Analytics Service**: Java/Spring Boot → **Spring Boot 3.2+ / Java 21 LTS 권장**

### 서비스 간 통신
- 동기: REST API, gRPC
- 비동기: Apache Kafka 이벤트 스트리밍
- API Gateway: Kong/AWS API Gateway

## 💻 코딩 컨벤션

### 명명 규칙
- **파일명**: kebab-case (예: `content-service.ts`)
- **클래스명**: PascalCase (예: `ContentEntity`)
- **함수명**: camelCase (예: `createContent`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

### TypeScript 규칙
```typescript
// 엔티티는 private constructor + static factory method
export class Content {
  private constructor(private readonly id: string) {}
  
  static create(props: ContentProps): Content {
    // 검증 로직
    return new Content(generateId());
  }
}

// 유스케이스는 execute 메서드 필수
export class CreateContentUseCase {
  async execute(request: Request): Promise<Response> {
    // 비즈니스 로직
  }
}
```

## 🔐 보안 원칙

### 제로 트러스트
- 모든 요청 검증
- 마이크로서비스 간 mTLS
- API 수준 인증/인가

### 데이터 보안
- 전송 중 암호화: TLS 1.3
- 저장 시 암호화: AES-256
- PII 자동 마스킹

## 🚀 API 설계 원칙

### RESTful 원칙
- 리소스 기반 URL
- HTTP 메서드 의미 준수
- 상태코드 정확한 사용
- HATEOAS 적용

### 응답 형식
```json
{
  "status": "success|error",
  "data": {},
  "meta": {
    "timestamp": "2025-08-04T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### 에러 처리
```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "요청한 리소스를 찾을 수 없습니다.",
    "details": {}
  }
}
```

## 🧪 테스팅 전략

### 테스트 피라미드
- Unit Tests: 60% (격리된 단위 테스트)
- Integration Tests: 30% (통합 테스트)
- E2E Tests: 10% (엔드투엔드 테스트)

### TDD 프로세스
1. 테스트 작성 (RED)
2. 최소 구현 (GREEN)
3. 리팩토링 (REFACTOR)

### 커버리지 목표
- 전체: 80% 이상
- 핵심 비즈니스 로직: 90% 이상

## 🤖 AI 통합 가이드라인 (2025년 8월 업데이트)

### Crew AI 에이전트
- **Research Agent**: 시장 조사, 트렌드 분석
- **Planning Agent**: 콘텐츠 전략 수립
- **Creation Agent**: 멀티모달 콘텐츠 생성
- **Review Agent**: 품질 검증, 개선 제안

### RAG (Retrieval-Augmented Generation) 시스템 도입 🆕
- **Vector DB**: Weaviate (하이브리드 검색 지원)
- **Embedding Model**: OpenAI text-embedding-3-large (1024 차원)
- **청크 크기**: 512 토큰 (최적 성능)
- **LLM 통합**: Claude 3.5 Sonnet (primary), GPT-4 Turbo (fallback)

### AI 서비스 통합
- 추상화 레이어 필수
- 멀티 LLM 폴백 전략 구현
- 응답 시간 제한 설정 (30초)
- 비용 모니터링 및 최적화
- 스트리밍 RAG 파이프라인 구축

## 📊 이벤트 기반 아키텍처

### Kafka 토픽 명명
```
{domain}.{action}
예: content.created, campaign.updated
```

### 이벤트 스키마
- Avro 스키마 사용
- Schema Registry 통한 버전 관리
- 후방 호환성 보장

## 🔄 CI/CD 및 배포

### 브랜치 전략
- main: 프로덕션
- develop: 개발
- feature/*: 기능 개발
- hotfix/*: 긴급 수정

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 등 기타
```

### 배포 환경
- 개발: 자동 배포 (PR 생성시)
- 스테이징: 자동 배포 (main 머지시)
- 프로덕션: 수동 승인 후 배포

## 📈 모니터링 및 로깅

### 필수 메트릭
- API 응답 시간
- 에러율
- 처리량 (RPS)
- 리소스 사용률

### 로깅 규칙
- 구조화된 로깅 (JSON)
- 트레이스 ID 포함
- 민감정보 제외
- 적절한 로그 레벨 사용

## 🚀 2025년 추가 기술 가이드라인

### Platform Engineering & IDP (Internal Developer Platform)
- **개발자 포털**: Backstage 기반 셀프 서비스
- **GitOps**: ArgoCD + Flagger (Progressive Delivery)
- **Service Mesh**: Istio 도입 검토 중
- **FinOps**: 클라우드 비용 최적화 자동화

### 프론트엔드 현대화 전략
- **현재**: React 18 + TypeScript + Zustand
- **평가 중**: Svelte 5 (번들 크기 70% 감소), Solid.js (성능 최적화)
- **상태 관리**: Zustand 유지 ✅
- **스타일링**: Tailwind CSS v3.4+ ✅

### 보안 강화 (Zero Trust++)
- **WebAuthn/Passkey**: 2025 Q4 구현 예정
- **mTLS**: 모든 서비스 간 통신
- **SAST/DAST**: GitHub Actions 통합
- **시크릿 관리**: HashiCorp Vault

### 모니터링 & 관측성
- **현재**: Prometheus + Grafana
- **추가 예정**: OpenTelemetry (전체 추적)
- **APM**: Datadog 또는 New Relic 평가 중

## ⚠️ 주의사항

### 금지 사항
- 비즈니스 로직을 컨트롤러에 작성
- 엔티티에서 인프라 계층 참조
- 동기적 긴 작업 (3초 이상)
- 하드코딩된 설정값
- 벡터 DB 없는 단순 LLM 호출 (RAG 필수)

### 필수 사항
- 모든 외부 호출 타임아웃 설정
- 에러 처리 및 로깅
- 입력 검증
- 단위 테스트 작성
- AI 응답 품질 검증 (Quality Score ≥ 85)

## 📈 기술 부채 및 개선 로드맵

### 현재 기술 부채 (2025년 8월)
1. **Express.js 레거시** - 부채 점수: 75/100
2. **Kubeflow 복잡성** - 부채 점수: 65/100  
3. **단순 LLM 호출** - 부채 점수: 55/100
4. **모놀리식 프론트엔드** - 부채 점수: 45/100

### 분기별 개선 계획
- **2025 Q3**: Express→Fastify 마이그레이션 평가, RAG 시스템 구축
- **2025 Q4**: Content Service 전체 Fastify 마이그레이션, MLOps 간소화, WebAuthn 구현
- **2026 Q1**: 마이크로 프론트엔드, Platform Engineering

### 예상 ROI
- 총 투자: $500,000 (6개월)
- 연간 절감: $400,000
- 생산성 향상: 40%
- 투자 회수: 15개월

## 🔗 참고 문서
- [아키텍처 설계서](docs/architecture/bespoke-ai-suite-architecture.md)
- [API 명세서](docs/api/api-specification.md)
- [개발자 온보딩](docs/guides/developer-onboarding.md)
- [기술 스택 분석 보고서 v2.0](2025년 8월 4일 작성)

---

## 📌 현재 진행 상황 (2025년 8월 6일)

### ✅ 완료된 작업
- **User Service 구현 완료** (Go + Gin + GORM + Clean Architecture)
  - 도메인 계층: User Entity, Value Objects, 도메인 서비스
  - 애플리케이션 계층: 등록/로그인 유스케이스
  - 인프라 계층: PostgreSQL Repository, Gin Controllers
  - JWT 인증 및 Redis 세션 관리
- **Docker Compose 설정 완료**
  - PostgreSQL 17, MongoDB 7, Redis 7.3
  - Kafka, Weaviate, MinIO
- **프로젝트 기본 구조 설정**
- **Makefile 자동화 구성**

### 🔄 진행 중인 작업
- Content Service 구현 예정 (Fastify + TypeScript)
- Frontend 개발 예정 (Next.js 15 + React 19)

### 📋 다음 단계
1. Content Service 개발 (Fastify, TypeScript, MongoDB)
2. Campaign Service 개발 (Python, FastAPI)
3. Analytics Service 개발 (Java, Spring Boot)
4. Frontend 개발 (Next.js 15, React 19, Tailwind CSS)
5. Kubernetes 배포 설정

---

*이 규칙은 Bespoke AI Suite 프로젝트의 일관성과 품질을 보장하기 위해 모든 개발 과정에서 준수되어야 합니다.*
*최종 기술 검토: 2025년 8월 6일 | 다음 검토: 2025년 11월 1일*