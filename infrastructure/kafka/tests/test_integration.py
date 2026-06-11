import sys
import unittest
from unittest.mock import MagicMock, patch

# Dynamic mocking of confluent_kafka if not installed
try:
    import confluent_kafka
    from confluent_kafka import Message
except ImportError:
    mock_confluent = MagicMock()
    mock_confluent.Message = MagicMock
    sys.modules['confluent_kafka'] = mock_confluent
    Message = mock_confluent.Message

from infrastructure.kafka.consumers.base import BaseConsumer
from infrastructure.kafka.dlq.handler import DLQHandler
from infrastructure.kafka.retry.strategy import execute_with_retry, MaxRetriesExceededException
from infrastructure.kafka.schemas.events import EventEnvelope
from infrastructure.kafka.config.settings import settings

class TestKafkaIntegrationFlow(unittest.TestCase):

    def setUp(self):
        # Override retry limits to speed up testing execution
        self.original_attempts = settings.MAX_RETRY_ATTEMPTS
        self.original_interval = settings.RETRY_INITIAL_INTERVAL
        self.original_backoff = settings.RETRY_BACKOFF_COEFF
        
        settings.MAX_RETRY_ATTEMPTS = 3
        settings.RETRY_INITIAL_INTERVAL = 0.01 # 10ms for fast tests
        settings.RETRY_BACKOFF_COEFF = 1.1

    def tearDown(self):
        settings.MAX_RETRY_ATTEMPTS = self.original_attempts
        settings.RETRY_INITIAL_INTERVAL = self.original_interval
        settings.RETRY_BACKOFF_COEFF = self.original_backoff

    def test_execute_with_retry_logic(self):
        """Tests that execute_with_retry retries defined times and raises Exception on persistent failures."""
        mock_action = MagicMock(side_effect=ValueError("Database connection timeout"))

        with self.assertRaises(MaxRetriesExceededException):
            execute_with_retry(
                mock_action,
                exceptions=(ValueError,)
            )

        # Action should be attempted exactly 3 times (attempts 1, 2, 3)
        self.assertEqual(mock_action.call_count, 3)

    @patch('infrastructure.kafka.consumers.base.Consumer')
    @patch('infrastructure.kafka.consumers.base.DLQHandler')
    def test_consumer_persistent_processing_failure_routes_to_dlq(self, mock_dlq_class, mock_consumer_class):
        """Tests that message processing failing all retries routes to DLQ and commits offset."""
        mock_consumer = MagicMock()
        mock_consumer_class.return_value = mock_consumer
        
        mock_dlq = MagicMock()
        mock_dlq_class.return_value = mock_dlq

        consumer = BaseConsumer(topics=["citizen-complaints"])
        
        envelope = EventEnvelope(
            event_type="complaint_created",
            source="citizen_portal",
            payload={"complaint_id": "CMP-FAILURE", "title": "Fail"}
        )

        mock_message = MagicMock()
        mock_message.value.return_value = envelope.model_dump_json().encode("utf-8")
        mock_message.key.return_value = b"Kanpur"
        mock_message.topic.return_value = "citizen-complaints"
        mock_message.partition.return_value = 0
        mock_message.offset.return_value = 100

        # Define process_message to persistently fail
        consumer.process_message = MagicMock(side_effect=RuntimeError("Grievance database down"))

        consumer._handle_message(mock_message)

        # process_message should be attempted 3 times (due to retries)
        self.assertEqual(consumer.process_message.call_count, 3)

        # DLQ should receive the failed message routing call
        mock_dlq.route_to_dlq.assert_called_once()
        call_args = mock_dlq.route_to_dlq.call_args[1]
        self.assertEqual(call_args["original_topic"], "citizen-complaints")
        self.assertEqual(call_args["message_key"], b"Kanpur")
        self.assertIn("Failed to execute action after 3 attempts", call_args["error_reason"])

        # Offset must be committed to avoid blocking consumer partition progress
        mock_consumer.commit.assert_called_once_with(message=mock_message, asynchronous=True)
