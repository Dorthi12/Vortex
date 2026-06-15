import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.crop_yield import CropYieldRequest
from ..inference.predictor import CropYieldPredictionPredictor

class TestCropYieldPredictionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = CropYieldPredictionPredictor()
        
        # Build request payload
        request = CropYieldRequest(**{'crop': 'rice', 'district': 'Lucknow', 'area_hectares': 12.5, 'fertilizer_usage_kg': 1500.0, 'rainfall_seasonal_mm': 1200.0})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "predicted_yield_tonnes"))
