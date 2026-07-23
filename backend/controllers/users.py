from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from models.user import User, Session, UserRole
from schemas.user import UserCreate, UserAdminUpdate, UserEnrichedResponse
from config.security import hash_password
from config.settings import settings
from utils.exceptions import SessionNotFoundError, SessionExpiredError, DuplicateEmailError, UserNotFoundError
from datetime import datetime, timedelta, timezone
import secrets
from sqlalchemy import func, or_
import math

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Query a user by their email address."""
    query = select(User).filter(User.email == email)
    result = await db.execute(query)
    return result.scalars().first()

async def get_all_users(
    db: AsyncSession,
    search: str | None = None,
    role: UserRole | None = None,
    is_active: bool | None = None,
    page: int = 1,
    limit: int = 10,
) -> dict:
    """Retrieve users with filtering and pagination, enriched with last_login_at from sessions."""

    query = select(User)
    filters = []

    if role is not None:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        filters.append(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern)
            )
        )

    if filters:
        query = query.filter(*filters)

    # Calculate total matching count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Pagination calculation
    offset = (page - 1) * limit
    paginated_query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(paginated_query)
    users = list(result.scalars().all())

    items = []
    for user in users:
        sess_query = (
            select(Session)
            .filter(Session.user_id == user.id)
            .order_by(Session.updated_at.desc())
            .limit(1)
        )
        sess_result = await db.execute(sess_query)
        latest_session = sess_result.scalars().first()
        last_login_at = latest_session.updated_at if latest_session else None

        user_dict = UserEnrichedResponse.model_validate(user)
        user_dict.last_login_at = last_login_at
        items.append(user_dict)

    pages = math.ceil(total / limit) if limit > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user. Always defaults to STUDENT role."""
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise DuplicateEmailError("A user with this email address already exists.")

    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pwd,
        role=UserRole.STUDENT,
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
    """Create a secure random session token."""
    token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    session = Session(user_id=user.id, token=token, expires_at=expires_at)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session_by_token(db: AsyncSession, token: str) -> Session | None:
    query = select(Session).options(joinedload(Session.user)).filter(Session.token == token)
    result = await db.execute(query)
    return result.scalars().first()

async def validate_and_refresh_session(db: AsyncSession, token: str) -> Session:
    """Validates a session token, extending its life if valid."""
    session = await get_session_by_token(db, token)
    if not session:
        raise SessionNotFoundError("Session not found. Please login again.")

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise SessionExpiredError("Your session has expired. Please login again.")

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

async def update_user_role(db: AsyncSession, user_id: int, role: UserRole) -> User:
    """Allows admins to change any user's role."""
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

async def toggle_user_block(db: AsyncSession, user_id: int) -> User:
    """Toggle is_active flag — treated as is_blocked in the admin UI."""
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise UserNotFoundError("User not found.")
    user.is_active = not user.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_user(db: AsyncSession, user_id: int, data: UserAdminUpdate) -> User:
    """Allows admins to update user name, email, role, is_active."""
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise UserNotFoundError("User not found.")
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        existing = await get_user_by_email(db, data.email)
        if existing and existing.id != user_id:
            raise DuplicateEmailError("A user with this email address already exists.")
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def delete_user(db: AsyncSession, user_id: int) -> None:
    """Permanently delete a user and all their sessions/attempts."""
    query = select(User).filter(User.id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise UserNotFoundError("User not found.")
    await db.delete(user)
    await db.commit()
