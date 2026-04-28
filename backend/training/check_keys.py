# check_keys.py — kiểm tra keys trong checkpoint
import torch

resnet = torch.load(r'C:\Users\ASUS\Downloads\nckh\resnet.pth', map_location='cpu', weights_only=True)
effnet = torch.load(r'C:\Users\ASUS\Downloads\nckh\effecient.pth', map_location='cpu', weights_only=True)

print("=== RESNET KEYS (10 đầu) ===")
for k in list(resnet.keys())[:10]:
    print(f"  {k}: {resnet[k].shape}")

print("\n=== EFFNET KEYS (10 đầu) ===")
for k in list(effnet.keys())[:10]:
    print(f"  {k}: {effnet[k].shape}")