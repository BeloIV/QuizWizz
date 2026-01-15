# Quizwizz

Quizwizz is a full-stack quiz application with a Django REST API backend and a React single-page frontend. The backend exposes quiz data (including seeded sample content), while the frontend lets players browse, play, and review quizzes.

## Prerequisites

- Docker and Docker Compose
- For manual setup: Python 3.11+, Node.js 18+

## Configuration

Before running the application, configure the backend environment:

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and update the following settings:
   - `SECRET_KEY`: Change to a unique secret key for production
   - `DEBUG`: Set to `0` in production
   - `ALLOWED_HOSTS`: Add your production domain(s)
   - `CORS_ORIGIN_WHITELIST`: Add allowed frontend URLs
   - `CSRF_TRUSTED_ORIGINS`: Add trusted origins for CSRF
   - `SESSION_COOKIE_SECURE`: Set to `1` in production with HTTPS
   - `CSRF_COOKIE_SECURE`: Set to `1` in production with HTTPS

**Security Note**: Never commit the `.env` file to version control. The `.env.example` file is provided as a template only.

## Getting Started

### Running with Docker (Recommended)

The easiest way to run QuizWizz is using Docker Compose, which handles both backend and frontend services:

```bash
# Clone the repository
git clone git@github.com:BeloIV/QuizWizz.git
cd QuizWizz

# Configure backend environment (see Configuration section above)
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

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

The backend automatically runs migrations on startup, so the database is ready to use immediately. Environment variables are loaded from `backend/.env` via the `env_file` directive in `docker-compose.yml`.

API endpoints:
- `GET /api/quizzes` – list quizzes with basic metadata
- `GET /api/quizzes/<quiz_id>/` – retrieve one quiz with questions and options

### Running without Docker (Manual Setup)

If you prefer to run the services manually:

#### Prerequisites
- Python 3.11+ (required for Django 5.0)
- Node.js 18+ and npm
- Git Bash, WSL, or another POSIX shell if you plan to use `run.sh` on Windows

#### 1. Set up the backend

```bash
cd backend

# Configure environment
cp .env.example .env
# Edit .env with your settings

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

**Note:** For manual setup, the backend runs on port 8000. The frontend is configured to use the appropriate backend URL automatically.

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
  Dockerfile       # Backend container configuration
  backend/         # Django project (manage.py lives here)
    quizzes/       # Quiz models, serializers, API viewset, migrations
frontend/
  Dockerfile       # Frontend container configuration
  src/             # React app source code
docker-compose.yml # Multi-container orchestration
run.sh             # Convenience script to start backend + frontend 
```

## Development Tips

- **Docker logs:** `sudo docker compose logs -f backend` or `sudo docker compose logs -f frontend`
- **Restart services:** `sudo docker compose restart backend` or `sudo docker compose restart frontend`
- **Rebuild after changes:** `sudo docker compose up --build -d`
- **Backend tests:** `sudo docker compose exec backend python manage.py test`
- **Access Django shell:** `sudo docker compose exec backend python manage.py shell`
- **Frontend tests:** from `frontend`, run `npm test` (or exec into container)
- **Database:** SQLite file is stored in `backend/backend/db.sqlite3` and persists between container restarts

## Deployment Notes

### Production Security Checklist

1. **Environment Variables**: Update `backend/.env` for production:
   - Generate a new `SECRET_KEY` (use `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
   - Set `DEBUG=0`
   - Configure `ALLOWED_HOSTS` with your domain
   - Set `SESSION_COOKIE_SECURE=1` and `CSRF_COOKIE_SECURE=1` for HTTPS
   - Restrict `CORS_ORIGIN_WHITELIST` to your frontend domain only
   - Update `CSRF_TRUSTED_ORIGINS` with your HTTPS domain

2. **Database**: Replace SQLite with a production-ready database (e.g., PostgreSQL) by updating `DATABASES` in `backend/backend/settings.py` and applying migrations.

3. **Static Files**: Build the frontend with `npm run build` and serve the static files via a web server (nginx, Apache) or through Django's static file serving.

4. **Docker**: Update `docker-compose.yml` for production use (remove exposed development ports, use production images, etc.).

5. **HTTPS**: Always use HTTPS in production to protect session cookies and CSRF tokens.

You now have everything needed to run Quizwizz with Docker. Happy quizzing!
