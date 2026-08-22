import React from "react";
import { useApp } from "../context/AppContext";
import { User, Mail, Shield, Award } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { session } = useApp();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">User Profile</h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Account details and membership status
        </p>
      </div>

      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6">

        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="h-16 w-16 rounded-full bg-orange-100 text-orange-600 border border-orange-200 flex items-center justify-center font-black text-xl">
            {session?.name?.[0] ?? "U"}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{session?.name}</h2>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
              <Shield size={12} /> {session?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Mail size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Email Address</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{session?.email}</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Award size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Chapter Membership</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">KARE ACM-W Active Student</p>
          </div>
        </div>
      </div>
    </div>
  );
};
