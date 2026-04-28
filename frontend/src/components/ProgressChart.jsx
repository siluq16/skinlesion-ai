// components/ProgressChart.jsx
import { formatPercent, shortLabel } from "../utils/formatters";

export default function ProgressChart({ probabilities = [], highlight }) {
  const sorted = [...probabilities].sort((a, b) => b.prob - a.prob);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(({ class_id, label, prob }) => {
        const isTop = class_id === highlight;
        const pct   = prob * 100;
        return (
          <div key={class_id}>
            <div className="flex justify-between items-center mb-0.5">
              <span className={`text-xs font-medium truncate max-w-[70%] ${isTop ? "text-teal-300" : "text-slate-400"}`}>
                {shortLabel(label)}
              </span>
              <span className={`text-xs font-bold tabular-nums ${isTop ? "text-teal-300" : "text-slate-500"}`}>
                {formatPercent(prob)}
              </span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isTop ? "bg-gradient-to-r from-teal-400 to-cyan-400" : "bg-slate-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
