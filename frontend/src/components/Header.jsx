// components/Header.jsx
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { pathname } = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        pathname === to
          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-base">
            🩺
          </div>
          <div>
            <p className="font-bold text-slate-100 leading-tight text-sm tracking-wide">
              DermAI
            </p>
            <p className="text-[10px] text-teal-400/70 leading-tight">
              Chẩn đoán da liễu thông minh
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLink("/", "Trang chủ")}
          {navLink("/diagnose", "Chẩn đoán")}
        </nav>

      </div>
    </header>
  );
}