package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bespoke-ai/suite/services/user/internal/application/usecases"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/auth"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/config"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/controllers"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/database"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/middleware"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/repositories"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize logger
	logger, err := initLogger(cfg.Logger)
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Initialize database
	db, err := database.NewPostgresDB(&cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Initialize Redis
	redisClient, err := database.NewRedisClient(&cfg.Redis)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Initialize repositories
	userRepo := repositories.NewPostgresUserRepository(db)

	// Initialize services
	authService := auth.NewJWTAuthService(cfg.JWT.Secret, cfg.JWT.Expiry, redisClient)

	// Initialize use cases
	registerUseCase := usecases.NewRegisterUserUseCase(userRepo, authService)
	loginUseCase := usecases.NewLoginUserUseCase(userRepo, authService)
	getUserProfileUseCase := usecases.NewGetUserProfileUseCase(userRepo)

	// Initialize controllers
	userController := controllers.NewUserController(
		registerUseCase,
		loginUseCase,
		getUserProfileUseCase,
	)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(authService)

	// Setup router
	router := setupRouter(userController, authMiddleware, logger)

	// Create server
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Starting user service", zap.String("port", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

func setupRouter(userController *controllers.UserController, authMiddleware *middleware.AuthMiddleware, logger *zap.Logger) *gin.Engine {
	// Set Gin mode based on environment
	if os.Getenv("NODE_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middleware
	router.Use(gin.Recovery())
	router.Use(ginLogger(logger))
	router.Use(corsMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"service": "user-service",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		users := v1.Group("/users")
		{
			userController.RegisterRoutes(users)
		}

		// Protected routes
		protected := v1.Group("/")
		protected.Use(authMiddleware.Authenticate())
		{
			// Add protected routes here
		}
	}

	return router
}

func initLogger(cfg config.LoggerConfig) (*zap.Logger, error) {
	var logConfig zap.Config

	if cfg.Format == "json" {
		logConfig = zap.NewProductionConfig()
	} else {
		logConfig = zap.NewDevelopmentConfig()
	}

	// Set log level
	switch cfg.Level {
	case "debug":
		logConfig.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	case "info":
		logConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	case "warn":
		logConfig.Level = zap.NewAtomicLevelAt(zap.WarnLevel)
	case "error":
		logConfig.Level = zap.NewAtomicLevelAt(zap.ErrorLevel)
	default:
		logConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}

	return logConfig.Build()
}

func ginLogger(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)

		logger.Info("HTTP Request",
			zap.Int("status", c.Writer.Status()),
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
			zap.Duration("latency", latency),
			zap.Int("body-size", c.Writer.Size()),
		)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}