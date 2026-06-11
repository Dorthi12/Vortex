#!/usr/bin/env python3
"""
NETRAVAAH v4 — CLI Predictor for PyCharm / terminal
Usage:
  python predict.py --district Wayanad --state Kerala --steps
  python predict.py --district Ranchi  --state Jharkhand
  python predict.py --all
  python predict.py --all --quiet
  python predict.py --workflow
"""
import argparse, sys, os, json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

R='\033[91m'; Y='\033[93m'; G='\033[92m'; C='\033[96m'
M='\033[95m'; B='\033[94m'; W='\033[97m'; D='\033[90m'; E='\033[0m'
ICON={"flood":"🌊","landslide":"⛰️","heatwave":"🔥","drought":"☀️","cyclone":"🌀"}

def col_level(lv):
    return {"CRITICAL":R,"HIGH":Y,"MEDIUM":'\033[33m',"WATCH":C,"NORMAL":G}.get(lv,W)

WORKFLOW = f"""
{W}╔══════════════════════════════════════════════════════════════════════╗
║          NETRAVAAH v4 — COMPLETE SYSTEM WORKFLOW                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  DATA SOURCES                                                        ║
║  ┌─────────────────────────────────────────────────────┐             ║
║  │  Open-Meteo Forecast  → 7-day weather + ERA5 trend  │             ║
║  │  India WRIS           → River water level + trend   │             ║
║  │  NASA SMAP            → 9km soil moisture           │             ║
║  │  NASA GPM IMERG       → Daily satellite rainfall    │             ║
║  │  MODIS MOD13A3        → 1km monthly NDVI            │             ║
║  │  OpenWeatherMap       → Current conditions          │             ║
║  │  Weatherbit           → UV index, AQI, solar rad    │             ║
║  └────────────────────────┬────────────────────────────┘             ║
║                           ↓                                          ║
║  ┌──────────────── HAZARD PREDICTION ────────────────────┐           ║
║  │  5 ML Models (AUC 0.98-1.00) + Trend Boost            │           ║
║  │  Flood | Landslide | Heatwave | Drought | Cyclone      │           ║
║  └────────────────────────┬────────────────────────────┘             ║
║                           ↓                                          ║
║  ┌──────────────── RISK GRID ENGINE ─────────────────────┐           ║
║  │  10x10 spatial grid per district                       │           ║
║  │  Physics formulas × ML blend (55/45)                   │           ║
║  │  Each cell: flood/landslide/heatwave/drought/cyclone   │           ║
║  └────────────────────────┬────────────────────────────┘             ║
║                           ↓                                          ║
║  ┌──────────────── RESPONSE ENGINE ──────────────────────┐           ║
║  │                                                        │           ║
║  │  ROAD NETWORK (Overpass API)                           │           ║
║  │    → Score every road segment vs risk grid             │           ║
║  │    → Flag roads with hazard risk ≥ 0.65                │           ║
║  │          ↓                                             │           ║
║  │  IoT BARRICADE SIGNALS                                 │           ║
║  │    → CLOSE (red LED + audio)  risk ≥ 0.80              │           ║
║  │    → RESTRICT (amber)         risk ≥ 0.65              │           ║
║  │    → WARN (yellow)            risk ≥ 0.50              │           ║
║  │          ↓                                             │           ║
║  │  SAFE ROUTE CALCULATION                                │           ║
║  │    → Overpass road graph built                         │           ║
║  │    → Blocked roads get ∞ edge weight                   │           ║
║  │    → Dijkstra/A* finds shortest safe path              │           ║
║  │    → Mapbox Directions v5 (turn-by-turn steps)         │           ║
║  │    → Mapbox Matrix (drive-time to all shelters)        │           ║
║  │    → OSM Nominatim discovers real shelters nearby      │           ║
║  │    → PositionStack geocodes addresses                  │           ║
║  │    → Shelter ranked: drive time × capacity × type      │           ║
║  │          ↓                                             │           ║
║  │  INFRASTRUCTURE CONTROL ADVISOR                        │           ║
║  │    → Dam: reservoir% × rainfall × evac status          │           ║
║  │    → Bridge: flood risk × water depth % of max         │           ║
║  │    → Drainage: rain intensity × urban flood risk       │           ║
║  └──────────┬───────────────────┬────────────────────────┘           ║
║             ↓                   ↓                                    ║
║  ┌─ CITIZEN ALERT ─┐  ┌─ GOVT/NDRF ALERT ─────────────────────┐     ║
║  │ Escape steps    │  │ Deploy NDRF teams                      │     ║
║  │ Best shelter    │  │ Evacuation order                       │     ║
║  │ Turn-by-turn    │  │ Dam/bridge actions                     │     ║
║  │ IoT road status │  │ Road blocking list                     │     ║
║  │ Helplines       │  │ NDMA / SEOC coordination               │     ║
║  └─────────────────┘  └────────────────────────────────────────┘     ║
╚══════════════════════════════════════════════════════════════════════╝{E}
"""


def print_result(result: dict, steps_mode: bool = False):
    d     = result["district"]
    st    = result["state"]
    probs = result["probabilities"]
    level = result["overall_level"]
    activ = result["active_hazards"]
    ws    = result.get("weather_snapshot", {})
    wris  = (ws.get("wris") or {})

    print(f"\n{'═'*70}")
    print(f"  {W}NETRAVAAH v4 — {d.upper()}, {st.upper()}{E}")
    print(f"  {D}{datetime.now().strftime('%d %b %Y  %H:%M:%S IST')}{E}")
    print(f"{'═'*70}")

    # Weather snapshot
    print(f"\n  🌡  {ws.get('temp_c',0):.1f}°C  "
          f"💧 {ws.get('humidity',0):.0f}%  "
          f"🌧 {ws.get('rain_72h',0):.1f}mm/72h  "
          f"💨 {ws.get('wind_mps',0):.1f}m/s  "
          f"☁ {ws.get('cloud_pct',0):.0f}%")
    if wris.get("level_m"):
        tc = R if wris.get("trend") == "rising" else G
        print(f"  🌊 River: {tc}{wris['level_m']:.1f}m ({wris.get('trend','?')}){E}"
              f"  Station: {wris.get('station','')}")

    # Hazard table
    print(f"\n  {'─'*66}")
    print(f"  {'HAZARD':<14} {'PROB':>7}  {'BAR':<22}  LEVEL       STATUS")
    print(f"  {'─'*66}")
    for h in ["flood","landslide","heatwave","drought","cyclone"]:
        p   = probs.get(h, 0)
        lv  = "CRITICAL" if p>=.8 else "HIGH" if p>=.65 else "MEDIUM" if p>=.5 \
              else "WATCH" if p>=.35 else "NORMAL"
        bar = "█"*int(p*20) + "░"*(20-int(p*20))
        lvc = col_level(lv)
        flg = f" {R}◆ ACTIVE{E}" if h in activ else ""
        print(f"  {ICON[h]} {h:<12} {lvc}{p*100:6.1f}%{E}  {D}{bar}{E}  {lvc}{lv:<10}{E}{flg}")

    print(f"\n  Overall: {col_level(level)}{W}{level}{E}")

    # Evac plan
    ep = result.get("evac_plan")
    if ep and ep.get("routes"):
        print(f"\n  {'─'*66}")
        print(f"  {G}🚗 SAFE EVACUATION ROUTES  (sorted by ETA){E}")
        for i, r in enumerate(ep["routes"][:3], 1):
            src = f"[{r.get('source','?')}]"
            print(f"\n  {i}. {W}{r['shelter']}{E}  {D}{src}{E}")
            print(f"     📍 {r.get('address','')}")
            print(f"     🏥 Type: {r.get('shelter_type','govt').upper()}  "
                  f"Capacity: {r.get('capacity',0):,}")
            print(f"     🚗 {r['distance_km']} km  ⏱ {r['eta_min']} min")
            if r.get("steps"):
                print(f"     {D}Turn-by-turn:{E}")
                for step in r["steps"][:4]:
                    road = f"({step['road_name']})" if step.get("road_name") else ""
                    dist = f"{step['distance_m']:.0f}m" if step.get("distance_m") else ""
                    print(f"       ▸ {step['instruction']} {road} {dist}")

        nb  = ep.get("roads_blocked", 0)
        iot = ep.get("iot_signals", [])
        if nb:
            print(f"\n  🚧 {R}{nb} road(s) BLOCKED{E} — IoT barricade signals sent: {len(iot)}")
            for sig in iot[:4]:
                clr = R if sig["action"]=="CLOSE" else Y
                print(f"     {clr}[{sig['action']}]{E} {sig['road_name']} "
                      f"(risk {sig['risk_score']:.2f}) → {sig['message'][:40]}")

    # Dam advisories
    dadvs = result.get("dam_advisories", [])
    if dadvs:
        print(f"\n  {'─'*66}")
        print(f"  {M}🏛  DAM ADVISORIES{E}")
        for da in dadvs:
            uc = R if da["urgency"] in ("CRITICAL","HIGH") else Y
            print(f"  {da['dam_name']} ({da['river']}) → {uc}{da['decision']}{E} [{da['urgency']}]")
            print(f"    {D}{da['recommendation'][:70]}…{E}")

    # Bridge advisories
    badv = result.get("bridge_advisories", [])
    if badv:
        print(f"\n  {'─'*66}")
        print(f"  {B}🌉 BRIDGE ADVISORIES{E}")
        for b in badv:
            ac = R if b["action"]=="IMMEDIATE_CLOSURE" else Y
            print(f"  {b['bridge']} → {ac}{b['action']}{E}  {D}{b['reason']}{E}")

    # Citizen message (first alert)
    alerts = result.get("alerts", [])
    if alerts:
        print(f"\n  {'─'*66}")
        print(f"  {Y}📢 CITIZEN ALERT — {alerts[0]['hazard'].upper()}{E}")
        for line in alerts[0]["citizen_msg"].split("\n")[4:12]:
            if line.strip():
                print(f"  {line}")

    print(f"\n  AUCs: " + "  ".join(
        f"{h}={result['aucs'].get(h,0):.3f}"
        for h in ["flood","landslide","heatwave","drought","cyclone"]
    ))
    print(f"{'═'*70}\n")


def run_district(loc: dict, quiet: bool, steps: bool) -> dict:
    from data_fetcher import fetch_all, init_db, store_weather, load_history
    from predictor import full_response_cycle

    if steps:
        print(f"\n{D}[1/6] Fetching Overpass road network for {loc['district']}…{E}")
    from response_engine import fetch_roads
    roads = fetch_roads(loc["district"], loc["lat"], loc["lon"])
    if steps:
        print(f"  {G}✓{E} {roads.get('total',0)} road segments loaded")
        print(f"{D}[2/6] Fetching live weather (Open-Meteo, OWM, Weatherbit, SMAP)…{E}")

    init_db()
    live = fetch_all(loc)
    store_weather(live)
    if steps:
        print(f"  {G}✓{E} Sources: {', '.join(live.get('sources',[]))}")
        wris = live.get("wris") or {}
        if wris.get("level_m"):
            trend_c = R if wris.get("trend")=="rising" else G
            print(f"  {G}✓{E} WRIS river: {trend_c}{wris['level_m']:.1f}m "
                  f"({wris.get('trend','?')}){E}  [{wris.get('station','')}]")
        sm = live.get("smap_sm")
        print(f"  {G if sm else D}{'✓' if sm else '–'}{E} "
              f"NASA SMAP soil moisture: {sm if sm else 'using fallback'}")
        print(f"{D}[3/6] Running 5 ML models + trend boosts…{E}")

    history = load_history(loc["district"], hours=72)
    result  = full_response_cycle(loc["district"], loc["state"],
                                  loc["lat"], loc["lon"], live, history)

    if steps:
        print(f"  {G}✓{E} Predictions: " +
              "  ".join(f"{h}={result['probabilities'].get(h,0)*100:.0f}%"
                        for h in ["flood","landslide","heatwave","drought","cyclone"]))
        print(f"{D}[4/6] Generating dynamic 10×10 risk grid…{E}")
        rg = result.get("risk_grid", {})
        print(f"  {G}✓{E} {rg.get('grid_size',10)}×{rg.get('grid_size',10)} grid, "
              f"{rg.get('high_risk_cells',0)} danger cells")
        print(f"{D}[5/6] Planning evacuation routes…{E}")
        ep = result.get("evac_plan")
        if ep:
            print(f"  {G}✓{E} {len(ep.get('routes',[]))} routes computed  |  "
                  f"{ep.get('roads_blocked',0)} roads blocked  |  "
                  f"{len(ep.get('iot_signals',[]))} IoT signals")
            for r in ep.get("routes",[])[:2]:
                print(f"    → {r['shelter']}: {r['distance_km']}km "
                      f"~{r['eta_min']}min via {r.get('source','?')}")
        print(f"{D}[6/6] Infrastructure advisories…{E}")
        for da in result.get("dam_advisories",[])[:2]:
            print(f"  🏛  {da['dam_name']}: {da['decision']} [{da['urgency']}]")
        for ba in result.get("bridge_advisories",[])[:2]:
            print(f"  🌉 {ba['bridge']}: {ba['action']}")

    if quiet:
        p     = result["probabilities"]
        level = result["overall_level"]
        activ = result["active_hazards"]
        lvc   = col_level(level)
        fl    = p.get("flood",0); ls=p.get("landslide",0)
        hw    = p.get("heatwave",0); dr=p.get("drought",0); cy=p.get("cyclone",0)
        def pc(v):
            c = R if v>=.65 else Y if v>=.50 else G
            return f"{c}{v*100:5.1f}%{E}"
        print(f"  {loc['district']:<20} {loc['state']:<20} "
              f"{pc(fl)} {pc(ls)} {pc(hw)} {pc(dr)} {pc(cy)}  "
              f"{lvc}{level:<10}{E}  {','.join(activ) or '-'}")
    else:
        print_result(result, steps)

    return result


def main():
    p = argparse.ArgumentParser(description="NETRAVAAH v4 CLI")
    p.add_argument("--district",  "-d")
    p.add_argument("--state",     "-s")
    p.add_argument("--all",       "-a", action="store_true")
    p.add_argument("--quiet",     "-q", action="store_true")
    p.add_argument("--steps",           action="store_true")
    p.add_argument("--workflow",        action="store_true")
    args = p.parse_args()

    if args.workflow:
        print(WORKFLOW); return

    from config import MONITORED_DISTRICTS

    if args.quiet and args.all:
        print(f"\n{'─'*104}")
        print(f"  {'DISTRICT':<20} {'STATE':<20} {'FLOOD':>7} {'SLIDE':>7} "
              f"{'HEAT':>7} {'DROUGHT':>7} {'CYCLONE':>7}  {'LEVEL':<12}  ACTIVE")
        print(f"{'─'*104}")

    if args.all:
        for loc in MONITORED_DISTRICTS:
            run_district(loc, quiet=args.quiet, steps=False)
        if args.quiet:
            print(f"{'─'*104}")
    elif args.district and args.state:
        loc = next((d for d in MONITORED_DISTRICTS
                    if d["district"].lower() == args.district.lower()), None)
        if not loc:
            loc = {"district": args.district, "state": args.state,
                   "lat": 22.0, "lon": 78.0}
            print(f"{Y}⚠ District not in monitored list — using approximate coords{E}")
        run_district(loc, quiet=args.quiet, steps=args.steps)
    else:
        print(WORKFLOW)
        print("Usage:")
        print("  python predict.py --district Wayanad --state Kerala --steps")
        print("  python predict.py --district Ranchi  --state Jharkhand")
        print("  python predict.py --all")
        print("  python predict.py --all --quiet")
        print("  python predict.py --workflow\n")
        from config import MONITORED_DISTRICTS
        print("Districts:", ", ".join(d["district"] for d in MONITORED_DISTRICTS))


if __name__ == "__main__":
    main()
