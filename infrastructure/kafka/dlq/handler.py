import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from confluent_kafka import Producer
from ..config.settings import settings

logger = logging.getLogger(__name__)

# Topic mapping from source topics to their corresponding Dead Letter Queue topics.
DLQ_TOPIC_MAP = {
    "citizen-complaints": "dlq-complaints",
    "citizen-feedback": "dlq-complaints",
    
    "health-events": "dlq-health",
    "disease-outbreaks": "dlq-health",
    
    "weather-events": "dlq-hazard",
    "hazard-alerts": "dlq-hazard",
}

class DLQHandler:
    """
    Handles routing and producing failed message payloads to their respective DLQ topics,
    attaching error metadata and contextual headers.
    """
    def __init__(self, dlq_producer: Optional[Producer] = None):
        if dlq_producer is not None:
            self.producer = dlq_producer
        else:
            conf = {
                "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
                "client.id": f"{settings.CLIENT_ID}-dlq",
                "acks": "all"
            }
            try:
                self.producer = Producer(conf)
            except Exception as e:
                logger.error(f"Failed to create DLQ Kafka Producer: {e}")
                self.producer = None

    def route_to_dlq(
        self,
        original_topic: str,
        message_key: Optional[bytes],
        message_value: bytes,
        error_reason: str,
        original_partition: Optional[int] = None,
        original_offset: Optional[int] = None
    ) -> bool:
        """
        Sends the failed message to its corresponding DLQ topic.
        Attaches headers with error metadata.
        """
        if not settings.DLQ_ENABLED:
            logger.warning("DLQ is disabled in configuration. Skipping DLQ routing.")
            return False

        if self.producer is None:
            logger.error("DLQ Producer is not initialized. Cannot route message.")
            return False

        # Determine target DLQ topic
        dlq_topic = DLQ_TOPIC_MAP.get(original_topic)
        if dlq_topic is None:
            # Fallback to direct mapping: dlq-<original-topic-name>
            dlq_topic = f"dlq-{original_topic}"
            logger.warning(
                f"No explicit DLQ mapping found for topic '{original_topic}'. "
                f"Falling back to topic name '{dlq_topic}'."
            )

        # Set up headers with error details
        headers = [
            ("dlq_error_reason", error_reason.encode("utf-8")),
            ("dlq_error_timestamp", datetime.utcnow().isoformat().encode("utf-8")),
            ("dlq_original_topic", original_topic.encode("utf-8")),
        ]
        
        if original_partition is not None:
            headers.append(("dlq_original_partition", str(original_partition).encode("utf-8")))
        if original_offset is not None:
            headers.append(("dlq_original_offset", str(original_offset).encode("utf-8")))

        try:
            logger.info(f"Routing failed message from '{original_topic}' to DLQ '{dlq_topic}'...")
            self.producer.produce(
                topic=dlq_topic,
                key=message_key,
                value=message_value,
                headers=headers,
                callback=self._delivery_callback
            )
            # Trigger delivery callbacks (async push)
            self.producer.poll(0)
            return True
        except Exception as e:
            logger.error(f"Failed to produce message to DLQ topic '{dlq_topic}': {e}")
            return False

    def flush(self, timeout: float = 5.0):
        """Blocks until all queued messages are published."""
        if self.producer is not None:
            self.producer.flush(timeout)

    def _delivery_callback(self, err: Any, msg: Any):
        """Reports execution result of the DLQ produce command."""
        if err is not None:
            logger.critical(f"DLQ message delivery failed: {err}")
        else:
            logger.info(
                f"Failed message successfully written to DLQ topic '{msg.topic()}' "
                f"| Partition: {msg.partition()} | Offset: {msg.offset()}"
            )
