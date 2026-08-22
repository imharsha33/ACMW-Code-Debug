import React from "react";
import { KareAcmwBadge } from "./KareAcmwBadge";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  badgeSize?: number;
  showSubline?: boolean;
  sublineText?: string;
  className?: string;
}

export const HerizonBrand: React.FC<Props> = ({
  size = "md",
  badgeSize,
  showSubline = false,
  sublineText = "Assessment Platform",
  className = "",
}) => {
  const calculatedBadgeSize =
    badgeSize ?? (size === "sm" ? 32 : size === "lg" ? 54 : size === "xl" ? 72 : 40);

  const textSize =
    size === "sm"
      ? "text-sm"
      : size === "lg"
      ? "text-2xl sm:text-3xl"
      : size === "xl"
      ? "text-3xl sm:text-5xl"
      : "text-base sm:text-lg";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <KareAcmwBadge size={calculatedBadgeSize} />
      <div className="leading-tight">
        <div className={`font-black tracking-tight ${textSize}`}>
          <span className="text-blue-600 font-black">HER</span>
          <span className="text-pink-500 font-black">IZON</span>
          <span className="text-slate-900 font-bold ml-1.5">2026</span>
        </div>
        {showSubline && (
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            {sublineText}
          </p>
        )}
      </div>
    </div>
  );
};
