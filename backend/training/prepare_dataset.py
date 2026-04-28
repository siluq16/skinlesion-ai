"""
prepare_dataset.py
==================
Chuyển đổi HAM10000 (CSV + images) → cấu trúc ImageFolder cho PyTorch.

Cách dùng:
  python training/prepare_dataset.py \
    --csv   /path/to/HAM10000_metadata.csv \
    --imgs  /path/to/ham10000_images/ \
    --out   /path/to/HAM10000_split/

Cấu trúc đầu ra:
  HAM10000_split/
    train/ nv/ mel/ bkl/ bcc/ akiec/ vasc/ df/
    val/   nv/ mel/ bkl/ bcc/ akiec/ vasc/ df/
"""

import argparse, shutil, random
from pathlib import Path
import pandas as pd

CLASSES   = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]
VAL_RATIO = 0.15   # 15% validation


def main(args):
    df   = pd.read_csv(args.csv)
    imgs = Path(args.imgs)
    out  = Path(args.out)

    random.seed(42)

    for split in ["train", "val"]:
        for cls in CLASSES:
            (out / split / cls).mkdir(parents=True, exist_ok=True)

    moved, skipped = 0, 0
    for cls in CLASSES:
        rows = df[df["dx"] == cls]["image_id"].tolist()
        random.shuffle(rows)
        n_val   = max(1, int(len(rows) * VAL_RATIO))
        val_ids = set(rows[:n_val])

        for img_id in rows:
            src = imgs / f"{img_id}.jpg"
            if not src.exists():
                skipped += 1
                continue
            split = "val" if img_id in val_ids else "train"
            shutil.copy(src, out / split / cls / f"{img_id}.jpg")
            moved += 1

    print(f"✅ Done: {moved} images moved, {skipped} skipped.")
    for split in ["train", "val"]:
        print(f"\n{split.upper()}:")
        for cls in CLASSES:
            n = len(list((out / split / cls).glob("*.jpg")))
            print(f"  {cls:8s}: {n}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv",  required=True)
    parser.add_argument("--imgs", required=True)
    parser.add_argument("--out",  required=True)
    main(parser.parse_args())
