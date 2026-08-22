import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Shield, Clock, AlertTriangle, ArrowRight, Loader2, MonitorSmartphone } from "lucide-react";
import { KareAcmwBadge } from "../../components/KareAcmwBadge";

export const AssessmentIntro: React.FC = () => {
  const navigate = useNavigate();
  const { assessmentSettings, startAssessment, assessmentSession, registeredStudents, session } = useApp();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleBegin = async () => {
    setStarting(true);
    setStartError(null);
    const result = await startAssessment();
    if (result.ok) {
      navigate("/student/assessment/run");
    } else {
      setStartError(result.error ?? "Could not start the assessment. Please try again.");
      setStarting(false);
    }
  };

  const now = new Date();
  let isLockedTimeframe = false;
  let timeframeMessage = "";

  const currentStudent = registeredStudents.find(
    (s) => s.email.toLowerCase().trim() === session?.email.toLowerCase().trim()
  );
  const hasSubmittedTest = assessmentSession.finalized || currentStudent?.testSubmitted;

  if (hasSubmittedTest) {
    isLockedTimeframe = true;
    timeframeMessage = "You have already completed/submitted this assessment. Re-entry is not permitted.";
  } else {
    if (assessmentSettings.startDate && assessmentSettings.startTime) {
      const formattedStart = `${assessmentSettings.startDate}T${assessmentSettings.startTime.length === 5 ? assessmentSettings.startTime + ":00" : assessmentSettings.startTime}`;
      const startDateTime = new Date(formattedStart);
      if (!isNaN(startDateTime.getTime()) && now < startDateTime) {
        isLockedTimeframe = true;
        timeframeMessage = `This assessment is scheduled to start on ${startDateTime.toLocaleDateString()} at ${startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please check back later.`;
      }
    }

    if (assessmentSettings.endDate && assessmentSettings.endTime) {
      const formattedEnd = `${assessmentSettings.endDate}T${assessmentSettings.endTime.length === 5 ? assessmentSettings.endTime + ":00" : assessmentSettings.endTime}`;
      const endDateTime = new Date(formattedEnd);
      if (!isNaN(endDateTime.getTime()) && now > endDateTime) {
        isLockedTimeframe = true;
        timeframeMessage = `This assessment ended on ${endDateTime.toLocaleDateString()} at ${endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Submissions are closed.`;
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center space-y-4">
        <KareAcmwBadge size={80} className="mx-auto" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-extrabold uppercase tracking-widest">
          KARE ACM-W OFFICIAL ASSESSMENT
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {assessmentSettings.name}
        </h1>

        <p className="text-sm text-slate-600 font-medium max-w-xl mx-auto">
          Welcome candidate. You are about to launch the live assessment environment. Please read all rules and guidelines carefully before beginning.
        </p>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Clock size={20} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Total Duration</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {assessmentSettings.overallTimeLimit.hours}h {assessmentSettings.overallTimeLimit.minutes}m 00s timed clock
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Shield size={20} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Proctored Security</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Fullscreen enforced with 3 max tab switch warnings
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 sm:col-span-2">
            <MonitorSmartphone size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Single Device Policy</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Once you start the test on this device, it cannot be opened on any other device simultaneously.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-xs font-medium text-amber-900 space-y-1.5">
          <p className="font-extrabold flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-600" /> Candidate Rules:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
            <li>Do not close or switch tabs. 3 switches will lock your exam automatically.</li>
            <li>Code execution results will evaluate test cases automatically.</li>
            <li>Press "Start Assessment" when you are ready in a quiet environment.</li>
            <li>The test can only run on one device at a time. Starting here will lock other devices out.</li>
          </ul>
        </div>

        {/* Multi-device start error */}
        {startError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-left text-xs font-medium text-red-900 space-y-1.5">
            <p className="font-extrabold flex items-center gap-1.5 text-red-800">
              <MonitorSmartphone size={15} className="text-red-600" /> Device Conflict
            </p>
            <p className="text-red-700 leading-relaxed">{startError}</p>
          </div>
        )}

        {isLockedTimeframe ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-left text-xs font-medium text-red-900 space-y-2.5 max-w-xl mx-auto shadow-xs">
            <p className="font-extrabold flex items-center gap-1.5 text-red-800 text-sm">
              <Shield size={18} className="text-red-600 animate-pulse" /> Assessment Access Locked
            </p>
            <p className="text-red-700 text-xs font-semibold leading-relaxed">
              {timeframeMessage}
            </p>
          </div>
        ) : (
          <div className="pt-4">
            <button
              onClick={handleBegin}
              disabled={starting}
              className="btn-primary text-base px-8 py-3.5 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {starting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying Access...
                </>
              ) : (
                <>
                  Start Assessment Now <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
