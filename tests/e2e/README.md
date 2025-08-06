# Bespoke AI Suite E2E Tests

포괄적인 End-to-End 테스트 스위트로 Bespoke AI Suite의 전체 사용자 여정을 테스트합니다.

## 🏗️ Architecture

이 테스트 스위트는 Clean Architecture 원칙을 따라 구성되어 있습니다:

```
tests/e2e/
├── tests/
│   ├── config/           # 테스트 구성 및 설정
│   ├── fixtures/         # 테스트 데이터 및 팩토리
│   ├── pages/           # Page Object Model
│   ├── utils/           # 헬퍼 유틸리티
│   ├── auth/            # 인증 테스트
│   ├── content/         # 콘텐츠 관리 테스트
│   ├── api/             # API 통합 테스트
│   ├── performance/     # 성능 테스트
│   └── visual/          # 시각적 회귀 테스트
├── playwright.config.ts # Playwright 구성
├── package.json         # 의존성 및 스크립트
└── README.md           # 이 파일
```

## 🚀 Quick Start

### 1. 의존성 설치

```bash
# E2E 테스트 디렉토리로 이동
cd tests/e2e

# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install
```

### 2. 서비스 시작

E2E 테스트를 실행하기 전에 모든 서비스가 실행 중이어야 합니다:

```bash
# 루트 디렉토리에서
npm run docker:up  # Docker 서비스 시작
npm run dev        # 애플리케이션 서비스 시작
```

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 브라우저에서만 실행
npm test -- --project=chromium

# 헤드리스 모드로 실행
npm run test:headed

# UI 모드로 실행
npm run test:ui

# 특정 테스트 스위트만 실행
npm run test:smoke    # 스모크 테스트
npm run test:auth     # 인증 테스트
npm run test:content  # 콘텐츠 테스트
npm run test:api      # API 테스트
```

## 📋 Test Categories

### 🔐 Authentication Tests (`@auth`)
- 로그인/로그아웃 기능
- 폼 검증
- 세션 관리
- 사용자 역할별 테스트

### 📝 Content Management Tests (`@content`)
- 수동 콘텐츠 생성
- AI 기반 콘텐츠 생성
- 콘텐츠 목록 및 필터링
- 콘텐츠 게시 워크플로우

### 🔌 API Integration Tests (`@api`)
- REST API 엔드포인트
- 인증 토큰 관리
- 에러 처리
- 성능 및 보안

### ⚡ Performance Tests (`@performance`)
- Core Web Vitals
- 페이지 로드 시간
- API 응답 시간
- 메모리 사용량

### 👀 Visual Regression Tests (`@visual`)
- 스크린샷 비교
- 반응형 디자인
- 테마 일관성
- 크로스 브라우저 호환성

## 🔧 Configuration

### Environment Variables

테스트 환경을 위한 환경 변수를 설정하세요:

```bash
# .env.test 파일 생성
FRONTEND_URL=http://localhost:3005
CONTENT_SERVICE_URL=http://localhost:8081
USER_SERVICE_URL=http://localhost:8082
CAMPAIGN_SERVICE_URL=http://localhost:8083
ANALYTICS_SERVICE_URL=http://localhost:8084

# 테스트 사용자 계정
TEST_USER_EMAIL=user@bespoke.ai
TEST_USER_PASSWORD=UserTest123!
TEST_ADMIN_EMAIL=admin@bespoke.ai
TEST_ADMIN_PASSWORD=AdminTest123!
```

### Playwright Configuration

`playwright.config.ts`에서 다음을 구성할 수 있습니다:

- 브라우저 프로젝트 (Chrome, Firefox, Safari)
- 모바일 디바이스 에뮬레이션
- 테스트 타임아웃 설정
- 리포터 구성
- 스크린샷 및 비디오 설정

## 📊 Test Reports

테스트 실행 후 다음 보고서가 생성됩니다:

### HTML Report
```bash
npm run test:report
```
- 대화형 HTML 보고서
- 실패한 테스트의 스크린샷 및 비디오
- 테스트 실행 추적

### JSON Report
- 테스트 결과의 구조화된 데이터
- CI/CD 파이프라인과의 통합을 위함

### Allure Report
```bash
npx allure serve test-results/allure-results
```
- 상세한 테스트 분석
- 히스토리 추적
- 실행 추세

## 🏃‍♂️ CI/CD Integration

### GitHub Actions

`.github/workflows/e2e-tests.yml` 워크플로우가 포함되어 있습니다:

- 풀 리퀘스트 및 메인 브랜치에서 자동 실행
- 멀티 브라우저 테스트 매트릭스
- 테스트 샤딩으로 병렬 실행
- 성능 감사 (Lighthouse)
- 보안 스캔 (OWASP ZAP)

### Manual Workflow Dispatch

GitHub Actions UI에서 수동으로 특정 테스트 스위트를 실행할 수 있습니다:

```yaml
# 워크플로우 입력 옵션
test_suite:
  - all (기본값)
  - smoke
  - auth
  - content
  - api
  - performance
  - visual
```

## 🛠️ Development

### Page Object Pattern

모든 페이지 상호작용은 Page Object 패턴을 사용합니다:

```typescript
// pages/content-page.ts
export class ContentPage extends BasePage {
  async createContent(content: TestContent): Promise<void> {
    await this.clickCreateContent();
    await this.fillContentForm(content);
    await this.saveContent();
  }
}

// 테스트에서 사용
const contentPage = new ContentPage(page);
await contentPage.createContent(testData);
```

### Test Data Factory

동적 테스트 데이터 생성:

```typescript
// fixtures/test-data.ts
export class TestDataFactory {
  static createContent(overrides?: Partial<TestContent>): TestContent {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      ...overrides
    };
  }
}
```

### Utilities

재사용 가능한 헬퍼 함수:

```typescript
// utils/test-helpers.ts
export class TestHelpers {
  static async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }
  
  static async measurePerformance(page: Page): Promise<PerformanceMetrics> {
    // 성능 메트릭 측정 로직
  }
}
```

## 🐛 Debugging

### Debug Mode

```bash
# 디버그 모드로 테스트 실행
npm run test:debug

# 특정 테스트 디버그
npx playwright test auth.spec.ts --debug
```

### Screenshots and Videos

실패한 테스트의 경우 자동으로 생성됩니다:
- `test-results/` 디렉토리에 저장
- 스크린샷: 실패 시점
- 비디오: 전체 테스트 실행 과정

### Trace Viewer

```bash
# 트레이스 뷰어로 실패 분석
npx playwright show-trace test-results/trace.zip
```

## 📈 Performance Monitoring

### Core Web Vitals

자동으로 측정되는 메트릭:
- **LCP** (Largest Contentful Paint): < 2.5초
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Custom Metrics

```typescript
const metrics = await TestHelpers.measurePagePerformance(page);
expect(metrics.loadTime).toBeLessThan(3000);
```

### Lighthouse Integration

CI/CD 파이프라인에서 자동 성능 감사:
- 성능 점수 > 80%
- 접근성 점수 > 90%
- 모범 사례 점수 > 80%

## 🔒 Security Testing

### OWASP ZAP Integration

자동 보안 스캔:
- XSS 취약점
- SQL 인젝션
- CSRF 보호
- 인증 우회

### Security Test Cases

```typescript
test('should prevent XSS attacks', async ({ page }) => {
  const maliciousScript = '<script>alert("xss")</script>';
  await contentPage.createContent({ title: maliciousScript });
  
  // 콘텐츠가 이스케이프되어야 함
  expect(await page.textContent()).not.toContain('<script>');
});
```

## 📱 Mobile Testing

### Device Emulation

다양한 디바이스에서 테스트:
- iPhone SE, iPhone 13
- iPad
- Android 디바이스
- 다양한 화면 해상도

### Responsive Design Tests

```typescript
test('should work on mobile devices', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await contentPage.testMobileLayout();
});
```

## 🔄 Continuous Improvement

### Test Maintenance

- 정기적인 테스트 리뷰 및 업데이트
- 플레이키 테스트 식별 및 수정
- 성능 벤치마크 업데이트

### Metrics Tracking

- 테스트 실행 시간
- 성공/실패율
- 커버리지 메트릭
- 성능 추세

## 🆘 Troubleshooting

### Common Issues

1. **서비스 시작 실패**
   ```bash
   # 포트 충돌 확인
   lsof -ti:3005 | xargs kill -9
   
   # Docker 서비스 재시작
   docker-compose down && docker-compose up -d
   ```

2. **브라우저 설치 문제**
   ```bash
   npx playwright install --with-deps
   ```

3. **테스트 타임아웃**
   - `playwright.config.ts`에서 타임아웃 증가
   - 네트워크 상태 확인

### Getting Help

- 🐛 이슈 리포트: GitHub Issues
- 💬 토론: GitHub Discussions
- 📖 문서: [Playwright Documentation](https://playwright.dev)

## 🎯 Best Practices

1. **Page Object Pattern 사용**: 유지보수성 향상
2. **독립적인 테스트**: 테스트 간 의존성 없음
3. **명확한 테스트 이름**: 테스트 목적을 명확히 표현
4. **적절한 대기**: `waitFor` 조건 사용
5. **데이터 정리**: 테스트 후 생성된 데이터 정리
6. **성능 고려**: 불필요한 대기 시간 최소화

---

**Bespoke AI Suite E2E Tests** - 안정적이고 확장 가능한 테스트 자동화 🚀