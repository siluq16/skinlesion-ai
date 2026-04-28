// pages/Diagnose.jsx
import { useState, useEffect } from "react";
import ImageUploader from "../components/ImageUploader";
import { useDiagnosis } from "../hooks/useDiagnosis";
import { getDiseaseInfo } from "../services/chatApi";

const RISK_STYLE = {
  high:   { bg: "bg-red-500/10 border-red-500/30",     text: "text-red-400",     badge: "bg-red-500/20 text-red-300"     },
  medium: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400",   badge: "bg-amber-500/20 text-amber-300" },
  low:    { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
};
const RISK_LABEL = {
  high:   "⚠️ Nguy cơ cao — Cần khám bác sĩ ngay",
  medium: "⚡ Nguy cơ vừa — Nên theo dõi và tham khảo bác sĩ",
  low:    "✅ Nguy cơ thấp — Theo dõi định kỳ",
};

export default function Diagnose() {
  const { status, result, error, preview, diagnose, reset } = useDiagnosis();
  const [diseaseInfo, setDiseaseInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Gọi /api/disease-info khi có kết quả (có cache server-side)
  useEffect(() => {
    if (!result) return;
    setDiseaseInfo(null);
    setLoadingInfo(true);

    getDiseaseInfo(result.predicted_class, result.predicted_label)
      .then(res => {
        try {
          const text = res.info.replace(/```json|```/g, "").trim();
          setDiseaseInfo(JSON.parse(text));
        } catch {
          setDiseaseInfo({ error: res.info });
        }
      })
      .catch(err => setDiseaseInfo({ error: err.message }))
      .finally(() => setLoadingInfo(false));
  }, [result]);

  const isLoading = status === "loading";
  const isDone    = status === "success";
  const s         = result ? RISK_STYLE[result.risk] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-100 mb-2">Chẩn đoán da liễu</h1>
          <p className="text-slate-500 text-sm">Tải ảnh tổn thương da lên để AI phân tích và cung cấp thông tin chi tiết</p>
        </div>

        {/* Upload */}
        {!isDone && (
          <div className="mb-8">
            {!preview ? (
              <ImageUploader onFile={diagnose} disabled={isLoading} />
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 max-h-80">
                <img src={preview} alt="Preview" className="w-full object-cover max-h-80" />
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="text-teal-300 font-bold">Đang phân tích...</p>
                      <p className="text-slate-500 text-xs mt-1">ResNet50 + EfficientNet-B4 + CBAM</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {status === "error" && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                ❌ {error}
              </div>
            )}
          </div>
        )}

        {/* Kết quả */}
        {isDone && result && (
          <div className="space-y-6">

            {/* Ảnh + kết quả chính */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-slate-800 h-52">
                <img src={preview} alt="Ảnh chẩn đoán" className="w-full h-full object-cover" />
              </div>

              <div className={`rounded-2xl border p-6 flex flex-col justify-between ${s.bg}`}>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Kết quả AI</p>
                  <h2 className={`text-2xl font-black leading-tight mb-1 ${s.text}`}>
                    {result.predicted_label.replace(/\s*\(.*?\)/g, "")}
                  </h2>
                  <p className="text-xs text-slate-600 font-mono mb-4">{result.predicted_class.toUpperCase()}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-slate-800/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          result.risk === "high" ? "bg-red-400" :
                          result.risk === "medium" ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className={`text-xl font-black tabular-nums ${s.text}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <div className={`text-xs font-semibold px-3 py-2 rounded-xl ${s.badge}`}>
                    {RISK_LABEL[result.risk]}
                  </div>
                  <button
                    onClick={reset}
                    className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-xl py-2 transition-colors"
                  >
                    ← Chẩn đoán ảnh khác
                  </button>
                </div>
              </div>
            </div>

            {/* Thông tin bệnh */}
            {loadingInfo && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Đang tải thông tin chi tiết...</p>
              </div>
            )}

            {diseaseInfo && !diseaseInfo.error && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-teal-400">🔬</span>
                  <h3 className="font-bold text-slate-100">
                    {diseaseInfo.ten_day_du || result.predicted_label.replace(/\s*\(.*?\)/g, "")}
                  </h3>
                  <span className="text-xs text-slate-600 ml-auto">Powered by Gemini</span>
                </div>

                <div className="p-6 space-y-6">
                  <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-teal-500/40 pl-4">
                    {diseaseInfo.mo_ta}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "🧬 Nguyên nhân",  key: "nguyen_nhan", color: "text-blue-400"    },
                      { label: "🩺 Triệu chứng",  key: "trieu_chung", color: "text-amber-400"   },
                      { label: "💊 Điều trị",     key: "dieu_tri",    color: "text-emerald-400" },
                      { label: "🛡️ Phòng ngừa",  key: "phong_ngua",  color: "text-purple-400"  },
                    ].map(({ label, key, color }) => (
                      <div key={key} className="bg-slate-800/40 rounded-xl p-4">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${color}`}>{label}</p>
                        <ul className="space-y-1.5">
                          {(diseaseInfo[key] || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {diseaseInfo.khi_nao_gap_bac_si && (
                    <div className={`rounded-xl p-4 border ${s.bg}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${s.text}`}>
                        🏥 Khi nào cần gặp bác sĩ
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {diseaseInfo.khi_nao_gap_bac_si}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {diseaseInfo?.error && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400 text-sm">
                {diseaseInfo.error}
              </div>
            )}
          </div>
        )}

        {/* Hint idle */}
        {status === "idle" && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "📸", text: "Chụp rõ nét, đủ ánh sáng" },
              { icon: "🔍", text: "Tổn thương chiếm phần lớn ảnh" },
              { icon: "🚫", text: "Tránh bóng đổ, mờ nhòe" },
            ].map(h => (
              <div key={h.text} className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-500">
                <span className="text-lg">{h.icon}</span>{h.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}