import React from "react";
import type { Language, Question, QuestionRuntime } from "../../types";
import { CodeEditorField } from "../CodeEditorField";
import { QuestionShell, RunOutputPanel } from "../QuestionShell";
import { LanguagePill } from "../Badges";

interface Props {
  question: Question;
  runtime: QuestionRuntime;
  remainingSeconds: number | null;
  locked: boolean;
  onLanguageChange: (lang: Language) => void;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitDisabledReason?: string;
}

export const ProgrammingProblemView: React.FC<Props> = ({
  question,
  runtime,
  remainingSeconds,
  locked,
  onLanguageChange,
  onCodeChange,
  onRun,
  onSubmit,
  submitDisabled,
  submitDisabledReason,
}) => {
  const language = runtime.selectedLanguage ?? question.allowedLanguages[0];
  const starter = language ? question.starterCode?.[language] ?? "" : "";
  const working = language ? runtime.code[language] ?? starter : "";

  return (
    <QuestionShell
      question={question}
      runtime={runtime}
      remainingSeconds={remainingSeconds}
      locked={locked}
      onRun={onRun}
      onSubmit={onSubmit}
      submitDisabled={submitDisabled}
      submitDisabledReason={submitDisabledReason}
    >
      <div className="mb-4 space-y-3">
        {question.problemStatement && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Problem Statement</h4>
            <p className="mt-1 text-sm text-slate-800 font-medium">{question.problemStatement}</p>
          </div>
        )}

        {question.inputFormat && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Input Format</h4>
            <p className="mt-1 text-xs rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-slate-800">
              {question.inputFormat}
            </p>
          </div>
        )}

        {question.outputFormat && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Output Format</h4>
            <p className="mt-1 text-xs rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-slate-800">
              {question.outputFormat}
            </p>
          </div>
        )}

        {question.constraints && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Constraints</h4>
            <p className="mt-1 text-xs font-mono text-slate-600">{question.constraints}</p>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {question.allowedLanguages.map((l) => (
          <button key={l} type="button" onClick={() => onLanguageChange(l)} disabled={locked}>
            <LanguagePill language={l} />
          </button>
        ))}
      </div>

      <CodeEditorField
        label={language ? `Solution Code (${language})` : undefined}
        value={working}
        onChange={onCodeChange}
        readOnly={locked}
        rows={10}
      />
      <RunOutputPanel output={runtime.lastOutput} />
    </QuestionShell>
  );
};
