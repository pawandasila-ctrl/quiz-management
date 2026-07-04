from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime
from models.quiz import QuizStatus, QuestionType

# ── Category Schemas ─────────────────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, json_schema_extra={"example": "General Coding"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Quizzes covering general software concepts"})

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ── Option Schemas ───────────────────────────────────────────────────────────
class OptionBase(BaseModel):
    text: str = Field(..., min_length=1, max_length=1024, json_schema_extra={"example": "Option text"})
    order: int = Field(0, description="Display order of option")

class OptionCreate(OptionBase):
    is_correct: bool = Field(False, description="True if this option is correct")

class OptionResponse(OptionBase):
    id: int
    question_id: int
    is_correct: bool
    model_config = ConfigDict(from_attributes=True)

class OptionStudentResponse(BaseModel):
    """Schema shown to students — completely conceals whether the option is correct."""
    id: int
    text: str
    order: int
    model_config = ConfigDict(from_attributes=True)

# ── Question Schemas ─────────────────────────────────────────────────────────
class QuestionBase(BaseModel):
    text: str = Field(..., min_length=1, description="Question content text")
    type: QuestionType = Field(QuestionType.MCQ, description="MCQ or True/False")
    marks: int = Field(1, ge=0, description="Marks allocated to this question")
    order: int = Field(0, description="Display order of question")
    explanation: Optional[str] = Field(None, description="Explanation of the correct answer")
    image_url: Optional[str] = Field(None, description="URL of question image attachment")

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.startswith(("http://", "https://")):
            raise ValueError("image_url must be a valid http or https URL")
        return v

class QuestionCreate(QuestionBase):
    options: Optional[List[OptionCreate]] = Field(None, description="Optional nested options list to create along with the question")

class QuestionResponse(QuestionBase):
    id: int
    quiz_id: int
    created_at: datetime
    updated_at: datetime
    options: List[OptionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class QuestionStudentResponse(BaseModel):
    """Schema shown to students — conceals explanation and option correctness."""
    id: int
    text: str
    type: QuestionType
    marks: int
    order: int
    image_url: Optional[str] = None
    options: List[OptionStudentResponse] = []
    model_config = ConfigDict(from_attributes=True)

# ── Quiz Schemas ─────────────────────────────────────────────────────────────
class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, json_schema_extra={"example": "Python Basics"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Basic quiz testing Python core features"})
    category_id: Optional[int] = Field(None, description="Linked Category ID")
    time_limit_minutes: Optional[int] = Field(None, ge=1, description="Time limit in minutes (null = infinite)")
    pass_mark: int = Field(0, ge=0, description="Minimum score to pass")
    shuffle_questions: bool = Field(False, description="Shuffle question order per attempt")
    max_attempts: int = Field(1, ge=1, description="Max attempts per student")

class QuizCreate(QuizBase):
    pass

class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    time_limit_minutes: Optional[int] = Field(None, ge=1)
    pass_mark: Optional[int] = Field(None, ge=0)
    shuffle_questions: Optional[bool] = None
    max_attempts: Optional[int] = Field(None, ge=1)

class QuizResponse(QuizBase):
    id: int
    created_by_id: int
    status: QuizStatus
    total_marks: int
    results_visible: bool
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)

class QuizFullResponse(QuizResponse):
    """Full detail response containing all questions for admins."""
    questions: List[QuestionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class QuizStudentResponse(BaseModel):
    """Full detail response containing questions/options for students (no answers)."""
    id: int
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    pass_mark: int
    max_attempts: int
    total_marks: int
    category: Optional[CategoryResponse] = None
    questions: List[QuestionStudentResponse] = []
    model_config = ConfigDict(from_attributes=True)
