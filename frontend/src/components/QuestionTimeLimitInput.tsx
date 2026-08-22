import React from "react";
import { HMSInput } from "./HMSInput";

interface Props {
  value: { hours: number; minutes: number; seconds: number };
  onChange: (val: { hours: number; minutes: number; seconds: number }) => void;
}

export const QuestionTimeLimitInput: React.FC<Props> = ({ value, onChange }) => (
  <div>
    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
      Question Time Limit
    </label>
    <HMSInput value={value} onChange={onChange} />
    <p className="mt-1 text-xs text-slate-500 font-medium">
      Set to 0h 0m 0s for no individual question time limit.
    </p>
  </div>
);
