import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Mock database of regional reports
REGIONAL_DATA = {
    "lucknow": {
        "soil_health_scores": [72.0, 78.0, 68.0, 82.0],
        "ph_values": [6.2, 6.5, 6.0, 6.7],
        "recommended_crops": ["rice", "wheat", "rice", "maize"],
        "active_alerts": ["Yellow Rust Warning"],
        "projected_yields": [12.0, 15.0, 10.0, 14.5]
    },
    "pune": {
        "soil_health_scores": [85.0, 88.0, 81.0, 89.0],
        "ph_values": [6.8, 7.0, 6.5, 7.2],
        "recommended_crops": ["sugarcane", "cotton", "soybean", "sugarcane"],
        "active_alerts": [],
        "projected_yields": [45.0, 38.0, 28.0, 42.0]
    },
    "kolhapur": {
        "soil_health_scores": [60.0, 58.0, 65.0, 62.0],
        "ph_values": [5.5, 5.8, 5.7, 5.9],
        "recommended_crops": ["rice", "rice", "sugarcane", "rice"],
        "active_alerts": ["Flood Alert - High Water Levels"],
        "projected_yields": [8.0, 9.5, 30.0, 7.8]
    }
}

class DashboardAggregator:
    def __init__(self):
        pass

    def aggregate_district_metrics(self, district: str) -> Dict[str, Any]:
        dist_lower = district.lower().strip()
        data = REGIONAL_DATA.get(dist_lower)
        
        if not data:
            logger.info(f"No regional data found for district: {district}. Returning default mock aggregation.")
            return {
                "district": district,
                "avg_soil_health_score": 70.0,
                "avg_soil_ph": 6.5,
                "top_recommended_crop": "wheat",
                "active_alerts_count": 0,
                "active_alerts": [],
                "total_projected_yield_tonnes": 50.0
            }

        avg_health = sum(data["soil_health_scores"]) / len(data["soil_health_scores"])
        avg_ph = sum(data["ph_values"]) / len(data["ph_values"])
        total_yield = sum(data["projected_yields"])

        # Determine top recommended crop
        crop_counts = {}
        for crop in data["recommended_crops"]:
            crop_counts[crop] = crop_counts.get(crop, 0) + 1
        top_crop = max(crop_counts, key=crop_counts.get)

        return {
            "district": district,
            "avg_soil_health_score": round(avg_health, 2),
            "avg_soil_ph": round(avg_ph, 2),
            "top_recommended_crop": top_crop,
            "active_alerts_count": len(data["active_alerts"]),
            "active_alerts": data["active_alerts"],
            "total_projected_yield_tonnes": round(total_yield, 2)
        }
