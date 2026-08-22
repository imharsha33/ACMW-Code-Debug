import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { HMSInput } from "../../components/HMSInput";
import { Save, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export const AssessmentSettingsPage: React.FC = () => {
  const { assessmentSettings, updateAssessmentSettings } = useApp();
  const [name, setName] = useState(assessmentSettings.name);
  const [timeLimit, setTimeLimit] = useState(assessmentSettings.overallTimeLimit);
  const [threshold, setThreshold] = useState<number>(assessmentSettings.overallSubmitThresholdMinutes ?? 15);
  const [startDate, setStartDate] = useState(assessmentSettings.startDate ?? "");
  const [startTime, setStartTime] = useState(assessmentSettings.startTime ?? "");
  const [endDate, setEndDate] = useState(assessmentSettings.endDate ?? "");
  const [endTime, setEndTime] = useState(assessmentSettings.endTime ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Re-sync form when Firestore data arrives (e.g. initial load or another admin edits)
  // Only sync if form is clean (no unsaved changes by this admin)
  useEffect(() => {
    if (!isDirty) {
      setName(assessmentSettings.name);
      setTimeLimit(assessmentSettings.overallTimeLimit);
      setThreshold(assessmentSettings.overallSubmitThresholdMinutes ?? 15);
      setStartDate(assessmentSettings.startDate ?? "");
      setStartTime(assessmentSettings.startTime ?? "");
      setEndDate(assessmentSettings.endDate ?? "");
      setEndTime(assessmentSettings.endTime ?? "");
    }
  }, [assessmentSettings, isDirty]);

  const markDirty = () => {
    setIsDirty(true);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      await updateAssessmentSettings({
        name,
        overallTimeLimit: timeLimit,
        overallSubmitThresholdMinutes: Number(threshold),
        startDate,
        startTime,
        endDate,
        endTime,
      });
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaveError(
        err?.message
          ? `Save failed: ${err.message}`
          : "Failed to save to database. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Assessment Configuration</h1>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Configure overall timers, submit button activation threshold, proctoring security levels, and candidate rules.
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle size={16} /> Assessment settings saved and synced to all candidates successfully!
        </div>
      )}

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {isDirty && !saving && !saved && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-xs font-semibold text-amber-800">
          <RefreshCw size={14} /> You have unsaved changes. Click "Save Configurations" to push updates to all candidates.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Assessment Event Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Overall Assessment Time Limit
            </label>
            <HMSInput value={timeLimit} onChange={(v) => { setTimeLimit(v); markDirty(); }} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Overall Submit Activation Threshold (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              required
              value={threshold}
              onChange={(e) => { setThreshold(Number(e.target.value)); markDirty(); }}
              placeholder="15"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-orange-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              The Overall Submit button will stay idle/locked until remaining exam time is &lt;= {threshold} minutes.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Assessment Timeframe</h3>
          <p className="text-[11px] text-slate-500 mb-3 font-medium">
            Students can only access the exam portal between these dates. Leave blank to allow access at any time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assessment Start Date &amp; Time
              </label>
              <div className="flex gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); markDirty(); }}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <input 
                  type="time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); markDirty(); }}
                  className="w-32 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Assessment End Date &amp; Time
              </label>
              <div className="flex gap-2">
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); markDirty(); }}
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <input 
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); markDirty(); }}
                  className="w-32 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Security &amp; Proctoring Rules</h3>
          <div className="space-y-3">

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-900">Fullscreen Mode Enforcement</p>
                <p className="text-[11px] text-slate-500">Candidate must stay in full screen during assessment</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs">Active</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-900">Tab Switch Violation Limit</p>
                <p className="text-[11px] text-slate-500">Maximum 3 tab switches allowed before auto-termination</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 font-extrabold text-xs">3 Warnings</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-70 disabled:cursor-not-allowed">
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Configurations
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
