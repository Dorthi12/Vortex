import unittest
from ...api_contracts.risk_score import RiskRequest
from ..scoring.calculator import RiskCalculator

class TestRiskCalculator(unittest.TestCase):
    def setUp(self):
        self.calculator = RiskCalculator()

    def test_low_risk_calculation(self):
        request = RiskRequest(
            district="Pune",
            crop="Wheat",
            weather_risk_score=10.0,
            pest_risk_score=15.0,
            disease_risk_score=10.0,
            market_risk_score=20.0,
            yield_risk_score=15.0
        )
        response = self.calculator.calculate_risk(request)
        # Expected composite: 10*0.3 + 15*0.15 + 10*0.15 + 20*0.2 + 15*0.2 = 3 + 2.25 + 1.5 + 4 + 3 = 13.75
        self.assertAlmostEqual(response.composite_risk_score, 13.75)
        self.assertEqual(response.risk_category, "Low")
        self.assertIn("Maintain standard agronomic practices", response.mitigation_strategies[0])

    def test_critical_risk_with_mitigations(self):
        request = RiskRequest(
            district="Nagpur",
            crop="Cotton",
            weather_risk_score=95.0,
            pest_risk_score=95.0,
            disease_risk_score=40.0,
            market_risk_score=90.0,
            yield_risk_score=95.0
        )
        response = self.calculator.calculate_risk(request)
        # Expected category should be Critical
        self.assertEqual(response.risk_category, "Critical")
        
        # Verify weather mitigation strategy is present since weather risk >= 60
        self.assertTrue(any("crop insurance" in strategy for strategy in response.mitigation_strategies))
        # Verify pest mitigation is present
        self.assertTrue(any("pheromone traps" in strategy for strategy in response.mitigation_strategies))
        # Verify market mitigation is present
        self.assertTrue(any("cold storage" in strategy for strategy in response.mitigation_strategies))
        # Verify yield mitigation is present
        self.assertTrue(any("soil analysis" in strategy for strategy in response.mitigation_strategies))
        
        # Disease is 40.0, so no disease mitigation should be present
        self.assertFalse(any("fungicides" in strategy for strategy in response.mitigation_strategies))
