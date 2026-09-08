import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import type { Language } from "../../types";
import { KareAcmwBadge } from "../../components/KareAcmwBadge";
import { apiRunCode } from "../../services/api";

import {
  Clock,
  Play,
  Send,
  ShieldAlert,
  CheckCircle,
  Maximize2,
  RotateCcw,
  Terminal,
  Trash2,
  ZoomIn,
  ZoomOut,
  Sliders,
  PanelTop,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { CodeEditorField } from "../../components/CodeEditorField";

export const AssessmentRunner: React.FC = () => {
  const navigate = useNavigate();
  const {
    questions,
    assessmentSettings,
    assessmentSession,
    finalizeAssessment,
    recordTabSwitch,
    runtimes,
    getRuntime,
    updateRuntime,
    ensureRuntimeStarted,
    session,
  } = useApp();

  const enabledQuestions = questions.filter((q) => q.enabled === "Enabled");

  const [activeIdx, setActiveIdx] = useState(() => {
    if (typeof window !== "undefined" && session?.email) {
      const saved = localStorage.getItem(`acmw_active_idx_${session.email.toLowerCase().trim()}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }
    return 0;
  });

  useEffect(() => {
    if (session?.email) {
      localStorage.setItem(`acmw_active_idx_${session.email.toLowerCase().trim()}`, String(activeIdx));
    }
  }, [activeIdx, session?.email]);

  const activeQuestionFromList = enabledQuestions[activeIdx] ?? null;
  // Always derive current question details from latest questions state in context
  const currentQuestion = activeQuestionFromList
    ? questions.find((q) => q.id === activeQuestionFromList.id) ?? activeQuestionFromList
    : null;

  const [selectedLang, setSelectedLang] = useState<Language>("Python");
  const [code, setCode] = useState("");
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [hasEnteredFS, setHasEnteredFS] = useState(() => !!document.fullscreenElement);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Dynamic Workspace Layout and Font Zoom Controls
  const [workspaceLayout, setWorkspaceLayout] = useState<"balanced" | "editorMax" | "terminalMax">("balanced");
  const [editorFontSize, setEditorFontSize] = useState<number>(14);


  // Resume fullscreen on explicit user button click
  const handleResumeFullscreen = async () => {
    setShowWarningModal(false);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
  };

  // On leaving test runner (unmount or navigation): Automatically exit native browser fullscreen
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (isFS) {
        setHasEnteredFS(true);
      } else if (assessmentSettings.fullscreenMode === "Required") {
        if (hasEnteredFS) {
          if (!document.hidden) {
            recordTabSwitch();
          }
          setShowWarningModal(true);
        } else {
          setShowWarningModal(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [assessmentSettings.fullscreenMode, hasEnteredFS, recordTabSwitch]);

  const totalAllowedSeconds =
    assessmentSettings.overallTimeLimit.hours * 3600 +
    assessmentSettings.overallTimeLimit.minutes * 60 +
    assessmentSettings.overallTimeLimit.seconds || 3600;

  const calculateRemainingSeconds = () => {
    if (!assessmentSession.startedAt) return totalAllowedSeconds;
    const elapsedSeconds = Math.floor((Date.now() - assessmentSession.startedAt) / 1000);
    return Math.max(0, totalAllowedSeconds - elapsedSeconds);
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemainingSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setSecondsLeft(remaining);
      if (remaining <= 0 && !assessmentSession.finalized) {
        finalizeAssessment();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [assessmentSession.startedAt, assessmentSession.finalized]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordTabSwitch();
        setShowWarningModal(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [recordTabSwitch]);

  useEffect(() => {
    if (currentQuestion) {
      ensureRuntimeStarted(currentQuestion.id);
      const rt = getRuntime(currentQuestion.id);
      const initialLang = rt.selectedLanguage ?? currentQuestion.allowedLanguages[0] ?? "Python";
      setSelectedLang(initialLang);
      const starter = currentQuestion.starterCode?.[initialLang] ?? "";
      setCode(rt.code[initialLang] !== undefined ? rt.code[initialLang] : starter);
      setSelectedOpt(rt.selectedOptionId);
      setConsoleOutput(rt.lastOutput);
      setErrorLine(null);
    }
  }, [activeIdx, currentQuestion?.id, currentQuestion?.updatedAt]);

  const handleLangSwitch = (lang: Language) => {
    setSelectedLang(lang);
    setErrorLine(null);
    const rt = getRuntime(currentQuestion.id);
    const starter = currentQuestion.starterCode?.[lang] ?? "";
    setCode(rt.code[lang] !== undefined ? rt.code[lang] : starter);
    updateRuntime(currentQuestion.id, { selectedLanguage: lang });
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">No active questions available.</h2>
        <button onClick={() => navigate("/student/dashboard")} className="btn-primary mt-4">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleResetCode = () => {
    if (!currentQuestion) return;
    const starter = currentQuestion.starterCode?.[selectedLang] ?? "";
    setCode(starter);
    setErrorLine(null);
    const rt = getRuntime(currentQuestion.id);
    updateRuntime(currentQuestion.id, {
      code: { ...rt.code, [selectedLang]: starter },
      lastOutput: null,
    });
    setConsoleOutput(`↺ Code reset to initial ${selectedLang} template.`);
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    setErrorLine(null);
    const rt = getRuntime(currentQuestion.id);
    updateRuntime(currentQuestion.id, {
      code: { ...rt.code, [selectedLang]: val },
    });
  };

  const handleRunCode = async () => {
    if (isSubmitting) return;
    setErrorLine(null);

    if (!currentQuestion.testCases || currentQuestion.testCases.length === 0) {
      setConsoleOutput("[EXECUTION RESULT]\nNo test cases configured for this question.");
      return;
    }

    setConsoleOutput(`⏳ Executing code in Docker sandbox...\nRunning ${currentQuestion.testCases.length} test cases against isolated container compiler...`);

    let passedCount = 0;
    const totalCount = currentQuestion.testCases.length;
    const logs: string[] = [];
    let compilationErrLog: string | null = null;

    for (let idx = 0; idx < totalCount; idx++) {
      const tc = currentQuestion.testCases[idx];
      try {
        const apiRes = await apiRunCode({
          question_id: currentQuestion.id,
          attempt_id: "live_attempt",
          language: selectedLang,
          source_code: code,
          input: tc.input,
        });

        if (apiRes) {
          if (apiRes.status === "Compilation Error") {
            compilationErrLog = `🚨 COMPILATION ERROR ❌\n--------------------------------------------------\nLanguage : ${selectedLang}\nDetails  :\n${apiRes.stderr || apiRes.error || "Compilation failed"}`;
            break;
          }

          if (apiRes.status === "Runtime Error") {
            compilationErrLog = `🚨 RUNTIME ERROR ❌\n--------------------------------------------------\nLanguage : ${selectedLang}\nDetails  :\n${apiRes.stderr || "Runtime exception occurred"}`;
            break;
          }

          if (apiRes.status === "Time Limit Exceeded") {
            compilationErrLog = `🚨 EXECUTION TIMEOUT ❌\n--------------------------------------------------\nDetails  : Execution timed out (5s limit exceeded)`;
            break;
          }

          const actualOutput = (apiRes.stdout ?? "").trim().replace(/\r\n/g, "\n");
          const expectedOutput = (tc.expectedOutput ?? "").trim().replace(/\r\n/g, "\n");

          const normalizedActual = actualOutput.replace(/\s+/g, " ").toLowerCase();
          const normalizedExpected = expectedOutput.replace(/\s+/g, " ").toLowerCase();
          const exactMatch = normalizedActual === normalizedExpected;
          const numActual = parseFloat(actualOutput);
          const numExpected = parseFloat(expectedOutput);
          const numericMatch = !isNaN(numActual) && !isNaN(numExpected) && numActual === numExpected;
          const isPass = exactMatch || numericMatch;

          if (isPass) {
            passedCount++;
            if (tc.isHidden) {
              logs.push(`  ✓ Test Case #${idx + 1} (Hidden Evaluation Case): PASSED`);
            } else {
              logs.push(`  ✓ Test Case #${idx + 1} (Public Sample - Input: "${tc.input}"): PASSED`);
            }
          } else {
            if (tc.isHidden) {
              logs.push(`  ✗ Test Case #${idx + 1} (Hidden Evaluation Case): FAILED`);
            } else {
              logs.push(`  ✗ Test Case #${idx + 1} (Public Sample - Input: "${tc.input}"): FAILED (Expected: "${expectedOutput}", Got: "${actualOutput || "no output"}")`);
            }
          }
        }
      } catch (err: any) {
        compilationErrLog = `⚠️ EXECUTION SERVICE UNAVAILABLE\n--------------------------------------------------\nThe code execution backend could not be reached.\nPlease ensure the backend server is running at http://localhost:8000\n\nError: ${err?.message || "Network error"}`;
        break;
      }
    }

    if (compilationErrLog) {
      setConsoleOutput(compilationErrLog);
      updateRuntime(currentQuestion.id, { lastOutput: compilationErrLog });
      return;
    }

    const allPassed = passedCount === totalCount && totalCount > 0;
    let finalOutput = "";

    if (allPassed) {
      finalOutput = `🎉 HURRAY! YOU DID IT! ✓
==================================================
STATUS : SUCCESS (All ${totalCount}/${totalCount} Test Cases Passed!)
SCORE  : ${currentQuestion.maxMarks} / ${currentQuestion.maxMarks} Marks

[TEST CASE EVALUATION RESULTS]
${logs.join("\n")}

✨ Excellent job! Your solution satisfies all public and hidden evaluation test cases.`;
    } else {
      finalOutput = `❌ WRONG ANSWER - TRY AGAIN! 
==================================================
STATUS : FAILED (Passed ${passedCount}/${totalCount} Test Cases)

[TEST CASE EVALUATION RESULTS]
${logs.join("\n")}

💡 Tip: Check your logic on failing test cases and test your solution again.`;
    }

    setConsoleOutput(finalOutput);
    updateRuntime(currentQuestion.id, { lastOutput: finalOutput });
  };


  const handleSubmitQuestion = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isMcq = currentQuestion.questionType === "Output Prediction";

      if (isMcq) {
        if (!selectedOpt) {
          alert("Please select an option before submitting.");
          setIsSubmitting(false);
          return;
        }
        const outputMsg = "Response recorded successfully.";
        updateRuntime(currentQuestion.id, {
          status: "Submitted",
          attemptsUsed: (getRuntime(currentQuestion.id).attemptsUsed || 0) + 1,
          selectedOptionId: selectedOpt,
          lastOutput: outputMsg,
        });
        setConsoleOutput(outputMsg);
      } else {
        await handleRunCode();
        updateRuntime(currentQuestion.id, {
          status: "Submitted",
          attemptsUsed: (getRuntime(currentQuestion.id).attemptsUsed || 0) + 1,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const isLockedByViolations =
    assessmentSession.terminatedByViolations ||
    assessmentSession.tabSwitchCount >= assessmentSession.maxTabSwitches;

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden relative">
      {/* Real-time Locked by Proctor Full-screen Modal (Dismisses automatically when admin unblocks) */}
      {isLockedByViolations && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/60 rounded-2xl p-8 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 border border-red-500/40 mx-auto">
              <ShieldAlert size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white">Assessment Locked by Proctor</h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Your assessment was locked due to exceeding allowed tab switch violations ({assessmentSession.tabSwitchCount} / {assessmentSession.maxTabSwitches}).
            </p>
            <div className="p-3 bg-red-950/60 rounded-xl border border-red-800/80 text-[11px] text-red-300 font-mono">
              Status: SESSION_LOCKED_BY_PROCTOR
            </div>
            <p className="text-[11px] text-amber-400 font-semibold">
              ⏳ Waiting for admin to unblock... Once unblocked, your exam will resume automatically where you left off.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => navigate("/student/dashboard")}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Warning Modal Backdrop (When Candidate Exits Fullscreen or Switches Tabs) */}
      {(showWarningModal || (!isFullscreen && assessmentSettings.fullscreenMode === "Required")) && !isLockedByViolations && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-2xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
            {hasEnteredFS ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 mx-auto">
                  <ShieldAlert size={36} className="animate-pulse" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Proctored Violation Warning</h2>
                  <p className="text-xs text-amber-400 font-extrabold uppercase tracking-widest mt-1">
                    Security Alert: Tab Switch / Fullscreen Exit Detected
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Violation Recorded:</span>
                    <span className="font-bold text-amber-400">Warning {assessmentSession.tabSwitchCount} of {assessmentSession.maxTabSwitches}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Remaining Allowed Limits:</span>
                    <span className="font-bold text-red-400">
                      {Math.max(0, assessmentSession.maxTabSwitches - assessmentSession.tabSwitchCount)} Warning(s) Left
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans pt-1 border-t border-slate-800">
                    Exceeding {assessmentSession.maxTabSwitches} total violations will automatically lock your assessment session.
                  </p>
                </div>

                <button onClick={handleResumeFullscreen} className="w-full btn-primary py-3.5 text-sm font-bold shadow-lg bg-amber-600 hover:bg-amber-700 border-amber-500 flex items-center justify-center gap-2">
                  <Maximize2 size={16} /> I Understand &amp; Re-enter Fullscreen Exam
                </button>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/40 mx-auto">
                  <Maximize2 size={36} className="animate-pulse" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Fullscreen Mode Required</h2>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">
                    Please enter fullscreen mode to start your exam
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs font-sans text-slate-300 space-y-2">
                  <p>
                    This assessment is strictly proctored. You must remain in fullscreen mode throughout the duration of the test.
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Switching tabs, exiting fullscreen, or minimizing the window will trigger security warnings and can result in automatic exam lock.
                  </p>
                </div>

                <button onClick={handleResumeFullscreen} className="w-full btn-primary py-3.5 text-sm font-bold shadow-lg bg-blue-600 hover:bg-blue-700 border-blue-500 flex items-center justify-center gap-2">
                  <Maximize2 size={16} /> Enter Fullscreen Exam Mode
                </button>
              </>
            )}
          </div>
        </div>
      )}


      {/* Exam Header */}
      <header className="h-14 bg-slate-900 text-white border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <KareAcmwBadge size={34} />
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">
              KARE <span className="text-blue-500">ACM-W</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">{assessmentSettings.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Proctoring Violations Badge */}
          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/80 flex items-center gap-1.5">
            <ShieldAlert size={13} /> Warnings: {assessmentSession.tabSwitchCount} / {assessmentSession.maxTabSwitches}
          </span>

          {!isFullscreen ? (
            <button
              onClick={handleResumeFullscreen}
              className="btn-primary text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Maximize2 size={13} /> Fullscreen Exam Mode
            </button>
          ) : (

            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1">
              <CheckCircle size={12} /> Fullscreen Active
            </span>
          )}

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-orange-400">

            <Clock size={14} />
            <span>Time Remaining: {formatTime(secondsLeft)}</span>
          </div>


          {/* Overall Submit Button Threshold Logic: Enabled ONLY when remaining time <= threshold (e.g. 15 minutes) */}
          {secondsLeft <= (assessmentSettings.overallSubmitThresholdMinutes ?? 15) * 60 ? (
            <button
              onClick={async () => {
                await finalizeAssessment();
                navigate("/student/dashboard");
              }}
              className="btn-primary text-xs py-1.5 px-4 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
            >
              <Send size={13} /> Final Submit Exam
            </button>
          ) : (
            <button
              disabled
              title={`Overall submit button unlocks when remaining time is under ${assessmentSettings.overallSubmitThresholdMinutes ?? 15} minutes`}
              className="bg-slate-800 text-slate-500 border border-slate-700 text-[11px] px-3 py-1.5 rounded-lg font-bold cursor-not-allowed flex items-center gap-1.5 opacity-80"
            >
              <Clock size={12} /> Overall Submit (Locked until &lt;{assessmentSettings.overallSubmitThresholdMinutes ?? 15}m)
            </button>
          )}
        </div>
      </header>


      {/* Main Split Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Statement & Problem Panel */}
        <div className="w-1/2 bg-white border-r border-slate-200 p-6 overflow-y-auto space-y-6 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Question {activeIdx + 1} of {enabledQuestions.length} · {currentQuestion.questionType}
            </span>
            <span className="text-xs font-mono font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Marks: {currentQuestion.maxMarks}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{currentQuestion.title}</h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">{currentQuestion.description}</p>
          </div>

          {/* Multi-Language Code Snippet Viewer for Output Prediction, Error Identification, Code Completion */}
          {currentQuestion.starterCode && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Code Snippet / Reference Code</h3>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {currentQuestion.allowedLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLangSwitch(lang)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-all ${
                        selectedLang === lang
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                <pre className="whitespace-pre">{currentQuestion.starterCode?.[selectedLang] ?? `// No snippet defined for ${selectedLang}`}</pre>
              </div>
            </div>
          )}

          {currentQuestion.problemStatement && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Problem Statement</h3>
              <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">{currentQuestion.problemStatement}</p>
            </div>
          )}

          {/* Sample Public Test Cases (Hidden Test Cases Inputs Are Protected) */}
          {currentQuestion.testCases && currentQuestion.testCases.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Sample Test Cases</h3>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {currentQuestion.testCases.filter(t => !t.isHidden).length} Public · {currentQuestion.testCases.filter(t => t.isHidden).length} Hidden
                </span>
              </div>

              {currentQuestion.testCases.filter((tc) => !tc.isHidden).map((tc, idx) => (
                <div key={tc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 font-mono text-xs">
                  <p className="text-[11px] text-slate-500 font-bold uppercase">Sample Public Case #{idx + 1}</p>
                  <p><span className="text-slate-500 font-sans font-semibold">Input:</span> <span className="font-bold text-slate-900">{tc.input}</span></p>
                  <p><span className="text-slate-500 font-sans font-semibold">Expected Output:</span> <span className="font-bold text-emerald-700">{tc.expectedOutput}</span></p>
                </div>
              ))}

              {currentQuestion.testCases.some(t => t.isHidden) && (
                <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 text-purple-900 text-xs font-medium flex items-center gap-2">
                  <ShieldAlert size={15} className="text-purple-600 shrink-0" />
                  <span>Hidden evaluation test cases will be validated automatically upon code submission.</span>
                </div>
              )}
            </div>
          )}

          {/* MCQ Choices for Output Prediction */}
          {currentQuestion.questionType === "Output Prediction" && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Select Predicted Output</h3>
              <div className="space-y-2">
                {currentQuestion.options?.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOpt(opt.id)}
                    className={`w-full p-3.5 text-left rounded-xl border text-xs font-semibold transition-all flex items-center gap-3 ${
                      selectedOpt === opt.id
                        ? "border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-2 ring-blue-500/30"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      selectedOpt === opt.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Navigation Bar: Previous Question / Next Question */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6 shrink-0">

            <button
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
              className="btn-secondary text-xs py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1"
            >
              ← Previous Question
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {enabledQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    activeIdx === idx
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 font-black"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveIdx((prev) => Math.min(enabledQuestions.length - 1, prev + 1))}
              disabled={activeIdx === enabledQuestions.length - 1}
              className="btn-primary text-xs py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1"
            >
              Next Question →
            </button>
          </div>
        </div>



        {/* Right Code Workspace Panel */}
        <div className="w-1/2 bg-slate-900 text-slate-100 flex flex-col min-h-0 border-l border-slate-800">
          {/* Workspace Top Toolbar */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {currentQuestion.allowedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLangSwitch(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    selectedLang === lang
                      ? "bg-orange-500 text-white shadow-sm ring-2 ring-orange-500/30"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Layout View Modes & Font Zoom */}
            <div className="flex items-center gap-2">
              {/* Font Size Zoom Controls */}
              <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-slate-400">
                <button
                  onClick={() => setEditorFontSize((prev) => Math.max(12, prev - 1))}
                  title="Decrease Editor Font Size"
                  className="px-1.5 py-0.5 hover:text-white hover:bg-slate-800 rounded text-[10px] font-bold"
                >
                  A-
                </button>
                <span className="px-1.5 text-[10px] font-mono text-slate-400 font-bold">{editorFontSize}px</span>
                <button
                  onClick={() => setEditorFontSize((prev) => Math.min(22, prev + 1))}
                  title="Increase Editor Font Size"
                  className="px-1.5 py-0.5 hover:text-white hover:bg-slate-800 rounded text-[10px] font-bold"
                >
                  A+
                </button>
              </div>

              {/* Layout Presets (Balanced / Expand Editor / Expand Terminal) */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-medium text-slate-400">
                <button
                  onClick={() => setWorkspaceLayout("editorMax")}
                  title="Max Editor (80% Editor / 20% Terminal)"
                  className={`px-2 py-0.5 rounded transition-colors ${
                    workspaceLayout === "editorMax" ? "bg-blue-600 text-white font-bold" : "hover:text-white"
                  }`}
                >
                  Editor View
                </button>
                <button
                  onClick={() => setWorkspaceLayout("balanced")}
                  title="Balanced Split (55% Editor / 45% Terminal)"
                  className={`px-2 py-0.5 rounded transition-colors ${
                    workspaceLayout === "balanced" ? "bg-blue-600 text-white font-bold" : "hover:text-white"
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setWorkspaceLayout("terminalMax")}
                  title="Max Terminal (30% Editor / 70% Terminal)"
                  className={`px-2 py-0.5 rounded transition-colors ${
                    workspaceLayout === "terminalMax" ? "bg-blue-600 text-white font-bold" : "hover:text-white"
                  }`}
                >
                  Terminal View
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {currentQuestion.questionType !== "Output Prediction" && (
                  <>
                    <button
                      onClick={handleResetCode}
                      title="Reset code template"
                      className="btn-secondary text-xs py-1 px-2.5 border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-medium"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={handleRunCode}
                      className="btn-secondary text-xs py-1 px-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-900/60 font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Play size={13} className="fill-emerald-400 text-emerald-400" /> Run Code
                    </button>
                  </>
                )}
                <button
                  onClick={handleSubmitQuestion}
                  className="btn-primary text-xs py-1 px-4 font-bold shadow-md bg-blue-600 hover:bg-blue-700"
                >
                  <Send size={13} /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Main Work Area Split: Editor vs Terminal */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Editor Container */}
            {currentQuestion.questionType !== "Output Prediction" ? (
              <div
                className={`p-3 transition-all duration-200 min-h-0 ${
                  workspaceLayout === "editorMax"
                    ? "flex-[8]"
                    : workspaceLayout === "terminalMax"
                    ? "flex-[3]"
                    : "flex-[5]"
                }`}
              >
                <CodeEditorField
                  value={code}
                  onChange={handleCodeChange}
                  language={selectedLang}
                  errorLine={errorLine}
                  fontSize={editorFontSize}
                  placeholder={`// Write ${selectedLang} solution here...`}
                />
              </div>
            ) : (
              <div className="flex-1 p-6 flex items-center justify-center text-center text-slate-400 font-sans">
                <div className="max-w-md space-y-2">
                  <Sparkles size={32} className="mx-auto text-blue-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white">Output Prediction Question</h3>
                  <p className="text-xs text-slate-400">
                    Review the reference code on the left statement panel and select your predicted choice option, then click Submit.
                  </p>
                </div>
              </div>
            )}

            {/* Terminal Panel */}
            <div
              className={`bg-slate-950 border-t border-slate-800 flex flex-col transition-all duration-200 min-h-0 ${
                workspaceLayout === "editorMax"
                  ? "flex-[2]"
                  : workspaceLayout === "terminalMax"
                  ? "flex-[7]"
                  : "flex-[5]"
              }`}
            >
              {/* Terminal Header Bar */}
              <div className="h-9 bg-slate-900 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-blue-400" />
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
                    Execution Output &amp; Test Results
                  </span>
                  {consoleOutput && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        consoleOutput.includes("ALL TEST CASES PASSED") || consoleOutput.includes("SUCCESSFUL")
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : consoleOutput.includes("ERROR") || consoleOutput.includes("FAILED")
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : "bg-blue-950 text-blue-400 border border-blue-800"
                      }`}
                    >
                      {consoleOutput.includes("ALL TEST CASES PASSED") || consoleOutput.includes("SUCCESSFUL")
                        ? "PASSED"
                        : consoleOutput.includes("ERROR") || consoleOutput.includes("FAILED")
                        ? "ERROR / FAILED"
                        : "COMPLETED"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {consoleOutput && (
                    <button
                      onClick={() => setConsoleOutput(null)}
                      title="Clear Terminal Output"
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-800 px-2 py-0.5 rounded transition-colors"
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setWorkspaceLayout((prev) => (prev === "terminalMax" ? "balanced" : "terminalMax"))
                    }
                    title={workspaceLayout === "terminalMax" ? "Restore Balanced View" : "Expand Full Terminal"}
                    className="text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors"
                  >
                    {workspaceLayout === "terminalMax" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>

              {/* Terminal Content Body */}
              <div className="flex-1 p-4 font-mono text-xs text-slate-200 overflow-y-auto space-y-2 select-text leading-relaxed">
                {consoleOutput ? (
                  <div className="space-y-2">
                    {consoleOutput.split("\n").map((line, idx) => {
                      if (line.includes("ALL TEST CASES PASSED") || line.includes("SUCCESSFUL")) {
                        return (
                          <div key={idx} className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 font-bold flex items-center gap-2">
                            <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                            <span>{line}</span>
                          </div>
                        );
                      }
                      if (line.includes("ERROR") || line.includes("FAILED") || line.includes("EXCEPTION") || line.includes("Traceback")) {
                        return (
                          <div key={idx} className="p-2 rounded-lg bg-red-950/60 border border-red-800/70 text-red-300 font-semibold">
                            {line}
                          </div>
                        );
                      }
                      if (line.includes("💡 Standard Output:") || line.includes("Output (stdout):")) {
                        return (
                          <p key={idx} className="text-blue-400 font-bold pt-1 border-t border-slate-800/60">
                            {line}
                          </p>
                        );
                      }
                      if (line.includes("⏱️ Execution Time:") || line.includes("Language :")) {
                        return (
                          <p key={idx} className="text-amber-400 font-semibold">
                            {line}
                          </p>
                        );
                      }
                      return (
                        <p key={idx} className="text-slate-300">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-6 space-y-1 select-none">
                    <Terminal size={24} className="opacity-40 mb-1" />
                    <p className="text-xs font-semibold">Terminal ready.</p>
                    <p className="text-[11px] text-slate-600">
                      Click <span className="text-emerald-400 font-bold">"Run Code"</span> to execute against public test cases or <span className="text-blue-400 font-bold">"Submit"</span> to evaluate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

