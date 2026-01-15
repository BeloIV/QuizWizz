# Quizwizz

Quizwizz is a full-stack quiz application with a Django REST API backend and a React single-page frontend. The backend exposes quiz data (including seeded sample content), while the frontend lets players browse, play, and review quizzes.

## Prerequisites

- Docker and Docker Compose

## Getting Started

### Running with Docker (Recommended)

The easiest way to run QuizWizz is using Docker Compose, which handles both backend and frontend services:

```bash
# Clone the repository
git clone git@github.com:BeloIV/QuizWizz.git
cd QuizWizz

# Backend .env file should already exist with default development settings
# If not, copy from .env.example:
# cp backend/.env.example backend/.env

# Build and start all services
sudo docker compose up --build -d

# View logs (optional)
sudo docker compose logs -f

# Stop all services
sudo docker compose down
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`

The backend automatically runs migrations on startup, so the database is ready to use immediately.

API endpoints:
- `GET /api/quizzes` – list quizzes with basic metadata
- `GET /api/quizzes/<quiz_id>/` – retrieve one quiz with questions and options

### Running without Docker (Manual Setup)

If you prefer to run the services manually:

#### Prerequisites
- Python 3.10+ (needed for Django 5.0)
- Node.js 18+ and npm
- Git Bash, WSL, or another POSIX shell if you plan to use `run.sh` on Windows

#### 1. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

#### 2. Set up the frontend

Open a second terminal:

```bash
cd frontend

npm install
npm start
```

**Note:** For manual setup, the backend runs on port 8000. The frontend proxies API requests through Vite config.

#### 3. Using run.sh script (Docker alternative)

You can also use the convenience script that wraps Docker Compose:

```bash
chmod +x run.sh
./run.sh
```

This script will build and start all services using Docker Compose and display logs.

## Project Structure

```
backend/
  .env             # Environment variables (create from .env.example)
  .env.example     # Template for environment configuration
  Dockerfile       # Backend container configuration
  backend/         # Django project (manage.py lives here)
    quizzes/       # Quiz models, serializers, API viewset, migrations
frontend/
  Dockerfile       # Frontend container configuration
  src/             # React app source code
docker-compose.yml # Multi-container orchestration
run.sh             # Convenience script to start backend + frontend 
```

## Configuration

The backend uses environment variables for configuration. A `.env` file should exist in `backend/` directory (created from `.env.example`):

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True  # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Settings
CORS_ORIGIN_WHITELIST=http://localhost:3000

# CSRF Settings
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

**For production:** Generate a new SECRET_KEY and update all security settings accordingly.

## Development Tips

- **Docker logs:** `sudo docker compose logs -f backend` or `sudo docker compose logs -f frontend`
- **Restart services:** `sudo docker compose restart backend` or `sudo docker compose restart frontend`
- **Rebuild after changes:** `sudo docker compose up --build -d`
- **Backend tests:** `sudo docker compose exec backend python manage.py test`
- **Access Django shell:** `sudo docker compose exec backend python manage.py shell`
- **Frontend tests:** from `frontend`, run `npm test` (or exec into container)
- **Database:** SQLite file is stored in `backend/backend/db.sqlite3` and persists between container restarts

## Deployment Notes

- **Database:** Replace SQLite with PostgreSQL or another production database by updating `DATABASES` in settings.py
- **Security:** Generate a new SECRET_KEY for production:
  ```bash
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- **Environment:** Set `DEBUG=False`, `SESSION_COOKIE_SECURE=True`, and `CSRF_COOKIE_SECURE=True` in production .env
- **CORS:** Update `CORS_ORIGIN_WHITELIST` and `CSRF_TRUSTED_ORIGINS` with your production domain
- **Static files:** Build frontend with `npm run build` and serve via nginx or Django static files
- **Docker:** Update docker-compose.yml for production (remove exposed ports, add secrets management)

You now have everything needed to run Quizwizz with Docker. Happy quizzing!
