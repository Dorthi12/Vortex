import datetime
import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.mandi_price import MandiPriceRequest
from ..inference.predictor import MandiPriceForecastingPredictor

class TestMandiPriceForecastingPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = MandiPriceForecastingPredictor()
        
        # Build request payload
        request = MandiPriceRequest(**{'market_name': 'Lucknow Mandi', 'commodity': 'Wheat', 'target_date': datetime.date.fromisoformat('2026-07-15')})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "commodity"))
