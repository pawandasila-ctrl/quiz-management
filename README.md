# Quiz System API Backend

A performance-optimized FastAPI backend for a Quiz Management System supporting administrators and students. Features include secure session-based authentication, category and quiz management, questions and options authoring, automatic grading, and ranked leaderboards.

---

## 🚀 Key Performance Optimizations

This backend has been optimized for low latency and high efficiency, especially when interacting with remote databases (like Neon PostgreSQL):

1. **Answer Submission Latency Reduction (50%+ speedup)**: Combined several operations into fewer roundtrips. Instead of querying Question, Option, and existing Answer in multiple sequential SQL calls, we use a single outer-joined SQL query to retrieve and validate them all at once.
2. **Eager Session Loading**: Eager-loads the authenticated `User` with the `Session` using `joinedload(Session.user)`. This saves a secondary database query on **every single protected endpoint request**.
3. **Database-Level Leaderboard Rankings**: Utilizes SQL `ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY score DESC, time_taken_seconds ASC)` window function inside the database to fetch only the *best* attempt per student. It ranks and orders students in a single query instead of fetching thousands of attempts and deduplicating in Python memory.
4. **Scalar Subquery Marks Recalculation**: Replaced the sequential load-and-sum marks routine with a single SQL `UPDATE` statement using a scalar subquery `SUM(marks)` for immediate database updates.

---

## 🛠️ Technology Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
- **ORM / Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async Engine)
- **Database Driver**: `asyncpg` (PostgreSQL)
- **Security**: Argon2id via `argon2-cffi` (Secure password hashing) & random URL-safe session token cookies
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/) (Asynchronous image file uploads)
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` (Integration testing), `aiosqlite` (In-memory SQLite for fast testing isolated from PostgreSQL)

---

## 📂 Project Structure

```text
backend/
├── config/             # Configuration & security dependencies
│   ├── database.py     # Database engine & sessionmaker
│   ├── security.py     # Password hashing, dependencies (require_role)
│   └── settings.py     # Pydantic-settings environment variables
├── controllers/        # Business logic & SQL queries
│   ├── quiz.py         # Quiz, category, question, & option controllers
│   ├── result.py       # Enrollment, attempt, grading, & leaderboard controllers
│   └── users.py        # Authentication & user management controllers
├── models/             # SQLAlchemy declarative models
│   ├── quiz.py         # Category, Quiz, Question, Option
│   ├── result.py       # Enrollment, QuizAttempt, Answer
│   └── user.py         # User, Session
├── routers/            # FastAPI Endpoint routing
│   ├── admin.py        # /admin endpoints (Restricted to UserRole.ADMIN)
│   ├── auth.py         # /auth endpoints (Registration, login, logout, me)
│   └── student.py      # /student endpoints (Restricted to UserRole.STUDENT)
├── schemas/            # Pydantic data validation models
│   ├── quiz.py
│   ├── result.py
│   └── user.py
├── tests/              # Test suite (Integration tests)
│   ├── conftest.py     # Test database config & fixtures
│   ├── test_auth.py    # Auth unit/integration tests
│   └── test_quiz.py    # Quiz lifecycle, grading, and leaderboard tests
├── main.py             # Application entrypoint & middlewares (CORS)
├── requirements.txt    # Production & development dependencies
└── pyproject.toml      # Pytest & project configurations
```

---

## ⚙️ Getting Started

### Prerequisites

- Python 3.12 or higher
- Pip (Python Package Index)

### 1. Installation

Clone this repository and navigate to the `backend` folder:

```bash
cd backend
```

Create a virtual environment and activate it:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your configurations:

- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql+asyncpg://user:pass@host/db`)
- `SECRET_KEY`: Long, random secret key for cryptography/hashing
- `ENVIRONMENT`: Set to `development` or `production`
- `CORS_ORIGINS`: JSON list of allowed origins (e.g. `["http://localhost:3000"]`)
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for image upload features.

### 3. Running the Server

Start the development server with hot-reload enabled:

```bash
python main.py
```

The application will start running on **`http://127.0.0.1:5001`**.

- **Interactive API Documentation**: Visit `http://127.0.0.1:5001/docs` to view Swagger UI.
- **Alternative Docs**: Visit `http://127.0.0.1:5001/redoc` to view ReDoc.

---

## 🧪 Running Tests

The test suite runs in-memory using an isolated SQLite engine. No database setup is needed to run the tests.

Run the test suite with:

```bash
pytest
```

---

## 🔒 Security & RBAC

The API supports Role-Based Access Control (RBAC):
- **Guest / Public**: `/auth/register` (always creates `student` users), `/auth/login`.
- **Student User (`student` role)**: Can view published quizzes, enroll, start attempts, submit answers, finalize attempts, view their own graded attempts, and see the leaderboard.
- **Admin User (`admin` role)**: Can manage categories, create/update/publish/delete quizzes, manage questions & options, release results, view all student attempts, upload images to Cloudinary, and promote/change user roles.

Protected routes extract the cookie session token `access_token` automatically (or fall back to the `Authorization: Bearer <token>` header).
