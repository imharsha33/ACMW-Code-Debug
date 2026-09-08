export type Language = "Python" | "C++" | "Java" | "C";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type QuestionType =
  | "Error Identification"
  | "Output Prediction"
  | "Code Completion"
  | "Programming Problem";

export type QuestionEnabled = "Enabled" | "Disabled";

export type RunCodeSetting = "Enabled" | "Disabled";

export type QuestionStatus =
  | "Not Started"
  | "In Progress"
  | "Submitted"
  | "Time Expired"
  | "Max Attempts Reached"
  | "Completed";

export interface McqOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  problemStatement?: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  maxMarks: number;
  maxAttempts: number;
  allowedLanguages: Language[];
  enabled: QuestionEnabled;
  runCodeSetting: RunCodeSetting;
  timeLimit: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  options?: McqOption[];
  testCases?: TestCase[];
  faultyCode?: Partial<Record<Language, string>>;
  incompleteCode?: Partial<Record<Language, string>>;
  starterCode?: Partial<Record<Language, string>>;
  studentStatus: QuestionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface AssessmentSettings {
  name: string;
  overallTimeLimit: {
    hours: number;
    minutes: number;
    seconds: number;
  };
  overallSubmitThresholdMinutes: number | null;
  fullscreenMode: "Required" | "Disabled" | null;
  tabSwitchMode: "Enforce limit" | "Disabled" | null;
  tabSwitchLimit?: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  questionIds?: string[];
}


export interface UserSession {
  email: string;
  name: string;
  role: "admin" | "student";
}

export interface QuestionRuntime {
  questionId: string;
  selectedLanguage: Language | null;
  code: Partial<Record<Language, string>>;
  selectedOptionId: string | null;
  attemptsUsed: number;
  status: QuestionStatus;
  questionStartedAt: number | null;
  submittedAt: number | null;
  timeExpired: boolean;
  lastOutput: string | null;
}

export interface AssessmentSession {
  startedAt: number | null;
  finalized: boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
  terminatedByViolations: boolean;
}

export function timeLimitToSeconds(limit: { hours: number; minutes: number; seconds: number }): number | null {
  const total = limit.hours * 3600 + limit.minutes * 60 + limit.seconds;
  return total > 0 ? total : null;
}

export function overallTimeToSeconds(limit: { hours: number; minutes: number; seconds: number }): number | null {
  const total = limit.hours * 3600 + limit.minutes * 60 + limit.seconds;
  return total > 0 ? total : null;
}

export interface StudentUser {
  email: string;
  pass: string;
  tabSwitchCount: number;
  isBlocked: boolean;
  examDeviceId?: string | null;   // device currently running the exam (null = nobody)
  testSubmitted?: boolean;
  totalScore?: number;
  maxPossibleScore?: number;
  questionsAnswered?: number;
  totalQuestionsCount?: number;
  activeQuestionTitle?: string;
  lastActiveAt?: number;
}
