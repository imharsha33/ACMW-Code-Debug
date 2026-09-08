import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { HelpCircle, PlayCircle, Award, ArrowRight, ShieldCheck, Clock, Code2 } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { AcmwBrand } from "../../components/AcmwBrand";

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { questions, session, assessmentSettings, assessmentSession } = useApp();

  const enabledCount = questions.filter((q) => q.enabled === "Enabled").length;
  const isStarted = assessmentSession?.startedAt && !assessmentSession?.finalized;

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <AcmwBrand size="lg" badgeSize={42} showSubline sublineText={`Student Candidate Workspace — ${session?.name || "Candidate"}`} />
        </div>


        <button onClick={() => navigate("/student/assessment")} className="btn-primary py-3 px-6 shadow-md">
          <PlayCircle size={17} /> {isStarted ? "Resume Assessment" : "Enter Assessment"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Assigned Questions" value={String(enabledCount)} icon={HelpCircle} hint="Available in live exam" />
        <StatCard label="Proctoring Mode" value={assessmentSettings.fullscreenMode ?? "Required"} icon={ShieldCheck} hint="Fullscreen &amp; Tab Switch Monitored" />
        <StatCard label="Overall Submit Threshold" value={`${assessmentSettings.overallSubmitThresholdMinutes ?? 15} Min`} icon={Clock} hint="Unlocks when remaining time <= 15 min" />
      </div>

      {/* Hero Assessment Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-extrabold">
          <Code2 size={14} /> KARE ACM-W Official Examination
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span>{assessmentSettings.name || "ACM-W Coding & Debugging Assessment"}</span>
        </h2>
        <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
          Solve structured programming problems, predict code outputs, identify bugs, and complete code snippets across Python, C++, Java, or C.
        </p>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => navigate("/student/assessment")} className="btn-primary text-sm px-8 py-3.5 shadow-md">
            {isStarted ? "Resume Live Assessment" : "Start Live Assessment"} <ArrowRight size={16} />
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#FF6B00]" /> Duration: {assessmentSettings.overallTimeLimit.hours}h {assessmentSettings.overallTimeLimit.minutes}m</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> Proctored Environment</span>
        </div>
      </div>
    </div>
  );
};


