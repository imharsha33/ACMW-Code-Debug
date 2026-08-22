from app.config import settings

def test_admin_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": settings.ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_student_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"email": settings.STUDENT_EMAIL, "password": settings.STUDENT_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": "wrongpassword"},
    )
    assert response.status_code == 401

def test_get_me(client, admin_token_headers):
    response = client.get("/api/auth/me", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == settings.ADMIN_EMAIL.lower()
    assert data["role"] == "ADMIN"

def test_unauthenticated_request_fails(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
