package auth

import (
	"context"
	"errors"
	"time"

	"github.com/bespoke-ai/suite/services/user/internal/application/interfaces"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// JWTAuthService implements AuthService using JWT tokens
type JWTAuthService struct {
	secretKey   string
	expiry      time.Duration
	redisClient *redis.Client
}

// Claims represents the JWT claims
type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

// NewJWTAuthService creates a new JWT authentication service
func NewJWTAuthService(secretKey string, expiry time.Duration, redisClient *redis.Client) interfaces.AuthService {
	return &JWTAuthService{
		secretKey:   secretKey,
		expiry:      expiry,
		redisClient: redisClient,
	}
}

// GenerateToken creates a JWT token for the given user ID
func (s *JWTAuthService) GenerateToken(ctx context.Context, userID uuid.UUID, email string) (string, error) {
	expirationTime := time.Now().Add(s.expiry)
	
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "bespoke-ai-suite",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.secretKey))
	if err != nil {
		return "", err
	}

	// Store token in Redis for validation and revocation
	err = s.redisClient.Set(ctx, s.getTokenKey(tokenString), userID.String(), s.expiry).Err()
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken validates a JWT token and returns the user ID
func (s *JWTAuthService) ValidateToken(ctx context.Context, tokenString string) (uuid.UUID, error) {
	// Check if token is revoked
	isRevoked, err := s.isTokenRevoked(ctx, tokenString)
	if err != nil {
		return uuid.Nil, err
	}
	if isRevoked {
		return uuid.Nil, errors.New("token has been revoked")
	}

	// Parse and validate token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.secretKey), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if !token.Valid {
		return uuid.Nil, errors.New("invalid token")
	}

	return claims.UserID, nil
}

// RefreshToken creates a new token from an existing valid token
func (s *JWTAuthService) RefreshToken(ctx context.Context, oldTokenString string) (string, error) {
	// Validate old token
	userID, err := s.ValidateToken(ctx, oldTokenString)
	if err != nil {
		return "", err
	}

	// Get email from old token
	claims := &Claims{}
	_, err = jwt.ParseWithClaims(oldTokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.secretKey), nil
	})
	if err != nil {
		return "", err
	}

	// Revoke old token
	err = s.RevokeToken(ctx, oldTokenString)
	if err != nil {
		return "", err
	}

	// Generate new token
	return s.GenerateToken(ctx, userID, claims.Email)
}

// RevokeToken invalidates a token
func (s *JWTAuthService) RevokeToken(ctx context.Context, tokenString string) error {
	// Add token to revocation list
	err := s.redisClient.Set(ctx, s.getRevokedTokenKey(tokenString), "revoked", s.expiry).Err()
	if err != nil {
		return err
	}

	// Remove from active tokens
	err = s.redisClient.Del(ctx, s.getTokenKey(tokenString)).Err()
	if err != nil {
		return err
	}

	return nil
}

// GetTokenExpiry returns the expiry time of a token
func (s *JWTAuthService) GetTokenExpiry(ctx context.Context, tokenString string) (time.Time, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.secretKey), nil
	})
	if err != nil {
		return time.Time{}, err
	}

	return claims.ExpiresAt.Time, nil
}

// Helper methods

func (s *JWTAuthService) getTokenKey(token string) string {
	return "token:active:" + token
}

func (s *JWTAuthService) getRevokedTokenKey(token string) string {
	return "token:revoked:" + token
}

func (s *JWTAuthService) isTokenRevoked(ctx context.Context, tokenString string) (bool, error) {
	exists, err := s.redisClient.Exists(ctx, s.getRevokedTokenKey(tokenString)).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}