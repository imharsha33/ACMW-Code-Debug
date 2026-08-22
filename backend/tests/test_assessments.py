def test_admin_create_assessment(client, admin_token_headers):
    payload = {
        "title": "Weekly Mock Assessment",
        "description": "Weekly test",
        "overall_time_limit": {"hours": 0, "minutes": 45, "seconds": 0},
        "overall_submit_threshold": 5,
        "fullscreen_mode": "REQUIRED",
        "tab_switching_mode": "RESTRICT_FLAG",
        "status": "ACTIVE",
        "question_ids": ["q1", "q2"],
    }
    response = client.post("/api/assessments", json=payload, headers=admin_token_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Weekly Mock Assessment"
    assert data["question_ids"] == ["q1", "q2"]

def test_assessment_ordering_preserved(client, admin_token_headers):
    payload = {
        "title": "Ordered Assessment",
        "overall_time_limit": {"hours": 1, "minutes": 0, "seconds": 0},
        "question_ids": ["q4", "q3", "q2", "q1"],
    }
    response = client.post("/api/assessments", json=payload, headers=admin_token_headers)
    assert response.status_code == 201
    assert response.json()["question_ids"] == ["q4", "q3", "q2", "q1"]

def test_invalid_submit_threshold_rejected(client, admin_token_headers):
    payload = {
        "title": "Invalid Threshold",
        "overall_time_limit": {"hours": 0, "minutes": 10, "seconds": 0},
        "overall_submit_threshold": 15, # Threshold 15m > 10m limit!
    }
    response = client.post("/api/assessments", json=payload, headers=admin_token_headers)
    assert response.status_code == 422
