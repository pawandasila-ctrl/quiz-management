"""
Seed script: Create a 'Database' category (if missing) and add
10 dummy Database MCQ questions to a new quiz.

Usage (from the backend/ directory):
  python -m scripts.seed_database_questions

Requires: DATABASE_URL env var (already in .env)
"""

import asyncio
import os
import sys

# ensure the backend package root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from sqlalchemy import select
from config.database import SessionLocal
from models.quiz import Category, Quiz, Question, Option, QuizStatus, QuestionType
from models.user import User, UserRole

QUESTIONS = [
    {
        "text": "Which SQL clause is used to filter rows returned by a query?",
        "explanation": "The WHERE clause filters rows based on a specified condition.",
        "options": [
            ("HAVING", False),
            ("WHERE", True),
            ("GROUP BY", False),
            ("ORDER BY", False),
        ],
    },
    {
        "text": "What does ACID stand for in database transactions?",
        "explanation": "ACID = Atomicity, Consistency, Isolation, Durability — the four properties of reliable transactions.",
        "options": [
            ("Atomicity, Consistency, Isolation, Durability", True),
            ("Accuracy, Consistency, Integrity, Durability", False),
            ("Atomicity, Concurrency, Isolation, Distribution", False),
            ("Accuracy, Completeness, Integrity, Dependability", False),
        ],
    },
    {
        "text": "Which type of JOIN returns all rows from both tables, matched where possible?",
        "explanation": "FULL OUTER JOIN returns all rows from both tables, with NULLs where there is no match.",
        "options": [
            ("INNER JOIN", False),
            ("LEFT JOIN", False),
            ("RIGHT JOIN", False),
            ("FULL OUTER JOIN", True),
        ],
    },
    {
        "text": "What is a PRIMARY KEY?",
        "explanation": "A PRIMARY KEY uniquely identifies each row in a table and cannot be NULL.",
        "options": [
            ("A key that can contain duplicate values", False),
            ("A column that uniquely identifies each row and cannot be NULL", True),
            ("A foreign reference to another table", False),
            ("An index used only for sorting", False),
        ],
    },
    {
        "text": "Which normal form eliminates partial dependencies?",
        "explanation": "Second Normal Form (2NF) eliminates partial dependencies on the primary key.",
        "options": [
            ("1NF", False),
            ("2NF", True),
            ("3NF", False),
            ("BCNF", False),
        ],
    },
    {
        "text": "What does the GROUP BY clause do in SQL?",
        "explanation": "GROUP BY groups rows sharing a value in specified columns so aggregate functions can be applied per group.",
        "options": [
            ("Filters rows based on a condition", False),
            ("Sorts the result set", False),
            ("Groups rows with same values for aggregate functions", True),
            ("Joins two tables", False),
        ],
    },
    {
        "text": "Which SQL command is used to remove all rows from a table without logging individual row deletions?",
        "explanation": "TRUNCATE removes all rows quickly without logging each deletion, unlike DELETE.",
        "options": [
            ("DELETE", False),
            ("DROP", False),
            ("TRUNCATE", True),
            ("REMOVE", False),
        ],
    },
    {
        "text": "What is an index in a database?",
        "explanation": "An index is a data structure that speeds up data retrieval operations on a table column.",
        "options": [
            ("A backup copy of the database", False),
            ("A data structure to speed up query lookups", True),
            ("A constraint that enforces uniqueness", False),
            ("A stored procedure", False),
        ],
    },
    {
        "text": "Which of the following is a NoSQL database?",
        "explanation": "MongoDB is a NoSQL document-oriented database; the others are relational (SQL) databases.",
        "options": [
            ("PostgreSQL", False),
            ("MySQL", False),
            ("MongoDB", True),
            ("SQLite", False),
        ],
    },
    {
        "text": "What does a FOREIGN KEY constraint enforce?",
        "explanation": "A FOREIGN KEY enforces referential integrity by ensuring the value in a column matches a value in another table's primary key.",
        "options": [
            ("Unique values within the column", False),
            ("Non-null values in the column", False),
            ("Referential integrity between two tables", True),
            ("A default value for the column", False),
        ],
    },
]


async def seed():
    async with SessionLocal() as db:
        # ── Find or create 'Database' category ────────────────────────────
        result = await db.execute(select(Category).where(Category.name == "Database"))
        category = result.scalars().first()
        if not category:
            category = Category(name="Database", description="Questions covering database fundamentals, SQL, and design.")
            db.add(category)
            await db.flush()
            print(f"Created category: Database (id={category.id})")
        else:
            print(f"Using existing category: Database (id={category.id})")

        # ── Find the first admin user to set as creator ───────────────────
        result = await db.execute(select(User).where(User.role == UserRole.ADMIN).limit(1))
        admin = result.scalars().first()
        if not admin:
            print("ERROR: No admin user found. Please create an admin account first.")
            return

        # ── Create the quiz ───────────────────────────────────────────────
        quiz = Quiz(
            title="Database Fundamentals",
            description="Test your knowledge of SQL, relational databases, and core database concepts.",
            category_id=category.id,
            created_by_id=admin.id,
            status=QuizStatus.DRAFT,
            time_limit_minutes=20,
            pass_mark=60,
            total_marks=len(QUESTIONS),
            max_attempts=3,
        )
        db.add(quiz)
        await db.flush()
        print(f"Created quiz: '{quiz.title}' (id={quiz.id})")

        # ── Add questions and options ─────────────────────────────────────
        for order, q_data in enumerate(QUESTIONS, start=1):
            question = Question(
                quiz_id=quiz.id,
                text=q_data["text"],
                type=QuestionType.MCQ,
                marks=1,
                order=order,
                explanation=q_data["explanation"],
            )
            db.add(question)
            await db.flush()

            for opt_order, (opt_text, is_correct) in enumerate(q_data["options"], start=1):
                option = Option(
                    question_id=question.id,
                    text=opt_text,
                    is_correct=is_correct,
                    order=opt_order,
                )
                db.add(option)

        await db.commit()
        print(f"\n✓ Seeded {len(QUESTIONS)} questions into '{quiz.title}'.")
        print(f"  Quiz ID: {quiz.id} | Status: draft | Pass mark: 60%")
        print("  Publish it from the admin panel when ready.")


if __name__ == "__main__":
    asyncio.run(seed())
