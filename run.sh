#!/bin/bash

echo "🚀 Spúšťam vývojové servery pre Quizwizz..."

# Spustenie backendu
(
  cd backend/backend 
  echo "▶️  Spúšťam Django backend na porte 8000..."
    python3 manage.py runserver 0.0.0.0:8000 | tee ../backend.log
) &

# Spustenie frontendu
(
  cd frontend 
  echo "▶️  Spúšťam React frontend... "

  npm start --host 0.0.0.0

) &

wait