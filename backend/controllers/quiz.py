from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from sqlalchemy import select, update, func, text, or_
from sqlalchemy.orm import selectinload
from models.quiz import Category, Quiz, Question, Option, QuizStatus
from schemas.quiz import CategoryCreate, QuizCreate, QuizUpdate, QuestionCreate, OptionCreate, QuizResponse
from config.redis import get_cache, set_cache, invalidate_pattern
from utils.exceptions import (
    QuizNotFoundError, QuizStatusError, CategoryNotFoundError,
    QuestionNotFoundError, OptionNotFoundError
)
from controllers.result import re_grade_quiz_attempts

from datetime import datetime, timezone

# ── Recalculate helper ───────────────────────────────────────────────────────
async def recalculate_quiz_total_marks(db: AsyncSession, quiz_id: int) -> None:
    """Recalculate total marks — raw SQL to avoid asyncpg/ORM greenlet issues."""
    await db.execute(
        text(
            "UPDATE quizzes SET total_marks = "
            "(SELECT COALESCE(SUM(marks), 0) FROM questions WHERE quiz_id = :qid) "
            "WHERE id = :qid"
        ),
        {"qid": quiz_id},
    )
    await db.commit()

async def get_question_by_id(db: AsyncSession, question_id: int) -> Question:
    """Helper to query question with options eager loaded."""
    query = select(Question).options(selectinload(Question.options)).filter(Question.id == question_id)
    result = await db.execute(query)
    q = result.scalars().first()
    if not q:
        raise QuestionNotFoundError()
    return q

# ── Category Controller ──────────────────────────────────────────────────────
async def create_category(db: AsyncSession, category_in: CategoryCreate) -> Category:
    new_cat = Category(
        name=category_in.name,
        description=category_in.description
    )
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    await invalidate_pattern("categories:*")
    return new_cat

async def get_categories(db: AsyncSession) -> tuple[list, bool]:
    cache_key = "categories:all"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data, True

    query = select(Category)
    result = await db.execute(query)
    cats = list(result.scalars().all())

    from schemas.quiz import CategoryResponse
    cats_dump = [CategoryResponse.model_validate(c).model_dump(mode="json") for c in cats]

    await set_cache(cache_key, cats_dump, expire_seconds=600)
    return cats_dump, False

async def delete_category(db: AsyncSession, category_id: int) -> None:
    query = select(Category).filter(Category.id == category_id)
    res = await db.execute(query)
    cat = res.scalars().first()
    if not cat:
        raise CategoryNotFoundError()
    await db.delete(cat)
    await db.commit()
    await invalidate_pattern("categories:*")

# ── Quiz Controller ──────────────────────────────────────────────────────────
async def create_quiz(db: AsyncSession, quiz_in: QuizCreate, creator_id: int) -> Quiz:
    if quiz_in.category_id is not None:
        cat_query = select(Category).filter(Category.id == quiz_in.category_id)
        cat_result = await db.execute(cat_query)
        if not cat_result.scalars().first():
            raise CategoryNotFoundError("Category not found.")

    new_quiz = Quiz(
        title=quiz_in.title,
        description=quiz_in.description,
        category_id=quiz_in.category_id,
        created_by_id=creator_id,
        status=QuizStatus.DRAFT,
        time_limit_minutes=quiz_in.time_limit_minutes,
        pass_mark=quiz_in.pass_mark,
        shuffle_questions=quiz_in.shuffle_questions,
        max_attempts=quiz_in.max_attempts,
        results_visible=False,
    )
    db.add(new_quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")
    return await get_quiz_by_id(db, new_quiz.id)

async def get_all_quizzes(
    db: AsyncSession,
    category_id: int | None = None,
    status: QuizStatus | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 9,
) -> tuple[dict, bool]:
    cache_key = f"quizzes:cat_{category_id}:status_{status}:s_{search}:p_{page}:l_{limit}"
    cached_data = await get_cache(cache_key)
    if cached_data:
        return cached_data, True

    query = select(Quiz).options(
        selectinload(Quiz.category),
        selectinload(Quiz.creator)
    )
    count_query = select(func.count()).select_from(Quiz)

    if category_id is not None:
        query = query.filter(Quiz.category_id == category_id)
        count_query = count_query.filter(Quiz.category_id == category_id)
    if status is not None:
        query = query.filter(Quiz.status == status)
        count_query = count_query.filter(Quiz.status == status)
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        filter_cond = or_(
            Quiz.title.ilike(search_pattern),
            Quiz.description.ilike(search_pattern)
        )
        query = query.filter(filter_cond)
        count_query = count_query.filter(filter_cond)

    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    offset = (page - 1) * limit
    query = query.order_by(Quiz.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    items = list(result.scalars().all())

    pages = (total + limit - 1) // limit if limit > 0 else 1

    items_dump = [QuizResponse.model_validate(item).model_dump(mode="json") for item in items]

    res_dict = {
        "items": items_dump,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(pages, 1),
    }
    await set_cache(cache_key, res_dict, expire_seconds=300)
    return res_dict, False

async def get_quiz_by_id(db: AsyncSession, quiz_id: int) -> Quiz:
    query = select(Quiz).options(
        selectinload(Quiz.category),
        selectinload(Quiz.creator),
        selectinload(Quiz.questions).selectinload(Question.options)
    ).filter(Quiz.id == quiz_id)
    
    result = await db.execute(query)
    quiz = result.scalars().first()
    if not quiz:
        raise QuizNotFoundError()
    return quiz

async def update_quiz(db: AsyncSession, quiz_id: int, quiz_in: QuizUpdate) -> Quiz:
    quiz = await get_quiz_by_id(db, quiz_id)
    
    if quiz_in.category_id is not None:
        cat_query = select(Category).filter(Category.id == quiz_in.category_id)
        cat_result = await db.execute(cat_query)
        if not cat_result.scalars().first():
            raise CategoryNotFoundError()

    # Apply changes
    update_data = quiz_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)

    db.add(quiz)
    await db.commit()
    return await get_quiz_by_id(db, quiz_id)

async def delete_quiz(db: AsyncSession, quiz_id: int) -> None:
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.status != QuizStatus.DRAFT:
        raise QuizStatusError("Cannot delete quiz unless it is in DRAFT status.")
    
    await db.delete(quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")

async def publish_quiz(db: AsyncSession, quiz_id: int) -> Quiz:
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.status != QuizStatus.DRAFT:
        raise QuizStatusError("Only DRAFT quizzes can be published.")
    
    # Recalculate marks one last time
    await recalculate_quiz_total_marks(db, quiz_id)
    
    quiz.status = QuizStatus.PUBLISHED
    quiz.published_at = datetime.now(timezone.utc)
    db.add(quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")
    return await get_quiz_by_id(db, quiz_id)

async def close_quiz(db: AsyncSession, quiz_id: int) -> Quiz:
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.status != QuizStatus.PUBLISHED:
        raise QuizStatusError("Only PUBLISHED quizzes can be closed.")
        
    quiz.status = QuizStatus.CLOSED
    quiz.closed_at = datetime.now(timezone.utc)
    db.add(quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")
    return await get_quiz_by_id(db, quiz_id)

async def reopen_quiz(db: AsyncSession, quiz_id: int) -> Quiz:
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.status != QuizStatus.CLOSED:
        raise QuizStatusError("Only CLOSED quizzes can be reopened.")
        
    quiz.status = QuizStatus.PUBLISHED
    quiz.closed_at = None
    db.add(quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")
    return await get_quiz_by_id(db, quiz_id)


async def release_results(db: AsyncSession, quiz_id: int) -> Quiz:
    quiz = await get_quiz_by_id(db, quiz_id)
    quiz.results_visible = True
    db.add(quiz)
    await db.commit()
    await invalidate_pattern("quizzes:*")
    return await get_quiz_by_id(db, quiz_id)

# ── Question Controller ──────────────────────────────────────────────────────
async def create_question(db: AsyncSession, quiz_id: int, question_in: QuestionCreate) -> Question:
    
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit questions after results have been released.")

    options_data = question_in.options

    new_q = Question(
        quiz_id=quiz_id,
        text=question_in.text,
        type=question_in.type,
        marks=question_in.marks,
        order=question_in.order,
        explanation=question_in.explanation,
        image_url=question_in.image_url
    )
    db.add(new_q)
    await db.commit()
    await db.refresh(new_q)
    new_q_id = new_q.id

    if options_data:
      for opt_in in options_data:
        new_opt = Option(
            question_id=new_q_id,
            text=opt_in.text,
            is_correct=opt_in.is_correct,
            order=opt_in.order,
        )
        db.add(new_opt)
      await db.commit()

    await recalculate_quiz_total_marks(db, quiz_id)
    await re_grade_quiz_attempts(db, quiz_id)
    return await get_question_by_id(db, new_q_id)

async def create_questions_bulk(db: AsyncSession, quiz_id: int, questions_in: List[QuestionCreate]) -> List[Question]:
    quiz = await get_quiz_by_id(db, quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit questions after results have been released.")

    created_questions = []

    for q_in in questions_in:
        options_data = q_in.options

        new_q = Question(
            quiz_id=quiz_id,
            text=q_in.text,
            type=q_in.type,
            marks=q_in.marks,
            order=q_in.order,
            explanation=q_in.explanation,
            image_url=q_in.image_url
        )
        db.add(new_q)
        await db.flush()

        if options_data:
            for opt_in in options_data:
                new_opt = Option(
                    question_id=new_q.id,
                    text=opt_in.text,
                    is_correct=opt_in.is_correct,
                    order=opt_in.order,
                )
                db.add(new_opt)

        created_questions.append(new_q)

    await db.commit()
    await recalculate_quiz_total_marks(db, quiz_id)
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, quiz_id)

    reloaded_questions = []
    for cq in created_questions:
        rq = await get_question_by_id(db, cq.id)
        reloaded_questions.append(rq)

    return reloaded_questions

async def update_question(db: AsyncSession, question_id: int, question_in: QuestionCreate) -> Question:
    question = await get_question_by_id(db, question_id)

    quiz = await get_quiz_by_id(db, question.quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit questions after results have been released.")

    question.text = question_in.text
    question.type = question_in.type
    question.marks = question_in.marks
    question.order = question_in.order
    question.explanation = question_in.explanation
    question.image_url = question_in.image_url

    db.add(question)

    if question_in.options is not None:
        existing_options = {opt.order: opt for opt in question.options}
        new_orders = {opt_in.order for opt_in in question_in.options}

        for opt_in in question_in.options:
            if opt_in.order in existing_options:
                opt = existing_options[opt_in.order]
                opt.text = opt_in.text
                opt.is_correct = opt_in.is_correct
                db.add(opt)
            else:
                new_opt = Option(
                    question_id=question_id,
                    text=opt_in.text,
                    is_correct=opt_in.is_correct,
                    order=opt_in.order
                )
                db.add(new_opt)

        for order, opt in existing_options.items():
            if order not in new_orders:
                await db.delete(opt)

    await db.commit()
    
    await recalculate_quiz_total_marks(db, question.quiz_id)
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, question.quiz_id)
    return await get_question_by_id(db, question_id)

async def delete_question(db: AsyncSession, question_id: int) -> None:
    query = select(Question).filter(Question.id == question_id)
    result = await db.execute(query)
    question = result.scalars().first()
    if not question:
        raise QuestionNotFoundError()

    quiz = await get_quiz_by_id(db, question.quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit questions after results have been released.")

    quiz_id = question.quiz_id
    await db.delete(question)
    await db.commit()
    
    await recalculate_quiz_total_marks(db, quiz_id)
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, quiz_id)

# ── Option Controller ────────────────────────────────────────────────────────
async def create_option(db: AsyncSession, question_id: int, option_in: OptionCreate) -> Option:
    query = select(Question).filter(Question.id == question_id)
    result = await db.execute(query)
    question = result.scalars().first()
    if not question:
        raise QuestionNotFoundError()

    quiz = await get_quiz_by_id(db, question.quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit options after results have been released.")

    new_opt = Option(
        question_id=question_id,
        text=option_in.text,
        is_correct=option_in.is_correct,
        order=option_in.order
    )
    db.add(new_opt)
    await db.commit()
    await db.refresh(new_opt)
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, quiz.id)
    return new_opt

async def update_option(db: AsyncSession, option_id: int, option_in: OptionCreate) -> Option:
    query = select(Option).filter(Option.id == option_id)
    result = await db.execute(query)
    option = result.scalars().first()
    if not option:
        raise OptionNotFoundError()

    # Ensure quiz is DRAFT
    query_q = select(Question).filter(Question.id == option.question_id)
    res_q = await db.execute(query_q)
    question = res_q.scalars().first()
    
    quiz = await get_quiz_by_id(db, question.quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit options after results have been released.")

    option.text = option_in.text
    option.is_correct = option_in.is_correct
    option.order = option_in.order

    db.add(option)
    await db.commit()
    await db.refresh(option)
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, quiz.id)
    return option

async def delete_option(db: AsyncSession, option_id: int) -> None:
    query = select(Option).filter(Option.id == option_id)
    result = await db.execute(query)
    option = result.scalars().first()
    if not option:
        raise OptionNotFoundError()

    query_q = select(Question).filter(Question.id == option.question_id)
    res_q = await db.execute(query_q)
    question = res_q.scalars().first()
    
    quiz = await get_quiz_by_id(db, question.quiz_id)
    if quiz.results_visible:
        raise QuizStatusError("Cannot edit options after results have been released.")

    if option.is_correct:
        query_other = select(Option).filter(
            Option.question_id == option.question_id,
            Option.is_correct == True,
            Option.id != option.id
        )
        other_res = await db.execute(query_other)
        if not other_res.scalars().first():
            raise QuizStatusError("Cannot delete the only correct option of a question. Please designate another option as correct first.")

    await db.delete(option)
    await db.commit()
    from controllers.result import re_grade_quiz_attempts
    await re_grade_quiz_attempts(db, quiz.id)
