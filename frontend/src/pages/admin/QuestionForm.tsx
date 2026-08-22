import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import type { Difficulty, Language, QuestionType } from "../../types";
import { LanguageMultiSelect } from "../../components/LanguageMultiSelect";
import { LanguageCodeTabs } from "../../components/LanguageCodeTabs";
import { QuestionTimeLimitInput } from "../../components/QuestionTimeLimitInput";
import { ArrowLeft, Save, Plus, Trash2, EyeOff, Eye } from "lucide-react";

interface AssessmentOption {
  id: string;
  name: string;
}

export const QuestionForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { questions, addQuestion, updateQuestion } = useApp();

  const existing = id ? questions.find((q) => q.id === id) : null;

  const [availableAssessments, setAvailableAssessments] = useState<AssessmentOption[]>([]);
  const [targetAssessmentId, setTargetAssessmentId] = useState<string>("");

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "assessments"), (snap) => {
      const list: AssessmentOption[] = [];
      snap.forEach((d) => list.push({ id: d.id, name: (d.data().name || "Untitled Assessment") }));
      setAvailableAssessments(list);

      // Pre-select assessment if question is already assigned
      if (existing?.id) {
        snap.forEach((d) => {
          const qIds = d.data().questionIds as string[] | undefined;
          if (qIds && qIds.includes(existing.id)) {
            setTargetAssessmentId(d.id);
          }
        });
      }
    });
    return unsub;
  }, [existing?.id]);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [problemStatement, setProblemStatement] = useState(existing?.problemStatement ?? "");
  const [inputFormat, setInputFormat] = useState(existing?.inputFormat ?? "");
  const [outputFormat, setOutputFormat] = useState(existing?.outputFormat ?? "");
  const [constraints, setConstraints] = useState(existing?.constraints ?? "");
  const [questionType, setQuestionType] = useState<QuestionType>(existing?.questionType ?? "Programming Problem");
  const [difficulty, setDifficulty] = useState<Difficulty>(existing?.difficulty ?? "Easy");
  const [maxMarks, setMaxMarks] = useState(existing?.maxMarks ?? 10);
  const [maxAttempts, setMaxAttempts] = useState(existing?.maxAttempts ?? 3);
  const [allowedLanguages, setAllowedLanguages] = useState<Language[]>(existing?.allowedLanguages ?? ["Python", "C++", "Java", "C"]);
  const [timeLimit, setTimeLimit] = useState(existing?.timeLimit ?? { hours: 0, minutes: 15, seconds: 0 });

  // MCQ Options (For Output Prediction)
  const [options, setOptions] = useState(
    existing?.options ?? [
      { id: "opt_1", text: "Option A (e.g., Output 10)", isCorrect: true },
      { id: "opt_2", text: "Option B (e.g., Output 20)", isCorrect: false },
      { id: "opt_3", text: "Option C (e.g., Syntax Error)", isCorrect: false },
      { id: "opt_4", text: "Option D (e.g., None of above)", isCorrect: false },
    ]
  );

  // Test Cases (With isHidden toggle)
  const [testCases, setTestCases] = useState(
    existing?.testCases ?? [
      { id: "tc_1", input: "5", expectedOutput: "120", isHidden: false },
      { id: "tc_2", input: "10", expectedOutput: "3628800", isHidden: true },
    ]
  );

  // Multi-Language Code Snippets (Python, C++, Java, C)
  const [starterCode, setStarterCode] = useState<Partial<Record<Language, string>>>(
    existing?.starterCode ?? {
      Python: "# Python snippet / starter code\nprint('Hello')",
      "C++": "// C++ snippet / starter code\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << \"Hello\";\n    return 0;\n}",
      Java: "// Java snippet / starter code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }\n}",
      C: "/* C snippet / starter code */\n#include <stdio.h>\nint main() {\n    printf(\"Hello\");\n    return 0;\n}",
    }
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Inline validation
    if (!title.trim()) {
      setErrorMsg("Question title is required.");
      return;
    }
    if (questionType !== "Output Prediction" && testCases.length === 0) {
      setErrorMsg("At least one test case is required for this question type.");
      return;
    }
    if (questionType === "Output Prediction" && !options.some((o) => o.isCorrect)) {
      setErrorMsg("Please mark at least one option as correct.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      title,
      description,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      questionType,
      difficulty,
      maxMarks,
      maxAttempts,
      allowedLanguages,
      enabled: "Enabled" as const,
      runCodeSetting: "Enabled" as const,
      timeLimit,
      options: questionType === "Output Prediction" ? options : undefined,
      testCases: questionType !== "Output Prediction" ? testCases : undefined,
      starterCode,
    };

    try {
      let savedId = existing ? existing.id : "";
      if (existing) {
        await updateQuestion(existing.id, payload);
      } else {
        savedId = await addQuestion(payload);
      }

      // Link question to target assessment test in Firestore
      if (db && targetAssessmentId && savedId) {
        await updateDoc(doc(db, "assessments", targetAssessmentId), {
          questionIds: arrayUnion(savedId),
        }).catch((err) => console.warn("Failed to link question to assessment:", err));
      }

      navigate("/admin/questions");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save question to Firestore. Check connection.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full font-sans">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button onClick={() => navigate("/admin/questions")} className="btn-secondary p-2.5">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {existing ? "Edit Question" : "Create New Question"}
          </h1>
          <p className="text-xs font-semibold text-slate-500">Configure question type, multi-language snippets, and test cases</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Question Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Factorial Calculation / Output Prediction"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Assign to Assessment Test</label>
            <select
              value={targetAssessmentId}
              onChange={(e) => setTargetAssessmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-blue-50/50 text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Assessment (Optional) --</option>
              {availableAssessments.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="Programming Problem">Programming Problem</option>
              <option value="Output Prediction">Output Prediction (MCQ)</option>
              <option value="Code Completion">Code Completion</option>
              <option value="Error Identification">Error Identification</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Max Marks</label>
            <input
              type="number"
              min={1}
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Max Attempts</label>
            <input
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Question Description / Problem Overview</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the problem or instruct candidates on what to do..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Allowed Candidate Languages</label>
          <LanguageMultiSelect selected={allowedLanguages} onChange={setAllowedLanguages} />
        </div>

        <div>
          <QuestionTimeLimitInput value={timeLimit} onChange={setTimeLimit} />
        </div>

        {/* Multi-Language Code Snippets Section */}
        <div className="border-t border-slate-100 pt-6">
          <div className="mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              Multi-Language Code Snippets / Templates
            </label>
            <p className="text-[11px] font-medium text-slate-500">
              Provide code snippets in Python, C++, Java, or C. Candidates will view code in their selected language.
            </p>
          </div>
          <LanguageCodeTabs languages={allowedLanguages} codes={starterCode} onChange={setStarterCode} />
        </div>

        {/* Output Prediction MCQ Choices */}
        {questionType === "Output Prediction" && (
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">MCQ Options (Output Choices)</h3>
                <p className="text-[11px] text-slate-500 font-medium">Add choices and mark the correct option</p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setOptions([...options, { id: "opt_" + crypto.randomUUID(), text: "", isCorrect: false }])}
                className="btn-secondary py-1.5 text-xs disabled:opacity-50"
              >
                <Plus size={14} /> Add Option
              </button>
            </div>

            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={opt.isCorrect}
                    onChange={() => {
                      setOptions(options.map((o) => ({ ...o, isCorrect: o.id === opt.id })));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    required
                    value={opt.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOptions(options.map((o) => (o.id === opt.id ? { ...o, text: val } : o)));
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((o) => o.id !== opt.id))}
                      className="p-1.5 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Cases (For Programming, Error Identification, Code Completion) */}
        {questionType !== "Output Prediction" && (
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Test Cases &amp; Evaluation Inputs</h3>
                <p className="text-[11px] text-slate-500 font-medium">Add test cases. Check "Hidden" for secret test cases not visible to candidates.</p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setTestCases([...testCases, { id: "tc_" + crypto.randomUUID(), input: "", expectedOutput: "", isHidden: false }])}
                className="btn-secondary py-1.5 text-xs disabled:opacity-50"
              >
                <Plus size={14} /> Add Test Case
              </button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div key={tc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Test Case #{idx + 1}</span>
                      {tc.isHidden ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[10px]">
                          <EyeOff size={11} /> Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                          <Eye size={11} /> Public Sample
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={tc.isHidden ?? false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setTestCases(testCases.map((t) => (t.id === tc.id ? { ...t, isHidden: val } : t)));
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        Mark as Hidden Test Case
                      </label>

                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTestCases(testCases.filter((t) => t.id !== tc.id))}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Standard Input</label>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestCases(testCases.map((t) => (t.id === tc.id ? { ...t, input: val } : t)));
                        }}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Expected Output</label>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestCases(testCases.map((t) => (t.id === tc.id ? { ...t, expectedOutput: val } : t)));
                        }}
                        placeholder="e.g. 120"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end border-t border-slate-100">
          {errorMsg && (
            <p className="text-sm font-semibold text-red-600 mr-auto">{errorMsg}</p>
          )}
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm font-bold shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
            <Save size={16} /> {saving ? "Saving..." : "Save Question to Bank"}
          </button>
        </div>
      </form>
    </div>
  );
};
