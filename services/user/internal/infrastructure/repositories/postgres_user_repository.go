package repositories

import (
	"context"
	"errors"

	"github.com/bespoke-ai/suite/services/user/internal/domain/entities"
	"github.com/bespoke-ai/suite/services/user/internal/domain/repositories"
	"github.com/bespoke-ai/suite/services/user/internal/domain/valueobjects"
	"github.com/bespoke-ai/suite/services/user/internal/infrastructure/repositories/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PostgresUserRepository implements UserRepository using PostgreSQL
type PostgresUserRepository struct {
	db *gorm.DB
}

// NewPostgresUserRepository creates a new PostgreSQL repository
func NewPostgresUserRepository(db *gorm.DB) repositories.UserRepository {
	return &PostgresUserRepository{db: db}
}

// Create saves a new user to the database
func (r *PostgresUserRepository) Create(ctx context.Context, user *entities.User) error {
	userModel := r.toModel(user)
	usageModel := r.toUsageModel(user)

	// Start transaction
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create user
		if err := tx.Create(&userModel).Error; err != nil {
			return err
		}

		// Create usage record
		usageModel.UserID = userModel.ID
		if err := tx.Create(&usageModel).Error; err != nil {
			return err
		}

		return nil
	})
}

// FindByID retrieves a user by their ID
func (r *PostgresUserRepository) FindByID(ctx context.Context, id uuid.UUID) (*entities.User, error) {
	var userModel models.UserModel
	var usageModel models.UserUsageModel

	// Find user
	if err := r.db.WithContext(ctx).First(&userModel, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Find usage
	if err := r.db.WithContext(ctx).First(&usageModel, "user_id = ?", id).Error; err != nil {
		return nil, err
	}

	return r.toDomain(&userModel, &usageModel)
}

// FindByEmail retrieves a user by their email address
func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*entities.User, error) {
	var userModel models.UserModel
	var usageModel models.UserUsageModel

	// Find user
	if err := r.db.WithContext(ctx).First(&userModel, "email = ?", email).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Find usage
	if err := r.db.WithContext(ctx).First(&usageModel, "user_id = ?", userModel.ID).Error; err != nil {
		return nil, err
	}

	return r.toDomain(&userModel, &usageModel)
}

// Update saves changes to an existing user
func (r *PostgresUserRepository) Update(ctx context.Context, user *entities.User) error {
	userModel := r.toModel(user)
	usageModel := r.toUsageModel(user)

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update user
		if err := tx.Model(&models.UserModel{}).Where("id = ?", userModel.ID).Updates(&userModel).Error; err != nil {
			return err
		}

		// Update usage
		if err := tx.Model(&models.UserUsageModel{}).Where("user_id = ?", userModel.ID).Updates(&usageModel).Error; err != nil {
			return err
		}

		return nil
	})
}

// Delete removes a user from the repository (soft delete)
func (r *PostgresUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.UserModel{}, "id = ?", id).Error
}

// FindAll retrieves all users with pagination
func (r *PostgresUserRepository) FindAll(ctx context.Context, offset, limit int) ([]*entities.User, error) {
	var userModels []models.UserModel

	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&userModels).Error; err != nil {
		return nil, err
	}

	users := make([]*entities.User, 0, len(userModels))
	for _, userModel := range userModels {
		var usageModel models.UserUsageModel
		if err := r.db.WithContext(ctx).First(&usageModel, "user_id = ?", userModel.ID).Error; err != nil {
			continue
		}

		user, err := r.toDomain(&userModel, &usageModel)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// Count returns the total number of users
func (r *PostgresUserRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.UserModel{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// FindBySubscriptionPlan retrieves users by their subscription plan
func (r *PostgresUserRepository) FindBySubscriptionPlan(ctx context.Context, plan entities.SubscriptionPlan, offset, limit int) ([]*entities.User, error) {
	var userModels []models.UserModel

	if err := r.db.WithContext(ctx).Where("subscription_plan = ?", string(plan)).Offset(offset).Limit(limit).Find(&userModels).Error; err != nil {
		return nil, err
	}

	users := make([]*entities.User, 0, len(userModels))
	for _, userModel := range userModels {
		var usageModel models.UserUsageModel
		if err := r.db.WithContext(ctx).First(&usageModel, "user_id = ?", userModel.ID).Error; err != nil {
			continue
		}

		user, err := r.toDomain(&userModel, &usageModel)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// FindByStatus retrieves users by their status
func (r *PostgresUserRepository) FindByStatus(ctx context.Context, status entities.UserStatus, offset, limit int) ([]*entities.User, error) {
	var userModels []models.UserModel

	if err := r.db.WithContext(ctx).Where("status = ?", string(status)).Offset(offset).Limit(limit).Find(&userModels).Error; err != nil {
		return nil, err
	}

	users := make([]*entities.User, 0, len(userModels))
	for _, userModel := range userModels {
		var usageModel models.UserUsageModel
		if err := r.db.WithContext(ctx).First(&usageModel, "user_id = ?", userModel.ID).Error; err != nil {
			continue
		}

		user, err := r.toDomain(&userModel, &usageModel)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// Helper methods for conversion between domain and database models

func (r *PostgresUserRepository) toModel(user *entities.User) *models.UserModel {
	return &models.UserModel{
		ID:               user.ID(),
		Email:            user.Email(),
		PasswordHash:     user.PasswordHash(), // Note: This requires adding a getter in the entity
		Name:             user.Name(),
		SubscriptionPlan: string(user.SubscriptionPlan()),
		Status:           string(user.Status()),
		CreatedAt:        user.CreatedAt(),
		UpdatedAt:        user.UpdatedAt(),
	}
}

func (r *PostgresUserRepository) toUsageModel(user *entities.User) *models.UserUsageModel {
	usage := user.Usage()
	return &models.UserUsageModel{
		UserID:          user.ID(),
		ContentsCreated: usage.ContentsCreated,
		ContentsLimit:   usage.ContentsLimit,
		APICallsCount:   usage.APICallsCount,
		APICallsLimit:   usage.APICallsLimit,
		LastResetAt:     usage.LastResetAt,
	}
}

func (r *PostgresUserRepository) toDomain(userModel *models.UserModel, usageModel *models.UserUsageModel) (*entities.User, error) {
	email, err := valueobjects.NewEmail(userModel.Email)
	if err != nil {
		return nil, err
	}

	usage := &entities.Usage{
		ContentsCreated: usageModel.ContentsCreated,
		ContentsLimit:   usageModel.ContentsLimit,
		APICallsCount:   usageModel.APICallsCount,
		APICallsLimit:   usageModel.APICallsLimit,
		LastResetAt:     usageModel.LastResetAt,
	}

	user := entities.ReconstructUser(
		userModel.ID,
		email,
		userModel.PasswordHash,
		userModel.Name,
		entities.SubscriptionPlan(userModel.SubscriptionPlan),
		entities.UserStatus(userModel.Status),
		usage,
		userModel.CreatedAt,
		userModel.UpdatedAt,
	)

	return user, nil
}