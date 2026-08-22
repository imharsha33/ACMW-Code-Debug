import React from "react";
import type { Language } from "../types";

const ALL_LANGUAGES: Language[] = ["Python", "C++", "Java", "C"];

interface Props {
  selected: Language[];
  onChange: (langs: Language[]) => void;
}

export const LanguageMultiSelect: React.FC<Props> = ({ selected, onChange }) => {
  const toggleLanguage = (lang: Language) => {
    if (selected.includes(lang)) {
      if (selected.length === 1) return; // Must keep at least 1 language
      onChange(selected.filter((l) => l !== lang));
    } else {
      onChange([...selected, lang]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_LANGUAGES.map((lang) => {
        const active = selected.includes(lang);
        return (
          <button
            key={lang}
            type="button"
            onClick={() => toggleLanguage(lang)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
              active
                ? "border-orange-500 bg-orange-50 text-orange-700 shadow-xs"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
};
