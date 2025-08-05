.PHONY: help setup install dev build test clean docker-up docker-down docker-logs

# Default target
help:
	@echo "Available commands:"
	@echo "  make setup        - Set up the development environment"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Run all services in development mode"
	@echo "  make build        - Build all services"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker container logs"

# Set up the development environment
setup: install docker-up
	@echo "✅ Development environment is ready!"
	@echo "Run 'make dev' to start all services"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	cd services/user && go mod download
	@echo "✅ Dependencies installed"

# Run services in development mode
dev:
	@echo "🚀 Starting services in development mode..."
	npm run dev

# Build all services
build:
	@echo "🔨 Building all services..."
	npm run build
	cd services/user && go build -o ../../dist/user-service ./cmd/server
	@echo "✅ Build complete"

# Run tests
test:
	@echo "🧪 Running tests..."
	npm test
	cd services/user && go test ./...
	@echo "✅ Tests complete"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf node_modules/
	rm -rf services/*/node_modules/
	rm -rf services/*/dist/
	rm -rf services/*/build/
	@echo "✅ Clean complete"

# Docker commands
docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Docker containers started"
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Services are ready!"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Docker containers stopped"

docker-logs:
	docker-compose logs -f

# Database commands
db-migrate:
	@echo "🗄️  Running database migrations..."
	# Add migration commands here
	@echo "✅ Migrations complete"

# User Service specific commands
user-dev:
	cd services/user && go run ./cmd/server

user-build:
	cd services/user && go build -o ../../dist/user-service ./cmd/server

user-test:
	cd services/user && go test ./...

# Content Service specific commands (to be implemented)
content-dev:
	cd services/content && npm run dev

content-build:
	cd services/content && npm run build

content-test:
	cd services/content && npm test

# Frontend specific commands (to be implemented)
frontend-dev:
	cd frontend/web && npm run dev

frontend-build:
	cd frontend/web && npm run build

frontend-test:
	cd frontend/web && npm test