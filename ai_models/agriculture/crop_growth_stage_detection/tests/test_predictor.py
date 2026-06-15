import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.growth_stage import GrowthStageRequest
from ..inference.predictor import CropGrowthStageDetectionPredictor

class TestCropGrowthStageDetectionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = CropGrowthStageDetectionPredictor()
        
        # Build request payload with a minimal 1x1 white pixel base64 image
        request = GrowthStageRequest(**{'image_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'crop': 'rice'})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "confidence"))
