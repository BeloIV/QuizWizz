# Quizwizz

Quizwizz is a full-stack quiz application with a Django REST API backend and a React single-page frontend. The backend exposes quiz data (including seeded sample content), while the frontend lets players browse, play, and review quizzes.

## Prerequisites

- Python 3.10+ (needed for Django 5.2)
- Node.js 18+ and npm (tested with create-react-app tooling)
- Git Bash, WSL, or another POSIX shell if you plan to use `run.sh` on Windows

## Getting Started

### 1. Clone and create a virtual environment

```bash
git clone <your-fork-or-clone-url>
cd QuizWizz/backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install --upgrade pip
pip install django djangorestframework django-cors-headers
```

> If you prefer frozen dependencies, create your own `requirements.txt` once the environment is ready: `pip freeze > requirements.txt`.

### 2. Set up and run the backend

```bash
cd backend/backend
python manage.py migrate          # Applies schema + seed migration
python manage.py runserver 0.0.0.0:8000
```

The database defaults to SQLite (`backend/backend/db.sqlite3`). The `0002_seed_quizzes` migration auto-populates sample quizzes, so no extra fixtures are required.

API endpoints:
- `GET /api/quizzes` – list quizzes with basic metadata
- `GET /api/quizzes/<quiz_id>/` – retrieve one quiz with questions and options

Leave the server running while developing the frontend.

### 3. Set up and run the frontend

Open a second terminal (or background the backend process) and from the repository root:

```bash
cd frontend
npm install
# Optionally point to a remote backend:
# REACT_APP_API_BASE_URL="https://example.com/api" npm start
npm start
```

By default the app looks for the backend at `http://<current-hostname>:8000/api`, which works when both servers run on the same machine. Override it with the `REACT_APP_API_BASE_URL` environment variable if you deploy the API elsewhere.

### 4. Combined start script (optional)

The root-level `run.sh` starts both servers and captures backend logs to `backend/backend.log`. Make it executable once and run from the project root:

```bash
chmod +x run.sh
./run.sh
```

On Windows, run it from Git Bash or WSL; PowerShell/CMD do not support the script natively. Stop both servers with `Ctrl+C`.

## Project Structure

```
backend/
  backend/         # Django project (manage.py lives here)
    quizzes/       # Quiz models, serializers, API viewset, migrations
frontend/          # React app created with create-react-app
run.sh             # Convenience script to start backend + frontend
```

## Development Tips

- **Backend tests:** from `backend/backend`, run `python manage.py test`.
- **Frontend tests:** from `frontend`, run `npm test`.
- **Linting:** create your preferred tooling (e.g., `ruff`, `eslint`) as needed; defaults are not included.
- **Environment variables:** set `DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, or other production settings before deploying. Use `.env` files or platform-specific config management.

## Deployment Notes

- Replace SQLite with a production-ready database (e.g., PostgreSQL) by updating `DATABASES` in `backend/backend/settings.py` and applying migrations.
- Configure CORS (`CORS_ALLOW_ALL_ORIGINS`) more securely for public deployments.
- Build the frontend with `npm run build` and serve the static files via a web server or your Django setup.

You now have everything needed to run Quizwizz locally on macOS, Linux, or Windows (with a POSIX-compatible shell). Happy quizzing!
