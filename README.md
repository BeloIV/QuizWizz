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

**Note:** The frontend requires a `.env` file in the `frontend/` directory with:
```
VITE_API_BASE_URL=http://localhost:8080/api
```
This tells the frontend where to find the backend API.

API endpoints:
- `GET /api/quizzes` – list quizzes with basic metadata
- `GET /api/quizzes/<quiz_id>/` – retrieve one quiz with questions and options

### Running without Docker (Manual Setup)

If you prefer to run the services manually:

#### Prerequisites
- Python 3.10+ (needed for Django 5.2)
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

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

npm install
npm start
```

**Note:** For manual setup, the backend runs on port 8000, so use `http://localhost:8000/api` in the `.env` file.

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

- Replace SQLite with a production-ready database (e.g., PostgreSQL) by updating `DATABASES` in `backend/backend/settings.py` and applying migrations.
- Configure CORS (`CORS_ALLOW_ALL_ORIGINS`) more securely for public deployments.
- Build the frontend with `npm run build` and serve the static files via a web server or your Django setup.
- Update `docker-compose.yml` for production use (remove exposed ports, add environment variables, etc.)

You now have everything needed to run Quizwizz with Docker. Happy quizzing!
