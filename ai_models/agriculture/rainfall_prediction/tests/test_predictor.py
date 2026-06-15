import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.rainfall import RainfallRequest
from ..inference.predictor import RainfallPredictionPredictor

class TestRainfallPredictionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = RainfallPredictionPredictor()
        
        # Build request payload
        request = RainfallRequest(**{'district': 'Lucknow', 'month': 7, 'elevation_m': 123.0, 'humidity': 78.0})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "predicted_rainfall_mm"))
