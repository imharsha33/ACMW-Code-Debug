def test_record_event(client, student_token_headers):
    start_res = client.post("/api/assessments/assessment_1/start", headers=student_token_headers)
    attempt_id = start_res.json()["attempt_id"]

    evt_payload = {
        "event_type": "TAB_SWITCH",
        "timestamp": 1700000000000,
        "metadata": {"source": "browser_blur"},
    }
    evt_res = client.post(f"/api/attempts/{attempt_id}/events", json=evt_payload, headers=student_token_headers)
    assert evt_res.status_code == 201
    assert evt_res.json()["event_type"] == "TAB_SWITCH"

    # List events
    list_res = client.get(f"/api/attempts/{attempt_id}/events", headers=student_token_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_results_access_restrictions(client, student_token_headers, admin_token_headers):
    # Student attempts assessment
    start_res = client.post("/api/assessments/assessment_1/start", headers=student_token_headers)
    attempt_id = start_res.json()["attempt_id"]

    # Student requests own results
    my_res = client.get("/api/results/me", headers=student_token_headers)
    assert my_res.status_code == 200

    # Admin requests assessment results
    ass_res = client.get("/api/results/assessment/assessment_1", headers=admin_token_headers)
    assert ass_res.status_code == 200

def test_admin_dashboard_metrics(client, admin_token_headers):
    res = client.get("/api/dashboard/admin", headers=admin_token_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_students" in data
    assert "total_assessments" in data
    assert "total_questions" in data
