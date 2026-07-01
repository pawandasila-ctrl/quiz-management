from typing import List
from models.user import UserRole, User, Session
from config.database import get_db
from fastapi import Depends, Header, Cookie, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from datetime import datetime, timezone


ph = PasswordHasher()

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2id.
    """
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored Argon2id hash.
    """
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

def get_token_from_request(
    authorization: str | None = Header(None, description="Bearer <token>"),
    access_token: str | None = Cookie(None, description="Session token cookie")
) -> str:
    """
    FastAPI dependency — extracts token from either HttpOnly cookies or the Bearer Authorization header.
    """
    
    if access_token:
        return access_token

    
    if authorization:
        parts = authorization.split(" ")
        if len(parts) == 2 and parts[0] == "Bearer":
            return parts[1]

    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authorization credentials."
    )

async def get_current_user(
    token: str = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    FastAPI dependency — validates the session token and returns the authenticated User.
    """
    
    query = select(Session).options(joinedload(Session.user)).filter(Session.token == token)
    result = await db.execute(query)
    session = result.scalars().first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or already invalidated.",
        )

    
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please login again.",
        )

    
    user = session.user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with session not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled.",
        )

    return user

def require_role(allowed_roles: List[UserRole]):
    """
    FastAPI dependency factory — checks if the current user has the required role.
    """
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        
        if current_user.role == UserRole.ADMIN:
            return current_user
        
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions."
            )
        return current_user
    
    return dependency
