from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from config.settings import settings
from config.limiter import limiter
from config.security import verify_password, get_current_user, get_token_from_request
from schemas.user import UserCreate, UserResponse, UserLogin, UserLoginResponse
from controllers import users as user_controller
from utils.exceptions import SessionNotFoundError, SessionExpiredError, DuplicateEmailError
from models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
@limiter.limit("10/minute")
async def register_student(
    request: Request,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        new_user = await user_controller.create_user(db, user_in)
        return new_user
    except DuplicateEmailError as e:
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
    db: AsyncSession = Depends(get_db)
):
    user = await user_controller.get_user_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact support."
        )

    session = await user_controller.create_session(db, user)
    is_production = settings.ENVIRONMENT == "production"

    # Set access token in secure HTTP-only cookies
    response.set_cookie(
        key="access_token",
        value=session.token,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=settings.COOKIE_DOMAIN
    )

    # Set non-HttpOnly helper cookies readable by frontend
    response.set_cookie(
        key="role",
        value=user.role.value,
        httponly=False,
        secure=is_production,
        samesite="none" if is_production else "lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=settings.COOKIE_DOMAIN
    )
    response.set_cookie(
        key="has_session",
        value="true",
        httponly=False,
        secure=is_production,
        samesite="none" if is_production else "lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        domain=settings.COOKIE_DOMAIN
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
    token: str = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db)
):
    try:
        await user_controller.logout_user(db, token)
    except SessionNotFoundError as e:
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
    token: str = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db)
):
    try:
        new_session = await user_controller.validate_and_refresh_session(db, token)
        is_production = settings.ENVIRONMENT == "production"

        # Update cookies with refreshed token
        response.set_cookie(
            key="access_token",
            value=new_session.token,
            httponly=True,
            secure=is_production,
            samesite="none" if is_production else "lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            domain=settings.COOKIE_DOMAIN
        )
        return UserLoginResponse(
            access_token=new_session.token,
            token_type="bearer",
            user=new_session.user
        )
    except SessionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=e.message)
    except SessionExpiredError as e:
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
