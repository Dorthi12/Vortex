import unittest
from ..aggregations.aggregator import DashboardAggregator
from ..forecasting.demand_forecast import DemandForecaster
from ..reports.generator import DashboardReportGenerator

class TestDashboardIntelligence(unittest.TestCase):
    def setUp(self):
        self.aggregator = DashboardAggregator()
        self.forecaster = DemandForecaster()
        self.generator = DashboardReportGenerator()

    def test_aggregations_known_district_pune(self):
        metrics = self.aggregator.aggregate_district_metrics("Pune")
        self.assertEqual(metrics["district"], "Pune")
        self.assertEqual(metrics["top_recommended_crop"], "sugarcane")
        self.assertEqual(metrics["active_alerts_count"], 0)
        self.assertTrue(metrics["avg_soil_health_score"] > 80.0)

    def test_aggregations_fallback_unknown(self):
        metrics = self.aggregator.aggregate_district_metrics("Shimla")
        self.assertEqual(metrics["district"], "Shimla")
        self.assertEqual(metrics["top_recommended_crop"], "wheat")
        self.assertEqual(metrics["active_alerts_count"], 0)

    def test_demand_forecast_lucknow(self):
        forecast = self.forecaster.forecast_fertilizer_demand("Lucknow", 1000.0)
        self.assertEqual(forecast["district"], "Lucknow")
        self.assertEqual(forecast["cultivated_acres_evaluated"], 1000.0)
        # Lucknow Urea factor is 120 kg/acre, so 1000 acres = 120,000 kg = 120 tonnes
        self.assertEqual(forecast["projected_demand_tonnes"]["Urea"], 120.0)

    def test_report_generator_kolhapur(self):
        report = self.generator.generate_district_report("Kolhapur", 5000.0)
        self.assertTrue(report["report_id"].startswith("REP-AGR-KOLHAPUR-"))
        self.assertEqual(report["district"], "Kolhapur")
        self.assertTrue(len(report["executive_recommendations"]) > 0)
        # Kolhapur has a active flood alert, check if alert recommendation is added
        self.assertTrue(any("Flood Alert" in rec for rec in report["executive_recommendations"]))
