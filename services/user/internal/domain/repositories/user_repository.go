package repositories

import (
	"context"

	"github.com/bespoke-ai/suite/services/user/internal/domain/entities"
	"github.com/google/uuid"
)

// UserRepository defines the interface for user persistence
// This interface belongs to the domain layer and is implemented in the infrastructure layer
type UserRepository interface {
	// Create saves a new user to the repository
	Create(ctx context.Context, user *entities.User) error
	
	// FindByID retrieves a user by their ID
	FindByID(ctx context.Context, id uuid.UUID) (*entities.User, error)
	
	// FindByEmail retrieves a user by their email address
	FindByEmail(ctx context.Context, email string) (*entities.User, error)
	
	// Update saves changes to an existing user
	Update(ctx context.Context, user *entities.User) error
	
	// Delete removes a user from the repository
	Delete(ctx context.Context, id uuid.UUID) error
	
	// FindAll retrieves all users with pagination
	FindAll(ctx context.Context, offset, limit int) ([]*entities.User, error)
	
	// Count returns the total number of users
	Count(ctx context.Context) (int64, error)
	
	// FindBySubscriptionPlan retrieves users by their subscription plan
	FindBySubscriptionPlan(ctx context.Context, plan entities.SubscriptionPlan, offset, limit int) ([]*entities.User, error)
	
	// FindByStatus retrieves users by their status
	FindByStatus(ctx context.Context, status entities.UserStatus, offset, limit int) ([]*entities.User, error)
}