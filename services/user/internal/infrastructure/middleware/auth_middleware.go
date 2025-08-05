package middleware

import (
	"net/http"
	"strings"

	"github.com/bespoke-ai/suite/services/user/internal/application/interfaces"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware provides JWT authentication middleware
type AuthMiddleware struct {
	authService interfaces.AuthService
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(authService interfaces.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
	}
}

// Authenticate is the middleware function that validates JWT tokens
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    "MISSING_AUTH_HEADER",
					"message": "Authorization header is required",
				},
			})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    "INVALID_AUTH_HEADER",
					"message": "Authorization header must be in format: Bearer <token>",
				},
			})
			c.Abort()
			return
		}

		token := tokenParts[1]

		// Validate token
		userID, err := m.authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status": "error",
				"error": gin.H{
					"code":    "INVALID_TOKEN",
					"message": err.Error(),
				},
			})
			c.Abort()
			return
		}

		// Set user ID in context for use in handlers
		c.Set("userID", userID)
		c.Set("token", token)

		c.Next()
	}
}

// OptionalAuthenticate is a middleware that validates JWT tokens if present but doesn't require them
func (m *AuthMiddleware) OptionalAuthenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No token provided, continue without authentication
			c.Next()
			return
		}

		// Check if the header starts with "Bearer "
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			// Invalid format, continue without authentication
			c.Next()
			return
		}

		token := tokenParts[1]

		// Validate token
		userID, err := m.authService.ValidateToken(c.Request.Context(), token)
		if err == nil {
			// Valid token, set user ID in context
			c.Set("userID", userID)
			c.Set("token", token)
			c.Set("authenticated", true)
		} else {
			// Invalid token, set authenticated to false
			c.Set("authenticated", false)
		}

		c.Next()
	}
}