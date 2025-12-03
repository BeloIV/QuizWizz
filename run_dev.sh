#!/bin/bash

echo "🚀 Spúšťam QuizWizz v Dockeri (development mode)..."

# Zastavenie bežiacich kontajnerov (ak nejaké sú)
echo "🧹 Zastavujem bežiace kontajnery (ak nejaké sú)..."
docker compose down

# Spustenie kontajnerov v pozadí s build
echo "🏗️  Budujem a spúšťam kontajnery v pozadí..."
docker compose up -d --build

# Čakanie na spustenie
echo "⏳ Čakám na spustenie služieb..."
sleep 5

# Kontrola stavu kontajnerov
echo "📊 Stav kontajnerov:"
docker compose ps

# Zobrazenie endpointov
echo ""
echo "📡 Endpointy:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8080/api/"
echo ""

# Zobrazenie logov
echo "📝 Posledné logy backendu (CTRL+C na ukončenie sledovania):"
docker compose logs -f backend