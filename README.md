# Bespoke AI Suite

<div align="center">
  <img src="docs/assets/logo.png" alt="Bespoke AI Suite Logo" width="200"/>
  
  **차세대 AI 기반 콘텐츠 생성 및 마케팅 최적화 플랫폼**
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Build Status](https://img.shields.io/github/workflow/status/bespoke-ai/suite/CI)](https://github.com/bespoke-ai/suite/actions)
  [![Coverage](https://img.shields.io/codecov/c/github/bespoke-ai/suite)](https://codecov.io/gh/bespoke-ai/suite)
  [![Documentation](https://img.shields.io/badge/docs-latest-brightgreen.svg)](https://docs.bespoke-ai.com)
</div>

---

## 📚 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [아키텍처](#-아키텍처)
- [시작하기](#-시작하기)
- [문서](#-문서)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

## 🎯 소개

Bespoke AI Suite는 중소기업과 스타트업을 위한 혁신적인 AI 기반 SaaS 플랫폼입니다. Crew AI의 멀티 에이전트 기술을 활용하여 맞춤형 콘텐츠를 자동으로 생성하고, 데이터 기반 마케팅 캠페인을 최적화합니다.

### 왜 Bespoke AI Suite인가?

- **🚀 빠른 콘텐츠 생성**: AI 에이전트가 협업하여 고품질 콘텐츠를 분 단위로 생성
- **📊 데이터 기반 최적화**: 실시간 성과 분석과 자동 A/B 테스팅
- **🔧 쉬운 통합**: RESTful API와 웹훅을 통한 간편한 연동
- **💪 확장 가능**: 마이크로서비스 아키텍처로 무한 확장 가능

## ✨ 주요 기능

### 콘텐츠 생성
- **텍스트**: 블로그, 기사, 소셜 미디어 포스트
- **이미지**: 마케팅 비주얼, 인포그래픽
- **영상**: 짧은 프로모션 영상, 애니메이션

### 캠페인 관리
- 멀티채널 캠페인 오케스트레이션
- 실시간 성과 모니터링
- 자동화된 예산 최적화
- AI 기반 타겟팅 추천

### 분석 및 인사이트
- 종합 대시보드
- 커스텀 리포트 생성
- 예측 분석
- ROI 추적

## 🏗 아키텍처

Bespoke AI Suite는 Clean Architecture 원칙을 따르는 마이크로서비스 아키텍처로 구축되었습니다.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React/Vue     │     │   API Gateway   │     │     Kafka       │
│   Frontend      │────▶│   (Kong/AWS)    │────▶│  Event Stream   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                    ┌───────────┴───────────┐            │
                    ▼                       ▼            ▼
          ┌─────────────────┐     ┌─────────────────┐   │
          │ Content Service │     │Campaign Service │   │
          │   (Node.js)     │     │   (Python)      │   │
          └─────────────────┘     └─────────────────┘   │
                    │                       │            │
                    ▼                       ▼            ▼
          ┌─────────────────────────────────────────────┐
          │              PostgreSQL / MongoDB           │
          └─────────────────────────────────────────────┘
```

자세한 아키텍처 설명은 [아키텍처 문서](docs/architecture/bespoke-ai-suite-architecture.md)를 참조하세요.

## 🚀 시작하기

### 필수 요구사항

- Docker 26+
- Docker Compose 2.20+
- Node.js 23 LTS
- Python 3.12+
- Go 1.22+
- TypeScript 5.5+

### 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/bespoke-ai/suite.git
cd suite

# 환경 설정
cp .env.example .env.local

# 의존성 설치 및 서비스 실행
make setup
make dev
```

개발 환경이 실행되면 다음 URL에서 접근할 수 있습니다:
- 프론트엔드: http://localhost:3000
- API: http://localhost:8080
- 문서: http://localhost:8081

자세한 설정 가이드는 [개발자 온보딩 문서](docs/guides/developer-onboarding.md)를 참조하세요.

## 📖 문서

### 핵심 문서
- [아키텍처 설계서](docs/architecture/bespoke-ai-suite-architecture.md)
- [API 명세서](docs/api/api-specification.md)
- [개발자 가이드](docs/guides/developer-onboarding.md)

### API 문서
- [REST API Reference](https://api.bespoke-ai.com/docs)
- [GraphQL Playground](https://api.bespoke-ai.com/graphql)
- [웹훅 가이드](docs/api/webhooks.md)

### 튜토리얼
- [첫 번째 콘텐츠 생성하기](docs/tutorials/first-content.md)
- [캠페인 설정 가이드](docs/tutorials/campaign-setup.md)
- [API 통합 예제](docs/tutorials/api-integration.md)

## 🤝 기여하기

Bespoke AI Suite는 오픈소스 프로젝트입니다. 기여를 환영합니다!

### 기여 방법

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 커밋 컨벤션

우리는 [Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 등 기타 변경

자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

## 📊 프로젝트 상태

### 개발 진행 상황
- [x] 핵심 아키텍처 설계
- [x] Content Service 구현
- [x] Campaign Service 구현
- [ ] Analytics Service 구현 (진행중)
- [ ] ML Pipeline 통합 (계획됨)

### 로드맵
- **2025 Q3**: Analytics Service 완성
- **2025 Q4**: 엔터프라이즈 기능 추가
- **2026 Q1**: 글로벌 확장

## 🛡 보안

보안 취약점을 발견하셨나요? [security@bespoke-ai.com](mailto:security@bespoke-ai.com)으로 연락해주세요.
자세한 내용은 [SECURITY.md](SECURITY.md)를 참조하세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">
  <p>
    <a href="https://bespoke-ai.com">웹사이트</a> •
    <a href="https://docs.bespoke-ai.com">문서</a> •
    <a href="https://blog.bespoke-ai.com">블로그</a> •
    <a href="https://community.bespoke-ai.com">커뮤니티</a>
  </p>
  <p>
    Made with ❤️ by the Bespoke AI Team
  </p>
</div>