# User Service

Bespoke AI Suite의 사용자 인증 및 관리 서비스입니다.

## 기술 스택

- **언어**: Go 1.22
- **프레임워크**: Gin Web Framework
- **데이터베이스**: PostgreSQL 17
- **캐시**: Redis 7
- **아키텍처**: Clean Architecture

## 주요 기능

- JWT 기반 사용자 인증
- 사용자 등록 및 프로필 관리
- 구독 플랜 관리 (Free, Pro, Enterprise)
- 사용량 추적
- Redis를 활용한 토큰 관리

## 프로젝트 구조

```
services/user/
├── cmd/server/              # 애플리케이션 진입점
├── internal/
│   ├── domain/              # 엔티티 계층 (비즈니스 로직)
│   │   ├── entities/        # 도메인 엔티티
│   │   ├── repositories/    # 레포지토리 인터페이스
│   │   └── valueobjects/    # 값 객체
│   ├── application/         # 유스케이스 계층
│   │   ├── interfaces/      # 포트 인터페이스
│   │   └── usecases/        # 비즈니스 유스케이스
│   └── infrastructure/      # 인프라 계층
│       ├── auth/            # JWT 인증 구현
│       ├── config/          # 설정 관리
│       ├── controllers/     # HTTP 컨트롤러
│       ├── database/        # 데이터베이스 연결
│       ├── middleware/      # HTTP 미들웨어
│       └── repositories/    # 레포지토리 구현
├── migrations/              # 데이터베이스 마이그레이션
└── tests/                   # 테스트 파일
```

## 시작하기

### 사전 요구사항

- Go 1.22 이상
- PostgreSQL 17
- Redis 7
- Docker & Docker Compose (선택사항)

### 설치 및 실행

1. **의존성 설치**
   ```bash
   go mod download
   ```

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열어 필요한 값들을 설정
   ```

3. **데이터베이스 마이그레이션**
   ```bash
   go run cmd/migrate/main.go up
   ```

4. **서비스 실행**
   ```bash
   go run cmd/server/main.go
   ```

   또는 빌드 후 실행:
   ```bash
   go build -o server cmd/server/main.go
   ./server
   ```

### Docker로 실행

```bash
docker build -t bespoke-user-service .
docker run -p 8080:8080 --env-file .env bespoke-user-service
```

## API 엔드포인트

### 인증 관련

- `POST /api/v1/users/register` - 사용자 등록
- `POST /api/v1/users/login` - 로그인
- `POST /api/v1/users/logout` - 로그아웃 (개발 중)
- `POST /api/v1/users/refresh` - 토큰 갱신 (개발 중)

### 사용자 관련

- `GET /api/v1/users/me` - 현재 사용자 프로필 조회
- `PUT /api/v1/users/me` - 프로필 업데이트 (개발 중)

### 헬스체크

- `GET /health` - 서비스 상태 확인

## 개발

### 테스트 실행

```bash
# 모든 테스트 실행
go test ./...

# 특정 패키지 테스트
go test ./internal/domain/entities

# 커버리지 확인
go test -cover ./...
```

### API 테스트

```bash
# 테스트 스크립트 실행
./test_api.sh
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| SERVER_PORT | 서버 포트 | 8080 |
| DATABASE_HOST | PostgreSQL 호스트 | localhost |
| DATABASE_PORT | PostgreSQL 포트 | 5432 |
| DATABASE_USER | DB 사용자명 | bespoke |
| DATABASE_PASSWORD | DB 비밀번호 | - |
| DATABASE_NAME | DB 이름 | bespoke_user |
| REDIS_HOST | Redis 호스트 | localhost |
| REDIS_PORT | Redis 포트 | 6379 |
| JWT_SECRET | JWT 시크릿 키 | - |
| JWT_EXPIRY | JWT 만료 시간 | 15m |

## Clean Architecture 원칙

이 프로젝트는 Clean Architecture 원칙을 따릅니다:

1. **엔티티 (Domain)**: 핵심 비즈니스 로직과 규칙
2. **유스케이스 (Application)**: 애플리케이션별 비즈니스 규칙
3. **인터페이스 어댑터 (Infrastructure)**: 컨트롤러, 프리젠터, 게이트웨이
4. **프레임워크 & 드라이버**: 외부 도구 (DB, Web 프레임워크)

의존성은 항상 안쪽으로만 향하며, 내부 계층은 외부 계층을 알지 못합니다.

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.