import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import type { Language } from "../../types";
import { KareAcmwBadge } from "../../components/KareAcmwBadge";
import { apiRunCode } from "../../services/api";

import { Clock, Play, Send, ShieldAlert, CheckCircle, Maximize2 } from "lucide-react";
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
  } = useApp();

  const enabledQuestions = questions.filter((q) => q.enabled === "Enabled");

  const [activeIdx, setActiveIdx] = useState(0);
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


  if (assessmentSession.terminatedByViolations || assessmentSession.tabSwitchCount >= assessmentSession.maxTabSwitches) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-red-500/50 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 border border-red-500/40 mx-auto">
            <ShieldAlert size={40} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white">Assessment Terminated</h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Your assessment was locked due to exceeding the maximum allowed proctoring violations ({assessmentSession.tabSwitchCount} / {assessmentSession.maxTabSwitches}).
          </p>
          <div className="p-3 bg-red-950/60 rounded-xl border border-red-800/80 text-[11px] text-red-300 font-mono">
            Status: SESSION_LOCKED_BY_PROCTOR
          </div>
          <button onClick={() => navigate("/student/dashboard")} className="btn-danger w-full py-3 font-bold">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden relative">
      {/* Violation Warning Modal Backdrop (When Candidate Exits Fullscreen or Switches Tabs) */}
      {(showWarningModal || (!isFullscreen && assessmentSettings.fullscreenMode === "Required")) && !assessmentSession.terminatedByViolations && (
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
        <div className="w-1/2 bg-slate-900 text-slate-100 flex flex-col min-h-0">
          {/* Header Controls */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {currentQuestion.allowedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLangSwitch(lang)}
                  className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                    selectedLang === lang
                      ? "bg-orange-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentQuestion.questionType !== "Output Prediction" && (
                <button onClick={handleRunCode} className="btn-secondary text-xs py-1 px-3">
                  <Play size={13} /> Run Code
                </button>
              )}
              <button onClick={handleSubmitQuestion} className="btn-primary text-xs py-1 px-3">
                <Send size={13} /> Submit
              </button>
            </div>
          </div>

          {/* Editor Body */}
          {currentQuestion.questionType !== "Output Prediction" && (
            <div className="flex-1 p-4 overflow-y-auto">
              <CodeEditorField
                value={code}
                onChange={handleCodeChange}
                language={selectedLang}
                errorLine={errorLine}
                placeholder={`// Write ${selectedLang} solution here...`}
              />


            </div>
          )}

          {/* Terminal Output */}
          <div className="h-44 bg-slate-950 border-t border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-y-auto shrink-0">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Terminal Output</p>
            <pre className="whitespace-pre-wrap">{consoleOutput ?? "Ready to execute code."}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
