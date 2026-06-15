import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.soil_health import SoilHealthRequest
from ..inference.predictor import SoilHealthScoringPredictor

class TestSoilHealthScoringPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = SoilHealthScoringPredictor()
        
        # Build request payload
        request = SoilHealthRequest(**{'ph': 6.5, 'organic_matter_percent': 2.4, 'nitrogen': 120.0, 'phosphorus': 45.0, 'potassium': 180.0, 'bulk_density': 1.3})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "health_score"))
