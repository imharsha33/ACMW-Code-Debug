import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import type { AssessmentSettings } from "../../types";
import { Plus, Save, Trash2, Settings, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface Assessment extends AssessmentSettings {
  id: string;
}

const BLANK_ASSESSMENT: Omit<Assessment, "id"> = {
  name: "",
  overallTimeLimit: { hours: 1, minutes: 0, seconds: 0 },
  overallSubmitThresholdMinutes: 15,
  fullscreenMode: "Required",
  tabSwitchMode: "Enforce limit",
  tabSwitchLimit: 3,
  startDate: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endDate: new Date().toISOString().split("T")[0],
  endTime: "21:00",
  questionIds: [],
};

export const AdminAssessments: React.FC = () => {
  const location = useLocation();
  const { questions } = useApp();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(() => location.pathname.endsWith("/new"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Assessment, "id">>(BLANK_ASSESSMENT);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "assessments"), (snap) => {
      const list: Assessment[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Assessment, "id">) }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setAssessments(list);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMsg("Assessment name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const id = editingId ?? "assessment_" + crypto.randomUUID();
      await setDoc(doc(db, "assessments", id), { ...formData, updatedAt: Date.now() }, { merge: true });
      setSuccessMsg(editingId ? "Assessment updated successfully." : "Assessment created successfully.");
      setShowCreateForm(false);
      setEditingId(null);
      setFormData(BLANK_ASSESSMENT);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: Assessment) => {
    setFormData({ ...a });
    setEditingId(a.id);
    setShowCreateForm(true);
    setErrorMsg(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this assessment? This cannot be undone.")) return;
    await deleteDoc(doc(db, "assessments", id));
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingId(null);
    setFormData(BLANK_ASSESSMENT);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assessments</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Create and manage multiple independent assessments with their own timers, rules, and question sets.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setEditingId(null); setFormData(BLANK_ASSESSMENT); }}
          className="btn-primary py-2.5 px-5 text-sm font-bold"
        >
          <Plus size={16} /> New Assessment
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✓ {successMsg}
        </div>
      )}

      {/* Create / Edit Form */}
      {showCreateForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">
              {editingId ? "Edit Assessment" : "Create New Assessment"}
            </h2>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-700 text-xs font-semibold">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Assessment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. ACM-W Coding Round 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:border-blue-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Start Time</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:border-blue-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">End Date</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:border-blue-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">End Time</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:border-blue-600 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Overall Time Limit (hrs)</label>
              <input type="number" min={0} max={24} value={formData.overallTimeLimit.hours}
                onChange={(e) => setFormData((p) => ({ ...p, overallTimeLimit: { ...p.overallTimeLimit, hours: parseInt(e.target.value) || 0 } }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold focus:border-blue-600 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Time Limit (mins)</label>
              <input type="number" min={0} max={59} value={formData.overallTimeLimit.minutes}
                onChange={(e) => setFormData((p) => ({ ...p, overallTimeLimit: { ...p.overallTimeLimit, minutes: parseInt(e.target.value) || 0 } }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold focus:border-blue-600 focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Fullscreen Mode</label>
              <select value={formData.fullscreenMode} onChange={(e) => setFormData((p) => ({ ...p, fullscreenMode: e.target.value as any }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:border-blue-600 focus:outline-none">
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Tab Switch Policy</label>
              <select value={formData.tabSwitchMode} onChange={(e) => setFormData((p) => ({ ...p, tabSwitchMode: e.target.value as any }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:border-blue-600 focus:outline-none">
                <option value="Enforce limit">Enforce limit</option>
                <option value="Warn only">Warn only</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Max Tab Switches</label>
              <input type="number" min={1} max={20} value={formData.tabSwitchLimit ?? 3}
                onChange={(e) => setFormData((p) => ({ ...p, tabSwitchLimit: parseInt(e.target.value) || 3 }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono font-bold focus:border-blue-600 focus:outline-none" />
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">Assigned Exam Questions</label>
              <p className="text-[11px] text-slate-500 font-medium mb-3">Select which questions from the Question Bank belong to this assessment.</p>
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                {questions.length === 0 ? (
                  <p className="text-xs text-slate-400">No questions available in bank.</p>
                ) : (
                  questions.map((q) => {
                    const isSelected = (formData.questionIds ?? []).includes(q.id);
                    return (
                      <label key={q.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:border-blue-300">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData((p) => {
                                const current = p.questionIds ?? [];
                                return {
                                  ...p,
                                  questionIds: checked ? [...current, q.id] : current.filter((id) => id !== q.id),
                                };
                              });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="font-bold text-slate-800">{q.title}</span>
                          <span className="text-[10px] font-semibold text-slate-500">({q.questionType})</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-600">{q.maxMarks} Marks</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {errorMsg && <p className="text-sm font-semibold text-red-600">{errorMsg}</p>}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={handleCancel} className="btn-secondary py-2.5 px-5 text-sm font-bold">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 text-sm font-bold disabled:opacity-60">
              <Save size={16} /> {saving ? "Saving..." : (editingId ? "Update Assessment" : "Create Assessment")}
            </button>
          </div>
        </div>
      )}

      {/* Assessment List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-semibold">Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <Settings size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold text-sm">No assessments yet</p>
          <p className="text-slate-400 text-xs mt-1">Click "New Assessment" to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const now = new Date();
            const start = new Date(`${a.startDate}T${a.startTime}`);
            const end = new Date(`${a.endDate}T${a.endTime}`);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;
            const isEnded = now > end;

            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 truncate">{a.name || "Untitled Assessment"}</h3>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wide animate-pulse">
                          ● Live
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase tracking-wide">
                          Upcoming
                        </span>
                      )}
                      {isEnded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-extrabold text-[10px] uppercase tracking-wide">
                          Ended
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {a.startDate} {a.startTime} → {a.endDate} {a.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {a.overallTimeLimit.hours}h {a.overallTimeLimit.minutes}m limit
                      </span>
                      <span className="font-semibold text-slate-600">
                        Fullscreen: {a.fullscreenMode} · Tab policy: {a.tabSwitchMode}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(a)}
                      className="btn-secondary py-1.5 px-3.5 text-xs font-bold"
                    >
                      <Settings size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
