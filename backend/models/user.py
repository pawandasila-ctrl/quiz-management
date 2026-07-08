from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Enum, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from config.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = 'admin'
    STUDENT = 'student'
    INSTRUCTOR = 'instructor'

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True, comment="User unique identifier")
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment="User full name")
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True, comment="User email address")
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Hashed password (null for OAuth)")
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.STUDENT, comment="System role (admin/student)")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, comment="True if account is active")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, comment="True if email is verified")
    image: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True, comment="URL of profile image")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), comment="Creation timestamp")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(), comment="Last updated timestamp")

    # Bidirectional relationships
    sessions: Mapped[List["Session"]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    attempts: Mapped[List["QuizAttempt"]] = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    created_quizzes: Mapped[List["Quiz"]] = relationship("Quiz", back_populates="creator")

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True, comment="Session identifier")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, comment="User ID owner")
    token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False, comment="Session token")
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, comment="Session expiration date")
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True, comment="Client IP address")
    user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True, comment="Client user agent")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), comment="Creation date")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), comment="Last update date")

    # Eager load the user relation on session retrievals
    user: Mapped["User"] = relationship("User", back_populates="sessions", lazy="selectin")
