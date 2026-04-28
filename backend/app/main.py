# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.api import diagnose, chat
from sqlalchemy import create_engine
from app.models.patient_record import Base
from app.core.config import get_settings


# ─────────────────────────────────────────────
# Lifespan: preload model on startup
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo bảng DB tự động nếu chưa có
    cfg = get_settings()
    engine = create_engine(cfg.DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    print("✅ Database ready.")

    # Load model
    print("🚀 Loading ensemble model (ResNet50 + EfficientNet-B4)...")
    from app.services.ai_service import _load_model
    _load_model()
    print("✅ Model loaded and ready.")
    yield
    print("🛑 Shutting down.")

# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────

cfg = get_settings()

app = FastAPI(
    title="SkinLesion Diagnosis API",
    description="HAM10000 - 7 class skin lesion classification (ResNet50 + EfficientNet-B4 Ensemble)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(diagnose.router, prefix="/api", tags=["Diagnosis"])
app.include_router(chat.router,     prefix="/api", tags=["Chat"])


@app.get("/health")
def health():
    return {"status": "ok", "model": "ResNet50 + EfficientNet-B4 Ensemble"}
