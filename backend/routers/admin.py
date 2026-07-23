from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Response
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import DbSession
from config.security import require_role
from models.user import UserRole, User
from schemas.user import UserResponse, UserEnrichedResponse, UserAdminUpdate
from schemas.quiz import (
    CategoryCreate, CategoryResponse, QuizCreate, QuizUpdate, QuizResponse,
    QuizFullResponse, QuestionCreate, QuestionResponse, OptionCreate, OptionResponse,
    PaginatedQuizResponse
)
from schemas.result import EnrollmentCreate, EnrollmentResponse, QuizAttemptResponse, LeaderboardEntry, AdminQuizAttemptResponse
from controllers import quiz as quiz_controller
from controllers import result as result_controller
from controllers import users as user_controller
from utils.exceptions import PracticeException
from utils.cloudinary import upload_image_bytes
from typing import List
import logging

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    dependencies=[Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR]))]
)

@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(..., description="Image file to upload to Cloudinary")
):
    """
    Upload an image file asynchronously to Cloudinary.
    Returns the secure URL. Maximum file size is 5 MB.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image."
        )

    file_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum allowed size is 5 MB."
        )
    try:
        secure_url = await upload_image_bytes(file_bytes)
        return {"secure_url": secure_url}
    except Exception:
        logger.exception("Cloudinary upload failed for file: %s", file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image. Please try again later."
        )

# ── Category Endpoints ───────────────────────────────────────────────────────
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate, db: DbSession):
    return await quiz_controller.create_category(db, category_in)

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: DbSession, response: Response):
    data, is_cached = await quiz_controller.get_categories(db)
    response.headers["X-Cache"] = "HIT" if is_cached else "MISS"
    response.headers["Cache-Control"] = "public, max-age=600"
    response.headers["Vary"] = "Accept-Encoding, Cookie"
    return data

@router.delete("/categories/{id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def delete_category(id: int, db: DbSession):
    try:
        await quiz_controller.delete_category(db, id)
        return {"detail": "Category successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Quiz Management ──────────────────────────────────────────────────────────
@router.post("/quiz", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_in: QuizCreate,
    db: DbSession,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    try:
        return await quiz_controller.create_quiz(db, quiz_in, current_user.id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/quiz", response_model=PaginatedQuizResponse)
async def list_quizzes(
    db: DbSession,
    response: Response,
    category_id: int | None = Query(None),
    status: quiz_controller.QuizStatus | None = Query(None),
    search: str | None = Query(None, description="Search by title or description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(9, ge=1, le=100, description="Items per page")
):
    data, is_cached = await quiz_controller.get_all_quizzes(
        db, category_id=category_id, status=status, search=search, page=page, limit=limit
    )
    response.headers["X-Cache"] = "HIT" if is_cached else "MISS"
    response.headers["Cache-Control"] = "private, max-age=60"
    response.headers["Vary"] = "Accept-Encoding, Cookie"
    return data

@router.get("/quiz/{id}", response_model=QuizFullResponse)
async def get_quiz_details(id: int, db: DbSession):
    try:
        return await quiz_controller.get_quiz_by_id(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.put("/quiz/{id}", response_model=QuizResponse)
async def update_quiz(id: int, quiz_in: QuizUpdate, db: DbSession):
    try:
        return await quiz_controller.update_quiz(db, id, quiz_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/quiz/{id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def delete_quiz(id: int, db: DbSession):
    try:
        await quiz_controller.delete_quiz(db, id)
        return {"detail": "Quiz successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/publish", response_model=QuizResponse)
async def publish_quiz(id: int, db: DbSession):
    try:
        return await quiz_controller.publish_quiz(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/close", response_model=QuizResponse)
async def close_quiz(id: int, db: DbSession):
    try:
        return await quiz_controller.close_quiz(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/reopen", response_model=QuizResponse)
async def reopen_quiz(id: int, db: DbSession):
    try:
        return await quiz_controller.reopen_quiz(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/release-results", response_model=QuizResponse)
async def release_results(id: int, db: DbSession):
    try:
        return await quiz_controller.release_results(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Question Endpoints ───────────────────────────────────────────────────────
@router.post("/quiz/{id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(id: int, question_in: QuestionCreate, db: DbSession):
    try:
        return await quiz_controller.create_question(db, id, question_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/questions/bulk", response_model=List[QuestionResponse], status_code=status.HTTP_201_CREATED)
async def add_questions_bulk(id: int, questions_in: List[QuestionCreate], db: DbSession):
    try:
        return await quiz_controller.create_questions_bulk(db, id, questions_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.put("/questions/{id}", response_model=QuestionResponse)
async def update_question(id: int, question_in: QuestionCreate, db: DbSession):
    try:
        return await quiz_controller.update_question(db, id, question_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/questions/{id}", status_code=status.HTTP_200_OK)
async def delete_question(id: int, db: DbSession):
    try:
        await quiz_controller.delete_question(db, id)
        return {"detail": "Question successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Option Endpoints ─────────────────────────────────────────────────────────
@router.post("/questions/{id}/options", response_model=OptionResponse, status_code=status.HTTP_201_CREATED)
async def add_option(id: int, option_in: OptionCreate, db: DbSession):
    try:
        return await quiz_controller.create_option(db, id, option_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.put("/options/{id}", response_model=OptionResponse)
async def update_option(id: int, option_in: OptionCreate, db: DbSession):
    try:
        return await quiz_controller.update_option(db, id, option_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/options/{id}", status_code=status.HTTP_200_OK)
async def delete_option(id: int, db: DbSession):
    try:
        await quiz_controller.delete_option(db, id)
        return {"detail": "Option successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Enrollment Endpoints ─────────────────────────────────────────────────────
@router.post("/quiz/{id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_student(id: int, enroll_in: EnrollmentCreate, db: DbSession):
    try:
        return await result_controller.enroll_student(db, id, enroll_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/quiz/{id}/enrollments", response_model=List[EnrollmentResponse])
async def get_enrollments(id: int, db: DbSession):
    return await result_controller.get_enrollments(db, id)

@router.get("/quiz/{id}/attempts", response_model=List[AdminQuizAttemptResponse])
async def get_quiz_attempts(
    id: int,
    db: DbSession,
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    return await result_controller.get_quiz_attempts(db, id, limit=limit, offset=offset)

@router.delete("/attempts/{id}", status_code=status.HTTP_200_OK, dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def delete_quiz_attempt(id: int, db: DbSession):
    try:
        await result_controller.delete_attempt(db, id)
        return {"detail": "Attempt successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/quiz/{id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_quiz_leaderboard(
    id: int,
    db: DbSession,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.INSTRUCTOR]))
):
    try:
        return await result_controller.get_quiz_leaderboard(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── User Management ──────────────────────────────────────────────────────────
@router.get("/users", response_model=List[UserEnrichedResponse])
async def list_users(
    db: DbSession,
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    enriched = await user_controller.get_all_users(db, limit=limit, offset=offset)
    result = []
    for item in enriched:
        u = item["user"]
        data = UserEnrichedResponse.model_validate(u)
        data.last_login_at = item["last_login_at"]
        result.append(data)
    return result

@router.put("/users/{id}/role", response_model=UserResponse)
async def promote_user(
    id: int,
    db: DbSession,
    role: UserRole = Query(...),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    try:
        return await user_controller.update_user_role(db, id, role)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.patch("/users/{id}/block", response_model=UserResponse)
async def toggle_user_block(
    id: int,
    db: DbSession,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    try:
        return await user_controller.toggle_user_block(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.patch("/users/{id}", response_model=UserResponse)
async def update_user(
    id: int,
    data: UserAdminUpdate,
    db: DbSession,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    try:
        return await user_controller.update_user(db, id, data)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/users/{id}", status_code=status.HTTP_200_OK)
async def delete_user(
    id: int,
    db: DbSession,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    try:
        await user_controller.delete_user(db, id)
        return {"detail": "User successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
