// utils/formatters.js

/**
 * Format xác suất 0-1 → "87.3%"
 */
export const formatPercent = (prob, decimals = 1) =>
  `${(prob * 100).toFixed(decimals)}%`;

/**
 * Map risk level → màu CSS Tailwind
 */
export const riskColor = (risk) => ({
  high:   "text-red-500",
  medium: "text-yellow-500",
  low:    "text-green-500",
}[risk] || "text-gray-400");

export const riskBg = (risk) => ({
  high:   "bg-red-500/15 border-red-500/30",
  medium: "bg-yellow-500/15 border-yellow-500/30",
  low:    "bg-green-500/15 border-green-500/30",
}[risk] || "bg-gray-500/15 border-gray-500/30");

export const riskLabel = (risk) => ({
  high:   "⚠️ Nguy cơ cao",
  medium: "⚡ Nguy cơ vừa",
  low:    "✅ Nguy cơ thấp",
}[risk] || "Không xác định");

/**
 * Rút gọn tên class dài
 */
export const shortLabel = (label) =>
  label.replace(/\s*\(.*?\)\s*/g, "").trim();

/**
 * Format ngày giờ VN
 */
export const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
