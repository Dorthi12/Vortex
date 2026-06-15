import unittest
from ...api_contracts.subsidy import SubsidyRequest
from ..engine.recommender import SubsidyRecommender

class TestSubsidyRecommender(unittest.TestCase):
    def setUp(self):
        self.recommender = SubsidyRecommender()

    def test_national_and_state_eligibility_telangana(self):
        # Small farmer in Telangana, 1.5 hectares, growing rice
        request = SubsidyRequest(
            state="Telangana",
            farmer_category="Small",
            land_size_hectares=1.5,
            crop_type="rice"
        )
        response = self.recommender.evaluate(request)
        
        # Should qualify for: PM-KISAN, PMKSY, NFSM (rice is eligible), and Rythu Bandhu
        scheme_names = [s["scheme_name"] for s in response.eligible_schemes]
        self.assertTrue(any("PM-KISAN" in name for name in scheme_names))
        self.assertTrue(any("PMKSY" in name for name in scheme_names))
        self.assertTrue(any("NFSM" in name for name in scheme_names))
        self.assertTrue(any("Rythu Bandhu" in name for name in scheme_names))
        
        # Odisha scheme KALIA should not be present
        self.assertFalse(any("KALIA" in name for name in scheme_names))
        
        self.assertTrue(response.total_benefits_value_inr > 0.0)
        self.assertTrue(len(response.required_documents) > 0)

    def test_land_size_limit_pm_kisan(self):
        # Marginal farmer but with large land size (should not qualify for PM-KISAN or KALIA)
        request = SubsidyRequest(
            state="Odisha",
            farmer_category="Marginal",
            land_size_hectares=4.5,
            crop_type="cotton"
        )
        response = self.recommender.evaluate(request)
        scheme_names = [s["scheme_name"] for s in response.eligible_schemes]
        
        # Max land for PM-KISAN is 2.0, so this should not qualify
        self.assertFalse(any("PM-KISAN" in name for name in scheme_names))

    def test_state_specific_odisha(self):
        request = SubsidyRequest(
            state="Odisha",
            farmer_category="Marginal",
            land_size_hectares=1.0,
            crop_type="pulses"
        )
        response = self.recommender.evaluate(request)
        scheme_names = [s["scheme_name"] for s in response.eligible_schemes]
        self.assertTrue(any("KALIA" in name for name in scheme_names))
        self.assertFalse(any("Rythu Bandhu" in name for name in scheme_names))
