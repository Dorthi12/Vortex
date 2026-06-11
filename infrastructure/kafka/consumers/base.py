import json
import logging
import signal
import sys
from typing import Any, Dict, List, Optional
from confluent_kafka import Consumer, KafkaError, Message
from ..config.settings import settings
from ..retry.strategy import execute_with_retry, MaxRetriesExceededException
from ..dlq.handler import DLQHandler
from ..schemas.events import EventEnvelope

logger = logging.getLogger(__name__)

class BaseConsumer:
    """
    Robust Base Consumer wrapping Confluent Kafka Consumer.
    - Implements manual offset commit strategy.
    - Integrates exponential retries for processing failures.
    - Automatically routes persistent failures to Dead Letter Queues (DLQs).
    - Supports clean graceful shutdown handlers.
    """
    def __init__(
        self,
        topics: List[str],
        group_id: Optional[str] = None,
        config_override: Optional[Dict[str, Any]] = None
    ):
        self.topics = topics
        self.group_id = group_id or settings.DEFAULT_GROUP_ID
        self.running = False
        
        # Initialize DLQ Handler
        self.dlq_handler = DLQHandler()

        # Build Consumer Config
        conf = {
            "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
            "group.id": self.group_id,
            "auto.offset.reset": settings.CONSUMER_AUTO_OFFSET_RESET,
            "enable.auto.commit": settings.CONSUMER_ENABLE_AUTO_COMMIT, # Manual commit for safety
        }
        
        if config_override:
            conf.update(config_override)

        try:
            self.consumer = Consumer(conf)
            logger.info(f"Confluent Consumer initialized with group '{self.group_id}'.")
        except Exception as e:
            logger.critical(f"Failed to initialize confluent-kafka Consumer: {e}")
            raise e

    def start(self):
        """Starts the consumer poll loop, subscribing to the configured topics."""
        self.running = True
        self.consumer.subscribe(self.topics)
        logger.info(f"Subscribed to topics: {self.topics}. Starting poll loop...")

        # Setup graceful shutdown handlers
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        try:
            while self.running:
                # Poll for events (timeout of 1.0s)
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    continue
                
                if msg.error():
                    self._handle_kafka_error(msg)
                    continue

                # Process the message
                self._handle_message(msg)
                
        except Exception as e:
            logger.critical(f"Unexpected crash in consumer loop: {e}")
        finally:
            self.close()

    def stop(self):
        """Signals the poll loop to terminate on next iteration."""
        logger.info("Shutdown signaled. Terminating consumer loop...")
        self.running = False

    def close(self):
        """Closes the consumer handle and flushes outstanding DLQ processes."""
        logger.info("Closing consumer subscription...")
        try:
            self.consumer.close()
        except Exception as e:
            logger.error(f"Error closing Kafka consumer: {e}")
            
        # Ensure any DLQ writes are completed
        self.dlq_handler.flush()
        logger.info("Consumer shutdown complete.")

    def process_message(self, event: EventEnvelope):
        """
        Abstract method to be overridden by subclasses to implement domain-specific business logic.
        Should raise exception for retryable failures.
        """
        raise NotImplementedError("Subclasses must implement process_message(self, event)")

    def _handle_message(self, msg: Message):
        """Deserializes event, manages retry logic, and executes DLQ fallbacks."""
        logger.debug(f"Received message from partition {msg.partition()} @ offset {msg.offset()}")
        
        message_bytes = msg.value()
        message_key = msg.key()
        topic = msg.topic()
        partition = msg.partition()
        offset = msg.offset()

        # 1. Parse JSON and validate against common EventEnvelope
        try:
            message_str = message_bytes.decode("utf-8")
            data = json.loads(message_str)
            envelope = EventEnvelope(**data)
        except Exception as e:
            error_msg = f"Failed to parse or validate EventEnvelope: {e}"
            logger.error(error_msg)
            # Route immediately to DLQ as parsing error is non-recoverable
            self.dlq_handler.route_to_dlq(
                original_topic=topic,
                message_key=message_key,
                message_value=message_bytes,
                error_reason=error_msg,
                original_partition=partition,
                original_offset=offset
            )
            # Commit offset to prevent blocking progress on bad message
            self._safe_commit(msg)
            return

        # 2. Process message using the Retry Strategy
        try:
            # We wrap self.process_message in retry execution
            execute_with_retry(
                self.process_message,
                envelope,
                exceptions=(Exception,)
            )
            logger.debug(f"Successfully processed message {envelope.event_id}")
        except MaxRetriesExceededException as e:
            logger.error(f"Max retries exceeded for message {envelope.event_id}. Routing to DLQ.")
            self.dlq_handler.route_to_dlq(
                original_topic=topic,
                message_key=message_key,
                message_value=message_bytes,
                error_reason=str(e),
                original_partition=partition,
                original_offset=offset
            )
        except Exception as e:
            logger.error(f"Non-retryable failure during message execution: {e}")
            self.dlq_handler.route_to_dlq(
                original_topic=topic,
                message_key=message_key,
                message_value=message_bytes,
                error_reason=str(e),
                original_partition=partition,
                original_offset=offset
            )

        # 3. Commit offsets manually after processing is resolved (either successfully or pushed to DLQ)
        self._safe_commit(msg)

    def _safe_commit(self, msg: Message):
        """Safely commits offset of the processed message."""
        try:
            self.consumer.commit(message=msg, asynchronous=True)
        except Exception as e:
            logger.error(f"Failed to commit offset asynchronously: {e}")

    def _handle_kafka_error(self, msg: Message):
        """Logs consumer error codes appropriately."""
        err = msg.error()
        if err.code() == KafkaError._PARTITION_EOF:
            # End of partition event (not a failure)
            logger.debug(f"Reached end of partition {msg.topic()} [{msg.partition()}] @ {msg.offset()}")
        else:
            logger.error(f"Kafka consumer error: {err}")

    def _handle_shutdown(self, signum, frame):
        """Triggered on signal interrupt (SIGINT, SIGTERM) to shutdown loop cleanly."""
        logger.info(f"Received signal {signum}. Shutting down consumer...")
        self.stop()
