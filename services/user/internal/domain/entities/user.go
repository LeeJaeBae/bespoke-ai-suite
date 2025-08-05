package entities

import (
	"errors"
	"time"

	"github.com/bespoke-ai/suite/services/user/internal/domain/valueobjects"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// SubscriptionPlan represents the user's subscription tier
type SubscriptionPlan string

const (
	PlanFree       SubscriptionPlan = "free"
	PlanPro        SubscriptionPlan = "pro"
	PlanEnterprise SubscriptionPlan = "enterprise"
)

// UserStatus represents the user's account status
type UserStatus string

const (
	StatusActive   UserStatus = "active"
	StatusInactive UserStatus = "inactive"
	StatusSuspended UserStatus = "suspended"
)

// User represents the core user entity following Clean Architecture principles
type User struct {
	id               uuid.UUID
	email            valueobjects.Email
	passwordHash     string
	name             string
	subscriptionPlan SubscriptionPlan
	status           UserStatus
	usage            *Usage
	createdAt        time.Time
	updatedAt        time.Time
}

// Usage tracks the user's resource consumption
type Usage struct {
	ContentsCreated    int
	ContentsLimit      int
	APICallsCount      int
	APICallsLimit      int
	LastResetAt        time.Time
}

// NewUser creates a new user entity with validation
func NewUser(email string, password string, name string) (*User, error) {
	// Create and validate email
	emailVO, err := valueobjects.NewEmail(email)
	if err != nil {
		return nil, err
	}

	// Validate name
	if name == "" || len(name) < 2 {
		return nil, errors.New("name must be at least 2 characters long")
	}

	// Validate password
	if len(password) < 8 {
		return nil, errors.New("password must be at least 8 characters long")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	return &User{
		id:               uuid.New(),
		email:            emailVO,
		passwordHash:     string(hashedPassword),
		name:             name,
		subscriptionPlan: PlanFree,
		status:           StatusActive,
		usage: &Usage{
			ContentsCreated: 0,
			ContentsLimit:   100,  // Free plan limit
			APICallsCount:   0,
			APICallsLimit:   1000, // Free plan limit
			LastResetAt:     now,
		},
		createdAt: now,
		updatedAt: now,
	}, nil
}

// Business Logic Methods

// VerifyPassword checks if the provided password matches
func (u *User) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.passwordHash), []byte(password))
	return err == nil
}

// ChangePassword updates the user's password
func (u *User) ChangePassword(oldPassword, newPassword string) error {
	if !u.VerifyPassword(oldPassword) {
		return errors.New("invalid old password")
	}

	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters long")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.passwordHash = string(hashedPassword)
	u.updatedAt = time.Now()
	return nil
}

// UpgradeSubscription changes the user's subscription plan
func (u *User) UpgradeSubscription(newPlan SubscriptionPlan) error {
	if u.status != StatusActive {
		return errors.New("cannot upgrade subscription for inactive user")
	}

	// Update limits based on plan
	switch newPlan {
	case PlanPro:
		u.usage.ContentsLimit = 1000
		u.usage.APICallsLimit = 10000
	case PlanEnterprise:
		u.usage.ContentsLimit = -1 // Unlimited
		u.usage.APICallsLimit = -1 // Unlimited
	default:
		return errors.New("invalid subscription plan")
	}

	u.subscriptionPlan = newPlan
	u.updatedAt = time.Now()
	return nil
}

// CanCreateContent checks if the user has reached their content creation limit
func (u *User) CanCreateContent() bool {
	if u.status != StatusActive {
		return false
	}
	
	// Unlimited for enterprise
	if u.usage.ContentsLimit == -1 {
		return true
	}
	
	return u.usage.ContentsCreated < u.usage.ContentsLimit
}

// IncrementContentCount increases the content creation count
func (u *User) IncrementContentCount() error {
	if !u.CanCreateContent() {
		return errors.New("content creation limit reached")
	}
	
	u.usage.ContentsCreated++
	u.updatedAt = time.Now()
	return nil
}

// CanMakeAPICall checks if the user has reached their API call limit
func (u *User) CanMakeAPICall() bool {
	if u.status != StatusActive {
		return false
	}
	
	// Unlimited for enterprise
	if u.usage.APICallsLimit == -1 {
		return true
	}
	
	return u.usage.APICallsCount < u.usage.APICallsLimit
}

// IncrementAPICallCount increases the API call count
func (u *User) IncrementAPICallCount() error {
	if !u.CanMakeAPICall() {
		return errors.New("API call limit reached")
	}
	
	u.usage.APICallsCount++
	u.updatedAt = time.Now()
	return nil
}

// ResetUsage resets the usage counters (typically done monthly)
func (u *User) ResetUsage() {
	u.usage.ContentsCreated = 0
	u.usage.APICallsCount = 0
	u.usage.LastResetAt = time.Now()
	u.updatedAt = time.Now()
}

// Suspend suspends the user account
func (u *User) Suspend() error {
	if u.status == StatusSuspended {
		return errors.New("user is already suspended")
	}
	
	u.status = StatusSuspended
	u.updatedAt = time.Now()
	return nil
}

// Activate activates a suspended or inactive user account
func (u *User) Activate() error {
	if u.status == StatusActive {
		return errors.New("user is already active")
	}
	
	u.status = StatusActive
	u.updatedAt = time.Now()
	return nil
}

// Getters (following encapsulation principle)

func (u *User) ID() uuid.UUID {
	return u.id
}

func (u *User) PasswordHash() string {
	return u.passwordHash
}

func (u *User) Email() string {
	return u.email.String()
}

func (u *User) Name() string {
	return u.name
}

func (u *User) SubscriptionPlan() SubscriptionPlan {
	return u.subscriptionPlan
}

func (u *User) Status() UserStatus {
	return u.status
}

func (u *User) Usage() Usage {
	return *u.usage
}

func (u *User) CreatedAt() time.Time {
	return u.createdAt
}

func (u *User) UpdatedAt() time.Time {
	return u.updatedAt
}

// SetName updates the user's name
func (u *User) SetName(name string) error {
	if name == "" || len(name) < 2 {
		return errors.New("name must be at least 2 characters long")
	}
	
	u.name = name
	u.updatedAt = time.Now()
	return nil
}

// ReconstructUser is used by the repository to reconstruct a user entity from stored data
// This is a factory method for repository use only
func ReconstructUser(
	id uuid.UUID,
	email valueobjects.Email,
	passwordHash string,
	name string,
	subscriptionPlan SubscriptionPlan,
	status UserStatus,
	usage *Usage,
	createdAt time.Time,
	updatedAt time.Time,
) *User {
	return &User{
		id:               id,
		email:            email,
		passwordHash:     passwordHash,
		name:             name,
		subscriptionPlan: subscriptionPlan,
		status:           status,
		usage:            usage,
		createdAt:        createdAt,
		updatedAt:        updatedAt,
	}
}