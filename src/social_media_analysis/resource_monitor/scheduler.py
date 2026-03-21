"""
scheduler.py
============
Background scheduler for real time data updates.

Schedule:
    Every 1 hour   -> Fetch fresh AQI data from WAQI
    Every 24 hours -> Regenerate all district reports
    On startup     -> Load all static datasets if not in DB

Run alongside app.py:
    python scheduler.py

Or integrate into app.py startup:
    from scheduler import start_scheduler
    start_scheduler()
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "data_fetchers"))
sys.path.insert(0, os.path.dirname(__file__))


def job_fetch_aqi():
    """Fetch fresh AQI data every hour."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running AQI fetch...")
    try:
        from data_fetchers.aqi_fetcher import fetch_all_india_aqi
        count = fetch_all_india_aqi()
        print(f"  AQI updated for {count} cities")
    except Exception as e:
        print(f"  AQI fetch failed: {e}")


def job_fetch_weather():
    """Fetch live weather for all districts every 6 hours."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running weather fetch...")
    try:
        from data_fetchers.weather_fetcher import fetch_all_districts_weather
        count = fetch_all_districts_weather()
        print(f"  Weather updated for {count} districts")
    except Exception as e:
        print(f"  Weather fetch failed: {e}")


def job_fetch_ndvi():
    """Fetch NASA vegetation data every 16 days."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running NASA NDVI fetch...")
    try:
        from data_fetchers.ndvi_fetcher import fetch_all_districts_ndvi
        count = fetch_all_districts_ndvi()
        print(f"  NDVI updated for {count} districts")
    except Exception as e:
        print(f"  NDVI fetch failed: {e}")


def job_fetch_electricity():
    """Fetch live electricity generation data every 24 hours."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running electricity generation fetch...")
    try:
        from data_fetchers.electricity_fetcher import fetch_daily_generation
        result = fetch_daily_generation()
        print(f"  States: {result.get('states_parsed')}, Alerts: {result.get('alerts')}")
    except Exception as e:
        print(f"  Electricity fetch failed: {e}")


def job_generate_reports():
    """Regenerate all district reports every 24 hours."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running daily report generation...")
    try:
        from resource_monitor.report_generator import generate_all_reports
        count = generate_all_reports()
        print(f"  Reports generated for {count} districts")
    except Exception as e:
        print(f"  Report generation failed: {e}")


def load_static_data():
    """Load all static datasets into MongoDB on startup."""
    from pymongo import MongoClient
    import os
    from dotenv import load_dotenv
    load_dotenv()

    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
    db     = client["netravaah"]

    # Load hazard data
    if db["hazard_data"].count_documents({}) == 0:
        print("Loading hazard dataset...")
        try:
            from data_fetchers.hazard_loader import load_hazard_data
            load_hazard_data()
        except Exception as e:
            print(f"  Hazard load failed: {e}")
    else:
        print(f"Hazard data already loaded ({db['hazard_data'].count_documents({})} districts)")

    # Load electricity data
    if db["electricity_capacity"].count_documents({}) == 0:
        print("Loading electricity capacity data...")
        try:
            from data_fetchers.electricity_loader import load_electricity_data
            load_electricity_data()
        except Exception as e:
            print(f"  Electricity load failed: {e}")
    else:
        print(f"Electricity data already loaded ({db['electricity_capacity'].count_documents({})} states)")

    # Load crop data
    if db["crop_data"].count_documents({}) == 0:
        print("Loading crop data...")
        try:
            from data_fetchers.crop_loader import load_crop_data
            load_crop_data()
        except Exception as e:
            print(f"  Crop load failed: {e}")
    else:
        print(f"Crop data already loaded ({db['crop_data'].count_documents({})} districts)")

    client.close()


def job_run_ai_investigations():
    """
    Run AI agent investigations for all Critical and High severity districts.
    Runs every 24 hours after reports are generated.
    Investigates top 20 most critical districts across India.
    """
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running AI investigations...")
    try:
        from agentic_investigator import investigate_and_save
        from pymongo import MongoClient
        import os
        client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
        db     = client["netravaah"]

        # Get top 20 critical districts
        critical = list(db["resource_reports"].find(
            {"severity": {"$in": ["Critical", "High"]}},
            {"district": 1, "state": 1, "_id": 0}
        ).sort("issues_count", -1).limit(20))

        print(f"  Investigating {len(critical)} critical districts...")
        success = 0
        for d in critical:
            try:
                result = investigate_and_save(d["district"], d["state"])
                if "error" not in result:
                    success += 1
            except Exception as e:
                print(f"  Failed for {d['district']}: {e}")

        print(f"  AI investigations complete: {success}/{len(critical)} successful")
        client.close()
    except Exception as e:
        print(f"  AI investigation job failed: {e}")


def start_scheduler():
    """Start the background scheduler."""
    scheduler = BackgroundScheduler()

    # Fetch live weather every 6 hours
    scheduler.add_job(
        job_fetch_weather,
        trigger=IntervalTrigger(hours=6),
        id="weather_fetch",
        name="Fetch Live Weather",
        replace_existing=True,
    )

    # Fetch NASA NDVI every 16 days
    scheduler.add_job(
        job_fetch_ndvi,
        trigger=IntervalTrigger(days=16),
        id="ndvi_fetch",
        name="Fetch NASA NDVI",
        replace_existing=True,
    )

    # Fetch electricity generation every 24 hours
    scheduler.add_job(
        job_fetch_electricity,
        trigger=IntervalTrigger(hours=24),
        id="electricity_fetch",
        name="Fetch Electricity Generation",
        replace_existing=True,
    )

    # Fetch AQI every 1 hour
    scheduler.add_job(
        job_fetch_aqi,
        trigger=IntervalTrigger(hours=1),
        id="aqi_fetch",
        name="Fetch AQI Data",
        replace_existing=True,
    )

    # Generate reports every 24 hours
    scheduler.add_job(
        job_generate_reports,
        trigger=IntervalTrigger(hours=24),
        id="report_generation",
        name="Generate District Reports",
        replace_existing=True,
    )

    # Run AI investigations every 24 hours (after reports generated)
    scheduler.add_job(
        job_run_ai_investigations,
        trigger=IntervalTrigger(hours=24),
        id="ai_investigations",
        name="AI Agent Investigations",
        replace_existing=True,
    )

    scheduler.start()
    print("Scheduler started:")
    print("  Weather         -> every 6 hours (Open-Meteo)")
    print("  NDVI            -> every 16 days (NASA POWER)")
    print("  Electricity     -> every 24 hours (NPP)")
    print("  AQI fetch       -> every 1 hour (WAQI)")
    print("  Reports         -> every 24 hours")
    print("  AI Investigate  -> every 24 hours (Groq agentic)")
    print("  Reports      -> every 24 hours")
    return scheduler


if __name__ == "__main__":
    import time

    print("=" * 50)
    print("NETRAVAAH Scheduler")
    print("=" * 50)

    # Load static data first
    print("\nStep 1: Loading static datasets...")
    load_static_data()

    # Fetch weather immediately on startup
    print("\nStep 3: Initial weather fetch...")
    job_fetch_weather()

    # Fetch NDVI immediately on startup
    print("\nStep 4: Initial NASA NDVI fetch (takes a few minutes)...")
    job_fetch_ndvi()

    # Fetch AQI immediately on startup
    print("\nStep 5: Initial AQI fetch...")
    job_fetch_aqi()

    # Fetch electricity immediately on startup
    print("\nStep 6: Initial electricity generation fetch...")
    job_fetch_electricity()

    # Start scheduler
    print("\nStep 7: Starting scheduler...")
    scheduler = start_scheduler()

    print("\nScheduler running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        scheduler.shutdown()
        print("\nScheduler stopped.")
