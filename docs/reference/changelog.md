# 변경 이력 (Changelog)

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 목적: Bespoke AI Suite 버전별 변경사항 기록

---

이 문서는 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/) 형식을 따르며, [유의적 버전](https://semver.org/lang/ko/)을 사용합니다.

## 목차

- [Unreleased](#unreleased)
- [1.0.0](#100---2025-08-04)
- [0.9.0](#090---2025-07-15)
- [0.8.0](#080---2025-06-28)
- [0.7.0](#070---2025-06-10)

---

## [Unreleased]

### 계획된 기능
- 비디오 콘텐츠 생성 정식 출시
- 음성 합성 기능 추가
- 실시간 협업 기능
- 모바일 앱 출시 (iOS/Android)
- 고급 분석 대시보드

### 개선 예정
- API 응답 속도 30% 개선
- 메모리 사용량 최적화
- UI/UX 리뉴얼

---

## [1.0.0] - 2025-08-04

🎉 **Bespoke AI Suite 정식 출시!**

### Added
- **새로운 기능**
  - Multi-Agent AI 시스템 (Crew AI 기반)
    - Research Agent: 시장 조사 및 트렌드 분석
    - Planning Agent: 콘텐츠 전략 수립
    - Creation Agent: 실제 콘텐츠 생성
    - Review Agent: 품질 검토 및 개선 제안
  - 브랜드 가이드라인 자동 적용
  - 다국어 콘텐츠 생성 (한국어, 영어, 일본어, 중국어)
  - 실시간 A/B 테스트 기능
  - 고급 분석 및 리포팅
  - Enterprise SSO 지원 (SAML, OIDC)

- **API 개선**
  - GraphQL API 정식 출시
  - Webhook 시스템 구축
  - REST API v2.0 출시
  - 새로운 SDK (Python, JavaScript, Go)

- **통합 기능**
  - Salesforce, HubSpot CRM 연동
  - Slack, Microsoft Teams 봇
  - Shopify, WooCommerce 플러그인
  - Google Analytics, Adobe Analytics 연동

### Changed
- **UI/UX 개선**
  - 완전히 새로운 대시보드 디자인
  - 모바일 반응형 웹 최적화
  - 다크 모드 지원
  - 접근성 개선 (WCAG 2.1 AA 준수)

- **성능 향상**
  - 콘텐츠 생성 속도 50% 개선
  - 대시보드 로딩 시간 40% 단축
  - API 응답 시간 60% 개선
  - 메모리 사용량 30% 감소

- **보안 강화**
  - Zero Trust 보안 모델 적용
  - 모든 데이터 암호화 (AES-256)
  - 정기 보안 감사 시행
  - SOC 2 Type II 인증 획득

### Fixed
- 대용량 이미지 업로드 시 타임아웃 문제 해결
- 캠페인 스케줄링 시간대 버그 수정
- 한글 텍스트 인코딩 문제 해결
- 브라우저 호환성 문제 수정 (Safari, Firefox)

### Deprecated
- API v1.0의 일부 엔드포인트 (2025년 12월 31일 지원 종료 예정)
- 레거시 이미지 업로드 방식

### Removed
- 베타 기간 중 실험적 기능들
- 구형 브라우저 지원 (IE 11 이하)

### Security
- JWT 토큰 보안 강화
- 민감 데이터 로깅 제거
- 보안 헤더 추가 (CSP, HSTS)
- 취약점 스캔 자동화

---

## [0.9.0] - 2025-07-15

### Added
- **베타 기능**
  - 비디오 콘텐츠 생성 (베타)
  - 음성 변환 기능 (Text-to-Speech)
  - 실시간 콘텐츠 협업 (베타)

- **캠페인 관리**
  - 자동화된 콘텐츠 스케줄링
  - 성과 기반 최적화
  - 멀티 채널 배포

- **개발자 도구**
  - CLI 도구 출시
  - Postman 컬렉션 제공
  - 개발자 대시보드

### Changed
- 콘텐츠 생성 엔진 성능 최적화
- 사용자 인터페이스 개선
- 요금제 구조 단순화

### Fixed
- 대량 콘텐츠 생성 시 메모리 누수 문제
- 동시 접속자 처리 개선
- 데이터베이스 성능 최적화

---

## [0.8.0] - 2025-06-28

### Added
- **AI 기능 확장**
  - GPT-4 기반 텍스트 생성
  - DALL-E 3 이미지 생성
  - 감정 분석 기능

- **사용자 경험**
  - 실시간 미리보기
  - 템플릿 갤러리 확장
  - 즐겨찾기 기능

### Changed
- 이미지 생성 품질 향상
- 응답 시간 개선
- 오류 메시지 개선

### Fixed
- 파일 업로드 안정성 개선
- 세션 관리 버그 수정
- 모바일 브라우저 호환성 개선

---

## [0.7.0] - 2025-06-10

### Added
- **초기 베타 출시**
  - 기본 텍스트 생성 기능
  - 이미지 생성 기능 (베타)
  - 사용자 계정 관리
  - 기본 API 엔드포인트

- **플랫폼 기능**
  - 사용자 대시보드
  - 콘텐츠 라이브러리
  - 기본 분석 기능

### Changed
- 초기 UI/UX 디자인 구현
- 기본 인증 시스템 구축

---

## 업그레이드 가이드

### v0.9.x에서 v1.0.0으로

#### 필수 변경사항
1. **API 키 업데이트**
   ```bash
   # 기존 API 키를 새 형식으로 마이그레이션
   curl -X POST https://api.thebespoke-ai.com/v2/auth/migrate \
     -H "Authorization: Bearer OLD_API_KEY"
   ```

2. **SDK 업데이트**
   ```bash
   npm install @thebespoke-ai/sdk@^1.0.0
   ```

3. **Webhook URL 업데이트**
   - 기존: `https://api.thebespoke-ai.com/webhooks`
   - 신규: `https://api.thebespoke-ai.com/v2/webhooks`

#### 주요 변경사항
- **GraphQL 엔드포인트**: `/graphql`에서 `/v2/graphql`로 변경
- **인증 방식**: Bearer 토큰 형식 변경
- **응답 형식**: 에러 응답 구조 표준화

#### 지원 중단 예정
- REST API v1.0: 2025년 12월 31일까지 지원
- 레거시 이미지 API: 2025년 10월 31일까지 지원

---

## 마이그레이션 지원

### 자동 마이그레이션 도구
```bash
# CLI 도구로 자동 마이그레이션
npx @thebespoke-ai/cli migrate --from=0.9 --to=1.0
```

### 수동 마이그레이션 가이드
1. [API 마이그레이션 가이드](https://docs.thebespoke-ai.com/migration/api)
2. [SDK 업그레이드 가이드](https://docs.thebespoke-ai.com/migration/sdk)
3. [데이터 마이그레이션 가이드](https://docs.thebespoke-ai.com/migration/data)

---

## 지원 정책

### 버전 지원 기간
- **메이저 버전**: 24개월 지원
- **마이너 버전**: 12개월 지원
- **패치 버전**: 6개월 지원

### LTS (Long Term Support)
- **v1.0 LTS**: 2027년 8월까지 지원
- **보안 패치**: 지원 기간 내 지속 제공
- **기술 지원**: Enterprise 고객 우선

---

## 피드백 및 제안

### 버그 리포트
- **GitHub Issues**: [github.com/thebespoke-ai/issues](https://github.com/thebespoke-ai/issues)
- **이메일**: bugs@thebespoke-ai.com
- **지원 센터**: [support.thebespoke-ai.com](https://support.thebespoke-ai.com)

### 기능 요청
- **로드맵 투표**: [roadmap.thebespoke-ai.com](https://roadmap.thebespoke-ai.com)
- **커뮤니티**: [community.thebespoke-ai.com](https://community.thebespoke-ai.com)
- **이메일**: feature-request@thebespoke-ai.com

---

## 릴리스 알림

### 구독 방법
- **이메일 뉴스레터**: [subscribe.thebespoke-ai.com](https://subscribe.thebespoke-ai.com)
- **RSS 피드**: [releases.thebespoke-ai.com/feed.xml](https://releases.thebespoke-ai.com/feed.xml)
- **Twitter**: [@TheBespokeAI](https://twitter.com/TheBespokeAI)
- **Slack 알림**: 워크스페이스에 봇 추가

### 릴리스 노트 형식
- **메이저 릴리스**: 상세한 가이드 및 웨비나
- **마이너 릴리스**: 블로그 포스트 및 문서 업데이트
- **패치 릴리스**: 간단한 공지 및 변경사항 요약

---

*이 변경 이력은 지속적으로 업데이트됩니다. 최신 정보는 [releases.thebespoke-ai.com](https://releases.thebespoke-ai.com)에서 확인하세요! 🚀*