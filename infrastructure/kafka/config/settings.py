import os
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class KafkaConfig(BaseModel):
    # Broker Config
    BOOTSTRAP_SERVERS: str = Field(default_factory=lambda: os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092"))
    SCHEMA_REGISTRY_URL: str = Field(default_factory=lambda: os.environ.get("KAFKA_SCHEMA_REGISTRY_URL", "http://localhost:8081"))
    CLIENT_ID: str = Field(default_factory=lambda: os.environ.get("KAFKA_CLIENT_ID", "netravaah-kafka-core"))
    DEFAULT_GROUP_ID: str = Field(default_factory=lambda: os.environ.get("KAFKA_DEFAULT_GROUP_ID", "netravaah-consumer-group"))
    
    # Producer high-throughput & safety tuning
    PRODUCER_ACKS: str = Field(default_factory=lambda: os.environ.get("KAFKA_PRODUCER_ACKS", "all"))
    PRODUCER_RETRIES: int = Field(default_factory=lambda: int(os.environ.get("KAFKA_PRODUCER_RETRIES", "5")))
    PRODUCER_LINGER_MS: int = Field(default_factory=lambda: int(os.environ.get("KAFKA_PRODUCER_LINGER_MS", "10")))
    PRODUCER_BATCH_SIZE: int = Field(default_factory=lambda: int(os.environ.get("KAFKA_PRODUCER_BATCH_SIZE", "65536"))) # 64KB
    PRODUCER_COMPRESSION_TYPE: str = Field(default_factory=lambda: os.environ.get("KAFKA_PRODUCER_COMPRESSION_TYPE", "snappy"))
    
    # Consumer tuning
    CONSUMER_AUTO_OFFSET_RESET: str = Field(default_factory=lambda: os.environ.get("KAFKA_CONSUMER_AUTO_OFFSET_RESET", "earliest"))
    CONSUMER_ENABLE_AUTO_COMMIT: bool = Field(default_factory=lambda: os.environ.get("KAFKA_CONSUMER_ENABLE_AUTO_COMMIT", "false").lower() == "true")
    CONSUMER_MAX_POLL_RECORDS: int = Field(default_factory=lambda: int(os.environ.get("KAFKA_CONSUMER_MAX_POLL_RECORDS", "500")))
    
    # Retry strategy tuning
    MAX_RETRY_ATTEMPTS: int = Field(default_factory=lambda: int(os.environ.get("KAFKA_MAX_RETRY_ATTEMPTS", "3")))
    RETRY_INITIAL_INTERVAL: float = Field(default_factory=lambda: float(os.environ.get("KAFKA_RETRY_INITIAL_INTERVAL", "1.0"))) # seconds
    RETRY_BACKOFF_COEFF: float = Field(default_factory=lambda: float(os.environ.get("KAFKA_RETRY_BACKOFF_COEFF", "2.0")))
    
    # DLQ Config
    DLQ_ENABLED: bool = Field(default_factory=lambda: os.environ.get("KAFKA_DLQ_ENABLED", "true").lower() == "true")

# Singleton instance
settings = KafkaConfig()
