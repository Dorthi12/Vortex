import logging
from typing import Optional
from .base import BaseProducer
from ..schemas.events import (
    EventEnvelope,
    ComplaintPayload,
    PolicyPayload,
    WeatherPayload,
    NotificationPayload
)

logger = logging.getLogger(__name__)

class ComplaintProducer(BaseProducer):
    """Producer for publishing citizen grievance/complaint events."""
    
    def publish_complaint_created(
        self,
        complaint: ComplaintPayload,
        source: str = "citizen_portal"
    ) -> bool:
        """Publishes a complaint_created event to the citizen-complaints topic."""
        event = EventEnvelope(
            event_type="complaint_created",
            source=source,
            version="v1",
            payload=complaint.model_dump()
        )
        logger.info(f"Publishing complaint_created event: {event.event_id}")
        return self.produce(
            topic="citizen-complaints",
            event=event,
            key=complaint.district # Route complaints from same district to same partition
        )

class PolicyProducer(BaseProducer):
    """Producer for publishing governance policy updates."""
    
    def publish_policy_updated(
        self,
        policy: PolicyPayload,
        source: str = "policy_intelligence"
    ) -> bool:
        """Publishes a policy_updated event to the policy-updates topic."""
        event = EventEnvelope(
            event_type="policy_updated",
            source=source,
            version="v1",
            payload=policy.model_dump()
        )
        logger.info(f"Publishing policy_updated event: {event.event_id}")
        return self.produce(
            topic="policy-updates",
            event=event,
            key=policy.policy_id
        )

class WeatherProducer(BaseProducer):
    """Producer for publishing meteorological weather events."""
    
    def publish_weather_recorded(
        self,
        weather: WeatherPayload,
        source: str = "weather_station"
    ) -> bool:
        """Publishes a weather_recorded event to the weather-events topic."""
        event = EventEnvelope(
            event_type="weather_recorded",
            source=source,
            version="v1",
            payload=weather.model_dump()
        )
        logger.info(f"Publishing weather_recorded event: {event.event_id}")
        return self.produce(
            topic="weather-events",
            event=event,
            key=weather.district
        )

class NotificationProducer(BaseProducer):
    """Producer for dispatching platform alerts/notifications."""
    
    def publish_notification_dispatched(
        self,
        notification: NotificationPayload,
        source: str = "notification_engine"
    ) -> bool:
        """Publishes a notification_dispatched event to the notifications topic."""
        event = EventEnvelope(
            event_type="notification_dispatched",
            source=source,
            version="v1",
            payload=notification.model_dump()
        )
        logger.info(f"Publishing notification_dispatched event: {event.event_id}")
        return self.produce(
            topic="notifications",
            event=event,
            key=notification.recipient_id
        )
