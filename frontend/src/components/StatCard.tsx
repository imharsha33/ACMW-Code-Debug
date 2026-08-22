import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export const StatCard: React.FC<Props> = ({ label, value, icon: Icon, hint }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-150">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-100/80 shadow-2xs">
        <Icon size={18} strokeWidth={2.2} />
      </div>
    </div>
    <p className="font-mono-tabular text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    {hint && <p className="mt-1.5 text-xs text-slate-500 font-semibold">{hint}</p>}
  </div>
);
