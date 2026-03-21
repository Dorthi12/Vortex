"""
fairness_scheduler.py
=====================
Background scheduler for the autonomous fairness system.

Schedule:
    Every 1 hour  → run_autonomous_cycle()
                    (monitoring + self healing + followup)
    Every 24 hours → auto_detect_resolutions()
                    (auto close timed out complaints)
    Every 24 hours → run_full_bias_check()
                    (statistical bias report)

Run:
    python fairness_scheduler.py
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import time
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))


def job_autonomous_cycle():
    """Run complete autonomous cycle every hour."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running autonomous fairness cycle...")
    try:
        from autonomous_fairness_system import run_autonomous_cycle
        result = run_autonomous_cycle()
        print(f"  Status:      {result.get('overall_status')}")
        print(f"  Lang bias:   {result.get('monitoring', {}).get('language_bias_pct')}%")
        print(f"  Corrections: {result.get('self_healing', {}).get('complaints_fixed', 0)}")
        print(f"  Followups:   {result.get('followup', {}).get('followups_sent', 0)}")
    except Exception as e:
        print(f"  Autonomous cycle failed: {e}")


def job_auto_detect_resolutions():
    """Auto detect and close timed out complaints every 24 hours."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running auto resolution detection...")
    try:
        from resolution_tracker import auto_detect_resolutions
        result = auto_detect_resolutions()
        print(f"  Auto resolved: {result.get('auto_resolved')}")
        print(f"  Escalated:     {result.get('escalated')}")
        print(f"  Auto closed:   {result.get('auto_closed')}")
    except Exception as e:
        print(f"  Auto detection failed: {e}")


def job_statistical_bias_check():
    """Run full statistical bias check every 24 hours."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running statistical bias check...")
    try:
        from bias_detector import run_full_bias_check
        result = run_full_bias_check(days=30)
        print(f"  Biases found: {result.get('total_biases')}")
        print(f"  Severity:     {result.get('overall_severity')}")
    except Exception as e:
        print(f"  Bias check failed: {e}")


def start_scheduler():
    scheduler = BackgroundScheduler()

    # Autonomous cycle every 1 hour
    scheduler.add_job(
        job_autonomous_cycle,
        trigger=IntervalTrigger(hours=1),
        id="autonomous_cycle",
        name="Autonomous Fairness Cycle",
        replace_existing=True,
    )

    # Auto resolution detection every 24 hours
    scheduler.add_job(
        job_auto_detect_resolutions,
        trigger=IntervalTrigger(hours=24),
        id="auto_detection",
        name="Auto Resolution Detection",
        replace_existing=True,
    )

    # Statistical bias check every 24 hours
    scheduler.add_job(
        job_statistical_bias_check,
        trigger=IntervalTrigger(hours=24),
        id="bias_check",
        name="Statistical Bias Check",
        replace_existing=True,
    )

    scheduler.start()
    print("Fairness Scheduler started:")
    print("  Autonomous cycle  → every 1 hour")
    print("  Auto resolution   → every 24 hours")
    print("  Statistical check → every 24 hours")
    return scheduler


if __name__ == "__main__":
    print("=" * 50)
    print("NETRAVAAH Fairness Scheduler")
    print("=" * 50)

    # Run immediately on startup
    print("\nStep 1: Initial autonomous cycle...")
    job_autonomous_cycle()

    print("\nStep 2: Initial resolution detection...")
    job_auto_detect_resolutions()

    print("\nStep 3: Starting scheduler...")
    scheduler = start_scheduler()

    print("\nScheduler running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        scheduler.shutdown()
        print("\nScheduler stopped.")
