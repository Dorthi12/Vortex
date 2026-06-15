# health/models/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/disease_intel")

# Fallback SQLite path
SQLITE_URL = "sqlite:///c:/Users/d12ra/Vortex/health/health_governance.db"

# Establish connection with postgres first, fallback to sqlite if connection fails
try:
    print(f"Connecting to database at {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 2})
    # Test connection
    with engine.connect() as conn:
        print("[OK] Connected to PostgreSQL successfully.")
except Exception as e:
    print(f"[WARNING] PostgreSQL connection failed: {e}")
    print(f"Falling back to local SQLite database: {SQLITE_URL}")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
