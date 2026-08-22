import React from "react";
import { SlidersHorizontal } from "lucide-react";

export const NotConfiguredPill: React.FC = () => (
  <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
    <SlidersHorizontal size={11} />
    Not configured
  </span>
);
