import sys
import json
import unittest
from unittest.mock import MagicMock, patch
from uuid import UUID

# Dynamic mocking of confluent_kafka if not installed
try:
    import confluent_kafka
except ImportError:
    mock_confluent = MagicMock()
    mock_confluent.Producer = MagicMock
    sys.modules['confluent_kafka'] = mock_confluent

from infrastructure.kafka.config.settings import settings
from infrastructure.kafka.schemas.events import EventEnvelope, ComplaintPayload
from infrastructure.kafka.producers.base import BaseProducer
from infrastructure.kafka.producers.examples import ComplaintProducer

class TestKafkaProducers(unittest.TestCase):

    @patch('infrastructure.kafka.producers.base.Producer')
    def test_base_producer_init(self, mock_producer_class):
        """Tests that the base producer initializes confluent-kafka Producer with correct config."""
        producer = BaseProducer()
        mock_producer_class.assert_called_once()
        conf_args = mock_producer_class.call_args[0][0]
        self.assertEqual(conf_args["bootstrap.servers"], settings.BOOTSTRAP_SERVERS)
        self.assertEqual(conf_args["acks"], settings.PRODUCER_ACKS)
        self.assertEqual(conf_args["retries"], settings.PRODUCER_RETRIES)

    @patch('infrastructure.kafka.producers.base.Producer')
    def test_base_producer_produce_success(self, mock_producer_class):
        """Tests successful event publishing and serialization."""
        mock_producer_instance = MagicMock()
        mock_producer_class.return_value = mock_producer_instance

        producer = BaseProducer()
        
        envelope = EventEnvelope(
            event_type="test_event",
            source="test_source",
            payload={"key": "value"}
        )

        success = producer.produce(
            topic="test-topic",
            event=envelope,
            key="test-key"
        )

        self.assertTrue(success)
        mock_producer_instance.produce.assert_called_once()
        
        # Verify call arguments
        call_args = mock_producer_instance.produce.call_args[1]
        self.assertEqual(call_args["topic"], "test-topic")
        self.assertEqual(call_args["key"], b"test-key")
        
        # Deserialize and verify the published payload content
        published_json = json.loads(call_args["value"].decode("utf-8"))
        self.assertEqual(published_json["event_type"], "test_event")
        self.assertEqual(published_json["source"], "test_source")
        self.assertEqual(published_json["payload"]["key"], "value")

    @patch('infrastructure.kafka.producers.base.Producer')
    def test_specific_complaint_producer(self, mock_producer_class):
        """Tests ComplaintProducer routes events to citizen-complaints with district key."""
        mock_producer_instance = MagicMock()
        mock_producer_class.return_value = mock_producer_instance

        complaint_producer = ComplaintProducer()
        
        complaint = ComplaintPayload(
            complaint_id="CMP-101",
            citizen_id="CIT-99",
            title="Pothole on Main St",
            description="Large pothole near intersection of Main St and 5th Ave.",
            category="roads",
            district="Lucknow"
        )

        success = complaint_producer.publish_complaint_created(
            complaint=complaint,
            source="citizen_portal"
        )

        self.assertTrue(success)
        mock_producer_instance.produce.assert_called_once()
        
        call_args = mock_producer_instance.produce.call_args[1]
        self.assertEqual(call_args["topic"], "citizen-complaints")
        self.assertEqual(call_args["key"], b"Lucknow")
        
        published_json = json.loads(call_args["value"].decode("utf-8"))
        self.assertEqual(published_json["event_type"], "complaint_created")
        self.assertEqual(published_json["payload"]["complaint_id"], "CMP-101")
        self.assertEqual(published_json["payload"]["district"], "Lucknow")
