
import torch
from pathlib import Path

# ── Đường dẫn tới 2 file model của bạn ──────
OUTPUT_PATH    = "ml_models/skin_model.pth"
# ─────────────────────────────────────────────

resnet_w = torch.load(r'C:\Users\ASUS\Downloads\nckh\resnet.pth', map_location='cpu', weights_only=True)
effnet_w = torch.load(r'C:\Users\ASUS\Downloads\nckh\effecient.pth', map_location='cpu', weights_only=True)

checkpoint = {
    "resnet_state_dict": resnet_w,
    "effnet_state_dict": effnet_w,
    "num_classes": 7,
    "class_names": ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"],
    "ensemble_weights": {"resnet50": 0.45, "efficientnet_b4": 0.55},
}

Path(OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)
torch.save(checkpoint, OUTPUT_PATH)
print(f"✅ Đã gộp xong → {OUTPUT_PATH}")