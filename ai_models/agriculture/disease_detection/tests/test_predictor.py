import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.disease_detection import DiseaseRequest
from ..inference.predictor import DiseaseDetectionPredictor

class TestDiseaseDetectionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = DiseaseDetectionPredictor()
        
        # Build request payload with a minimal 1x1 white pixel base64 image
        request = DiseaseRequest(**{'image_base64': 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'crop': 'wheat'})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "confidence"))
