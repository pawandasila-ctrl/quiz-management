from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
import enum

class QuizStatus(str, enum.Enum):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    CLOSED = 'closed'

class QuestionType(str, enum.Enum):
    MCQ = 'mcq'
    TRUE_FALSE = 'true_false'

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    quizzes = relationship("Quiz", back_populates="category")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(Enum(QuizStatus), nullable=False, default=QuizStatus.DRAFT)
    time_limit_minutes = Column(Integer, nullable=True)
    pass_mark = Column(Integer, nullable=False, default=0)
    total_marks = Column(Integer, nullable=False, default=0)
    shuffle_questions = Column(Boolean, nullable=False, default=False)
    max_attempts = Column(Integer, nullable=False, default=1)
    results_visible = Column(Boolean, nullable=False, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="quizzes")
    creator = relationship("User", back_populates="created_quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.order")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="quiz", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    type = Column(Enum(QuestionType), nullable=False, default=QuestionType.MCQ)
    marks = Column(Integer, nullable=False, default=1)
    order = Column(Integer, nullable=False, default=0)
    explanation = Column(Text, nullable=True)
    image_url = Column(String(1024), nullable=True, comment="URL of question image attachment")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("Option", back_populates="question", cascade="all, delete-orphan", order_by="Option.order")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Option(Base):
    __tablename__ = "options"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(String(1024), nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    order = Column(Integer, nullable=False, default=0)

    # Relationships
    question = relationship("Question", back_populates="options")
    answers = relationship("Answer", back_populates="selected_option", cascade="all, delete-orphan")
