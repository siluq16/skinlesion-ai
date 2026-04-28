from fastapi import APIRouter, HTTPException
from app.services.llm_service import get_disease_info

router = APIRouter()

@router.post("/disease-info")
async def disease_info(request: dict):
    class_id = request.get("class_id", "")
    label    = request.get("predicted_label", "")

    if not class_id or not label:
        raise HTTPException(status_code=422, detail="Thiếu class_id hoặc predicted_label.")

    try:
        info = await get_disease_info(class_id, label)
        return {"info": info}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"LLM service error: {str(e)}")