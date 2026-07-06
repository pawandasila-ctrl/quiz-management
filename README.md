# Quiz Management System

A production-grade, highly optimized Quiz Management System featuring secure role-based access control, anti-cheat test taking, category and attempt administration, and real-time state synchronization.

This repository is structured as a monorepo containing:
* **`backend/`**: A high-performance FastAPI service utilizing async SQLAlchemy, PostgreSQL, and token-based cookie authentication.
* **`frontend/`**: A state-of-the-art Next.js App Router frontend built with React Query, Radix/Shadcn UI components, and client-side API routing.

---

## 🔒 Role-Based Access Control (RBAC)

The system supports three roles, with centralized role checking on both the frontend and backend:

| Capability | Student | Instructor | Admin |
| :--- | :---: | :---: | :---: |
| **Take Quizzes & View Personal History** | ✅ | ❌ | ❌ |
| **View Student Leaderboard** | ✅ | ✅ | ✅ |
| **Create & Update Quizzes/Categories** | ❌ | ✅ | ✅ |
| **Delete Quizzes, Categories & Student Attempts** | ❌ | ✅ | ✅ |
| **Promote User Roles & Manage Users** | ❌ | ❌ | ✅ |

---

## 🛡️ Anti-Cheat & Security System

The student exam interface is heavily protected against academic dishonesty with several active client-side security measures:
1. **Force Fullscreen Mode**: The quiz starts in full-screen and locks the UI.
2. **Tab / Window Switching Tracking**: The quiz listens for `visibilitychange` and window `blur` events (which captures Alt-Tabbing, split-screens, clicking outside the window, or launching browser inspect tools).
3. **Graceful Settlement Delay**: A 1.5-second settle period post-launch prevents false-positive warnings.
4. **Security Dialog Lock**: When a focus or fullscreen violation occurs, a non-dismissible warning dialog overrides the view, indicating warning counts (e.g., `Warning 1 / 3`) and forcing the student to click to re-enter fullscreen and resume.
5. **Auto-Submit Guard**: Reaching the limit of 3 warnings automatically locks the attempt and submits the current answers to the backend.
6. **Input Protections**: Context menus (right-click) and text copying are disabled.

---

## 🚀 Performance Optimizations

1. **Eager Session Loading**: Eagerly resolves the authenticated user for every session token lookup using `joinedload(Session.user)`.
2. **Database-Level Leaderboard Rankings**: Uses SQL window functions (`ROW_NUMBER()`) to fetch only the best attempts per user, ranking them efficiently in a single DB query.
3. **Eager relationship joins**: Uses SQLAlchemy `selectinload` for categories and creators to prevent N+1 query patterns during serialization.
4. **Batch Answer Validations**: Aggregates question/option verification queries into a single outer-joined query during grading.

---

## 🛠️ Technology Stack

### Backend
* **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12+)
* **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async Engine)
* **Database Driver**: `asyncpg` (PostgreSQL)
* **Security**: Argon2id via `argon2-cffi`
* **Storage**: [Cloudinary](https://cloudinary.com/) (Async file uploads)
* **Testing**: `pytest` & `pytest-asyncio` with isolated in-memory SQLite

### Frontend
* **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
* **Styling**: Vanilla CSS with Tailwind CSS utilities & [Shadcn UI](https://ui.shadcn.com/)
* **State Management**: [React Query (TanStack)](https://tanstack.com/query) (API cache & mutations)
* **HTTP Client**: Axios with dynamic middleware client-side cookie rewrite

---

## 📂 Project Structure

```text
quiz-management/
├── backend/                  # FastAPI Backend API Service
│   ├── alembic/              # Database migration scripts
│   ├── config/               # Database, security (require_role), & settings config
│   ├── controllers/          # Business logic & SQL queries
│   ├── models/               # SQLAlchemy Declarative Models
│   ├── routers/              # Endpoint routing (admin.py, auth.py, student.py)
│   ├── schemas/              # Pydantic validation models
│   └── tests/                # pytest integration tests
├── frontend/                 # Next.js Frontend Web Application
│   ├── app/                  # Next.js App Router (pages & dashboard)
│   ├── components/           # Common components (ConfirmDialog, PageShell)
│   ├── hooks/                # React state & Axios config hooks
│   ├── lib/                  # Shared utilities (auth-context, crypto helpers)
│   ├── modules/              # Feature modules (auth, quiz, question components)
│   ├── proxy.ts              # Route protection middleware
│   └── security-rules.ts     # Centralized role definitions & CSP configurations
└── docker-compose.yml        # Development Docker orchestration
```

---

## ⚙️ Setup & Installation

### 1. Backend Service
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in database, Cloudinary, and CORS configurations.
5. Run migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the API server:
   ```bash
   python main.py
   ```
   * *API docs are accessible at `http://localhost:5001/docs`.*

### 2. Frontend Web Application
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and define `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:5001/api`).
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   * *The web interface is accessible at `http://localhost:3000`.*

### 3. Docker Compose (Quickstart)
To run the backend server inside a Docker container:
```bash
docker-compose up --build
```

---

## 🧪 Testing

Run backend tests using in-memory SQLite (no setup required):
```bash
cd backend
pytest
```
Verify frontend type safety:
```bash
cd frontend
npx tsc --noEmit
```
