package usecases

import (
	"context"
	"errors"

	"github.com/bespoke-ai/suite/services/user/internal/application/interfaces"
	"github.com/bespoke-ai/suite/services/user/internal/domain/entities"
	"github.com/bespoke-ai/suite/services/user/internal/domain/repositories"
)

// LoginUserRequest represents the input for user login
type LoginUserRequest struct {
	Email    string
	Password string
}

// LoginUserResponse represents the output of user login
type LoginUserResponse struct {
	UserID           string
	Email            string
	Name             string
	SubscriptionPlan string
	Token            string
}

// LoginUserUseCase handles user login business logic
type LoginUserUseCase struct {
	userRepo    repositories.UserRepository
	authService interfaces.AuthService
}

// NewLoginUserUseCase creates a new instance of LoginUserUseCase
func NewLoginUserUseCase(
	userRepo repositories.UserRepository,
	authService interfaces.AuthService,
) *LoginUserUseCase {
	return &LoginUserUseCase{
		userRepo:    userRepo,
		authService: authService,
	}
}

// Execute performs the user login
func (uc *LoginUserUseCase) Execute(ctx context.Context, req LoginUserRequest) (*LoginUserResponse, error) {
	// Find user by email
	user, err := uc.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Verify password
	if !user.VerifyPassword(req.Password) {
		return nil, errors.New("invalid credentials")
	}

	// Check if user is active
	if user.Status() != entities.StatusActive {
		return nil, errors.New("account is not active")
	}

	// Generate JWT token
	token, err := uc.authService.GenerateToken(ctx, user.ID(), user.Email())
	if err != nil {
		return nil, errors.New("failed to generate authentication token")
	}

	return &LoginUserResponse{
		UserID:           user.ID().String(),
		Email:            user.Email(),
		Name:             user.Name(),
		SubscriptionPlan: string(user.SubscriptionPlan()),
		Token:            token,
	}, nil
}