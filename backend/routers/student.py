from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from config.security import require_role
from config.limiter import limiter
from models.user import UserRole, User
from models.quiz import QuizStatus
from schemas.quiz import QuizResponse, QuizStudentResponse
from schemas.result import (
    AnswerSubmit, EncryptedPayload, AnswerStateResponse,
    QuizAttemptResponse, QuizAttemptDetailResponse, LeaderboardEntry
)
from controllers import quiz as quiz_controller
from controllers import result as result_controller
from utils.exceptions import PracticeException
from utils.crypto import decrypt_payload, decrypted_body


router = APIRouter(
    prefix="/student",
    tags=["Student Features"],
    dependencies=[Depends(require_role([UserRole.STUDENT]))]
)

@router.get("/quiz", response_model=List[QuizResponse])
@limiter.limit("60/minute")
async def list_published_quizzes(
    request: Request,
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: AsyncSession = Depends(get_db)
):
    return await quiz_controller.get_all_quizzes(db, status=QuizStatus.PUBLISHED, limit=limit, offset=offset)

@router.get("/quiz/{id}", response_model=QuizStudentResponse)
@limiter.limit("30/minute")
async def get_quiz_student_view(id: int, request: Request, db: AsyncSession = Depends(get_db)):
    """Retrieve quiz questions and options without correct answer markers."""
    try:
        quiz = await quiz_controller.get_quiz_by_id(db, id)
        if quiz.status != QuizStatus.PUBLISHED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
        return quiz
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.post("/quiz/{id}/start", response_model=QuizAttemptResponse)
@limiter.limit("10/minute")
async def start_quiz_attempt(
    id: int,
    request: Request,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.start_attempt(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/attempt/{id}/answer", response_model=AnswerStateResponse)
@limiter.limit("60/minute")
async def submit_question_answer(
    id: int,
    request: Request,
    answer_in: AnswerSubmit = Depends(decrypted_body(AnswerSubmit)),
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.submit_answer(db, id, current_user.id, answer_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/attempt/{id}/submit", response_model=QuizAttemptResponse)
@limiter.limit("5/minute")
async def finalize_attempt(
    id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.grade_and_finalize_attempt(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/attempt/{id}/result", response_model=QuizAttemptDetailResponse)
@limiter.limit("30/minute")
async def view_attempt_result(
    id: int,
    request: Request,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.get_attempt_result(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/attempts", response_model=List[QuizAttemptResponse])
@limiter.limit("30/minute")
async def list_own_attempts(
    request: Request,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    limit: int = Query(50, ge=1, le=200, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: AsyncSession = Depends(get_db)
):
    return await result_controller.get_student_attempts(db, current_user.id, limit=limit, offset=offset)

@router.get("/quiz/{id}/leaderboard", response_model=List[LeaderboardEntry])
@limiter.limit("30/minute")
async def get_quiz_leaderboard(
    id: int,
    request: Request,
    current_user: User = Depends(require_role([UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.get_quiz_leaderboard(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
