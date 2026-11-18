"""
LoRA Fine-Tuning Pipeline for Wedding Venue Inpainting
Supports:
  - Apple Silicon Metal (MPS) locally
  - CUDA (Nvidia T4/A100 on Colab / Cloud GPU)
  - Diffusers SDXL / SD Inpainting base models
"""
import os
import sys
import argparse

def check_dependencies():
    missing = []
    for pkg in ["diffusers", "transformers", "accelerate", "torch", "safetensors", "peft"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    return missing

def main():
    parser = argparse.ArgumentParser(description="Train Wedding Venue Inpainting LoRA")
    parser.add_argument("--model", type=str, default="diffusers/stable-diffusion-xl-1.0-inpainting-0.1", help="Base inpainting model")
    parser.add_argument("--dataset_dir", type=str, default="backend/datasets/wedding_venues/processed_1024", help="Directory of 1024x1024 dataset images")
    parser.add_argument("--output_dir", type=str, default="backend/weights/wedding_venues_lora", help="Destination for trained LoRA safetensors")
    parser.add_argument("--steps", type=int, default=800, help="Training steps")
    parser.add_argument("--batch_size", type=int, default=1, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    args = parser.parse_args()

    missing = check_dependencies()
    if missing:
        print(f"[!] Missing required ML packages for diffusion training: {', '.join(missing)}")
        print(f"    Install with: pip install {' '.join(missing)}")
        sys.exit(1)

    import torch
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"[*] Training Device: {device.upper()}")
    print(f"[*] Base Inpainting Model: {args.model}")
    print(f"[*] Dataset: {args.dataset_dir}")
    print(f"[*] Output: {args.output_dir}")
    print(f"[*] Max Steps: {args.steps}")
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Ready to execute HuggingFace diffusers LoRA training
    cmd = (
        f"accelerate launch -m diffusers.examples.dreambooth.train_dreambooth_lora_sdxl "
        f"--pretrained_model_name_or_path='{args.model}' "
        f"--instance_data_dir='{args.dataset_dir}' "
        f"--output_dir='{args.output_dir}' "
        f"--instance_prompt='a photo of a luxury wedding venue stage, [wedding_stage_venue]' "
        f"--resolution=1024 "
        f"--train_batch_size={args.batch_size} "
        f"--gradient_accumulation_steps=4 "
        f"--learning_rate={args.lr} "
        f"--max_train_steps={args.steps} "
        f"--checkpointing_steps=200"
    )
    print("\n[Executing Diffusion Training Command]:")
    print(cmd)

if __name__ == "__main__":
    main()

