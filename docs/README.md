# Bespoke AI Suite 문서

이 디렉토리는 Bespoke AI Suite의 모든 기술 문서를 포함합니다.

## 📁 문서 구조

```
docs/
├── README.md                    # 이 파일
├── architecture/               # 아키텍처 관련 문서
│   └── bespoke-ai-suite-architecture.md
├── api/                        # API 관련 문서
│   ├── api-specification.md    # RESTful API 명세
│   ├── graphql-schema.md       # GraphQL 스키마
│   └── webhooks.md            # 웹훅 가이드
├── guides/                     # 개발 가이드
│   ├── developer-onboarding.md # 개발자 온보딩
│   ├── coding-style-guide.md   # 코딩 스타일 가이드
│   └── security-guidelines.md  # 보안 가이드라인
├── tutorials/                  # 튜토리얼
│   ├── first-content.md       # 첫 콘텐츠 생성
│   ├── campaign-setup.md      # 캠페인 설정
│   └── api-integration.md     # API 통합 예제
├── operations/                 # 운영 관련 문서
│   ├── deployment.md          # 배포 가이드
│   ├── monitoring.md          # 모니터링 설정
│   └── troubleshooting.md     # 트러블슈팅
└── reference/                  # 참조 문서
    ├── glossary.md            # 용어집
    ├── faq.md                 # 자주 묻는 질문
    └── changelog.md           # 변경 이력
```

## 🔍 빠른 링크

### 시작하기
- [아키텍처 개요](architecture/bespoke-ai-suite-architecture.md) - 시스템 전체 구조 이해
- [개발자 온보딩](guides/developer-onboarding.md) - 새로운 개발자를 위한 가이드
- [API 시작하기](api/api-specification.md) - API 사용법

### 개발
- [코딩 스타일 가이드](guides/coding-style-guide.md)
- [보안 가이드라인](guides/security-guidelines.md)
- [테스팅 가이드](guides/testing-guide.md)

### 운영
- [배포 가이드](operations/deployment.md)
- [모니터링 설정](operations/monitoring.md)
- [트러블슈팅](operations/troubleshooting.md)

## 📝 문서 작성 가이드

### 문서 템플릿

새로운 문서를 작성할 때는 다음 템플릿을 사용하세요:

```markdown
# 문서 제목

> 버전: 1.0.0  
> 작성일: YYYY-MM-DD  
> 작성자: 이름  
> 문서 상태: 초안|검토중|승인됨

## 목차

1. [개요](#개요)
2. [주요 내용](#주요-내용)
3. [예제](#예제)
4. [참고 자료](#참고-자료)

## 개요

문서의 목적과 대상 독자를 설명합니다.

## 주요 내용

핵심 내용을 작성합니다.

## 예제

실제 사용 예제를 포함합니다.

## 참고 자료

관련 링크와 추가 자료를 제공합니다.
```

### 문서 작성 규칙

1. **명확성**: 기술적인 내용을 쉽게 설명
2. **일관성**: 용어와 스타일 통일
3. **완전성**: 필요한 모든 정보 포함
4. **최신성**: 정기적인 업데이트

### Markdown 스타일 가이드

- 제목은 `#`을 사용 (H1은 문서당 하나)
- 코드 블록에는 언어 명시
- 링크는 상대 경로 사용
- 이미지는 `assets/` 디렉토리에 저장

## 🔄 문서 업데이트 프로세스

1. 문서 수정 브랜치 생성: `docs/update-{문서명}`
2. 변경 사항 작성
3. PR 생성 및 리뷰 요청
4. 승인 후 머지

## 🤝 기여하기

문서 개선에 기여하고 싶으신가요?

1. 오타나 오류를 발견하면 PR을 보내주세요
2. 새로운 가이드나 튜토리얼 제안 환영
3. 문서 번역 기여 환영

## 📮 문의

문서 관련 문의사항:
- Slack: #docs 채널
- Email: docs@bespoke-ai.com

---

*최종 업데이트: 2025년 8월 4일*