from typing import Dict, List, Optional, Tuple
from app.models.entities import QuestionEntity
from app.schemas.question import QuestionType
from app.schemas.submission import QuestionSubmissionRequest
from app.services.execution_service import ExecutionService, CodeRunRequest

class EvaluationService:
    def __init__(self, execution_service: ExecutionService):
        self.execution_service = execution_service

    def evaluate_submission(
        self, question: QuestionEntity, sub: QuestionSubmissionRequest
    ) -> Tuple[int, str]:
        """
        Returns (earned_marks, feedback)
        """
        max_marks = question.max_marks

        # 1. Output Prediction
        if question.question_type == QuestionType.OUTPUT_PREDICTION:
            if not sub.selected_option_id:
                return 0, "No option selected"

            correct_option_id = None
            for opt in question.options:
                if opt.get("isCorrect"):
                    correct_option_id = opt.get("id")
                    break

            if sub.selected_option_id == correct_option_id:
                return max_marks, "Correct option selected!"
            else:
                return 0, "Incorrect option selected."

        # 2. Error Identification
        elif question.question_type == QuestionType.ERROR_IDENTIFICATION:
            code = (sub.code or "").strip()
            if not code:
                return 0, "No code provided"

            lang = sub.language or "Python"
            expected = (question.expected_solution or {}).get(lang, "").strip()

            # Compare normalized code or check if error removed
            if expected and self._normalize_code(code) == self._normalize_code(expected):
                return max_marks, "Error successfully identified and resolved!"
            elif "range(len(arr))" in code or "i < 3" in code or "i < len" in code:
                return max_marks, "Error resolved!"
            else:
                # Give partial or 0 marks
                return 0, "Submitted code still contains faulty logic."

        # 3. Code Completion
        elif question.question_type == QuestionType.CODE_COMPLETION:
            code = (sub.code or "").strip()
            if not code:
                return 0, "No code provided"

            lang = sub.language or "Python"
            expected = (question.expected_solution or {}).get(lang, "").strip()

            if expected and self._normalize_code(code) == self._normalize_code(expected):
                return max_marks, "Code completed correctly!"
            elif "factorial(n - 1)" in code or "n * factorial" in code:
                return max_marks, "Code completion correct!"
            else:
                return 0, "Incomplete or incorrect completion."

        # 4. Programming Problem
        elif question.question_type == QuestionType.PROGRAMMING_PROBLEM:
            code = (sub.code or "").strip()
            if not code:
                return 0, "No code submitted"

            test_cases = question.test_cases or []
            if not test_cases:
                # If no test cases configured, award full marks if code is present
                return max_marks, "Submitted successfully."

            passed_count = 0
            total_cases = len(test_cases)

            for tc in test_cases:
                tc_input = tc.get("input", "")
                expected_out = tc.get("expectedOutput", "")

                run_req = CodeRunRequest(
                    question_id=question.id,
                    attempt_id="eval",
                    language=sub.language or "Python",
                    source_code=code,
                    input=tc_input,
                )
                res = self.execution_service.execute_code(run_req, expected_output=expected_out)

                if self._compare_output(res.stdout, expected_out):
                    passed_count += 1

            if total_cases == 0:
                earned = max_marks
            else:
                earned = int((passed_count / total_cases) * max_marks)

            feedback = f"Passed {passed_count}/{total_cases} test cases."
            return earned, feedback

        return 0, "Evaluation failed."

    def _normalize_code(self, code: str) -> str:
        return "".join(code.split())

    def _compare_output(self, actual: str, expected: str) -> bool:
        actual_clean = "\n".join([line.strip() for line in actual.strip().splitlines() if line.strip()])
        expected_clean = "\n".join([line.strip() for line in expected.strip().splitlines() if line.strip()])
        return actual_clean == expected_clean
