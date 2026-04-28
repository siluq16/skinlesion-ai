"""
image_prep.py
=============
Tiền xử lý ảnh đầu vào cho model PyTorch.
EfficientNet-B4 yêu cầu kích thước 380×380, ResNet50 dùng 224×224.
Ensemble: resize lên 380×380 cho cả hai để dùng chung pipeline.
"""

from PIL import Image
import torch
from torchvision import transforms
import io

# ─────────────────────────────────────────────
# Normalization constants (ImageNet)
# ─────────────────────────────────────────────
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# EfficientNet-B4 native input size (use for both in ensemble)
INPUT_SIZE = 380

# ─────────────────────────────────────────────
# Transforms
# ─────────────────────────────────────────────

_inference_transform = transforms.Compose([
    transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# Test-Time Augmentation (TTA) transforms – 5 crops + flips
_tta_transforms = [
    transforms.Compose([
        transforms.Resize((INPUT_SIZE + 20, INPUT_SIZE + 20)),
        transforms.CenterCrop(INPUT_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]),
    transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomHorizontalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]),
    transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomVerticalFlip(p=1.0),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]),
    transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.RandomRotation(degrees=(90, 90)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]),
    # original
    _inference_transform,
]


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Convert raw image bytes → normalized float tensor (1, 3, H, W).
    
    Args:
        image_bytes: Raw bytes from uploaded file.
    
    Returns:
        Tensor shape (1, 3, INPUT_SIZE, INPUT_SIZE) ready for model.
    
    Raises:
        ValueError: If image cannot be decoded or is not RGB.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Cannot read image: {e}")

    tensor = _inference_transform(image)            # (3, H, W)
    return tensor.unsqueeze(0)                      # (1, 3, H, W)


def preprocess_image_tta(image_bytes: bytes) -> torch.Tensor:
    """
    Test-Time Augmentation: returns batch tensor of N augmentations.
    Caller averages probabilities across augmentations.
    
    Returns:
        Tensor shape (N, 3, INPUT_SIZE, INPUT_SIZE)
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Cannot read image: {e}")

    tensors = [t(image) for t in _tta_transforms]   # list of (3,H,W)
    return torch.stack(tensors)                      # (N, 3, H, W)
