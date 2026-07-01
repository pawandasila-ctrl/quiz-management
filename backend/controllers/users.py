from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from models.user import User, Session, UserRole
from schemas.user import UserCreate
from config.security import hash_password
from config.settings import settings
from utils.exceptions import SessionNotFoundError, SessionExpiredError, DuplicateEmailError, UserNotFoundError
from datetime import datetime, timedelta, timezone
import secrets

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    Query a user by their email address.
    """
    query = select(User).filter(User.email == email)
    result = await db.execute(query)
    return result.scalars().first()

async def get_all_users(db: AsyncSession) -> list[User]:
    """
    Retrieve all users.
    """
    query = select(User)
    result = await db.execute(query)
    return result.scalars().all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """
    Create a new user. Always defaults to STUDENT role.
    Hashed password using Argon2id.
    """
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise DuplicateEmailError("A user with this email address already exists.")

    hashed_pwd = hash_password(user_in.password)
    
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=UserRole.STUDENT,    # Always default to STUDENT
        is_active=True,
        image=user_in.image
    )

    db.add(new_user)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    
    await db.refresh(new_user)
    return new_user

async def create_session(db: AsyncSession, user: User) -> Session:
    """
    Create a secure random session token.
    Life is configured via settings.ACCESS_TOKEN_EXPIRE_MINUTES.
    """
    token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    session = Session(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session_by_token(db: AsyncSession, token: str) -> Session | None:
    query = select(Session).options(joinedload(Session.user)).filter(Session.token == token)
    result = await db.execute(query)
    return result.scalars().first()

async def validate_and_refresh_session(db: AsyncSession, token: str) -> Session:
    """
    Validates a session token, extending its life if valid.
    """
    session = await get_session_by_token(db, token)
    if not session:
        raise SessionNotFoundError("Session not found. Please login again.")

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise SessionExpiredError("Your session has expired. Please login again.")

    # Refresh session
    session.token = secrets.token_urlsafe(64)
    session.expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def logout_user(db: AsyncSession, token: str) -> None:
    session = await get_session_by_token(db, token)
    if not session:
        raise SessionNotFoundError("Session not found.")

    await db.delete(session)
    await db.commit()
    return

async def update_user_role(db: AsyncSession, user_id: int, role: UserRole) -> User:
    """
    Allows admins to change any user's role (e.g. promoting a STUDENT to ADMIN).
    """
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise UserNotFoundError("User not found.")

    user.role = role
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
