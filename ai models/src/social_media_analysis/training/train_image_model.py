"""
train_image_model.py
====================
Trains EfficientNet-B4 on civic issue images.

Uses pre-split train/val/test folders from prepare_dataset.py

Run AFTER prepare_dataset.py --mode image
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import transforms, models
from torchvision.datasets import ImageFolder
from sklearn.metrics import classification_report
import numpy as np
from datetime import datetime

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────

CONFIG = {
    "splits_dir":    "data/image_splits",
    "output_dir":    "models/image_classifier",
    "epochs":        20,
    "batch_size":    16,          # safe for 6GB VRAM
    "image_size":    380,         # EfficientNet-B4 native size
    "learning_rate": 1e-4,
    "weight_decay":  0.01,
    "num_workers":   4,
    "device":        "cuda" if torch.cuda.is_available() else "cpu",
    "early_stop_patience": 5,     # stop if no improvement for 5 epochs
}

# print(f"🖥️  Device : {CONFIG['device']}")
# if CONFIG["device"] == "cuda":
#     print(f"🎮 GPU    : {torch.cuda.get_device_name(0)}")
#     print(f"💾 VRAM   : {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")


# ─────────────────────────────────────────
# Transforms
# ─────────────────────────────────────────

# Training — augmentation to prevent overfitting
# Civic images are varied (different angles, lighting, phones)
train_transforms = transforms.Compose([
    transforms.Resize((CONFIG["image_size"], CONFIG["image_size"])),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.RandomGrayscale(p=0.05),
    transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],   # ImageNet stats
        std=[0.229, 0.224, 0.225],
    ),
])

# Val/Test — no augmentation
eval_transforms = transforms.Compose([
    transforms.Resize((CONFIG["image_size"], CONFIG["image_size"])),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# ─────────────────────────────────────────
# Model
# ─────────────────────────────────────────

def build_model(num_classes: int) -> nn.Module:
    """EfficientNet-B4 with custom classification head.

    Transfer learning:
    - Early layers frozen (reuse ImageNet features)
    - Last 2 blocks + classifier fine-tuned on civic images
    """
    model = models.efficientnet_b4(
        weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1
    )

    # Freeze early feature layers — keep general visual features
    for param in model.features[:6].parameters():
        param.requires_grad = False

    # Unfreeze last 2 blocks — learn civic-specific features
    for param in model.features[6:].parameters():
        param.requires_grad = True

    # Replace classifier with custom head for your categories
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, 512),
        nn.BatchNorm1d(512),
        nn.ReLU(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes),
    )

    return model


# ─────────────────────────────────────────
# Evaluation
# ─────────────────────────────────────────

def evaluate(model, loader, device, class_names: list, split_name: str = "Val"):
    """Evaluate model on val or test set."""
    model.eval()
    all_preds  = []
    all_labels = []
    total_loss = 0.0
    criterion  = nn.CrossEntropyLoss()

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss    = criterion(outputs, labels)
            total_loss += loss.item()

            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    acc      = np.mean(np.array(all_preds) == np.array(all_labels)) * 100
    avg_loss = total_loss / len(loader)

    print(f"\n  {split_name} Loss    : {avg_loss:.4f}")
    print(f"  {split_name} Accuracy: {acc:.2f}%")

    # Full report only for test set
    if split_name == "Test":
        print(f"\n Per-Class Report:")
        print(classification_report(
            all_labels,
            all_preds,
            target_names=class_names,
            zero_division=0,
        ))

    return {"loss": avg_loss, "accuracy": acc}


# ─────────────────────────────────────────
# Training
# ─────────────────────────────────────────

def train():
    device     = CONFIG["device"]
    splits_dir = CONFIG["splits_dir"]
    output_dir = CONFIG["output_dir"]
    os.makedirs(output_dir, exist_ok=True)

    # ── Check splits exist ───────────────────────────────────
    for split in ["train", "val", "test"]:
        split_path = os.path.join(splits_dir, split)
        if not os.path.exists(split_path):
            raise FileNotFoundError(
                f"'{split_path}' not found.\n"
                f"Run: python prepare_dataset.py --mode image"
            )

    # ── Load datasets ────────────────────────────────────────
    train_dataset = ImageFolder(
        os.path.join(splits_dir, "train"),
        transform=train_transforms
    )
    val_dataset = ImageFolder(
        os.path.join(splits_dir, "val"),
        transform=eval_transforms
    )
    test_dataset = ImageFolder(
        os.path.join(splits_dir, "test"),
        transform=eval_transforms
    )

    class_names  = train_dataset.classes
    num_classes  = len(class_names)
    class_to_idx = train_dataset.class_to_idx

    print(f"\n Classes ({num_classes}): {class_names}")
    print(f" Train : {len(train_dataset)} images")
    print(f" Val   : {len(val_dataset)} images")
    print(f" Test  : {len(test_dataset)} images")

    train_loader = DataLoader(
        train_dataset,
        batch_size=CONFIG["batch_size"],
        shuffle=True,
        num_workers=CONFIG["num_workers"],
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=CONFIG["batch_size"],
        shuffle=False,
        num_workers=CONFIG["num_workers"],
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=CONFIG["batch_size"],
        shuffle=False,
        num_workers=CONFIG["num_workers"],
        pin_memory=True,
    )

    # ── Build model ──────────────────────────────────────────
    print(f"\n Building EfficientNet-B4...")
    model = build_model(num_classes).to(device)

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total     = sum(p.numel() for p in model.parameters())
    print(f" Trainable params: {trainable:,} / {total:,}")

    # ── Loss + Optimizer ─────────────────────────────────────
    criterion = nn.CrossEntropyLoss()

    # Different LR for pretrained vs new layers
    optimizer = torch.optim.AdamW([
        {
            "params": model.features[6:].parameters(),
            "lr": CONFIG["learning_rate"] * 0.1,   # lower for pretrained
        },
        {
            "params": model.classifier.parameters(),
            "lr": CONFIG["learning_rate"],           # higher for new head
        },
    ], weight_decay=CONFIG["weight_decay"])

    # Reduce LR when val accuracy stops improving
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=3,
        verbose=True,
    )

    # ── Training Loop ────────────────────────────────────────
    best_val_acc    = 0.0
    best_model_path = os.path.join(output_dir, "best_model.pth")
    patience_counter = 0
    history = []

    for epoch in range(CONFIG["epochs"]):
        print(f"\n{'='*55}")
        print(f"Epoch {epoch+1}/{CONFIG['epochs']}")
        print(f"{'='*55}")

        # Training phase
        model.train()
        total_loss  = 0.0
        correct     = 0
        total       = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss    = criterion(outputs, labels)
            loss.backward()

            # Gradient clipping — prevents exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            correct += (preds == labels).sum().item()
            total   += labels.size(0)

            if batch_idx % 10 == 0:
                print(
                    f"  [{batch_idx:>4}/{len(train_loader)}] "
                    f"Loss: {loss.item():.4f} | "
                    f"Acc: {100*correct/total:.1f}%",
                    end="\r"
                )

        train_acc  = 100 * correct / total
        avg_loss   = total_loss / len(train_loader)
        print(f"\n  Train Loss: {avg_loss:.4f} | Train Acc: {train_acc:.2f}%")

        # Validation phase
        val_metrics = evaluate(model, val_loader, device, class_names, "Val")
        val_acc     = val_metrics["accuracy"]

        scheduler.step(val_acc)

        # Save best model + early stopping
        if val_acc > best_val_acc:
            best_val_acc     = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), best_model_path)
            print(f" Best model saved! Val Acc: {best_val_acc:.2f}%")
        else:
            patience_counter += 1
            print(f" No improvement ({patience_counter}/{CONFIG['early_stop_patience']})")

        history.append({
            "epoch":     epoch + 1,
            "train_loss": avg_loss,
            "train_acc":  train_acc,
            "val_acc":    val_acc,
        })

        # Early stopping
        if patience_counter >= CONFIG["early_stop_patience"]:
            print(f"\n Early stopping triggered at epoch {epoch+1}")
            break

    # ── Final Test Evaluation ────────────────────────────────
    print(f"\n{'='*55}")
    print("FINAL TEST EVALUATION")
    print("(Loading best model...)")
    print(f"{'='*55}")

    model.load_state_dict(torch.load(best_model_path, map_location=device))
    test_metrics = evaluate(model, test_loader, device, class_names, "Test")

    # ── Save metadata ────────────────────────────────────────
    metadata = {
        "classes":          class_names,
        "class_to_idx":     class_to_idx,
        "idx_to_class":     {str(v): k for k, v in class_to_idx.items()},
        "num_classes":      num_classes,
        "image_size":       CONFIG["image_size"],
        "best_val_accuracy":best_val_acc,
        "test_accuracy":    test_metrics["accuracy"],
        "trained_at":       datetime.utcnow().isoformat(),
        "config":           CONFIG,
        "history":          history,
    }

    metadata_path = os.path.join(output_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n{'='*55}")
    print(f" Training complete!")
    print(f" Best Val Accuracy : {best_val_acc:.2f}%")
    print(f" Test Accuracy     : {test_metrics['accuracy']:.2f}%")
    print(f" Model saved to    : {output_dir}/best_model.pth")
    print(f" Metadata saved to : {metadata_path}")
    print(f"{'='*55}")

    print(f"\n Next step — run inference:")
    print(f"   from image_classifier import CivicImageClassifier")
    print(f"   clf = CivicImageClassifier('{output_dir}')")
    print(f"   result = clf.classify_from_path('your_image.jpg')")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--splits_dir", default="data/image_splits")
    parser.add_argument("--output_dir", default="models/image_classifier")
    parser.add_argument("--epochs",     type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    CONFIG["splits_dir"]  = args.splits_dir
    CONFIG["output_dir"]  = args.output_dir
    CONFIG["epochs"]      = args.epochs
    CONFIG["batch_size"]  = args.batch_size

    train()
