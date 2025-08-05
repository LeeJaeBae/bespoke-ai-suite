package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserModel represents the database model for users
type UserModel struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email            string    `gorm:"uniqueIndex;not null"`
	PasswordHash     string    `gorm:"not null"`
	Name             string    `gorm:"not null"`
	SubscriptionPlan string    `gorm:"not null;default:'free'"`
	Status           string    `gorm:"not null;default:'active'"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for the model
func (UserModel) TableName() string {
	return "users"
}

// UserUsageModel represents the database model for user usage tracking
type UserUsageModel struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	ContentsCreated int       `gorm:"not null;default:0"`
	ContentsLimit   int       `gorm:"not null;default:100"`
	APICallsCount   int       `gorm:"not null;default:0"`
	APICallsLimit   int       `gorm:"not null;default:1000"`
	LastResetAt     time.Time `gorm:"not null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// TableName specifies the table name for the model
func (UserUsageModel) TableName() string {
	return "user_usage"
}