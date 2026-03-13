"""
=============================================================================
INDIA INFRASTRUCTURE RISK ANALYSER
=============================================================================
Loads the collected CSVs and produces:
  • Summary statistics per category
  • Risk distribution tables
  • Top-N repair-priority lists
  • Age vs Risk correlation
  • State-wise risk breakdown
  • Export to Excel (multi-sheet)

Usage:
  python analyse_infrastructure.py
  python analyse_infrastructure.py --data ./outputs
  python analyse_infrastructure.py --excel
  python analyse_infrastructure.py --top 50
=============================================================================
"""

import os
import sys
import argparse
import logging
from pathlib import Path

import pandas as pd
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("InfraAnalyser")

RISK_ORDER = ["Low", "Medium", "High", "Critical"]


def load_datasets(data_dir: Path) -> dict:
    cats = ["highways", "bridges", "railways", "hospitals", "power_plants", "master"]
    dfs = {}
    for c in cats:
        p = data_dir / f"india_{c}.csv"
        if p.exists():
            df = pd.read_csv(p, low_memory=False)
            dfs[c] = df
            log.info(f"  Loaded {c}: {len(df):,} rows × {len(df.columns)} cols")
        else:
            log.warning(f"  Missing: {p}")
    return dfs


def summary_stats(df: pd.DataFrame, category: str) -> None:
    print(f"\n{'━'*60}")
    print(f"  {category.upper()}  ({len(df):,} records)")
    print(f"{'━'*60}")

    # Risk distribution
    if "risk_level" in df.columns:
        rc = df["risk_level"].value_counts().reindex(RISK_ORDER, fill_value=0)
        print(f"\n  Risk Level Distribution:")
        for lvl, n in rc.items():
            bar = "█" * int(n / max(rc.max(), 1) * 30)
            print(f"    {lvl:<10} {n:>6,}  {bar}")

        rn = df.get("repair_needed", pd.Series(dtype=bool))
        if rn.dtype == bool or rn.dtype == object:
            rn = rn.astype(str).str.lower() == "true"
        print(f"\n  Repair Needed: {rn.sum():,} ({rn.mean()*100:.1f}%)")

    # Age distribution
    if "start_year" in df.columns:
        years = pd.to_numeric(df["start_year"], errors="coerce").dropna()
        if len(years):
            ages = 2025 - years
            print(f"\n  Age Distribution:")
            print(f"    Oldest      : {int(ages.max())} years  (built {int(years.min())})")
            print(f"    Newest      : {int(ages.min())} years  (built {int(years.max())})")
            print(f"    Median age  : {int(ages.median())} years")
            print(f"    >50 yrs old : {(ages > 50).sum():,} ({(ages>50).mean()*100:.1f}%)")

    # Top states
    if "state" in df.columns:
        sc = df["state"].replace("", pd.NA).dropna().value_counts().head(8)
        if len(sc):
            print(f"\n  Top States:")
            for st, n in sc.items():
                print(f"    {str(st):<30} {n:>5,}")


def top_repair_priorities(df: pd.DataFrame, category: str, n: int = 20) -> pd.DataFrame:
    """Returns top-N highest-risk records sorted by risk_score desc."""
    if "risk_score" not in df.columns:
        return pd.DataFrame()

    sort_cols = ["risk_score"]
    if "risk_level" in df.columns:
        df["_rl_ord"] = df["risk_level"].map(
            {"Low": 0, "Medium": 1, "High": 2, "Critical": 3})
        sort_cols = ["_rl_ord", "risk_score"]

    top = df.sort_values(sort_cols, ascending=False).head(n).copy()
    if "_rl_ord" in top.columns:
        top = top.drop(columns=["_rl_ord"])

    display_cols = [c for c in [
        "name", "ref", "state", "start_year", "condition",
        "risk_score", "risk_level", "risk_reasons",
        "lat", "lon", "length_km", "capacity_mw",
        "accidents_2022", "fatalities_2022",
    ] if c in top.columns]

    print(f"\n  Top-{n} REPAIR PRIORITIES — {category.upper()}")
    print(f"  {'Name':<30} {'Ref':<12} {'State':<20} {'Year':<6} {'Risk':>6} {'Level':<10}")
    print(f"  {'─'*90}")
    for _, row in top[display_cols].iterrows():
        name  = str(row.get("name",""))[:28]
        ref   = str(row.get("ref",""))[:10]
        state = str(row.get("state",""))[:18]
        yr    = str(row.get("start_year",""))[:4]
        score = str(row.get("risk_score",""))[:5]
        level = str(row.get("risk_level",""))[:10]
        print(f"  {name:<30} {ref:<12} {state:<20} {yr:<6} {score:>5}  {level:<10}")

    return top[display_cols]


def state_risk_breakdown(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate risk by state."""
    if "state" not in df.columns or "risk_level" not in df.columns:
        return pd.DataFrame()

    df = df.copy()
    df["state"] = df["state"].replace("", pd.NA)
    df = df.dropna(subset=["state"])
    if df.empty:
        return pd.DataFrame()

    grp = df.groupby("state").agg(
        total             = ("risk_score", "count"),
        avg_risk_score    = ("risk_score", "mean"),
        critical_count    = ("risk_level", lambda x: (x == "Critical").sum()),
        high_count        = ("risk_level", lambda x: (x == "High").sum()),
        repair_needed     = ("repair_needed", lambda x: x.astype(str).str.lower().eq("true").sum()),
    ).round(1).sort_values("avg_risk_score", ascending=False)

    print(f"\n  State-wise Risk Breakdown:")
    print(f"  {'State':<30} {'Total':>6} {'AvgRisk':>8} {'Critical':>9} {'High':>6} {'Repair':>7}")
    print(f"  {'─'*75}")
    for st, row in grp.head(15).iterrows():
        print(f"  {str(st):<30} {int(row['total']):>6} "
              f"{row['avg_risk_score']:>8.1f} "
              f"{int(row['critical_count']):>9} "
              f"{int(row['high_count']):>6} "
              f"{int(row['repair_needed']):>7}")
    return grp


def export_to_excel(dfs: dict, out_path: Path) -> None:
    """Export all DataFrames to multi-sheet Excel."""
    try:
        import openpyxl
        log.info(f"  Exporting to Excel: {out_path}")
        with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
            for sheet_name, df in dfs.items():
                if isinstance(df, pd.DataFrame) and not df.empty:
                    safe_name = sheet_name[:31]
                    df.to_excel(writer, sheet_name=safe_name, index=False)
        log.info(f"  ✓ Excel saved: {out_path}")
    except ImportError:
        log.warning("  openpyxl not installed. Skipping Excel export.")
        log.info("  Install with: pip install openpyxl")


def run_analysis(data_dir: Path, top_n: int = 20, export_excel: bool = False) -> None:
    print("\n╔══════════════════════════════════════════════════════════════╗")
    print("║   INDIA INFRASTRUCTURE RISK ANALYSIS                         ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    dfs = load_datasets(data_dir)
    if not dfs:
        log.error("No datasets found. Run collect_infrastructure.py first.")
        return

    priority_sheets = {}

    for cat, df in dfs.items():
        if cat == "master":
            continue
        if df.empty:
            continue
        summary_stats(df, cat)
        top = top_repair_priorities(df, cat, n=top_n)
        state_risk_breakdown(df)
        priority_sheets[f"priority_{cat}"] = top
        priority_sheets[f"raw_{cat}"] = df

    # Master summary
    if "master" in dfs:
        master = dfs["master"]
        print(f"\n{'━'*60}")
        print(f"  MASTER DATASET  ({len(master):,} total records)")
        print(f"{'━'*60}")

        if "infrastructure_type" in master.columns:
            tc = master["infrastructure_type"].value_counts()
            print("\n  Records by Type:")
            for t, n in tc.items():
                print(f"    {t:<20} {n:>7,}")

        if "risk_level" in master.columns:
            rc = master["risk_level"].value_counts().reindex(RISK_ORDER, fill_value=0)
            print("\n  Overall Risk Distribution:")
            for lvl, n in rc.items():
                pct = n / len(master) * 100
                bar = "█" * int(pct / 2)
                print(f"    {lvl:<10} {n:>7,}  ({pct:4.1f}%)  {bar}")

        state_risk_breakdown(master)
        priority_sheets["master"] = master

    if export_excel:
        excel_path = data_dir / "india_infrastructure_analysis.xlsx"
        export_to_excel(priority_sheets, excel_path)

    print(f"\n{'━'*60}")
    print(f"  Analysis complete. Data in: {data_dir}")
    print(f"{'━'*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description="India Infrastructure Risk Analyser")
    parser.add_argument("--data", default="./outputs",
                        help="Directory with collected CSV files (default: ./outputs)")
    parser.add_argument("--top", type=int, default=20,
                        help="Number of top repair priorities to show (default: 20)")
    parser.add_argument("--excel", action="store_true",
                        help="Export analysis to Excel (.xlsx)")
    args = parser.parse_args()

    run_analysis(
        data_dir=Path(args.data),
        top_n=args.top,
        export_excel=args.excel,
    )


if __name__ == "__main__":
    main()
