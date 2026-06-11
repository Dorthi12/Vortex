import sys
import json
import unittest
from unittest.mock import MagicMock, patch

# Dynamic mocking of confluent_kafka if not installed
try:
    import confluent_kafka
    from confluent_kafka import Message, KafkaError
except ImportError:
    mock_confluent = MagicMock()
    mock_confluent.Consumer = MagicMock
    mock_confluent.Message = MagicMock
    mock_confluent.KafkaError = MagicMock
    mock_confluent.KafkaError._PARTITION_EOF = -191
    sys.modules['confluent_kafka'] = mock_confluent
    # import placeholders to make code compile
    Message = mock_confluent.Message
    KafkaError = mock_confluent.KafkaError

from infrastructure.kafka.consumers.base import BaseConsumer
from infrastructure.kafka.consumers.examples import ComplaintConsumer
from infrastructure.kafka.schemas.events import EventEnvelope

class TestKafkaConsumers(unittest.TestCase):

    @patch('infrastructure.kafka.consumers.base.Consumer')
    @patch('infrastructure.kafka.consumers.base.DLQHandler')
    def test_consumer_invalid_json_routes_to_dlq(self, mock_dlq_class, mock_consumer_class):
        """Tests that unparseable messages are directly routed to the DLQ and offsets committed."""
        mock_consumer = MagicMock()
        mock_consumer_class.return_value = mock_consumer
        
        mock_dlq = MagicMock()
        mock_dlq_class.return_value = mock_dlq

        consumer = BaseConsumer(topics=["test-topic"])

        # Setup mock invalid message
        mock_message = MagicMock()
        mock_message.value.return_value = b"{invalid-json: }"
        mock_message.key.return_value = b"test-key"
        mock_message.topic.return_value = "test-topic"
        mock_message.partition.return_value = 1
        mock_message.offset.return_value = 120

        consumer._handle_message(mock_message)

        # DLQ should be triggered
        mock_dlq.route_to_dlq.assert_called_once()
        call_args = mock_dlq.route_to_dlq.call_args[1]
        self.assertEqual(call_args["original_topic"], "test-topic")
        self.assertEqual(call_args["message_key"], b"test-key")
        self.assertEqual(call_args["message_value"], b"{invalid-json: }")
        self.assertIn("Failed to parse", call_args["error_reason"])
        self.assertEqual(call_args["original_partition"], 1)
        self.assertEqual(call_args["original_offset"], 120)

        # Message offset should be committed to allow progress
        mock_consumer.commit.assert_called_once_with(message=mock_message, asynchronous=True)

    @patch('infrastructure.kafka.consumers.base.Consumer')
    @patch('infrastructure.kafka.consumers.base.DLQHandler')
    def test_consumer_valid_message_processing(self, mock_dlq_class, mock_consumer_class):
        """Tests that a valid message is processed by subclass hook and committed."""
        mock_consumer = MagicMock()
        mock_consumer_class.return_value = mock_consumer
        
        mock_dlq = MagicMock()
        mock_dlq_class.return_value = mock_dlq

        # Specific complaint consumer
        consumer = ComplaintConsumer()
        
        envelope = EventEnvelope(
            event_type="complaint_created",
            source="citizen_portal",
            payload={
                "complaint_id": "CMP-1",
                "citizen_id": "CIT-2",
                "title": "Road damage",
                "description": "Pavement is broken",
                "category": "roads",
                "district": "Kanpur",
                "status": "PENDING"
            }
        )

        mock_message = MagicMock()
        mock_message.value.return_value = envelope.model_dump_json().encode("utf-8")
        mock_message.key.return_value = b"Kanpur"
        mock_message.topic.return_value = "citizen-complaints"
        mock_message.partition.return_value = 0
        mock_message.offset.return_value = 45

        # Spy on process_message call
        consumer.process_message = MagicMock()

        consumer._handle_message(mock_message)

        # Check process_message executed once
        consumer.process_message.assert_called_once()
        called_envelope = consumer.process_message.call_args[0][0]
        self.assertEqual(called_envelope.event_type, "complaint_created")
        self.assertEqual(called_envelope.payload["complaint_id"], "CMP-1")

        # DLQ should NOT be triggered
        mock_dlq.route_to_dlq.assert_not_called()

        # Message offset should be committed
        mock_consumer.commit.assert_called_once_with(message=mock_message, asynchronous=True)
