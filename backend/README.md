# Coding & Debugging Club Platform — Backend (Phase 2)

A modular, high-performance **FastAPI** backend for the Coding & Debugging Club Platform, supporting JWT Authentication, Role-Based Access Control (Admin & Student), 4 Question Types, Custom Marks, Custom Attempts, Timer Management, Safe Sandbox Execution, Event Tracking, Dashboard Metrics, and In-Memory Temporary Repository abstractions.

---

## 🚀 Features

- **Framework**: Python 3.14 + FastAPI + Pydantic v2 + Uvicorn.
- **Authentication**: JWT access tokens with bcrypt password hashing.
- **Role-Based Access Control**:
  - **ADMIN**: Question CRUD, Assessment CRUD, Student results view, Dashboard metrics.
  - **STUDENT**: View assigned assessments, scrubbed questions (hidden solutions/test outputs protected), Run Code (no attempt consumption), Question Submissions, Event Tracking, My Results.
- **Question Types**:
  1. `ERROR_IDENTIFICATION`
  2. `OUTPUT_PREDICTION`
  3. `CODE_COMPLETION`
  4. `PROGRAMMING_PROBLEM`
- **Supported Languages**: Python, Java, C, C++.
- **Timers & Security**:
  - Custom per-question time limits.
  - Overall assessment time limit with backend validation.
  - Customizable submit threshold minutes.
  - Safe code execution engine abstraction (prevents unsafe host execution).
- **Temporary Repository**: Thread-safe memory repository abstraction matching DB interfaces for seamless PostgreSQL migration in Phase 3.

---

## 🛠️ Project Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI App Entrypoint, CORS, Exception Handlers
│   ├── config.py              # Environment settings (Pydantic BaseSettings)
│   │
│   ├── core/                  # Security & Dependencies
│   │   ├── security.py        # Bcrypt hashing & JWT Token generation/validation
│   │   ├── dependencies.py    # FastAPI Dependency Injection & Role Guards
│   │   └── exceptions.py      # HTTP Exception Handlers (400, 401, 403, 404, 409, 422, 500)
│   │
│   ├── models/
│   │   └── entities.py        # Domain entities & dataclasses
│   │
│   ├── schemas/               # Pydantic Request & Response Schemas
│   │   ├── auth.py            # Login & Token schemas
│   │   ├── user.py            # User role & profile schemas
│   │   ├── question.py        # Question schemas (Admin vs Student scrubbing)
│   │   ├── assessment.py      # Assessment & Settings schemas
│   │   ├── submission.py      # Code Run & Question Submission schemas
│   │   ├── event.py           # Event tracking schemas
│   │   ├── result.py           # Results & Total score schemas
│   │   └── dashboard.py       # Metrics schemas
│   │
│   ├── repositories/          # Data Access Layer
│   │   ├── base.py            # Abstract Repository Interfaces
│   │   └── temporary_repository.py  # Thread-safe In-Memory Repository
│   │
│   ├── services/              # Business Logic Layer
│   │   ├── auth_service.py
│   │   ├── question_service.py
│   │   ├── assessment_service.py
│   │   ├── execution_service.py # Safe sandbox execution engine
│   │   ├── evaluation_service.py # Test case evaluation
│   │   ├── submission_service.py # Attempts & Timers calculation
│   │   ├── event_service.py
│   │   └── scoring_service.py
│   │
│   └── routers/               # REST API Routes
│       ├── auth.py
│       ├── users.py
│       ├── questions.py
│       ├── assessments.py
│       ├── code_execution.py
│       ├── submissions.py
│       ├── events.py
│       ├── results.py
│       └── dashboard.py
│
├── tests/                     # Pytest Unit & Integration Tests
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_questions.py
│   ├── test_assessments.py
│   ├── test_submissions.py
│   └── test_events_and_results.py
│
├── requirements.txt           # Dependency Manifest
├── .env.example               # Template environment variables
├── .env                       # Local environment variables
└── README.md                  # Documentation
```

---

## ⚙️ Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   python -m pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

---

## 🚀 Running the FastAPI Server

Start the Uvicorn dev server on `http://localhost:8000`:
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📖 API Documentation

Once the server is running, interactive API docs are available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔐 Credentials & Authentication

- **Admin Login**:
  - Email: `acmw@kare.klu.in`
  - Password: `acmw@2026w`
- **Student Login**:
  - Any valid student email (e.g. `student@klu.in`) & password.

Authentication uses JWT Bearer tokens passed in HTTP Header:
`Authorization: Bearer <access_token>`

---

## 🧪 Running Tests

Run the complete backend test suite using `pytest`:
```bash
pytest -v
```

---

## 🗄️ Future Database Integration (Phase 3 Roadmap)

In Phase 3 (PostgreSQL Integration):
1. Implement PostgreSQL / SQLAlchemy models extending `BaseRepository` in `app/repositories/postgres_repository.py`.
2. Update Dependency Injection bindings in `app/core/dependencies.py` to point to `PostgresRepository`.
3. Add Alembic migrations under `backend/alembic`.
No changes to `app/routers/` or `app/services/` will be required.
