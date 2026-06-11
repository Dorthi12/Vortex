"""
services/kafka_pipeline.py — FIXED
FIXES:
  1. Added missing topics: mobility_updates, health_reports (were absent from TOPIC_SCHEMAS)
  2. Added publish_mobility_update() and publish_health_report() producer methods
  3. Added get_all_schemas() endpoint for documentation / dashboard
  4. Consumer group ID properly defined as constant
"""
from __future__ import annotations
import json, logging, threading
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

CONSUMER_GROUP_ID = "disease-intel-group"

# ── MESSAGE SCHEMAS (FIX: now includes ALL 6 required topics) ─
TOPIC_SCHEMAS = {
    "citizen_reports": {
        "description": "Raw citizen report with free-text symptoms",
        "fields": {
            "report_id":"str","citizen_id":"str","district":"str",
            "lat":"float","lng":"float","text":"str",
            "timestamp":"ISO8601","source":"str",  # mobile_app|web|whatsapp|ivr
        },
        "example": {
            "report_id":"RPT-20240812-001","citizen_id":"USR-123","district":"Lucknow",
            "lat":26.85,"lng":80.95,"text":"High fever since 3 days, severe headache and body pain",
            "timestamp":"2024-08-12T10:30:00Z","source":"mobile_app",
        },
    },
    "weather_updates": {
        "description": "District-level weather data from Open-Meteo / Weatherbit",
        "fields": {
            "district":"str","lat":"float","lng":"float",
            "temperature_mean":"float","humidity_mean":"float",
            "precipitation_total":"float","wind_speed_mean":"float",
            "timestamp":"ISO8601","source":"str",
        },
    },
    "mobility_updates": {                          # FIX: was completely missing
        "description": "District mobility / traffic density from GenerateIO API",
        "fields": {
            "district":"str","lat":"float","lng":"float",
            "mobility_index":"float",              # 0-1 composite mobility score
            "traffic_density":"float",             # vehicles per km²
            "inter_district_flow":"float",         # fraction of population traveling out
            "travel_density":"float",
            "timestamp":"ISO8601","source":"str",  # generateio
        },
    },
    "disease_cases": {
        "description": "Aggregated district disease case counts",
        "fields": {
            "district":"str","disease":"str","cases":"int",
            "deaths":"int","recoveries":"int","source":"str",
            "week":"int","year":"int","timestamp":"ISO8601",
        },
    },
    "health_reports": {                            # FIX: was completely missing
        "description": "Official health department reports (IDSP / NVBDCP)",
        "fields": {
            "district":"str","disease":"str","report_type":"str",
            "cases":"int","deaths":"int","facility":"str",
            "week":"int","year":"int","timestamp":"ISO8601",
        },
    },
    "outbreak_predictions": {
        "description": "ML model outbreak forecast output",
        "fields": {
            "district":"str","disease":"str","risk_level":"str",
            "risk_score":"float","outbreak_probability":"float",
            "projected_cases":"int","model_version":"str","timestamp":"ISO8601",
        },
    },
    "government_actions": {
        "description": "Dispatched government execution plan",
        "fields": {
            "plan_id":"str","district":"str","disease":"str","risk_level":"str",
            "immediate_actions":"List[str]","resources_deployed":"Dict",
            "dispatched_at":"ISO8601","status":"str",
        },
    },
}


class MockKafkaProducer:
    """
    Mock Kafka producer (in-memory) for dev/testing.
    Production: replace with kafka-python KafkaProducer.
    """
    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self._messages: Dict[str, List[Dict]] = {t: [] for t in TOPIC_SCHEMAS}
        logger.info("MockKafkaProducer initialised (bootstrap=%s)", bootstrap_servers)

    def send(self, topic: str, value: Dict, key: Optional[str] = None) -> bool:
        if topic not in self._messages:
            self._messages[topic] = []
        self._messages[topic].append({
            "key": key, "value": value, "topic": topic,
            "partition": 0, "offset": len(self._messages[topic]),
            "timestamp": datetime.utcnow().isoformat(),
        })
        logger.debug("Produced → %s | key=%s", topic, key)
        return True

    def flush(self): pass
    def close(self): pass
    def get_messages(self, topic: str) -> List[Dict]:
        return self._messages.get(topic, [])


class MockKafkaConsumer:
    def __init__(self, topic: str, producer: MockKafkaProducer,
                 group_id: str = CONSUMER_GROUP_ID):
        self.topic = topic
        self._producer = producer
        self.group_id = group_id
        self._offset = 0
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def consume(self, callback: Callable[[Dict], None], poll_interval: float = 1.0):
        self._running = True
        def _loop():
            import time
            while self._running:
                messages = self._producer.get_messages(self.topic)
                while self._offset < len(messages):
                    callback(messages[self._offset]["value"])
                    self._offset += 1
                time.sleep(poll_interval)
        self._thread = threading.Thread(target=_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False


class DiseaseIntelPipeline:
    """Full Kafka streaming pipeline wiring all 9 models."""

    def __init__(self, bootstrap_servers: str = "localhost:9092"):
        self.producer = MockKafkaProducer(bootstrap_servers)
        self._consumers: Dict[str, MockKafkaConsumer] = {}

    # ── PRODUCERS ────────────────────────────────────────────
    def publish_citizen_report(self, district:str, text:str, lat:float, lng:float,
                                source:str="web", citizen_id:str="anon") -> str:
        report_id = f"RPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        self.producer.send("citizen_reports", {
            "report_id":report_id,"citizen_id":citizen_id,"district":district,
            "lat":lat,"lng":lng,"text":text,
            "timestamp":datetime.utcnow().isoformat(),"source":source,
        }, key=district)
        return report_id

    def publish_weather_update(self, district:str, weather:Dict):
        self.producer.send("weather_updates", {
            "district":district,**weather,
            "timestamp":datetime.utcnow().isoformat(),"source":"open_meteo",
        }, key=district)

    def publish_mobility_update(self, district:str, lat:float, lng:float,
                                 mobility_data:Dict):
        """FIX: New producer — mobility_updates topic was completely absent."""
        self.producer.send("mobility_updates", {
            "district":district,"lat":lat,"lng":lng,
            **mobility_data,
            "timestamp":datetime.utcnow().isoformat(),"source":"generateio",
        }, key=district)

    def publish_disease_cases(self, district:str, disease:str, cases:int,
                               deaths:int=0, recoveries:int=0):
        now = datetime.utcnow()
        self.producer.send("disease_cases", {
            "district":district,"disease":disease,"cases":cases,
            "deaths":deaths,"recoveries":recoveries,"source":"official",
            "week":now.isocalendar()[1],"year":now.year,
            "timestamp":now.isoformat(),
        }, key=f"{district}:{disease}")

    def publish_health_report(self, district:str, disease:str, cases:int,
                               deaths:int=0, facility:str="district_hospital",
                               report_type:str="weekly"):
        """FIX: New producer — health_reports topic was completely absent."""
        now = datetime.utcnow()
        self.producer.send("health_reports", {
            "district":district,"disease":disease,"report_type":report_type,
            "cases":cases,"deaths":deaths,"facility":facility,
            "week":now.isocalendar()[1],"year":now.year,
            "timestamp":now.isoformat(),
        }, key=f"{district}:{disease}")

    def publish_outbreak_prediction(self, forecast_result:Dict):
        self.producer.send("outbreak_predictions", {
            **forecast_result,"model_version":"2.0.0",
            "timestamp":datetime.utcnow().isoformat(),
        }, key=forecast_result.get("district",""))

    def publish_government_action(self, execution_plan:Dict):
        self.producer.send("government_actions", {
            "plan_id":execution_plan.get("execution_plan_id"),
            "district":execution_plan.get("district"),
            "disease":execution_plan.get("disease"),
            "risk_level":execution_plan.get("risk_level"),
            "immediate_actions":execution_plan.get("phase_1_immediate_0_24h",[]),
            "resources_deployed":execution_plan.get("resource_requirements",{}),
            "dispatched_at":datetime.utcnow().isoformat(),"status":"dispatched",
        }, key=execution_plan.get("district",""))

    # ── CONSUMER REGISTRATION ─────────────────────────────────
    def register_handler(self, topic:str, handler:Callable):
        consumer = MockKafkaConsumer(topic, self.producer)
        consumer.consume(handler)
        self._consumers[topic] = consumer
        logger.info("Handler registered for topic: %s", topic)

    def stop_all(self):
        for c in self._consumers.values(): c.stop()

    def get_topic_stats(self) -> Dict:
        return {t: len(self.producer.get_messages(t)) for t in TOPIC_SCHEMAS}

    def get_all_schemas(self) -> Dict:
        """Return full schema documentation for all topics."""
        return TOPIC_SCHEMAS


# Singleton
pipeline = DiseaseIntelPipeline()
