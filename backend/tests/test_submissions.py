def test_code_run_does_not_consume_attempts(client, student_token_headers):
    # 1. Start assessment
    start_res = client.post("/api/assessments/assessment_1/start", headers=student_token_headers)
    assert start_res.status_code == 200
    attempt_id = start_res.json()["attempt_id"]

    # 2. Run code
    run_req = {
        "question_id": "q1",
        "attempt_id": attempt_id,
        "language": "Python",
        "source_code": "print('Hello')",
        "input": "121",
    }
    run_res = client.post("/api/code/run", json=run_req, headers=student_token_headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "Success"

    # 3. Check that zero attempts were consumed so far
    result_res = client.get("/api/results/me", headers=student_token_headers)
    assert result_res.status_code == 200

def test_question_submit_consumes_attempt_and_scores(client, student_token_headers):
    # 1. Start assessment
    start_res = client.post("/api/assessments/assessment_1/start", headers=student_token_headers)
    attempt_id = start_res.json()["attempt_id"]

    # 2. Submit MCQ question q2 (Output prediction opt2 is correct)
    sub_req = {"selected_option_id": "opt2"}
    sub_res = client.post(
        f"/api/attempts/{attempt_id}/questions/q2/submit",
        json=sub_req,
        headers=student_token_headers,
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert data["earned_marks"] == 5
    assert data["maximum_marks"] == 5
    assert data["attempts_used"] == 1
    assert data["attempts_remaining"] == 1

def test_max_attempts_enforcement(client, student_token_headers):
    start_res = client.post("/api/assessments/assessment_1/start", headers=student_token_headers)
    attempt_id = start_res.json()["attempt_id"]

    # Question q2 allows max 2 attempts
    sub_req = {"selected_option_id": "opt1"} # wrong answer
    client.post(f"/api/attempts/{attempt_id}/questions/q2/submit", json=sub_req, headers=student_token_headers)
    client.post(f"/api/attempts/{attempt_id}/questions/q2/submit", json=sub_req, headers=student_token_headers)

    # 3rd attempt should fail
    fail_res = client.post(f"/api/attempts/{attempt_id}/questions/q2/submit", json=sub_req, headers=student_token_headers)
    assert fail_res.status_code == 400
    assert "Maximum attempts" in fail_res.json()["detail"]
