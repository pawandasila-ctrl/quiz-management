import pytest
from models.user import UserRole
from schemas.user import UserCreate
from controllers import users as user_controller
from models.quiz import QuizStatus, QuestionType
from models.result import AttemptStatus
from config.settings import settings
import base64
import json
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from os import urandom

def encrypt_payload(payload: dict, key_str: str) -> str:
    key = hashlib.sha256(key_str.encode()).digest()
    aesgcm = AESGCM(key)
    nonce = urandom(12)
    ciphertext = aesgcm.encrypt(nonce, json.dumps(payload).encode('utf-8'), None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

pytestmark = pytest.mark.asyncio

async def test_quiz_attempt_grading_lifecycle(client, db_session):
    """
    Complete end-to-end integration test:
    1. Register & login Admin
    2. Admin creates Category & Quiz (DRAFT)
    3. Admin adds Question & Options
    4. Admin publishes Quiz
    5. Register & login Student
    6. Student starts attempt
    7. Student answers question
    8. Student submits attempt
    9. Grading logic executes and computes correct score
    10. Leaderboard updates
    """
    
    admin_in = UserCreate(
        name="Admin User",
        email="admin@example.com",
        password="adminpassword123"
    )
    admin_user = await user_controller.create_user(db_session, admin_in)
    await user_controller.update_user_role(db_session, admin_user.id, UserRole.ADMIN)
    
    
    login_res = await client.post("/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    assert login_res.status_code == 200
    
    
    cat_res = await client.post("/admin/categories", json={
        "name": "Programming Languages",
        "description": "Tech general knowledge quizzes"
    })
    assert cat_res.status_code == 201
    category_id = cat_res.json()["id"]
    
    quiz_res = await client.post("/admin/quiz", json={
        "title": "FastAPI Trivia",
        "description": "Test your FastAPI skills",
        "category_id": category_id,
        "time_limit_minutes": 15,
        "pass_mark": 1,
        "shuffle_questions": False,
        "max_attempts": 2
    })
    assert quiz_res.status_code == 201
    quiz_id = quiz_res.json()["id"]
    assert quiz_res.json()["status"] == "draft"
    
    
    q_res = await client.post(f"/admin/quiz/{quiz_id}/questions", json={
        "text": "Is FastAPI built on Starlette and Pydantic?",
        "type": "true_false",
        "marks": 2,
        "order": 1,
        "explanation": "Yes, FastAPI uses Starlette for routing/web, and Pydantic for validation.",
        "image_url": "http://res.cloudinary.com/h10uwhxk/image/upload/sample.jpg"
    })
    assert q_res.status_code == 201
    q_data = q_res.json()
    assert q_data["image_url"] == "http://res.cloudinary.com/h10uwhxk/image/upload/sample.jpg"
    question_id = q_data["id"]
    
    
    opt1_res = await client.post(f"/admin/questions/{question_id}/options", json={
        "text": "True",
        "is_correct": True,
        "order": 1
    })
    assert opt1_res.status_code == 201
    opt1_id = opt1_res.json()["id"]
    
    opt2_res = await client.post(f"/admin/questions/{question_id}/options", json={
        "text": "False",
        "is_correct": False,
        "order": 2
    })
    assert opt2_res.status_code == 201
    
    
    pub_res = await client.post(f"/admin/quiz/{quiz_id}/publish")
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"
    assert pub_res.json()["total_marks"] == 2  
    
    
    await client.post("/auth/logout")
    client.cookies.clear()
    
    
    student_in = UserCreate(
        name="Student User",
        email="student@example.com",
        password="studentpassword123"
    )
    await user_controller.create_user(db_session, student_in)
    
    
    login_student_res = await client.post("/auth/login", json={
        "email": "student@example.com",
        "password": "studentpassword123"
    })
    assert login_student_res.status_code == 200
    
    
    start_res = await client.post(f"/student/quiz/{quiz_id}/start")
    assert start_res.status_code == 200
    attempt_id = start_res.json()["id"]
    assert start_res.json()["status"] == "in_progress"
    
    
    payload = {
        "question_id": question_id,
        "selected_option_id": opt1_id,
        "marked_for_review": False
    }
    encrypted_data = encrypt_payload(payload, settings.API_ENCRYPTION_KEY)
    ans_res = await client.post(f"/student/attempt/{attempt_id}/answer", json={
        "encrypted_data": encrypted_data
    })
    assert ans_res.status_code == 200
    
    
    submit_res = await client.post(f"/student/attempt/{attempt_id}/submit")
    assert submit_res.status_code == 200
    
    attempt_data = submit_res.json()
    assert attempt_data["status"] == "graded"
    assert attempt_data["score"] == 2
    assert attempt_data["passed"] is True
    
    
    
    
    client.cookies.clear()
    await client.post("/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    
    release_res = await client.post(f"/admin/quiz/{quiz_id}/release-results")
    assert release_res.status_code == 200
    
    
    client.cookies.clear()
    await client.post("/auth/login", json={
        "email": "student@example.com",
        "password": "studentpassword123"
    })
    
    leaderboard_res = await client.get(f"/student/quiz/{quiz_id}/leaderboard")
    assert leaderboard_res.status_code == 200
    leaderboard = leaderboard_res.json()
    assert len(leaderboard) == 1
    assert leaderboard[0]["rank"] == 1
    assert leaderboard[0]["student_name"] == "Student User"
    assert leaderboard[0]["score"] == 2

from unittest.mock import patch

async def test_admin_upload_image_endpoint(client, db_session):
    """
    Test that the admin upload endpoint correctly handles file uploads,
    verifying it restricts non-image content and calls Cloudinary.
    """
    
    admin_in = UserCreate(
        name="Admin Image Upload",
        email="admin_upload@example.com",
        password="adminpassword123"
    )
    admin_user = await user_controller.create_user(db_session, admin_in)
    await user_controller.update_user_role(db_session, admin_user.id, UserRole.ADMIN)
    
    await client.post("/auth/login", json={
        "email": "admin_upload@example.com",
        "password": "adminpassword123"
    })
    
    files = {"file": ("test.txt", b"some text content", "text/plain")}
    response = await client.post("/admin/upload", files=files)
    assert response.status_code == 400
    assert response.json()["detail"] == "Uploaded file must be an image."
    
    with patch("routers.admin.upload_image_bytes") as mock_upload:
        mock_url = "https://res.cloudinary.com/h10uwhxk/image/upload/v12345/quiz_images/test.jpg"
        mock_upload.return_value = mock_url
        
        image_files = {"file": ("test.jpg", b"fake_jpeg_bytes", "image/jpeg")}
        response = await client.post("/admin/upload", files=image_files)
        
        assert response.status_code == 200
        assert response.json()["secure_url"] == mock_url
        mock_upload.assert_called_once_with(b"fake_jpeg_bytes")


async def test_quiz_leaderboard_best_attempt_and_ranking(client, db_session):
    """
    Test that the leaderboard correctly:
    1. Returns only the best attempt for each student (no duplicates).
    2. Ranks students by score (descending) and time taken (ascending).
    """
    from models.quiz import Category, Quiz, Question, Option, QuizStatus
    from models.result import QuizAttempt, AttemptStatus
    from models.user import User, UserRole
    from datetime import datetime, timezone, timedelta
    from controllers.result import get_quiz_leaderboard
    
   
    admin = User(name="Admin User", email="admin_ld@example.com", hashed_password="hashed_pwd", role=UserRole.ADMIN)
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    category = Category(name="General Knowledge")
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)

    quiz = Quiz(
        title="Leaderboard Test Quiz",
        category_id=category.id,
        created_by_id=admin.id,
        status=QuizStatus.PUBLISHED,
        pass_mark=1,
        total_marks=2,
        max_attempts=3,
        results_visible=True
    )
    db_session.add(quiz)
    await db_session.commit()
    await db_session.refresh(quiz)

    question = Question(quiz_id=quiz.id, text="Q1", marks=2, order=1)
    db_session.add(question)
    await db_session.commit()
    await db_session.refresh(question)

    opt_correct = Option(question_id=question.id, text="Correct", is_correct=True, order=1)
    opt_incorrect = Option(question_id=question.id, text="Incorrect", is_correct=False, order=2)
    db_session.add_all([opt_correct, opt_incorrect])
    await db_session.commit()
    await db_session.refresh(opt_correct)
    await db_session.refresh(opt_incorrect)

   
    student_a = User(name="Student A", email="student_a@example.com", hashed_password="hashed_pwd", role=UserRole.STUDENT)
    student_b = User(name="Student B", email="student_b@example.com", hashed_password="hashed_pwd", role=UserRole.STUDENT)
    db_session.add_all([student_a, student_b])
    await db_session.commit()
    await db_session.refresh(student_a)
    await db_session.refresh(student_b)

    now = datetime.now(timezone.utc)

   
    att_a1 = QuizAttempt(
        quiz_id=quiz.id,
        student_id=student_a.id,
        attempt_number=1,
        status=AttemptStatus.GRADED,
        score=0,
        total_marks=2,
        passed=False,
        time_taken_seconds=50,
        started_at=now - timedelta(seconds=100),
        submitted_at=now - timedelta(seconds=50),
        graded_at=now - timedelta(seconds=50)
    )

   
    att_a2 = QuizAttempt(
        quiz_id=quiz.id,
        student_id=student_a.id,
        attempt_number=2,
        status=AttemptStatus.GRADED,
        score=2,
        total_marks=2,
        passed=True,
        time_taken_seconds=30,
        started_at=now - timedelta(seconds=60),
        submitted_at=now - timedelta(seconds=30),
        graded_at=now - timedelta(seconds=30)
    )

   
    att_b1 = QuizAttempt(
        quiz_id=quiz.id,
        student_id=student_b.id,
        attempt_number=1,
        status=AttemptStatus.GRADED,
        score=2,
        total_marks=2,
        passed=True,
        time_taken_seconds=15,
        started_at=now - timedelta(seconds=45),
        submitted_at=now - timedelta(seconds=30),
        graded_at=now - timedelta(seconds=30)
    )

    db_session.add_all([att_a1, att_a2, att_b1])
    await db_session.commit()

    leaderboard = await get_quiz_leaderboard(db_session, quiz.id, student_a)

   
   
    assert len(leaderboard) == 2

   
    assert leaderboard[0].rank == 1
    assert leaderboard[0].student_name == "Student B"
    assert leaderboard[0].score == 2
    assert leaderboard[0].time_taken_seconds == 15

   
    assert leaderboard[1].rank == 2
    assert leaderboard[1].student_name == "Student A"
    assert leaderboard[1].score == 2
    assert leaderboard[1].time_taken_seconds == 30


async def test_nested_question_options_creation(client, db_session):
    """
    Test that an admin can create a question and its options in a single API call.
    """
    from models.user import UserRole
    from schemas.user import UserCreate
    from controllers import users as user_controller
    
    # 1. Create admin and login
    admin_in = UserCreate(
        name="Admin Question Creator",
        email="admin_qc@example.com",
        password="adminpassword123"
    )
    admin_user = await user_controller.create_user(db_session, admin_in)
    await user_controller.update_user_role(db_session, admin_user.id, UserRole.ADMIN)
    
    login_res = await client.post("/auth/login", json={
        "email": "admin_qc@example.com",
        "password": "adminpassword123"
    })
    assert login_res.status_code == 200
    
    # 2. Create Category and Quiz
    cat_res = await client.post("/admin/categories", json={
        "name": "Maths",
        "description": "Mathematics quizzes"
    })
    assert cat_res.status_code == 201
    category_id = cat_res.json()["id"]
    
    quiz_res = await client.post("/admin/quiz", json={
        "title": "Algebra Basic",
        "description": "Solve for X",
        "category_id": category_id,
        "time_limit_minutes": 10,
        "pass_mark": 1,
        "shuffle_questions": False,
        "max_attempts": 1
    })
    assert quiz_res.status_code == 201
    quiz_id = quiz_res.json()["id"]
    
    # 3. Create Question with Nested Options
    q_res = await client.post(f"/admin/quiz/{quiz_id}/questions", json={
        "text": "What is 2 + 2?",
        "type": "mcq",
        "marks": 3,
        "order": 1,
        "explanation": "Addition basics.",
        "options": [
            {"text": "3", "is_correct": False, "order": 1},
            {"text": "4", "is_correct": True, "order": 2},
            {"text": "5", "is_correct": False, "order": 3}
        ]
    })
    
    assert q_res.status_code == 201
    q_data = q_res.json()
    assert q_data["text"] == "What is 2 + 2?"
    assert len(q_data["options"]) == 3
    
    # Verify option values
    assert q_data["options"][0]["text"] == "3"
    assert q_data["options"][0]["is_correct"] is False
    assert q_data["options"][1]["text"] == "4"
    assert q_data["options"][1]["is_correct"] is True
    assert q_data["options"][2]["text"] == "5"
    assert q_data["options"][2]["is_correct"] is False


async def test_category_and_attempt_deletion(client, db_session):
    # 1. Create and log in Admin
    admin_in = UserCreate(
        name="Admin Deletion Tester",
        email="admindelete@example.com",
        password="adminpassword123"
    )
    admin_user = await user_controller.create_user(db_session, admin_in)
    await user_controller.update_user_role(db_session, admin_user.id, UserRole.ADMIN)
    
    await client.post("/auth/login", json={
        "email": "admindelete@example.com",
        "password": "adminpassword123"
    })

    # 2. Create Category
    cat_res = await client.post("/admin/categories", json={
        "name": "Deletion Category",
        "description": "To be deleted"
    })
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 3. Delete Category
    del_cat_res = await client.delete(f"/admin/categories/{cat_id}")
    assert del_cat_res.status_code == 200
    assert del_cat_res.json()["detail"] == "Category successfully deleted."

    # Try to delete again
    del_cat_again = await client.delete(f"/admin/categories/{cat_id}")
    assert del_cat_again.status_code == 400
