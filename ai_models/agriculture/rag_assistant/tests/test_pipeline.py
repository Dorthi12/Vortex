import unittest
from ...api_contracts.rag import RagQueryRequest
from ..retriever.pipeline import RagPipeline

class TestRagPipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = RagPipeline()

    def test_query_match_disease(self):
        request = RagQueryRequest(
            query="What is the cure for leaf rust in my wheat crop?",
            vector_database="Qdrant"
        )
        response = self.pipeline.query(request)
        self.assertIn("Wheat Leaf Rust", response.answer)
        self.assertTrue(len(response.citations) > 0)
        self.assertEqual(response.citations[0]["document_id"], "DOC-002")

    def test_query_match_pm_kisan(self):
        request = RagQueryRequest(
            query="Am I eligible for PM-Kisan financial support?",
            vector_database="FAISS"
        )
        response = self.pipeline.query(request)
        self.assertIn("PM-KISAN", response.answer)
        self.assertTrue(len(response.citations) > 0)
        self.assertEqual(response.citations[0]["document_id"], "DOC-001")

    def test_query_no_match_fallback(self):
        request = RagQueryRequest(
            query="How to repair a John Deere tractor engine?",
            vector_database="Qdrant"
        )
        response = self.pipeline.query(request)
        self.assertIn("I searched the knowledge base but couldn't find", response.answer)
        self.assertEqual(len(response.citations), 0)
