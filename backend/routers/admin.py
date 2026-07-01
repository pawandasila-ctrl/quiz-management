from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from config.security import require_role
from models.user import UserRole, User
from schemas.user import UserResponse
from schemas.quiz import (
    CategoryCreate, CategoryResponse, QuizCreate, QuizUpdate, QuizResponse,
    QuizFullResponse, QuestionCreate, QuestionResponse, OptionCreate, OptionResponse
)
from schemas.result import EnrollmentCreate, EnrollmentResponse, QuizAttemptResponse, LeaderboardEntry
from controllers import quiz as quiz_controller
from controllers import result as result_controller
from controllers import users as user_controller
from utils.exceptions import PracticeException
from utils.cloudinary import upload_image_bytes
from typing import List

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    dependencies=[Depends(require_role([UserRole.ADMIN]))]
)

@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_file(
    file: UploadFile = File(..., description="Image file to upload to Cloudinary")
):
    """
    Upload an image file asynchronously to Cloudinary.
    Returns the secure URL.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image."
        )
    try:
        file_bytes = await file.read()
        secure_url = await upload_image_bytes(file_bytes)
        return {"secure_url": secure_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image to Cloudinary: {str(e)}"
        )

# ── Category Endpoints ───────────────────────────────────────────────────────
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)):
    return await quiz_controller.create_category(db, category_in)

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    return await quiz_controller.get_categories(db)

# ── Quiz Management ──────────────────────────────────────────────────────────
@router.post("/quiz", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_in: QuizCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await quiz_controller.create_quiz(db, quiz_in, current_user.id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/quiz", response_model=List[QuizResponse])
async def list_quizzes(
    category_id: int | None = Query(None),
    status: quiz_controller.QuizStatus | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await quiz_controller.get_all_quizzes(db, category_id=category_id, status=status)

@router.get("/quiz/{id}", response_model=QuizFullResponse)
async def get_quiz_details(id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.get_quiz_by_id(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.put("/quiz/{id}", response_model=QuizResponse)
async def update_quiz(id: int, quiz_in: QuizUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.update_quiz(db, id, quiz_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/quiz/{id}", status_code=status.HTTP_200_OK)
async def delete_quiz(id: int, db: AsyncSession = Depends(get_db)):
    try:
        await quiz_controller.delete_quiz(db, id)
        return {"detail": "Quiz successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/publish", response_model=QuizResponse)
async def publish_quiz(id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.publish_quiz(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/close", response_model=QuizResponse)
async def close_quiz(id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.close_quiz(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/quiz/{id}/release-results", response_model=QuizResponse)
async def release_results(id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.release_results(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Question Endpoints ───────────────────────────────────────────────────────
@router.post("/quiz/{id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(id: int, question_in: QuestionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.create_question(db, id, question_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.put("/questions/{id}", response_model=QuestionResponse)
async def update_question(id: int, question_in: QuestionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.update_question(db, id, question_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/questions/{id}", status_code=status.HTTP_200_OK)
async def delete_question(id: int, db: AsyncSession = Depends(get_db)):
    try:
        await quiz_controller.delete_question(db, id)
        return {"detail": "Question successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Option Endpoints ─────────────────────────────────────────────────────────
@router.post("/questions/{id}/options", response_model=OptionResponse, status_code=status.HTTP_201_CREATED)
async def add_option(id: int, option_in: OptionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.create_option(db, id, option_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.put("/options/{id}", response_model=OptionResponse)
async def update_option(id: int, option_in: OptionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await quiz_controller.update_option(db, id, option_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/options/{id}", status_code=status.HTTP_200_OK)
async def delete_option(id: int, db: AsyncSession = Depends(get_db)):
    try:
        await quiz_controller.delete_option(db, id)
        return {"detail": "Option successfully deleted."}
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── Enrollment Endpoints ─────────────────────────────────────────────────────
@router.post("/quiz/{id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_student(id: int, enroll_in: EnrollmentCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await result_controller.enroll_student(db, id, enroll_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/quiz/{id}/enrollments", response_model=List[EnrollmentResponse])
async def get_enrollments(id: int, db: AsyncSession = Depends(get_db)):
    return await result_controller.get_enrollments(db, id)

@router.get("/quiz/{id}/attempts", response_model=List[QuizAttemptResponse])
async def get_quiz_attempts(id: int, db: AsyncSession = Depends(get_db)):
    return await result_controller.get_quiz_attempts(db, id)

@router.get("/quiz/{id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_quiz_leaderboard(
    id: int,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.get_quiz_leaderboard(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# ── User Management ──────────────────────────────────────────────────────────
@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    return await user_controller.get_all_users(db)

@router.put("/users/{id}/role", response_model=UserResponse)
async def promote_user(id: int, role: UserRole = Query(...), db: AsyncSession = Depends(get_db)):
    try:
        return await user_controller.update_user_role(db, id, role)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
