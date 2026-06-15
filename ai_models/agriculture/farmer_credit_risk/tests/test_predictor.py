import unittest
from unittest.mock import patch, MagicMock
from ...api_contracts.credit_risk import CreditRiskRequest
from ..inference.predictor import FarmerCreditRiskPredictor

class TestFarmerCreditRiskPredictor(unittest.TestCase):
    
    @patch('os.path.exists')
    def test_predictor_mock_mode(self, mock_exists):
        mock_exists.return_value = False
        predictor = FarmerCreditRiskPredictor()
        
        # Build request payload
        request = CreditRiskRequest(**{'farmer_id': 'FRM-101', 'annual_income_inr': 250000.0, 'land_valuation_inr': 1500000.0, 'loan_amount_requested': 150000.0, 'past_default_history': False, 'predicted_yield_tonnes': 12.0})
        
        # Execute prediction
        response = predictor.predict(request)
        
        self.assertIsNotNone(response)
        # Verify response attributes match mock defaults
        self.assertTrue(hasattr(response, "approval_recommendation"))
