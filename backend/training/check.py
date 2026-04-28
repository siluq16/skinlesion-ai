import torch
e = torch.load(r'C:\Users\ASUS\Downloads\nckh\effecient.pth', map_location='cpu', weights_only=True)
print('=== ALL EFFNET KEYS ===')
for k, v in e.items():
    print(f'  {k}: {v.shape}')