# 02. 백엔드 서비스 개발 태스크 체크리스트

> **Phase 2**: 백엔드 서비스 개발  
> **예상 기간**: 2-3개월  
> **우선순위**: Critical/High  
> **담당자**: 백엔드 개발자, 풀스택 개발자

## 📋 개요

Clean Architecture 원칙을 기반으로 4개의 마이크로서비스를 개발합니다. 각 서비스는 독립적으로 배포 가능하며, 이벤트 기반 아키텍처로 통신합니다.

## 🎯 목표

- [x] **User Service (Go)** - 인증/인가 시스템 구축 ✅ 완료일: 2025-08-06
- [ ] **Content Service (Node.js/Fastify)** - AI 콘텐츠 생성 시스템
- [ ] **Campaign Service (Python/FastAPI)** - 마케팅 캠페인 관리
- [ ] **Analytics Service (Java/Spring Boot)** - 실시간 분석 시스템

---

## 👤 1. User Service (Go/Gin) - ✅ 완료 (2025-08-06)

### 1.1 프로젝트 초기 설정 ✅
- [x] **Go 모듈 초기화**
  ```bash
  mkdir -p services/user
  cd services/user
  go mod init github.com/bespoke-ai/suite/services/user
  ```
  - 완료일: 2025-08-06
  - 검증: `go.mod` 파일 생성 확인 ✅

- [x] **디렉토리 구조 생성**
  ```
  services/user-service/
  ├── cmd/server/              # 진입점
  ├── internal/
  │   ├── domain/             # 엔티티 계층
  │   │   ├── entities/
  │   │   └── value-objects/
  │   ├── application/        # 유스케이스 계층
  │   │   ├── usecases/
  │   │   └── interfaces/
  │   ├── infrastructure/     # 인프라 계층
  │   │   ├── controllers/
  │   │   ├── repositories/
  │   │   └── config/
  │   └── shared/            # 공통 유틸리티
  ├── migrations/            # 데이터베이스 마이그레이션
  ├── docker/
  └── tests/
  ```
  - 완료일: 2025-08-06
  - 검증: 디렉토리 구조 확인 ✅

- [x] **필수 의존성 설치**
  ```bash
  go get github.com/gin-gonic/gin
  go get github.com/golang-jwt/jwt/v5
  go get github.com/lib/pq
  go get github.com/golang-migrate/migrate/v4
  go get github.com/joho/godotenv
  go get github.com/stretchr/testify
  ```
  - 완료일: 2025-08-06
  - 검증: `go.mod` 의존성 확인 ✅

### 1.2 도메인 계층 구현 ✅
- [x] **User Entity 구현**
  ```go
  // internal/domain/entities/user.go
  type User struct {
      ID            uuid.UUID
      Email         string
      PasswordHash  string
      SubscriptionTier SubscriptionTier
      CreatedAt     time.Time
      UpdatedAt     time.Time
  }
  
  func NewUser(email, password string) (*User, error) {
      // 비즈니스 규칙 검증
      // 패스워드 해싱
      // User 생성
  }
  ```
  - 완료일: 2025-08-06
  - 검증: 단위 테스트 통과 ✅

- [x] **Value Objects 구현**
  ```go
  // internal/domain/value-objects/subscription.go
  type SubscriptionTier int
  
  const (
      Free SubscriptionTier = iota
      Pro
      Enterprise
  )
  ```
  - 완료일: 2025-08-06

- [x] **도메인 서비스 구현**
  ```go
  // internal/domain/services/auth_service.go
  type AuthService interface {
      HashPassword(password string) (string, error)
      ValidatePassword(password, hash string) bool
      GenerateJWT(userID uuid.UUID) (string, error)
      ValidateJWT(token string) (*Claims, error)
  }
  ```
  - 완료일: 2025-08-06

### 1.3 유스케이스 계층 구현 ✅
- [x] **사용자 등록 유스케이스**
  ```go
  // internal/application/usecases/register_user.go
  type RegisterUserUseCase struct {
      userRepo UserRepository
      authService AuthService
  }
  
  func (uc *RegisterUserUseCase) Execute(req RegisterUserRequest) (*RegisterUserResponse, error) {
      // 이메일 중복 검사
      // 패스워드 해싱
      // 사용자 생성
      // 이벤트 발행
  }
  ```
  - 완료일: 2025-08-06
  - 검증: 통합 테스트 통과 ✅

- [x] **사용자 로그인 유스케이스**
  ```go
  // internal/application/usecases/login_user.go
  type LoginUserUseCase struct {
      userRepo UserRepository
      authService AuthService
  }
  ```
  - 완료일: 2025-08-06

- [x] **JWT 토큰 검증 유스케이스**
  ```go
  // internal/application/usecases/validate_token.go
  type ValidateTokenUseCase struct {
      authService AuthService
  }
  ```
  - 완료일: 2025-08-06

### 1.4 인프라 계층 구현 ✅
- [x] **PostgreSQL Repository 구현**
  ```go
  // internal/infrastructure/repositories/user_repository.go
  type PostgreSQLUserRepository struct {
      db *sql.DB
  }
  
  func (r *PostgreSQLUserRepository) Save(user *entities.User) error {
      query := `INSERT INTO users (id, email, password_hash, subscription_tier, created_at, updated_at) 
                VALUES ($1, $2, $3, $4, $5, $6)`
      // 구현
  }
  ```
  - 완료일: 2025-08-06
  - 검증: 데이터베이스 연결 테스트 ✅

- [x] **Gin Controllers 구현**
  ```go
  // internal/infrastructure/controllers/auth_controller.go
  type AuthController struct {
      registerUC *usecases.RegisterUserUseCase
      loginUC    *usecases.LoginUserUseCase
  }
  
  func (c *AuthController) Register(ctx *gin.Context) {
      // HTTP 요청 파싱
      // 유스케이스 실행
      // HTTP 응답 반환
  }
  ```
  - 완료일: 2025-08-06

- [x] **데이터베이스 마이그레이션**
  ```sql
  -- migrations/001_create_users_table.up.sql
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      subscription_tier INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
  - 완료일: 2025-08-06
  - 검증: 마이그레이션 실행 성공 ✅

### 1.5 서버 설정 및 라우팅 ✅
- [x] **메인 애플리케이션**
  ```go
  // cmd/server/main.go
  func main() {
      config := config.Load()
      db := database.Connect(config.DatabaseURL)
      
      // 의존성 주입
      userRepo := repositories.NewPostgreSQLUserRepository(db)
      authService := services.NewJWTAuthService(config.JWTSecret)
      
      // 라우터 설정
      r := gin.Default()
      authController := controllers.NewAuthController(userRepo, authService)
      
      v1 := r.Group("/api/v1")
      {
          auth := v1.Group("/auth")
          {
              auth.POST("/register", authController.Register)
              auth.POST("/login", authController.Login)
              auth.POST("/refresh", authController.RefreshToken)
              auth.POST("/logout", authController.Logout)
          }
          
          users := v1.Group("/users")
          users.Use(middlewares.AuthMiddleware())
          {
              users.GET("/profile", authController.GetProfile)
              users.PUT("/profile", authController.UpdateProfile)
          }
      }
      
      r.Run(":8080")
  }
  ```
  - 완료일: 2025-08-06
  - 검증: 로컬 서버 실행 및 API 테스트 ✅

### 1.6 Docker 및 배포 설정 ✅
- [x] **Dockerfile 작성**
  ```dockerfile
  # docker/Dockerfile
  FROM golang:1.22-alpine AS builder
  WORKDIR /app
  COPY go.mod go.sum ./
  RUN go mod download
  COPY . .
  RUN go build -o main cmd/server/main.go
  
  FROM alpine:latest
  RUN apk --no-cache add ca-certificates
  WORKDIR /root/
  COPY --from=builder /app/main .
  CMD ["./main"]
  ```
  - 완료일: 2025-08-06
  - 검증: Docker 이미지 빌드 성공 ✅

- [ ] **Kubernetes 매니페스트**
  ```yaml
  # k8s/deployment.yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: user-service
  spec:
    replicas: 3
    selector:
      matchLabels:
        app: user-service
    template:
      metadata:
        labels:
          app: user-service
      spec:
        containers:
        - name: user-service
          image: bespoke-ai/user-service:latest
          ports:
          - containerPort: 8080
          env:
          - name: DATABASE_URL
            valueFrom:
              secretKeyRef:
                name: db-credentials
                key: postgres-url
  ```
  - 완료일: ___________

---

## 📝 2. Content Service (Node.js/Express.js)

### 2.1 프로젝트 초기 설정
- [ ] **Node.js 프로젝트 초기화**
  ```bash
  mkdir -p services/content-service
  cd services/content-service
  npm init -y
  ```
  - 완료일: ___________

- [ ] **TypeScript 설정**
  ```bash
  npm install typescript @types/node @types/express ts-node nodemon --save-dev
  npx tsc --init
  ```
  - 완료일: ___________

- [ ] **필수 의존성 설치**
  ```bash
  npm install express cors helmet morgan dotenv
  npm install mongoose prisma @prisma/client
  npm install jsonwebtoken bcryptjs
  npm install @types/jsonwebtoken @types/bcryptjs --save-dev
  ```
  - 완료일: ___________

### 2.2 Clean Architecture 구조 생성
- [ ] **디렉토리 구조**
  ```
  services/content-service/
  ├── src/
  │   ├── domain/              # 엔티티 계층
  │   │   ├── entities/
  │   │   └── value-objects/
  │   ├── application/         # 유스케이스 계층
  │   │   ├── use-cases/
  │   │   └── interfaces/
  │   ├── infrastructure/      # 인프라 계층
  │   │   ├── controllers/
  │   │   ├── repositories/
  │   │   ├── external/       # Crew AI 클라이언트
  │   │   └── config/
  │   └── main.ts
  ├── tests/
  ├── docker/
  └── k8s/
  ```
  - 완료일: ___________

### 2.3 도메인 계층 구현
- [ ] **Content Entity**
  ```typescript
  // src/domain/entities/Content.ts
  export class Content {
    private constructor(
      private readonly id: string,
      private readonly type: ContentType,
      private readonly title: string,
      private readonly body: string,
      private readonly userId: string,
      private readonly createdAt: Date
    ) {}
    
    static create(props: ContentProps): Content {
      // 비즈니스 규칙 검증
      return new Content(
        generateId(),
        props.type,
        props.title,
        props.body,
        props.userId,
        new Date()
      );
    }
    
    // 비즈니스 메서드
    public validateQuality(): QualityScore {
      // 콘텐츠 품질 검증 로직
    }
  }
  ```
  - 완료일: ___________

- [ ] **Value Objects 구현**
  ```typescript
  // src/domain/value-objects/ContentType.ts
  export enum ContentType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video'
  }
  
  // src/domain/value-objects/QualityScore.ts
  export class QualityScore {
    constructor(private readonly score: number) {
      if (score < 0 || score > 100) {
        throw new Error('Quality score must be between 0 and 100');
      }
    }
  }
  ```
  - 완료일: ___________

### 2.4 유스케이스 계층 구현
- [ ] **콘텐츠 생성 유스케이스**
  ```typescript
  // src/application/use-cases/CreateContentUseCase.ts
  export class CreateContentUseCase {
    constructor(
      private contentRepository: ContentRepository,
      private crewAIService: CrewAIService,
      private eventPublisher: EventPublisher
    ) {}
    
    async execute(request: CreateContentRequest): Promise<CreateContentResponse> {
      // 1. Crew AI 에이전트 호출
      const aiContent = await this.crewAIService.generateContent(request.prompt);
      
      // 2. Content 엔티티 생성
      const content = Content.create({
        type: request.type,
        title: aiContent.title,
        body: aiContent.body,
        userId: request.userId
      });
      
      // 3. 품질 검증
      const qualityScore = content.validateQuality();
      if (qualityScore.getValue() < 70) {
        throw new Error('Content quality below threshold');
      }
      
      // 4. 저장
      await this.contentRepository.save(content);
      
      // 5. 이벤트 발행
      await this.eventPublisher.publish(new ContentCreatedEvent(content));
      
      return CreateContentResponse.from(content);
    }
  }
  ```
  - 완료일: ___________

- [ ] **콘텐츠 조회 유스케이스**
  - GetContentUseCase 구현
  - ListContentsUseCase 구현
  - 완료일: ___________

### 2.5 인프라 계층 구현
- [ ] **MongoDB Repository**
  ```typescript
  // src/infrastructure/repositories/MongoContentRepository.ts
  export class MongoContentRepository implements ContentRepository {
    constructor(private db: MongoDatabase) {}
    
    async save(content: Content): Promise<void> {
      const doc = {
        id: content.getId(),
        type: content.getType(),
        title: content.getTitle(),
        body: content.getBody(),
        userId: content.getUserId(),
        createdAt: content.getCreatedAt()
      };
      
      await this.db.collection('contents').insertOne(doc);
    }
    
    async findById(id: string): Promise<Content | null> {
      // 구현
    }
  }
  ```
  - 완료일: ___________

- [ ] **Express Controllers**
  ```typescript
  // src/infrastructure/controllers/ContentController.ts
  export class ContentController {
    constructor(
      private createContentUseCase: CreateContentUseCase,
      private getContentUseCase: GetContentUseCase
    ) {}
    
    async createContent(req: Request, res: Response, next: NextFunction) {
      try {
        const request = CreateContentRequest.from(req.body);
        const response = await this.createContentUseCase.execute(request);
        res.status(201).json(response);
      } catch (error) {
        next(error);
      }
    }
  }
  ```
  - 완료일: ___________

- [ ] **Crew AI 클라이언트**
  ```typescript
  // src/infrastructure/external/CrewAIClient.ts
  export class CrewAIClient implements CrewAIService {
    async generateContent(prompt: string): Promise<AIGeneratedContent> {
      // Crew AI API 호출
      // 연구원 → 기획자 → 생성자 → 검토자 에이전트 체인 실행
    }
  }
  ```
  - 완료일: ___________

### 2.6 API 라우팅 및 미들웨어
- [ ] **라우터 설정**
  ```typescript
  // src/infrastructure/routes/contentRoutes.ts
  const router = express.Router();
  
  router.post('/contents', 
    authMiddleware,
    validateRequest(CreateContentSchema),
    contentController.createContent
  );
  
  router.get('/contents/:id',
    authMiddleware,
    contentController.getContent
  );
  
  router.get('/contents',
    authMiddleware,
    paginationMiddleware,
    contentController.listContents
  );
  ```
  - 완료일: ___________

- [ ] **메인 애플리케이션**
  ```typescript
  // src/main.ts
  const app = express();
  
  // 미들웨어
  app.use(cors());
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(express.json());
  
  // 라우터
  app.use('/api/v1', contentRoutes);
  
  // 에러 핸들러
  app.use(errorHandler);
  
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, () => {
    console.log(`Content Service running on port ${PORT}`);
  });
  ```
  - 완료일: ___________

---

## 🐍 3. Campaign Service (Python/FastAPI)

### 3.1 프로젝트 초기 설정
- [ ] **Python 가상환경 설정**
  ```bash
  mkdir -p services/campaign-service
  cd services/campaign-service
  python -m venv venv
  source venv/bin/activate  # Linux/macOS
  # venv\Scripts\activate  # Windows
  ```
  - 완료일: ___________

- [ ] **필수 의존성 설치**
  ```bash
  pip install fastapi uvicorn sqlalchemy alembic
  pip install asyncpg redis celery
  pip install pydantic python-jose[cryptography] passlib[bcrypt]
  pip install pytest pytest-asyncio httpx
  ```
  - 완료일: ___________

- [ ] **requirements.txt 생성**
  ```bash
  pip freeze > requirements.txt
  ```
  - 완료일: ___________

### 3.2 Clean Architecture 구조
- [ ] **디렉토리 구조**
  ```
  services/campaign-service/
  ├── src/
  │   ├── domain/
  │   │   ├── entities/
  │   │   └── value_objects/
  │   ├── application/
  │   │   ├── use_cases/
  │   │   └── interfaces/
  │   ├── infrastructure/
  │   │   ├── controllers/
  │   │   ├── repositories/
  │   │   ├── external/
  │   │   └── config/
  │   └── main.py
  ├── alembic/
  ├── tests/
  └── docker/
  ```
  - 완료일: ___________

### 3.3 도메인 계층 구현
- [ ] **Campaign Entity**
  ```python
  # src/domain/entities/campaign.py
  from dataclasses import dataclass
  from datetime import datetime
  from typing import Optional
  from uuid import UUID, uuid4
  
  @dataclass
  class Campaign:
      id: UUID
      name: str
      description: str
      budget: float
      start_date: datetime
      end_date: datetime
      status: CampaignStatus
      user_id: UUID
      created_at: datetime
      
      @classmethod
      def create(cls, name: str, description: str, budget: float, 
                 start_date: datetime, end_date: datetime, user_id: UUID) -> 'Campaign':
          # 비즈니스 규칙 검증
          if budget <= 0:
              raise ValueError("Budget must be positive")
          if start_date >= end_date:
              raise ValueError("Start date must be before end date")
          
          return cls(
              id=uuid4(),
              name=name,
              description=description,
              budget=budget,
              start_date=start_date,
              end_date=end_date,
              status=CampaignStatus.DRAFT,
              user_id=user_id,
              created_at=datetime.now()
          )
      
      def activate(self) -> None:
          if self.status != CampaignStatus.DRAFT:
              raise ValueError("Only draft campaigns can be activated")
          self.status = CampaignStatus.ACTIVE
  ```
  - 완료일: ___________

- [ ] **Value Objects**
  ```python
  # src/domain/value_objects/campaign_status.py
  from enum import Enum
  
  class CampaignStatus(Enum):
      DRAFT = "draft"
      ACTIVE = "active"
      PAUSED = "paused"
      COMPLETED = "completed"
      CANCELLED = "cancelled"
  ```
  - 완료일: ___________

### 3.4 유스케이스 구현
- [ ] **캠페인 생성 유스케이스**
  ```python
  # src/application/use_cases/create_campaign.py
  from src.domain.entities.campaign import Campaign
  from src.application.interfaces.campaign_repository import CampaignRepository
  
  class CreateCampaignUseCase:
      def __init__(self, campaign_repository: CampaignRepository):
          self.campaign_repository = campaign_repository
      
      async def execute(self, request: CreateCampaignRequest) -> CreateCampaignResponse:
          campaign = Campaign.create(
              name=request.name,
              description=request.description,
              budget=request.budget,
              start_date=request.start_date,
              end_date=request.end_date,
              user_id=request.user_id
          )
          
          await self.campaign_repository.save(campaign)
          
          return CreateCampaignResponse(
              id=campaign.id,
              name=campaign.name,
              status=campaign.status.value
          )
  ```
  - 완료일: ___________

### 3.5 FastAPI 컨트롤러
- [ ] **Campaign Controller**
  ```python
  # src/infrastructure/controllers/campaign_controller.py
  from fastapi import APIRouter, Depends, HTTPException, status
  from src.application.use_cases.create_campaign import CreateCampaignUseCase
  
  router = APIRouter(prefix="/campaigns", tags=["campaigns"])
  
  @router.post("/", status_code=status.HTTP_201_CREATED)
  async def create_campaign(
      request: CreateCampaignRequest,
      use_case: CreateCampaignUseCase = Depends(get_create_campaign_use_case),
      current_user: User = Depends(get_current_user)
  ):
      try:
          request.user_id = current_user.id
          response = await use_case.execute(request)
          return response
      except ValueError as e:
          raise HTTPException(status_code=400, detail=str(e))
  ```
  - 완료일: ___________

- [ ] **메인 애플리케이션**
  ```python
  # src/main.py
  from fastapi import FastAPI
  from src.infrastructure.controllers import campaign_controller
  
  app = FastAPI(title="Campaign Service", version="1.0.0")
  
  app.include_router(campaign_controller.router, prefix="/api/v1")
  
  @app.get("/health")
  async def health_check():
      return {"status": "healthy"}
  
  if __name__ == "__main__":
      import uvicorn
      uvicorn.run(app, host="0.0.0.0", port=8082)
  ```
  - 완료일: ___________

---

## ☕ 4. Analytics Service (Java/Spring Boot)

### 4.1 프로젝트 초기 설정
- [ ] **Spring Boot 프로젝트 생성**
  ```bash
  mkdir -p services/analytics-service
  cd services/analytics-service
  # Spring Initializr 사용 또는 수동 설정
  ```
  - 완료일: ___________

- [ ] **의존성 설정 (pom.xml)**
  ```xml
  <dependencies>
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-web</artifactId>
      </dependency>
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-data-jpa</artifactId>
      </dependency>
      <dependency>
          <groupId>org.apache.spark</groupId>
          <artifactId>spark-core_2.12</artifactId>
          <version>3.4.0</version>
      </dependency>
      <dependency>
          <groupId>org.apache.kafka</groupId>
          <artifactId>kafka-streams</artifactId>
      </dependency>
  </dependencies>
  ```
  - 완료일: ___________

### 4.2 Clean Architecture 구조
- [ ] **패키지 구조**
  ```
  src/main/java/com/bespokeai/analytics/
  ├── domain/
  │   ├── entities/
  │   └── valueobjects/
  ├── application/
  │   ├── usecases/
  │   └── interfaces/
  ├── infrastructure/
  │   ├── controllers/
  │   ├── repositories/
  │   └── config/
  └── AnalyticsServiceApplication.java
  ```
  - 완료일: ___________

### 4.3 도메인 계층 구현
- [ ] **Analytics Entity**
  ```java
  // src/main/java/com/bespokeai/analytics/domain/entities/Analytics.java
  @Entity
  public class Analytics {
      @Id
      private UUID id;
      private String metric;
      private Double value;
      private LocalDateTime timestamp;
      private Map<String, String> dimensions;
      
      private Analytics() {} // JPA requirement
      
      public static Analytics create(String metric, Double value, 
                                   Map<String, String> dimensions) {
          Analytics analytics = new Analytics();
          analytics.id = UUID.randomUUID();
          analytics.metric = metric;
          analytics.value = value;
          analytics.dimensions = dimensions;
          analytics.timestamp = LocalDateTime.now();
          return analytics;
      }
  }
  ```
  - 완료일: ___________

### 4.4 유스케이스 구현
- [ ] **실시간 분석 유스케이스**
  ```java
  @Service
  public class ProcessAnalyticsUseCase {
      private final AnalyticsRepository analyticsRepository;
      private final EventPublisher eventPublisher;
      
      public ProcessAnalyticsResponse execute(ProcessAnalyticsRequest request) {
          Analytics analytics = Analytics.create(
              request.getMetric(),
              request.getValue(),
              request.getDimensions()
          );
          
          analyticsRepository.save(analytics);
          
          // 실시간 집계 수행
          performRealTimeAggregation(analytics);
          
          return ProcessAnalyticsResponse.from(analytics);
      }
  }
  ```
  - 완료일: ___________

### 4.5 Kafka Streams 처리
- [ ] **스트림 처리 설정**
  ```java
  @Configuration
  @EnableKafkaStreams
  public class StreamsConfig {
      
      @Bean
      public KStream<String, String> processAnalyticsStream(StreamsBuilder builder) {
          KStream<String, String> stream = builder.stream("analytics-events");
          
          stream
              .filter((key, value) -> value != null)
              .mapValues(this::processAnalyticsEvent)
              .to("processed-analytics");
          
          return stream;
      }
  }
  ```
  - 완료일: ___________

---

## 🔄 5. 서비스 간 통신

### 5.1 Kafka 이벤트 설정
- [ ] **이벤트 스키마 정의**
  ```json
  {
    "name": "ContentCreatedEvent",
    "type": "record",
    "fields": [
      {"name": "id", "type": "string"},
      {"name": "userId", "type": "string"},
      {"name": "contentType", "type": "string"},
      {"name": "timestamp", "type": "long"}
    ]
  }
  ```
  - 완료일: ___________

- [ ] **Schema Registry 설정**
  ```bash
  # Confluent Schema Registry 설치
  docker run -d \
    --name schema-registry \
    -p 8081:8081 \
    -e SCHEMA_REGISTRY_HOST_NAME=schema-registry \
    -e SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS=localhost:9092 \
    confluentinc/cp-schema-registry:latest
  ```
  - 완료일: ___________

### 5.2 API Gateway 설정
- [ ] **Kong Gateway 설정**
  ```yaml
  # kong.yml
  services:
  - name: user-service
    url: http://user-service:8080
    routes:
    - name: user-routes
      paths:
      - /api/v1/auth
      - /api/v1/users
  
  - name: content-service
    url: http://content-service:8081
    routes:
    - name: content-routes
      paths:
      - /api/v1/contents
  ```
  - 완료일: ___________

---

## ✅ 검증 체크리스트

### 개별 서비스 검증
- [ ] **User Service**
  ```bash
  # 사용자 등록 테스트
  curl -X POST http://localhost:8080/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  
  # 로그인 테스트
  curl -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}'
  ```
  - 모든 API 엔드포인트 정상 응답

- [ ] **Content Service**
  ```bash
  # 콘텐츠 생성 테스트 (JWT 토큰 필요)
  curl -X POST http://localhost:8081/api/v1/contents \
    -H "Authorization: Bearer <jwt-token>" \
    -H "Content-Type: application/json" \
    -d '{"type":"text","prompt":"Create a blog post about AI"}'
  ```
  - Crew AI 통합 정상 작동

- [ ] **Campaign Service**
  ```bash
  # 캠페인 생성 테스트
  curl -X POST http://localhost:8082/api/v1/campaigns \
    -H "Authorization: Bearer <jwt-token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Campaign","budget":1000.0}'
  ```
  - 비동기 처리 정상 작동

- [ ] **Analytics Service**
  ```bash
  # 분석 데이터 조회
  curl -X GET http://localhost:8083/api/v1/analytics/dashboard \
    -H "Authorization: Bearer <jwt-token>"
  ```
  - 실시간 집계 정상 작동

### 통합 테스트
- [ ] **서비스 간 이벤트 통신**
  - 콘텐츠 생성 시 분석 데이터 생성 확인
  - 사용자 등록 시 캠페인 서비스 알림 확인

- [ ] **데이터베이스 연결**
  - 모든 서비스에서 데이터베이스 읽기/쓰기 정상
  - 트랜잭션 무결성 확인

- [ ] **API Gateway 라우팅**
  - 모든 서비스 엔드포인트 게이트웨이를 통해 접근 가능
  - 인증/인가 정상 작동

---

## 📈 성능 기준

### 응답 시간
- [ ] **User Service**: 인증 API < 100ms
- [ ] **Content Service**: 콘텐츠 생성 < 30초
- [ ] **Campaign Service**: CRUD 작업 < 200ms
- [ ] **Analytics Service**: 실시간 조회 < 500ms

### 처리량
- [ ] **User Service**: 1000 req/sec
- [ ] **Content Service**: 10 req/sec (AI 처리 제한)
- [ ] **Campaign Service**: 500 req/sec
- [ ] **Analytics Service**: 10,000 events/sec

### 가용성
- [ ] **모든 서비스**: 99.9% 업타임
- [ ] **자동 복구**: 파드 재시작 < 30초
- [ ] **로드 밸런싱**: 트래픽 분산 정상

---

## 🚨 트러블슈팅

### 일반적인 문제들
1. **서비스 간 통신 실패**
   - 네트워크 정책 확인
   - DNS 해상도 확인
   - 포트 설정 확인

2. **데이터베이스 연결 실패**
   - 연결 문자열 확인
   - 방화벽 설정 확인
   - 자격 증명 확인

3. **Kafka 연결 문제**
   - 브로커 상태 확인
   - 토픽 생성 확인
   - 컨슈머 그룹 설정 확인

---

## 📚 다음 단계

백엔드 서비스 완료 후:
1. **[03. 프론트엔드 개발](./03-frontend.md)** 시작
2. **[04. 보안 구현](./04-security.md)** 강화
3. **[05. AI/ML 통합](./05-aiml-integration.md)** 고도화

---

**완료일**: ___________  
**검토자**: ___________  
**승인자**: ___________

---

*업데이트: 2025년 8월 4일 | 다음 검토: 진행 상황에 따라*