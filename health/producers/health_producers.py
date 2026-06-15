# health/producers/health_producers.py
import json
import os
from typing import Dict, Any

try:
    from confluent_kafka import Producer
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

class HealthEventProducer:
    def __init__(self):
        self.producer = None
        if HAS_KAFKA:
            try:
                # Initialize producer with short connection timeout so it doesn't block startup
                self.producer = Producer({
                    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
                    "socket.timeout.ms": 1500,
                    "message.timeout.ms": 2000
                })
                print(f"[OK] Confluent Kafka Producer initialized targeting {KAFKA_BOOTSTRAP_SERVERS}")
            except Exception as e:
                print(f"[WARNING] Failed to initialize Confluent Kafka: {e}. Event streaming will run in fallback logging mode.")
        else:
            print("[INFO] confluent-kafka not found. Running in fallback logging mode.")

    def send_event(self, topic: str, key: str, payload: Dict[str, Any]):
        """Publish event to Kafka with fallback to print logging"""
        payload_bytes = json.dumps(payload).encode("utf-8")
        if self.producer:
            try:
                self.producer.produce(topic, key=key.encode("utf-8"), value=payload_bytes)
                self.producer.flush(0) # Flush immediately for responsiveness
                print(f"[KAFKA] Produced event to topic '{topic}': key={key}")
            except Exception as e:
                print(f"[KAFKA-ERROR] Failed to send event to '{topic}': {e}. Fallback logged payload: {payload}")
        else:
            print(f"[KAFKA-FALLBACK] Topic '{topic}' | Key '{key}' | Payload: {payload}")

# Global singleton
health_producer = HealthEventProducer()
