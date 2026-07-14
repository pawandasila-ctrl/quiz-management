from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import DbSession
from config.settings import settings
from config.limiter import limiter
from config.security import verify_password, get_current_user, get_token_from_request
from schemas.user import UserCreate, UserResponse, UserLogin, UserLoginResponse
from controllers import users as user_controller
from utils.exceptions import SessionNotFoundError, SessionExpiredError, DuplicateEmailError
from models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/hour")
async def register_student(
    request: Request,
    user_in: UserCreate,
    db: DbSession
):
    try:
        new_user = await user_controller.create_user(db, user_in)
        logger.info(f"Successfully registered user with email: {user_in.email}")
        return new_user
    except DuplicateEmailError as e:
        logger.warning(f"Registration failed: Email {user_in.email} is already registered.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )

@router.post(
    "/login",
    response_model=UserLoginResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("10/minute")
async def login_user(
    request: Request,
    user_in: UserLogin,
    response: Response,
    db: DbSession
):
    user = await user_controller.get_user_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {user_in.email} (Incorrect email or password)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        logger.warning(f"Failed login attempt for email: {user_in.email} (Account is disabled)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support."
        )

    session = await user_controller.create_session(db, user)
    logger.info(f"Successful login for email: {user_in.email}, role: {user.role.value}")
    is_production = settings.ENVIRONMENT == "production"

    # Set access token in secure HTTP-only cookies
    # SameSite=lax is correct here because the Next.js proxy forwards all
    # /api/* calls from the same origin — SameSite=none is NOT needed and
    # would weaken CSRF protection unnecessarily.
    response.set_cookie(
        key="access_token",
        value=session.token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # Set non-HttpOnly helper cookies readable by frontend middleware
    response.set_cookie(
        key="role",
        value=user.role.value,
        httponly=False,
        secure=is_production,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="has_session",
        value="true",
        httponly=False,
        secure=is_production,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return UserLoginResponse(
        access_token=session.token,
        token_type="bearer",
        user=user
    )

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK
)
async def logout(
    response: Response,
    db: DbSession,
    token: str = Depends(get_token_from_request)
):
    try:
        await user_controller.logout_user(db, token)
        logger.info("User session logged out successfully")
    except SessionNotFoundError as e:
        logger.warning("Logout failed: Session token not found")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)

    # Clear all cookies on logout
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="role")
    response.delete_cookie(key="has_session")

    return {"detail": "Logout successful."}

@router.post(
    "/refresh-token",
    response_model=UserLoginResponse,
    status_code=status.HTTP_200_OK
)
async def refresh_token(
    response: Response,
    db: DbSession,
    token: str = Depends(get_token_from_request)
):
    try:
        new_session = await user_controller.validate_and_refresh_session(db, token)
        logger.info(f"Successfully refreshed token for user: {new_session.user.email}")
        is_production = settings.ENVIRONMENT == "production"

        # Update cookies with refreshed token
        response.set_cookie(
            key="access_token",
            value=new_session.token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            domain=settings.COOKIE_DOMAIN
        )
        return UserLoginResponse(
            access_token=new_session.token,
            token_type="bearer",
            user=new_session.user
        )
    except SessionNotFoundError as e:
        logger.warning("Token refresh failed: Session not found")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except SessionExpiredError as e:
        logger.warning("Token refresh failed: Session expired")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user
