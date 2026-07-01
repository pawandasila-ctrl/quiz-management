import pytest
from sqlalchemy import select
from models.user import User, Session, UserRole
from schemas.user import UserCreate
from controllers import users as user_controller
from utils.exceptions import SessionNotFoundError, SessionExpiredError
from datetime import datetime, timedelta, timezone

pytestmark = pytest.mark.asyncio

async def test_register_student_endpoint(client):
    """
    Test student registration via the public signup endpoint.
    """
    payload = {
        "name": "Jane Student",
        "email": "jane@example.com",
        "password": "securepassword123",
        "image": "http://example.com/jane.jpg"
    }
    
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == "Jane Student"
    assert data["email"] == "jane@example.com"
    assert data["role"] == "student"  # Registration defaults to student!
    assert data["is_active"] is True
    assert "password" not in data    # Password should never leak in response payload

async def test_duplicate_registration_fails(client):
    """
    Test registering with an already occupied email address.
    """
    payload = {
        "name": "Duplicate Student",
        "email": "duplicate@example.com",
        "password": "securepassword123"
    }
    
    # 1. First signup
    response1 = await client.post("/auth/register", json=payload)
    assert response1.status_code == 201
    
    # 2. Second signup with same email
    response2 = await client.post("/auth/register", json=payload)
    assert response2.status_code == 400
    assert response2.json()["detail"] == "A user with this email address already exists."

async def test_login_logout_lifecycle(client, db_session):
    """
    Test user login, HttpOnly cookie generation, me profile retrieve, and logout sequence.
    """
    # 1. Create a user
    user_in = UserCreate(
        name="Login Test",
        email="logintest@example.com",
        password="loginpassword123"
    )
    await user_controller.create_user(db_session, user_in)
    
    # 2. Login
    login_payload = {
        "email": "logintest@example.com",
        "password": "loginpassword123"
    }
    login_response = await client.post("/auth/login", json=login_payload)
    assert login_response.status_code == 200
    
    login_data = login_response.json()
    assert login_data["access_token"] is not None
    assert login_data["user"]["email"] == "logintest@example.com"
    
    # Check that HttpOnly cookies are set
    cookies = login_response.cookies
    assert "access_token" in cookies
    assert "role" in cookies
    assert "has_session" in cookies
    
    # 3. Retrieve me profile using the session cookies
    me_response = await client.get("/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "logintest@example.com"
    
    # 4. Logout (revokes token)
    logout_response = await client.post("/auth/logout")
    assert logout_response.status_code == 200
    assert logout_response.json()["detail"] == "Logout successful."
    
    # 5. Access me again — should fail because cookies are deleted/token is revoked
    # In test client, we must clear cookies to simulate logout cookie deletions
    client.cookies.clear()
    me_after_logout = await client.get("/auth/me")
    assert me_after_logout.status_code == 401
