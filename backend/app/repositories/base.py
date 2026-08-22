from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.entities import (
    UserEntity,
    QuestionEntity,
    AssessmentEntity,
    AssessmentAttemptEntity,
    EventEntity,
)

class UserRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, user_id: str) -> Optional[UserEntity]:
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[UserEntity]:
        pass

    @abstractmethod
    def create(self, user: UserEntity) -> UserEntity:
        pass

    @abstractmethod
    def list_all(self) -> List[UserEntity]:
        pass

    @abstractmethod
    def update(self, email: str, data: dict) -> Optional[UserEntity]:
        pass

class QuestionRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, question_id: str) -> Optional[QuestionEntity]:
        pass

    @abstractmethod
    def create(self, question: QuestionEntity) -> QuestionEntity:
        pass

    @abstractmethod
    def update(self, question_id: str, data: dict) -> Optional[QuestionEntity]:
        pass

    @abstractmethod
    def delete(self, question_id: str) -> bool:
        pass

    @abstractmethod
    def list_all(self) -> List[QuestionEntity]:
        pass

class AssessmentRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, assessment_id: str) -> Optional[AssessmentEntity]:
        pass

    @abstractmethod
    def create(self, assessment: AssessmentEntity) -> AssessmentEntity:
        pass

    @abstractmethod
    def update(self, assessment_id: str, data: dict) -> Optional[AssessmentEntity]:
        pass

    @abstractmethod
    def delete(self, assessment_id: str) -> bool:
        pass

    @abstractmethod
    def list_all(self) -> List[AssessmentEntity]:
        pass

class AttemptRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, attempt_id: str) -> Optional[AssessmentAttemptEntity]:
        pass

    @abstractmethod
    def get_by_student_and_assessment(self, student_id: str, assessment_id: str) -> Optional[AssessmentAttemptEntity]:
        pass

    @abstractmethod
    def create(self, attempt: AssessmentAttemptEntity) -> AssessmentAttemptEntity:
        pass

    @abstractmethod
    def update(self, attempt_id: str, data: dict) -> Optional[AssessmentAttemptEntity]:
        pass

    @abstractmethod
    def list_by_student(self, student_id: str) -> List[AssessmentAttemptEntity]:
        pass

    @abstractmethod
    def list_by_assessment(self, assessment_id: str) -> List[AssessmentAttemptEntity]:
        pass

    @abstractmethod
    def list_all(self) -> List[AssessmentAttemptEntity]:
        pass

class EventRepositoryInterface(ABC):
    @abstractmethod
    def create(self, event: EventEntity) -> EventEntity:
        pass

    @abstractmethod
    def list_by_attempt(self, attempt_id: str) -> List[EventEntity]:
        pass
