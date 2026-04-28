// components/FloatingChatbot.jsx
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/chatApi";

export default function FloatingChatbot({ diagnosisContext = null }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", content: "Xin chào! Tôi là trợ lý AI da liễu. Bạn có thể hỏi tôi về kết quả chẩn đoán hoặc các bệnh về da. 🩺" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(text, diagnosisContext, history);
      setMessages(prev => [...prev, { role: "model", content: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", content: `❌ Lỗi: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
        title="Chatbot tư vấn"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
            <span className="text-lg">🩺</span>
            <div>
              <p className="text-sm font-semibold text-slate-100">Trợ lý Da liễu AI</p>
              <p className="text-[10px] text-teal-400">Powered by Gemini</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-teal-500/20 text-teal-100 border border-teal-500/30"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 text-slate-400 text-sm">
                  Đang trả lời<span className="animate-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
