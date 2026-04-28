from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.schemas.diagnose_schema import DiagnoseResponse
from app.services.ai_service import predict
from app.utils.image_prep import preprocess_image
from app.models.patient_record import PatientRecord, Base
from app.core.config import get_settings

router = APIRouter()

# Tạo DB session
cfg = get_settings()
engine = create_engine(cfg.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}

@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Định dạng ảnh không hỗ trợ")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ảnh quá lớn, tối đa 10MB")

    try:
        tensor = preprocess_image(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = predict(tensor)

    # ── Lưu vào DB ──────────────────────────
    try:
        db = SessionLocal()
        record = PatientRecord(
            predicted_class=result["predicted_class"],
            predicted_label=result["predicted_label"],
            confidence=result["confidence"],
            risk=result["risk"],
            probabilities=result["probabilities"],
            image_filename=file.filename,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        result["record_id"] = record.id
        db.close()
    except Exception as e:
        print(f"[WARN] Không lưu được DB: {e}")
        # Không crash app nếu DB lỗi

    return DiagnoseResponse(**result)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose_image(file: UploadFile = File(...)):
    """
    Nhận ảnh tổn thương da → trả kết quả phân loại từ Ensemble AI.
    
    - **file**: File ảnh (JPEG/PNG/WEBP), tối đa 10MB
    """
    # ── Validate ──────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {ALLOWED_TYPES}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 10MB.")

    # ── Preprocess ────────────────────────────
    try:
        tensor = preprocess_image(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Predict ───────────────────────────────
    result = predict(tensor)

    return DiagnoseResponse(**result)
