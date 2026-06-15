import logging
from typing import Dict, Any, Optional
from infrastructure.kafka.producers.base import BaseProducer
from infrastructure.kafka.schemas.events import EventEnvelope

logger = logging.getLogger(__name__)

class AgProducer(BaseProducer):
    """Producer for publishing agriculture-related events."""
    
    def publish_ag_event(self, topic: str, event_type: str, payload: Dict[str, Any], key: Optional[str] = None) -> bool:
        event = EventEnvelope(
            event_type=event_type,
            source="agriculture_intelligence",
            payload=payload
        )
        logger.info(f"Publishing {event_type} to topic {topic}")
        return self.produce(topic=topic, event=event, key=key)

# Singleton producer
ag_producer = None
try:
    ag_producer = AgProducer()
except Exception as e:
    logger.warning(f"Could not initialize AgProducer on start (Kafka broker down): {e}")
