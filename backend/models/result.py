from sqlalchemy import Column, DateTime, Enum, Integer, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
import enum

class AttemptStatus(str, enum.Enum):
    IN_PROGRESS = 'in_progress'
    SUBMITTED = 'submitted'
    GRADED = 'graded'

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    quiz = relationship("Quiz", back_populates="enrollments")
    student = relationship("User", back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint('quiz_id', 'student_id', name='uq_quiz_student_enrollment'),
    )

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    status = Column(Enum(AttemptStatus), nullable=False, default=AttemptStatus.IN_PROGRESS)
    score = Column(Integer, nullable=True)
    total_marks = Column(Integer, nullable=False, default=0)
    passed = Column(Boolean, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User", back_populates="attempts")
    answers = relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option_id = Column(Integer, ForeignKey("options.id", ondelete="CASCADE"), nullable=False, index=True)
    is_correct = Column(Boolean, nullable=False, default=False)
    marks_awarded = Column(Integer, nullable=False, default=0)
    answered_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    selected_option = relationship("Option", back_populates="answers")
