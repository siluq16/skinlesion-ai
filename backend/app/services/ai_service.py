"""
ai_service.py (bản cuối - khớp 100% với model đã train)
=========================================================
ResNet50:
  - fc = Sequential(Dropout(0.6), Linear(2048→7))
  - Keys: fc.0=Dropout(no weight), fc.1.weight/bias

EfficientNet-B4 + CBAM:
  - features.* (torchvision backbone)
  - cbam.ca.fc1/fc2, cbam.sa.conv1
  - classifier: Dropout(inplace) → BN1d(1792) → Linear(7)
  - Keys: classifier.0=Dropout, classifier.1=BN, classifier.2=Linear
"""

import torch
import torch.nn as nn
import torchvision.models as tv_models
import numpy as np
from pathlib import Path

from app.core.config import get_settings

# ─────────────────────────────────────────────
# HAM10000 Class Mapping
# ─────────────────────────────────────────────
CLASS_NAMES = [
    "Melanocytic nevi (nv)",
    "Melanoma (mel)",
    "Benign keratosis-like lesions (bkl)",
    "Basal cell carcinoma (bcc)",
    "Actinic keratoses (akiec)",
    "Vascular lesions (vasc)",
    "Dermatofibroma (df)",
]
CLASS_IDS = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]
CLASS_RISK = {
    "nv":    "low",
    "mel":   "high",
    "bkl":   "medium",
    "bcc":   "high",
    "akiec": "medium",
    "vasc":  "low",
    "df":    "low",
}


# ─────────────────────────────────────────────
# CBAM — copy y chang notebook của bạn
# ─────────────────────────────────────────────

class ChannelAttention(nn.Module):
    def __init__(self, in_planes, ratio=16):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc1     = nn.Conv2d(in_planes, in_planes // ratio, 1, bias=False)
        self.relu1   = nn.ReLU()
        self.fc2     = nn.Conv2d(in_planes // ratio, in_planes, 1, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.fc2(self.relu1(self.fc1(self.avg_pool(x))))
        max_out = self.fc2(self.relu1(self.fc1(self.max_pool(x))))
        return x * self.sigmoid(avg_out + max_out)  # nhân vào x luôn


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super().__init__()
        assert kernel_size in (3, 7)
        padding = 3 if kernel_size == 7 else 1
        self.conv1   = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        return x * self.sigmoid(self.conv1(torch.cat([avg_out, max_out], dim=1)))


class CBAM(nn.Module):
    def __init__(self, in_planes, ratio=16, kernel_size=7):
        super().__init__()
        self.ca = ChannelAttention(in_planes, ratio)
        self.sa = SpatialAttention(kernel_size)

    def forward(self, x):
        x = self.ca(x)
        x = self.sa(x)
        return x


# ─────────────────────────────────────────────
# ResNet50 — khớp với notebook
# fc = Sequential(Dropout(0.6), Linear(2048→7))
# ─────────────────────────────────────────────

class ResNet50Classifier(nn.Module):
    def __init__(self, num_classes: int = 7):
        super().__init__()
        base = tv_models.resnet50(weights=None)
        in_features = base.fc.in_features          # 2048
        base.fc = nn.Sequential(
            nn.Dropout(0.6),
            nn.Linear(in_features, num_classes),   # fc.1.weight/bias
        )
        self.model = base

    def forward(self, x):
        return self.model(x)


# ─────────────────────────────────────────────
# EfficientNet-B4 + CBAM — copy y chang notebook
# ─────────────────────────────────────────────

class EfficientNetB4_CBAM(nn.Module):
    def __init__(self, num_classes: int = 7):
        super().__init__()
        backbone    = tv_models.efficientnet_b4(weights=None)
        in_features = backbone.classifier[1].in_features  # 1792

        self.features  = backbone.features
        self.cbam      = CBAM(in_planes=in_features)
        self.avgpool   = backbone.avgpool
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.4, inplace=True),   # [0]
            nn.BatchNorm1d(in_features),        # [1] classifier.1.*
            nn.Linear(in_features, num_classes) # [2] classifier.2.*
        )

    def forward(self, x):
        x = self.features(x)
        x = self.cbam(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


# ─────────────────────────────────────────────
# Ensemble Wrapper
# ─────────────────────────────────────────────

class SkinEnsembleModel(nn.Module):
    def __init__(self, num_classes=7, w_resnet=0.45, w_effnet=0.55):
        super().__init__()
        assert abs(w_resnet + w_effnet - 1.0) < 1e-5
        self.resnet   = ResNet50Classifier(num_classes)
        self.effnet   = EfficientNetB4_CBAM(num_classes)
        self.w_resnet = w_resnet
        self.w_effnet = w_effnet
        self.softmax  = nn.Softmax(dim=1)

    def forward(self, x):
        p_r = self.softmax(self.resnet(x))
        p_e = self.softmax(self.effnet(x))
        return self.w_resnet * p_r + self.w_effnet * p_e

    def forward_individual(self, x):
        p_r = self.softmax(self.resnet(x))
        p_e = self.softmax(self.effnet(x))
        ens = self.w_resnet * p_r + self.w_effnet * p_e
        return p_r, p_e, ens


# ─────────────────────────────────────────────
# Model Loading (Singleton)
# ─────────────────────────────────────────────

_model = None
_device = None


def _load_model():
    global _model, _device
    if _model is not None:
        return _model, _device

    cfg    = get_settings()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Device: {device}")

    model = SkinEnsembleModel(
        num_classes=cfg.NUM_CLASSES,
        w_resnet=cfg.ENSEMBLE_WEIGHT_RESNET,
        w_effnet=cfg.ENSEMBLE_WEIGHT_EFFICIENTNET,
    )

    model_path = Path(cfg.MODEL_PATH)
    if model_path.exists():
        checkpoint = torch.load(model_path, map_location=device, weights_only=True)

        if isinstance(checkpoint, dict) and "resnet_state_dict" in checkpoint:
            # Load ResNet — keys: conv1.*, layer*.*, fc.0(Dropout), fc.1.weight/bias
            model.resnet.model.load_state_dict(checkpoint["resnet_state_dict"])
            print("[INFO] ResNet50 weights loaded ✓")

            # Load EfficientNet+CBAM — keys: features.*, cbam.*, classifier.*
            model.effnet.load_state_dict(checkpoint["effnet_state_dict"])
            print("[INFO] EfficientNet-B4+CBAM weights loaded ✓")
        else:
            print("[WARN] Unexpected checkpoint format.")
    else:
        print(f"[WARN] Model not found at {model_path}. Using random weights.")

    model.to(device).eval()
    if device.type == "cpu":
        model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear},
            dtype=torch.qint8
        )
    print("[INFO] Model quantized for CPU ✓")
    _model, _device = model, device
    return _model, _device


# ─────────────────────────────────────────────
# Public Predict API
# ─────────────────────────────────────────────

def predict(image_tensor: torch.Tensor) -> dict:
    """
    Args:
        image_tensor: Float32 tensor shape (1, 3, H, W), đã normalize.
    Returns:
        dict kết quả ensemble + breakdown từng model.
    """
    model, device = _load_model()
    tensor = image_tensor.to(device)

    with torch.no_grad():
        p_r, p_e, p_ens = model.forward_individual(tensor)

    probs_r   = p_r[0].cpu().numpy()
    probs_e   = p_e[0].cpu().numpy()
    probs_ens = p_ens[0].cpu().numpy()
    pred_idx  = int(np.argmax(probs_ens))

    def _to_list(probs):
        return [
            {
                "class_id": CLASS_IDS[i],
                "label":    CLASS_NAMES[i],
                "prob":     round(float(probs[i]), 4),
            }
            for i in range(len(CLASS_IDS))
        ]

    return {
        "predicted_class": CLASS_IDS[pred_idx],
        "predicted_label": CLASS_NAMES[pred_idx],
        "confidence":      round(float(probs_ens[pred_idx]), 4),
        "risk":            CLASS_RISK[CLASS_IDS[pred_idx]],
        "probabilities":   _to_list(probs_ens),
        "model_breakdown": {
            "resnet50":        _to_list(probs_r),
            "efficientnet_b4": _to_list(probs_e),
        },
    }