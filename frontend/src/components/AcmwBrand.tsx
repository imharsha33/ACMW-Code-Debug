import React from "react";
import { KareAcmwBadge } from "./KareAcmwBadge";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  badgeSize?: number;
  showSubline?: boolean;
  sublineText?: string;
  className?: string;
  isDark?: boolean;
}

export const AcmwBrand: React.FC<Props> = ({
  size = "md",
  badgeSize,
  showSubline = false,
  sublineText = "Student Chapter",
  className = "",
  isDark = false,
}) => {
  const calculatedBadgeSize =
    badgeSize ?? (size === "sm" ? 36 : size === "lg" ? 48 : size === "xl" ? 60 : 42);

  const titleSize =
    size === "sm"
      ? "text-base"
      : size === "lg"
      ? "text-2xl"
      : size === "xl"
      ? "text-4xl"
      : "text-xl";

  const sublineSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* KARE ACM-W Badge directly in front */}
      <KareAcmwBadge size={calculatedBadgeSize} />

      {/* Brand Text */}
      <div className="flex flex-col justify-center leading-none">
        <div className={`font-black tracking-tight flex items-center ${titleSize}`}>
          <span className="text-blue-600 font-black">ACM</span>
          <span className="text-pink-500 font-black">-W</span>
        </div>
        {showSubline && (
          <p
            className={`font-bold uppercase tracking-widest mt-1 ${sublineSize} ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {sublineText}
          </p>
        )}
      </div>
    </div>
  );
};
