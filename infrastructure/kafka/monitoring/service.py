import time
import logging
from typing import Dict, Any, List, Optional
from confluent_kafka import Consumer, TopicPartition
from confluent_kafka.admin import AdminClient
from ..config.settings import settings

logger = logging.getLogger(__name__)

class KafkaMonitoringService:
    """
    Monitoring service for Apache Kafka in the NETRAVAAH platform.
    Tracks consumer group lag, messages throughput, and operational health.
    """
    def __init__(self):
        self.admin_client_config = {
            "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
            "client.id": f"{settings.CLIENT_ID}-monitor"
        }
        
        try:
            self.admin_client = AdminClient(self.admin_client_config)
            logger.info("Kafka Monitoring AdminClient initialized.")
        except Exception as e:
            logger.error(f"Failed to create monitoring AdminClient: {e}")
            self.admin_client = None

        # Metrics state counters
        self.metrics_state: Dict[str, Any] = {
            "messages_processed": 0,
            "failed_messages": 0,
            "start_time": time.time()
        }

    def increment_processed(self, count: int = 1):
        """Increments processed message counter."""
        self.metrics_state["messages_processed"] += count

    def increment_failed(self, count: int = 1):
        """Increments failed message counter."""
        self.metrics_state["failed_messages"] += count

    def get_throughput_metrics(self) -> Dict[str, Any]:
        """Calculates and returns messages per second throughput since service start."""
        elapsed_time = time.time() - self.metrics_state["start_time"]
        processed = self.metrics_state["messages_processed"]
        failed = self.metrics_state["failed_messages"]
        
        messages_per_sec = processed / elapsed_time if elapsed_time > 0 else 0.0
        
        return {
            "elapsed_seconds": round(elapsed_time, 2),
            "total_messages_processed": processed,
            "total_failed_messages": failed,
            "average_messages_per_second": round(messages_per_sec, 2),
            "failure_rate_percentage": round((failed / processed * 100) if processed > 0 else 0.0, 2)
        }

    def get_consumer_lag(self, consumer_group: str, topics: List[str]) -> Dict[str, Any]:
        """
        Calculates consumer group lag for specified topics.
        Calculates the difference between the high watermarks and committed offsets.
        """
        lag_report: Dict[str, Any] = {
            "consumer_group": consumer_group,
            "topics": {},
            "total_lag": 0
        }

        if self.admin_client is None:
            logger.error("AdminClient not initialized. Cannot fetch lag.")
            return {"error": "AdminClient unavailable"}

        # We initialize a temporary consumer to fetch committed offsets
        temp_consumer_conf = {
            "bootstrap.servers": settings.BOOTSTRAP_SERVERS,
            "group.id": consumer_group,
            "enable.auto.commit": False
        }
        
        try:
            temp_consumer = Consumer(temp_consumer_conf)
        except Exception as e:
            logger.error(f"Failed to initialize temp consumer to check lag: {e}")
            return {"error": f"Failed to initialize consumer: {e}"}

        try:
            # Get list of partitions from broker metadata
            metadata = temp_consumer.list_topics(timeout=5.0)
            
            partitions_to_query: List[TopicPartition] = []
            
            for topic_name in topics:
                topic_meta = metadata.topics.get(topic_name)
                if not topic_meta:
                    logger.warning(f"Topic '{topic_name}' not found in cluster metadata.")
                    continue
                
                for partition_id in topic_meta.partitions.keys():
                    partitions_to_query.append(TopicPartition(topic_name, partition_id))

            if not partitions_to_query:
                return lag_report

            # Fetch committed offsets for partitions
            committed_partitions = temp_consumer.committed(partitions_to_query, timeout=5.0)
            
            for tp in committed_partitions:
                topic = tp.topic
                partition = tp.partition
                committed_offset = tp.offset

                # Query low and high watermarks
                try:
                    low_watermark, high_watermark = temp_consumer.get_watermark_offsets(tp, timeout=5.0)
                except Exception as e:
                    logger.error(f"Failed to get watermarks for topic {topic} [{partition}]: {e}")
                    continue

                # Lag is high_watermark - committed_offset
                # If no offset has been committed yet, the committed_offset is negative (-1001 / OFFSET_INVALID)
                if committed_offset < 0:
                    # Lag is high_watermark - low_watermark
                    lag = high_watermark - low_watermark
                    committed_offset = None
                else:
                    lag = max(0, high_watermark - committed_offset)

                if topic not in lag_report["topics"]:
                    lag_report["topics"][topic] = {"partitions": [], "topic_lag": 0}

                lag_report["topics"][topic]["partitions"].append({
                    "partition": partition,
                    "committed_offset": committed_offset,
                    "high_watermark": high_watermark,
                    "lag": lag
                })
                lag_report["topics"][topic]["topic_lag"] += lag
                lag_report["total_lag"] += lag

        except Exception as e:
            logger.error(f"Error calculating consumer lag: {e}")
            return {"error": str(e)}
        finally:
            temp_consumer.close()

        return lag_report

    def get_cluster_status(self) -> Dict[str, Any]:
        """Queries broker cluster nodes to assess core connection health."""
        if self.admin_client is None:
            return {"status": "UNHEALTHY", "reason": "AdminClient not initialized"}
            
        try:
            metadata = self.admin_client.list_topics(timeout=5.0)
            brokers = [
                {"id": b.id, "host": b.host, "port": b.port}
                for b in metadata.brokers.values()
            ]
            return {
                "status": "HEALTHY",
                "cluster_id": metadata.cluster_id,
                "brokers": brokers,
                "topics_count": len(metadata.topics)
            }
        except Exception as e:
            return {"status": "UNHEALTHY", "reason": str(e)}
