import unittest
from ...api_contracts.farmer_agent import FarmerAgentRequest
from ..translation.orchestrator import MultilingualOrchestrator

class TestMultilingualOrchestrator(unittest.TestCase):
    def setUp(self):
        self.orchestrator = MultilingualOrchestrator()

    def test_process_text_english(self):
        request = FarmerAgentRequest(
            text_input="What is the cure for leaf rust in wheat?",
            input_language="English",
            output_channel="text"
        )
        response = self.orchestrator.process(request)
        self.assertEqual(response.resolved_language, "English")
        self.assertIn("Wheat Leaf Rust Mitigation", response.agent_text_response)
        self.assertEqual(response.audio_response_base64, None)

    def test_process_audio_hindi(self):
        request = FarmerAgentRequest(
            audio_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            input_language="Hindi",
            output_channel="audio"
        )
        response = self.orchestrator.process(request)
        self.assertEqual(response.resolved_language, "Hindi")
        self.assertEqual(response.translated_query, "How to treat leaf rust in wheat?")
        # Should contain the Hindi response prefix
        self.assertIn("(हिंदी में अनुवादित)", response.agent_text_response)
        # Should have generated audio base64 response
        self.assertIsNotNone(response.audio_response_base64)
