# SkinLesion AI – HAM10000 Diagnosis System

Hệ thống chẩn đoán tổn thương da với **Ensemble ResNet50 + EfficientNet-B4** + **Gemini chatbot tư vấn**.

---

## 🏗️ Kiến trúc hệ thống

```
[Ảnh da] → [EfficientNet-B4 (55%)] ──┐
                                       ├──→ [Soft-voting Ensemble] → [7 lớp bệnh]
[Ảnh da] → [ResNet50 (45%)]       ──┘

[Kết quả] → [Gemini LLM] → [Tư vấn người dùng]
```

### 7 lớp bệnh (HAM10000)
| Mã       | Tên đầy đủ                        | Nguy cơ |
|----------|-----------------------------------|---------|
| `nv`     | Melanocytic nevi                  | 🟢 Thấp |
| `mel`    | Melanoma                          | 🔴 Cao  |
| `bkl`    | Benign keratosis-like lesions     | 🟡 Vừa  |
| `bcc`    | Basal cell carcinoma              | 🔴 Cao  |
| `akiec`  | Actinic keratoses                 | 🟡 Vừa  |
| `vasc`   | Vascular lesions                  | 🟢 Thấp |
| `df`     | Dermatofibroma                    | 🟢 Thấp |

---

## 🚀 Cài đặt & Chạy

### Backend (FastAPI + PyTorch)

```bash
cd backend
pip install -r requirements.txt

# Tạo .env từ mẫu
cp .env.example .env
# Điền GEMINI_API_KEY và DATABASE_URL vào .env

# Chạy server
uvicorn app.main:app --reload --port 8000
```

API Docs: http://localhost:8000/docs

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Mở: http://localhost:5173

---

## 🤖 Huấn luyện Model

### Bước 1: Chuẩn bị dataset

Tải [HAM10000](https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection) từ Kaggle, sau đó:

```bash
cd backend
python training/prepare_dataset.py \
  --csv  /path/to/HAM10000_metadata.csv \
  --imgs /path/to/ham10000_images/ \
  --out  /path/to/HAM10000_split/
```

### Bước 2: Huấn luyện Ensemble

```bash
python training/train_ensemble.py \
  --data_dir /path/to/HAM10000_split/ \
  --output   ml_models/skin_model.pth \
  --epochs   30 \
  --batch_size 32
```

File `skin_model.pth` lưu **cả 2 model** trong 1 checkpoint:
```python
{
  "resnet_state_dict":   ...,
  "effnet_state_dict":   ...,
  "ensemble_weights":    {"resnet50": 0.45, "efficientnet_b4": 0.55},
  "class_names":         ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"],
}
```

---

## 📁 Cấu trúc thư mục

```
SkinLesion_Project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── diagnose.py        ← POST /api/diagnose
│   │   │   └── chat.py            ← POST /api/chat
│   │   ├── core/config.py         ← Env variables
│   │   ├── models/patient_record.py  ← SQLAlchemy DB model
│   │   ├── schemas/               ← Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_service.py      ← ⭐ Ensemble model (ResNet50 + EffNetB4)
│   │   │   └── llm_service.py     ← Gemini chatbot
│   │   ├── utils/image_prep.py    ← Image preprocessing + TTA
│   │   └── main.py                ← FastAPI entry point
│   ├── ml_models/skin_model.pth   ← Model weights (git-ignored)
│   ├── training/
│   │   ├── train_ensemble.py      ← Training script
│   │   └── prepare_dataset.py     ← Dataset preparation
│   ├── .env                       ← Secrets (git-ignored)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/            ← Header, ImageUploader, ProgressChart, FloatingChatbot
        ├── pages/                 ← Home, Diagnose
        ├── services/              ← axiosClient, aiApi, chatApi
        ├── hooks/useDiagnosis.js  ← State management hook
        └── utils/formatters.js    ← Format helpers
```

---

## ⚠️ Lưu ý quan trọng

- File `.env` và `ml_models/*.pth` **KHÔNG** được push lên GitHub
- Hệ thống chỉ mang tính hỗ trợ — **không thay thế bác sĩ**
- Với `risk = high` (Melanoma, BCC), luôn khuyến nghị khám bác sĩ ngay
