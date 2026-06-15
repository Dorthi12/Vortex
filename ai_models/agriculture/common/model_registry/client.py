import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class ModelRegistryClient:
    """Manages model loading metadata and versions."""
    
    def get_model_metadata(self, module_path: str) -> Dict[str, Any]:
        metadata_file = os.path.join(module_path, "metadata", "metadata.json")
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading model metadata: {e}")
        return {"model_name": "unknown", "version": "0.0.0"}

registry_client = ModelRegistryClient()
