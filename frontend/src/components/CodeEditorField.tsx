import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
  label?: string;
  language?: string;
  errorLine?: number | null;
  height?: string | number;
  fontSize?: number;
}

export const CodeEditorField: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  language = "Python",
  errorLine = null,
  height = "100%",
  fontSize = 14,
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
    <div className="w-full h-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md flex flex-col font-mono min-h-0">
      {/* IDE Top Control Bar */}
      <div className="h-8 bg-slate-900 border-b border-slate-800 px-3.5 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-300 font-extrabold uppercase">{language} Source</span>
        </div>

        <div className="flex items-center gap-3.5 text-[10px] text-slate-400">
          {errorLine && (
            <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Error on Line {errorLine}
            </span>
          )}
          <span className="text-slate-500">{lineCount} Lines</span>
          <span className="text-emerald-400 font-bold">Monaco Active</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 text-slate-100 font-mono text-xs">
        {monacoLoaded ? (
          <Editor
            height={height}
            language={getMonacoLanguage(language)}
            theme="vs-dark"
            value={value}
            onChange={(val) => onChange(val ?? "")}
            onMount={() => setMonacoLoaded(true)}
            loading={<div className="p-4 text-xs text-slate-400 font-mono">Loading Monaco Code Editor...</div>}
            options={{
              readOnly,
              fontSize: fontSize,
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
              padding: { top: 10, bottom: 10 },
            }}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            placeholder={placeholder || `// Write your ${language} solution here...`}
            className="w-full h-full bg-slate-950 p-4 text-xs font-mono text-slate-100 outline-none resize-none"
          />
        )}
      </div>
    </div>
  );
};

