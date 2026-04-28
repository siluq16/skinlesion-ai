# chat.py
from fastapi import APIRouter, HTTPException
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.llm_service import get_chat_advice, build_diagnosis_context, get_disease_info

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_advice(request: ChatRequest):
    """Chat tư vấn da liễu với Gemini."""
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    context_str = None
    if request.diagnosis_context:
        context_str = build_diagnosis_context(request.diagnosis_context)

    history = [
        {"role": msg.role, "parts": [msg.content]}
        for msg in (request.history or [])
    ]

    try:
        reply = await get_chat_advice(
            user_message=request.message,
            diagnosis_context=context_str,
            chat_history=history,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")

    return ChatResponse(reply=reply)


@router.post("/disease-info")
async def disease_info(request: dict):
    """
    Lấy thông tin chi tiết về bệnh theo class_id.
    Có cache — cùng bệnh chỉ gọi Gemini 1 lần.
    """
    class_id = request.get("class_id", "")
    label    = request.get("predicted_label", "")

    if not class_id or not label:
        raise HTTPException(status_code=422, detail="Thiếu class_id hoặc predicted_label.")

    try:
        info = await get_disease_info(class_id, label)
        return {"info": info}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")