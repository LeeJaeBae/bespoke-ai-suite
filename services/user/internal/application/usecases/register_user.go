package usecases

import (
	"context"
	"errors"

	"github.com/bespoke-ai/suite/services/user/internal/application/interfaces"
	"github.com/bespoke-ai/suite/services/user/internal/domain/entities"
	"github.com/bespoke-ai/suite/services/user/internal/domain/repositories"
)

// RegisterUserRequest represents the input for user registration
type RegisterUserRequest struct {
	Email    string
	Password string
	Name     string
}

// RegisterUserResponse represents the output of user registration
type RegisterUserResponse struct {
	UserID string
	Email  string
	Name   string
	Token  string
}

// RegisterUserUseCase handles user registration business logic
type RegisterUserUseCase struct {
	userRepo    repositories.UserRepository
	authService interfaces.AuthService
}

// NewRegisterUserUseCase creates a new instance of RegisterUserUseCase
func NewRegisterUserUseCase(
	userRepo repositories.UserRepository,
	authService interfaces.AuthService,
) *RegisterUserUseCase {
	return &RegisterUserUseCase{
		userRepo:    userRepo,
		authService: authService,
	}
}

// Execute performs the user registration
func (uc *RegisterUserUseCase) Execute(ctx context.Context, req RegisterUserRequest) (*RegisterUserResponse, error) {
	// Check if user already exists
	existingUser, err := uc.userRepo.FindByEmail(ctx, req.Email)
	if err == nil && existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Create new user entity
	user, err := entities.NewUser(req.Email, req.Password, req.Name)
	if err != nil {
		return nil, err
	}

	// Save user to repository
	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate JWT token
	token, err := uc.authService.GenerateToken(ctx, user.ID(), user.Email())
	if err != nil {
		return nil, errors.New("failed to generate authentication token")
	}

	return &RegisterUserResponse{
		UserID: user.ID().String(),
		Email:  user.Email(),
		Name:   user.Name(),
		Token:  token,
	}, nil
}