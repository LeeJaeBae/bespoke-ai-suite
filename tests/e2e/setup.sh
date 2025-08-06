#!/bin/bash

# Bespoke AI Suite E2E Tests Setup Script
# This script sets up the E2E testing environment

set -e

echo "🚀 Setting up Bespoke AI Suite E2E Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="20.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is not supported. Please install Node.js 20+ and try again."
    exit 1
fi

print_success "Node.js version $NODE_VERSION detected"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the tests/e2e directory."
    exit 1
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "npm dependencies installed successfully"
else
    print_error "Failed to install npm dependencies"
    exit 1
fi

# Install Playwright browsers
print_status "Installing Playwright browsers..."
npx playwright install

if [ $? -eq 0 ]; then
    print_success "Playwright browsers installed successfully"
else
    print_error "Failed to install Playwright browsers"
    exit 1
fi

# Install system dependencies for Playwright
print_status "Installing Playwright system dependencies..."
npx playwright install-deps

if [ $? -eq 0 ]; then
    print_success "Playwright system dependencies installed successfully"
else
    print_warning "Some system dependencies might not have been installed. Tests might still work."
fi

# Create environment file
print_status "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Environment file created from .env.example"
    else
        print_warning ".env.example not found. You may need to create .env manually."
    fi
else
    print_warning ".env file already exists. Skipping creation."
fi

# Create necessary directories
print_status "Creating test directories..."
mkdir -p test-results/{screenshots,videos,traces,html-report,allure-results}
mkdir -p test-results/.auth

print_success "Test directories created"

# Check if Docker is running (for services)
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        print_success "Docker is running"
        
        # Go to root directory to check for docker-compose
        cd ../..
        
        if [ -f "docker-compose.yml" ]; then
            print_status "Starting Docker services..."
            docker-compose up -d postgres mongodb redis kafka weaviate minio
            
            if [ $? -eq 0 ]; then
                print_success "Docker services started successfully"
                
                # Wait for services to be ready
                print_status "Waiting for services to be ready..."
                sleep 30
                
                # Basic health checks
                print_status "Performing health checks..."
                
                # Check PostgreSQL
                if docker-compose exec -T postgres pg_isready &> /dev/null; then
                    print_success "PostgreSQL is ready"
                else
                    print_warning "PostgreSQL might not be ready yet"
                fi
                
                # Check MongoDB
                if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
                    print_success "MongoDB is ready"
                else
                    print_warning "MongoDB might not be ready yet"
                fi
                
                # Check Redis
                if docker-compose exec -T redis redis-cli ping &> /dev/null; then
                    print_success "Redis is ready"
                else
                    print_warning "Redis might not be ready yet"
                fi
                
            else
                print_error "Failed to start Docker services"
                exit 1
            fi
        else
            print_warning "docker-compose.yml not found in root directory"
        fi
        
        # Go back to e2e directory
        cd tests/e2e
    else
        print_warning "Docker is installed but not running. Please start Docker and run the services manually."
    fi
else
    print_warning "Docker is not installed. Please install Docker to run the required services."
fi

# Validate setup by running a simple test
print_status "Validating setup..."

# Try to run Playwright version command
if npx playwright --version &> /dev/null; then
    PLAYWRIGHT_VERSION=$(npx playwright --version)
    print_success "Playwright is working: $PLAYWRIGHT_VERSION"
else
    print_error "Playwright installation validation failed"
    exit 1
fi

# Print final setup summary
echo ""
echo "============================================="
echo "🎉 E2E Test Setup Complete!"
echo "============================================="
echo ""
echo "📋 Next steps:"
echo "1. Make sure all services are running:"
echo "   - Frontend (port 3005)"
echo "   - Content Service (port 8081)"
echo "   - User Service (port 8082)"
echo "   - Other services as needed"
echo ""
echo "2. Configure environment variables in .env file"
echo ""
echo "3. Run tests:"
echo "   npm test                 # Run all tests"
echo "   npm run test:smoke      # Run smoke tests"
echo "   npm run test:headed     # Run with browser UI"
echo "   npm run test:ui         # Run with Playwright UI"
echo ""
echo "4. View reports:"
echo "   npm run test:report     # Open HTML report"
echo ""
echo "📚 Documentation:"
echo "   - README.md for detailed instructions"
echo "   - Playwright docs: https://playwright.dev"
echo ""

print_success "Setup completed successfully! 🚀"