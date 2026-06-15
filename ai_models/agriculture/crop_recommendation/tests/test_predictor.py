import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.crop_recommendation import CropRecommendRequest
from ..inference.predictor import CropRecommendationPredictor

class TestCropRecommendationPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = CropRecommendationPredictor()
        
        # Build request payload
        request = CropRecommendRequest(**{'nitrogen': 90.0, 'phosphorus': 42.0, 'potassium': 43.0, 'temperature': 20.87, 'humidity': 82.0, 'ph': 6.5, 'rainfall': 202.93})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "recommended_crop"))
