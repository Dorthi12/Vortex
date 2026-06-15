import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.irrigation import IrrigationRequest
from ..inference.predictor import IrrigationForecastingPredictor

class TestIrrigationForecastingPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = IrrigationForecastingPredictor()
        
        # Build request payload
        request = IrrigationRequest(**{'crop': 'rice', 'soil_moisture_percent': 35.0, 'evapotranspiration_mm': 4.5, 'days_since_last_water': 3})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "irrigation_required"))
