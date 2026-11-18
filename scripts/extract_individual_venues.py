"""
Extract individual venue photos from screenshot collages and prepare
both separated raw images and normalized 1024x1024 diffusion training dataset.
"""
import os
import json
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "../backend/datasets/wedding_venues")
SEPARATED_DIR = os.path.join(DATASET_DIR, "separated")
PROCESSED_DIR = os.path.join(DATASET_DIR, "processed_1024")
CAPTIONS_DIR = os.path.join(DATASET_DIR, "captions")

os.makedirs(SEPARATED_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(CAPTIONS_DIR, exist_ok=True)

uploaded = [
    '/Users/rizal/.gemini/antigravity/brain/92d12021-ffbb-42db-8cb8-d32c58a3fb01/.user_uploaded/media_1793679906380_7bec0bac.jpg',
    '/Users/rizal/.gemini/antigravity/brain/92d12021-ffbb-42db-8cb8-d32c58a3fb01/.user_uploaded/media_1793679973298_187722bb.jpg',
    '/Users/rizal/.gemini/antigravity/brain/92d12021-ffbb-42db-8cb8-d32c58a3fb01/.user_uploaded/media_1793680080538_e5faeda9.jpg',
    '/Users/rizal/.gemini/antigravity/brain/92d12021-ffbb-42db-8cb8-d32c58a3fb01/.user_uploaded/media_1793680147318_c900cd0f.jpg',
    '/Users/rizal/.gemini/antigravity/brain/92d12021-ffbb-42db-8cb8-d32c58a3fb01/.user_uploaded/media_1793680287422_1837ca78.jpg'
]

cols_5 = [(18, 204), (212, 398), (406, 592), (600, 786), (794, 980)]
bg = np.array([35, 35, 43], dtype=np.float32)

all_extracted = []

# Process Images 1 to 4 (5-column Pinterest / Google Images grids)
for img_idx in range(4):
    img_path = uploaded[img_idx]
    im = Image.open(img_path).convert("RGB")
    arr = np.array(im)
    diff = np.abs(arr.astype(np.float32) - bg).max(axis=-1)

    for c_idx, (x1, x2) in enumerate(cols_5):
        slice_c = diff[:, x1:x2]
        # In a real photo row, the vast majority of pixels differ from the dark background
        is_photo_row = (slice_c > 22).mean(axis=1) > 0.65

        start = None
        for y, is_p in enumerate(is_photo_row):
            if is_p and start is None:
                start = y
            elif not is_p and start is not None:
                h = y - start
                if h >= 48:
                    all_extracted.append({
                        "source_img": img_idx + 1,
                        "box": (x1, start, x2, y),
                        "img": im.crop((x1, start, x2, y))
                    })
                start = None
        if start is not None and len(is_photo_row) - start >= 48:
            all_extracted.append({
                "source_img": img_idx + 1,
                "box": (x1, start, x2, len(is_photo_row)),
                "img": im.crop((x1, start, x2, len(is_photo_row)))
            })

# Process Image 5 (3 left columns + right preview pane with large photo and sub-thumbnails)
im5 = Image.open(uploaded[4]).convert("RGB")
arr5 = np.array(im5)
diff5 = np.abs(arr5.astype(np.float32) - bg).max(axis=-1)

cols_img5_left = [(18, 194), (198, 376), (382, 560)]
for c_idx, (x1, x2) in enumerate(cols_img5_left):
    slice_c = diff5[:, x1:x2]
    is_photo_row = (slice_c > 22).mean(axis=1) > 0.65
    start = None
    for y, is_p in enumerate(is_photo_row):
        if is_p and start is None:
            start = y
        elif not is_p and start is not None:
            h = y - start
            if h >= 45:
                all_extracted.append({
                    "source_img": 5,
                    "box": (x1, start, x2, y),
                    "img": im5.crop((x1, start, x2, y))
                })
            start = None
    if start is not None and len(is_photo_row) - start >= 45:
        all_extracted.append({
            "source_img": 5,
            "box": (x1, start, x2, len(is_photo_row)),
            "img": im5.crop((x1, start, x2, len(is_photo_row)))
        })

# Large main venue photo on right of Image 5
main_crown_crop = im5.crop((588, 120, 975, 335))
all_extracted.append({
    "source_img": 5,
    "box": (588, 120, 975, 335),
    "img": main_crown_crop
})

# Sub-thumbnails on right of Image 5
sub_thumbs = [
    (588, 400, 642, 452),
    (645, 400, 715, 452),
    (720, 400, 840, 452),
    (845, 400, 975, 452)
]
for (tx1, ty1, tx2, ty2) in sub_thumbs:
    all_extracted.append({
        "source_img": 5,
        "box": (tx1, ty1, tx2, ty2),
        "img": im5.crop((tx1, ty1, tx2, ty2))
    })

print(f"Total extracted venue photos: {len(all_extracted)}")

metadata_records = []

# Deduplicate / filter out near-duplicates or tiny slivers
saved_count = 0
for i, item in enumerate(all_extracted, start=1):
    crop_im = item["img"]
    cw, ch = crop_im.size
    if cw < 45 or ch < 45:
        continue

    # Shave 1-2 pixels border if needed to remove dark edge
    if cw > 10 and ch > 10:
        crop_im = crop_im.crop((1, 1, cw - 1, ch - 1))
        cw, ch = crop_im.size

    # Save original aspect ratio separated photo
    sep_filename = f"venue_{saved_count+1:03d}.jpg"
    sep_path = os.path.join(SEPARATED_DIR, sep_filename)
    crop_im.save(sep_path, quality=95, optimize=True)

    # Prepare 1024x1024 square crop for Diffusion / LoRA training
    # Pad or center crop
    min_dim = min(cw, ch)
    # Center crop square
    l = (cw - min_dim) // 2
    t = (ch - min_dim) // 2
    square_crop = crop_im.crop((l, t, l + min_dim, t + min_dim))
    resized_1024 = square_crop.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    proc_filename = f"venue_{saved_count+1:03d}_1024.jpg"
    proc_path = os.path.join(PROCESSED_DIR, proc_filename)
    resized_1024.save(proc_path, quality=95, optimize=True)

    # Build contextual caption based on source screenshot theme
    src = item["source_img"]
    if src in [1, 2]:
        caption = "a photorealistic architectural photograph of a luxury wedding venue stage and reception hall, [wedding_stage_venue] spatial depth, elegant banquet seating, ambient fairy chandeliers, botanical event staging"
    elif src in [3, 4]:
        caption = "a photorealistic architectural photograph of an outdoor beach and coastal wedding venue, [wedding_stage_venue] ocean backdrop, white sand aisle runner, bamboo gazebo mandap arch, floral pedestals"
    else:
        caption = "a photorealistic architectural photograph of an executive corporate ballroom and banquet stage, [wedding_stage_venue] formal conference tablescapes, stage screen backdrop, professional architectural downlighting"

    cap_filename = f"venue_{saved_count+1:03d}_1024.txt"
    cap_path = os.path.join(CAPTIONS_DIR, cap_filename)
    with open(cap_path, "w", encoding="utf-8") as f:
        f.write(caption)

    metadata_records.append({
        "file_name": proc_filename,
        "text": caption,
        "original_file": sep_filename,
        "original_dimensions": [cw, ch],
        "training_resolution": [1024, 1024],
        "source_screenshot": src
    })

    saved_count += 1

# Write HuggingFace metadata.jsonl
jsonl_path = os.path.join(PROCESSED_DIR, "metadata.jsonl")
with open(jsonl_path, "w", encoding="utf-8") as jf:
    for r in metadata_records:
        jf.write(json.dumps(r) + "\n")

print(f"\nSUCCESS: Separated and saved {saved_count} distinct venue photos into:")
print(f"  1. Separated raw photos: {SEPARATED_DIR}")
print(f"  2. 1024x1024 Diffusion training dataset: {PROCESSED_DIR}")
print(f"  3. Training captions: {CAPTIONS_DIR}")
print(f"  4. Dataset manifest: {jsonl_path}")

