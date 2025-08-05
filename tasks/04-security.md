# 04. 보안 구현 태스크 체크리스트

> **Phase 4**: 보안 구현  
> **예상 기간**: 병렬 진행  
> **우선순위**: Critical  
> **담당자**: 보안 엔지니어, DevOps 엔지니어

## 📋 개요

Zero Trust 보안 아키텍처를 기반으로 한 포괄적인 보안 시스템을 구축합니다. 인증/인가, 데이터 보안, API 보안, 인프라 보안을 포함합니다.

## 🎯 목표

- [ ] **Zero Trust 아키텍처 구현**
- [ ] **강력한 인증/인가 시스템 구축**
- [ ] **데이터 암호화 및 보호**
- [ ] **API 보안 강화**
- [ ] **컨테이너 및 인프라 보안**

---

## 🔐 1. 인증 및 인가 시스템

### 1.1 JWT 기반 인증 구현
- [ ] **JWT 토큰 생성 및 검증**
  ```typescript
  // JWT 설정 (Node.js)
  import jwt from 'jsonwebtoken';
  import crypto from 'crypto';
  
  interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    subscriptionTier: string;
    iat: number;
    exp: number;
  }
  
  class JWTService {
    private readonly accessTokenSecret: string;
    private readonly refreshTokenSecret: string;
    private readonly accessTokenExpiry = '15m';
    private readonly refreshTokenExpiry = '7d';
    
    constructor() {
      this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
      this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
    }
    
    generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
      const accessToken = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'bespoke-ai',
        audience: 'bespoke-ai-users'
      });
      
      const refreshToken = jwt.sign(
        { userId: payload.userId },
        this.refreshTokenSecret,
        { expiresIn: this.refreshTokenExpiry }
      );
      
      return { accessToken, refreshToken };
    }
    
    verifyAccessToken(token: string): TokenPayload {
      try {
        return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
      } catch (error) {
        throw new Error('Invalid access token');
      }
    }
    
    verifyRefreshToken(token: string) {
      try {
        return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
      } catch (error) {
        throw new Error('Invalid refresh token');
      }
    }
  }
  ```
  - 완료일: ___________
  - 검증: 토큰 생성/검증 테스트 통과

- [ ] **토큰 블랙리스트 관리**
  ```typescript
  // Redis를 이용한 토큰 블랙리스트
  class TokenBlacklist {
    constructor(private redis: Redis) {}
    
    async blacklistToken(token: string, expiresIn: number) {
      await this.redis.setex(`blacklist:${token}`, expiresIn, 'true');
    }
    
    async isBlacklisted(token: string): Promise<boolean> {
      const result = await this.redis.get(`blacklist:${token}`);
      return result === 'true';
    }
  }
  ```
  - 완료일: ___________

### 1.2 OAuth 2.0 통합
- [ ] **Google OAuth 설정**
  ```typescript
  // Google OAuth 설정
  import { OAuth2Client } from 'google-auth-library';
  
  class GoogleOAuthService {
    private client: OAuth2Client;
    
    constructor() {
      this.client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }
    
    async verifyIdToken(idToken: string) {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      return {
        email: payload?.email,
        name: payload?.name,
        picture: payload?.picture,
        verified: payload?.email_verified
      };
    }
  }
  ```
  - 완료일: ___________

- [ ] **GitHub OAuth 설정** (개발자용)
  - GitHub App 생성
  - OAuth 플로우 구현
  - 완료일: ___________

### 1.3 다단계 인증 (MFA)
- [ ] **TOTP 구현**
  ```typescript
  import * as speakeasy from 'speakeasy';
  import * as QRCode from 'qrcode';
  
  class MFAService {
    generateSecret(userEmail: string) {
      const secret = speakeasy.generateSecret({
        name: userEmail,
        issuer: 'Bespoke AI Suite'
      });
      
      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url
      };
    }
    
    async generateQRCode(otpauthUrl: string): Promise<string> {
      return await QRCode.toDataURL(otpauthUrl);
    }
    
    verifyToken(token: string, secret: string): boolean {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });
    }
  }
  ```
  - 완료일: ___________

- [ ] **백업 코드 생성**
  ```typescript
  class BackupCodeService {
    generateBackupCodes(count: number = 10): string[] {
      return Array.from({ length: count }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
    }
    
    async storeBackupCodes(userId: string, codes: string[]) {
      const hashedCodes = codes.map(code => bcrypt.hashSync(code, 12));
      await this.userRepository.updateBackupCodes(userId, hashedCodes);
    }
    
    async verifyBackupCode(userId: string, code: string): Promise<boolean> {
      const user = await this.userRepository.findById(userId);
      const validCode = user.backupCodes.find(hashedCode => 
        bcrypt.compareSync(code, hashedCode)
      );
      
      if (validCode) {
        // 사용된 코드 제거
        await this.userRepository.removeBackupCode(userId, validCode);
        return true;
      }
      
      return false;
    }
  }
  ```
  - 완료일: ___________

---

## 🛡️ 2. API 보안

### 2.1 API 보안 미들웨어
- [ ] **Rate Limiting 구현**
  ```typescript
  // Express Rate Limiting
  import rateLimit from 'express-rate-limit';
  import RedisStore from 'rate-limit-redis';
  import Redis from 'ioredis';
  
  const redis = new Redis(process.env.REDIS_URL);
  
  // 일반 API 제한
  export const apiLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15분
    max: 1000, // 요청 제한
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // 로그인 API 제한 (더 엄격)
  export const authLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 15 * 60 * 1000,
    max: 5, // 15분에 5번만 허용
    skipSuccessfulRequests: true,
  });
  ```
  - 완료일: ___________

- [ ] **CORS 설정**
  ```typescript
  import cors from 'cors';
  
  const corsOptions = {
    origin: (origin: string | undefined, callback: Function) => {
      const allowedOrigins = [
        'https://app.bespoke-ai.com',
        'https://bespoke-ai.com',
        process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
  };
  
  app.use(cors(corsOptions));
  ```
  - 완료일: ___________

- [ ] **헬멧 보안 헤더**
  ```typescript
  import helmet from 'helmet';
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.bespoke-ai.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  ```
  - 완료일: ___________

### 2.2 입력 검증 및 새니타이제이션
- [ ] **Joi 스키마 검증**
  ```typescript
  import Joi from 'joi';
  
  // 사용자 등록 스키마
  export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  });
  
  // 콘텐츠 생성 스키마
  export const createContentSchema = Joi.object({
    title: Joi.string().max(200).required(),
    type: Joi.string().valid('text', 'image', 'video').required(),
    prompt: Joi.string().max(2000).required(),
    parameters: Joi.object({
      tone: Joi.string().valid('professional', 'casual', 'creative'),
      length: Joi.string().valid('short', 'medium', 'long'),
      targetAudience: Joi.string().max(100)
    }).optional()
  });
  
  // 검증 미들웨어
  export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.details.map(detail => detail.message)
        });
      }
      next();
    };
  };
  ```
  - 완료일: ___________

- [ ] **SQL Injection 방지**
  ```typescript
  // Prisma ORM 사용으로 SQL Injection 자동 방지
  // 추가 보안을 위한 쿼리 로깅
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
  });
  
  prisma.$on('query', (e) => {
    // 의심스러운 쿼리 패턴 감지
    const suspiciousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /update\s+.*\s+set/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(e.query)
    );
    
    if (isSuspicious) {
      logger.warn('Suspicious SQL query detected', { 
        query: e.query,
        params: e.params 
      });
    }
  });
  ```
  - 완료일: ___________

---

## 🔒 3. 데이터 보안

### 3.1 암호화 구현
- [ ] **저장 시 암호화**
  ```typescript
  import crypto from 'crypto';
  
  class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32;
    private readonly ivLength = 16;
    private readonly tagLength = 16;
    
    constructor(private masterKey: string) {}
    
    encrypt(plaintext: string): EncryptedData {
      const iv = crypto.randomBytes(this.ivLength);
      const key = crypto.scrypt(this.masterKey, 'salt', this.keyLength) as Buffer;
      
      const cipher = crypto.createCipher(this.algorithm, key, { iv });
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    }
    
    decrypt(encryptedData: EncryptedData): string {
      const key = crypto.scrypt(this.masterKey, 'salt', this.keyLength) as Buffer;
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, key, { iv });
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    }
  }
  ```
  - 완료일: ___________

- [ ] **민감 데이터 마스킹**
  ```typescript
  class DataMaskingService {
    maskEmail(email: string): string {
      const [username, domain] = email.split('@');
      const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
      return `${maskedUsername}@${domain}`;
    }
    
    maskCreditCard(cardNumber: string): string {
      return cardNumber.replace(/\d(?=\d{4})/g, '*');
    }
    
    maskPhoneNumber(phone: string): string {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    
    // 로그용 데이터 마스킹
    maskSensitiveData(obj: any): any {
      const sensitiveFields = ['password', 'ssn', 'creditCard', 'apiKey'];
      const masked = { ...obj };
      
      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = '***MASKED***';
        }
      }
      
      return masked;
    }
  }
  ```
  - 완료일: ___________

### 3.2 키 관리
- [ ] **AWS KMS 통합**
  ```typescript
  import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
  
  class KMSService {
    private kmsClient: KMSClient;
    private keyId: string;
    
    constructor() {
      this.kmsClient = new KMSClient({ region: process.env.AWS_REGION });
      this.keyId = process.env.KMS_KEY_ID!;
    }
    
    async encrypt(plaintext: string): Promise<string> {
      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(plaintext, 'utf8')
      });
      
      const result = await this.kmsClient.send(command);
      return Buffer.from(result.CiphertextBlob!).toString('base64');
    }
    
    async decrypt(ciphertext: string): Promise<string> {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(ciphertext, 'base64')
      });
      
      const result = await this.kmsClient.send(command);
      return Buffer.from(result.Plaintext!).toString('utf8');
    }
  }
  ```
  - 완료일: ___________

---

## 🐳 4. 컨테이너 보안

### 4.1 Docker 보안 설정
- [ ] **보안 강화된 Dockerfile**
  ```dockerfile
  # 멀티스테이지 빌드로 공격 표면 최소화
  FROM node:18-alpine AS builder
  
  # 보안 업데이트
  RUN apk add --no-cache dumb-init && \
      apk upgrade --no-cache
  
  # 비루트 사용자 생성
  RUN addgroup -g 1001 -S nodejs && \
      adduser -S nextjs -u 1001
  
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production && npm cache clean --force
  
  # 프로덕션 이미지
  FROM node:18-alpine AS runner
  
  RUN apk add --no-cache dumb-init && \
      apk upgrade --no-cache
  
  RUN addgroup -g 1001 -S nodejs && \
      adduser -S nextjs -u 1001
  
  WORKDIR /app
  
  # 파일 권한 설정
  COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
  COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
  COPY --chown=nextjs:nodejs . .
  
  # 비루트 사용자로 실행
  USER nextjs
  
  # 보안 옵션
  EXPOSE 3000
  ENV NODE_ENV=production
  
  # dumb-init으로 PID 1 문제 해결
  ENTRYPOINT ["dumb-init", "--"]
  CMD ["npm", "start"]
  ```
  - 완료일: ___________

- [ ] **컨테이너 스캔 설정**
  ```yaml
  # .github/workflows/security-scan.yml
  name: Container Security Scan
  
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]
  
  jobs:
    container-scan:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        
        - name: Build Docker image
          run: docker build -t test-image .
        
        - name: Run Trivy vulnerability scanner
          uses: aquasecurity/trivy-action@master
          with:
            image-ref: 'test-image'
            format: 'sarif'
            output: 'trivy-results.sarif'
        
        - name: Upload Trivy scan results
          uses: github/codeql-action/upload-sarif@v2
          with:
            sarif_file: 'trivy-results.sarif'
  ```
  - 완료일: ___________

### 4.2 Kubernetes 보안 정책
- [ ] **Pod Security Policy**
  ```yaml
  # k8s/pod-security-policy.yaml
  apiVersion: policy/v1beta1
  kind: PodSecurityPolicy
  metadata:
    name: bespoke-ai-psp
  spec:
    privileged: false
    allowPrivilegeEscalation: false
    requiredDropCapabilities:
      - ALL
    volumes:
      - 'configMap'
      - 'emptyDir'
      - 'projected'
      - 'secret'
      - 'downwardAPI'
      - 'persistentVolumeClaim'
    runAsUser:
      rule: 'MustRunAsNonRoot'
    seLinux:
      rule: 'RunAsAny'
    fsGroup:
      rule: 'RunAsAny'
  ```
  - 완료일: ___________

- [ ] **Network Policy 설정**
  ```yaml
  # k8s/network-policy.yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: default-deny-all
  spec:
    podSelector: {}
    policyTypes:
    - Ingress
    - Egress
  ---
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: allow-user-service
  spec:
    podSelector:
      matchLabels:
        app: user-service
    policyTypes:
    - Ingress
    - Egress
    ingress:
    - from:
      - podSelector:
          matchLabels:
            app: api-gateway
      ports:
      - protocol: TCP
        port: 8080
    egress:
    - to:
      - podSelector:
          matchLabels:
            app: postgres
      ports:
      - protocol: TCP
        port: 5432
  ```
  - 완료일: ___________

---

## 📊 5. 보안 모니터링 및 로깅

### 5.1 보안 로깅
- [ ] **보안 이벤트 로깅**
  ```typescript
  class SecurityLogger {
    private logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'security.log' }),
        new winston.transports.Console()
      ]
    });
    
    logAuthAttempt(event: AuthAttemptEvent) {
      this.logger.info('Authentication attempt', {
        type: 'auth_attempt',
        userId: event.userId,
        email: event.email,
        success: event.success,
        ip: event.ip,
        userAgent: event.userAgent,
        timestamp: new Date().toISOString()
      });
    }
    
    logSuspiciousActivity(event: SuspiciousActivityEvent) {
      this.logger.warn('Suspicious activity detected', {
        type: 'suspicious_activity',
        userId: event.userId,
        activity: event.activity,
        risk_score: event.riskScore,
        ip: event.ip,
        timestamp: new Date().toISOString()
      });
    }
    
    logDataAccess(event: DataAccessEvent) {
      this.logger.info('Data access', {
        type: 'data_access',
        userId: event.userId,
        resource: event.resource,
        action: event.action,
        ip: event.ip,
        timestamp: new Date().toISOString()
      });
    }
  }
  ```
  - 완료일: ___________

### 5.2 침입 탐지 시스템
- [ ] **이상 행동 감지**
  ```typescript
  class AnomalyDetector {
    private redis: Redis;
    
    constructor() {
      this.redis = new Redis(process.env.REDIS_URL);
    }
    
    async detectBruteForce(userId: string, ip: string): Promise<boolean> {
      const key = `failed_attempts:${ip}:${userId}`;
      const attempts = await this.redis.incr(key);
      
      if (attempts === 1) {
        await this.redis.expire(key, 900); // 15분
      }
      
      if (attempts >= 5) {
        await this.blockIP(ip, 3600); // 1시간 차단
        return true;
      }
      
      return false;
    }
    
    async detectUnusualAccess(userId: string, ip: string): Promise<boolean> {
      const userLocationKey = `user_locations:${userId}`;
      const knownLocations = await this.redis.smembers(userLocationKey);
      
      const currentLocation = await this.getLocationFromIP(ip);
      
      if (knownLocations.length > 0 && !knownLocations.includes(currentLocation)) {
        // 새로운 위치에서의 접근 - 추가 인증 요구
        return true;
      }
      
      await this.redis.sadd(userLocationKey, currentLocation);
      return false;
    }
    
    private async blockIP(ip: string, duration: number) {
      await this.redis.setex(`blocked_ip:${ip}`, duration, 'true');
    }
  }
  ```
  - 완료일: ___________

---

## ✅ 검증 체크리스트

### 인증/인가 검증
- [ ] **JWT 토큰 검증**
  - 토큰 생성/검증 정상 작동
  - 만료된 토큰 거부 확인
  - 토큰 갱신 프로세스 테스트

- [ ] **OAuth 연동 테스트**
  - Google OAuth 로그인 성공
  - 권한 범위 제한 확인
  - 토큰 갱신 자동화 확인

- [ ] **MFA 기능 테스트**
  - TOTP 생성/검증 정상 작동
  - 백업 코드 사용 테스트
  - QR 코드 생성 확인

### API 보안 검증
- [ ] **Rate Limiting**
  - 제한된 요청 수 초과 시 차단 확인
  - 화이트리스트 IP 정상 작동
  - Redis 기반 분산 제한 확인

- [ ] **입력 검증**
  - SQL Injection 시도 차단
  - XSS 공격 방어 확인
  - 파라미터 변조 방지 확인

### 데이터 보안 검증
- [ ] **암호화 테스트**
  - 저장 데이터 암호화 확인
  - 전송 중 데이터 암호화 확인
  - 키 순환 프로세스 테스트

### 컨테이너 보안 검증
- [ ] **취약점 스캔**
  - 컨테이너 이미지 스캔 결과 확인
  - 높은 위험도 취약점 0개
  - 정기적인 스캔 자동화 확인

---

## 📈 보안 메트릭

### 보안 KPI
- [ ] **인증 성공률 > 99.5%**
- [ ] **불법 접근 시도 차단률 > 99%**
- [ ] **평균 보안 사고 대응 시간 < 15분**
- [ ] **데이터 유출 사고 0건**

### 컴플라이언스
- [ ] **GDPR 준수 확인**
- [ ] **SOC 2 요구사항 충족**
- [ ] **ISO 27001 가이드라인 준수**

---

## 🚨 보안 사고 대응

### 대응 절차
1. **탐지 및 분석** (0-15분)
   - 자동 알림 시스템 활성화
   - 초기 영향 범위 평가
   - 사고 심각도 분류

2. **억제 및 격리** (15-60분)
   - 영향받은 시스템 격리
   - 추가 피해 방지 조치
   - 임시 복구 조치 실행

3. **복구 및 재개** (1-24시간)
   - 시스템 복구 및 검증
   - 서비스 재개
   - 모니터링 강화

4. **사후 분석** (1-7일)
   - 근본 원인 분석
   - 개선 방안 도출
   - 정책/절차 업데이트

---

## 📚 다음 단계

보안 구현 완료 후:
1. **[05. AI/ML 통합](./05-aiml-integration.md)** - AI 시스템 보안 강화
2. **[06. 테스팅](./06-testing.md)** - 보안 테스트 추가
3. **정기적인 보안 감사 및 업데이트**

---

**완료일**: ___________  
**검토자**: ___________  
**승인자**: ___________

---

*업데이트: 2025년 8월 4일 | 다음 검토: 진행 상황에 따라*