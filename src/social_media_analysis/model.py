import os
from dataclasses import dataclass
from typing import Dict, List, Optional

import torch
from torch.utils.data import DataLoader, Dataset
from transformers import (
    AutoModel,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
    PreTrainedModel,
    PreTrainedTokenizer,
    DataCollatorWithPadding,
)


# ─────────────────────────────────────────────
# Custom Output Class
# Bug Fix: SequenceClassifierOutput only holds ONE logits field.
# We need a custom dataclass to return BOTH issue + sentiment logits.
# ─────────────────────────────────────────────

@dataclass
class MultiTaskOutput:
    """Custom output holding both classification heads' results."""
    loss: Optional[torch.Tensor] = None
    issue_logits: Optional[torch.Tensor] = None       # shape: (batch, num_issue_labels)
    sentiment_logits: Optional[torch.Tensor] = None   # shape: (batch, num_sentiment_labels)
    hidden_states: Optional[tuple] = None
    attentions: Optional[tuple] = None


# ─────────────────────────────────────────────
# Multi-Task Model
# ─────────────────────────────────────────────

class MultiTaskClassifier(PreTrainedModel):
    """Multi-task transformer with two classification heads.

    Head 1: Issue category (Water Supply, Road Damage, Electricity etc.)
    Head 2: Sentiment (negative, neutral, positive)

    Both heads share the same BERT backbone — efficient and fast.
    """

    config_class = None

    def __init__(self, config, num_issue_labels: int, num_sentiment_labels: int):
        super().__init__(config)
        self.transformer = AutoModel.from_config(config)
        hidden_size = config.hidden_size

        # Two separate linear classification heads
        self.issue_classifier = torch.nn.Linear(hidden_size, num_issue_labels)
        self.sentiment_classifier = torch.nn.Linear(hidden_size, num_sentiment_labels)
        self.dropout = torch.nn.Dropout(config.hidden_dropout_prob)

    def forward(
        self,
        input_ids=None,
        attention_mask=None,
        token_type_ids=None,
        issue_labels=None,
        sentiment_labels=None,
    ) -> MultiTaskOutput:
        # Run text through shared BERT backbone
        outputs = self.transformer(
            input_ids,
            attention_mask=attention_mask,
            token_type_ids=token_type_ids,
            return_dict=True,
        )

        # Use [CLS] token pooled output as sentence representation
        pooled = (
            outputs.pooler_output
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None
            else outputs.last_hidden_state[:, 0]
        )
        pooled = self.dropout(pooled)

        # Run both heads
        issue_logits = self.issue_classifier(pooled)
        sentiment_logits = self.sentiment_classifier(pooled)

        # Compute combined loss during training
        loss = None
        if issue_labels is not None and sentiment_labels is not None:
            issue_loss = torch.nn.functional.cross_entropy(issue_logits, issue_labels)
            sent_loss = torch.nn.functional.cross_entropy(sentiment_logits, sentiment_labels)
            loss = issue_loss + sent_loss

        # ✅ Fix: Return BOTH logits (previously sentiment_logits was dropped)
        return MultiTaskOutput(
            loss=loss,
            issue_logits=issue_logits,
            sentiment_logits=sentiment_logits,
            hidden_states=outputs.hidden_states,
            attentions=outputs.attentions,
        )


# ─────────────────────────────────────────────
# Dataset
# ─────────────────────────────────────────────

class PostDataset(Dataset):
    """Dataset for training — wraps texts and numeric labels."""

    def __init__(
        self,
        texts: List[str],
        issue_labels: List[int],
        sentiment_labels: List[int],
        tokenizer: PreTrainedTokenizer,
        max_length: int = 128,
    ):
        self.encodings = tokenizer(
            texts,
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )
        self.issue_labels = issue_labels
        self.sentiment_labels = sentiment_labels

    def __len__(self):
        return len(self.issue_labels)

    def __getitem__(self, idx):
        item = {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}
        item["issue_labels"] = torch.tensor(self.issue_labels[idx])
        item["sentiment_labels"] = torch.tensor(self.sentiment_labels[idx])
        return item


# ─────────────────────────────────────────────
# Inference Helper
# ─────────────────────────────────────────────

# Label maps — must match your training CSV
ISSUE_LABELS = {
    0: "Water Supply",
    1: "Road Damage",
    2: "Electricity",
    3: "Sanitation and Garbage",
    4: "Public Safety",
    5: "Healthcare",
    6: "Education",
    7: "Traffic",
    8: "Flooding",
    9: "Street Lights",
    10: "Sewage",
    11: "Other",
}

SENTIMENT_LABELS = {
    0: "negative",
    1: "neutral",
    2: "positive",
}


def predict(text: str, model: MultiTaskClassifier, tokenizer: PreTrainedTokenizer) -> dict:
    """Run inference on a single text string.

    Returns both issue_type and sentiment — fully fixed version.
    """
    model.eval()
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
    )

    with torch.no_grad():
        outputs = model(**inputs)

    # Both logits now accessible
    issue_pred = torch.argmax(outputs.issue_logits, dim=1).item()
    sentiment_pred = torch.argmax(outputs.sentiment_logits, dim=1).item()

    issue_confidence = torch.softmax(outputs.issue_logits, dim=1).max().item()
    sentiment_confidence = torch.softmax(outputs.sentiment_logits, dim=1).max().item()

    return {
        "issue_type": ISSUE_LABELS.get(issue_pred, "Other"),
        "issue_confidence": round(issue_confidence, 3),
        "sentiment": SENTIMENT_LABELS.get(sentiment_pred, "neutral"),
        "sentiment_confidence": round(sentiment_confidence, 3),
    }


# ─────────────────────────────────────────────
# Training
# ─────────────────────────────────────────────

def train(
    train_csv: str,
    model_name: str = "bert-base-multilingual-cased",
    output_dir: str = "./models/multitask",
    epochs: int = 3,
    batch_size: int = 16,
):
    """Train the multitask model on a labeled CSV.

    CSV must have columns: text, issue (int), sentiment (int)

    Issue label mapping (numeric → category):
        0=Water Supply, 1=Road Damage, 2=Electricity,
        3=Sanitation, 4=Public Safety, 5=Healthcare,
        6=Education, 7=Traffic, 8=Flooding,
        9=Street Lights, 10=Sewage, 11=Other

    Sentiment label mapping:
        0=negative, 1=neutral, 2=positive
    """
    import pandas as pd

    df = pd.read_csv(train_csv)
    texts = df["text"].tolist()
    issue_labels = df["issue"].tolist()
    sentiment_labels = df["sentiment"].tolist()

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    dataset = PostDataset(texts, issue_labels, sentiment_labels, tokenizer)

    # Load config from pretrained model
    base_model = AutoModel.from_pretrained(model_name)
    config = base_model.config
    del base_model  # free memory

    num_issue = len(set(issue_labels))
    num_sent = len(set(sentiment_labels))
    model = MultiTaskClassifier(config, num_issue, num_sent)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        logging_dir=os.path.join(output_dir, "logs"),
        save_strategy="epoch",
        evaluation_strategy="no",
        logging_steps=10,
        load_best_model_at_end=False,
    )

    # Custom Trainer to handle MultiTaskOutput
    class MultiTaskTrainer(Trainer):
        def compute_loss(self, model, inputs, return_outputs=False):
            outputs = model(**inputs)
            loss = outputs.loss
            return (loss, outputs) if return_outputs else loss

    trainer = MultiTaskTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorWithPadding(tokenizer),
    )

    print(f" Starting training on {len(dataset)} samples...")
    trainer.train()
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f" Model saved to {output_dir}")


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train NETRAVAAH multi-task model")
    parser.add_argument("--train_csv", required=True, help="Path to training CSV")
    parser.add_argument("--model_name", default="bert-base-multilingual-cased")
    parser.add_argument("--output_dir", default="./models/multitask")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    train(
        args.train_csv,
        model_name=args.model_name,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
    )
