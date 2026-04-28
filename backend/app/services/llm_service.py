import google.generativeai as genai
import asyncio
from app.core.config import get_settings

_model = None
_disease_cache: dict = {}


def _get_model():
    global _model
    if _model is None:
        cfg = get_settings()
        genai.configure(api_key=cfg.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-1.5-flash-8b")
    return _model


async def _call_gemini_with_retry(prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            model = _get_model()
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait = (attempt + 1) * 35
                print(f"[WARN] Rate limit, retrying in {wait}s...")
                await asyncio.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded")


async def get_disease_info(class_id: str, predicted_label: str) -> str:
    if class_id in _disease_cache:
        return _disease_cache[class_id]

    prompt = f"""Cung cấp thông tin về bệnh da liễu "{predicted_label}" theo đúng JSON sau (chỉ JSON thuần, không markdown, không text thêm):
{{
  "ten_day_du": "tên tiếng Việt đầy đủ",
  "mo_ta": "mô tả ngắn gọn 2-3 câu",
  "nguyen_nhan": ["nguyên nhân 1", "nguyên nhân 2", "nguyên nhân 3"],
  "trieu_chung": ["triệu chứng 1", "triệu chứng 2", "triệu chứng 3"],
  "dieu_tri": ["phương pháp 1", "phương pháp 2", "phương pháp 3"],
  "phong_ngua": ["cách 1", "cách 2", "cách 3"],
  "khi_nao_gap_bac_si": "mô tả ngắn"
}}"""

    result = await _call_gemini_with_retry(prompt)
    _disease_cache[class_id] = result
    return result