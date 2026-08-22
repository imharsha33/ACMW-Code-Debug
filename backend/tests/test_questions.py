def test_admin_create_question(client, admin_token_headers):
    payload = {
        "title": "Predict Output: Variable Scope",
        "description": "Predict the value of x",
        "questionType": "OUTPUT_PREDICTION",
        "difficulty": "Easy",
        "maxMarks": 5,
        "maxAttempts": 2,
        "allowedLanguages": ["Python"],
        "enabled": True,
        "run_enabled": False,
        "timeLimit": {"hours": 0, "minutes": 5, "seconds": 0},
        "options": [
            {"id": "opt1", "text": "x = 10", "isCorrect": True},
            {"id": "opt2", "text": "x = 20", "isCorrect": False},
        ],
    }
    response = client.post("/api/questions", json=payload, headers=admin_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Predict Output: Variable Scope"
    assert data["maxMarks"] == 5
    assert len(data["options"]) == 2

def test_student_cannot_create_question(client, student_token_headers):
    payload = {
        "title": "Student Question",
        "description": "Should fail",
        "questionType": "PROGRAMMING_PROBLEM",
        "maxMarks": 10,
        "maxAttempts": 3,
        "problemStatement": "Test",
    }
    response = client.post("/api/questions", json=payload, headers=student_token_headers)
    assert response.status_code == 403

def test_output_prediction_student_protection(client, student_token_headers):
    # Fetch seeded question q2 (Output Prediction)
    response = client.get("/api/questions/q2", headers=student_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "options" in data
    # Verify isCorrect is NOT present in student payload
    for opt in data["options"]:
        assert "isCorrect" not in opt
    # Verify expectedSolution is NOT present
    assert "expectedSolution" not in data
