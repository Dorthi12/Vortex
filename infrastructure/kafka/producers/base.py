import json
import logging
from typing import Any, Callable, Dict, Optional, Union
from confluent_kafka import Producer
from ..config.settings import settings
from ..schemas.events import EventEnvelope

logger = logging.getLogger(__name__)

class BaseProducer:
    """
    Highly performant Kafka Base Producer wrapping Confluent's Producer client.
    Configured for high availability, transactional safety, and high throughput.
    """
    def __init__(self, config_override: Optional[Dict[str, Any]] = None):
        conf = {
            "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
            "client.id": settings.CLIENT_ID,
            "acks": settings.PRODUCER_ACKS,
            "retries": settings.PRODUCER_RETRIES,
            "linger.ms": settings.PRODUCER_LINGER_MS,
            "batch.size": settings.PRODUCER_BATCH_SIZE,
            "compression.type": settings.PRODUCER_COMPRESSION_TYPE,
        }
        
        if config_override:
            conf.update(config_override)

        try:
            self.producer = Producer(conf)
            logger.info("Confluent Kafka Producer initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize confluent-kafka Producer: {e}")
            raise e

    def produce(
        self,
        topic: str,
        event: EventEnvelope,
        key: Optional[Union[str, bytes]] = None,
        callback: Optional[Callable[[Any, Any], None]] = None
    ) -> bool:
        """
        Asynchronously produces a serialized Pydantic EventEnvelope to the specified topic.
        - JSON serialization is automated.
        - Keys are mapped to bytes.
        """
        # Convert key to bytes if needed
        msg_key = key
        if isinstance(key, str):
            msg_key = key.encode("utf-8")

        # Serialize EventEnvelope to JSON string -> bytes
        try:
            msg_value = event.model_dump_json().encode("utf-8")
        except Exception as e:
            logger.error(f"Failed to serialize EventEnvelope to JSON: {e}")
            return False

        # Use default delivery callback if none is specified
        delivery_cb = callback if callback is not None else self._default_delivery_callback

        try:
            self.producer.produce(
                topic=topic,
                key=msg_key,
                value=msg_value,
                callback=delivery_cb
            )
            # Call poll periodically to trigger callbacks (non-blocking)
            self.producer.poll(0)
            return True
        except BufferError:
            # Local queue is full, flush and try one more time
            logger.warning("Local queue is full. Flushing and retrying produce...")
            self.producer.flush(1.0)
            try:
                self.producer.produce(topic=topic, key=msg_key, value=msg_value, callback=delivery_cb)
                return True
            except Exception as e:
                logger.error(f"Failed to produce message on retry: {e}")
                return False
        except Exception as e:
            logger.error(f"Failed to produce message: {e}")
            return False

    def flush(self, timeout: float = 10.0) -> int:
        """Blocks until all outstanding messages are delivered."""
        logger.info("Flushing Kafka Producer queue...")
        return self.producer.flush(timeout)

    def _default_delivery_callback(self, err: Any, msg: Any):
        """Standard delivery report logger callback."""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.info(
                f"Message delivered to topic '{msg.topic()}' "
                f"| Partition: {msg.partition()} | Offset: {msg.offset()}"
            )
