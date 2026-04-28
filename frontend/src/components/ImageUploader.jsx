// components/ImageUploader.jsx
import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/bmp"];

export default function ImageUploader({ onFile, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      alert("Chỉ hỗ trợ ảnh JPEG, PNG, WEBP hoặc BMP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh quá lớn. Tối đa 10MB.");
      return;
    }
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        group relative flex flex-col items-center justify-center
        w-full min-h-[220px] rounded-2xl border-2 border-dashed
        transition-all duration-300 cursor-pointer select-none
        ${dragging
          ? "border-teal-400 bg-teal-400/10 scale-[1.01]"
          : "border-slate-600 hover:border-teal-500 hover:bg-teal-500/5 bg-slate-800/40"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={disabled}
      />
      <div className="text-5xl mb-3 transition-transform group-hover:scale-110">
        🔬
      </div>
      <p className="text-slate-300 font-semibold text-lg">
        Kéo thả ảnh vào đây
      </p>
      <p className="text-slate-500 text-sm mt-1">
        hoặc nhấn để chọn file · JPEG, PNG, WEBP · tối đa 10MB
      </p>
    </div>
  );
}
