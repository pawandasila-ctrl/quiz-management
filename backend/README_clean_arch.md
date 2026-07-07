# 🎓 Clean Architecture Guide: FastAPI & Production Engineering

This document details the **Clean Architecture** patterns, design decisions, and production-grade engineering practices implemented in the FastAPI backend of this project. It is structured to help you and your colleagues understand how to build fast, scalable, and secure Python APIs.

---

## 🏗️ The Clean Architecture Design Arc

Clean Architecture (introduced by Robert C. Martin / Uncle Bob) organizes the codebase into concentric layers with a strict dependency rule: **inner layers must never know anything about outer layers.**

```text
       ┌─────────────────────────────────────────────────────────┐
       │             Infrastructure Layer                        │
       │  (Database Engines, Migrations, Logging, Rate Limits)   │
       │       ┌─────────────────────────────────────────┐       │
       │       │       Interface / Router Layer          │       │
       │       │  (HTTP Endpoints, Cookies, API Routing) │       │
       │       │       ┌─────────────────────────┐       │       │
       │       │       │    Application Layer    │       │       │
       │       │       │ (Controllers & Schemas) │       │       │
       │       │       │       ┌─────────┐       │       │       │
       │       │       │       │ Domain  │       │       │       │
       │       │       │       │ (Models)│       │       │       │
       │       │       │       └─────────┘       │       │       │
       │       │       └─────────────────────────┘       │       │
       │       └─────────────────────────────────────────┘       │
       └─────────────────────────────────────────────────────────┘
```

### 1. Domain Layer (`models/`, `enums/`)
* **Purpose**: Core business entities and rules.
* **Characteristics**: This is the heart of the application. It contains SQLAlchemy models and enums. It **never** imports anything from the layers outer to it.

### 2. Application Layer (`controllers/`, `schemas/`)
* **Purpose**: Orchestrates use cases and business logic.
* **Characteristics**: Implements controllers (which execute transactions, query calculations, and database modifications) and Pydantic schemas (validating payloads). It only imports from the **Domain** layer.

### 3. Interface Layer (`routers/`)
* **Purpose**: Connects the web server to the application logic.
* **Characteristics**: Defines FastAPI endpoints, maps HTTP routes, sets cookies, and coordinates API request/response lifecycles. It calls **Controllers** to execute actions.

### 4. Infrastructure Layer (`config/`)
* **Purpose**: Implements external drivers and frameworks.
* **Characteristics**: Holds configurations for Database connection pools (`database.py`), centralized logging (`logging.py`), security configurations (`security.py`), and rate limiting filters (`limiter.py`).

---

## 💡 Key Architectural Concepts & Best Practices

Here are the advanced engineering concepts implemented in this repository that you can use to teach your teammates:

### 1. Modern Dependency Injection: `typing.Annotated`
Instead of repeating database injections (`db: AsyncSession = Depends(get_db)`) across every route, we centralize this logic using type aliases.

* **Before (Repetitive & Cluttered)**:
  ```python
  async def get_quiz(id: int, db: AsyncSession = Depends(get_db)):
  ```
* **After (Clean & Type-Safe)**:
  ```python
  # 1. Defined in config/database.py:
  from typing import Annotated
  from fastapi import Depends
  DbSession = Annotated[AsyncSession, Depends(get_db)]

  # 2. Reused across all routers:
  async def get_quiz(id: int, db: DbSession):
  ```
  **Why it matters**: It separates type annotations from parameter defaults. Function signatures look like standard Python functions, improving IDE autocomplete, testing, and mock injection.

---

### 2. Level-Based Structured Logging
A high-standard API must manage logs differently depending on where it runs:

* **Development Mode (`ENVIRONMENT=development`)**: Emits colored console outputs using the custom `ColoredFormatter`.
  * **Contextual Helpers**: `WARNING` and `ERROR` logs automatically print the file name, line number, and function name to help you locate bugs in real-time.
* **Production Mode (`ENVIRONMENT=production`)**: Emits **Structured JSON Lines** via `JSONFormatter` to `stdout`.
  * **Dynamic Schemas**: Success messages (`INFO`) remain lightweight. Error messages (`ERROR`/`CRITICAL`) dynamically append execution paths and exception tracebacks (`exc_info`) for log aggregators (e.g. Datadog, ELK).
  * **Uvicorn Propagation**: Clears default Uvicorn handlers and forces server logs to propagate to the root logger so that request logs are also formatted in JSON.

---

### 3. GPU-Resistant Hashing: Argon2id
While standard tutorials suggest `bcrypt`, it is vulnerable to high-speed hardware-based brute force (using customized GPUs/ASICs).
* This project implements **Argon2id** (the PHC winner).
* It is **memory-hard**, meaning it requires a configurable amount of RAM to compute each hash, making parallel hardware attacks practically infeasible.

---

### 4. Robust PostgreSQL Enum Migrations
PostgreSQL custom enums do not automatically drop when you execute `DROP TABLE CASCADE`, leading to `DuplicateObjectError: type "userrole" already exists` on fresh database branches.
* **Our Solution**:
  1. We execute `DROP TYPE IF EXISTS ... CASCADE` at the beginning of the baseline migration (`b93a18bf726d_baseline.py`).
  2. We pass `create_type=False` to SQLAlchemy enum columns inside the migrations to prevent conflicts:
     ```python
     sa.Column('role', sa.Enum('ADMIN', 'STUDENT', name='userrole', create_type=False))
     ```
  This keeps migrations clean, predictable, and fully compatible with neon branching environments.

---

### 5. Rate-Limiting Layer
Defends auth-sensitive routes against brute force and account registration bots using client IP tracking (`slowapi`):
* **User Registration**: Restricted to **5 attempts per hour**.
* **User Login**: Restricted to **10 attempts per minute**.
