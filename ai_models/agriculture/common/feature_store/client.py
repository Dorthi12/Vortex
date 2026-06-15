import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class FeatureStoreClient:
    """Mock feature store client to fetch real-time crop/soil/weather metrics."""
    
    def get_district_features(self, district: str) -> Dict[str, Any]:
        logger.info(f"Fetching historical feature store metrics for '{district}'...")
        return {
            "soil_ph": 6.5,
            "organic_matter": 2.4,
            "historical_rainfall_mean": 1150.0,
            "nitrogen_avg": 120.0,
            "phosphorus_avg": 45.0,
            "potassium_avg": 180.0
        }

feature_store = FeatureStoreClient()
