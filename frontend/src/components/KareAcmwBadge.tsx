import React from "react";

export const KareAcmwBadge: React.FC<{ className?: string; size?: number }> = ({
  className = "",
  size = 40,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-xl bg-white p-1 shadow-sm border border-slate-200/60 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <img
        src="/assets/kare-acmw-badge.png"
        alt="KARE ACM-W Badge"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback emblem SVG if png asset fails to load
          const target = e.currentTarget;
          target.style.display = "none";
        }}
      />
    </div>
  );
};
