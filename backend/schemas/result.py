from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from models.result import AttemptStatus, AnswerStatus
from schemas.user import UserResponse
from schemas.quiz import OptionResponse, QuestionResponse, QuizResponse

# ── Enrollment Schemas ───────────────────────────────────────────────────────
class EnrollmentCreate(BaseModel):
    student_email: str = Field(..., description="Email address of the student to enroll")

class EnrollmentResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    enrolled_at: datetime
    student: UserResponse
    model_config = ConfigDict(from_attributes=True)

# ── Answer Submission Schemas ─────────────────────────────────────────────────
class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = Field(None, description="null clears the current selection")
    marked_for_review: bool = Field(False, description="Whether the student marked this question for review")

class AnswerStateResponse(BaseModel):
    """Live in-progress answer state — deliberately excludes grading fields so the answer key never leaks mid-attempt."""
    question_id: int
    selected_option_id: Optional[int] = None
    status: AnswerStatus
    model_config = ConfigDict(from_attributes=True)

class AnswerDetailResponse(BaseModel):
    """Detailed answer containing the question text, option text, and correct status for review."""
    id: int
    question_id: int
    selected_option_id: Optional[int] = None
    is_correct: bool
    marks_awarded: int
    question: QuestionResponse
    selected_option: Optional[OptionResponse] = None
    model_config = ConfigDict(from_attributes=True)

# ── QuizAttempt Schemas ───────────────────────────────────────────────────────
class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    attempt_number: int
    status: AttemptStatus
    score: Optional[int] = None
    total_marks: int
    passed: Optional[bool] = None
    time_taken_seconds: Optional[int] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    quiz: Optional["QuizResponse"] = None
    answers: List[AnswerStateResponse] = []
    model_config = ConfigDict(from_attributes=True)

class QuizAttemptDetailResponse(QuizAttemptResponse):
    """Includes student profile and lists of submitted answers."""
    student: UserResponse
    answers: List[AnswerDetailResponse] = []
    model_config = ConfigDict(from_attributes=True)

class AdminQuizAttemptResponse(QuizAttemptResponse):
    """Includes student profile details for admin attempts list."""
    student: UserResponse
    model_config = ConfigDict(from_attributes=True)

# ── Leaderboard Entry ─────────────────────────────────────────────────────────
class LeaderboardEntry(BaseModel):
    rank: int
    student_name: str
    student_image: Optional[str] = None
    score: int
    total_marks: int
    time_taken_seconds: Optional[int] = None
    submitted_at: datetime
    model_config = ConfigDict(from_attributes=True)
