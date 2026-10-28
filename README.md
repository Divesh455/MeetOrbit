# MeetOrbit

MeetOrbit is an AI-powered meeting platform for creating meeting rooms,
collaborating with participants, and turning conversations into searchable
knowledge and actionable outcomes.

## Technology

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Python, FastAPI
- Database: PostgreSQL with pgvector support
- ORM and migrations: SQLAlchemy and Alembic
- Real-time meetings: LiveKit (planned)
- Transcription: faster-whisper (planned)
- AI workflows: LangGraph (planned)

## Local development

### 1. Start PostgreSQL

From the project root:

    docker compose --env-file .env -f infra/docker-compose.yml up -d

### 2. Start the backend

    cd backend
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload

### 3. Start the frontend

In another terminal:

    cd frontend
    npm run dev

## API documentation

When the backend is running, open:

    http://127.0.0.1:8000/docs

## Security

- Never commit .env.
- Use unique production secrets.
- Do not expose the database port publicly.
- Implement authorization before exposing private meeting data.

## Development status

Phase 1: Project foundation and service connectivity.
