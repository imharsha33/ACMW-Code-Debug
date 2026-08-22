import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
      <Icon size={24} strokeWidth={1.75} />
    </div>
    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-xs text-slate-500 font-medium">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
