"""
Model 2 — District Case Aggregation Engine
Converts community disease reports into real-time district disease counts
Aggregation windows: 1 day, 3 days, 7 days
"""

import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass

from .settings import GOVERNANCE_DATASET, AGGREGATION_WINDOWS

logger = logging.getLogger(__name__)


class CaseRecord:
    def __init__(self, district, state, disease, cases, deaths, recoveries, timestamp, source, lat=None, lon=None, confidence=1.0):
        self.district = district
        self.state = state
        self.disease = disease
        self.cases = cases
        self.deaths = deaths
        self.recoveries = recoveries
        self.timestamp = timestamp
        self.source = source  # "community" | "idsp" | "hospital"
        self.lat = lat
        self.lon = lon
        self.confidence = confidence


class DistrictDiseaseSummary:
    def __init__(self, district, state, disease, reported_cases_today, reported_cases_3day, reported_cases_7day, active_cases, deaths, recoveries, trend, trend_pct, last_updated, population=None, incidence_rate=None):
        self.district = district
        self.state = state
        self.disease = disease
        self.reported_cases_today = reported_cases_today
        self.reported_cases_3day = reported_cases_3day
        self.reported_cases_7day = reported_cases_7day
        self.active_cases = active_cases
        self.deaths = deaths
        self.recoveries = recoveries
        self.trend = trend  # "RISING" | "FALLING" | "STABLE"
        self.trend_pct = trend_pct
        self.last_updated = last_updated
        self.population = population
        self.incidence_rate = incidence_rate  # per 100k


class DistrictCaseAggregator:
    """
    Real-time district-level disease case aggregation.
    Combines IDSP data, hospital records, and community reports.
    """

    def __init__(self):
        self._records = []
        self._district_population = {}
        self._load_baseline_data()

    def _load_baseline_data(self):
        """Load population and baseline disease data from governance dataset"""
        try:
            df = pd.read_csv(GOVERNANCE_DATASET)

            # Build district population lookup
            for _, row in df.iterrows():
                district = str(row.get('state_or_region', '')).strip()
                pop = row.get('population_persons', 0)
                if district and pd.notna(pop) and float(pop) > 0:
                    self._district_population[district] = int(pop)

            # Load historical baseline cases as seed records
            seed_records = []
            for _, row in df.head(2000).iterrows():
                district = str(row.get('state_or_region', '')).strip()
                disease = str(row.get('predicted_disease', '')).strip()
                cases = int(row.get('cases', 0)) if pd.notna(row.get('cases')) else 0
                deaths = int(row.get('deaths', 0)) if pd.notna(row.get('deaths')) else 0
                recoveries = int(row.get('recoveries', 0)) if pd.notna(row.get('recoveries')) else 0

                if district and disease and disease != 'nan' and cases > 0:
                    # Distribute over last 7 days as historical baseline
                    for offset in range(7):
                        partial_cases = max(1, cases // 7)
                        seed_records.append(CaseRecord(
                            district=district,
                            state=district,
                            disease=disease,
                            cases=partial_cases,
                            deaths=deaths // 7,
                            recoveries=recoveries // 7,
                            timestamp=datetime.now() - timedelta(days=offset),
                            source="idsp_baseline",
                            confidence=0.9
                        ))

            self._records.extend(seed_records)
            logger.info("Loaded {} baseline case records for {} districts".format(len(seed_records), len(self._district_population)))

        except Exception as e:
            logger.warning("Could not load baseline data: {}".format(e))

    def add_case(self, record):
        """Add a new case record (from community post, hospital, or IDSP)"""
        self._records.append(record)
        logger.debug("Added case: {} | {} | {}".format(record.district, record.disease, record.cases))

    def add_cases_bulk(self, records):
        """Bulk insert case records"""
        self._records.extend(records)
        logger.info("Bulk added {} case records".format(len(records)))

    def get_district_summary(self, district, disease=None):
        """Get aggregated summary for a district (optionally filtered by disease)"""

        now = datetime.now()
        cutoffs = {
            "1day": now - timedelta(days=1),
            "3day": now - timedelta(days=3),
            "7day": now - timedelta(days=7),
        }

        # Filter records
        records = [r for r in self._records if r.district == district]
        if disease:
            records = [r for r in records if r.disease == disease]

        # Group by disease
        disease_records = defaultdict(list)
        for r in records:
            disease_records[r.disease].append(r)

        summaries = []
        for dis, recs in disease_records.items():
            # Count by window
            c1 = sum(r.cases for r in recs if r.timestamp >= cutoffs["1day"])
            c3 = sum(r.cases for r in recs if r.timestamp >= cutoffs["3day"])
            c7 = sum(r.cases for r in recs if r.timestamp >= cutoffs["7day"])
            deaths = sum(r.deaths for r in recs if r.timestamp >= cutoffs["7day"])
            recoveries = sum(r.recoveries for r in recs if r.timestamp >= cutoffs["7day"])

            # Active = total 7day - deaths - recoveries
            active = max(0, c7 - deaths - recoveries)

            # Trend: compare last 3 days vs prior 3 days
            prior_3 = sum(
                r.cases for r in recs
                if cutoffs["7day"] <= r.timestamp < cutoffs["3day"]
            )
            trend_pct = 0.0
            trend = "STABLE"
            if prior_3 > 0:
                trend_pct = ((c3 - prior_3) / prior_3) * 100
                if trend_pct > 10:
                    trend = "RISING"
                elif trend_pct < -10:
                    trend = "FALLING"

            # Incidence rate
            pop = self._district_population.get(district, 1000000)
            incidence = (c7 / pop) * 100000 if pop > 0 else 0

            summaries.append(DistrictDiseaseSummary(
                district=district,
                state=recs[0].state if recs else "",
                disease=dis,
                reported_cases_today=c1,
                reported_cases_3day=c3,
                reported_cases_7day=c7,
                active_cases=active,
                deaths=deaths,
                recoveries=recoveries,
                trend=trend,
                trend_pct=round(trend_pct, 1),
                last_updated=now,
                population=pop,
                incidence_rate=round(incidence, 2)
            ))

        return sorted(summaries, key=lambda x: x.reported_cases_7day, reverse=True)

    def get_all_districts_snapshot(self, disease=None, window_days=7):
        """Get a full district-by-district snapshot as DataFrame"""

        now = datetime.now()
        cutoff = now - timedelta(days=window_days)

        rows = []
        districts = set(r.district for r in self._records)

        for district in districts:
            records = [
                r for r in self._records
                if r.district == district and r.timestamp >= cutoff
            ]
            if disease:
                records = [r for r in records if r.disease == disease]

            if not records:
                continue

            disease_groups = defaultdict(list)
            for r in records:
                disease_groups[r.disease].append(r)

            for dis, recs in disease_groups.items():
                total_cases = sum(r.cases for r in recs)
                total_deaths = sum(r.deaths for r in recs)
                pop = self._district_population.get(district, 1000000)
                incidence = (total_cases / pop) * 100000 if pop > 0 else 0

                rows.append({
                    "district": district,
                    "disease": dis,
                    "cases_{}day".format(window_days): total_cases,
                    "deaths": total_deaths,
                    "incidence_per_100k": round(incidence, 2),
                    "population": pop,
                })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.sort_values("cases_{}day".format(window_days), ascending=False)
        return df

    def get_top_disease_districts(self, disease, top_n=10):
        """Get top N districts with most cases for a specific disease"""
        df = self.get_all_districts_snapshot(disease=disease)
        if df.empty:
            return df
        col = [c for c in df.columns if 'cases_' in c][0]
        return df.nlargest(top_n, col)

    def get_disease_timeseries(self, district, disease, days=30):
        """Get daily case counts for time-series analysis"""

        now = datetime.now()
        records = [
            r for r in self._records
            if r.district == district
            and r.disease == disease
            and r.timestamp >= now - timedelta(days=days)
        ]

        if not records:
            return pd.DataFrame()

        # Group by date
        daily = defaultdict(int)
        for r in records:
            day = r.timestamp.date()
            daily[day] += r.cases

        # Fill missing days with 0
        dates = pd.date_range(
            start=now.date() - timedelta(days=days),
            end=now.date(),
            freq='D'
        )
        series = pd.DataFrame({
            "date": dates,
            "cases": [daily.get(d.date(), 0) for d in dates]
        })
        series["district"] = district
        series["disease"] = disease
        series["cases_lag1"] = series["cases"].shift(1).fillna(0)
        series["cases_lag2"] = series["cases"].shift(2).fillna(0)
        series["cases_7day_avg"] = series["cases"].rolling(7, min_periods=1).mean()

        return series


# ─── TEST ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    agg = DistrictCaseAggregator()

    # Add some test records
    from datetime import datetime, timedelta
    for i in range(10):
        agg.add_case(CaseRecord(
            district="Lucknow",
            state="Uttar Pradesh",
            disease="Dengue",
            cases=np.random.randint(1, 20),
            deaths=0,
            recoveries=np.random.randint(0, 5),
            timestamp=datetime.now() - timedelta(hours=i * 6),
            source="community"
        ))

    summaries = agg.get_district_summary("Lucknow")
    for s in summaries[:3]:
        print(" {} | {} | Today: {} | 7day: {} | Trend: {} ({}%)".format(s.district, s.disease, s.reported_cases_today, s.reported_cases_7day, s.trend, s.trend_pct))
