from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload, joinedload
from models.quiz import Quiz, Question, Option, QuizStatus
from models.user import User, UserRole
from models.result import Enrollment, QuizAttempt, Answer, AttemptStatus
from schemas.result import EnrollmentCreate, AnswerSubmit, LeaderboardEntry
from utils.exceptions import (
    QuizNotFoundError, QuizStatusError, UserNotFoundError,
    EnrollmentRequiredError, MaxAttemptsReachedError, AttemptNotFoundError,
    QuestionNotFoundError, OptionNotFoundError, AttemptTimeExpiredError
)
from datetime import datetime, timezone, timedelta


async def enroll_student(db: AsyncSession, quiz_id: int, enroll_in: EnrollmentCreate) -> Enrollment:
    
    query_quiz = select(Quiz).filter(Quiz.id == quiz_id)
    quiz_res = await db.execute(query_quiz)
    quiz = quiz_res.scalars().first()
    if not quiz:
        raise QuizNotFoundError()

    
    query_student = select(User).filter(User.email == enroll_in.student_email, User.role == UserRole.STUDENT)
    student_res = await db.execute(query_student)
    student = student_res.scalars().first()
    if not student:
        raise UserNotFoundError("Student with this email address does not exist.")

    
    query_existing = select(Enrollment).filter(
        Enrollment.quiz_id == quiz_id,
        Enrollment.student_id == student.id
    )
    existing_res = await db.execute(query_existing)
    existing = existing_res.scalars().first()
    if existing:
        return existing

    new_enrollment = Enrollment(
        quiz_id=quiz_id,
        student_id=student.id
    )
    db.add(new_enrollment)
    await db.commit()
    await db.refresh(new_enrollment)
    return new_enrollment

async def get_enrollments(db: AsyncSession, quiz_id: int) -> list[Enrollment]:
    query = select(Enrollment).options(selectinload(Enrollment.student)).filter(Enrollment.quiz_id == quiz_id)
    result = await db.execute(query)
    return result.scalars().all()


async def start_attempt(db: AsyncSession, quiz_id: int, student: User) -> QuizAttempt:
    query_quiz = select(Quiz).filter(Quiz.id == quiz_id)
    quiz_res = await db.execute(query_quiz)
    quiz = quiz_res.scalars().first()
    if not quiz or quiz.status != QuizStatus.PUBLISHED:
        raise QuizNotFoundError("Quiz not found or not currently available.")
    
    enroll_query = select(Enrollment).filter(Enrollment.quiz_id == quiz_id)
    enroll_res = await db.execute(enroll_query)
    has_enrollments = enroll_res.scalars().first() is not None
    
    if has_enrollments:
        student_enroll_query = select(Enrollment).filter(
            Enrollment.quiz_id == quiz_id,
            Enrollment.student_id == student.id
        )
        student_enroll_res = await db.execute(student_enroll_query)
        if not student_enroll_res.scalars().first():
            raise EnrollmentRequiredError()

    
    query_attempts = select(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.student_id == student.id
    )
    attempts_res = await db.execute(query_attempts)
    past_attempts = attempts_res.scalars().all()

    for attempt in past_attempts:
        if attempt.status == AttemptStatus.IN_PROGRESS:
            started_at = attempt.started_at.replace(tzinfo=timezone.utc) if attempt.started_at.tzinfo is None else attempt.started_at
            if quiz.time_limit_minutes and datetime.now(timezone.utc) > started_at + timedelta(minutes=quiz.time_limit_minutes):
                await grade_and_finalize_attempt(db, attempt.id)
                attempt.status = AttemptStatus.SUBMITTED
            else:
                return attempt 

    attempts_count = len(past_attempts)
    if quiz.max_attempts is not None and attempts_count >= quiz.max_attempts:
        raise MaxAttemptsReachedError()

    new_attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student.id,
        attempt_number=attempts_count + 1,
        status=AttemptStatus.IN_PROGRESS,
        total_marks=quiz.total_marks
    )
    db.add(new_attempt)
    await db.commit()
    await db.refresh(new_attempt)
    return new_attempt

async def submit_answer(db: AsyncSession, attempt_id: int, student_id: int, answer_in: AnswerSubmit) -> Answer:
    
    query_attempt = select(QuizAttempt).options(
        joinedload(QuizAttempt.quiz)
    ).filter(QuizAttempt.id == attempt_id, QuizAttempt.student_id == student_id)
    attempt_res = await db.execute(query_attempt)
    attempt = attempt_res.scalars().first()
    if not attempt:
        raise AttemptNotFoundError()

    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise QuizStatusError("Attempt is already submitted and graded.")

    quiz = attempt.quiz

    
    started_at = attempt.started_at.replace(tzinfo=timezone.utc) if attempt.started_at.tzinfo is None else attempt.started_at
    if quiz.time_limit_minutes and datetime.now(timezone.utc) > started_at + timedelta(minutes=quiz.time_limit_minutes):
        await grade_and_finalize_attempt(db, attempt_id)
        raise AttemptTimeExpiredError()

    
    query_val = select(Question, Option, Answer).outerjoin(
        Option, and_(Option.id == answer_in.selected_option_id, Option.question_id == Question.id)
    ).outerjoin(
        Answer, and_(Answer.attempt_id == attempt_id, Answer.question_id == Question.id)
    ).filter(
        Question.id == answer_in.question_id,
        Question.quiz_id == attempt.quiz_id
    )
    val_res = await db.execute(query_val)
    row = val_res.first()

    if not row:
        raise QuestionNotFoundError()

    question, option, existing_ans = row

    if not option:
        raise OptionNotFoundError()

    
    if existing_ans:
        existing_ans.selected_option_id = answer_in.selected_option_id
        db.add(existing_ans)
        await db.commit()
        await db.refresh(existing_ans)
        return existing_ans

    new_ans = Answer(
        attempt_id=attempt_id,
        question_id=answer_in.question_id,
        selected_option_id=answer_in.selected_option_id
    )
    db.add(new_ans)
    await db.commit()
    await db.refresh(new_ans)
    return new_ans

async def grade_and_finalize_attempt(db: AsyncSession, attempt_id: int) -> QuizAttempt:
    """Core logic to close an attempt, grade it, and calculate pass/fail status."""
    query_attempt = select(QuizAttempt).options(
        selectinload(QuizAttempt.answers),
        selectinload(QuizAttempt.quiz)
    ).filter(QuizAttempt.id == attempt_id)
    
    result = await db.execute(query_attempt)
    attempt = result.scalars().first()
    if not attempt:
        raise AttemptNotFoundError()

    if attempt.status != AttemptStatus.IN_PROGRESS:
        return attempt

    quiz = attempt.quiz
    now = datetime.now(timezone.utc)

    
    query_q = select(Question).options(selectinload(Question.options)).filter(Question.quiz_id == quiz.id)
    q_res = await db.execute(query_q)
    questions = q_res.scalars().all()

    
    correct_map = {}
    for q in questions:
        correct_opt = next((opt for opt in q.options if opt.is_correct), None)
        correct_map[q.id] = {
            "correct_option_id": correct_opt.id if correct_opt else None,
            "marks": q.marks
        }

    
    total_score = 0
    for ans in attempt.answers:
        q_info = correct_map.get(ans.question_id)
        if q_info and ans.selected_option_id == q_info["correct_option_id"]:
            ans.is_correct = True
            ans.marks_awarded = q_info["marks"]
            total_score += q_info["marks"]
        else:
            ans.is_correct = False
            ans.marks_awarded = 0
        db.add(ans)

    
    started_at = attempt.started_at.replace(tzinfo=timezone.utc) if attempt.started_at.tzinfo is None else attempt.started_at
    time_taken = int((now - started_at).total_seconds())

    attempt.status = AttemptStatus.GRADED
    attempt.score = total_score
    if quiz.total_marks > 0:
        student_percentage = (total_score / quiz.total_marks) * 100
        attempt.passed = student_percentage >= quiz.pass_mark
    else:
        attempt.passed = True
    attempt.submitted_at = now
    attempt.graded_at = now
    attempt.time_taken_seconds = max(0, time_taken)

    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt

async def get_attempt_result(db: AsyncSession, attempt_id: int, user: User) -> QuizAttempt:
    query = select(QuizAttempt).options(
        selectinload(QuizAttempt.student),
        selectinload(QuizAttempt.quiz),
        selectinload(QuizAttempt.answers).selectinload(Answer.question).selectinload(Question.options),
        selectinload(QuizAttempt.answers).selectinload(Answer.selected_option)
    ).filter(QuizAttempt.id == attempt_id)

    res = await db.execute(query)
    attempt = res.scalars().first()
    if not attempt:
        raise AttemptNotFoundError()

    
    if user.role != UserRole.ADMIN and attempt.student_id != user.id:
        raise AttemptNotFoundError()

    
    if user.role == UserRole.STUDENT and not attempt.quiz.results_visible:
        raise QuizStatusError("Quiz results are not released by the admin yet.")

    return attempt

async def get_student_attempts(db: AsyncSession, student_id: int) -> list[QuizAttempt]:
    query = select(QuizAttempt).options(selectinload(QuizAttempt.quiz)).filter(QuizAttempt.student_id == student_id)
    result = await db.execute(query)
    return result.scalars().all()

async def get_quiz_attempts(db: AsyncSession, quiz_id: int) -> list[QuizAttempt]:
    query = select(QuizAttempt).options(
        selectinload(QuizAttempt.student),
        selectinload(QuizAttempt.quiz)
    ).filter(QuizAttempt.quiz_id == quiz_id)
    result = await db.execute(query)
    return result.scalars().all()


async def get_quiz_leaderboard(db: AsyncSession, quiz_id: int, user: User) -> list[LeaderboardEntry]:
    
    query_quiz = select(Quiz).filter(Quiz.id == quiz_id)
    quiz_res = await db.execute(query_quiz)
    quiz = quiz_res.scalars().first()
    if not quiz:
        raise QuizNotFoundError()

    if user.role == UserRole.STUDENT and not quiz.results_visible:
        raise QuizStatusError("Leaderboard is not released by the admin yet.")
    
    best_attempts_sub = (
        select(
            QuizAttempt.id,
            func.row_number().over(
                partition_by=QuizAttempt.student_id,
                order_by=(
                    QuizAttempt.score.desc(),
                    QuizAttempt.time_taken_seconds.asc(),
                    QuizAttempt.id.asc()
                )
            ).label("rn")
        )
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.status == AttemptStatus.GRADED
        )
        .subquery()
    )

    query_attempts = (
        select(QuizAttempt)
        .options(selectinload(QuizAttempt.student))
        .join(best_attempts_sub, QuizAttempt.id == best_attempts_sub.c.id)
        .filter(best_attempts_sub.c.rn == 1)
        .order_by(
            QuizAttempt.score.desc(),
            QuizAttempt.time_taken_seconds.asc()
        )
    )

    result = await db.execute(query_attempts)
    attempts = result.scalars().all()

    
    leaderboard = []
    for rank, att in enumerate(attempts, 1):
        leaderboard.append(
            LeaderboardEntry(
                rank=rank,
                student_name=att.student.name,
                student_image=att.student.image,
                score=att.score,
                total_marks=att.total_marks,
                time_taken_seconds=att.time_taken_seconds,
                submitted_at=att.submitted_at
            )
        )
    return leaderboard
