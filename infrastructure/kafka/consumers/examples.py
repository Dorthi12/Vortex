import logging
from .base import BaseConsumer
from ..schemas.events import (
    EventEnvelope,
    ComplaintPayload,
    WeatherPayload,
    NotificationPayload,
    PolicyPayload
)

logger = logging.getLogger(__name__)

class ComplaintConsumer(BaseConsumer):
    """Consumer responsible for handling citizen complaints."""
    
    def __init__(self, group_id: str = "complaint-processing-group"):
        super().__init__(
            topics=["citizen-complaints"],
            group_id=group_id
        )

    def process_message(self, event: EventEnvelope):
        """Processes a single citizen complaint message."""
        payload = ComplaintPayload(**event.payload)
        logger.info(
            f"[ComplaintConsumer] Processing complaint ID {payload.complaint_id} "
            f"| Title: '{payload.title}' | District: {payload.district} | Status: {payload.status}"
        )
        # In production, this would trigger database insertions, dispatching workflows, etc.


class HazardConsumer(BaseConsumer):
    """Consumer responsible for reacting to hazard alerts and weather updates."""
    
    def __init__(self, group_id: str = "hazard-alerting-group"):
        super().__init__(
            topics=["hazard-alerts", "weather-events"],
            group_id=group_id
        )

    def process_message(self, event: EventEnvelope):
        """Processes hazard events or weather updates."""
        if event.event_type == "weather_recorded":
            payload = WeatherPayload(**event.payload)
            logger.info(
                f"[HazardConsumer] Weather update for {payload.district}: "
                f"Temp={payload.temperature}°C, Humidity={payload.humidity}%, Wind={payload.wind_speed}km/h"
            )
        elif event.event_type == "hazard_alert":
            logger.warning(
                f"[HazardConsumer] RECEIVING CRITICAL HAZARD ALERT | Event ID: {event.event_id} | "
                f"Source: {event.source} | Details: {event.payload}"
            )
            # Route to emergency action models, trigger evacuation alerts, etc.
        else:
            logger.info(f"[HazardConsumer] Unhandled event type: {event.event_type}")


class HealthConsumer(BaseConsumer):
    """Consumer responsible for aggregating health-events and disease-outbreaks."""
    
    def __init__(self, group_id: str = "health-monitoring-group"):
        super().__init__(
            topics=["health-events", "disease-outbreaks"],
            group_id=group_id
        )

    def process_message(self, event: EventEnvelope):
        """Processes health alerts and disease outbreak warnings."""
        logger.info(
            f"[HealthConsumer] Received Health intelligence event '{event.event_type}' "
            f"| Version: {event.version} | Payload: {event.payload}"
        )
        if "outbreak" in event.event_type.lower():
            logger.warning(f"[HealthConsumer] OUTBREAK WARNING DETECTED: {event.payload.get('disease', 'Unknown')}")
            # Triggers hospital preparedness systems, quarantine allocations, etc.


class GovernanceConsumer(BaseConsumer):
    """Consumer responsible for legislative decisions and voting outputs."""
    
    def __init__(self, group_id: str = "governance-executive-group"):
        super().__init__(
            topics=["agent-votes", "governance-decisions", "policy-updates"],
            group_id=group_id
        )

    def process_message(self, event: EventEnvelope):
        """Processes voting updates, executive decisions, or policies."""
        if event.event_type == "policy_updated":
            payload = PolicyPayload(**event.payload)
            logger.info(
                f"[GovernanceConsumer] New policy revision registered for '{payload.title}' "
                f"| Owner: {payload.department} | Status: {payload.status} | Updated By: {payload.updated_by}"
            )
        else:
            logger.info(
                f"[GovernanceConsumer] Legislative action '{event.event_type}' | Details: {event.payload}"
            )


class NotificationConsumer(BaseConsumer):
    """Consumer responsible for handling the actual dispatching of citizen messages (SMS, WhatsApp, Email)."""
    
    def __init__(self, group_id: str = "notification-dispatch-group"):
        super().__init__(
            topics=["notifications"],
            group_id=group_id
        )

    def process_message(self, event: EventEnvelope):
        """Processes and triggers SMS/Email/WhatsApp alerts."""
        payload = NotificationPayload(**event.payload)
        logger.info(
            f"[NotificationConsumer] Dispatching alert {payload.notification_id} "
            f"via channel {payload.channel} to {payload.contact_info} "
            f"| Title: '{payload.title}' | Message preview: '{payload.message[:40]}...'"
        )
        # Call third party integrations (Twilio, Sendgrid, etc.)
