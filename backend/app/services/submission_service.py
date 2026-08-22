import time
from typing import Dict, List, Optional
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.models.entities import (
    AssessmentAttemptEntity,
    QuestionAttemptProgress,
    QuestionEntity,
)
from app.schemas.question import QuestionStatus
from app.schemas.submission import QuestionSubmissionRequest, QuestionSubmissionResponse
from app.schemas.result import AssessmentResultResponse, QuestionResultResponse
from app.repositories.base import (
    AttemptRepositoryInterface,
    AssessmentRepositoryInterface,
    QuestionRepositoryInterface,
    UserRepositoryInterface,
)
from app.services.evaluation_service import EvaluationService

class SubmissionService:
    def __init__(
        self,
        attempt_repo: AttemptRepositoryInterface,
        assessment_repo: AssessmentRepositoryInterface,
        question_repo: QuestionRepositoryInterface,
        user_repo: UserRepositoryInterface,
        evaluation_service: EvaluationService,
    ):
        self.attempt_repo = attempt_repo
        self.assessment_repo = assessment_repo
        self.question_repo = question_repo
        self.user_repo = user_repo
        self.evaluation_service = evaluation_service

    def get_or_create_attempt(self, student_id: str, assessment_id: str) -> AssessmentAttemptEntity:
        assessment = self.assessment_repo.get_by_id(assessment_id)
        if not assessment:
            raise NotFoundException(f"Assessment {assessment_id} not found")

        existing = self.attempt_repo.get_by_student_and_assessment(student_id, assessment_id)
        if existing:
            return existing

        now = int(time.time() * 1000)
        total_time_seconds = assessment.time_limit_hours * 3600 + assessment.time_limit_minutes * 60 + assessment.time_limit_seconds
        expires_at = now + (total_time_seconds * 1000) if total_time_seconds > 0 else None

        attempt = AssessmentAttemptEntity(
            id=f"attempt_{student_id}_{assessment_id}",
            assessment_id=assessment_id,
            student_id=student_id,
            started_at=now,
            expires_at=expires_at,
            finalized=False,
            tab_switch_count=0,
            question_progress={},
        )
        return self.attempt_repo.create(attempt)

    def submit_question(
        self,
        student_id: str,
        attempt_id: str,
        question_id: str,
        sub: QuestionSubmissionRequest,
    ) -> QuestionSubmissionResponse:
        now = int(time.time() * 1000)

        # 1. Fetch Attempt
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise NotFoundException(f"Attempt {attempt_id} not found")

        if attempt.student_id != student_id:
            raise ForbiddenException("You do not own this assessment attempt")

        if attempt.finalized:
            raise BadRequestException("Assessment attempt is already finalized and submitted")

        # 2. Check Overall Assessment Expiration Timer on Backend
        if attempt.expires_at and now > attempt.expires_at:
            attempt.finalized = True
            attempt.submitted_at = attempt.expires_at
            self.attempt_repo.update(attempt.id, {"finalized": True, "submitted_at": attempt.expires_at})
            raise BadRequestException("Assessment time limit has expired. Submission rejected.")

        # 3. Fetch Question
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise NotFoundException(f"Question {question_id} not found")

        # 4. Fetch / Initialize Question Progress
        progress = attempt.question_progress.get(question_id)
        if not progress:
            total_q_seconds = question.time_limit_hours * 3600 + question.time_limit_minutes * 60 + question.time_limit_seconds
            q_expires_at = now + (total_q_seconds * 1000) if total_q_seconds > 0 else None
            progress = QuestionAttemptProgress(
                question_id=question_id,
                attempts_used=0,
                earned_marks=0,
                status=QuestionStatus.IN_PROGRESS,
                question_started_at=now,
                question_expires_at=q_expires_at,
            )
            attempt.question_progress[question_id] = progress

        # 5. Check Question Custom Timer Expiration on Backend
        if progress.question_expires_at and now > progress.question_expires_at:
            progress.status = QuestionStatus.TIME_EXPIRED
            self.attempt_repo.update(attempt.id, {"question_progress": attempt.question_progress})
            raise BadRequestException("Question time limit has expired. Submission rejected.")

        # 6. Check Attempts Remaining
        if progress.attempts_used >= question.max_attempts:
            progress.status = QuestionStatus.MAX_ATTEMPTS_REACHED
            self.attempt_repo.update(attempt.id, {"question_progress": attempt.question_progress})
            raise BadRequestException(f"Maximum attempts ({question.max_attempts}) reached for this question.")

        # 7. Consume Attempt & Evaluate
        progress.attempts_used += 1
        earned_marks, feedback = self.evaluation_service.evaluate_submission(question, sub)

        progress.earned_marks = max(progress.earned_marks, earned_marks) # Keep highest score
        progress.selected_language = sub.language
        if sub.code:
            progress.code[sub.language or "Python"] = sub.code
        if sub.selected_option_id:
            progress.selected_option_id = sub.selected_option_id
        progress.submitted_at = now

        if progress.attempts_used >= question.max_attempts:
            progress.status = QuestionStatus.MAX_ATTEMPTS_REACHED
        else:
            progress.status = QuestionStatus.SUBMITTED

        self.attempt_repo.update(attempt.id, {"question_progress": attempt.question_progress})

        attempts_remaining = max(0, question.max_attempts - progress.attempts_used)

        return QuestionSubmissionResponse(
            attempt_id=attempt.id,
            question_id=question_id,
            status=progress.status,
            earned_marks=progress.earned_marks,
            maximum_marks=question.max_marks,
            attempts_used=progress.attempts_used,
            attempts_remaining=attempts_remaining,
            feedback=feedback,
        )

    def finalize_attempt(self, student_id: str, attempt_id: str) -> AssessmentResultResponse:
        now = int(time.time() * 1000)
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise NotFoundException(f"Attempt {attempt_id} not found")

        if attempt.student_id != student_id:
            raise ForbiddenException("You do not own this attempt")

        attempt.finalized = True
        attempt.submitted_at = now
        self.attempt_repo.update(attempt.id, {"finalized": True, "submitted_at": now})

        return self.get_attempt_result(attempt_id)

    def get_attempt_result(self, attempt_id: str) -> AssessmentResultResponse:
        attempt = self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise NotFoundException(f"Attempt {attempt_id} not found")

        assessment = self.assessment_repo.get_by_id(attempt.assessment_id)
        assessment_title = assessment.title if assessment else "Assessment"
        
        student = self.user_repo.get_by_id(attempt.student_id)
        student_name = student.name if student else "Student"
        student_email = student.email if student else "student@klu.in"

        question_results: List[QuestionResultResponse] = []
        total_earned = 0
        total_max = 0

        # Calculate TOTAL score across all questions in assessment
        if assessment:
            for q_id in assessment.question_ids:
                q = self.question_repo.get_by_id(q_id)
                if not q:
                    continue
                q_max = q.max_marks
                prog = attempt.question_progress.get(q_id)
                if prog:
                    q_earned = prog.earned_marks
                    q_attempts = prog.attempts_used
                    q_status = prog.status
                else:
                    q_earned = 0
                    q_attempts = 0
                    q_status = QuestionStatus.NOT_STARTED

                total_earned += q_earned
                total_max += q_max

                question_results.append(
                    QuestionResultResponse(
                        question_id=q_id,
                        question_title=q.title,
                        earned_marks=q_earned,
                        maximum_marks=q_max,
                        attempts_used=q_attempts,
                        status=q_status,
                    )
                )

        percentage = round((total_earned / total_max * 100.0), 2) if total_max > 0 else 0.0

        return AssessmentResultResponse(
            attempt_id=attempt.id,
            assessment_id=attempt.assessment_id,
            assessment_title=assessment_title,
            student_id=attempt.student_id,
            student_name=student_name,
            student_email=student_email,
            total_earned_marks=total_earned,
            total_maximum_marks=total_max,
            percentage=percentage,
            finalized=attempt.finalized,
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at,
            tab_switch_count=attempt.tab_switch_count,
            question_results=question_results,
        )
