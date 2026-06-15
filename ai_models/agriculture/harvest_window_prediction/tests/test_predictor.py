import datetime
import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.harvest_window import HarvestWindowRequest
from ..inference.predictor import HarvestWindowPredictionPredictor

class TestHarvestWindowPredictionPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = HarvestWindowPredictionPredictor()
        
        # Build request payload
        request = HarvestWindowRequest(**{'crop': 'rice', 'planting_date': datetime.date.fromisoformat('2026-06-15'), 'district': 'Lucknow', 'gdd_accumulated': 1200.0})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "optimal_start_date"))
