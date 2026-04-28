// pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const DISEASES = [
  {
    id: "mel", name: "Melanoma", vn: "Ung thư hắc tố",
    risk: "high", icon: "🔴",
    short: "Dạng ung thư da nguy hiểm nhất, cần phát hiện sớm để điều trị kịp thời.",
    signs: ["Nốt ruồi thay đổi hình dạng hoặc màu sắc", "Đường viền không đều, răng cưa", "Kích thước lớn hơn 6mm"],
    action: "Khám ngay lập tức",
  },
  {
    id: "bcc", name: "Basal Cell Carcinoma", vn: "Ung thư tế bào đáy",
    risk: "high", icon: "🔴",
    short: "Loại ung thư da phổ biến nhất, tiến triển chậm nhưng cần can thiệp y tế sớm.",
    signs: ["Sẩn màu ngà hoặc hồng nhạt", "Mạch máu nhỏ li ti trên bề mặt", "Vết loét không lành sau nhiều tuần"],
    action: "Khám sớm trong tuần",
  },
  {
    id: "akiec", name: "Actinic Keratoses", vn: "Dày sừng ánh sáng",
    risk: "medium", icon: "🟡",
    short: "Tổn thương tiền ung thư do phơi nắng lâu dài, có thể tiến triển nếu không điều trị.",
    signs: ["Mảng da thô ráp, khô, có vảy", "Màu đỏ, hồng hoặc nâu", "Cảm giác ngứa hoặc rát khi chạm"],
    action: "Tham khảo bác sĩ",
  },
  {
    id: "bkl", name: "Benign Keratosis", vn: "Dày sừng lành tính",
    risk: "medium", icon: "🟡",
    short: "Tổn thương da lành tính thường gặp ở người trung niên và lớn tuổi.",
    signs: ["Mảng nâu hoặc đen, bề mặt sáp", "Trông như 'dán' lên mặt da", "Nhiều kích cỡ, thường không ngứa"],
    action: "Theo dõi định kỳ",
  },
  {
    id: "nv", name: "Melanocytic Nevi", vn: "Nốt ruồi thông thường",
    risk: "low", icon: "🟢",
    short: "Nốt ruồi lành tính rất phổ biến, thường không cần điều trị nếu ổn định.",
    signs: ["Màu nâu đều, đường viền rõ", "Kích thước và hình dạng ổn định", "Không thay đổi theo thời gian"],
    action: "Theo dõi tại nhà",
  },
  {
    id: "vasc", name: "Vascular Lesions", vn: "Tổn thương mạch máu",
    risk: "low", icon: "🟢",
    short: "Các dạng u mạch, giãn mạch trên da. Phần lớn lành tính và không gây nguy hiểm.",
    signs: ["Màu đỏ hoặc tím, phẳng hoặc nhô nhẹ", "Không đau, không ngứa thông thường", "Có thể nhạt màu khi ấn"],
    action: "Kiểm tra định kỳ",
  },
  {
    id: "df", name: "Dermatofibroma", vn: "U xơ da",
    risk: "low", icon: "🟢",
    short: "Khối u xơ lành tính, cứng chắc dưới da. Rất phổ biến và không nguy hiểm.",
    signs: ["Sẩn cứng màu nâu hồng", "Hơi lõm vào khi véo nhẹ", "Hay gặp ở cẳng chân"],
    action: "Không cần điều trị",
  },
];

const FEATURES = [
  { icon: "🩺", title: "Chẩn đoán thông minh", desc: "Phân tích hình ảnh tổn thương da bằng AI, cho kết quả nhanh chóng và đáng tin cậy." },
  { icon: "📋", title: "Thông tin chi tiết", desc: "Sau mỗi lần chẩn đoán, nhận đầy đủ thông tin về bệnh: nguyên nhân, triệu chứng, điều trị." },
  { icon: "💬", title: "Tư vấn trực tiếp", desc: "Chatbot y tế hỗ trợ giải đáp thắc mắc về kết quả chẩn đoán bất kỳ lúc nào." },
  { icon: "⚡", title: "Kết quả tức thì", desc: "Nhận kết quả phân tích chỉ trong vài giây, không cần chờ đợi hay đặt lịch hẹn." },
];

const riskConfig = {
  high:   { label: "Nguy cơ cao",  dot: "bg-red-400",     pill: "bg-red-500/15 text-red-300 border-red-500/25",       card: "border-red-500/20 hover:border-red-500/40",     active: "border-red-500/50" },
  medium: { label: "Theo dõi",     dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-300 border-amber-500/25", card: "border-amber-500/20 hover:border-amber-500/40", active: "border-amber-500/50" },
  low:    { label: "Lành tính",    dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25", card: "border-emerald-500/20 hover:border-emerald-500/40", active: "border-emerald-500/50" },
};

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Anim({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [activeDisease, setActiveDisease] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── HERO ──────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center px-6">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-xs tracking-widest uppercase font-semibold mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Hệ thống chẩn đoán da liễu
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.07] mb-6 tracking-tight">
              Chăm sóc làn da<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400">
                thông minh hơn
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
              Phân tích tổn thương da chỉ trong vài giây. Nhận thông tin chi tiết về tình trạng da
              và lời khuyên y tế — ngay tại nhà, hoàn toàn miễn phí.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/diagnose"
                className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-teal-500/20 text-sm"
              >
                Kiểm tra da ngay →
              </Link>
              <a
                href="#diseases"
                className="inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 font-medium px-6 py-4 rounded-xl transition-all duration-200 text-sm"
              >
                Tìm hiểu các bệnh ↓
              </a>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-10 border-t border-slate-800">
              {[
                { n: "7+", l: "Loại bệnh da" },
                { n: "Vài giây", l: "Thời gian phân tích" },
                { n: "24/7", l: "Hỗ trợ chatbot" },
              ].map(b => (
                <div key={b.l}>
                  <div className="text-2xl font-black text-teal-400">{b.n}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{b.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mockup card */}
          <div className="hidden lg:flex justify-end">
            <div className="relative w-80">
              <div className="bg-slate-900 border border-slate-700/60 rounded-3xl p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-xl">🔬</div>
                  <div>
                    <p className="text-slate-100 font-bold text-sm">Kết quả phân tích</p>
                    <p className="text-slate-500 text-xs">Da liễu · AI</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs">Chẩn đoán</span>
                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Lành tính</span>
                  </div>
                  <p className="text-slate-100 font-bold">Nốt ruồi thông thường</p>
                  <p className="text-slate-500 text-xs mt-0.5 font-mono">Melanocytic Nevi</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500">Độ tin cậy</span>
                    <span className="text-teal-400 font-bold">91.2%</span>
                  </div>
                  <div className="bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full" style={{ width: "91.2%" }} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-600 text-center">
                  Thông tin chi tiết được cung cấp bởi AI
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-3 -left-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-3 flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="text-[10px] text-slate-500">Cảnh báo</p>
                  <p className="text-xs font-bold text-slate-200">Cần khám sớm</p>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-3 flex items-center gap-2">
                <span className="text-base">✅</span>
                <div>
                  <p className="text-[10px] text-slate-500">Trạng thái</p>
                  <p className="text-xs font-bold text-slate-200">An toàn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TÍNH NĂNG ──────────────────────────────── */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <Anim className="text-center mb-14">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">Tiện ích</p>
            <h2 className="text-3xl font-black text-slate-100 mb-3">Mọi thứ bạn cần</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              Từ chẩn đoán đến tư vấn, chúng tôi đồng hành cùng bạn trong hành trình chăm sóc sức khỏe làn da.
            </p>
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <Anim key={f.title} delay={i * 80}>
                <div className="group bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/30 rounded-2xl p-6 transition-all duration-300 h-full">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-slate-100 text-sm mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 BỆNH DA ──────────────────────────────── */}
      <section id="diseases" className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto">
          <Anim className="text-center mb-14">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">Thư viện bệnh da</p>
            <h2 className="text-3xl font-black text-slate-100 mb-3">Nhận biết tổn thương da</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
              Hiểu rõ các loại tổn thương da để phát hiện sớm và có hướng xử lý phù hợp.
              Nhấn vào từng bệnh để xem chi tiết.
            </p>
          </Anim>

          {/* Legend */}
          <Anim className="flex flex-wrap justify-center gap-5 mb-10">
            {Object.entries(riskConfig).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                {v.label}
              </div>
            ))}
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DISEASES.map((d, i) => {
              const rc = riskConfig[d.risk];
              const isActive = activeDisease === d.id;
              return (
                <Anim key={d.id} delay={i * 50}>
                  <div
                    onClick={() => setActiveDisease(isActive ? null : d.id)}
                    className={`cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden
                      ${isActive
                        ? `bg-slate-800 ${rc.active} shadow-lg`
                        : `bg-slate-900/40 ${rc.card} hover:bg-slate-900/80`
                      }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rc.pill}`}>
                          {rc.label}
                        </span>
                        <span className="text-lg">{d.icon}</span>
                      </div>

                      <h3 className="font-black text-slate-100 text-sm leading-tight mb-0.5">{d.vn}</h3>
                      <p className="text-xs text-slate-600 font-mono mb-3">{d.name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{d.short}</p>

                      {isActive && (
                        <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-4">
                          <div>
                            <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-2">Dấu hiệu nhận biết</p>
                            <ul className="space-y-1.5">
                              {d.signs.map(s => (
                                <li key={s} className="flex items-start gap-2 text-xs text-slate-400">
                                  <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${rc.dot}`} />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className={`rounded-xl px-3 py-2 text-xs font-semibold border ${rc.pill}`}>
                            📋 {d.action}
                          </div>
                        </div>
                      )}

                      <p className={`mt-3 text-[10px] text-right ${isActive ? "text-slate-600" : "text-slate-700"}`}>
                        {isActive ? "Thu gọn ↑" : "Chi tiết ↓"}
                      </p>
                    </div>
                  </div>
                </Anim>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CÁCH SỬ DỤNG ───────────────────────────── */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto">
          <Anim className="text-center mb-14">
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-3">Hướng dẫn</p>
            <h2 className="text-3xl font-black text-slate-100 mb-3">Sử dụng đơn giản</h2>
            <p className="text-slate-500 text-sm">Chỉ cần 3 bước để nhận kết quả chẩn đoán</p>
          </Anim>

          <div className="relative">
            <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                { n: "1", icon: "📷", t: "Chụp ảnh", d: "Chụp rõ nét vùng da cần kiểm tra với đủ ánh sáng, tránh bóng đổ." },
                { n: "2", icon: "🔬", t: "AI phân tích", d: "Hệ thống tự động phân tích và nhận định đặc điểm tổn thương." },
                { n: "3", icon: "📋", t: "Nhận kết quả", d: "Xem thông tin chi tiết về bệnh, mức độ nguy hiểm và lời khuyên." },
              ].map((s, i) => (
                <Anim key={s.n} delay={i * 120} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl mb-5 mx-auto text-2xl">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-500 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm mb-2">{s.t}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
                </Anim>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ──────────────────────────────── */}
      <section className="px-6 py-8 border-t border-slate-800/60">
        <div className="max-w-3xl mx-auto bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-bold text-amber-300 text-sm mb-1">Lưu ý quan trọng</p>
            <p className="text-amber-200/50 text-xs leading-relaxed">
              Công cụ này chỉ mang tính chất <strong className="text-amber-200/70">hỗ trợ thông tin tham khảo</strong>, không thay thế chẩn đoán của bác sĩ chuyên khoa.
              Khi phát hiện bất kỳ dấu hiệu bất thường nào, hãy đến cơ sở y tế để được thăm khám kịp thời.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-slate-800/60 text-center">
        <Anim>
          <p className="text-teal-400/60 text-xs uppercase tracking-widest font-bold mb-4">Bắt đầu ngay</p>
          <h2 className="text-4xl font-black mb-5 leading-tight">
            Làn da khỏe mạnh<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
              bắt đầu từ nhận thức sớm
            </span>
          </h2>
          <p className="text-slate-500 mb-10 max-w-md mx-auto text-sm">
            Chỉ cần một bức ảnh, nhận ngay thông tin chi tiết về tình trạng da của bạn.
          </p>
          <Link
            to="/diagnose"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-10 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-xl shadow-teal-500/20 text-sm"
          >
            Kiểm tra ngay — Miễn phí →
          </Link>
        </Anim>
      </section>

    </div>
  );
}