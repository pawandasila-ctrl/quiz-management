from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from config.security import require_role
from models.user import UserRole, User
from models.quiz import QuizStatus
from schemas.quiz import QuizResponse, QuizStudentResponse
from schemas.result import AnswerSubmit, AnswerResponse, QuizAttemptResponse, QuizAttemptDetailResponse, LeaderboardEntry
from controllers import quiz as quiz_controller
from controllers import result as result_controller
from utils.exceptions import PracticeException
from typing import List

router = APIRouter(
    prefix="/student",
    tags=["Student Features"],
    dependencies=[Depends(require_role([UserRole.STUDENT]))]
)

@router.get("/quiz", response_model=List[QuizResponse])
async def list_published_quizzes(db: AsyncSession = Depends(get_db)):
    # Students can only see PUBLISHED quizzes
    return await quiz_controller.get_all_quizzes(db, status=QuizStatus.PUBLISHED)

@router.get("/quiz/{id}", response_model=QuizStudentResponse)
async def get_quiz_student_view(id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve quiz questions and options without correct answer markers."""
    try:
        quiz = await quiz_controller.get_quiz_by_id(db, id)
        if quiz.status != QuizStatus.PUBLISHED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
        return quiz
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)

@router.post("/quiz/{id}/start", response_model=QuizAttemptResponse)
async def start_quiz_attempt(
    id: int,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.start_attempt(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/attempt/{id}/answer", response_model=AnswerResponse)
async def submit_question_answer(
    id: int,
    answer_in: AnswerSubmit,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.submit_answer(db, id, current_user.id, answer_in)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.post("/attempt/{id}/submit", response_model=QuizAttemptResponse)
async def finalize_attempt(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.grade_and_finalize_attempt(db, id)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/attempt/{id}/result", response_model=QuizAttemptDetailResponse)
async def view_attempt_result(
    id: int,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.get_attempt_result(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/attempts", response_model=List[QuizAttemptResponse])
async def list_own_attempts(
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    return await result_controller.get_student_attempts(db, current_user.id)

@router.get("/quiz/{id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_quiz_leaderboard(
    id: int,
    current_user: User = Depends(require_role([UserRole.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await result_controller.get_quiz_leaderboard(db, id, current_user)
    except PracticeException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
