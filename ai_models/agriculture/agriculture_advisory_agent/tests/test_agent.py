import unittest
from ...api_contracts.advisory_agent import AdvisoryRequest
from ..planner.executor import AdvisoryExecutor

class TestAdvisoryExecutor(unittest.TestCase):
    def setUp(self):
        self.executor = AdvisoryExecutor()

    def test_generate_advisory_success(self):
        request = AdvisoryRequest(
            district="Kolhapur",
            crop="Rice",
            soil_ph=6.2,
            nitrogen=40.0,
            phosphorus=30.0,
            potassium=35.0
        )
        response = self.executor.generate_advisory(request)
        
        self.assertTrue(response.advisory_id.startswith("ADV-"))
        self.assertIn("Soil Health Score", response.soil_analysis)
        self.assertIn("Urea", response.recommended_fertilizers)
        self.assertIn("DAP", response.recommended_fertilizers)
        self.assertIn("MOP", response.recommended_fertilizers)
        self.assertTrue(len(response.subsidies_applicable) > 0)
        self.assertIn("Kolhapur Mandi", response.market_price_outlook)
        self.assertIn(response.overall_risk_rating, ["Low", "Medium", "High", "Critical"])
        self.assertIn("Advisory for Rice in Kolhapur", response.advisory_summary)
