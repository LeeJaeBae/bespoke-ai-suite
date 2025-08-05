# 코딩 스타일 가이드

> 버전: 1.0.0  
> 작성일: 2025년 8월 4일  
> 적용 대상: 모든 Bespoke AI Suite 개발자

## 목차

1. [일반 원칙](#1-일반-원칙)
2. [명명 규칙](#2-명명-규칙)
3. [TypeScript/JavaScript](#3-typescriptjavascript)
4. [Python](#4-python)
5. [Go](#5-go)
6. [Java](#6-java)
7. [Git 커밋 메시지](#7-git-커밋-메시지)
8. [코드 리뷰](#8-코드-리뷰)
9. [문서화](#9-문서화)
10. [도구 설정](#10-도구-설정)

---

## 1. 일반 원칙

### 가독성 우선
- 코드는 작성하는 시간보다 읽는 시간이 더 많음
- 명확하고 자명한 코드 작성
- 복잡한 로직은 주석으로 설명

### 일관성
- 프로젝트 전체에서 동일한 스타일 유지
- 기존 코드베이스의 스타일 따르기
- 자동 포맷터 활용

### KISS (Keep It Simple, Stupid)
- 단순한 해결책 선호
- 과도한 추상화 지양
- 필요할 때만 복잡성 추가

### DRY (Don't Repeat Yourself)
- 중복 코드 제거
- 공통 로직 추출
- 재사용 가능한 컴포넌트 작성

## 2. 명명 규칙

### 파일명
```
# TypeScript/JavaScript
user-service.ts          # kebab-case
user.controller.ts       # 역할 명시
user.entity.ts
create-user.use-case.ts

# Python
user_service.py          # snake_case
user_controller.py
user_entity.py

# Go
userservice.go           # lowercase
user_controller.go
user_entity.go
```

### 변수명
```typescript
// 의미 있는 이름 사용
const userAge = 25;              // Good
const a = 25;                    // Bad

// Boolean은 is/has/can으로 시작
const isActive = true;
const hasPermission = false;
const canEdit = true;

// 배열은 복수형
const users = [];
const items = [];

// 상수는 UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.bespoke-ai.com';
```

### 함수명
```typescript
// 동사로 시작
function createUser() {}
function validateEmail() {}
function sendNotification() {}

// getter/setter
function getUsername() {}
function setUsername(name: string) {}

// 이벤트 핸들러
function handleClick() {}
function onSubmit() {}
```

### 클래스명
```typescript
// PascalCase
class UserService {}
class ContentRepository {}
class CreateUserUseCase {}

// 인터페이스는 I 접두사 없이
interface User {}         // Good
interface IUser {}        // Bad
```

## 3. TypeScript/JavaScript

### 기본 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 변수 선언
```typescript
// const를 기본으로 사용
const name = 'John';

// 재할당이 필요한 경우만 let
let count = 0;
count++;

// var 사용 금지
var oldStyle = 'No!'; // Bad
```

### 함수
```typescript
// 화살표 함수 선호
const add = (a: number, b: number): number => {
  return a + b;
};

// 단일 표현식은 중괄호 생략
const double = (n: number): number => n * 2;

// async/await 사용
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

// 옵셔널 파라미터
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : `Hello ${name}`;
}

// 기본값
function createUser(name: string, role: string = 'user'): User {
  return { name, role };
}
```

### 타입
```typescript
// 인터페이스 사용
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 타입 별칭
type UserId = string;
type UserRole = 'admin' | 'user' | 'guest';

// 열거형
enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video'
}

// 제네릭
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### 클래스
```typescript
export class UserService {
  // private 필드는 # 사용
  #repository: UserRepository;
  
  constructor(repository: UserRepository) {
    this.#repository = repository;
  }
  
  async createUser(dto: CreateUserDto): Promise<User> {
    // 입력 검증
    this.validateUserDto(dto);
    
    // 비즈니스 로직
    const user = User.create({
      name: dto.name,
      email: dto.email
    });
    
    // 저장
    return await this.#repository.save(user);
  }
  
  private validateUserDto(dto: CreateUserDto): void {
    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new ValidationError('Invalid email');
    }
  }
  
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 에러 처리
```typescript
// 커스텀 에러 클래스
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// try-catch 사용
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    // 검증 에러 처리
    logger.warn('Validation failed:', error.message);
  } else {
    // 예상치 못한 에러
    logger.error('Unexpected error:', error);
    throw error;
  }
}

// 에러 전파
async function processContent(id: string): Promise<void> {
  const content = await contentService.findById(id);
  if (!content) {
    throw new NotFoundError(`Content ${id} not found`);
  }
  // 처리 로직
}
```

### 모듈 import/export
```typescript
// 명시적 import
import { UserService } from './user.service';
import { User, UserRole } from './user.entity';
import type { CreateUserDto } from './dto/create-user.dto';

// 절대 경로 import (tsconfig paths 설정)
import { logger } from '@/utils/logger';
import { config } from '@/config';

// export
export class UserController {}
export { UserService };
export type { User };

// default export 지양
export default UserService; // Bad
export { UserService };     // Good
```

## 4. Python

### PEP 8 준수
```python
# 들여쓰기: 4 스페이스
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total

# 줄 길이: 최대 88자 (Black 기준)
# 빈 줄: 함수 간 2줄, 메서드 간 1줄
```

### 명명 규칙
```python
# 변수, 함수: snake_case
user_name = "John"
def get_user_by_id(user_id: str) -> User:
    pass

# 클래스: PascalCase
class UserService:
    pass

# 상수: UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
DEFAULT_TIMEOUT = 30

# Private: _ 접두사
class User:
    def __init__(self, name: str):
        self._name = name
        self.__id = generate_id()  # Name mangling
```

### 타입 힌트
```python
from typing import List, Dict, Optional, Union
from dataclasses import dataclass

# 함수 타입 힌트
def process_items(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}

# Optional 사용
def find_user(user_id: str) -> Optional[User]:
    user = db.query(User).filter_by(id=user_id).first()
    return user

# Union 타입
def parse_value(value: Union[str, int]) -> str:
    return str(value)

# 데이터클래스
@dataclass
class CreateUserDto:
    name: str
    email: str
    age: Optional[int] = None
```

### 비동기 프로그래밍
```python
import asyncio
from typing import List

# 비동기 함수
async def fetch_user(user_id: str) -> User:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"/users/{user_id}") as response:
            data = await response.json()
            return User(**data)

# 동시 실행
async def fetch_multiple_users(user_ids: List[str]) -> List[User]:
    tasks = [fetch_user(user_id) for user_id in user_ids]
    return await asyncio.gather(*tasks)

# 에러 처리
async def safe_fetch_user(user_id: str) -> Optional[User]:
    try:
        return await fetch_user(user_id)
    except Exception as e:
        logger.error(f"Failed to fetch user {user_id}: {e}")
        return None
```

### 클래스
```python
from abc import ABC, abstractmethod

# 추상 클래스
class Repository(ABC):
    @abstractmethod
    async def find_by_id(self, id: str) -> Optional[Entity]:
        pass
    
    @abstractmethod
    async def save(self, entity: Entity) -> Entity:
        pass

# 구현 클래스
class UserRepository(Repository):
    def __init__(self, db_session: AsyncSession):
        self._session = db_session
    
    async def find_by_id(self, id: str) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(User.id == id)
        )
        return result.scalar_one_or_none()
    
    async def save(self, user: User) -> User:
        self._session.add(user)
        await self._session.commit()
        return user
```

## 5. Go

### 기본 규칙
```go
// gofmt 사용 필수
// golint 경고 해결
// go vet 통과

package userservice

import (
    "context"
    "errors"
    "fmt"
    "time"
    
    "github.com/google/uuid"
    "go.uber.org/zap"
)
```

### 명명 규칙
```go
// 패키지명: lowercase, 단일 단어
package user       // Good
package userService // Bad

// 변수명: camelCase
var userName string
var isActive bool

// 상수: CamelCase 또는 대문자
const MaxRetryCount = 3
const DEFAULT_TIMEOUT = 30 * time.Second

// 인터페이스: -er 접미사
type Reader interface {
    Read([]byte) (int, error)
}

type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}
```

### 에러 처리
```go
// 에러는 마지막 반환값
func CreateUser(name string) (*User, error) {
    if name == "" {
        return nil, errors.New("name cannot be empty")
    }
    
    user := &User{
        ID:   uuid.New().String(),
        Name: name,
    }
    
    return user, nil
}

// 커스텀 에러
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field %s: %s", e.Field, e.Message)
}

// 에러 체크
user, err := CreateUser("")
if err != nil {
    var validationErr *ValidationError
    if errors.As(err, &validationErr) {
        // 검증 에러 처리
        log.Warn("Validation failed", zap.Error(err))
    } else {
        // 다른 에러
        return fmt.Errorf("failed to create user: %w", err)
    }
}
```

### 구조체와 메서드
```go
// 구조체 정의
type User struct {
    ID        string    `json:"id" db:"id"`
    Name      string    `json:"name" db:"name"`
    Email     string    `json:"email" db:"email"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// 생성자 패턴
func NewUser(name, email string) *User {
    return &User{
        ID:        uuid.New().String(),
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
}

// 메서드
func (u *User) Validate() error {
    if u.Name == "" {
        return &ValidationError{
            Field:   "name",
            Message: "name is required",
        }
    }
    
    if !isValidEmail(u.Email) {
        return &ValidationError{
            Field:   "email",
            Message: "invalid email format",
        }
    }
    
    return nil
}

// 포인터 리시버 vs 값 리시버
func (u *User) UpdateName(name string) { // 포인터: 상태 변경
    u.Name = name
}

func (u User) String() string { // 값: 읽기 전용
    return fmt.Sprintf("User{ID: %s, Name: %s}", u.ID, u.Name)
}
```

### 동시성
```go
// 고루틴과 채널
func ProcessUsers(users []*User) error {
    errCh := make(chan error, len(users))
    done := make(chan bool)
    
    for _, user := range users {
        go func(u *User) {
            if err := processUser(u); err != nil {
                errCh <- err
                return
            }
            done <- true
        }(user)
    }
    
    // 결과 수집
    for i := 0; i < len(users); i++ {
        select {
        case err := <-errCh:
            return err
        case <-done:
            // 성공
        case <-time.After(30 * time.Second):
            return errors.New("timeout")
        }
    }
    
    return nil
}

// sync 패키지 사용
var (
    mu    sync.RWMutex
    cache = make(map[string]*User)
)

func GetUser(id string) (*User, bool) {
    mu.RLock()
    defer mu.RUnlock()
    user, ok := cache[id]
    return user, ok
}

func SetUser(user *User) {
    mu.Lock()
    defer mu.Unlock()
    cache[user.ID] = user
}
```

## 6. Java

### 기본 규칙
```java
// Google Java Style Guide 준수
// CheckStyle 통과
// SonarQube 규칙 준수
```

### 패키지 구조
```
com.bespoke.ai.suite
├── domain
│   ├── entity
│   └── valueobject
├── application
│   ├── usecase
│   └── port
├── infrastructure
│   ├── controller
│   ├── repository
│   └── config
└── common
    ├── exception
    └── util
```

### 명명 규칙
```java
// 패키지: lowercase
package com.bespoke.ai.suite.domain.entity;

// 클래스: PascalCase
public class UserEntity {
    // 필드: camelCase
    private String userId;
    private String userName;
    
    // 상수: UPPER_SNAKE_CASE
    public static final int MAX_NAME_LENGTH = 100;
    private static final String DEFAULT_ROLE = "USER";
    
    // 메서드: camelCase
    public void updateUserName(String newName) {
        this.userName = newName;
    }
}
```

### 클래스 구조
```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Content> contents = new ArrayList<>();
    
    // 정적 팩토리 메서드
    public static User create(String name, String email) {
        User user = new User();
        user.name = name;
        user.email = email;
        user.role = UserRole.USER;
        return user;
    }
    
    // 비즈니스 메서드
    public void updateProfile(String name) {
        validateName(name);
        this.name = name;
    }
    
    // 유효성 검증
    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new ValidationException("Name cannot be empty");
        }
        if (name.length() > MAX_NAME_LENGTH) {
            throw new ValidationException("Name is too long");
        }
    }
}
```

### 서비스 클래스
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final EventPublisher eventPublisher;
    
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        log.info("Creating user with email: {}", request.getEmail());
        
        // 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        
        // 엔티티 생성
        User user = User.create(
            request.getName(),
            request.getEmail()
        );
        
        // 저장
        User savedUser = userRepository.save(user);
        
        // 이벤트 발행
        eventPublisher.publish(new UserCreatedEvent(savedUser.getId()));
        
        return UserDto.from(savedUser);
    }
    
    @Transactional(readOnly = true)
    public Optional<UserDto> findById(String userId) {
        return userRepository.findById(userId)
            .map(UserDto::from);
    }
}
```

## 7. Git 커밋 메시지

### 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 스타일 변경 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 등 기타 변경

### 예시
```bash
feat(content): 이미지 콘텐츠 생성 기능 추가

- Stable Diffusion API 통합
- 이미지 크기 및 스타일 옵션 추가
- 생성된 이미지 S3 업로드

Closes: #123

---

fix(auth): JWT 토큰 만료 시간 오류 수정

토큰 만료 시간이 초 단위가 아닌 밀리초 단위로
설정되던 문제를 수정했습니다.

Fixes: #456
```

## 8. 코드 리뷰

### 리뷰 체크리스트
- [ ] 코드가 요구사항을 충족하는가?
- [ ] 테스트가 충분한가?
- [ ] 에러 처리가 적절한가?
- [ ] 성능 문제는 없는가?
- [ ] 보안 취약점은 없는가?
- [ ] 코드가 읽기 쉬운가?
- [ ] 중복 코드는 없는가?
- [ ] 문서화가 필요한가?

### 리뷰 코멘트 예시
```
// 제안
suggestion: null 체크를 Optional로 변경하면 더 명확할 것 같습니다.

// 질문
question: 이 로직이 동시성 문제를 일으킬 수 있을까요?

// 필수 수정
must-fix: 이 SQL 쿼리는 SQL injection에 취약합니다.

// 칭찬
praise: 에러 처리가 매우 깔끔하네요! 👍
```

## 9. 문서화

### 함수/메서드 주석
```typescript
/**
 * 사용자를 생성합니다.
 * 
 * @param dto - 사용자 생성 정보
 * @returns 생성된 사용자 정보
 * @throws {ValidationError} 입력값이 유효하지 않은 경우
 * @throws {DuplicateError} 이메일이 중복된 경우
 * 
 * @example
 * const user = await createUser({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 */
async function createUser(dto: CreateUserDto): Promise<User> {
  // 구현
}
```

### README 작성
```markdown
# 서비스명

## 개요
서비스의 목적과 기능을 간단히 설명

## 시작하기

### 필수 요구사항
- Node.js 20+
- PostgreSQL 15+

### 설치
\`\`\`bash
npm install
\`\`\`

### 실행
\`\`\`bash
npm run dev
\`\`\`

## API 문서
[API 문서 링크]

## 기여하기
[기여 가이드라인]
```

## 10. 도구 설정

### ESLint 설정
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

### Prettier 설정
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "arrowParens": "always"
}
```

### Pre-commit Hook
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{py}": [
      "black",
      "flake8"
    ],
    "*.{go}": [
      "gofmt -w",
      "golint"
    ]
  }
}
```

---

*이 가이드는 지속적으로 업데이트됩니다. 제안사항이 있으면 PR을 보내주세요.*