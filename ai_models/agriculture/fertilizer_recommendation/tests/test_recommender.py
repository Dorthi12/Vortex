import unittest
from ...api_contracts.fertilizer import FertilizerRecommendRequest
from ..engine.recommender import FertilizerRecommender

class TestFertilizerRecommender(unittest.TestCase):
    def setUp(self):
        self.recommender = FertilizerRecommender()

    def test_recommend_success_rice(self):
        request = FertilizerRecommendRequest(
            crop="rice",
            soil_type="Clayey",
            nitrogen=20.0,
            phosphorus=15.0,
            potassium=10.0
        )
        response = self.recommender.recommend(request)
        self.assertEqual(response.crop, "rice")
        self.assertEqual(response.soil_type, "Clayey")
        self.assertIn("Urea", response.fertilizers)
        self.assertIn("DAP", response.fertilizers)
        self.assertIn("MOP", response.fertilizers)
        self.assertTrue(len(response.organic_alternatives) > 0)
        self.assertTrue(len(response.application_schedule) > 0)

    def test_recommend_fallback_default(self):
        request = FertilizerRecommendRequest(
            crop="dragon_fruit",
            soil_type="Sandy",
            nitrogen=10.0,
            phosphorus=10.0,
            potassium=10.0
        )
        response = self.recommender.recommend(request)
        self.assertEqual(response.crop, "dragon_fruit")
        # Should fall back to default rules and give some recommendations
        self.assertTrue(response.fertilizers["Urea"] >= 0.0)

    def test_recommend_zero_deficit(self):
        # Setting NPK values extremely high so there's no deficit
        request = FertilizerRecommendRequest(
            crop="rice",
            soil_type="Loamy",
            nitrogen=200.0,
            phosphorus=100.0,
            potassium=100.0
        )
        response = self.recommender.recommend(request)
        self.assertEqual(response.fertilizers["Urea"], 0.0)
        self.assertEqual(response.fertilizers["DAP"], 0.0)
        self.assertEqual(response.fertilizers["MOP"], 0.0)
