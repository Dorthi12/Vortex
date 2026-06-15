import time
import logging
from typing import Dict, Any

from ..aggregations.aggregator import DashboardAggregator
from ..forecasting.demand_forecast import DemandForecaster

logger = logging.getLogger(__name__)

class DashboardReportGenerator:
    def __init__(self):
        self.aggregator = DashboardAggregator()
        self.forecaster = DemandForecaster()

    def generate_district_report(self, district: str, total_acres: float = 10000.0) -> Dict[str, Any]:
        """
        Generate a complete executive governance report for a district.
        """
        metrics = self.aggregator.aggregate_district_metrics(district)
        forecasts = self.forecaster.forecast_fertilizer_demand(district, total_acres)
        
        # Formulate general advisory recommendations
        recommendations = []
        if metrics["avg_soil_health_score"] < 70.0:
            recommendations.append("Initiate a regional organic composting and soil rejuvenation drive.")
        if metrics["active_alerts_count"] > 0:
            recommendations.append(f"Deploy resources to mitigate active alerts: {', '.join(metrics['active_alerts'])}")
        
        recommendations.append(
            f"Pre-position approximately {forecasts['projected_demand_tonnes']['Urea']} tonnes of Urea "
            f"and {forecasts['projected_demand_tonnes']['DAP']} tonnes of DAP in regional warehouses "
            f"to support {metrics['top_recommended_crop']} sowing requirements."
        )

        return {
            "report_id": f"REP-AGR-{district.upper()}-{int(time.time())}",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "district": district,
            "regional_metrics": metrics,
            "fertilizer_demand_forecast": forecasts,
            "executive_recommendations": recommendations
        }
