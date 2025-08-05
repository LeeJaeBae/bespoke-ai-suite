# 보안 가이드라인

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 중요도: 필수 준수

## 목차

1. [보안 원칙](#1-보안-원칙)
2. [인증 및 인가](#2-인증-및-인가)
3. [데이터 보안](#3-데이터-보안)
4. [API 보안](#4-api-보안)
5. [인프라 보안](#5-인프라-보안)
6. [코드 보안](#6-코드-보안)
7. [보안 테스팅](#7-보안-테스팅)
8. [사고 대응](#8-사고-대응)
9. [컴플라이언스](#9-컴플라이언스)
10. [체크리스트](#10-체크리스트)

---

## 1. 보안 원칙

### 제로 트러스트 (Zero Trust)
- 모든 요청을 신뢰하지 않고 검증
- 최소 권한 원칙 적용
- 지속적인 검증 및 모니터링

### Defense in Depth
- 다층 보안 구조
- 단일 장애점 제거
- 각 계층별 독립적인 보안 메커니즘

### Security by Design
- 설계 단계부터 보안 고려
- 기본값은 안전한 설정
- 보안을 후속 작업으로 미루지 않음

## 2. 인증 및 인가

### 인증 (Authentication)

#### JWT 구현
```typescript
// JWT 토큰 생성
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export class AuthService {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roles: user.roles
    };
    
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: '15m',
      issuer: 'bespoke-ai',
      audience: 'api'
    });
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      this.refreshTokenSecret,
      {
        expiresIn: '7d',
        jwtid: crypto.randomUUID()
      }
    );
    
    return { accessToken, refreshToken };
  }
  
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'bespoke-ai',
        audience: 'api'
      }) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
```

#### 다단계 인증 (MFA)
```typescript
// TOTP 구현
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  generateSecret(user: User): MFASecret {
    const secret = speakeasy.generateSecret({
      name: `Bespoke AI (${user.email})`,
      issuer: 'Bespoke AI Suite'
    });
    
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!
    };
  }
  
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // 1분 오차 허용
    });
  }
}
```

### 인가 (Authorization)

#### RBAC (Role-Based Access Control)
```typescript
// 역할 정의
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 권한 정의
enum Permission {
  CREATE_CONTENT = 'content:create',
  READ_CONTENT = 'content:read',
  UPDATE_CONTENT = 'content:update',
  DELETE_CONTENT = 'content:delete',
  MANAGE_USERS = 'users:manage'
}

// 역할-권한 매핑
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MANAGE_USERS
  ],
  [Role.USER]: [
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT
  ],
  [Role.GUEST]: [
    Permission.READ_CONTENT
  ]
};

// 권한 검사 미들웨어
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const userPermissions = user.roles.flatMap(
      role => rolePermissions[role] || []
    );
    
    if (!userPermissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
}
```

#### ABAC (Attribute-Based Access Control)
```typescript
// 리소스 접근 정책
interface AccessPolicy {
  resource: string;
  action: string;
  condition: (user: User, resource: any) => boolean;
}

const policies: AccessPolicy[] = [
  {
    resource: 'content',
    action: 'update',
    condition: (user, content) => {
      // 소유자만 수정 가능
      return content.createdBy === user.id;
    }
  },
  {
    resource: 'campaign',
    action: 'view',
    condition: (user, campaign) => {
      // 팀 멤버만 조회 가능
      return campaign.teamMembers.includes(user.id);
    }
  }
];

export function checkAccess(
  user: User,
  resource: any,
  action: string
): boolean {
  const policy = policies.find(
    p => p.resource === resource.type && p.action === action
  );
  
  return policy ? policy.condition(user, resource) : false;
}
```

## 3. 데이터 보안

### 암호화

#### 전송 중 암호화
```yaml
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.bespoke-ai.com;
    
    # TLS 1.3만 허용
    ssl_protocols TLSv1.3;
    
    # 강력한 암호화 스위트만 사용
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # 인증서 설정
    ssl_certificate /etc/ssl/certs/bespoke-ai.crt;
    ssl_certificate_key /etc/ssl/private/bespoke-ai.key;
}
```

#### 저장 시 암호화
```typescript
// 필드 레벨 암호화
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  
  constructor() {
    // AWS KMS 또는 환경 변수에서 키 로드
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// 사용 예시
@Entity()
export class User {
  @Column()
  email: string;
  
  @Column({ type: 'jsonb' })
  @Transform(({ value }) => encryptionService.encrypt(value))
  @Transform(({ value }) => encryptionService.decrypt(value))
  sensitiveData: any;
}
```

### 개인정보 보호

#### PII 마스킹
```typescript
export class PIIMaskingService {
  // 이메일 마스킹
  maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + 
      '***' + 
      localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }
  
  // 전화번호 마스킹
  maskPhoneNumber(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  // 주민번호 마스킹
  maskSSN(ssn: string): string {
    return ssn.replace(/(\d{6})-?(\d{7})/, '$1-*******');
  }
  
  // 신용카드 마스킹
  maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1********$2');
  }
}

// 로깅 시 자동 마스킹
export class SecureLogger {
  private readonly masker = new PIIMaskingService();
  private readonly sensitiveFields = ['email', 'phone', 'ssn', 'creditCard'];
  
  log(level: string, message: string, data?: any) {
    const maskedData = this.maskSensitiveData(data);
    console.log(`[${level}] ${message}`, maskedData);
  }
  
  private maskSensitiveData(data: any): any {
    if (!data) return data;
    
    const masked = { ...data };
    for (const field of this.sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }
    return masked;
  }
}
```

### 데이터 보존 및 삭제

```typescript
// GDPR 준수 데이터 삭제
export class DataRetentionService {
  async deleteUserData(userId: string): Promise<void> {
    // 1. 사용자 콘텐츠 익명화
    await this.contentRepository.update(
      { createdBy: userId },
      { createdBy: 'DELETED_USER', metadata: {} }
    );
    
    // 2. 로그 익명화
    await this.logRepository.update(
      { userId },
      { userId: 'DELETED_USER', ip: '0.0.0.0' }
    );
    
    // 3. 사용자 데이터 삭제
    await this.userRepository.delete(userId);
    
    // 4. 캐시 삭제
    await this.cacheService.delete(`user:${userId}`);
    
    // 5. 백업에서도 삭제 (30일 후)
    await this.scheduleBackupDeletion(userId);
  }
}
```

## 4. API 보안

### 입력 검증

```typescript
// 입력 검증 스키마
import { z } from 'zod';

export const CreateContentSchema = z.object({
  type: z.enum(['text', 'image', 'video']),
  prompt: z.object({
    main: z.string().min(10).max(1000),
    style: z.string().optional(),
    keywords: z.array(z.string()).max(10).optional()
  }),
  options: z.object({
    language: z.string().regex(/^[a-z]{2}$/),
    format: z.enum(['markdown', 'html', 'plain']).optional()
  }).optional()
});

// 검증 미들웨어
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
}
```

### SQL Injection 방지

```typescript
// 파라미터화된 쿼리 사용
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // Good - 파라미터화된 쿼리
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    // Bad - SQL Injection 취약
    // const result = await this.db.query(
    //   `SELECT * FROM users WHERE email = '${email}'`
    // );
    
    return result.rows[0] || null;
  }
  
  // TypeORM 사용 시
  async searchUsers(keyword: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :keyword', { keyword: `%${keyword}%` })
      .getMany();
  }
}
```

### XSS 방지

```typescript
// HTML 이스케이프
import DOMPurify from 'isomorphic-dompurify';

export class ContentSanitizer {
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href']
    });
  }
  
  escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }
}

// React 컴포넌트에서 사용
function ContentDisplay({ content }: { content: string }) {
  // React는 기본적으로 XSS 방지
  return <div>{content}</div>;
  
  // HTML 렌더링이 필요한 경우
  const sanitizedHTML = contentSanitizer.sanitizeHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}
```

### CSRF 방지

```typescript
// CSRF 토큰 생성 및 검증
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// SameSite 쿠키 설정
app.use(session({
  cookie: {
    sameSite: 'strict',
    secure: true, // HTTPS에서만
    httpOnly: true
  }
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// 기본 rate limiter
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

// 엔드포인트별 설정
const createContentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 5, // 분당 5개 콘텐츠
  keyGenerator: (req) => req.user?.id || req.ip
});

app.use('/api/', limiter);
app.use('/api/contents', createContentLimiter);
```

## 5. 인프라 보안

### 컨테이너 보안

```dockerfile
# Dockerfile 보안 best practices
FROM node:20-alpine AS builder

# 비root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 의존성 설치 (캐시 활용)
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY --chown=nodejs:nodejs . .

# 빌드
RUN npm run build

# 런타임 이미지
FROM node:20-alpine

# 보안 업데이트
RUN apk update && apk upgrade

# 비root 사용자
USER nodejs

# 앱 복사
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 읽기 전용 파일시스템
RUN chmod -R 555 /app

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Kubernetes 보안

```yaml
# Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
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
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true

---
# Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx
      ports:
        - port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - port: 6379
```

### 시크릿 관리

```typescript
// AWS Secrets Manager 통합
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretManager {
  private client: SecretsManagerClient;
  private cache = new Map<string, any>();
  
  constructor() {
    this.client = new SecretsManagerClient({ region: 'us-east-1' });
  }
  
  async getSecret(secretName: string): Promise<any> {
    // 캐시 확인
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }
    
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName
      });
      
      const response = await this.client.send(command);
      const secret = JSON.parse(response.SecretString!);
      
      // 캐시 저장 (5분)
      this.cache.set(secretName);
      setTimeout(() => this.cache.delete(secretName), 5 * 60 * 1000);
      
      return secret;
    } catch (error) {
      console.error('Failed to retrieve secret:', error);
      throw new Error('Secret retrieval failed');
    }
  }
}

// 환경 변수 대신 시크릿 매니저 사용
const secretManager = new SecretManager();
const dbConfig = await secretManager.getSecret('prod/database');
```

## 6. 코드 보안

### 의존성 관리

```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "check-updates": "npm-check-updates",
    "snyk": "snyk test"
  },
  "devDependencies": {
    "snyk": "^1.1000.0",
    "npm-check-updates": "^16.0.0"
  }
}
```

### 보안 코딩 패턴

```typescript
// 안전한 랜덤 값 생성
import crypto from 'crypto';

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// 타이밍 공격 방지
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}

// 안전한 파일 업로드
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: '/uploads',
  filename: (req, file, cb) => {
    // 원본 파일명 사용 금지
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});
```

### 에러 처리

```typescript
// 안전한 에러 처리
export class ErrorHandler {
  handle(error: Error, req: Request, res: Response): void {
    // 로깅 (민감정보 제외)
    logger.error({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    
    // 클라이언트 응답 (상세정보 숨김)
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    } else if (error instanceof UnauthorizedError) {
      res.status(401).json({
        error: 'Unauthorized'
      });
    } else {
      // 일반 에러는 상세정보 숨김
      res.status(500).json({
        error: 'Internal server error',
        id: generateErrorId() // 디버깅용 ID
      });
    }
  }
}
```

## 7. 보안 테스팅

### 자동화된 보안 스캔

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # 매일 자정

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: npm audit
        run: npm audit --audit-level=moderate
  
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  
  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t app:test .
      
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app:test'
          severity: 'HIGH,CRITICAL'
```

### 침투 테스트

```typescript
// 보안 테스트 케이스
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should prevent brute force attacks', async () => {
      const attempts = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      );
      
      const results = await Promise.all(attempts);
      const blocked = results.filter(r => r.status === 429);
      expect(blocked.length).toBeGreaterThan(5);
    });
    
    it('should not expose sensitive data in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'test' });
      
      expect(response.body).not.toContain('user not found');
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
  
  describe('SQL Injection', () => {
    it('should handle malicious input safely', async () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--"
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(app)
          .get(`/api/users/search?q=${encodeURIComponent(input)}`);
        
        expect(response.status).not.toBe(500);
        expect(response.body).toHaveProperty('results');
      }
    });
  });
});
```

## 8. 사고 대응

### 사고 대응 계획

```typescript
// 보안 사고 감지 및 대응
export class SecurityIncidentHandler {
  async handleSuspiciousActivity(event: SecurityEvent): Promise<void> {
    // 1. 즉시 차단
    if (event.severity === 'CRITICAL') {
      await this.blockUser(event.userId);
      await this.blockIP(event.ip);
    }
    
    // 2. 증거 수집
    const evidence = await this.collectEvidence(event);
    
    // 3. 알림 발송
    await this.notifySecurityTeam(event, evidence);
    
    // 4. 자동 대응
    switch (event.type) {
      case 'BRUTE_FORCE':
        await this.enforcePasswordReset(event.userId);
        break;
      case 'DATA_EXFILTRATION':
        await this.revokeAllTokens(event.userId);
        break;
      case 'PRIVILEGE_ESCALATION':
        await this.restrictPermissions(event.userId);
        break;
    }
    
    // 5. 로깅
    await this.logIncident(event, evidence);
  }
  
  private async collectEvidence(event: SecurityEvent): Promise<Evidence> {
    return {
      logs: await this.getRecentLogs(event.userId, event.ip),
      requests: await this.getRequestHistory(event.userId),
      actions: await this.getUserActions(event.userId),
      timestamp: new Date()
    };
  }
}
```

### 모니터링 및 알림

```typescript
// 보안 모니터링
export class SecurityMonitor {
  private readonly thresholds = {
    failedLogins: 5,
    apiRequests: 1000,
    dataDownload: 100 // MB
  };
  
  async monitor(): Promise<void> {
    // 실패한 로그인 시도 모니터링
    const failedLogins = await this.getFailedLogins();
    if (failedLogins > this.thresholds.failedLogins) {
      await this.alert('HIGH_FAILED_LOGIN_RATE', { count: failedLogins });
    }
    
    // 비정상적인 API 사용 패턴
    const unusualPatterns = await this.detectUnusualPatterns();
    for (const pattern of unusualPatterns) {
      await this.alert('UNUSUAL_API_PATTERN', pattern);
    }
    
    // 대량 데이터 다운로드
    const downloads = await this.getDataDownloads();
    const suspicious = downloads.filter(
      d => d.size > this.thresholds.dataDownload
    );
    if (suspicious.length > 0) {
      await this.alert('MASS_DATA_DOWNLOAD', { downloads: suspicious });
    }
  }
}
```

## 9. 컴플라이언스

### GDPR 준수

```typescript
// GDPR 요구사항 구현
export class GDPRService {
  // 데이터 이동권 (Right to data portability)
  async exportUserData(userId: string): Promise<UserDataExport> {
    const userData = await this.userRepository.findById(userId);
    const contents = await this.contentRepository.findByUser(userId);
    const activities = await this.activityRepository.findByUser(userId);
    
    return {
      profile: this.sanitizeUserData(userData),
      contents: contents.map(c => this.sanitizeContent(c)),
      activities: activities.map(a => this.sanitizeActivity(a)),
      exportDate: new Date(),
      format: 'json'
    };
  }
  
  // 잊혀질 권리 (Right to be forgotten)
  async deleteUser(userId: string): Promise<void> {
    // 트랜잭션으로 처리
    await this.db.transaction(async (trx) => {
      // 1. 콘텐츠 익명화
      await trx('contents')
        .where('user_id', userId)
        .update({
          user_id: 'ANONYMOUS',
          metadata: null
        });
      
      // 2. 활동 로그 삭제
      await trx('activity_logs')
        .where('user_id', userId)
        .delete();
      
      // 3. 사용자 데이터 삭제
      await trx('users')
        .where('id', userId)
        .delete();
    });
    
    // 캐시 및 백업에서도 삭제
    await this.removeFromAllSystems(userId);
  }
  
  // 동의 관리
  async updateConsent(
    userId: string,
    consents: ConsentUpdate
  ): Promise<void> {
    await this.consentRepository.update(userId, {
      marketing: consents.marketing,
      analytics: consents.analytics,
      thirdParty: consents.thirdParty,
      updatedAt: new Date()
    });
    
    // 동의 철회 시 즉시 처리
    if (!consents.analytics) {
      await this.stopAnalyticsTracking(userId);
    }
  }
}
```

### 감사 로깅

```typescript
// 감사 로그
export class AuditLogger {
  async log(event: AuditEvent): Promise<void> {
    const entry: AuditLog = {
      id: generateId(),
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      changes: event.changes,
      ip: event.ip,
      userAgent: event.userAgent,
      result: event.result,
      metadata: event.metadata
    };
    
    // 변조 방지를 위한 해시
    entry.hash = this.calculateHash(entry);
    
    // 저장 (변경 불가능한 스토리지)
    await this.auditRepository.create(entry);
    
    // 실시간 분석
    if (this.isSuspicious(event)) {
      await this.alertSecurityTeam(event);
    }
  }
  
  private calculateHash(entry: AuditLog): string {
    const data = JSON.stringify({
      ...entry,
      previousHash: this.previousHash
    });
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}
```

## 10. 체크리스트

### 개발 단계
- [ ] 입력 검증 구현
- [ ] 출력 인코딩/이스케이프
- [ ] 인증/인가 구현
- [ ] 민감 데이터 암호화
- [ ] 안전한 에러 처리
- [ ] 보안 헤더 설정
- [ ] HTTPS 강제
- [ ] 의존성 취약점 검사

### 배포 전
- [ ] 보안 설정 검토
- [ ] 시크릿 하드코딩 제거
- [ ] 디버그 모드 비활성화
- [ ] 보안 테스트 실행
- [ ] 침투 테스트
- [ ] 보안 문서 업데이트

### 운영 중
- [ ] 정기 보안 패치
- [ ] 로그 모니터링
- [ ] 이상 징후 감지
- [ ] 정기 보안 감사
- [ ] 사고 대응 훈련
- [ ] 백업 및 복구 테스트

---

*보안은 지속적인 프로세스입니다. 정기적으로 이 가이드를 검토하고 업데이트하세요.*