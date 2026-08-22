import time
import threading
from typing import Dict, List, Optional
from app.config import settings
from app.core.security import get_password_hash
from app.schemas.user import UserRole
from app.schemas.question import QuestionType, Difficulty, Language, QuestionStatus
from app.schemas.assessment import FullscreenMode, TabSwitchingMode, AssessmentStatus
from app.models.entities import (
    UserEntity,
    QuestionEntity,
    AssessmentEntity,
    AssessmentAttemptEntity,
    QuestionAttemptProgress,
    EventEntity,
)
from app.repositories.base import (
    UserRepositoryInterface,
    QuestionRepositoryInterface,
    AssessmentRepositoryInterface,
    AttemptRepositoryInterface,
    EventRepositoryInterface,
)

class MemoryStore:
    """Thread-safe in-memory store singleton for temporary storage."""
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MemoryStore, cls).__new__(cls)
                cls._instance._init_store()
            return cls._instance

    def _init_store(self):
        self.lock = threading.Lock()
        self.users: Dict[str, UserEntity] = {}
        self.questions: Dict[str, QuestionEntity] = {}
        self.assessments: Dict[str, AssessmentEntity] = {}
        self.attempts: Dict[str, AssessmentAttemptEntity] = {}
        self.events: List[EventEntity] = []

        self._seed_initial_data()

    def _seed_initial_data(self):
        # 1. Admin User
        admin_id = "user_admin"
        self.users[admin_id] = UserEntity(
            id=admin_id,
            email=settings.ADMIN_EMAIL.lower().strip(),
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            name="Club Admin",
            role=UserRole.ADMIN,
        )

        # 2. Default Student User
        student_id = "user_student_1"
        self.users[student_id] = UserEntity(
            id=student_id,
            email=settings.STUDENT_EMAIL.lower().strip(),
            hashed_password=get_password_hash(settings.STUDENT_PASSWORD),
            name="Candidate Student",
            role=UserRole.STUDENT,
        )

        # 3. Seed Sample Questions
        now = int(time.time() * 1000)

        # Q1: Programming Problem
        q1 = QuestionEntity(
            id="q1",
            title="Palindrome Number Checker",
            description="Given an integer x, return true if x is a palindrome, and false otherwise.",
            question_type=QuestionType.PROGRAMMING_PROBLEM,
            difficulty=Difficulty.EASY,
            max_marks=10,
            max_attempts=3,
            allowed_languages=[Language.PYTHON, Language.CPP, Language.JAVA, Language.C],
            enabled=True,
            run_enabled=True,
            time_limit_hours=0,
            time_limit_minutes=15,
            time_limit_seconds=0,
            problem_statement="Write a function/program to determine if an input integer is a palindrome.",
            input_format="Single line containing integer x",
            output_format="Print True or False",
            constraints="-2^31 <= x <= 2^31 - 1",
            starter_code={
                "Python": "def isPalindrome(x: int) -> bool:\n    # Write your solution here\n    pass\n\nval = input()\nif val:\n    print(isPalindrome(int(val)))\n",
                "C++": "#include <iostream>\nusing namespace std;\n\nbool isPalindrome(int x) {\n    // Write your solution here\n    return false;\n}\n\nint main() {\n    int x;\n    if (cin >> x) cout << (isPalindrome(x) ? \"True\" : \"False\");\n    return 0;\n}",
            },

            test_cases=[
                {"id": "tc1", "input": "121", "expectedOutput": "True", "explanation": "121 reads same forward and backward", "isHidden": False},
                {"id": "tc2", "input": "-121", "expectedOutput": "False", "explanation": "Minus sign breaks palindrome", "isHidden": False},
                {"id": "tc3", "input": "10", "expectedOutput": "False", "explanation": "01 != 10", "isHidden": True},
            ],
            created_at=now - 100000,
            updated_at=now - 100000,
        )
        self.questions[q1.id] = q1

        # Q2: Output Prediction
        q2 = QuestionEntity(
            id="q2",
            title="Predict Output: Loop Increment",
            description="Predict the final value of count after executing the provided code snippet.",
            question_type=QuestionType.OUTPUT_PREDICTION,
            difficulty=Difficulty.EASY,
            max_marks=5,
            max_attempts=2,
            allowed_languages=[Language.PYTHON],
            enabled=True,
            run_enabled=False,
            time_limit_hours=0,
            time_limit_minutes=5,
            time_limit_seconds=0,
            problem_statement="Select the option corresponding to the exact output of this loop.",
            starter_code={"Python": "count = 0\nfor i in range(5):\n    count += 3\nprint(count)"},
            options=[
                {"id": "opt1", "text": "count = 10", "isCorrect": False},
                {"id": "opt2", "text": "count = 15", "isCorrect": True},
                {"id": "opt3", "text": "count = 20", "isCorrect": False},
                {"id": "opt4", "text": "Infinite Loop", "isCorrect": False},
            ],
            created_at=now - 50000,
            updated_at=now - 50000,
        )
        self.questions[q2.id] = q2

        # Q3: Error Identification
        q3 = QuestionEntity(
            id="q3",
            title="Fix Off-By-One In Array Loop",
            description="Identify and correct the runtime error in array iteration.",
            question_type=QuestionType.ERROR_IDENTIFICATION,
            difficulty=Difficulty.MEDIUM,
            max_marks=10,
            max_attempts=3,
            allowed_languages=[Language.PYTHON, Language.CPP],
            enabled=True,
            run_enabled=True,
            time_limit_hours=0,
            time_limit_minutes=10,
            time_limit_seconds=0,
            faulty_code={
                "Python": "arr = [10, 20, 30]\nfor i in range(len(arr) + 1):  # Faulty range\n    print(arr[i])",
                "C++": "#include <iostream>\nint main() {\n    int arr[3] = {10, 20, 30};\n    for(int i=0; i<=3; i++) { std::cout << arr[i]; }\n}",
            },
            expected_solution={
                "Python": "arr = [10, 20, 30]\nfor i in range(len(arr)):\n    print(arr[i])",
            },
            error_type="IndexError / Out of bounds access",
            created_at=now - 20000,
            updated_at=now - 20000,
        )
        self.questions[q3.id] = q3

        # Q4: Code Completion
        q4 = QuestionEntity(
            id="q4",
            title="Complete Factorial Function",
            description="Complete the recursive factorial function.",
            question_type=QuestionType.CODE_COMPLETION,
            difficulty=Difficulty.EASY,
            max_marks=8,
            max_attempts=3,
            allowed_languages=[Language.PYTHON],
            enabled=True,
            run_enabled=True,
            time_limit_hours=0,
            time_limit_minutes=10,
            time_limit_seconds=0,
            incomplete_code={
                "Python": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * ### YOUR CODE HERE ###\n\nprint(factorial(int(input())))",
            },
            expected_solution={
                "Python": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(int(input())))",
            },
            test_cases=[
                {"id": "tc1", "input": "5", "expectedOutput": "120", "explanation": "5! = 120", "isHidden": False},
            ],
            created_at=now - 10000,
            updated_at=now - 10000,
        )
        self.questions[q4.id] = q4

        # 4. Seed Initial Assessment
        a1 = AssessmentEntity(
            id="assessment_1",
            title="ACM-W Coding & Debugging Assessment",
            description="Official KARE ACM Student Chapter assessment containing Error Identification, Output Prediction, Code Completion, and Programming Problems.",
            time_limit_hours=1,
            time_limit_minutes=0,
            time_limit_seconds=0,
            overall_submit_threshold=15,
            fullscreen_mode=FullscreenMode.REQUIRED,
            tab_switching_mode=TabSwitchingMode.RESTRICT_FLAG,
            status=AssessmentStatus.ACTIVE,
            question_ids=["q1", "q2", "q3", "q4"],
            created_at=now,
            updated_at=now,
        )
        self.assessments[a1.id] = a1



# Repositories Implementation
class TemporaryUserRepository(UserRepositoryInterface):
    def __init__(self):
        self.store = MemoryStore()

    def get_by_id(self, user_id: str) -> Optional[UserEntity]:
        with self.store.lock:
            return self.store.users.get(user_id)

    def get_by_email(self, email: str) -> Optional[UserEntity]:
        with self.store.lock:
            email_clean = email.lower().strip()
            for user in self.store.users.values():
                if user.email.lower() == email_clean:
                    return user
            return None

    def create(self, user: UserEntity) -> UserEntity:
        with self.store.lock:
            self.store.users[user.id] = user
            return user

    def list_all(self) -> List[UserEntity]:
        with self.store.lock:
            return list(self.store.users.values())

    def update(self, email: str, data: dict) -> Optional[UserEntity]:
        with self.store.lock:
            email_clean = email.lower().strip()
            for user in self.store.users.values():
                if user.email.lower() == email_clean:
                    for key, val in data.items():
                        if hasattr(user, key):
                            setattr(user, key, val)
                    return user
            return None


class TemporaryQuestionRepository(QuestionRepositoryInterface):
    def __init__(self):
        self.store = MemoryStore()

    def get_by_id(self, question_id: str) -> Optional[QuestionEntity]:
        with self.store.lock:
            return self.store.questions.get(question_id)

    def create(self, question: QuestionEntity) -> QuestionEntity:
        with self.store.lock:
            self.store.questions[question.id] = question
            return question

    def update(self, question_id: str, data: dict) -> Optional[QuestionEntity]:
        with self.store.lock:
            q = self.store.questions.get(question_id)
            if not q:
                return None
            for key, value in data.items():
                if hasattr(q, key) and value is not None:
                    setattr(q, key, value)
            q.updated_at = int(time.time() * 1000)
            return q

    def delete(self, question_id: str) -> bool:
        with self.store.lock:
            if question_id in self.store.questions:
                del self.store.questions[question_id]
                return True
            return False

    def list_all(self) -> List[QuestionEntity]:
        with self.store.lock:
            return list(self.store.questions.values())


class TemporaryAssessmentRepository(AssessmentRepositoryInterface):
    def __init__(self):
        self.store = MemoryStore()

    def get_by_id(self, assessment_id: str) -> Optional[AssessmentEntity]:
        with self.store.lock:
            return self.store.assessments.get(assessment_id)

    def create(self, assessment: AssessmentEntity) -> AssessmentEntity:
        with self.store.lock:
            self.store.assessments[assessment.id] = assessment
            return assessment

    def update(self, assessment_id: str, data: dict) -> Optional[AssessmentEntity]:
        with self.store.lock:
            a = self.store.assessments.get(assessment_id)
            if not a:
                return None
            for key, value in data.items():
                if hasattr(a, key) and value is not None:
                    setattr(a, key, value)
            a.updated_at = int(time.time() * 1000)
            return a

    def delete(self, assessment_id: str) -> bool:
        with self.store.lock:
            if assessment_id in self.store.assessments:
                del self.store.assessments[assessment_id]
                return True
            return False

    def list_all(self) -> List[AssessmentEntity]:
        with self.store.lock:
            return list(self.store.assessments.values())


class TemporaryAttemptRepository(AttemptRepositoryInterface):
    def __init__(self):
        self.store = MemoryStore()

    def get_by_id(self, attempt_id: str) -> Optional[AssessmentAttemptEntity]:
        with self.store.lock:
            return self.store.attempts.get(attempt_id)

    def get_by_student_and_assessment(self, student_id: str, assessment_id: str) -> Optional[AssessmentAttemptEntity]:
        with self.store.lock:
            for att in self.store.attempts.values():
                if att.student_id == student_id and att.assessment_id == assessment_id:
                    return att
            return None

    def create(self, attempt: AssessmentAttemptEntity) -> AssessmentAttemptEntity:
        with self.store.lock:
            self.store.attempts[attempt.id] = attempt
            return attempt

    def update(self, attempt_id: str, data: dict) -> Optional[AssessmentAttemptEntity]:
        with self.store.lock:
            att = self.store.attempts.get(attempt_id)
            if not att:
                return None
            for key, value in data.items():
                if hasattr(att, key) and value is not None:
                    setattr(att, key, value)
            return att

    def list_by_student(self, student_id: str) -> List[AssessmentAttemptEntity]:
        with self.store.lock:
            return [att for att in self.store.attempts.values() if att.student_id == student_id]

    def list_by_assessment(self, assessment_id: str) -> List[AssessmentAttemptEntity]:
        with self.store.lock:
            return [att for att in self.store.attempts.values() if att.assessment_id == assessment_id]

    def list_all(self) -> List[AssessmentAttemptEntity]:
        with self.store.lock:
            return list(self.store.attempts.values())


class TemporaryEventRepository(EventRepositoryInterface):
    def __init__(self):
        self.store = MemoryStore()

    def create(self, event: EventEntity) -> EventEntity:
        with self.store.lock:
            self.store.events.append(event)
            return event

    def list_by_attempt(self, attempt_id: str) -> List[EventEntity]:
        with self.store.lock:
            return [e for e in self.store.events if e.attempt_id == attempt_id]
