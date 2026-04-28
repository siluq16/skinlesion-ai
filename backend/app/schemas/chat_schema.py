# chat_schema.py
from pydantic import BaseModel
from typing import Optional, List


class ChatMessage(BaseModel):
    role: str       # "user" | "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    diagnosis_context: Optional[dict] = None   # Pass diagnosis result from frontend
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    session_id: Optional[str] = None
