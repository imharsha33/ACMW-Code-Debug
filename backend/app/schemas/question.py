from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

class QuestionType(str, Enum):
    ERROR_IDENTIFICATION = "ERROR_IDENTIFICATION"
    OUTPUT_PREDICTION = "OUTPUT_PREDICTION"
    CODE_COMPLETION = "CODE_COMPLETION"
    PROGRAMMING_PROBLEM = "PROGRAMMING_PROBLEM"

class Language(str, Enum):
    PYTHON = "Python"
    JAVA = "Java"
    C = "C"
    CPP = "C++"

class Difficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class QuestionStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    SUBMITTED = "Submitted"
    TIME_EXPIRED = "Time Expired"
    MAX_ATTEMPTS_REACHED = "Max Attempts Reached"
    COMPLETED = "Completed"

class TimeLimit(BaseModel):
    hours: int = Field(default=0, ge=0)
    minutes: int = Field(default=0, ge=0)
    seconds: int = Field(default=0, ge=0)

    def to_seconds(self) -> int:
        return self.hours * 3600 + self.minutes * 60 + self.seconds

class McqOptionAdmin(BaseModel):
    id: str
    text: str
    isCorrect: bool = False

class McqOptionStudent(BaseModel):
    id: str
    text: str

class TestCaseAdmin(BaseModel):
    id: str
    input: str
    expectedOutput: str
    explanation: Optional[str] = None
    isHidden: bool = False

class TestCaseStudent(BaseModel):
    id: str
    input: str
    explanation: Optional[str] = None
    isHidden: bool = False
    # Notice: expectedOutput is excluded if isHidden=True in student transformation

class QuestionBase(BaseModel):
    title: str
    description: str
    questionType: QuestionType
    difficulty: Difficulty = Difficulty.EASY
    maxMarks: int = Field(..., ge=0, description="Configured maximum marks for question")
    maxAttempts: int = Field(..., ge=1, description="Configured max attempts for question")
    allowedLanguages: List[Language] = Field(default_factory=lambda: [Language.PYTHON])
    enabled: bool = True
    run_enabled: bool = Field(default=True, description="Whether Run Code is enabled for this question")
    timeLimit: TimeLimit = Field(default_factory=TimeLimit)
    
    # Question specific fields
    problemStatement: Optional[str] = None
    inputFormat: Optional[str] = None
    outputFormat: Optional[str] = None
    constraints: Optional[str] = None
    
    faultyCode: Optional[Dict[str, str]] = None
    incompleteCode: Optional[Dict[str, str]] = None
    starterCode: Optional[Dict[str, str]] = None
    errorType: Optional[str] = None

class QuestionCreate(QuestionBase):
    options: Optional[List[McqOptionAdmin]] = None
    testCases: Optional[List[TestCaseAdmin]] = None
    expectedSolution: Optional[Dict[str, str]] = None

    @model_validator(mode="after")
    def validate_question_type_requirements(self):
        if self.questionType == QuestionType.OUTPUT_PREDICTION:
            if not self.options or len(self.options) < 2:
                raise ValueError("OUTPUT_PREDICTION question requires at least 2 options")
            correct_count = sum(1 for opt in self.options if opt.isCorrect)
            if correct_count != 1:
                raise ValueError("OUTPUT_PREDICTION question must have exactly 1 correct option")
        elif self.questionType == QuestionType.ERROR_IDENTIFICATION:
            if not self.faultyCode:
                raise ValueError("ERROR_IDENTIFICATION question requires faultyCode")
        elif self.questionType == QuestionType.CODE_COMPLETION:
            if not self.incompleteCode:
                raise ValueError("CODE_COMPLETION question requires incompleteCode")
        elif self.questionType == QuestionType.PROGRAMMING_PROBLEM:
            if not self.problemStatement:
                raise ValueError("PROGRAMMING_PROBLEM question requires problemStatement")
        return self

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questionType: Optional[QuestionType] = None
    difficulty: Optional[Difficulty] = None
    maxMarks: Optional[int] = Field(None, ge=0)
    maxAttempts: Optional[int] = Field(None, ge=1)
    allowedLanguages: Optional[List[Language]] = None
    enabled: Optional[bool] = None
    run_enabled: Optional[bool] = None
    timeLimit: Optional[TimeLimit] = None
    
    problemStatement: Optional[str] = None
    inputFormat: Optional[str] = None
    outputFormat: Optional[str] = None
    constraints: Optional[str] = None
    
    faultyCode: Optional[Dict[str, str]] = None
    incompleteCode: Optional[Dict[str, str]] = None
    starterCode: Optional[Dict[str, str]] = None
    errorType: Optional[str] = None
    
    options: Optional[List[McqOptionAdmin]] = None
    testCases: Optional[List[TestCaseAdmin]] = None
    expectedSolution: Optional[Dict[str, str]] = None

class QuestionAdminResponse(QuestionBase):
    id: str
    options: Optional[List[McqOptionAdmin]] = None
    testCases: Optional[List[TestCaseAdmin]] = None
    expectedSolution: Optional[Dict[str, str]] = None
    createdAt: int
    updatedAt: int

class QuestionStudentResponse(QuestionBase):
    id: str
    options: Optional[List[McqOptionStudent]] = None
    testCases: Optional[List[TestCaseStudent]] = None
    # NOTE: expectedSolution is EXCLUDED
    createdAt: int
    updatedAt: int
