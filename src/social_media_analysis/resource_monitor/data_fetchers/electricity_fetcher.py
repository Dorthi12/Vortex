"""
electricity_fetcher.py
======================
Fetches live daily electricity generation data from
National Power Portal (npp.gov.in).

URL Pattern (discovered from actual NPP website):
    https://npp.gov.in/public-reports/cea/daily/dgr/DD-MM-YYYY/dgr3-YYYY-MM-DD.xls

Report 03 = All India Summary Report
    -> State wise installed capacity vs actual generation today

Run manually:
    python data_fetchers/electricity_fetcher.py

Called by scheduler every 24 hours automatically.

What it detects:
    Installed capacity (MW) vs Actual generation today (MU)
    Big gap = underutilization = possible mismanagement
"""

import requests
import pandas as pd
import io
import os
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
_db     = _client["netravaah"]
_col    = _db["electricity_generation"]   # live daily data
_cap    = _db["electricity_capacity"]     # static installed capacity


# NPP URL pattern
# DD-MM-YYYY in folder, YYYY-MM-DD in filename
NPP_URL = (
    "https://npp.gov.in/public-reports/cea/daily/dgr"
    "/{dd}-{mm}-{yyyy}"
    "/dgr3-{yyyy}-{mm}-{dd}.xls"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": "https://npp.gov.in/publishedReports",
}


def build_url(date: datetime) -> str:
    """Build NPP download URL for a given date."""
    return NPP_URL.format(
        dd   = date.strftime("%d"),
        mm   = date.strftime("%m"),
        yyyy = date.strftime("%Y"),
    )


def download_xls(date: datetime) -> bytes | None:
    """
    Download the XLS file for a given date.
    Tries the given date, then goes back up to 3 days
    (in case of weekends or holidays with no report).
    """
    for days_back in range(4):
        target = date - timedelta(days=days_back)
        url    = build_url(target)
        print(f"  Trying: {url}")
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            if response.status_code == 200 and len(response.content) > 1000:
                print(f"  Downloaded {len(response.content)} bytes for {target.strftime('%d-%m-%Y')}")
                return response.content, target
        except requests.RequestException as e:
            print(f"  Failed ({e})")

    print("  Could not download for any of the last 4 days")
    return None, None


def parse_all_india_summary(xls_bytes: bytes, report_date: datetime) -> list:
    """
    Parse the All India Summary Report (Report 03) XLS.

    The XLS has these columns (based on NPP report structure):
        Region / State name
        Installed Capacity (MW)
        Today's Generation (MU - Million Units)
        Programme (scheduled generation)
        Achievement

    Returns list of dicts, one per state.
    """
    try:
        # Try reading as XLS (old Excel format)
        df = pd.read_excel(io.BytesIO(xls_bytes), header=None, engine="xlrd")
    except Exception:
        try:
            df = pd.read_excel(io.BytesIO(xls_bytes), header=None, engine="openpyxl")
        except Exception as e:
            print(f"  Could not parse XLS: {e}")
            return []

    print(f"  Raw XLS shape: {df.shape}")
    print(f"  First 10 rows:\n{df.head(10).to_string()}")

    records = []

    # Find header row - look for "State" or "Installed" keyword
    header_row = None
    for i, row in df.iterrows():
        row_str = " ".join(str(v) for v in row.values).lower()
        if "installed" in row_str or "capacity" in row_str:
            header_row = i
            break

    if header_row is None:
        print("  Could not find header row, using row 0")
        header_row = 0

    # Re-read with correct header
    df = pd.read_excel(
        io.BytesIO(xls_bytes),
        header    = header_row,
        engine    = "xlrd",
    )
    df.columns = [str(c).strip() for c in df.columns]
    print(f"  Columns: {df.columns.tolist()}")

    # Find state name column and numeric columns
    state_col   = None
    capacity_col = None
    generation_col = None

    for col in df.columns:
        col_lower = col.lower()
        if any(k in col_lower for k in ["state", "utility", "region", "name"]):
            state_col = col
        if any(k in col_lower for k in ["installed", "capacity"]):
            capacity_col = col
        if any(k in col_lower for k in ["actual", "generation", "today", "achiev"]):
            generation_col = col

    print(f"  Detected: state={state_col}, capacity={capacity_col}, generation={generation_col}")

    if not state_col:
        # Fallback: assume first column is state name
        state_col = df.columns[0]

    # Known Indian states to filter rows
    INDIAN_STATES = {
        "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
        "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
        "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
        "nagaland", "odisha", "orissa", "punjab", "rajasthan", "sikkim", "tamil nadu",
        "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
        "delhi", "jammu", "ladakh", "chandigarh",
    }

    for _, row in df.iterrows():
        state_raw = str(row.get(state_col, "")).strip()
        if not state_raw or state_raw.lower() in ["nan", "total", "grand total", ""]:
            continue

        # Check if this row is a state
        state_lower = state_raw.lower()
        matched_state = None
        for s in INDIAN_STATES:
            if s in state_lower or state_lower in s:
                matched_state = state_raw
                break

        if not matched_state:
            continue

        # Extract numeric values safely
        def safe_float(val):
            try:
                return float(str(val).replace(",", "").strip())
            except Exception:
                return None

        capacity   = safe_float(row.get(capacity_col))   if capacity_col   else None
        generation = safe_float(row.get(generation_col)) if generation_col else None

        # Calculate utilization
        utilization = None
        if capacity and generation and capacity > 0:
            # Generation is in MU (million units = MWh)
            # Capacity is in MW
            # Expected daily generation = capacity * 24 hours / 1000 (to MU)
            expected_mu = capacity * 24 / 1000
            utilization = round(generation / expected_mu * 100, 1) if expected_mu > 0 else None

        records.append({
            "state":            state_raw,
            "installed_mw":     capacity,
            "generation_mu":    generation,
            "utilization_pct":  utilization,
            "report_date":      report_date.strftime("%Y-%m-%d"),
            "fetched_at":       datetime.utcnow().isoformat(),
            "underutilized":    utilization < 60 if utilization else False,
        })

    print(f"  Parsed {len(records)} states")
    return records


def detect_electricity_mismanagement(records: list) -> list:
    """
    Compare actual generation vs installed capacity.
    Flag states where generation is significantly below capacity.

    Thresholds:
        < 40% utilization = Critical underutilization
        40-60%            = Moderate underutilization
        > 60%             = Normal (plants need maintenance etc.)
    """
    alerts = []
    for r in records:
        u = r.get("utilization_pct")
        if u is None:
            continue

        if u < 40:
            severity = "Critical"
            reason   = f"Only {u}% capacity being used — severe underutilization"
        elif u < 60:
            severity = "High"
            reason   = f"{u}% capacity utilization — below acceptable range"
        else:
            continue

        alerts.append({
            "state":           r["state"],
            "severity":        severity,
            "utilization_pct": u,
            "installed_mw":    r["installed_mw"],
            "generation_mu":   r["generation_mu"],
            "reason":          reason,
            "date":            r["report_date"],
        })

    alerts.sort(key=lambda x: x["utilization_pct"])
    return alerts


def save_to_mongodb(records: list):
    """Save generation records to MongoDB."""
    if not records:
        return

    ops = [
        UpdateOne(
            {"state": r["state"], "report_date": r["report_date"]},
            {"$set": r},
            upsert=True,
        )
        for r in records
    ]
    result = _col.bulk_write(ops)
    _col.create_index([("state", 1), ("report_date", -1)])
    print(f"  Saved {result.upserted_count} new + {result.modified_count} updated records")


def fetch_daily_generation(date: datetime = None) -> dict:
    """
    Main function: fetch, parse, save and detect mismanagement.
    Called by scheduler every 24 hours.
    """
    if date is None:
        date = datetime.now()

    print(f"\nFetching NPP Daily Generation Report for {date.strftime('%d-%m-%Y')}...")

    xls_bytes, report_date = download_xls(date)
    if not xls_bytes:
        return {"error": "Could not download report", "date": date.strftime("%Y-%m-%d")}

    records = parse_all_india_summary(xls_bytes, report_date)
    if not records:
        return {"error": "Could not parse XLS", "date": report_date.strftime("%Y-%m-%d")}

    save_to_mongodb(records)

    alerts = detect_electricity_mismanagement(records)

    # Save alerts to MongoDB too
    if alerts:
        _db["electricity_alerts"].insert_many(alerts)
        print(f"  {len(alerts)} mismanagement alerts saved")

    return {
        "date":          report_date.strftime("%Y-%m-%d"),
        "states_parsed": len(records),
        "alerts":        len(alerts),
        "critical":      [a for a in alerts if a["severity"] == "Critical"],
    }


def get_state_generation(state: str, days: int = 7) -> list:
    """Get last N days of generation data for a state."""
    return list(_col.find(
        {"state": {"$regex": state, "$options": "i"}},
        {"_id": 0}
    ).sort("report_date", -1).limit(days))


def get_underutilized_states(date: str = None) -> list:
    """Get all underutilized states for a date."""
    query = {"underutilized": True}
    if date:
        query["report_date"] = date
    return list(_col.find(query, {"_id": 0}).sort("utilization_pct", 1))


if __name__ == "__main__":
    result = fetch_daily_generation()
    print("\nResult:")
    print(f"  States parsed: {result.get('states_parsed')}")
    print(f"  Alerts:        {result.get('alerts')}")

    if result.get("critical"):
        print("\nCritical states (severe underutilization):")
        for a in result["critical"]:
            print(f"  {a['state']}: {a['utilization_pct']}% utilization")
