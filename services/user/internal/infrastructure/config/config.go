package config

import (
	"time"

	"github.com/spf13/viper"
)

// Config holds all configuration for the user service
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Logger   LoggerConfig
}

// ServerConfig contains server-related configuration
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

// DatabaseConfig contains database-related configuration
type DatabaseConfig struct {
	Host         string
	Port         string
	User         string
	Password     string
	Database     string
	MaxOpenConns int
	MaxIdleConns int
}

// RedisConfig contains Redis-related configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// JWTConfig contains JWT-related configuration
type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

// LoggerConfig contains logging-related configuration
type LoggerConfig struct {
	Level  string
	Format string
}

// LoadConfig loads configuration from environment variables and config files
func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Set default values
	viper.SetDefault("server.port", "3003")
	viper.SetDefault("server.readTimeout", "15s")
	viper.SetDefault("server.writeTimeout", "15s")
	viper.SetDefault("server.idleTimeout", "120s")

	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", "5432")
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "postgres123")
	viper.SetDefault("database.database", "bespoke_db")
	viper.SetDefault("database.maxOpenConns", 25)
	viper.SetDefault("database.maxIdleConns", 5)

	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", "6379")
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)

	viper.SetDefault("jwt.secret", "your-super-secret-jwt-key")
	viper.SetDefault("jwt.expiry", "168h") // 7 days

	viper.SetDefault("logger.level", "info")
	viper.SetDefault("logger.format", "json")

	// Bind environment variables
	viper.AutomaticEnv()
	viper.SetEnvPrefix("USER_SERVICE")

	// Read config file if exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, err
	}

	// Parse durations
	readTimeout, _ := time.ParseDuration(viper.GetString("server.readTimeout"))
	writeTimeout, _ := time.ParseDuration(viper.GetString("server.writeTimeout"))
	idleTimeout, _ := time.ParseDuration(viper.GetString("server.idleTimeout"))
	jwtExpiry, _ := time.ParseDuration(viper.GetString("jwt.expiry"))

	config.Server.ReadTimeout = readTimeout
	config.Server.WriteTimeout = writeTimeout
	config.Server.IdleTimeout = idleTimeout
	config.JWT.Expiry = jwtExpiry

	return &config, nil
}