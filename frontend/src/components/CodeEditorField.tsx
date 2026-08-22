import React, { useState, useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
  label?: string;
  language?: string;
  errorLine?: number | null;
}

export const CodeEditorField: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  language = "Python",
  errorLine = null,
}) => {
  const [monacoLoaded, setMonacoLoaded] = useState(true);

  // Normalize language string for Monaco Editor
  const getMonacoLanguage = (lang: string): string => {
    const l = lang.toLowerCase().trim();
    if (l.includes("py")) return "python";
    if (l === "c" || l === "c lang") return "c";
    if (l.includes("c++") || l.includes("cpp")) return "cpp";
    if (l.includes("java")) return "java";
    return "python";
  };

  const lines = value.split("\n");
  const lineCount = lines.length || 1;

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md flex flex-col font-mono">
      {/* IDE Top Control Bar */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-300 font-extrabold uppercase">{language} IDE</span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          {errorLine && (
            <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Error on Line {errorLine}
            </span>
          )}
          <span>{lineCount} Lines</span>
          <span className="text-blue-400 font-bold">Monaco Active</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative min-h-[380px] w-full bg-slate-950 text-slate-100 font-mono text-xs">
        {monacoLoaded ? (
          <Editor
            height="380px"
            language={getMonacoLanguage(language)}
            theme="vs-dark"
            value={value}
            onChange={(val) => onChange(val ?? "")}
            onMount={() => setMonacoLoaded(true)}
            loading={<div className="p-4 text-xs text-slate-400 font-mono">Loading Monaco Code Editor...</div>}
            options={{
              readOnly,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: "on",
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder || `// Write your ${language} solution here...`}
            className="w-full h-[380px] bg-slate-950 p-4 text-xs font-mono text-slate-100 outline-none resize-none"
          />
        )}
      </div>
    </div>
  );
};
