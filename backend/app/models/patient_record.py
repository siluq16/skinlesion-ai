# patient_record.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime


class Base(DeclarativeBase):
    pass


class PatientRecord(Base):
    """Lưu lịch sử chẩn đoán da liễu."""
    __tablename__ = "patient_records"

    id               = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Prediction result
    predicted_class  = Column(String(20), nullable=False)
    predicted_label  = Column(String(100), nullable=False)
    confidence       = Column(Float, nullable=False)
    risk             = Column(String(10), nullable=False)   # low|medium|high

    # Full probability JSON (all 7 classes)
    probabilities    = Column(JSON, nullable=True)

    # Optional patient info
    patient_note     = Column(Text, nullable=True)
    image_filename   = Column(String(255), nullable=True)
