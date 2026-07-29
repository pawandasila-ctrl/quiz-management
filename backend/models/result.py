from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Column, DateTime, Enum, Integer, ForeignKey, UniqueConstraint, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from config.database import Base
import enum

if TYPE_CHECKING:
    from models.quiz import Quiz, Question, Option
    from models.user import User

class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = 'in_progress'
    SUBMITTED = 'submitted'
    GRADED = 'graded'

class AnswerStatus(str, enum.Enum):
    NOT_VISITED = 'not_visited'
    NOT_ANSWERED = 'not_answered'
    ANSWERED = 'answered'
    MARKED_FOR_REVIEW = 'marked_for_review'
    ANSWERED_MARKED_FOR_REVIEW = 'answered_marked_for_review'

class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="enrollments")
    student: Mapped["User"] = relationship("User", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint('quiz_id', 'student_id', name='uq_quiz_student_enrollment'),
    )

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[AttemptStatus] = mapped_column(Enum(AttemptStatus), nullable=False, default=AttemptStatus.IN_PROGRESS)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_marks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_attempt_student_quiz", "student_id", "quiz_id"),
        Index("idx_attempt_status_submitted", "status", "submitted_at"),
    )

    # Relationships
    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    student: Mapped["User"] = relationship("User", back_populates="attempts")
    answers: Mapped[List["Answer"]] = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    attempt_id: Mapped[int] = mapped_column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("options.id", ondelete="CASCADE"), nullable=True, index=True)
    status: Mapped[AnswerStatus] = mapped_column(Enum(AnswerStatus, name="answerstatus"), nullable=False, default=AnswerStatus.NOT_VISITED)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    marks_awarded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    attempt: Mapped["QuizAttempt"] = relationship("QuizAttempt", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    selected_option: Mapped[Optional["Option"]] = relationship("Option", back_populates="answers")
