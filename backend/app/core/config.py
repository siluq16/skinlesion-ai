from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./test.db"  # fallback for dev

    # Gemini
    GEMINI_API_KEY: str = ""

    # Model paths & config
    MODEL_PATH: str = "ml_models/skin_model.pth"
    NUM_CLASSES: int = 7
    ENSEMBLE_WEIGHT_RESNET: float = 0.45
    ENSEMBLE_WEIGHT_EFFICIENTNET: float = 0.55

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
