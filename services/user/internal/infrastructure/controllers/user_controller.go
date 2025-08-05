package controllers

import (
	"net/http"

	"github.com/bespoke-ai/suite/services/user/internal/application/usecases"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UserController handles HTTP requests related to users
type UserController struct {
	registerUseCase     *usecases.RegisterUserUseCase
	loginUseCase        *usecases.LoginUserUseCase
	getUserProfileUseCase *usecases.GetUserProfileUseCase
}

// NewUserController creates a new user controller
func NewUserController(
	registerUseCase *usecases.RegisterUserUseCase,
	loginUseCase *usecases.LoginUserUseCase,
	getUserProfileUseCase *usecases.GetUserProfileUseCase,
) *UserController {
	return &UserController{
		registerUseCase:     registerUseCase,
		loginUseCase:        loginUseCase,
		getUserProfileUseCase: getUserProfileUseCase,
	}
}

// RegisterRoutes registers all user-related routes
func (c *UserController) RegisterRoutes(router *gin.RouterGroup) {
	router.POST("/register", c.Register)
	router.POST("/login", c.Login)
	router.GET("/profile", c.GetProfile)
}

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account
// @Tags users
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} SuccessResponse{data=usecases.RegisterUserResponse}
// @Failure 400 {object} ErrorResponse
// @Router /users/register [post]
func (c *UserController) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	response, err := c.registerUseCase.Execute(ctx.Request.Context(), usecases.RegisterUserRequest{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	})

	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "REGISTRATION_FAILED",
				Message: err.Error(),
			},
		})
		return
	}

	ctx.JSON(http.StatusCreated, SuccessResponse{
		Status: "success",
		Data:   response,
		Meta: Meta{
			Timestamp: getCurrentTimestamp(),
			Version:   "1.0.0",
		},
	})
}

// Login handles user login
// @Summary Login user
// @Description Authenticate user and return JWT token
// @Tags users
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} SuccessResponse{data=usecases.LoginUserResponse}
// @Failure 401 {object} ErrorResponse
// @Router /users/login [post]
func (c *UserController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "VALIDATION_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	response, err := c.loginUseCase.Execute(ctx.Request.Context(), usecases.LoginUserRequest{
		Email:    req.Email,
		Password: req.Password,
	})

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "LOGIN_FAILED",
				Message: err.Error(),
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, SuccessResponse{
		Status: "success",
		Data:   response,
		Meta: Meta{
			Timestamp: getCurrentTimestamp(),
			Version:   "1.0.0",
		},
	})
}

// GetProfile returns the authenticated user's profile
// @Summary Get user profile
// @Description Get the authenticated user's profile information
// @Tags users
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} SuccessResponse{data=usecases.GetUserProfileResponse}
// @Failure 401 {object} ErrorResponse
// @Router /users/profile [get]
func (c *UserController) GetProfile(ctx *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userIDInterface, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	userID, ok := userIDInterface.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "INTERNAL_ERROR",
				Message: "Invalid user ID type",
			},
		})
		return
	}

	response, err := c.getUserProfileUseCase.Execute(ctx.Request.Context(), usecases.GetUserProfileRequest{
		UserID: userID.String(),
	})

	if err != nil {
		ctx.JSON(http.StatusNotFound, ErrorResponse{
			Status: "error",
			Error: ErrorDetail{
				Code:    "USER_NOT_FOUND",
				Message: err.Error(),
			},
		})
		return
	}

	ctx.JSON(http.StatusOK, SuccessResponse{
		Status: "success",
		Data:   response,
		Meta: Meta{
			Timestamp: getCurrentTimestamp(),
			Version:   "1.0.0",
		},
	})
}