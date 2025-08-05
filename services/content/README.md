# Content Service

AI-powered content generation and management service for Bespoke AI Suite.

## 기술 스택

- **Framework**: Fastify (Express 대체, 성능 최적화)
- **Language**: TypeScript with ES Modules
- **Database**: MongoDB with Mongoose
- **Architecture**: Clean Architecture (Domain-Driven Design)
- **AI Integration**: Crew AI (Multi-agent system)
- **Event Streaming**: Apache Kafka

## 프로젝트 구조

```
src/
├── domain/              # 엔티티, 값 객체, 리포지토리 인터페이스
├── application/         # 유스케이스, DTO, 애플리케이션 인터페이스
├── infrastructure/      # 구현체 (컨트롤러, 리포지토리, 외부 서비스)
└── main.ts             # 애플리케이션 진입점
```

## 설치 및 실행

### 사전 요구사항
- Node.js 20+
- MongoDB 6+
- Kafka (선택사항)

### 개발 환경 설정

1. 환경 변수 설정:
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 설정
```

2. 의존성 설치:
```bash
npm install
```

3. 개발 서버 실행:
```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm start
```

### Docker 실행

```bash
docker build -t content-service .
docker run -p 8081:8081 --env-file .env content-service
```

## API 엔드포인트

- `POST /contents` - AI 기반 콘텐츠 생성
- `GET /contents/:id` - 콘텐츠 조회
- `PUT /contents/:id` - 콘텐츠 수정
- `DELETE /contents/:id` - 콘텐츠 삭제
- `GET /contents` - 콘텐츠 목록 조회
- `POST /contents/:id/publish` - 콘텐츠 발행

## API 문서

서버 실행 후 다음 URL에서 Swagger 문서 확인:
```
http://localhost:8081/documentation
```

## 주요 기능

### AI 콘텐츠 생성
- Crew AI 에이전트를 활용한 멀티모달 콘텐츠 생성
- 텍스트, 이미지, 비디오 스크립트 지원
- 품질 점수 자동 평가

### 콘텐츠 관리
- CRUD 작업
- 상태 관리 (초안, 발행, 보관)
- 태그 및 메타데이터 관리

### 이벤트 기반 아키텍처
- Kafka를 통한 도메인 이벤트 발행
- 다른 서비스와의 느슨한 결합

## 보안

- JWT 기반 인증
- 리소스 수준 권한 관리
- 입력 검증 및 삭제

## 모니터링

- 구조화된 로깅
- 상태 확인 엔드포인트 (`/health`)
- 성능 메트릭 수집