import React from "react";
import type { Question, QuestionRuntime } from "../types";
import { Play, Send, AlertTriangle } from "lucide-react";
import { DifficultyBadge, StatusBadge } from "./Badges";

interface Props {
  question: Question;
  runtime: QuestionRuntime;
  remainingSeconds: number | null;
  locked: boolean;
  onRun?: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitDisabledReason?: string;
  children: React.ReactNode;
}

export const QuestionShell: React.FC<Props> = ({
  question,
  runtime,
  locked,
  onRun,
  onSubmit,
  submitDisabled,
  submitDisabledReason,
  children,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold text-slate-900">{question.title}</h2>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">{question.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge status={runtime.status} />
        <span className="text-xs font-mono text-slate-500">
          Attempts: {runtime.attemptsUsed} / {question.maxAttempts}
        </span>
      </div>
    </div>

    {children}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <div>
        {submitDisabledReason && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <AlertTriangle size={14} />
            {submitDisabledReason}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onRun && (
          <button
            type="button"
            onClick={onRun}
            disabled={locked}
            className="btn-secondary"
          >
            <Play size={14} /> Run Code
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled || locked}
          className="btn-primary"
        >
          <Send size={14} /> Submit Question
        </button>
      </div>
    </div>
  </div>
);

export const RunOutputPanel: React.FC<{ output: string | null }> = ({ output }) => {
  if (!output) return null;
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Console Output</p>
      <pre className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs font-mono text-slate-100 whitespace-pre-wrap">
        {output}
      </pre>
    </div>
  );
};
