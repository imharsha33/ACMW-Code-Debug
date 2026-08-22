import React from "react";

interface Props {
  value: { hours: number; minutes: number; seconds: number };
  onChange: (val: { hours: number; minutes: number; seconds: number }) => void;
  disabled?: boolean;
}

export const HMSInput: React.FC<Props> = ({ value, onChange, disabled }) => {
  const handleChange = (field: "hours" | "minutes" | "seconds", raw: string) => {
    const parsed = Math.max(0, parseInt(raw, 10) || 0);
    onChange({ ...value, [field]: parsed });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={23}
          value={value.hours}
          onChange={(e) => handleChange("hours", e.target.value)}
          disabled={disabled}
          className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-mono text-slate-900 outline-none focus:border-orange-500"
        />
        <span className="text-xs font-semibold text-slate-500">h</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={59}
          value={value.minutes}
          onChange={(e) => handleChange("minutes", e.target.value)}
          disabled={disabled}
          className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-mono text-slate-900 outline-none focus:border-orange-500"
        />
        <span className="text-xs font-semibold text-slate-500">m</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={59}
          value={value.seconds}
          onChange={(e) => handleChange("seconds", e.target.value)}
          disabled={disabled}
          className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm font-mono text-slate-900 outline-none focus:border-orange-500"
        />
        <span className="text-xs font-semibold text-slate-500">s</span>
      </div>
    </div>
  );
};
