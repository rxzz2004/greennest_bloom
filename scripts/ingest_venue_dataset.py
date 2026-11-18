"""
Wedding Venue Dataset Ingestion & Preprocessing Pipeline
Normalizes incoming raw venue screenshots/photos into high-resolution 1024x1024 training-ready formats
with paired diffusion captions and metadata.jsonl.
"""
import os
import glob
import json
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "../backend/datasets/wedding_venues")
RAW_DIR = os.path.join(DATASET_DIR, "raw")
PROCESSED_DIR = os.path.join(DATASET_DIR, "processed_1024")
CAPTIONS_DIR = os.path.join(DATASET_DIR, "captions")

def preprocess_venue_images():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(CAPTIONS_DIR, exist_ok=True)

    supported_exts = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    raw_files = []
    for ext in supported_exts:
        raw_files.extend(glob.glob(os.path.join(RAW_DIR, ext)))

    if not raw_files:
        print(f"No raw venue images found in {RAW_DIR}. Drop your screenshots there to process!")
        return

    metadata_records = []
    count = 0

    for idx, img_path in enumerate(sorted(raw_files), start=1):
        filename = os.path.basename(img_path)
        base_name = os.path.splitext(filename)[0]
        
        try:
            with Image.open(img_path) as im:
                im = im.convert("RGB")
                w, h = im.size

                # Smart crop to square or high-res 1024x1024
                min_dim = min(w, h)
                left = (w - min_dim) // 2
                top = (h - min_dim) // 2
                right = left + min_dim
                bottom = top + min_dim

                cropped = im.crop((left, top, right, bottom))
                resized = cropped.resize((1024, 1024), Image.Resampling.LANCZOS)

                out_filename = f"venue_{idx:03d}_{base_name[:30]}.jpg"
                out_path = os.path.join(PROCESSED_DIR, out_filename)
                resized.save(out_path, quality=95, optimize=True)

                # Generate high-quality conditioning caption
                caption_text = f"a high-resolution architectural photograph of a luxury wedding venue stage, [wedding_stage_venue] spatial perspective, elegant banquet hall backdrop, professional event lighting"
                
                caption_path = os.path.join(CAPTIONS_DIR, f"venue_{idx:03d}_{base_name[:30]}.txt")
                with open(caption_path, "w", encoding="utf-8") as cf:
                    cf.write(caption_text)

                metadata_records.append({
                    "file_name": out_filename,
                    "text": caption_text,
                    "original_dimensions": [w, h],
                    "target_dimensions": [1024, 1024]
                })

                count += 1
                print(f"Processed [{idx}]: {out_filename} (1024x1024)")
        except Exception as e:
            print(f"Error processing {img_path}: {e}")

    # Write HuggingFace Diffusers metadata.jsonl
    jsonl_path = os.path.join(PROCESSED_DIR, "metadata.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as jf:
        for r in metadata_records:
            jf.write(json.dumps(r) + "\n")

    print(f"\nSuccessfully prepared {count} venue dataset images in {PROCESSED_DIR}")
    print(f"Training metadata written to {jsonl_path}")

if __name__ == "__main__":
    preprocess_venue_images()

