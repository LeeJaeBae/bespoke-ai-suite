# 🧪 Bespoke AI Suite - E2E Testing Suite

Playwright를 사용한 4개 마이크로서비스의 종합 E2E 테스트 스위트입니다.

## 📋 테스트 개요

### 테스트 대상 서비스
- **Content Service** (Port: 8081) - `/health`
- **User Service** (Port: 8084) - `/health` 
- **Campaign Service** (Port: 8085) - `/health`
- **Analytics Service** (Port: 8086) - `/api/v1/health`

### 테스트 범위
1. **Health Check 테스트**: 모든 서비스 응답 확인
2. **Response Time 측정**: 각 서비스 응답 시간 검증
3. **Status Code 검증**: HTTP 200 응답 확인
4. **Response Body 검증**: JSON 구조 및 내용 검증
5. **Cross-Service Communication**: 서비스 간 기본 통신 테스트
6. **Performance Benchmarking**: 부하 테스트 및 성능 측정

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install --legacy-peer-deps
npx playwright install chromium
```

### 2. 서비스 실행 확인
모든 마이크로서비스가 실행 중인지 확인:
```bash
curl http://localhost:8081/health
curl http://localhost:8084/health
curl http://localhost:8085/health
curl http://localhost:8086/api/v1/health
```

### 3. 테스트 실행
```bash
# 전체 테스트 실행
npm run test:e2e

# 개별 테스트 실행
npx playwright test health-check.spec.ts
npx playwright test integration.spec.ts

# UI 모드로 실행
npx playwright test --ui

# 헤드리스 모드로 실행
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

## 📁 프로젝트 구조

```
tests/e2e/
├── config/
│   └── services.ts              # 서비스 설정 및 엔드포인트
├── helpers/
│   └── test-helpers.ts          # 테스트 유틸리티 함수
├── global-setup.ts              # 전역 설정
├── global-teardown.ts           # 전역 정리
├── health-check.spec.ts         # 메인 Health Check 테스트
└── integration.spec.ts          # Integration 테스트

playwright.config.ts             # Playwright 설정
package.json                     # NPM 의존성
tsconfig.json                    # TypeScript 설정
```

## 🔧 설정 파일

### Playwright 설정 (playwright.config.ts)
- 브라우저: Chromium
- 타임아웃: 30초
- 리포터: HTML, JSON, JUnit
- 병렬 실행: 지원
- 스크린샷: 실패 시만
- 비디오: 실패 시만

### 서비스 설정 (tests/e2e/config/services.ts)
각 서비스별 설정:
```typescript
{
  name: string,
  baseUrl: string,
  port: number,
  healthEndpoint: string,
  expectedFields: string[],
  timeout: number,
  maxResponseTime: number
}
```

## 📊 테스트 유형

### 1. Health Check Tests (`health-check.spec.ts`)
- 개별 서비스 Health Check
- Response Time 측정 및 검증
- JSON 구조 검증
- Cross-Service Communication
- Performance Benchmarking

### 2. Integration Tests (`integration.spec.ts`)
- Analytics API 엔드포인트 테스트
- 서비스 부하 테스트
- 에러 처리 검증
- Response Time 일관성 테스트

## 🎯 테스트 헬퍼 함수

### `validateHealthResponse()`
서비스별 Health Check 응답 구조 검증

### `validateResponseTime()`
응답 시간이 허용 범위 내인지 검증

### `calculateServiceMetrics()`
전체 시스템 메트릭 계산

### `retryWithBackoff()`
지수 백오프를 통한 재시도 로직

## 📈 성능 메트릭

### 응답 시간 기준
- **Content Service**: 최대 2000ms
- **User Service**: 최대 2000ms
- **Campaign Service**: 최대 2000ms
- **Analytics Service**: 최대 2000ms

### 성공률 기준
- **Health Check**: 100%
- **Load Test**: 70% 이상
- **Cross-Service**: 100%

## 🔍 테스트 결과 확인

### 콘솔 출력
테스트 실행 중 실시간으로 다음 정보를 확인할 수 있습니다:
- 서비스별 응답 시간
- HTTP 상태 코드
- JSON 응답 내용
- 성능 메트릭
- 에러 상세 정보

### HTML 리포트
```bash
npx playwright show-report
```

### JSON 결과
```bash
cat test-results/results.json
```

## ⚠️ 문제 해결

### 1. 서비스 연결 실패
```bash
# 서비스 상태 확인
docker-compose ps
curl -I http://localhost:8081/health
```

### 2. 의존성 충돌
```bash
npm install --legacy-peer-deps
```

### 3. 테스트 타임아웃
`playwright.config.ts`에서 타임아웃 값 조정:
```typescript
timeout: 60000, // 60초로 증가
```

### 4. 브라우저 설치 문제
```bash
npx playwright install --force
```

## 🚀 CI/CD 통합

### GitHub Actions
```yaml
- name: Install dependencies
  run: npm ci --legacy-peer-deps

- name: Install Playwright
  run: npx playwright install chromium

- name: Run E2E tests
  run: npm run test:e2e
```

### Docker
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
COPY . .
RUN npm ci --legacy-peer-deps
RUN npm run test:e2e
```

## 📝 최신 테스트 결과

**마지막 실행**: 2025년 8월 6일  
**성공률**: 90% (9/10 테스트 통과)  
**평균 응답 시간**: 17.9ms  
**시스템 가용성**: 100%

상세한 결과는 `E2E_TEST_REPORT.md`를 참조하세요.

## 🤝 기여하기

### 새로운 테스트 추가
1. `tests/e2e/` 디렉토리에 새 `.spec.ts` 파일 생성
2. 테스트 케이스 작성
3. `services.ts`에 필요한 설정 추가

### 테스트 헬퍼 함수 추가
1. `helpers/test-helpers.ts`에 함수 추가
2. 적절한 타입 정의
3. JSDoc 주석 작성

---

**문의사항**: Bespoke AI Team  
**문서 업데이트**: 2025년 8월 6일