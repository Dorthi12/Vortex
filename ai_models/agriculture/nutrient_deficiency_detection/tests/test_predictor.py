import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.nutrient_deficiency import NutrientDeficiencyRequest
from ..inference.predictor import NutrientDeficiencyDetectionPredictor

class TestNutrientDeficiencyDetectionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = NutrientDeficiencyDetectionPredictor()
        
        # Build request payload with a minimal 1x1 white pixel base64 image
        request = NutrientDeficiencyRequest(**{'image_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "confidence"))
