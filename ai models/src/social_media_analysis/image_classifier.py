"""
image_classifier.py
===================
Production image classifier for civic issues.

Loads the trained EfficientNet-B4 model and classifies
images uploaded by citizens on the community platform.

Usage:
    from image_classifier import CivicImageClassifier
    clf    = CivicImageClassifier()
    result = clf.classify_from_url("https://...")
    result = clf.classify_from_path("path/to/image.jpg")
"""

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import requests
import json
import os
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

MODEL_DIR = os.getenv("IMAGE_MODEL_DIR", "models/image_classifier")


class CivicImageClassifier:
    """Classifies civic issues from images using trained EfficientNet-B4.

    Loads model once at startup and reuses for all requests.
    """

    def __init__(self, model_dir: str = MODEL_DIR):
        # Load metadata saved during training
        metadata_path = os.path.join(model_dir, "metadata.json")

        if not os.path.exists(metadata_path):
            raise FileNotFoundError(
                f"Model metadata not found at {metadata_path}. "
                f"Run train_image_model.py first."
            )

        with open(metadata_path) as f:
            self.metadata = json.load(f)

        self.idx_to_class = {
            int(k): v
            for k, v in self.metadata["idx_to_class"].items()
        }
        self.image_size = self.metadata["image_size"]
        self.device     = "cuda" if torch.cuda.is_available() else "cpu"

        num_classes = len(self.idx_to_class)

        # Rebuild model architecture
        self.model = models.efficientnet_b4(weights=None)
        in_features = self.model.classifier[1].in_features
        self.model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_classes),
        )

        # Load trained weights
        weights_path = os.path.join(model_dir, "best_model.pth")
        if not os.path.exists(weights_path):
            raise FileNotFoundError(
                f"Model weights not found at {weights_path}. "
                f"Run train_image_model.py first."
            )

        self.model.load_state_dict(
            torch.load(weights_path, map_location=self.device)
        )
        self.model.to(self.device)
        self.model.eval()

        # Inference transform
        self.transform = transforms.Compose([
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

        print(f"Image classifier loaded on {self.device}")
        print(f"Classes: {list(self.idx_to_class.values())}")

    def classify_from_url(self, url: str) -> dict:
        """Classify civic issue from an image URL."""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
            return self.classify(image)
        except Exception as e:
            return {
                "issue_type":      "Unknown",
                "confidence":      0.0,
                "top3_predictions":[],
                "reliable":        False,
                "error":           str(e),
            }

    def classify_from_path(self, path: str) -> dict:
        """Classify civic issue from a local image file path."""
        try:
            image = Image.open(path).convert("RGB")
            return self.classify(image)
        except Exception as e:
            return {
                "issue_type":      "Unknown",
                "confidence":      0.0,
                "top3_predictions":[],
                "reliable":        False,
                "error":           str(e),
            }

    def classify_from_bytes(self, image_bytes: bytes) -> dict:
        """Classify civic issue from raw image bytes.

        Used when image is uploaded directly via API.
        """
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            return self.classify(image)
        except Exception as e:
            return {
                "issue_type":      "Unknown",
                "confidence":      0.0,
                "top3_predictions":[],
                "reliable":        False,
                "error":           str(e),
            }

    def classify(self, image: Image.Image) -> dict:
        """Core classification logic. Takes a PIL Image.

        Returns:
            issue_type       - top predicted civic issue category
            confidence       - confidence score 0 to 1
            top3_predictions - top 3 predictions with scores
            reliable         - True if confidence is above 0.6
        """
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)
            probs   = torch.softmax(outputs, dim=1)[0]

        top3 = torch.topk(probs, min(3, len(self.idx_to_class)))

        top3_results = [
            {
                "issue_type": self.idx_to_class[idx.item()],
                "confidence": round(prob.item(), 3),
            }
            for prob, idx in zip(top3.values, top3.indices)
        ]

        top = top3_results[0]

        return {
            "issue_type":       top["issue_type"] if top["confidence"] > 0.3 else "Other",
            "confidence":       top["confidence"],
            "top3_predictions": top3_results,
            "reliable":         top["confidence"] > 0.6,
        }


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":
    clf = CivicImageClassifier()

    test_image_path = "data/dataset/Road_Damage/Road_Damage_00001.jpg"
    if os.path.exists(test_image_path):
        result = clf.classify_from_path(test_image_path)
        print(f"\nTest image: {test_image_path}")
        print(f"Issue type : {result['issue_type']}")
        print(f"Confidence : {result['confidence']}")
        print(f"Reliable   : {result['reliable']}")
        print(f"Top 3      : {result['top3_predictions']}")
    else:
        print("No test image found. Train the model first.")
