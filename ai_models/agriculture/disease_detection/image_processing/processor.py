import base64
import io
from PIL import Image
import numpy as np

class ImageProcessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    def decode_base64(self, image_base64: str) -> Image.Image:
        """Decodes base64 string to a PIL Image."""
        if "," in image_base64:
            # strip header like "data:image/jpeg;base64,"
            image_base64 = image_base64.split(",")[1]
        img_bytes = base64.b64decode(image_base64)
        return Image.open(io.BytesIO(img_bytes)).convert("RGB")

    def preprocess(self, image_base64: str) -> np.ndarray:
        """Decodes, resizes, and normalizes base64 image string to numpy array (C, H, W)."""
        image = self.decode_base64(image_base64)
        image = image.resize(self.target_size)
        
        # Convert to numpy array and scale to [0, 1]
        img_arr = np.array(image, dtype=np.float32) / 255.0
        
        # Normalize
        img_arr = (img_arr - self.mean) / self.std
        
        # Reorder dimensions from (H, W, C) to (C, H, W) for PyTorch
        img_arr = np.transpose(img_arr, (2, 0, 1))
        
        # Add batch dimension (1, C, H, W)
        return np.expand_dims(img_arr, axis=0)
