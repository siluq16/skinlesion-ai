"""
llm_service.py
==============
Tích hợp Google Gemini cho chatbot tư vấn da liễu.
- Cache thông tin bệnh theo class_id (chỉ gọi API 1 lần/bệnh)
"""

import google.generativeai as genai
from app.core.config import get_settings

_model = None
_disease_cache: dict = {}  # cache: class_id → raw JSON string


# ─────────────────────────────────────────────
# Khởi tạo model (singleton)
# ─────────────────────────────────────────────

def _get_model():
    global _model
    if _model is None:
        cfg = get_settings()
        genai.configure(api_key=cfg.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.5-flash")
    return _model


# ─────────────────────────────────────────────
# Lấy thông tin bệnh — có cache theo class_id
# ─────────────────────────────────────────────

async def get_disease_info(class_id: str, predicted_label: str) -> str:
    """
    Lấy thông tin chi tiết về bệnh từ Gemini.
    Cache theo class_id — cùng bệnh chỉ gọi API 1 lần.
    """
    if class_id in _disease_cache:
        return _disease_cache[class_id]

    prompt = f"""Cung cấp thông tin về bệnh da liễu "{predicted_label}" theo đúng JSON sau (chỉ trả JSON thuần, không markdown, không text thêm):
{{
  "ten_day_du": "tên tiếng Việt đầy đủ",
  "mo_ta": "mô tả ngắn gọn 2-3 câu về bệnh",
  "nguyen_nhan": ["nguyên nhân 1", "nguyên nhân 2", "nguyên nhân 3"],
  "trieu_chung": ["triệu chứng 1", "triệu chứng 2", "triệu chứng 3"],
  "dieu_tri": ["phương pháp điều trị 1", "phương pháp 2", "phương pháp 3"],
  "phong_ngua": ["cách phòng ngừa 1", "cách 2", "cách 3"],
  "khi_nao_gap_bac_si": "mô tả ngắn khi nào cần gặp bác sĩ ngay"
}}"""

    model = _get_model()
    response = await model.generate_content_async(prompt)
    result = response.text.strip()
    _disease_cache[class_id] = result  # lưu cache
    return result


# ─────────────────────────────────────────────
# System Prompt cho chatbot
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """Bạn là trợ lý AI chuyên về da liễu, hỗ trợ người dùng sau khi nhận kết quả chẩn đoán từ hệ thống AI.

Nguyên tắc:
1. Luôn nhấn mạnh đây là hỗ trợ thông tin, KHÔNG thay thế bác sĩ.
2. Khi risk = "high" (Melanoma, BCC), LUÔN khuyên đến khám ngay lập tức.
3. Giải thích thuật ngữ y học bằng ngôn ngữ dễ hiểu.
4. Trả lời bằng tiếng Việt, ngắn gọn, ấm áp, chuyên nghiệp.
5. Dùng emoji phù hợp (🔬 📋 ⚠️ ✅) để dễ đọc."""


def build_diagnosis_context(diagnosis_result: dict) -> str:
    probs  = diagnosis_result.get("probabilities", [])
    top3   = sorted(probs, key=lambda x: x["prob"], reverse=True)[:3]
    top3_str = "\n".join(f"  • {p['label']}: {p['prob']*100:.1f}%" for p in top3)
    return f"""
[KẾT QUẢ CHẨN ĐOÁN AI]
- Phân loại: {diagnosis_result.get('predicted_label', 'N/A')}
- Độ tin cậy: {diagnosis_result.get('confidence', 0)*100:.1f}%
- Mức độ nguy hiểm: {diagnosis_result.get('risk', 'N/A').upper()}
- Top 3 khả năng:
{top3_str}
"""


# ─────────────────────────────────────────────
# Chat tư vấn
# ─────────────────────────────────────────────

async def get_chat_advice(
    user_message: str,
    diagnosis_context: str | None = None,
    chat_history: list[dict] | None = None,
) -> str:
    model = _get_model()

    context_prefix = ""
    if diagnosis_context:
        context_prefix = f"{diagnosis_context}\n\nCâu hỏi của bệnh nhân: "

    full_message = f"{SYSTEM_PROMPT}\n\n{context_prefix}{user_message}"

    history = chat_history or []
    chat     = model.start_chat(history=history)
    response = await chat.send_message_async(full_message)
    return response.text