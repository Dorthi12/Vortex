import logging
from typing import Dict, Any, List
from confluent_kafka.admin import AdminClient, NewTopic
from ..config.settings import settings

logger = logging.getLogger(__name__)

# Topic specifications: partition counts, replication factors, and topic-level configs.
# Higher partitions for higher volume topics.
TOPICS: Dict[str, Dict[str, Any]] = {
    # Citizen interactions (High transactional volume)
    "citizen-complaints": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "604800000"}}, # 7 days retention
    "citizen-feedback": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "604800000"}},
    
    # Governance & Policy (Compacted to ensure latest version is retained)
    "policy-updates": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "compact"}},
    "scheme-updates": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "compact"}},
    "agent-votes": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "172800000"}}, # 2 days
    "governance-decisions": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "compact"}},
    "resource-allocation": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "604800000"}},
    
    # Early Warnings & Health Incidents
    "weather-events": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "259200000"}}, # 3 days
    "hazard-alerts": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "1209600000"}}, # 14 days
    "health-events": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "1209600000"}},
    "disease-outbreaks": {"partitions": 6, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "2592000000"}}, # 30 days
    
    # Domain specific
    "crop-updates": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "604800000"}},
    "soil-updates": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "604800000"}},
    
    # Platform utility
    "notifications": {"partitions": 12, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "259200000"}}, # 3 days
    "audit-events": {"partitions": 12, "replication_factor": 3, "config": {"cleanup.policy": "compact"}},
    
    # Dead Letter Queues (DLQs)
    "dlq-complaints": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "2592000000"}}, # 30 days
    "dlq-health": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "2592000000"}},
    "dlq-hazard": {"partitions": 3, "replication_factor": 3, "config": {"cleanup.policy": "delete", "retention.ms": "2592000000"}},
}

def get_admin_client() -> AdminClient:
    """Initializes and returns the Confluent Kafka AdminClient."""
    conf = {
        "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
        "client.id": f"{settings.CLIENT_ID}-admin"
    }
    return AdminClient(conf)

def initialize_topics(admin_client: Optional[AdminClient] = None) -> List[str]:
    """
    Creates any missing topics defined in the registry.
    Returns a list of topics that were successfully created or already existed.
    """
    if admin_client is None:
        try:
            admin_client = get_admin_client()
        except Exception as e:
            logger.error(f"Failed to create AdminClient: {e}")
            return []
            
    # Fetch existing metadata to check which topics already exist
    try:
        cluster_metadata = admin_client.list_topics(timeout=10.0)
        existing_topics = set(cluster_metadata.topics.keys())
    except Exception as e:
        logger.error(f"Failed to fetch metadata from brokers: {e}")
        return []

    new_topics: List[NewTopic] = []
    created_topics: List[str] = []

    for name, spec in TOPICS.items():
        if name in existing_topics:
            logger.info(f"Topic '{name}' already exists.")
            created_topics.append(name)
            continue
            
        new_topics.append(NewTopic(
            topic=name,
            num_partitions=spec["partitions"],
            replication_factor=spec["replication_factor"],
            config=spec.get("config", {})
        ))

    if new_topics:
        logger.info(f"Attempting to create {len(new_topics)} new topics...")
        futures = admin_client.create_topics(new_topics)
        
        for topic_name, future in futures.items():
            try:
                future.result() # Blocks until topic creation succeeds or fails
                logger.info(f"Topic '{topic_name}' created successfully.")
                created_topics.append(topic_name)
            except Exception as e:
                logger.error(f"Failed to create topic '{topic_name}': {e}")
                
    return created_topics
