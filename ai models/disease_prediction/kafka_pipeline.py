"""
Kafka Event Pipeline — Real-time Data Flow
Implements the full event-driven pipeline:
  Citizen post → NLP detection → Disease prediction → District case update
  → Outbreak prediction → Hotspot detection → Risk scoring → Gov recommendation

Uses kafka-python library. Falls back to Redis Streams if Kafka unavailable.
"""

import json
import logging
import asyncio
import threading
from datetime import datetime
from typing import Callable, Optional
from dataclasses import asdict
from pathlib import Path

import sys
sys.path.append(str(Path(__file__).parent.parent))
from disease_prediction.config.settings import KAFKA_BOOTSTRAP, KAFKA_TOPICS, REDIS_URL

logger = logging.getLogger(__name__)


# ─── MESSAGE SCHEMAS ──────────────────────────────────────────────────────────
def make_message(event_type: str, payload: dict) -> dict:
    return {
        "event_type": event_type,
        "payload": payload,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0"
    }


# ─── KAFKA PRODUCER ───────────────────────────────────────────────────────────
class DiseaseEventProducer:
    """
    Publishes events to Kafka topics.
    Falls back to an in-memory queue if Kafka is unavailable.
    """

    def __init__(self):
        self._producer = None
        self._queue = {}  # in-memory fallback
        self._connect()

    def _connect(self):
        try:
            from kafka import KafkaProducer
            self._producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                acks="all",
                retries=3,
                max_block_ms=5000,
            )
            logger.info(f"Kafka producer connected to {KAFKA_BOOTSTRAP}")
        except Exception as e:
            logger.warning(f"Kafka unavailable ({e}). Using in-memory queue.")
            self._producer = None

    def publish(self, topic: str, key: str, message: dict) -> bool:
        """Publish a message to a topic"""
        if self._producer:
            try:
                self._producer.send(topic, key=key, value=message)
                self._producer.flush(timeout=5)
                logger.debug(f"Published to {topic}: {key}")
                return True
            except Exception as e:
                logger.error(f"Kafka publish failed: {e}")

        # In-memory fallback
        if topic not in self._queue:
            self._queue[topic] = []
        self._queue[topic].append({"key": key, "message": message, "time": datetime.now()})
        return True

    def get_queued_messages(self, topic: str) -> list:
        """Get messages from in-memory queue (fallback mode)"""
        return self._queue.get(topic, [])

    # ─── TOPIC-SPECIFIC PUBLISHERS ────────────────────────────────────────────
    def publish_citizen_post(self, district: str, symptoms: str, image_provided: bool = False):
        topic = KAFKA_TOPICS["citizen_posts"]
        msg = make_message("citizen_symptom_post", {
            "district": district,
            "symptoms": symptoms,
            "image_provided": image_provided,
        })
        self.publish(topic, key=district, message=msg)

    def publish_disease_prediction(self, district: str, disease: str, confidence: float, source: str):
        topic = KAFKA_TOPICS["disease_predictions"]
        msg = make_message("disease_predicted", {
            "district": district,
            "disease": disease,
            "confidence": confidence,
            "prediction_source": source,
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_case_aggregation(self, district: str, disease: str, cases_today: int, cases_7day: int, trend: str):
        topic = KAFKA_TOPICS["case_aggregations"]
        msg = make_message("cases_aggregated", {
            "district": district,
            "disease": disease,
            "cases_today": cases_today,
            "cases_7day": cases_7day,
            "trend": trend,
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_outbreak_alert(self, district: str, disease: str, probability: float, predicted_cases: int):
        topic = KAFKA_TOPICS["outbreak_alerts"]
        msg = make_message("outbreak_predicted", {
            "district": district,
            "disease": disease,
            "outbreak_probability": probability,
            "predicted_cases_next_week": predicted_cases,
            "alert_level": "HIGH" if probability > 0.7 else "MEDIUM",
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_hotspot(self, district: str, disease: str, clusters: list):
        topic = KAFKA_TOPICS["hotspot_detections"]
        msg = make_message("hotspot_detected", {
            "district": district,
            "disease": disease,
            "cluster_count": len(clusters),
            "hotspot_districts": [c.get("districts", []) for c in clusters],
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_hospital_demand(self, district: str, disease: str, shortage: int, risk: str):
        topic = KAFKA_TOPICS["hospital_demand"]
        msg = make_message("hospital_demand_forecast", {
            "district": district,
            "disease": disease,
            "bed_shortage": shortage,
            "risk_category": risk,
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_government_action(self, district: str, disease: str, risk_level: str, actions: list):
        topic = KAFKA_TOPICS["government_actions"]
        msg = make_message("government_action_required", {
            "district": district,
            "disease": disease,
            "risk_level": risk_level,
            "immediate_actions": actions,
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)

    def publish_citizen_advisory(self, district: str, disease: str, sms_text: str):
        topic = KAFKA_TOPICS["citizen_advisories"]
        msg = make_message("citizen_advisory", {
            "district": district,
            "disease": disease,
            "sms_text": sms_text,
        })
        self.publish(topic, key=f"{district}:{disease}", message=msg)


# ─── KAFKA CONSUMER ───────────────────────────────────────────────────────────
class DiseaseEventConsumer:
    """
    Consumes events from Kafka topics and triggers downstream processing.
    """

    def __init__(self, topics: list, group_id: str = "disease_intel_group"):
        self._consumer = None
        self._running = False
        self._handlers: dict[str, list[Callable]] = {}
        self._connect(topics, group_id)

    def _connect(self, topics: list, group_id: str):
        try:
            from kafka import KafkaConsumer
            self._consumer = KafkaConsumer(
                *topics,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id=group_id,
                value_deserializer=lambda x: json.loads(x.decode("utf-8")),
                auto_offset_reset="latest",
                enable_auto_commit=True,
            )
            logger.info(f"Kafka consumer connected, subscribed to: {topics}")
        except Exception as e:
            logger.warning(f"Kafka consumer unavailable: {e}")

    def register_handler(self, event_type: str, handler: Callable):
        """Register a handler function for an event type"""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def start(self):
        """Start consuming in background thread"""
        if self._consumer is None:
            logger.warning("No Kafka consumer — background processing disabled")
            return

        self._running = True
        thread = threading.Thread(target=self._consume_loop, daemon=True)
        thread.start()
        logger.info("Kafka consumer started in background")

    def stop(self):
        self._running = False
        if self._consumer:
            self._consumer.close()

    def _consume_loop(self):
        while self._running:
            try:
                records = self._consumer.poll(timeout_ms=1000)
                for tp, messages in records.items():
                    for msg in messages:
                        self._process_message(msg.value)
            except Exception as e:
                logger.error(f"Consumer error: {e}")
                break

    def _process_message(self, message: dict):
        event_type = message.get("event_type", "")
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(message["payload"])
            except Exception as e:
                logger.error(f"Handler error for {event_type}: {e}")


# ─── FULL EVENT PIPELINE ORCHESTRATOR ────────────────────────────────────────
class DiseasePipelineOrchestrator:
    """
    Orchestrates the full event-driven disease surveillance pipeline.
    
    Flow:
    Citizen Post → Disease Prediction → Case Update → Outbreak Check
    → Hotspot Check → Hospital Check → Risk Score → Gov Action
    """

    def __init__(self):
        from models.symptom_classifier import SymptomDiseaseClassifier as SymptomClassifier, SymptomReport
        from models.case_aggregator import DistrictCaseAggregator, CaseRecord
        from models.outbreak_forecast import OutbreakForecastModel, OutbreakInput
        from models.analysis_models import DistrictRiskScorer, RiskScoreInput
        from models.remedy_planner import GovernmentExecutionPlanner, RemedyInput
        from services.data_services import WeatherService, HazardDataService

        self.classifier = SymptomClassifier()
        self.aggregator = DistrictCaseAggregator()
        self.outbreak_model = OutbreakForecastModel()
        self.risk_scorer = DistrictRiskScorer()
        self.planner = GovernmentExecutionPlanner()
        self.weather_service = WeatherService()
        self.hazard_service = HazardDataService()
        self.producer = DiseaseEventProducer()

        self.SymptomReport = SymptomReport
        self.CaseRecord = CaseRecord
        self.OutbreakInput = OutbreakInput
        self.RiskScoreInput = RiskScoreInput
        self.RemedyInput = RemedyInput

    def process_citizen_post(self, district: str, symptoms_text: str, image_b64: str = None) -> dict:
        """
        Full pipeline processing for a single citizen report.
        Returns the complete chain of results.
        """
        results = {}
        pipeline_log = []

        # ── Step 1: Disease Prediction ────────────────────────────────────────
        pipeline_log.append("Step 1: Disease Prediction")
        report = self.SymptomReport(
            district=district,
            symptoms_text=symptoms_text,
            image_base64=image_b64
        )
        disease_result = self.classifier.predict(report)
        disease = disease_result.predicted_disease
        results["disease_prediction"] = {
            "disease": disease,
            "confidence": disease_result.confidence,
            "source": disease_result.source
        }
        self.producer.publish_disease_prediction(
            district, disease, disease_result.confidence, disease_result.source
        )

        # ── Step 2: Case Update ───────────────────────────────────────────────
        pipeline_log.append("Step 2: Case Aggregation")
        self.aggregator.add_case(self.CaseRecord(
            district=district, state=district,
            disease=disease, cases=1, deaths=0, recoveries=0,
            timestamp=datetime.now(), source="community_pipeline"
        ))
        summaries = self.aggregator.get_district_summary(district, disease)
        active = sum(s.active_cases for s in summaries)
        cases_7day = sum(s.reported_cases_7day for s in summaries)
        trend = summaries[0].trend if summaries else "STABLE"
        results["case_aggregation"] = {
            "active_cases": active,
            "cases_7day": cases_7day,
            "trend": trend
        }
        self.producer.publish_case_aggregation(district, disease, 1, cases_7day, trend)

        # ── Step 3: Weather + Satellite Data ─────────────────────────────────
        pipeline_log.append("Step 3: Data Fusion (Weather + Satellite)")
        weather = self.weather_service.get_weather(district)
        env_risk = self.hazard_service.get_environmental_risk(district)
        results["data_fusion"] = {
            "temperature": weather.temperature_mean,
            "humidity": weather.humidity_mean,
            "rainfall_mm": weather.rainfall_mm,
            "environmental_risk": env_risk,
            "weather_source": weather.source,
        }

        # ── Step 4: Outbreak Prediction ───────────────────────────────────────
        pipeline_log.append("Step 4: Outbreak Forecast")
        outbreak_inp = self.OutbreakInput(
            district=district, disease=disease,
            cases=max(active, 1),
            cases_lag1=max(active - 5, 0),
            cases_lag2=max(active - 10, 0),
            temperature_mean=weather.temperature_mean,
            humidity_mean=weather.humidity_mean,
            rainfall_anomaly=weather.rainfall_anomaly,
            population_density=500.0,
            hospital_capacity=100.0,
        )
        forecast = self.outbreak_model.forecast(outbreak_inp)
        results["outbreak_forecast"] = {
            "predicted_cases_next_week": forecast.predicted_cases_next_week,
            "outbreak_probability": forecast.outbreak_probability,
            "outbreak_alert": forecast.outbreak_alert
        }
        if forecast.outbreak_alert:
            self.producer.publish_outbreak_alert(
                district, disease,
                forecast.outbreak_probability,
                forecast.predicted_cases_next_week
            )

        # ── Step 5: Risk Scoring ──────────────────────────────────────────────
        pipeline_log.append("Step 5: Risk Scoring")
        risk_inp = self.RiskScoreInput(
            district=district, disease=disease,
            outbreak_probability=forecast.outbreak_probability,
            hotspot_density=min(1.0, active / 200),
            hospital_capacity_risk=min(1.0, active / 500),
            environmental_risk=env_risk,
            active_cases=active,
        )
        risk = self.risk_scorer.score(risk_inp)
        results["risk_score"] = {
            "risk_score": risk.risk_score,
            "risk_level": risk.risk_level,
            "alert_priority": risk.alert_priority
        }

        # ── Step 6: Government Recommendations ────────────────────────────────
        pipeline_log.append("Step 6: Government Action Plan")
        remedy_inp = self.RemedyInput(
            district=district, disease=disease,
            risk_level=risk.risk_level,
            outbreak_probability=forecast.outbreak_probability,
            active_cases=active,
            population=1_000_000,
            hospital_overload_risk=risk_inp.hospital_capacity_risk,
        )
        plan = self.planner.create_execution_plan(remedy_inp)
        immediate_actions = plan.government_advisory.immediate_actions[:3]
        results["action_plan"] = {
            "immediate_actions": immediate_actions,
            "citizen_dos": plan.citizen_advisory.do_list[:3],
        }
        self.producer.publish_government_action(
            district, disease, risk.risk_level, immediate_actions
        )

        results["pipeline_log"] = pipeline_log
        results["summary"] = (
            f"District: {district} | Disease: {disease} | "
            f"Risk: {risk.risk_level} | Outbreak: {forecast.outbreak_probability:.0%}"
        )

        return results


# ─── TEST ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    print("=== Disease Pipeline Orchestrator Test ===")
    orchestrator = DiseasePipelineOrchestrator()

    result = orchestrator.process_citizen_post(
        district="Lucknow",
        symptoms_text="High fever, body pain, headache for 3 days, chills, sweating"
    )

    print(f"\n{'='*60}")
    print(f"Pipeline Summary: {result['summary']}")
    print(f"{'='*60}")
    for step, data in result.items():
        if step not in ["pipeline_log", "summary"]:
            print(f"\n{step.upper()}:")
            for k, v in data.items():
                print(f"  {k}: {v}")

    print(f"\nKafka messages queued: {sum(len(v) for v in orchestrator.producer._queue.values())}")
