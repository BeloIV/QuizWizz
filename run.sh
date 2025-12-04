#!/bin/bash

echo "🚀 Spúšťam QuizWizz cez Docker Compose..."

# Stop existing containers
echo "🛑 Zastavujem existujúce kontajnery..."
sudo docker compose down

# Build and start all services
echo "🏗️  Building a spúšťam všetky služby..."
sudo docker compose up --build -d

# Show logs
echo ""
echo "✅ Služby spustené!"
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend API: http://localhost:8080/api"
echo ""
echo "📋 Sledovanie logov (Ctrl+C pre ukončenie sledovania, služby ostanú bežať):"
echo ""

# Follow logs
sudo docker compose logs -f