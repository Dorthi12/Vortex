# health/consumers/health_consumers.py
import json
import threading
import os
import redis
from typing import List

try:
    from confluent_kafka import Consumer, KafkaError
    HAS_KAFKA = True
except ImportError:
    HAS_KAFKA = False

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class HealthEventConsumer:
    def __init__(self, topics: List[str]):
        self.topics = topics
        self.running = False
        self.thread = None
        self.redis_client = None
        self.consumer = None

        try:
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            print(f"[OK] Redis client connected targeting {REDIS_URL}")
        except Exception as e:
            print(f"[WARNING] Redis cache integration disabled: {e}")

        if HAS_KAFKA:
            try:
                self.consumer = Consumer({
                    "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
                    "group.id": "health-governance-group",
                    "auto.offset.reset": "latest",
                    "socket.timeout.ms": 2000
                })
                print(f"[OK] Confluent Kafka Consumer configured for group 'health-governance-group'")
            except Exception as e:
                print(f"[WARNING] Failed to initialize Kafka consumer: {e}")

    def start(self):
        if not self.consumer:
            print("[INFO] Kafka consumer not initialized. Background consume thread will not start.")
            return
        self.running = True
        self.thread = threading.Thread(target=self._consume_loop, daemon=True)
        self.thread.start()
        print(f"[OK] Background consumer thread started for topics: {self.topics}")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            print("[INFO] Background consumer thread stopped.")

    def _consume_loop(self):
        try:
            self.consumer.subscribe(self.topics)
            while self.running:
                msg = self.consumer.poll(timeout=1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"[KAFKA-CONSUME-ERROR] {msg.error()}")
                        break
                
                # Process valid message
                try:
                    topic = msg.topic()
                    key = msg.key().decode("utf-8") if msg.key() else "none"
                    val = json.loads(msg.value().decode("utf-8"))
                    print(f"[KAFKA-CONSUMED] Topic '{topic}' | Key '{key}'")
                    
                    # Update Redis cache with the latest event
                    if self.redis_client:
                        cache_key = f"health:latest_event:{topic}"
                        self.redis_client.set(cache_key, json.dumps(val))
                        # Keep list of recent alerts
                        if "alert" in topic or "signal" in topic:
                            self.redis_client.lpush(f"health:alerts:{val.get('disease', 'unknown')}", json.dumps(val))
                            self.redis_client.ltrim(f"health:alerts:{val.get('disease', 'unknown')}", 0, 19)
                except Exception as ex:
                    print(f"[KAFKA-CONSUME-PROCESS-ERROR] Failed to process payload: {ex}")
        finally:
            self.consumer.close()

# Start global consumer for all health topics
health_consumer = HealthEventConsumer([
    "health-outbreak-alerts",
    "hospital-capacity-events",
    "medicine-demand-events",
    "disease-surveillance-alerts",
    "vaccination-events",
    "vaccination-alerts",
    "ambulance-status",
    "emergency-dispatch"
])
