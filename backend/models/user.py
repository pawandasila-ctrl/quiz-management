from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = 'admin'
    STUDENT = 'student'

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True, comment="User unique identifier")
    name = Column(String(255), nullable=False, comment="User full name")
    email = Column(String(255), nullable=False, unique=True, index=True, comment="User email address")
    hashed_password = Column(String(255), nullable=True, comment="Hashed password (null for OAuth)")
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT, comment="System role (admin/student)")
    is_active = Column(Boolean, nullable=False, default=True, comment="True if account is active")
    email_verified = Column(Boolean, nullable=False, default=False, comment="True if email is verified")
    image = Column(String(1024), nullable=True, comment="URL of profile image")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), comment="Creation timestamp")
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now(), comment="Last updated timestamp")

    # Bidirectional relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    created_quizzes = relationship("Quiz", back_populates="creator")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True, comment="Session identifier")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="User ID owner")
    token = Column(String, unique=True, index=True, nullable=False, comment="Session token")
    expires_at = Column(DateTime(timezone=True), nullable=False, comment="Session expiration date")
    ip_address = Column(String, nullable=True, comment="Client IP address")
    user_agent = Column(String, nullable=True, comment="Client user agent")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="Creation date")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), comment="Last update date")

    # Eager load the user relation on session retrievals
    user = relationship("User", back_populates="sessions", lazy="selectin")
