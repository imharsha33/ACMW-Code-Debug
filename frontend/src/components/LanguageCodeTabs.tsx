import React, { useState } from "react";
import type { Language } from "../types";
import { CodeEditorField } from "./CodeEditorField";

interface Props {
  languages: Language[];
  codes: Partial<Record<Language, string>>;
  onChange: (codes: Partial<Record<Language, string>>) => void;
  placeholder?: string;
}

export const LanguageCodeTabs: React.FC<Props> = ({
  languages,
  codes,
  onChange,
  placeholder,
}) => {
  const [activeLang, setActiveLang] = useState<Language>(languages[0] ?? "Python");

  if (languages.length === 0) {
    return <p className="text-xs italic text-slate-500">Select at least one allowed language above.</p>;
  }

  const currentCode = codes[activeLang] ?? "";

  const handleCodeChange = (val: string) => {
    onChange({ ...codes, [activeLang]: val });
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap border-b border-slate-200">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`border-b-2 px-3 py-1.5 text-xs font-bold transition-colors ${
              activeLang === lang
                ? "border-orange-500 text-orange-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
      <CodeEditorField
        value={currentCode}
        onChange={handleCodeChange}
        placeholder={placeholder ?? `# Write initial ${activeLang} template...`}
        rows={8}
      />
    </div>
  );
};
