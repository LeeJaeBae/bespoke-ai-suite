# 콘텐츠 생성 워크플로우

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 문서 유형: 시스템 플로우 다이어그램

## 개요

이 문서는 Bespoke AI Suite의 콘텐츠 생성 워크플로우를 시각적으로 설명합니다. Crew AI 에이전트들이 어떻게 협업하여 고품질 콘텐츠를 생성하는지 단계별로 보여줍니다.

## 콘텐츠 생성 플로우차트

```mermaid
flowchart TB
    Start([사용자 요청]) --> Validate{요청 검증}
    
    Validate -->|유효| CreateJob[작업 생성]
    Validate -->|무효| Error[에러 반환]
    
    CreateJob --> Queue[Kafka 큐에 추가]
    Queue --> Orchestrator[Crew AI Orchestrator]
    
    Orchestrator --> Research[Research Agent<br/>시장 조사 & 트렌드 분석]
    Research --> Planning[Planning Agent<br/>콘텐츠 전략 수립]
    Planning --> Creation[Creation Agent<br/>콘텐츠 생성]
    
    Creation --> TypeCheck{콘텐츠 타입}
    TypeCheck -->|텍스트| TextGen[Claude API<br/>텍스트 생성]
    TypeCheck -->|이미지| ImageGen[Stable Diffusion<br/>이미지 생성]
    TypeCheck -->|영상| VideoGen[Gen-2 API<br/>영상 생성]
    
    TextGen --> Review
    ImageGen --> Review
    VideoGen --> Review
    
    Review[Review Agent<br/>품질 검증]
    Review --> QualityCheck{품질 기준<br/>충족?}
    
    QualityCheck -->|예| Optimize[최적화 처리]
    QualityCheck -->|아니오| Feedback[피드백 생성]
    
    Feedback --> Iteration{반복 횟수<br/>< 3?}
    Iteration -->|예| Creation
    Iteration -->|아니오| ManualReview[수동 검토 요청]
    
    Optimize --> Store[저장소에 저장]
    Store --> Notify[사용자 알림]
    
    ManualReview --> HumanReview[인간 검토자]
    HumanReview --> Store
    
    Notify --> End([완료])
    Error --> End
    
    style Start fill:#e1f5e1,stroke:#4caf50,stroke-width:2px
    style End fill:#ffe1e1,stroke:#f44336,stroke-width:2px
    style Orchestrator fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style Research fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Planning fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Creation fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Review fill:#fff3e0,stroke:#ff9800,stroke-width:2px
```

## 상세 프로세스 설명

### 1. 요청 수신 및 검증
```mermaid
sequenceDiagram
    participant U as 사용자
    participant API as API Gateway
    participant CS as Content Service
    participant K as Kafka
    
    U->>API: POST /v1/contents
    API->>API: 인증 확인
    API->>CS: 요청 전달
    CS->>CS: 요청 검증
    CS->>K: 작업 큐잉
    CS->>U: 202 Accepted + Job ID
```

### 2. Crew AI 에이전트 협업
```mermaid
graph LR
    subgraph "Crew AI Orchestration"
        O[Orchestrator] --> R[Research Agent]
        R --> P[Planning Agent]
        P --> C[Creation Agent]
        C --> V[Review Agent]
        V -.->|피드백| P
        V -.->|개선 요청| C
    end
    
    R --> DB1[(시장 데이터)]
    P --> DB2[(전략 템플릿)]
    C --> AI[AI 모델들]
    V --> QM[품질 메트릭]
```

### 3. 콘텐츠 타입별 생성 프로세스

#### 텍스트 콘텐츠 생성
```mermaid
stateDiagram-v2
    [*] --> 프롬프트준비
    프롬프트준비 --> Claude호출
    Claude호출 --> 응답수신
    응답수신 --> 후처리
    후처리 --> SEO최적화
    SEO최적화 --> 품질평가
    품질평가 --> [*]: 완료
    품질평가 --> 프롬프트개선: 품질미달
    프롬프트개선 --> Claude호출
```

#### 이미지 콘텐츠 생성
```mermaid
stateDiagram-v2
    [*] --> 프롬프트생성
    프롬프트생성 --> StableDiffusion
    StableDiffusion --> 이미지생성
    이미지생성 --> 해상도조정
    해상도조정 --> 브랜드요소추가
    브랜드요소추가 --> 품질검사
    품질검사 --> [*]: 승인
    품질검사 --> 파라미터조정: 재생성필요
    파라미터조정 --> StableDiffusion
```

### 4. 품질 관리 프로세스

```mermaid
graph TB
    subgraph "품질 평가 기준"
        Q1[관련성<br/>0-100]
        Q2[독창성<br/>0-100]
        Q3[브랜드 일관성<br/>0-100]
        Q4[SEO 점수<br/>0-100]
        Q5[가독성<br/>0-100]
    end
    
    Q1 & Q2 & Q3 & Q4 & Q5 --> AVG[평균 점수 계산]
    AVG --> Decision{점수 >= 80?}
    Decision -->|예| Pass[통과]
    Decision -->|아니오| Improve[개선 필요]
    
    Improve --> Feedback[구체적 피드백 생성]
    Feedback --> Retry[재생성 시도]
```

## 성능 지표

### 평균 처리 시간
- 텍스트 (500-1500 단어): 45-90초
- 이미지 (1024x1024): 30-60초
- 영상 (30초): 3-5분

### 품질 점수 분포
```
90-100점: 25% (즉시 승인)
80-89점:  45% (마이너 수정 후 승인)
70-79점:  20% (1-2회 재생성)
70점 미만: 10% (수동 개입 필요)
```

## 에러 처리 및 복구

```mermaid
flowchart LR
    Error[에러 발생] --> Type{에러 타입}
    
    Type -->|일시적| Retry[재시도<br/>최대 3회]
    Type -->|영구적| Alert[알림 발송]
    Type -->|리소스| Scale[자동 스케일링]
    
    Retry --> Success{성공?}
    Success -->|예| Continue[계속 진행]
    Success -->|아니오| Fallback[대체 전략]
    
    Alert --> Manual[수동 개입]
    Scale --> Monitor[모니터링]
    
    Fallback --> Notify[사용자 알림]
    Manual --> Notify
    Monitor --> Continue
```

## 모니터링 포인트

1. **요청 수신률**: API Gateway 메트릭
2. **큐 대기 시간**: Kafka 지연 시간
3. **에이전트 처리 시간**: 각 에이전트별 평균 소요 시간
4. **AI API 응답 시간**: Claude, Stable Diffusion 등
5. **품질 점수 분포**: 일별/주별 트렌드
6. **재시도율**: 품질 미달로 인한 재생성 비율

---

*이 워크플로우는 지속적으로 최적화되고 있으며, 실제 운영 데이터를 기반으로 개선됩니다.*