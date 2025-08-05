package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// AuthService defines the interface for authentication services
// This is a port that will be implemented by infrastructure adapters
type AuthService interface {
	// GenerateToken creates a JWT token for the given user ID
	GenerateToken(ctx context.Context, userID uuid.UUID, email string) (string, error)
	
	// ValidateToken validates a JWT token and returns the user ID
	ValidateToken(ctx context.Context, token string) (uuid.UUID, error)
	
	// RefreshToken creates a new token from an existing valid token
	RefreshToken(ctx context.Context, token string) (string, error)
	
	// RevokeToken invalidates a token
	RevokeToken(ctx context.Context, token string) error
	
	// GetTokenExpiry returns the expiry time of a token
	GetTokenExpiry(ctx context.Context, token string) (time.Time, error)
}