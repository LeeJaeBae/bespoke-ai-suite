package entities

import (
	"testing"
	"time"

	"github.com/bespoke-ai/suite/services/user/internal/domain/valueobjects"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewUser(t *testing.T) {
	tests := []struct {
		name        string
		email       string
		password    string
		displayName string
		wantErr     bool
		errMsg      string
	}{
		{
			name:        "valid user creation",
			email:       "test@example.com",
			password:    "ValidPass123!",
			displayName: "Test User",
			wantErr:     false,
		},
		{
			name:        "empty email",
			email:       "",
			password:    "ValidPass123!",
			displayName: "Test User",
			wantErr:     true,
			errMsg:      "email cannot be empty",
		},
		{
			name:        "short password",
			email:       "test@example.com",
			password:    "short",
			displayName: "Test User",
			wantErr:     true,
			errMsg:      "password must be at least 8 characters",
		},
		{
			name:        "empty name",
			email:       "test@example.com",
			password:    "ValidPass123!",
			displayName: "",
			wantErr:     true,
			errMsg:      "name must be at least 2 characters long",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := NewUser(tt.email, tt.password, tt.displayName)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
				assert.Nil(t, user)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, user)
				assert.NotEqual(t, uuid.Nil, user.ID())
				assert.Equal(t, tt.email, user.Email())
				assert.Equal(t, tt.displayName, user.Name())
				assert.Equal(t, PlanFree, user.SubscriptionPlan())
				assert.Equal(t, StatusActive, user.Status())
				assert.NotEmpty(t, user.passwordHash)
				assert.NotEqual(t, tt.password, user.passwordHash) // 패스워드가 해시되었는지 확인
			}
		})
	}
}

func TestUser_VerifyPassword(t *testing.T) {
	password := "TestPassword123!"
	user, err := NewUser("test@example.com", password, "Test User")
	require.NoError(t, err)

	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{
			name:     "correct password",
			password: password,
			want:     true,
		},
		{
			name:     "incorrect password",
			password: "WrongPassword123!",
			want:     false,
		},
		{
			name:     "empty password",
			password: "",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := user.VerifyPassword(tt.password)
			assert.Equal(t, tt.want, result)
		})
	}
}

// TODO: Add TestUser_UpdatePassword when UpdatePassword method is implemented

func TestUser_UpgradeSubscription(t *testing.T) {
	user, err := NewUser("test@example.com", "Password123!", "Test User")
	require.NoError(t, err)

	// 초기 상태 확인
	assert.Equal(t, PlanFree, user.SubscriptionPlan())
	assert.NotNil(t, user.Usage())
	assert.Equal(t, 100, user.Usage().ContentsLimit)

	// Pro로 업그레이드
	user.UpgradeSubscription(PlanPro)
	assert.Equal(t, PlanPro, user.SubscriptionPlan())
	assert.Equal(t, 1000, user.Usage().ContentsLimit)
	assert.Equal(t, 10000, user.Usage().APICallsLimit)

	// Enterprise로 업그레이드
	user.UpgradeSubscription(PlanEnterprise)
	assert.Equal(t, PlanEnterprise, user.SubscriptionPlan())
	assert.Equal(t, -1, user.Usage().ContentsLimit) // Unlimited
	assert.Equal(t, -1, user.Usage().APICallsLimit) // Unlimited
}

func TestReconstructUser(t *testing.T) {
	id := uuid.New()
	email, _ := valueobjects.NewEmail("test@example.com")
	passwordHash := "hashed_password"
	name := "Test User"
	subscriptionPlan := PlanPro
	status := StatusActive
	usage := &Usage{
		ContentsCreated: 100,
		ContentsLimit:   1000,
		APICallsCount:   500,
		APICallsLimit:   5000,
	}
	createdAt := time.Now().Add(-24 * time.Hour)
	updatedAt := time.Now()

	user := ReconstructUser(id, email, passwordHash, name, subscriptionPlan, status, usage, createdAt, updatedAt)

	assert.Equal(t, id, user.ID())
	assert.Equal(t, email.String(), user.Email())
	assert.Equal(t, passwordHash, user.PasswordHash())
	assert.Equal(t, name, user.Name())
	assert.Equal(t, subscriptionPlan, user.SubscriptionPlan())
	assert.Equal(t, status, user.Status())
	assert.Equal(t, *usage, user.Usage())
	assert.Equal(t, createdAt, user.CreatedAt())
	assert.Equal(t, updatedAt, user.UpdatedAt())
}

func TestUser_PasswordHash(t *testing.T) {
	user, err := NewUser("test@example.com", "Password123!", "Test User")
	require.NoError(t, err)

	hash := user.PasswordHash()
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, "Password123!", hash)
}