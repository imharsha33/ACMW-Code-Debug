import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { DifficultyBadge, QuestionTypeBadge, StatusBadge } from "../../components/Badges";
import { PlayCircle } from "lucide-react";

export const StudentQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { questions, getRuntime } = useApp();

  const enabledQuestions = questions.filter((q) => q.enabled === "Enabled");

  return (
    <div className="space-y-6 w-full">

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Assessment Questions</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            List of active questions assigned for this assessment
          </p>
        </div>

        <button onClick={() => navigate("/student/assessment")} className="btn-primary">
          <PlayCircle size={16} /> Open Runner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {enabledQuestions.map((q, idx) => {
          const rt = getRuntime(q.id);
          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                  <h3 className="text-base font-extrabold text-slate-900">{q.title}</h3>
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <p className="text-xs text-slate-600 font-medium line-clamp-1">{q.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <QuestionTypeBadge type={q.questionType} />
                  <span className="text-xs font-mono text-slate-500 font-semibold">Marks: {q.maxMarks}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge status={rt.status} />
                <button onClick={() => navigate("/student/assessment/run")} className="btn-secondary text-xs">
                  Launch Question
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
