import React, { createContext, useContext, useState, useEffect } from "react";
import { apiLogin, apiFetchQuestions, apiRecordEvent } from "../services/api";
import { auth, db, seedStudentAuthViaRestApi } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import type {
  AssessmentSettings,
  AssessmentSession,
  Question,
  QuestionRuntime,
  UserSession,
  StudentUser,
} from "../types";

interface AppContextType {
  session: UserSession | null;
  login: (email: string, pass: string) => Promise<{ ok: boolean; role: "admin" | "student"; error?: string }>;
  logout: () => void;

  questions: Question[];
  addQuestion: (q: Omit<Question, "id" | "createdAt" | "updatedAt" | "studentStatus">) => Promise<string>;
  updateQuestion: (id: string, q: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  syncAllQuestionsToFirestore: () => Promise<void>;

  assessmentSettings: AssessmentSettings;
  updateAssessmentSettings: (s: Partial<AssessmentSettings>) => Promise<void>;

  assessmentSession: AssessmentSession;
  startAssessment: () => Promise<{ ok: boolean; error?: string }>;
  finalizeAssessment: () => Promise<void>;
  recordTabSwitch: () => { terminated: boolean; count: number };
  adminResetViolations: () => void;

  runtimes: Record<string, QuestionRuntime>;
  getRuntime: (questionId: string) => QuestionRuntime;
  updateRuntime: (questionId: string, partial: Partial<QuestionRuntime>) => void;
  ensureRuntimeStarted: (questionId: string) => void;

  registeredStudents: StudentUser[];
  addStudentUser: (email: string, pass: string) => Promise<void>;
  deleteStudentUser: (email: string) => Promise<void>;
  adminResetStudentViolations: (email: string) => Promise<void>;
  syncLiveStudentProgress: (customRuntimes?: Record<string, QuestionRuntime>, activeQuestionTitle?: string) => Promise<void>;
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Factorial Calculation",
    description: "Given a non-negative integer n, calculate and return its factorial (n!).\nLogic: n! = 1 × 2 × 3 × ... × n (with 0! = 1)",
    problemStatement: "Write a program to compute the factorial of an integer n provided on standard input.",
    inputFormat: "Single line containing integer n",
    outputFormat: "Print the factorial value",
    constraints: "0 <= n <= 12",
    questionType: "Programming Problem",
    difficulty: "Easy",
    maxMarks: 10,
    maxAttempts: 3,
    allowedLanguages: ["Python", "C++", "Java", "C"],
    enabled: "Enabled",
    runCodeSetting: "Enabled",
    timeLimit: { hours: 0, minutes: 15, seconds: 0 },
    testCases: [
      { id: "tc1", input: "5", expectedOutput: "120", isHidden: false },
      { id: "tc2", input: "0", expectedOutput: "1", isHidden: true },
      { id: "tc3", input: "1", expectedOutput: "1", isHidden: true },
      { id: "tc4", input: "3", expectedOutput: "6", isHidden: true },
      { id: "tc5", input: "10", expectedOutput: "3628800", isHidden: true },
    ],
    starterCode: {
      Python: "import math\nn = int(input())\nresult = math.factorial(n)\nprint(result)",
      "C++": "#include <iostream>\nusing namespace std;\n\nlong long factorial(int n) {\n    long long ans = 1;\n    for (int i = 1; i <= n; i++) ans *= i;\n    return ans;\n}\n\nint main() {\n    int n;\n    if (cin >> n) cout << factorial(n);\n    return 0;\n}",
      Java: "import java.util.Scanner;\n\npublic class Solution {\n    public static long factorial(int n) {\n        long ans = 1;\n        for (int i = 1; i <= n; i++) ans *= i;\n        return ans;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) System.out.println(factorial(sc.nextInt()));\n    }\n}",
      C: "#include <stdio.h>\n\nlong long factorial(int n) {\n    long long ans = 1;\n    for (int i = 1; i <= n; i++) ans *= i;\n    return ans;\n}\n\nint main() {\n    int n;\n    if (scanf(\"%d\", &n) == 1) printf(\"%lld\\n\", factorial(n));\n    return 0;\n}",
    },
    studentStatus: "Not Started",
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: "q2",
    title: "Predict Output: Loop Increment",
    description: "Predict the final value of `count` after executing the provided code snippet.",
    problemStatement: "Select the option corresponding to the exact output of this loop.",
    questionType: "Output Prediction",
    difficulty: "Easy",
    maxMarks: 5,
    maxAttempts: 2,
    allowedLanguages: ["Python"],
    enabled: "Enabled",
    runCodeSetting: "Disabled",
    timeLimit: { hours: 0, minutes: 5, seconds: 0 },
    options: [
      { id: "opt1", text: "count = 10", isCorrect: false },
      { id: "opt2", text: "count = 15", isCorrect: true },
      { id: "opt3", text: "count = 20", isCorrect: false },
      { id: "opt4", text: "Infinite Loop", isCorrect: false },
    ],
    studentStatus: "Not Started",
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
  },
];

const DEFAULT_SETTINGS: AssessmentSettings = {
  name: "ACM-W Coding & Debugging Assessment",
  overallTimeLimit: { hours: 1, minutes: 0, seconds: 0 },
  overallSubmitThresholdMinutes: 15,
  fullscreenMode: "Required",
  tabSwitchMode: "Enforce limit",
  startDate: "2026-08-22",
  startTime: "09:00",
  endDate: "2026-08-22",
  endTime: "21:00",
};


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("herizon_session");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem("acmw_questions");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_QUESTIONS;
  });
  const [assessmentSettings, setAssessmentSettings] = useState<AssessmentSettings>(() => {
    const saved = localStorage.getItem("acmw_assessment_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("acmw_assessment_settings", JSON.stringify(assessmentSettings));
    } catch {}
  }, [assessmentSettings]);

  // Per-student assessment session — keyed by student email to prevent cross-student data leak
  const [assessmentSession, setAssessmentSession] = useState<AssessmentSession>(() => {
    // Attempt to restore from session's namespaced key (email not yet known at cold start; restored on login)
    return {
      startedAt: null,
      finalized: false,
      tabSwitchCount: 0,
      maxTabSwitches: DEFAULT_SETTINGS.tabSwitchLimit ?? 3,
      terminatedByViolations: false,
    };
  });

  // Sync assessmentSession to localStorage — written in login() with user-specific key
  // (no global useEffect here to avoid accidentally writing one user's session over another's key)

  // Per-student runtimes — keyed by student email so Student A and B never share code
  const [runtimes, setRuntimes] = useState<Record<string, QuestionRuntime>>({});

  // Debounced per-user runtimes sync — key is computed from current session
  useEffect(() => {
    if (!session?.email) return;
    const userKey = `acmw_runtimes_${session.email.toLowerCase().trim()}`;
    const handler = setTimeout(() => {
      try {
        localStorage.setItem(userKey, JSON.stringify(runtimes));
      } catch {}
    }, 300);
    return () => clearTimeout(handler);
  }, [runtimes, session?.email]);

  const [localDeviceId] = useState(() => {
    let id = localStorage.getItem("acmw_local_device_id");
    if (!id) {
      id = "device_" + Math.random().toString(36).substring(2) + "_" + Date.now();
      localStorage.setItem("acmw_local_device_id", id);
    }
    return id;
  });

  const [registeredStudents, setRegisteredStudents] = useState<StudentUser[]>(() => {
    const saved = localStorage.getItem("acmw_registered_students");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        email: "99240041076@klu.ac.in",
        pass: "99240041076",
        tabSwitchCount: 0,
        isBlocked: false,
        examDeviceId: null,
        testSubmitted: false,
        totalScore: 0,
        maxPossibleScore: 15,
        questionsAnswered: 0,
        totalQuestionsCount: 2,
      },
    ];
  });

  const syncStudentToFirestore = async (student: StudentUser) => {
    try {
      if (!db) return;
      const docRef = doc(db, "students", student.email.toLowerCase().trim());
      await setDoc(docRef, {
        pass: student.pass,
        tabSwitchCount: student.tabSwitchCount ?? 0,
        isBlocked: student.isBlocked ?? false,
        examDeviceId: student.examDeviceId ?? null,
        testSubmitted: student.testSubmitted ?? false,
        totalScore: student.totalScore ?? 0,
        maxPossibleScore: student.maxPossibleScore ?? 0,
        questionsAnswered: student.questionsAnswered ?? 0,
        totalQuestionsCount: student.totalQuestionsCount ?? 0,
        activeQuestionTitle: student.activeQuestionTitle ?? null,
        lastActiveAt: student.lastActiveAt ?? Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Failed to sync student to Firestore:", err);
    }
  };

  const deleteStudentFromFirestore = async (email: string) => {
    if (!db) return;
    try {
      const lower = email.toLowerCase().trim();
      const docRef = doc(db, "students", lower);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Failed to delete student from Firestore:", err);
    }
  };

  useEffect(() => {
    if (!db) return;

    let unsubscribeFn: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 3000; // ms, doubles each retry up to 30s
    let active = true;

    const setupListener = () => {
      if (!active) return;
      try {
        unsubscribeFn = onSnapshot(
          collection(db, "students"),
          (snapshot) => {
            // Reset retry delay on success
            retryDelay = 3000;

            const list: StudentUser[] = [];
            snapshot.forEach((d) => {
              const data = d.data();
              list.push({
                email: d.id.toLowerCase().trim(),
                pass: data.pass ?? "",
                tabSwitchCount: data.tabSwitchCount ?? 0,
                isBlocked: data.isBlocked ?? false,
                examDeviceId: data.examDeviceId ?? null,
                testSubmitted: data.testSubmitted ?? false,
                totalScore: data.totalScore ?? 0,
                maxPossibleScore: data.maxPossibleScore ?? 0,
                questionsAnswered: data.questionsAnswered ?? 0,
                totalQuestionsCount: data.totalQuestionsCount ?? 0,
                activeQuestionTitle: data.activeQuestionTitle ?? undefined,
                lastActiveAt: data.lastActiveAt ?? undefined,
              });
            });

            // Always update state — even if list is empty (collection cleared)
            setRegisteredStudents(list);
            localStorage.setItem("acmw_registered_students", JSON.stringify(list));
          },
          (err) => {
            console.error("Firestore onSnapshot failed (check Security Rules):", err.code, err.message);
            // Retry with backoff — common cause is transient auth token refresh
            if (active) {
              retryTimeout = setTimeout(() => {
                retryDelay = Math.min(retryDelay * 2, 30000);
                if (unsubscribeFn) { try { unsubscribeFn(); } catch {} }
                setupListener();
              }, retryDelay);
            }
          }
        );
      } catch (e) {
        console.warn("Error setting up Firestore listener:", e);
      }
    };

    setupListener();

    return () => {
      active = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (unsubscribeFn) { try { unsubscribeFn(); } catch {} }
    };
  }, []);

  // Real-time Firestore sync for Questions bank across ALL devices (Admin & Students)
  useEffect(() => {
    if (!db) return;

    let unsubscribeFn: (() => void) | null = null;
    try {
      unsubscribeFn = onSnapshot(
        collection(db, "questions"),
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed DEFAULT_QUESTIONS into Firestore if collection is empty
            console.log("Seeding default questions into Firestore...");
            for (const q of DEFAULT_QUESTIONS) {
              try {
                await setDoc(doc(db, "questions", q.id), q);
              } catch (e) {
                console.warn("Error seeding default question:", e);
              }
            }
            return;
          }

          const list: Question[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Question;
            list.push({ ...data, id: d.id });
          });

          // Sort by createdAt descending
          list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

          setQuestions(list);
          try {
            localStorage.setItem("acmw_questions", JSON.stringify(list));
          } catch {}
        },
        (err) => {
          console.warn("Firestore questions onSnapshot warning:", err.message);
        }
      );
    } catch (err) {
      console.warn("Failed to subscribe to questions collection:", err);
    }

    return () => {
      if (unsubscribeFn) { try { unsubscribeFn(); } catch {} }
    };
  }, []);

  // Real-time Firestore sync for Assessment Schedule & Rules across ALL devices (Admin & Students)
  useEffect(() => {
    if (!db) return;

    let unsubscribeFn: (() => void) | null = null;
    try {
      const docRef = doc(db, "assessmentSettings", "global");
      unsubscribeFn = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AssessmentSettings;
            setAssessmentSettings(data);
            try {
              localStorage.setItem("acmw_assessment_settings", JSON.stringify(data));
            } catch {}
          }
          // If doc doesn't exist: keep existing localStorage/default settings.
          // Do NOT attempt setDoc here — students lack write permission and it fails silently.
          // The admin's first "Save Configurations" click will create the document.
        },
        (err) => {
          console.warn("Firestore assessmentSettings onSnapshot warning:", err.message);
        }
      );
    } catch (err) {
      console.warn("Failed to subscribe to assessmentSettings doc:", err);
    }

    return () => {
      if (unsubscribeFn) { try { unsubscribeFn(); } catch {} }
    };
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem("acmw_registered_students", JSON.stringify(registeredStudents));
    } catch {}
  }, [registeredStudents]);

  // One-time startup seed: pre-register ALL existing students in Firebase Auth via REST API.
  // This ensures the default student and any previously-added students get flash logins
  // (signInWithEmailAndPassword ~300ms) without ever hitting the slow on-demand creation path.
  const startupSeedDoneRef = React.useRef(false);
  useEffect(() => {
    if (startupSeedDoneRef.current) return;        // Only run once
    if (registeredStudents.length === 0) return;   // Wait until list is populated

    startupSeedDoneRef.current = true;

    registeredStudents.forEach((student) => {
      if (!student.email || !student.pass) return;
      // Skip the admin account — it's managed separately
      if (student.email.toLowerCase().trim() === "acmw@kare.klu.in") return;

      // Fire-and-forget: seed in Firebase Auth using REST API (no session interference)
      seedStudentAuthViaRestApi(student.email, student.pass).catch(() => {});
    });
  }, [registeredStudents]);


  // Stable ref to localDeviceId so effects always see the current value
  const localDeviceIdRef = React.useRef(localDeviceId);
  localDeviceIdRef.current = localDeviceId;

  // Background monitor: react to real-time Firestore changes
  useEffect(() => {
    if (!session || session.role !== "student") return;
    const lower = session.email.toLowerCase().trim();
    const currentStudent = registeredStudents.find(
      (s) => s.email.toLowerCase().trim() === lower
    );

    if (!currentStudent) return;

    // 1. Sync block status → terminates exam immediately if admin blocks
    if (currentStudent.isBlocked !== assessmentSession.terminatedByViolations) {
      setAssessmentSession((prev) => ({ ...prev, terminatedByViolations: currentStudent.isBlocked }));
    }

    // 2. Sync tab switch count
    if (currentStudent.tabSwitchCount !== assessmentSession.tabSwitchCount) {
      setAssessmentSession((prev) => ({ ...prev, tabSwitchCount: currentStudent.tabSwitchCount }));
    }

    // 3. Sync testSubmitted → finalized
    if (currentStudent.testSubmitted && !assessmentSession.finalized) {
      setAssessmentSession((prev) => ({ ...prev, finalized: true }));
    }

    // 4. Exam device lock: if the exam is actively running HERE and another device
    //    claims the examDeviceId, terminate this session immediately.
    const isActivelyTakingExam = !!assessmentSession.startedAt && !assessmentSession.finalized && !assessmentSession.terminatedByViolations;
    if (
      isActivelyTakingExam &&
      currentStudent.examDeviceId &&
      currentStudent.examDeviceId !== localDeviceIdRef.current
    ) {
      // Another device has taken over the exam slot — terminate this session
      setAssessmentSession((prev) => ({ ...prev, terminatedByViolations: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredStudents]);

  const addStudentUser = async (email: string, pass: string) => {
    const lower = email.toLowerCase().trim();
    const newStudent: StudentUser = {
      email: lower,
      pass,
      tabSwitchCount: 0,
      isBlocked: false,
      examDeviceId: null,
      testSubmitted: false,
    };

    setRegisteredStudents((prev) => {
      if (prev.some((s) => s.email.toLowerCase().trim() === lower)) {
        return prev.map((s) => s.email.toLowerCase().trim() === lower ? { ...s, pass } : s);
      }
      return [...prev, newStudent];
    });

    // Run Firestore write AND Firebase Auth pre-seeding concurrently.
    // Pre-seeding via REST API (~200ms) ensures students can login instantly
    // via signInWithEmailAndPassword without the slow on-demand creation fallback (~3s).
    await Promise.all([
      syncStudentToFirestore(newStudent),
      seedStudentAuthViaRestApi(lower, pass).then((res) => {
        if (!res.ok) console.warn("Auth pre-seed failed (will fallback on first login):", res.error);
      }),
    ]);
  };

  const deleteStudentUser = async (email: string) => {
    const lower = email.toLowerCase().trim();
    setRegisteredStudents((prev) => prev.filter((s) => s.email.toLowerCase().trim() !== lower));
    await deleteStudentFromFirestore(lower);
  };

  const login = async (email: string, pass: string) => {
    const lower = email.toLowerCase().trim();
    const isAdminCredentials = (lower === "acmw@kare.klu.in" && pass === "acmw@2026w");
    const isDefaultStudentCredentials = (lower === "99240041076@klu.ac.in" && pass === "99240041076");

    // Admin direct path
    if (isAdminCredentials) {
      try {
        await signInWithEmailAndPassword(auth, lower, pass);
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          try {
            await createUserWithEmailAndPassword(auth, lower, pass);
          } catch (createErr: any) {
            console.error("Admin auto-seed failed:", createErr);
          }
        }
      }
      const sess: UserSession = { email: lower, name: "Club Admin", role: "admin" };
      setSession(sess);
      localStorage.setItem("herizon_session", JSON.stringify(sess));
      setRuntimes({});
      return { ok: true, role: "admin" as const };
    }

    // Trigger Firestore read and Firebase Auth concurrently
    const docRef = doc(db, "students", lower);
    const [authResult, dbResult] = await Promise.allSettled([
      signInWithEmailAndPassword(auth, lower, pass),
      getDoc(docRef),
    ]);

    let firestoreData: StudentUser | null = null;
    if (dbResult.status === "fulfilled" && dbResult.value.exists()) {
      const d = dbResult.value.data();
      firestoreData = {
        email: lower,
        pass: d.pass ?? "",
        tabSwitchCount: d.tabSwitchCount ?? 0,
        isBlocked: d.isBlocked ?? false,
        examDeviceId: d.examDeviceId ?? null,
        testSubmitted: d.testSubmitted ?? false,
        totalScore: d.totalScore ?? 0,
        maxPossibleScore: d.maxPossibleScore ?? 0,
        questionsAnswered: d.questionsAnswered ?? 0,
        totalQuestionsCount: d.totalQuestionsCount ?? 0,
        activeQuestionTitle: d.activeQuestionTitle ?? undefined,
        lastActiveAt: d.lastActiveAt ?? undefined,
      };
    }

    const localRecord = registeredStudents.find((s) => s.email.toLowerCase().trim() === lower);
    const canonicalRecord: StudentUser | null = firestoreData ?? localRecord ?? (isDefaultStudentCredentials ? {
      email: lower,
      pass: "99240041076",
      tabSwitchCount: 0,
      isBlocked: false,
      examDeviceId: null,
      testSubmitted: false,
      totalScore: 0,
      maxPossibleScore: 15,
      questionsAnswered: 0,
      totalQuestionsCount: 2,
    } : null);

    if (!canonicalRecord) {
      return { ok: false, role: "student" as const, error: "Invalid login credentials. Only registered candidates can access the portal." };
    }

    if (pass !== canonicalRecord.pass) {
      return { ok: false, role: "student" as const, error: "Incorrect password. Please enter the password assigned by the coordinator." };
    }

    if (canonicalRecord.isBlocked) {
      return {
        ok: false,
        role: "student" as const,
        error: "Your account has been blocked by the administrator due to proctoring violations. Please contact the exam coordinator to get unblocked.",
      };
    }

    if (authResult.status === "rejected") {
      const err = authResult.reason;
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, lower, pass);
        } catch (createErr: any) {
          console.error("On-demand candidate registration failed:", createErr);
          return { ok: false, role: "student" as const, error: "Candidate Auth registration failed. Please contact the administrator." };
        }
      } else {
        return { ok: false, role: "student" as const, error: err.message || "Authentication failed." };
      }
    }

    const updatedRecord: StudentUser = { ...canonicalRecord, pass };

    setRegisteredStudents((prev) => {
      const exists = prev.some((s) => s.email.toLowerCase().trim() === lower);
      if (exists) {
        return prev.map((s) =>
          s.email.toLowerCase().trim() === lower ? updatedRecord : s
        );
      }
      return [...prev, updatedRecord];
    });

    syncStudentToFirestore(updatedRecord).catch((syncErr) => {
      console.warn("Background student login sync failed:", syncErr);
    });

    const name = lower.split("@")[0].replace(".", " ").replace(/\d+/g, "").trim();
    const studentName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "Student";

    const sess: UserSession = { email: lower, name: studentName, role: "student" };
    setSession(sess);
    localStorage.setItem("herizon_session", JSON.stringify(sess));

    const userRuntimeKey = `acmw_runtimes_${lower}`;
    try {
      const savedRuntimes = localStorage.getItem(userRuntimeKey);
      setRuntimes(savedRuntimes ? JSON.parse(savedRuntimes) : {});
    } catch {
      setRuntimes({});
    }

    const userSessionKey = `acmw_assessment_session_${lower}`;
    try {
      const savedSession = localStorage.getItem(userSessionKey);
      if (savedSession) {
        setAssessmentSession(JSON.parse(savedSession));
      } else {
        setAssessmentSession({
          startedAt: null,
          finalized: updatedRecord.testSubmitted ?? false,
          tabSwitchCount: updatedRecord.tabSwitchCount,
          maxTabSwitches: assessmentSettings.tabSwitchLimit ?? 3,
          terminatedByViolations: false,
        });
      }
    } catch {
      setAssessmentSession({
        startedAt: null,
        finalized: updatedRecord.testSubmitted ?? false,
        tabSwitchCount: updatedRecord.tabSwitchCount,
        maxTabSwitches: assessmentSettings.tabSwitchLimit ?? 3,
        terminatedByViolations: false,
      });
    }

    return { ok: true, role: "student" as const };
  };

  function logout() {
    setRuntimes({});
    setAssessmentSession({
      startedAt: null,
      finalized: false,
      tabSwitchCount: 0,
      maxTabSwitches: DEFAULT_SETTINGS.tabSwitchLimit ?? 3,
      terminatedByViolations: false,
    });
    setSession(null);
    localStorage.removeItem("herizon_session");
  }

  const addQuestion = async (q: Omit<Question, "id" | "createdAt" | "updatedAt" | "studentStatus">): Promise<string> => {
    const newId = "q_" + crypto.randomUUID();
    const newQ: Question = {
      ...q,
      id: newId,
      studentStatus: "Not Started",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setQuestions((prev) => [newQ, ...prev]);

    if (db) {
      await setDoc(doc(db, "questions", newId), newQ);
    }
    return newId;
  };

  const updateQuestion = async (id: string, q: Partial<Question>) => {
    const target = questions.find((item) => item.id === id);
    const updated = { ...(target || {}), ...q, updatedAt: Date.now() } as Question;

    setQuestions((prev) =>
      prev.map((item) => (item.id === id ? updated : item))
    );

    if (db) {
      await setDoc(doc(db, "questions", id), updated, { merge: true });
    }
  };

  const deleteQuestion = async (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));

    if (db) {
      await deleteDoc(doc(db, "questions", id));
    }
  };

  const syncAllQuestionsToFirestore = async () => {
    if (!db) return;
    const promises = questions.map((q) => setDoc(doc(db, "questions", q.id), { ...q, updatedAt: Date.now() }, { merge: true }));
    await Promise.all(promises);
  };

  const updateAssessmentSettings = async (s: Partial<AssessmentSettings>): Promise<void> => {
    let updatedSettings: AssessmentSettings = { ...assessmentSettings, ...s };

    setAssessmentSettings(updatedSettings);
    try {
      localStorage.setItem("acmw_assessment_settings", JSON.stringify(updatedSettings));
    } catch {}

    if (s.tabSwitchLimit !== undefined) {
      setAssessmentSession((curr) => ({
        ...curr,
        maxTabSwitches: s.tabSwitchLimit!,
        terminatedByViolations: curr.tabSwitchCount >= s.tabSwitchLimit!,
      }));
    }

    if (db) {
      await setDoc(doc(db, "assessmentSettings", "global"), updatedSettings, { merge: true });
    }
  };

  const adminResetStudentViolations = async (email: string) => {
    const lower = email.toLowerCase().trim();
    setRegisteredStudents((prev) =>
      prev.map((s) =>
        s.email.toLowerCase().trim() === lower
          ? { ...s, tabSwitchCount: 0, isBlocked: false, testSubmitted: false, examDeviceId: null }
          : s
      )
    );
    if (session && session.email.toLowerCase().trim() === lower) {
      setAssessmentSession((prev) => ({
        ...prev,
        tabSwitchCount: 0,
        terminatedByViolations: false,
        finalized: false,
      }));
      try {
        const userSessionKey = `acmw_assessment_session_${lower}`;
        const saved = localStorage.getItem(userSessionKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem(userSessionKey, JSON.stringify({
            ...parsed,
            tabSwitchCount: 0,
            terminatedByViolations: false,
            finalized: false,
          }));
        }
      } catch {}
    }

    const student = registeredStudents.find((s) => s.email.toLowerCase().trim() === lower);
    if (student) {
      await syncStudentToFirestore({
        ...student,
        tabSwitchCount: 0,
        isBlocked: false,
        testSubmitted: false,
        examDeviceId: null,
      });
    }
  };

  const syncLiveStudentProgress = async (
    customRuntimes?: Record<string, QuestionRuntime>,
    activeQuestionTitle?: string
  ) => {
    if (!session || session.role !== "student") return;
    const lower = session.email.toLowerCase().trim();
    const effectiveRuntimes = customRuntimes ?? runtimes;

    let earnedMarks = 0;
    let totalMarks = 0;
    let answeredCount = 0;
    const enabledQuestions = questions.filter((q) => q.enabled === "Enabled");
    const totalCount = enabledQuestions.length;

    enabledQuestions.forEach((q) => {
      totalMarks += q.maxMarks;
      const rt = effectiveRuntimes[q.id];
      if (!rt) return;

      if (q.questionType === "Output Prediction") {
        if (rt.selectedOptionId) {
          answeredCount++;
          const correctOpt = q.options?.find((o) => o.isCorrect);
          if (correctOpt && rt.selectedOptionId === correctOpt.id) {
            earnedMarks += q.maxMarks;
          }
        }
      } else {
        if (rt.status === "Submitted" || rt.status === "Completed" || (rt.lastOutput && rt.lastOutput.length > 0)) {
          answeredCount++;
        }
        if (rt.lastOutput && (rt.lastOutput.includes("SUCCESS (All") || rt.lastOutput.includes("HURRAY! YOU DID IT"))) {
          earnedMarks += q.maxMarks;
        }
      }
    });

    const currentStudent = registeredStudents.find(
      (s) => s.email.toLowerCase().trim() === lower
    );

    const updatedStudent: StudentUser = {
      ...(currentStudent ?? { email: lower, pass: "", tabSwitchCount: 0, isBlocked: false, testSubmitted: false }),
      totalScore: earnedMarks,
      maxPossibleScore: totalMarks || 100,
      questionsAnswered: answeredCount,
      totalQuestionsCount: totalCount,
      activeQuestionTitle: activeQuestionTitle ?? currentStudent?.activeQuestionTitle,
      lastActiveAt: Date.now(),
    };

    setRegisteredStudents((prev) =>
      prev.map((s) => (s.email.toLowerCase().trim() === lower ? updatedStudent : s))
    );

    await syncStudentToFirestore(updatedStudent);
  };

  const startAssessment = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!session || session.role !== "student") {
      return { ok: false, error: "Not authenticated as a student." };
    }
    const lower = session.email.toLowerCase().trim();

    try {
      const docRef = doc(db, "students", lower);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        const currentExamDevice = d.examDeviceId ?? null;
        if (currentExamDevice && currentExamDevice !== localDeviceId) {
          return {
            ok: false,
            error: "This assessment is already active on another device. You cannot start it here. Please contact the administrator if this is an error.",
          };
        }
      }
    } catch (err) {
      console.warn("Could not verify exam device from Firestore:", err);
    }

    const student = registeredStudents.find((s) => s.email.toLowerCase().trim() === lower);
    const updatedStudent: StudentUser = {
      ...(student ?? { email: lower, pass: "", tabSwitchCount: 0, isBlocked: false, testSubmitted: false }),
      examDeviceId: localDeviceId,
      isBlocked: false,
      tabSwitchCount: assessmentSession.tabSwitchCount ?? 0,
      lastActiveAt: Date.now(),
    };

    setRegisteredStudents((prev) =>
      prev.map((s) => s.email.toLowerCase().trim() === lower ? updatedStudent : s)
    );
    await syncStudentToFirestore(updatedStudent);

    // Preserve original startedAt on resume so countdown timer & progress never reset!
    const existingStartedAt = assessmentSession.startedAt;
    const newSession = {
      ...assessmentSession,
      startedAt: existingStartedAt || Date.now(),
      terminatedByViolations: false,
      finalized: false,
    };
    setAssessmentSession(newSession);
    try {
      localStorage.setItem(`acmw_assessment_session_${lower}`, JSON.stringify(newSession));
    } catch {}
    return { ok: true };
  };

  const finalizeAssessment = async () => {
    setAssessmentSession((prev) => ({ ...prev, finalized: true }));
    if (session && session.role === "student") {
      const lower = session.email.toLowerCase().trim();

      let earnedMarks = 0;
      let totalMarks = 0;
      let answeredCount = 0;

      questions.forEach((q) => {
        if (q.enabled === "Enabled") {
          totalMarks += q.maxMarks;
          const rt = runtimes[q.id];
          if (q.questionType === "Output Prediction") {
            if (rt && rt.selectedOptionId) {
              answeredCount++;
              const correctOpt = q.options?.find((o) => o.isCorrect);
              if (correctOpt && rt.selectedOptionId === correctOpt.id) {
                earnedMarks += q.maxMarks;
              }
            }
          } else {
            if (rt && (rt.status === "Submitted" || rt.status === "Completed" || (rt.lastOutput && rt.lastOutput.length > 0))) {
              answeredCount++;
            }
            if (rt && rt.lastOutput && (rt.lastOutput.includes("SUCCESS (All") || rt.lastOutput.includes("HURRAY! YOU DID IT"))) {
              earnedMarks += q.maxMarks;
            }
          }
        }
      });

      setRegisteredStudents((prev) =>
        prev.map((s) =>
          s.email.toLowerCase().trim() === lower
            ? {
                ...s,
                testSubmitted: true,
                examDeviceId: null,
                totalScore: earnedMarks,
                maxPossibleScore: totalMarks,
                questionsAnswered: answeredCount,
                totalQuestionsCount: questions.filter(q => q.enabled === "Enabled").length,
              }
            : s
        )
      );

      const student = registeredStudents.find(
        (s) => s.email.toLowerCase().trim() === lower
      );
      if (student) {
        await syncStudentToFirestore({
          ...student,
          testSubmitted: true,
          examDeviceId: null,
          totalScore: earnedMarks,
          maxPossibleScore: totalMarks,
          questionsAnswered: answeredCount,
          totalQuestionsCount: questions.filter(q => q.enabled === "Enabled").length,
        });
      }
    }
  };

  const recordTabSwitch = () => {
    const maxLimit = assessmentSettings.tabSwitchLimit ?? assessmentSession.maxTabSwitches ?? 3;

    const nextCount = (assessmentSession.tabSwitchCount ?? 0) + 1;
    const terminated = nextCount >= maxLimit;

    setAssessmentSession((prev) => {
      const updated = { ...prev, tabSwitchCount: nextCount, maxTabSwitches: maxLimit, terminatedByViolations: terminated };
      if (session?.email) {
        try { localStorage.setItem(`acmw_assessment_session_${session.email.toLowerCase().trim()}`, JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    if (session && session.role === "student") {
      const lower = session.email.toLowerCase().trim();

      setRegisteredStudents((prev) =>
        prev.map((s) =>
          s.email.toLowerCase().trim() === lower
            ? { ...s, tabSwitchCount: nextCount, isBlocked: terminated }
            : s
        )
      );

      const currentStudent = registeredStudents.find(
        (s) => s.email.toLowerCase().trim() === lower
      );

      const recordToSync: StudentUser = {
        email: lower,
        pass: currentStudent?.pass ?? "",
        tabSwitchCount: nextCount,
        isBlocked: terminated,
        examDeviceId: currentStudent?.examDeviceId ?? localDeviceId,
        testSubmitted: currentStudent?.testSubmitted ?? false,
        totalScore: currentStudent?.totalScore ?? 0,
        maxPossibleScore: currentStudent?.maxPossibleScore ?? 0,
        questionsAnswered: currentStudent?.questionsAnswered ?? 0,
        totalQuestionsCount: currentStudent?.totalQuestionsCount ?? 0,
        activeQuestionTitle: currentStudent?.activeQuestionTitle,
        lastActiveAt: Date.now(),
      };

      syncStudentToFirestore(recordToSync)
        .catch((err) => console.warn("Tab switch Firestore sync failed:", err));
    }

    return { terminated, count: nextCount };
  };

  const adminResetViolations = () => {
    setAssessmentSession((prev) => ({
      ...prev,
      tabSwitchCount: 0,
      terminatedByViolations: false,
    }));
    if (session && session.role === "student") {
      setRegisteredStudents((prev) =>
        prev.map((s) =>
          s.email.toLowerCase().trim() === session.email.toLowerCase().trim()
            ? { ...s, tabSwitchCount: 0, isBlocked: false }
            : s
        )
      );
    }
  };

  const getRuntime = (questionId: string): QuestionRuntime => {
    if (runtimes[questionId]) return runtimes[questionId];
    const q = questions.find((item) => item.id === questionId);
    const initialLang = q?.allowedLanguages[0] ?? "Python";
    return {
      questionId,
      selectedLanguage: initialLang,
      code: q?.starterCode ?? {},
      selectedOptionId: null,
      attemptsUsed: 0,
      status: "Not Started",
      questionStartedAt: null,
      submittedAt: null,
      timeExpired: false,
      lastOutput: null,
    };
  };

  const updateRuntime = (questionId: string, partial: Partial<QuestionRuntime>) => {
    setRuntimes((prev) => {
      const existing = prev[questionId] ?? getRuntime(questionId);
      const updated = { ...existing, ...partial };
      const nextRuntimes = { ...prev, [questionId]: updated };
      
      if (session?.role === "student") {
        const q = questions.find((item) => item.id === questionId);
        syncLiveStudentProgress(nextRuntimes, q?.title).catch(() => {});
      }
      return nextRuntimes;
    });
  };

  const ensureRuntimeStarted = (questionId: string) => {
    setRuntimes((prev) => {
      const existing = prev[questionId] ?? getRuntime(questionId);
      if (!existing.questionStartedAt) {
        const nextRuntimes = {
          ...prev,
          [questionId]: {
            ...existing,
            questionStartedAt: Date.now(),
            status: existing.status === "Not Started" ? "In Progress" : existing.status,
          },
        };
        if (session?.role === "student") {
          const q = questions.find((item) => item.id === questionId);
          syncLiveStudentProgress(nextRuntimes, q?.title).catch(() => {});
        }
        return nextRuntimes;
      }
      return prev;
    });
  };

  return (
    <AppContext.Provider
      value={{
        session,
        login,
        logout,
        questions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        syncAllQuestionsToFirestore,
        assessmentSettings,
        updateAssessmentSettings,
        assessmentSession,
        startAssessment,
        finalizeAssessment,
        recordTabSwitch,
        adminResetViolations,
        runtimes,
        getRuntime,
        updateRuntime,
        ensureRuntimeStarted,
        registeredStudents,
        addStudentUser,
        deleteStudentUser,
        adminResetStudentViolations,
        syncLiveStudentProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};

