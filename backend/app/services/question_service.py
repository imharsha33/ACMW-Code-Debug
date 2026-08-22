import time
from typing import List, Optional, Union
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.models.entities import QuestionEntity
from app.repositories.base import QuestionRepositoryInterface
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionAdminResponse,
    QuestionStudentResponse,
    McqOptionStudent,
    TestCaseStudent,
    QuestionType,
    Language,
    Difficulty,
    TimeLimit,
)
from app.schemas.user import UserRole

class QuestionService:
    def __init__(self, question_repo: QuestionRepositoryInterface):
        self.question_repo = question_repo

    def create_question(self, q_in: QuestionCreate) -> QuestionAdminResponse:
        now = int(time.time() * 1000)
        q_id = f"q_{now}_{int(hash(q_in.title) & 0xffff)}"

        options_data = [opt.model_dump() for opt in q_in.options] if q_in.options else []
        test_cases_data = [tc.model_dump() for tc in q_in.testCases] if q_in.testCases else []

        entity = QuestionEntity(
            id=q_id,
            title=q_in.title,
            description=q_in.description,
            question_type=q_in.questionType,
            difficulty=q_in.difficulty,
            max_marks=q_in.maxMarks,
            max_attempts=q_in.maxAttempts,
            allowed_languages=q_in.allowedLanguages,
            enabled=q_in.enabled,
            run_enabled=q_in.run_enabled,
            time_limit_hours=q_in.timeLimit.hours,
            time_limit_minutes=q_in.timeLimit.minutes,
            time_limit_seconds=q_in.timeLimit.seconds,
            problem_statement=q_in.problemStatement,
            input_format=q_in.inputFormat,
            output_format=q_in.outputFormat,
            constraints=q_in.constraints,
            faulty_code=q_in.faultyCode,
            incomplete_code=q_in.incompleteCode,
            starter_code=q_in.starterCode,
            expected_solution=q_in.expectedSolution,
            error_type=q_in.errorType,
            options=options_data,
            test_cases=test_cases_data,
            created_at=now,
            updated_at=now,
        )

        saved = self.question_repo.create(entity)
        return self._to_admin_response(saved)

    def get_question_by_id(
        self, question_id: str, user_role: UserRole
    ) -> Union[QuestionAdminResponse, QuestionStudentResponse]:
        entity = self.question_repo.get_by_id(question_id)
        if not entity:
            raise NotFoundException(f"Question {question_id} not found")

        if user_role == UserRole.ADMIN:
            return self._to_admin_response(entity)
        else:
            return self._to_student_response(entity)

    def list_questions(
        self, user_role: UserRole
    ) -> List[Union[QuestionAdminResponse, QuestionStudentResponse]]:
        entities = self.question_repo.list_all()
        if user_role == UserRole.ADMIN:
            return [self._to_admin_response(e) for e in entities]
        else:
            # Filter enabled questions for students
            enabled_entities = [e for e in entities if e.enabled]
            return [self._to_student_response(e) for e in enabled_entities]

    def update_question(self, question_id: str, q_update: QuestionUpdate) -> QuestionAdminResponse:
        existing = self.question_repo.get_by_id(question_id)
        if not existing:
            raise NotFoundException(f"Question {question_id} not found")

        data_dict = q_update.model_dump(exclude_unset=True)
        if "options" in data_dict and data_dict["options"] is not None:
            data_dict["options"] = [opt for opt in data_dict["options"]]
        if "testCases" in data_dict and data_dict["testCases"] is not None:
            data_dict["test_cases"] = [tc for tc in data_dict["testCases"]]
            del data_dict["testCases"]
        if "timeLimit" in data_dict and data_dict["timeLimit"] is not None:
            tl = data_dict["timeLimit"]
            data_dict["time_limit_hours"] = tl.get("hours", 0)
            data_dict["time_limit_minutes"] = tl.get("minutes", 0)
            data_dict["time_limit_seconds"] = tl.get("seconds", 0)
            del data_dict["timeLimit"]
        if "maxMarks" in data_dict:
            data_dict["max_marks"] = data_dict.pop("maxMarks")
        if "maxAttempts" in data_dict:
            data_dict["max_attempts"] = data_dict.pop("maxAttempts")
        if "questionType" in data_dict:
            data_dict["question_type"] = data_dict.pop("questionType")
        if "allowedLanguages" in data_dict:
            data_dict["allowed_languages"] = data_dict.pop("allowedLanguages")
        if "problemStatement" in data_dict:
            data_dict["problem_statement"] = data_dict.pop("problemStatement")
        if "inputFormat" in data_dict:
            data_dict["input_format"] = data_dict.pop("inputFormat")
        if "outputFormat" in data_dict:
            data_dict["output_format"] = data_dict.pop("outputFormat")
        if "faultyCode" in data_dict:
            data_dict["faulty_code"] = data_dict.pop("faultyCode")
        if "incompleteCode" in data_dict:
            data_dict["incomplete_code"] = data_dict.pop("incompleteCode")
        if "starterCode" in data_dict:
            data_dict["starter_code"] = data_dict.pop("starterCode")
        if "expectedSolution" in data_dict:
            data_dict["expected_solution"] = data_dict.pop("expectedSolution")
        if "errorType" in data_dict:
            data_dict["error_type"] = data_dict.pop("errorType")

        updated = self.question_repo.update(question_id, data_dict)
        return self._to_admin_response(updated)

    def delete_question(self, question_id: str) -> bool:
        if not self.question_repo.get_by_id(question_id):
            raise NotFoundException(f"Question {question_id} not found")
        return self.question_repo.delete(question_id)

    def set_status(self, question_id: str, enabled: bool) -> QuestionAdminResponse:
        updated = self.question_repo.update(question_id, {"enabled": enabled})
        if not updated:
            raise NotFoundException(f"Question {question_id} not found")
        return self.question_repo.get_by_id(question_id)

    def _to_admin_response(self, entity: QuestionEntity) -> QuestionAdminResponse:
        return QuestionAdminResponse(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            questionType=entity.question_type,
            difficulty=entity.difficulty,
            maxMarks=entity.max_marks,
            maxAttempts=entity.max_attempts,
            allowedLanguages=entity.allowed_languages,
            enabled=entity.enabled,
            run_enabled=entity.run_enabled,
            timeLimit=TimeLimit(
                hours=entity.time_limit_hours,
                minutes=entity.time_limit_minutes,
                seconds=entity.time_limit_seconds,
            ),
            problemStatement=entity.problem_statement,
            inputFormat=entity.input_format,
            outputFormat=entity.output_format,
            constraints=entity.constraints,
            faultyCode=entity.faulty_code,
            incompleteCode=entity.incomplete_code,
            starterCode=entity.starter_code,
            expectedSolution=entity.expected_solution,
            errorType=entity.error_type,
            options=entity.options if entity.options else None,
            testCases=entity.test_cases if entity.test_cases else None,
            createdAt=entity.created_at,
            updatedAt=entity.updated_at,
        )

    def _to_student_response(self, entity: QuestionEntity) -> QuestionStudentResponse:
        # Scrub options: remove isCorrect
        student_options = None
        if entity.options:
            student_options = [
                McqOptionStudent(id=opt["id"], text=opt["text"]) for opt in entity.options
            ]

        # Scrub test cases: remove expectedOutput for hidden test cases
        student_test_cases = None
        if entity.test_cases:
            student_test_cases = [
                TestCaseStudent(
                    id=tc["id"],
                    input=tc["input"],
                    explanation=tc.get("explanation"),
                    isHidden=tc.get("isHidden", False),
                )
                for tc in entity.test_cases
            ]

        return QuestionStudentResponse(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            questionType=entity.question_type,
            difficulty=entity.difficulty,
            maxMarks=entity.max_marks,
            maxAttempts=entity.max_attempts,
            allowedLanguages=entity.allowed_languages,
            enabled=entity.enabled,
            run_enabled=entity.run_enabled,
            timeLimit=TimeLimit(
                hours=entity.time_limit_hours,
                minutes=entity.time_limit_minutes,
                seconds=entity.time_limit_seconds,
            ),
            problemStatement=entity.problem_statement,
            inputFormat=entity.input_format,
            outputFormat=entity.output_format,
            constraints=entity.constraints,
            faultyCode=entity.faulty_code,
            incompleteCode=entity.incomplete_code,
            starterCode=entity.starter_code,
            errorType=entity.error_type,
            options=student_options,
            testCases=student_test_cases,
            createdAt=entity.created_at,
            updatedAt=entity.updated_at,
        )
