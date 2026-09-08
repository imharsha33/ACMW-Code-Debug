import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { HelpCircle, Sliders, Award, Plus, CheckCircle2, Clock, ShieldAlert, RotateCcw, CheckCircle, Radio, Users } from "lucide-react";
import { StatCard } from "../../components/StatCard";
import { AcmwBrand } from "../../components/AcmwBrand";


export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    questions,
    assessmentSettings,
    registeredStudents,
    adminResetStudentViolations,
  } = useApp();

  const totalQuestions = questions.length;
  const enabledQuestions = questions.filter((q) => q.enabled === "Enabled").length;

  const deduplicatedStudents = Array.from(
    new Map(
      registeredStudents
        .filter((s) => s.email.toLowerCase().trim() !== "acmw@kare.klu.in")
        .map((s) => [s.email.toLowerCase().trim(), s])
    ).values()
  );

  const totalMaxMarks = questions
    .filter((q) => q.enabled === "Enabled")
    .reduce((acc, curr) => acc + curr.maxMarks, 0);

  const getDisplayName = (email: string) => {
    const prefix = email.split("@")[0];
    if (/^\d+$/.test(prefix)) {
      return `Candidate ${prefix}`;
    }
    return prefix
      .split(/[._]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const activeCandidatesCount = deduplicatedStudents.filter(s => !s.testSubmitted).length;
  const blockedCandidatesCount = deduplicatedStudents.filter(s => s.isBlocked).length;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Question Bank" value={String(totalQuestions)} icon={HelpCircle} hint={`${enabledQuestions} enabled for exam`} />
        <StatCard label="Active Candidates" value={String(activeCandidatesCount)} icon={Users} hint={`${deduplicatedStudents.length} total registered`} />
        <StatCard label="Blocked by Proctor" value={String(blockedCandidatesCount)} icon={ShieldAlert} hint="Tab switch violation locks" />
        <StatCard label="Submit Threshold" value={`${assessmentSettings.overallSubmitThresholdMinutes ?? 15} Min`} icon={Clock} hint="Overall submit button activation" />
      </div>

      {/* Live Candidate Proctoring & Progress Monitor */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Live Candidate Monitoring &amp; Progress (Real-Time)</h3>
          </div>
          <button
            onClick={() => navigate("/admin/results")}
            className="text-xs font-bold text-[#FF6B00] hover:text-orange-600 flex items-center gap-1"
          >
            Full Results &amp; CSV Export →
          </button>
        </div>

        {deduplicatedStudents.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center font-medium">No candidates registered yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Live Score</th>
                  <th className="px-4 py-3">Progress / Active Question</th>
                  <th className="px-4 py-3">Proctoring Status</th>
                  <th className="px-4 py-3">Violations</th>
                  <th className="px-4 py-3 text-right">Instant Unlock / Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deduplicatedStudents.map((student) => {
                  const score = student.totalScore ?? 0;
                  const maxMarks = student.maxPossibleScore || totalMaxMarks || 100;
                  const pct = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;
                  const answered = student.questionsAnswered ?? 0;
                  const totalQ = student.totalQuestionsCount || enabledQuestions || 1;

                  return (
                    <tr key={student.email} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-slate-900">{getDisplayName(student.email)}</p>
                        <p className="text-[11px] text-slate-500">{student.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {score} / {maxMarks}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              pct >= 70
                                ? "bg-emerald-100 text-emerald-800"
                                : pct >= 40
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">
                          {answered} / {totalQ} Solved
                        </p>
                        {student.activeQuestionTitle && (
                          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                            {student.activeQuestionTitle}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {student.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                            <ShieldAlert size={12} /> Blocked / Locked
                          </span>
                        ) : student.testSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Completed &amp; Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} /> Active Exam
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={student.tabSwitchCount > 0 ? "text-amber-600" : "text-slate-500"}>
                          {student.tabSwitchCount} / {assessmentSettings.tabSwitchLimit ?? 3}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {student.isBlocked || student.tabSwitchCount > 0 || student.testSubmitted ? (
                          <button
                            onClick={() => adminResetStudentViolations(student.email)}
                            title="Reset student violations & instantly unblock exam"
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <RotateCcw size={12} /> Unblock / Reset
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Grid: Management Cards & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Quick Actions & Navigation */}
        <div className="lg:col-span-2 space-y-6">
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
                <h4 className="text-xs font-black text-slate-900 group-hover:text-[#FF6B00] transition-colors">Live Results &amp; CSV</h4>
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
            </div>
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
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

