#!/bin/bash

echo "🚀 Starting Legal AI Server Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual configuration values"
    echo "❌ Deployment stopped. Configure .env first."
    exit 1
fi

# Create necessary directories
mkdir -p public/documents public/temp

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🏃 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    echo "🌐 API available at: https://legalai-xx7y.onrender.com"
    echo "🔍 Health check: https://legalai-xx7y.onrender.com/health"
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop services: docker-compose down"
else
    echo "❌ Services failed to start. Check logs:"
    docker-compose logs
    exit 1
fi
