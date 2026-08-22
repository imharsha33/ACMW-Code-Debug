import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { HelpCircle, Sliders, Award, Plus, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { AcmwBrand } from "../../components/AcmwBrand";


export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    questions,
    assessmentSettings,
  } = useApp();

  const totalQuestions = questions.length;
  const enabledQuestions = questions.filter((q) => q.enabled === "Enabled").length;

  return (
    <div className="space-y-8 w-full">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <AcmwBrand size="lg" badgeSize={42} showSubline sublineText="Admin Control Center & Examination Management" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate("/admin/assessments/new")} className="btn-primary py-2.5 px-5 font-bold shadow-md">
            <Plus size={18} /> + CREATE NEW ASSESSMENT
          </button>
          <button onClick={() => navigate("/admin/questions/new")} className="btn-secondary">
            <Plus size={16} /> Add Questions to Bank
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Total Question Bank" value={String(totalQuestions)} icon={HelpCircle} hint={`${enabledQuestions} enabled for exam`} />
        <StatCard label="Security Mode" value={assessmentSettings.fullscreenMode ?? "Required"} icon={Sliders} hint={`Tab Switch: ${assessmentSettings.tabSwitchMode ?? "Enforce"}`} />
        <StatCard label="Submit Threshold" value={`${assessmentSettings.overallSubmitThresholdMinutes ?? 15} Min`} icon={Clock} hint="Overall submit button activation" />
      </div>

      {/* Main Grid: Management Cards & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        {/* Left Column: Quick Actions & Navigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Platform Quick Actions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4 tracking-tight flex items-center justify-between">
              <span>Platform Quick Actions</span>
              <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">ACM-W Admin</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div 
                onClick={() => navigate("/admin/questions")} 
                className="group cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#FF6B00] hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100/70 text-[#FF6B00]">
                    <HelpCircle size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 group-hover:text-[#FF6B00]">→</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Question Bank</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Manage, create, or edit problem sets.</p>
              </div>

              <div 
                onClick={() => navigate("/admin/assessment-settings")} 
                className="group cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#FF6B00] hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
                    <Sliders size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 group-hover:text-[#FF6B00]">→</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Assessment Rules</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Configure timers, thresholds &amp; security.</p>
              </div>

              <div 
                onClick={() => navigate("/admin/results")} 
                className="group cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#FF6B00] hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600">
                    <Award size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 group-hover:text-[#FF6B00]">→</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Live Results</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">View scores, submissions &amp; analytics.</p>
              </div>

              <div 
                onClick={() => navigate("/admin/assessment-settings")} 
                className="group cursor-pointer p-4 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-50 hover:border-[#FF6B00] hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF6B00] text-white shadow-xs">
                    <Sliders size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-[#FF6B00]">→</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Add &amp; Configure Assessment</h4>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">Set exam title, timeframe schedule, duration &amp; submit threshold.</p>
              </div>

              <div 
                onClick={() => navigate("/admin/questions/new")} 
                className="group cursor-pointer p-4 rounded-xl border border-dashed border-[#FF6B00]/40 bg-white hover:border-[#FF6B00] hover:shadow-md transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100/70 text-[#FF6B00]">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-extrabold text-[#FF6B00]">→</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Add Questions to Assessment</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Add Error ID, Output or Coding problem snippets.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Side Dashboard): Stats */}
        <div className="space-y-6">
          {/* Card 1: Assessment Status Overview */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 mb-3 tracking-tight">Assessment Status Overview</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Active Questions
                </span>
                <span className="font-black text-slate-900">{enabledQuestions} / {totalQuestions}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-2">
                  <Clock size={14} className="text-[#FF6B00]" /> Duration Limit
                </span>
                <span className="font-black text-slate-900">
                  {assessmentSettings.overallTimeLimit.hours}h {assessmentSettings.overallTimeLimit.minutes}m
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-500 flex items-center gap-2">
                  <Sliders size={14} className="text-blue-500" /> Submit Threshold
                </span>
                <span className="font-black text-slate-900">
                  {assessmentSettings.overallSubmitThresholdMinutes ?? 10} min
                </span>
              </div>
            </div>
            
            <button onClick={() => navigate("/admin/results")} className="w-full btn-primary py-2.5 mt-2 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5">
              View Candidate Scores <Award size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
