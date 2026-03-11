"""
train_text_model.py
===================
Trains a MultiTask BERT model to classify:
1. Civic issue type (18 categories)
2. Sentiment (negative / neutral / positive)

Uses pre-split train/val/test CSVs from prepare_dataset.py

Run AFTER prepare_dataset.py --mode text
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModel,
    AutoTokenizer,
    get_linear_schedule_with_warmup,
)
from sklearn.metrics import classification_report, confusion_matrix
import pandas as pd
import numpy as np
from datetime import datetime
from dataclasses import dataclass
from typing import Optional

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────

CONFIG = {
    "model_name":      "bert-base-multilingual-cased",  # handles Hindi + English
    "splits_dir":      "data/text_splits",
    "output_dir":      "models/multitask",
    "epochs":          5,
    "batch_size":      16,
    "max_length":      128,
    "learning_rate":   2e-5,
    "warmup_steps":    100,
    "weight_decay":    0.01,
    "device":          "cuda" if torch.cuda.is_available() else "cpu",
}

# print(f"🖥️  Device : {CONFIG['device']}")
# if CONFIG["device"] == "cuda":
#     print(f"🎮 GPU    : {torch.cuda.get_device_name(0)}")


# ─────────────────────────────────────────
# Custom Output
# ─────────────────────────────────────────

@dataclass
class MultiTaskOutput:
    loss:              Optional[torch.Tensor] = None
    issue_logits:      Optional[torch.Tensor] = None
    sentiment_logits:  Optional[torch.Tensor] = None


# ─────────────────────────────────────────
# Model
# ─────────────────────────────────────────

class MultiTaskClassifier(nn.Module):
    """BERT with two classification heads.

    Head 1 → civic issue type  (18 classes)
    Head 2 → sentiment         (3 classes)
    """

    def __init__(self, model_name: str, num_issue_labels: int, num_sentiment_labels: int):
        super().__init__()
        self.bert = AutoModel.from_pretrained(model_name)
        hidden_size = self.bert.config.hidden_size

        self.issue_classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(hidden_size, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, num_issue_labels),
        )

        self.sentiment_classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Linear(64, num_sentiment_labels),
        )

    def forward(
        self,
        input_ids,
        attention_mask,
        token_type_ids=None,
        issue_labels=None,
        sentiment_labels=None,
    ) -> MultiTaskOutput:

        outputs = self.bert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            return_dict=True,
        )

        # CLS token = sentence representation
        pooled = outputs.last_hidden_state[:, 0]

        issue_logits     = self.issue_classifier(pooled)
        sentiment_logits = self.sentiment_classifier(pooled)

        loss = None
        if issue_labels is not None and sentiment_labels is not None:
            issue_loss = nn.functional.cross_entropy(issue_logits, issue_labels)
            sent_loss  = nn.functional.cross_entropy(sentiment_logits, sentiment_labels)
            # Weight issue loss higher — it's the more important task
            loss = (issue_loss * 0.7) + (sent_loss * 0.3)

        return MultiTaskOutput(
            loss=loss,
            issue_logits=issue_logits,
            sentiment_logits=sentiment_logits,
        )


# ─────────────────────────────────────────
# Dataset
# ─────────────────────────────────────────

class TextDataset(Dataset):
    def __init__(self, csv_path: str, tokenizer, max_length: int = 128):
        df = pd.read_csv(csv_path)
        self.texts           = df["text"].tolist()
        self.issue_labels    = df["issue"].tolist()
        self.sentiment_labels= df["sentiment"].tolist()
        self.tokenizer       = tokenizer
        self.max_length      = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )
        return {
            "input_ids":       encoding["input_ids"].squeeze(0),
            "attention_mask":  encoding["attention_mask"].squeeze(0),
            "issue_labels":    torch.tensor(self.issue_labels[idx], dtype=torch.long),
            "sentiment_labels":torch.tensor(self.sentiment_labels[idx], dtype=torch.long),
        }


# ─────────────────────────────────────────
# Evaluation
# ─────────────────────────────────────────

def evaluate(model, loader, device, label_map: dict, split_name: str = "Val"):
    """Run evaluation on val or test set.

    Returns accuracy for both heads + full classification report.
    """
    model.eval()
    all_issue_preds     = []
    all_issue_labels    = []
    all_sentiment_preds = []
    all_sentiment_labels= []
    total_loss = 0.0

    with torch.no_grad():
        for batch in loader:
            input_ids       = batch["input_ids"].to(device)
            attention_mask  = batch["attention_mask"].to(device)
            issue_labels    = batch["issue_labels"].to(device)
            sentiment_labels= batch["sentiment_labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                issue_labels=issue_labels,
                sentiment_labels=sentiment_labels,
            )

            total_loss += outputs.loss.item()

            issue_preds     = torch.argmax(outputs.issue_logits, dim=1)
            sentiment_preds = torch.argmax(outputs.sentiment_logits, dim=1)

            all_issue_preds.extend(issue_preds.cpu().numpy())
            all_issue_labels.extend(issue_labels.cpu().numpy())
            all_sentiment_preds.extend(sentiment_preds.cpu().numpy())
            all_sentiment_labels.extend(sentiment_labels.cpu().numpy())

    # Accuracy
    issue_acc = np.mean(
        np.array(all_issue_preds) == np.array(all_issue_labels)
    ) * 100
    sentiment_acc = np.mean(
        np.array(all_sentiment_preds) == np.array(all_sentiment_labels)
    ) * 100
    avg_loss = total_loss / len(loader)

    print(f"\n  {split_name} Results:")
    print(f"  Loss          : {avg_loss:.4f}")
    print(f"  Issue Acc     : {issue_acc:.2f}%")
    print(f"  Sentiment Acc : {sentiment_acc:.2f}%")

    # Detailed report on test set
    if split_name == "Test":
        idx_to_issue = label_map.get("idx_to_issue", {})
        issue_names = [idx_to_issue.get(str(i), str(i)) for i in range(len(idx_to_issue))]

        print(f"\n Issue Classification Report:")
        print(classification_report(
            all_issue_labels,
            all_issue_preds,
            target_names=issue_names,
            zero_division=0,
        ))

        print(f" Sentiment Classification Report:")
        print(classification_report(
            all_sentiment_labels,
            all_sentiment_preds,
            target_names=["negative", "neutral", "positive"],
            zero_division=0,
        ))

    return {
        "loss": avg_loss,
        "issue_accuracy": issue_acc,
        "sentiment_accuracy": sentiment_acc,
    }


# ─────────────────────────────────────────
# Training
# ─────────────────────────────────────────

def train():
    device     = CONFIG["device"]
    splits_dir = CONFIG["splits_dir"]
    output_dir = CONFIG["output_dir"]
    os.makedirs(output_dir, exist_ok=True)

    # ── Load label map ───────────────────────────────────────
    label_map_path = os.path.join(splits_dir, "label_map.json")
    if not os.path.exists(label_map_path):
        raise FileNotFoundError(
            f"label_map.json not found.\nRun: python prepare_dataset.py --mode text"
        )
    with open(label_map_path) as f:
        label_map = json.load(f)

    num_issue_labels     = label_map["num_issue_labels"]
    num_sentiment_labels = label_map["num_sentiment_labels"]
    print(f"\n Issue labels    : {num_issue_labels}")
    print(f" Sentiment labels: {num_sentiment_labels}")

    # ── Tokenizer ────────────────────────────────────────────
    print(f"\n Loading tokenizer: {CONFIG['model_name']}...")
    tokenizer = AutoTokenizer.from_pretrained(CONFIG["model_name"])

    # ── Datasets ─────────────────────────────────────────────
    train_dataset = TextDataset(
        os.path.join(splits_dir, "train.csv"), tokenizer, CONFIG["max_length"]
    )
    val_dataset = TextDataset(
        os.path.join(splits_dir, "val.csv"), tokenizer, CONFIG["max_length"]
    )
    test_dataset = TextDataset(
        os.path.join(splits_dir, "test.csv"), tokenizer, CONFIG["max_length"]
    )

    train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"], shuffle=True)
    val_loader   = DataLoader(val_dataset,   batch_size=CONFIG["batch_size"], shuffle=False)
    test_loader  = DataLoader(test_dataset,  batch_size=CONFIG["batch_size"], shuffle=False)

    print(f" Train: {len(train_dataset)} | Val: {len(val_dataset)} | Test: {len(test_dataset)}")

    # ── Model ────────────────────────────────────────────────
    print(f"\n Loading model: {CONFIG['model_name']}...")
    model = MultiTaskClassifier(
        CONFIG["model_name"],
        num_issue_labels,
        num_sentiment_labels,
    ).to(device)

    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f" Trainable parameters: {total_params:,}")

    # ── Optimizer + Scheduler ────────────────────────────────
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=CONFIG["learning_rate"],
        weight_decay=CONFIG["weight_decay"],
    )

    total_steps = len(train_loader) * CONFIG["epochs"]
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=CONFIG["warmup_steps"],
        num_training_steps=total_steps,
    )

    # ── Training Loop ────────────────────────────────────────
    best_val_issue_acc = 0.0
    best_model_path    = os.path.join(output_dir, "best_model.pt")
    history = []

    for epoch in range(CONFIG["epochs"]):
        print(f"\n{'='*55}")
        print(f"Epoch {epoch+1}/{CONFIG['epochs']}")
        print(f"{'='*55}")

        model.train()
        total_loss      = 0.0
        issue_correct   = 0
        sent_correct    = 0
        total_samples   = 0

        for batch_idx, batch in enumerate(train_loader):
            input_ids        = batch["input_ids"].to(device)
            attention_mask   = batch["attention_mask"].to(device)
            issue_labels     = batch["issue_labels"].to(device)
            sentiment_labels = batch["sentiment_labels"].to(device)

            optimizer.zero_grad()

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                issue_labels=issue_labels,
                sentiment_labels=sentiment_labels,
            )

            outputs.loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += outputs.loss.item()

            issue_preds = torch.argmax(outputs.issue_logits, dim=1)
            sent_preds  = torch.argmax(outputs.sentiment_logits, dim=1)
            issue_correct += (issue_preds == issue_labels).sum().item()
            sent_correct  += (sent_preds == sentiment_labels).sum().item()
            total_samples += len(issue_labels)

            if batch_idx % 20 == 0:
                print(
                    f"  [{batch_idx:>4}/{len(train_loader)}] "
                    f"Loss: {outputs.loss.item():.4f} | "
                    f"Issue Acc: {100*issue_correct/total_samples:.1f}%",
                    end="\r"
                )

        train_issue_acc = 100 * issue_correct / total_samples
        train_sent_acc  = 100 * sent_correct / total_samples
        avg_train_loss  = total_loss / len(train_loader)

        print(f"\n  Train Loss: {avg_train_loss:.4f} | "
              f"Issue Acc: {train_issue_acc:.2f}% | "
              f"Sentiment Acc: {train_sent_acc:.2f}%")

        # Validation
        val_metrics = evaluate(model, val_loader, device, label_map, "Val")

        # Save best model
        if val_metrics["issue_accuracy"] > best_val_issue_acc:
            best_val_issue_acc = val_metrics["issue_accuracy"]
            torch.save(model.state_dict(), best_model_path)
            print(f" Best model saved! Val Issue Acc: {best_val_issue_acc:.2f}%")

        history.append({
            "epoch": epoch + 1,
            "train_loss": avg_train_loss,
            "train_issue_acc": train_issue_acc,
            "val_issue_acc": val_metrics["issue_accuracy"],
            "val_sentiment_acc": val_metrics["sentiment_accuracy"],
        })

    # ── Final Test Evaluation ────────────────────────────────
    print(f"\n{'='*55}")
    print("FINAL TEST EVALUATION")
    print("(Loading best model...)")
    print(f"{'='*55}")

    model.load_state_dict(torch.load(best_model_path, map_location=device))
    test_metrics = evaluate(model, test_loader, device, label_map, "Test")

    # ── Save everything ──────────────────────────────────────
    tokenizer.save_pretrained(output_dir)

    metadata = {
        "model_name":           CONFIG["model_name"],
        "num_issue_labels":     num_issue_labels,
        "num_sentiment_labels": num_sentiment_labels,
        "label_map":            label_map,
        "best_val_issue_acc":   best_val_issue_acc,
        "test_issue_acc":       test_metrics["issue_accuracy"],
        "test_sentiment_acc":   test_metrics["sentiment_accuracy"],
        "trained_at":           datetime.utcnow().isoformat(),
        "config":               CONFIG,
        "history":              history,
    }

    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n{'='*55}")
    print(f" Training complete!")
    print(f" Best Val Issue Acc : {best_val_issue_acc:.2f}%")
    print(f" Test Issue Acc     : {test_metrics['issue_accuracy']:.2f}%")
    print(f" Test Sentiment Acc : {test_metrics['sentiment_accuracy']:.2f}%")
    print(f" Model saved to     : {output_dir}/")
    print(f"{'='*55}")


if __name__ == "__main__":
    train()
