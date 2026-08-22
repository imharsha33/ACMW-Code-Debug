import React from "react";
import type { Difficulty, QuestionEnabled, QuestionStatus, QuestionType, RunCodeSetting } from "../types";
import { Bug, ListChecks, PenLine, Code2 } from "lucide-react";

export const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
  const styles: Record<Difficulty, string> = {
    Easy: "text-emerald-700 bg-emerald-50 border-emerald-200",
    Medium: "text-amber-700 bg-amber-50 border-amber-200",
    Hard: "text-red-700 bg-red-50 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono-tabular ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: QuestionStatus }> = ({ status }) => {
  const styles: Record<QuestionStatus, string> = {
    "Not Started": "text-slate-600 bg-slate-100 border-slate-200",
    "In Progress": "text-orange-700 bg-orange-50 border-orange-200",
    Submitted: "text-emerald-700 bg-emerald-50 border-emerald-200",
    "Time Expired": "text-red-700 bg-red-50 border-red-200",
    "Max Attempts Reached": "text-amber-700 bg-amber-50 border-amber-200",
    Completed: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  const dot: Record<QuestionStatus, string> = {
    "Not Started": "bg-slate-400",
    "In Progress": "bg-orange-500",
    Submitted: "bg-emerald-500",
    "Time Expired": "bg-red-500",
    "Max Attempts Reached": "bg-amber-500",
    Completed: "bg-emerald-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
};

export const EnabledBadge: React.FC<{ enabled: QuestionEnabled }> = ({ enabled }) => {
  const isEnabled = enabled === "Enabled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${
        isEnabled
          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
          : "text-slate-500 bg-slate-100 border-slate-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
      {enabled}
    </span>
  );
};

export const RunCodeBadge: React.FC<{ runCode: RunCodeSetting }> = ({ runCode }) => (
  <EnabledBadge enabled={runCode} />
);

export const LanguagePill: React.FC<{ language: string }> = ({ language }) => (
  <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-mono-tabular font-medium text-slate-700">
    {language}
  </span>
);

const QUESTION_TYPE_ICON: Record<QuestionType, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  "Error Identification": Bug,
  "Output Prediction": ListChecks,
  "Code Completion": PenLine,
  "Programming Problem": Code2,
};

export const QuestionTypeBadge: React.FC<{ type: QuestionType }> = ({ type }) => {
  const Icon = QUESTION_TYPE_ICON[type];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
      <Icon size={12} strokeWidth={2} />
      {type}
    </span>
  );
};
