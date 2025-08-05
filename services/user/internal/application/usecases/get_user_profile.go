package usecases

import (
	"context"
	"errors"

	"github.com/bespoke-ai/suite/services/user/internal/domain/repositories"
	"github.com/google/uuid"
)

// GetUserProfileRequest represents the input for getting user profile
type GetUserProfileRequest struct {
	UserID string
}

// GetUserProfileResponse represents the user profile information
type GetUserProfileResponse struct {
	ID               string
	Email            string
	Name             string
	SubscriptionPlan string
	Status           string
	Usage            UserUsageResponse
	CreatedAt        string
}

// UserUsageResponse represents the user's usage information
type UserUsageResponse struct {
	ContentsCreated int
	ContentsLimit   int
	APICallsCount   int
	APICallsLimit   int
}

// GetUserProfileUseCase handles fetching user profile
type GetUserProfileUseCase struct {
	userRepo repositories.UserRepository
}

// NewGetUserProfileUseCase creates a new instance of GetUserProfileUseCase
func NewGetUserProfileUseCase(userRepo repositories.UserRepository) *GetUserProfileUseCase {
	return &GetUserProfileUseCase{
		userRepo: userRepo,
	}
}

// Execute retrieves the user profile
func (uc *GetUserProfileUseCase) Execute(ctx context.Context, req GetUserProfileRequest) (*GetUserProfileResponse, error) {
	// Parse user ID
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Find user by ID
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Get usage information
	usage := user.Usage()

	return &GetUserProfileResponse{
		ID:               user.ID().String(),
		Email:            user.Email(),
		Name:             user.Name(),
		SubscriptionPlan: string(user.SubscriptionPlan()),
		Status:           string(user.Status()),
		Usage: UserUsageResponse{
			ContentsCreated: usage.ContentsCreated,
			ContentsLimit:   usage.ContentsLimit,
			APICallsCount:   usage.APICallsCount,
			APICallsLimit:   usage.APICallsLimit,
		},
		CreatedAt: user.CreatedAt().Format("2006-01-02T15:04:05Z"),
	}, nil
}