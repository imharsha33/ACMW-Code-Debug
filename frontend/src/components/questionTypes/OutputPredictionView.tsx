import React from "react";
import type { Question, QuestionRuntime } from "../../types";
import { QuestionShell } from "../QuestionShell";

interface Props {
  question: Question;
  runtime: QuestionRuntime;
  remainingSeconds: number | null;
  locked: boolean;
  onOptionSelect: (optionId: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitDisabledReason?: string;
}

export const OutputPredictionView: React.FC<Props> = ({
  question,
  runtime,
  remainingSeconds,
  locked,
  onOptionSelect,
  onSubmit,
  submitDisabled,
  submitDisabledReason,
}) => (
  <QuestionShell
    question={question}
    runtime={runtime}
    remainingSeconds={remainingSeconds}
    locked={locked}
    onSubmit={onSubmit}
    submitDisabled={submitDisabled}
    submitDisabledReason={submitDisabledReason}
  >
    <div className="space-y-3">
      {question.options?.map((opt) => {
        const selected = runtime.selectedOptionId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onOptionSelect(opt.id)}
            disabled={locked}
            className={`w-full flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all ${
              selected
                ? "border-orange-500 bg-orange-50/70 text-slate-950 font-bold ring-1 ring-orange-500 shadow-xs"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-orange-500 bg-orange-500" : "border-slate-400"
                }`}
              >
                {selected && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <span>{opt.text}</span>
            </div>
          </button>
        );
      })}
    </div>
  </QuestionShell>
);
