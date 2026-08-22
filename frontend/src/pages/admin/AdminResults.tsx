import React from "react";
import { useApp } from "../../context/AppContext";
import { Award, CheckCircle, Clock, ShieldAlert, RotateCcw, Download, FileSpreadsheet } from "lucide-react";

export const AdminResults: React.FC = () => {
  const { registeredStudents, adminResetStudentViolations, questions } = useApp();

  // Deduplicate registered students by email to ensure no duplicate rows are ever shown
  const deduplicatedStudents = Array.from(
    new Map(
      registeredStudents
        .filter((s) => s.email.toLowerCase().trim() !== "acmw@kare.klu.in") // Hide admin from candidate results
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

  const handleDownloadCSV = () => {
    if (deduplicatedStudents.length === 0) return;

    // Header row
    const headers = [
      "Candidate Name",
      "Email Address",
      "Proctoring Status",
      "Tab Switch Violations",
      "Assessment Status",
      "Score Obtained",
      "Total Max Score",
      "Percentage Score (%)",
    ];

    // Data rows
    const rows = deduplicatedStudents.map((student) => {
      const name = getDisplayName(student.email);
      const proctorStatus = student.isBlocked ? "Blocked / Terminated" : "Access Active";
      const violations = student.tabSwitchCount;
      const testStatus = student.testSubmitted ? "Completed & Submitted" : "In Progress";
      const score = student.totalScore ?? 0;
      const maxScore = student.maxPossibleScore || totalMaxMarks || 100;
      const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0.0";

      return [
        `"${name.replace(/"/g, '""')}"`,
        `"${student.email}"`,
        `"${proctorStatus}"`,
        violations,
        `"${testStatus}"`,
        score,
        maxScore,
        `"${percentage}%"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Live_Candidate_Results_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Live Candidate Results</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Real-time score submissions, violation logs, and proctoring controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
            {deduplicatedStudents.length} Registered Candidates
          </span>

          <button
            onClick={handleDownloadCSV}
            disabled={deduplicatedStudents.length === 0}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download CSV spreadsheet of candidate scores and proctoring metrics"
          >
            <Download size={15} /> Download CSV Report
          </button>
        </div>
      </div>

      {deduplicatedStudents.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3">
          <Award size={48} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-900">No candidate sessions active</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once students log in or are added by admin, their live statuses and scores will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs font-medium text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">Candidate</th>
                <th className="px-4 py-3">Score &amp; Marks</th>
                <th className="px-4 py-3">Proctoring Status</th>
                <th className="px-4 py-3">Violations</th>
                <th className="px-4 py-3">Assessment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deduplicatedStudents.map((student) => {
                const score = student.totalScore ?? 0;
                const maxMarks = student.maxPossibleScore || totalMaxMarks || 100;
                const pct = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;

                return (
                  <tr key={student.email} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-900">{getDisplayName(student.email)}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{student.email}</p>
                    </td>
                    <td className="px-4 py-4">
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
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {student.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <ShieldAlert size={12} /> Blocked / Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Access Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          student.tabSwitchCount > 0 ? "text-amber-600" : "text-slate-500"
                        }`}
                      >
                        {student.tabSwitchCount} tab switches
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {student.testSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Completed &amp; Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                          <Clock size={12} /> In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {student.isBlocked || student.tabSwitchCount > 0 || student.testSubmitted ? (
                        <button
                          onClick={() => adminResetStudentViolations(student.email)}
                          title="Reset student violations & unlock exam"
                          className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw size={12} /> Reset
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
  );
};
