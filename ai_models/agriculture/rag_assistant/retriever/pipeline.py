import time
import logging
from typing import Dict, Any, List

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.rag import RagQueryRequest, RagQueryResponse

logger = logging.getLogger(__name__)

# Mock database representing vector store document indexes
MOCK_DOCUMENTS = [
    {
        "id": "DOC-001",
        "title": "PM-KISAN Scheme Guidelines",
        "text": "The PM-KISAN scheme provides direct income support of INR 6,000 per year to eligible land-owning farmer families, distributed in three equal installments of INR 2,000. Land holdings must be verified and registered.",
        "keywords": ["pm-kisan", "pm kisan", "income", "subsidy", "money", "6000", "financial"]
    },
    {
        "id": "DOC-002",
        "title": "Wheat Leaf Rust Mitigation",
        "text": "Wheat Leaf Rust (caused by Puccinia triticina) can be managed by spraying chemical fungicides such as Propiconazole (Tilt 25 EC) at 0.1% concentration, or by cultivating resistant crop varieties like HD 2967 or HD 3086.",
        "keywords": ["rust", "leaf rust", "wheat", "fungus", "fungicide", "propiconazole", "disease"]
    },
    {
        "id": "DOC-003",
        "title": "Drip Irrigation and Water Conservation",
        "text": "Micro-drip irrigation helps conserve up to 40-50% of water compared to traditional flood irrigation. Under the Per Drop More Crop scheme, small and marginal farmers can claim up to a 55% subsidy on installation costs.",
        "keywords": ["drip", "irrigation", "water", "sprinkler", "per drop", "micro-irrigation"]
    },
    {
        "id": "DOC-004",
        "title": "Organic Composting and Soil Rejuvenation",
        "text": "Preparing organic compost using farm yard manure (FYM), dry leaves, and green waste improves soil organic carbon levels. Mixing nitrogen-fixing biofertilizers like Azotobacter increases crop nutrient uptake.",
        "keywords": ["compost", "organic", "manure", "vermicompost", "fym", "soil health", "fertilizer"]
    }
]

class RagPipeline:
    def __init__(self):
        pass

    def query(self, request: RagQueryRequest) -> RagQueryResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("rag_assistant")

        try:
            query_lower = request.query.lower()
            matched_docs = []
            
            # Simple keyword-matching to simulate vector search
            for doc in MOCK_DOCUMENTS:
                for kw in doc["keywords"]:
                    if kw in query_lower:
                        matched_docs.append(doc)
                        break

            # Synthesize answer
            if matched_docs:
                # Build answer using matched document text
                citations = []
                answer_parts = []
                for idx, doc in enumerate(matched_docs):
                    answer_parts.append(f"[Source {idx+1}: {doc['title']}] - {doc['text']}")
                    citations.append({
                        "document_id": doc["id"],
                        "title": doc["title"],
                        "relevance_score": 0.95 - (idx * 0.1)  # Simulated search score
                    })
                
                main_answer = "Based on our agricultural database:\n" + "\n\n".join(answer_parts)
            else:
                # Default fallback response if no keywords match
                main_answer = (
                    "I searched the knowledge base but couldn't find a direct document matching your query. "
                    "Please ensure you are asking about PM-KISAN, crop diseases (like leaf rust), irrigation, or organic fertilizers."
                )
                citations = []

            response = RagQueryResponse(
                answer=main_answer,
                citations=citations
            )

            # Track latency
            duration = time.time() - start_time
            metrics_tracker.track_latency("rag_assistant", duration)

            # Publish event to Kafka (using notifications topic for user queries)
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="notifications",
                    event_type="rag_query_processed",
                    payload={
                        "query": request.query,
                        "vector_database": request.vector_database,
                        "citations_count": len(citations)
                    }
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("rag_assistant")
            logger.error(f"RAG query processing failed: {e}")
            raise e
