"""
train_ensemble.py
=================
Script huấn luyện ensemble ResNet50 + EfficientNet-B4 trên HAM10000.

Cách dùng:
  python training/train_ensemble.py \
    --data_dir /path/to/HAM10000 \
    --output   ml_models/skin_model.pth \
    --epochs   30 \
    --batch_size 32

Cấu trúc thư mục dữ liệu (ImageFolder format):
  HAM10000/
    train/
      nv/    mel/    bkl/    bcc/    akiec/    vasc/    df/
    val/
      nv/    mel/    bkl/    bcc/    akiec/    vasc/    df/
"""

import argparse, time, copy
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms
import numpy as np

# Import models from project
import sys; sys.path.insert(0, str(Path(__file__).parent.parent))
from app.services.ai_service import ResNet50Classifier, EfficientNetB4Classifier, SkinEnsembleModel

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────
NUM_CLASSES  = 7
INPUT_SIZE   = 380    # EfficientNet-B4 native size
MEAN         = [0.485, 0.456, 0.406]
STD          = [0.229, 0.224, 0.225]
CLASS_NAMES  = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]

# HAM10000 class weights (inverse frequency – dataset is imbalanced)
# Approximate ratios from the original dataset
CLASS_WEIGHTS = torch.tensor([1.0, 6.5, 2.5, 4.0, 5.5, 8.0, 7.0])


# ─────────────────────────────────────────────
# Data Transforms
# ─────────────────────────────────────────────

def get_transforms():
    train_tf = transforms.Compose([
        transforms.Resize((INPUT_SIZE + 20, INPUT_SIZE + 20)),
        transforms.RandomCrop(INPUT_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    return train_tf, val_tf


def make_weighted_sampler(dataset):
    """WeightedRandomSampler để cân bằng class imbalance khi train."""
    labels = [s[1] for s in dataset.samples]
    weights = CLASS_WEIGHTS[labels]
    return WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)


# ─────────────────────────────────────────────
# Training Loop (per model)
# ─────────────────────────────────────────────

def train_model(model, dataloaders, criterion, optimizer, scheduler, device, epochs, model_name):
    best_acc  = 0.0
    best_wts  = copy.deepcopy(model.state_dict())

    for epoch in range(epochs):
        print(f"\n[{model_name}] Epoch {epoch+1}/{epochs}")
        for phase in ["train", "val"]:
            model.train() if phase == "train" else model.eval()
            running_loss, running_correct, total = 0.0, 0, 0

            for inputs, labels in dataloaders[phase]:
                inputs, labels = inputs.to(device), labels.to(device)
                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(inputs)
                    loss    = criterion(outputs, labels)
                    preds   = outputs.argmax(dim=1)
                    if phase == "train":
                        loss.backward()
                        optimizer.step()

                running_loss    += loss.item() * inputs.size(0)
                running_correct += (preds == labels).sum().item()
                total           += inputs.size(0)

            epoch_loss = running_loss / total
            epoch_acc  = running_correct / total
            print(f"  {phase.upper()} → loss: {epoch_loss:.4f}  acc: {epoch_acc:.4f}")

            if phase == "val" and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_wts = copy.deepcopy(model.state_dict())

        if scheduler:
            scheduler.step()

    print(f"\n[{model_name}] Best val acc: {best_acc:.4f}")
    model.load_state_dict(best_wts)
    return model


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def main(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # ── Data ──────────────────────────────────
    train_tf, val_tf = get_transforms()
    data_dir = Path(args.data_dir)
    train_ds = datasets.ImageFolder(str(data_dir / "train"), train_tf)
    val_ds   = datasets.ImageFolder(str(data_dir / "val"),   val_tf)

    sampler = make_weighted_sampler(train_ds)
    dataloaders = {
        "train": DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler, num_workers=4, pin_memory=True),
        "val":   DataLoader(val_ds,   batch_size=args.batch_size, shuffle=False,  num_workers=4, pin_memory=True),
    }
    print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

    # ── Loss (weighted CE) ────────────────────
    criterion = nn.CrossEntropyLoss(weight=CLASS_WEIGHTS.to(device))

    # ── Train ResNet50 ────────────────────────
    print("\n" + "="*50)
    print("  Training ResNet50")
    print("="*50)
    resnet = ResNet50Classifier(NUM_CLASSES).to(device)
    # Use pretrained backbone for transfer learning
    import torchvision.models as tv_models
    pretrained = tv_models.resnet50(weights=tv_models.ResNet50_Weights.IMAGENET1K_V2)
    # Copy backbone weights (except final fc which was replaced)
    resnet_state = resnet.backbone.state_dict()
    pretrained_state = {k: v for k, v in pretrained.state_dict().items() if k in resnet_state}
    resnet.backbone.load_state_dict(pretrained_state, strict=False)

    opt_resnet  = optim.AdamW(resnet.parameters(), lr=1e-4, weight_decay=1e-4)
    sch_resnet  = optim.lr_scheduler.CosineAnnealingLR(opt_resnet, T_max=args.epochs)
    resnet = train_model(resnet, dataloaders, criterion, opt_resnet, sch_resnet, device, args.epochs, "ResNet50")

    # ── Train EfficientNet-B4 ─────────────────
    print("\n" + "="*50)
    print("  Training EfficientNet-B4")
    print("="*50)
    import timm
    effnet = EfficientNetB4Classifier(NUM_CLASSES).to(device)
    # Load pretrained backbone
    pretrained_effnet = timm.create_model("efficientnet_b4", pretrained=True, num_classes=0)
    effnet.backbone.load_state_dict(pretrained_effnet.state_dict(), strict=False)

    opt_effnet  = optim.AdamW(effnet.parameters(), lr=5e-5, weight_decay=1e-4)
    sch_effnet  = optim.lr_scheduler.CosineAnnealingLR(opt_effnet, T_max=args.epochs)
    effnet = train_model(effnet, dataloaders, criterion, opt_effnet, sch_effnet, device, args.epochs, "EfficientNet-B4")

    # ── Save ensemble checkpoint ──────────────
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    torch.save({
        "resnet_state_dict": resnet.state_dict(),
        "effnet_state_dict": effnet.state_dict(),
        "num_classes": NUM_CLASSES,
        "class_names": CLASS_NAMES,
        "ensemble_weights": {"resnet50": 0.45, "efficientnet_b4": 0.55},
    }, output_path)

    print(f"\n✅ Ensemble checkpoint saved → {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir",   type=str, required=True)
    parser.add_argument("--output",     type=str, default="ml_models/skin_model.pth")
    parser.add_argument("--epochs",     type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=32)
    main(parser.parse_args())
