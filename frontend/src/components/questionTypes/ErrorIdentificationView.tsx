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

export const ErrorIdentificationView: React.FC<Props> = ({
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
  const faulty = language ? question.faultyCode?.[language] ?? "" : "";
  const working = language ? runtime.code[language] ?? faulty : "";

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
      <div className="mb-3 flex flex-wrap gap-1.5">
        {question.allowedLanguages.map((l) => (
          <button key={l} type="button" onClick={() => onLanguageChange(l)} disabled={locked}>
            <LanguagePill language={l} />
          </button>
        ))}
      </div>

      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Faulty Code Template</p>
        <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800">{faulty}</pre>
      </div>

      <CodeEditorField
        label="Fix the Code Below"
        value={working}
        onChange={onCodeChange}
        readOnly={locked}
        rows={8}
      />
      <RunOutputPanel output={runtime.lastOutput} />
    </QuestionShell>
  );
};
