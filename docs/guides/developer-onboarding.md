# Bespoke AI Suite 개발자 온보딩 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 대상: 신규 개발자 및 기여자  
> 예상 소요 시간: 2-3일

## 목차

1. [시작하기 전에](#1-시작하기-전에)
2. [개발 환경 설정](#2-개발-환경-설정)
3. [프로젝트 구조 이해](#3-프로젝트-구조-이해)
4. [Clean Architecture 실습](#4-clean-architecture-실습)
5. [첫 번째 기능 구현](#5-첫-번째-기능-구현)
6. [테스팅 가이드](#6-테스팅-가이드)
7. [코드 리뷰 프로세스](#7-코드-리뷰-프로세스)
8. [배포 프로세스](#8-배포-프로세스)
9. [트러블슈팅](#9-트러블슈팅)
10. [추가 리소스](#10-추가-리소스)

---

## 1. 시작하기 전에

### 필수 지식
- **프로그래밍 언어**: JavaScript/TypeScript, Python, Go 중 하나 이상
- **아키텍처 패턴**: Clean Architecture, 마이크로서비스 기본 개념
- **도구**: Git, Docker, Kubernetes 기본 사용법
- **데이터베이스**: SQL 기본 쿼리, NoSQL 개념

### 시스템 요구사항
- **OS**: macOS, Linux, Windows (WSL2)
- **RAM**: 16GB 이상 권장
- **디스크**: 50GB 이상 여유 공간
- **프로세서**: 4코어 이상

### 필수 계정
- GitHub 계정 (2FA 설정 필수)
- Docker Hub 계정
- AWS/GCP 계정 (개발 환경용)
- Slack 워크스페이스 접근

## 2. 개발 환경 설정

### 2.1 필수 도구 설치

```bash
# Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 개발 도구 설치
brew install git node python go docker kubectl helm terraform

# Node.js 버전 관리자 (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Python 버전 관리자 (pyenv)
brew install pyenv
pyenv install 3.11.0
pyenv global 3.11.0

# Go 모듈 설정
go env -w GO111MODULE=on
go env -w GOPROXY=https://proxy.golang.org,direct
```

### 2.2 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
git clone https://github.com/bespoke-ai/suite.git
cd suite

# Git 설정
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 프로젝트별 환경 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정

# 의존성 설치
make install-all
```

### 2.3 로컬 개발 환경 실행

```bash
# Docker Compose로 인프라 실행
docker-compose up -d

# 서비스별 실행 (터미널을 여러 개 열어서)
# Terminal 1: Content Service
cd services/content
npm run dev

# Terminal 2: Campaign Service
cd services/campaign
python -m uvicorn main:app --reload

# Terminal 3: User Service
cd services/user
go run ./cmd/server

# Terminal 4: Analytics Service
cd services/analytics
./gradlew bootRun
```

### 2.4 IDE 설정

**VS Code 권장 확장**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "golang.go",
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "eamodio.gitlens"
  ]
}
```

## 3. 프로젝트 구조 이해

### 3.1 전체 구조
```
bespoke-ai-suite/
├── services/                 # 마이크로서비스
│   ├── content/             # 콘텐츠 서비스 (Node.js)
│   ├── campaign/            # 캠페인 서비스 (Python)
│   ├── user/                # 사용자 서비스 (Go)
│   └── analytics/           # 분석 서비스 (Java)
├── packages/                # 공유 패키지
│   ├── common/              # 공통 유틸리티
│   ├── contracts/           # API 계약
│   └── ui-components/       # UI 컴포넌트
├── infrastructure/          # 인프라 코드
│   ├── kubernetes/          # K8s 매니페스트
│   ├── terraform/           # IaC 코드
│   └── docker/              # Dockerfile들
├── docs/                    # 문서
├── scripts/                 # 유틸리티 스크립트
└── tests/                   # E2E 테스트
```

### 3.2 서비스별 Clean Architecture 구조

```
services/content/
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
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

### 3.3 코드 컨벤션

**명명 규칙**:
- **파일명**: kebab-case (예: `content-service.ts`)
- **클래스명**: PascalCase (예: `ContentEntity`)
- **함수명**: camelCase (예: `createContent`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

**디렉토리 구조 규칙**:
- 각 계층은 독립적이어야 함
- 의존성은 항상 안쪽으로 (외부 → 인터페이스 → 유스케이스 → 엔티티)
- 계층 간 직접 참조 금지

## 4. Clean Architecture 실습

### 4.1 엔티티 생성 예제

```typescript
// domain/entities/content.entity.ts
export class Content {
  private constructor(
    private readonly id: string,
    private readonly type: ContentType,
    private readonly title: string,
    private readonly body: string,
    private readonly qualityScore: number,
    private readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.length < 5) {
      throw new Error('제목은 5자 이상이어야 합니다.');
    }
    if (this.qualityScore < 0 || this.qualityScore > 100) {
      throw new Error('품질 점수는 0-100 사이여야 합니다.');
    }
  }

  static create(props: ContentProps): Content {
    return new Content(
      generateId(),
      props.type,
      props.title,
      props.body,
      0, // 초기 품질 점수
      new Date()
    );
  }

  // 비즈니스 로직
  updateQualityScore(score: number): void {
    if (score < 0 || score > 100) {
      throw new Error('잘못된 품질 점수');
    }
    this.qualityScore = score;
  }
}
```

### 4.2 유스케이스 구현 예제

```typescript
// application/use-cases/create-content.use-case.ts
export class CreateContentUseCase {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly aiService: AIService,
    private readonly eventBus: EventBus
  ) {}

  async execute(request: CreateContentRequest): Promise<CreateContentResponse> {
    // 1. 입력 검증
    const validatedRequest = this.validate(request);

    // 2. AI를 통한 콘텐츠 생성
    const generatedContent = await this.aiService.generate({
      prompt: validatedRequest.prompt,
      type: validatedRequest.type
    });

    // 3. 엔티티 생성
    const content = Content.create({
      type: validatedRequest.type,
      title: generatedContent.title,
      body: generatedContent.body
    });

    // 4. 저장
    await this.contentRepository.save(content);

    // 5. 이벤트 발행
    await this.eventBus.publish(new ContentCreatedEvent(content));

    // 6. 응답 반환
    return {
      id: content.getId(),
      status: 'processing'
    };
  }

  private validate(request: CreateContentRequest): ValidatedRequest {
    // 검증 로직
    return request as ValidatedRequest;
  }
}
```

### 4.3 컨트롤러 구현 예제

```typescript
// infrastructure/controllers/content.controller.ts
@Controller('/contents')
export class ContentController {
  constructor(
    private readonly createContentUseCase: CreateContentUseCase
  ) {}

  @Post('/')
  @UseGuards(AuthGuard)
  async createContent(
    @Body() dto: CreateContentDto,
    @User() user: UserInfo
  ): Promise<ApiResponse> {
    try {
      const result = await this.createContentUseCase.execute({
        userId: user.id,
        type: dto.type,
        prompt: dto.prompt,
        options: dto.options
      });

      return {
        status: 'success',
        data: result
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
```

## 5. 첫 번째 기능 구현

### 5.1 태스크 선택
1. Jira에서 "good-first-issue" 라벨이 붙은 티켓 확인
2. 팀 리드와 논의하여 적절한 태스크 할당
3. 예상 작업 시간 확인 (첫 태스크는 2-3일 이내 완료 가능한 것)

### 5.2 브랜치 생성
```bash
# 최신 main 브랜치에서 시작
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/JIRA-123-add-content-filter
```

### 5.3 TDD 접근법
1. **테스트 작성**: 기능 요구사항을 테스트로 표현
2. **실패 확인**: 테스트가 실패하는 것 확인
3. **구현**: 테스트를 통과하는 최소한의 코드 작성
4. **리팩토링**: 코드 품질 개선

```typescript
// tests/unit/create-content.use-case.test.ts
describe('CreateContentUseCase', () => {
  it('should create content with valid request', async () => {
    // Given
    const mockRepository = createMockRepository();
    const mockAIService = createMockAIService();
    const useCase = new CreateContentUseCase(mockRepository, mockAIService);

    // When
    const result = await useCase.execute({
      type: 'text',
      prompt: 'Test prompt'
    });

    // Then
    expect(result.id).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text'
      })
    );
  });
});
```

### 5.4 커밋 메시지 작성
```bash
# 좋은 예
git commit -m "feat: 콘텐츠 필터링 기능 추가

- 콘텐츠 타입별 필터링 구현
- 날짜 범위 필터 추가
- 품질 점수 기준 필터 추가

Closes: JIRA-123"

# 나쁜 예
git commit -m "필터 추가"
```

## 6. 테스팅 가이드

### 6.1 테스트 피라미드
```
        /\
       /E2E\      (10%)
      /------\
     /Integration\ (30%)
    /------------\
   /    Unit      \ (60%)
  /________________\
```

### 6.2 단위 테스트
```bash
# 서비스별 단위 테스트 실행
cd services/content
npm test

# 커버리지 확인
npm run test:coverage
```

### 6.3 통합 테스트
```bash
# Docker 환경에서 통합 테스트
docker-compose -f docker-compose.test.yml up
npm run test:integration
```

### 6.4 E2E 테스트
```bash
# Playwright 기반 E2E 테스트
cd tests/e2e
npm run test:e2e
```

## 7. 코드 리뷰 프로세스

### 7.1 PR 생성 전 체크리스트
- [ ] 모든 테스트 통과
- [ ] 코드 커버리지 80% 이상
- [ ] Linting 규칙 준수
- [ ] 문서 업데이트 (필요시)
- [ ] CHANGELOG 업데이트

### 7.2 PR 템플릿
```markdown
## 변경 사항
- 주요 변경 사항 요약

## 구현 내용
- 구체적인 구현 설명

## 테스트
- [ ] 단위 테스트 추가
- [ ] 통합 테스트 추가
- [ ] 수동 테스트 완료

## 스크린샷 (UI 변경시)
- 변경 전/후 스크린샷

## 관련 이슈
- Closes #123
```

### 7.3 리뷰 기준
- Clean Architecture 원칙 준수
- SOLID 원칙 적용
- 성능 영향 검토
- 보안 취약점 확인
- 코드 가독성

## 8. 배포 프로세스

### 8.1 CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
stages:
  - test
  - build
  - deploy-dev
  - deploy-staging
  - deploy-production
```

### 8.2 환경별 배포
1. **개발 환경**: PR 생성시 자동 배포
2. **스테이징 환경**: main 브랜치 머지시 자동 배포
3. **프로덕션 환경**: 수동 승인 후 배포

### 8.3 롤백 절차
```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/content-service

# 특정 버전으로 롤백
kubectl rollout undo deployment/content-service --to-revision=3
```

## 9. 트러블슈팅

### 9.1 자주 발생하는 문제

**Docker 관련**:
```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f content-service

# 완전 초기화
docker-compose down -v
docker-compose up -d
```

**의존성 문제**:
```bash
# Node.js
rm -rf node_modules package-lock.json
npm install

# Python
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 9.2 디버깅 팁
- Chrome DevTools 활용
- VS Code 디버거 설정
- 로그 레벨 조정 (`LOG_LEVEL=debug`)
- 분산 트레이싱 (Jaeger) 활용

## 10. 추가 리소스

### 10.1 내부 문서
- [아키텍처 설계서](../architecture/bespoke-ai-suite-architecture.md)
- [API 명세서](../api/api-specification.md)
- [코딩 스타일 가이드](./coding-style-guide.md)
- [보안 가이드라인](./security-guidelines.md)

### 10.2 학습 자료
- **Clean Architecture**: Robert C. Martin의 "Clean Architecture" 책
- **마이크로서비스**: Sam Newman의 "Building Microservices"
- **도메인 주도 설계**: Eric Evans의 "Domain-Driven Design"
- **Kubernetes**: [공식 문서](https://kubernetes.io/docs/)

### 10.3 팀 연락처
- **Slack**: #dev-general, #dev-help
- **이메일**: dev-team@thebespoke-ai.com
- **위키**: https://wiki.thebespoke-ai.com
- **온콜**: PagerDuty 통해 연락

### 10.4 멘토 프로그램
신규 개발자는 다음 멘토와 매칭됩니다:
1. 기술 멘토: 코드 리뷰 및 기술적 가이드
2. 도메인 멘토: 비즈니스 로직 및 제품 이해
3. 문화 멘토: 팀 문화 및 프로세스 적응

---

**환영합니다!** 🎉  
Bespoke AI Suite 팀은 여러분과 함께 일하게 되어 기쁩니다. 질문이 있으시면 언제든지 팀에 문의해주세요.

*최종 업데이트: 2025년 8월 4일*