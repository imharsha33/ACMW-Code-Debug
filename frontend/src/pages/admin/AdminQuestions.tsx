import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Plus, Edit2, Trash2, HelpCircle, Eye, EyeOff, AlertTriangle, X, RefreshCw, CheckCircle } from "lucide-react";
import { DifficultyBadge, EnabledBadge, QuestionTypeBadge } from "../../components/Badges";
import { EmptyState } from "../../components/EmptyState";
import type { Question } from "../../types";

export const AdminQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { questions, deleteQuestion, updateQuestion, syncAllQuestionsToFirestore } = useApp();
  const [confirmDelete, setConfirmDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    await deleteQuestion(confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    try {
      await syncAllQuestionsToFirestore();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to sync questions:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 w-full">

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-base">Delete Question?</h2>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{confirmDelete.title}"</span>?
            </p>
            <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
              ⚠️ This will permanently remove the question from Firestore and all candidate sessions instantly.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <X size={14} className="inline mr-1" />Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Question"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Question Bank</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Create, edit, and toggle active questions for candidates. Changes sync instantly to all connected students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {syncSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
              <CheckCircle size={14} /> Applied to Live Test!
            </span>
          )}

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
            title="Save and force apply all question bank updates to existing live candidate tests"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin text-orange-600" : "text-slate-600"} />
            {syncing ? "Applying Changes..." : "Save & Apply Changes to Live Test"}
          </button>

          <button onClick={() => navigate("/admin/questions/new")} className="btn-primary">
            <Plus size={16} /> Add New Question
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions in bank"
          description="Click above to add your first assessment question."
          action={
            <button onClick={() => navigate("/admin/questions/new")} className="btn-primary">
              <Plus size={14} /> Add Question
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs font-medium text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3">Question</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-slate-900">{q.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{q.description}</p>
                  </td>
                  <td className="px-4 py-4">
                    <QuestionTypeBadge type={q.questionType} />
                  </td>
                  <td className="px-4 py-4">
                    <DifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">{q.maxMarks}</td>
                  <td className="px-4 py-4">
                    <EnabledBadge enabled={q.enabled} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          updateQuestion(q.id, {
                            enabled: q.enabled === "Enabled" ? "Disabled" : "Enabled",
                          })
                        }
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                        title={q.enabled === "Enabled" ? "Disable question" : "Enable question"}
                      >
                        {q.enabled === "Enabled" ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                        className="p-1.5 text-slate-500 hover:text-orange-600 rounded-md hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(q)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
