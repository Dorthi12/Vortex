import time
import logging
from typing import Dict, Any, Optional

from ...common.monitoring.metrics import metrics_tracker
from ...common.kafka.producer import ag_producer
from ...api_contracts.farmer_agent import FarmerAgentRequest, FarmerAgentResponse
from ...rag_assistant.retriever.pipeline import RagPipeline

logger = logging.getLogger(__name__)

# Mock dictionaries for bidirectional translation
LANG_QUERIES = {
    "Hindi": {
        "audio_default": "गेहूं में पत्ती के रस्ट का इलाज कैसे करें?",
        "text_map": {
            "गेहूं में पत्ती के रस्ट का इलाज कैसे करें?": "How to treat leaf rust in wheat?",
            "pm-kisan योजना के लिए पात्रता क्या है?": "What is the eligibility for PM-Kisan scheme?"
        },
        "response_prefix": "(हिंदी में अनुवादित): "
    },
    "Tamil": {
        "audio_default": "கோதுமையில் இலை துரு நோயை எவ்வாறு குணப்படுத்துவது?",
        "text_map": {
            "கோதுமையில் இலை துரு நோயை எவ்வாறு குணப்படுத்துவது?": "How to treat leaf rust in wheat?"
        },
        "response_prefix": "(தமிழில் மொழிபெயர்க்கப்பட்டது): "
    },
    "Telugu": {
        "audio_default": "గోధుమలలో ఆకు తెగులు నివారణ ఎలా?",
        "text_map": {
            "గోధుమలలో ఆకు తెగులు నివారణ ఎలా?": "How to treat leaf rust in wheat?"
        },
        "response_prefix": "(తెలుగులో అనువదించబడింది): "
    },
    "Marathi": {
        "audio_default": "गव्हावरील तांबेरा रोगाचे निवारण कसे करावे?",
        "text_map": {
            "गव्हावरील तांबेरा रोगाचे निवारण कसे करावे?": "How to treat leaf rust in wheat?"
        },
        "response_prefix": "(मराठीत भाषांतरित): "
    },
    "Bengali": {
        "audio_default": "গমের পাতার মরিচা রোগ কীভাবে দূর করবেন?",
        "text_map": {
            "গমের পাতার মরিচা রোগ কীভাবে দূর করবেন?": "How to treat leaf rust in wheat?"
        },
        "response_prefix": "(বাংলায় অনূদিত): "
    },
    "English": {
        "audio_default": "How to treat leaf rust in wheat?",
        "text_map": {},
        "response_prefix": ""
    }
}

class MultilingualOrchestrator:
    def __init__(self):
        self.rag_pipeline = RagPipeline()

    def process(self, request: FarmerAgentRequest) -> FarmerAgentResponse:
        start_time = time.time()
        metrics_tracker.track_prediction("multilingual_farmer_agent")

        try:
            input_lang = request.input_language
            if input_lang not in LANG_QUERIES:
                logger.warning(f"Unsupported language: {input_lang}. Defaulting to English.")
                input_lang = "English"

            # 1. Simulate Speech-to-Text (STT) if audio is provided
            query_text = ""
            if request.audio_base64:
                # Mock audio transcription
                query_text = LANG_QUERIES[input_lang]["audio_default"]
                logger.info(f"Transcribed audio to source language text: {query_text}")
            elif request.text_input:
                query_text = request.text_input
            else:
                query_text = "How to treat leaf rust in wheat?"

            # 2. Translate to English
            english_query = query_text
            if input_lang != "English":
                text_map = LANG_QUERIES[input_lang]["text_map"]
                english_query = text_map.get(query_text, "How to treat leaf rust in wheat?")
                logger.info(f"Translated query '{query_text}' to English: '{english_query}'")

            # 3. Query RAG Assistant (in English)
            from ...api_contracts.rag import RagQueryRequest
            rag_req = RagQueryRequest(query=english_query, vector_database="Qdrant")
            rag_resp = self.rag_pipeline.query(rag_req)
            english_answer = rag_resp.answer

            # 4. Translate back to farmer's language
            prefix = LANG_QUERIES[input_lang]["response_prefix"]
            final_text_response = f"{prefix}{english_answer}"

            # 5. Simulate Text-to-Speech (TTS) if requested
            audio_response = None
            if request.output_channel == "audio":
                audio_response = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

            response = FarmerAgentResponse(
                translated_query=english_query,
                agent_text_response=final_text_response,
                audio_response_base64=audio_response,
                resolved_language=input_lang
            )

            # Track latency
            duration = time.time() - start_time
            metrics_tracker.track_latency("multilingual_farmer_agent", duration)

            # Publish event to Kafka
            if ag_producer:
                ag_producer.publish_ag_event(
                    topic="notifications",
                    event_type="farmer_query_orchestrated",
                    payload={
                        "language": input_lang,
                        "english_query": english_query,
                        "output_channel": request.output_channel
                    }
                )

            return response

        except Exception as e:
            metrics_tracker.track_failure("multilingual_farmer_agent")
            logger.error(f"Multilingual farmer agent processing failed: {e}")
            raise e
