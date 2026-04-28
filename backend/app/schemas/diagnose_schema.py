# diagnose_schema.py
from pydantic import BaseModel
from typing import List, Optional


class ClassProbability(BaseModel):
    class_id: str
    label: str
    prob: float


class ModelBreakdown(BaseModel):
    resnet50: List[ClassProbability]
    efficientnet_b4: List[ClassProbability]


class DiagnoseResponse(BaseModel):
    predicted_class: str
    predicted_label: str
    confidence: float
    risk: str                       # "low" | "medium" | "high"
    probabilities: List[ClassProbability]
    model_breakdown: ModelBreakdown
    record_id: Optional[int] = None  # DB record ID nếu lưu thành công
