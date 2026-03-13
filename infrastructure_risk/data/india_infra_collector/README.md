# India Infrastructure Dataset Collector

Builds a comprehensive, analysis-ready infrastructure dataset for India
covering highways, bridges, railways, hospitals, and power plants — with
construction year, condition, dimensions, and accident data — for risk
scoring and repair-prediction modelling.

---

## Quick Start

```bash
pip install -r requirements.txt

# Collect everything (all India, ~30–60 min depending on Overpass load)
python collect_infrastructure.py

# Single category
python collect_infrastructure.py --category bridges

# One state only (much faster)
python collect_infrastructure.py --state "Maharashtra"

# Multiple categories, one state
python collect_infrastructure.py --category highways bridges --state "Uttar Pradesh"

# Analyse collected data
python analyse_infrastructure.py

# Export to Excel
python analyse_infrastructure.py --excel --top 50
```

---

## Data Sources

| Category | Primary Source | What you get |
|---|---|---|
| National/State Highways | OpenStreetMap via Overpass API | Geometry, NH number, surface, lanes, width, speed limit, condition (smoothness tag), toll, start_date |
| Bridges | OpenStreetMap via Overpass API | Bridge type, material, length, width, max weight/height, inspection date, waterway/railway crossed |
| Railways | OpenStreetMap via Overpass API | Line type, gauge, electrification, voltage, tracks, zone, speed limit, service class |
| Hospitals | OpenStreetMap via Overpass API | Beds, emergency, operator type (public/private/NGO), speciality, building condition |
| Power Plants | **WRI Global Power Plant Database** (free CSV) + Overpass | Capacity MW, fuel type, commissioning year, owner, annual generation GWh, ~500 India plants |
| Road Accidents | NCRB 2022 (embedded) + data.gov.in live | Accidents, fatalities, severity by NH number |
| Railway Accidents | Ministry of Railways (embedded) + data.gov.in live | Accidents, derailments, casualties by zone |

---

## Output Files

All saved to `./outputs/` (configurable with `--output-dir`):

```
outputs/
  india_highways.csv          # Road segments
  india_bridges.csv           # Bridge structures
  india_railways.csv          # Railway tracks + stations
  india_hospitals.csv         # Health facilities
  india_power_plants.csv      # Power generation plants
  india_infrastructure_master.csv  ← All 5 categories merged
  india_infrastructure_analysis.xlsx  ← (if --excel flag used)
```

---

## Column Reference

### Common Columns (all categories)

| Column | Description |
|---|---|
| `osm_id` | OpenStreetMap element ID |
| `category` | highway / bridge / railway / hospital / power_plant |
| `name` | Official name |
| `start_year` | Construction/commissioning year |
| `condition` | OSM condition tag (excellent/good/bad/horrible) |
| `operator` | Operating agency (NHAI, Indian Railways zone, etc.) |
| `state` | Indian state |
| `lat` / `lon` | Centroid coordinates |
| `risk_score` | 0–100 heuristic risk score |
| `risk_level` | Low / Medium / High / Critical |
| `repair_needed` | True if risk_score ≥ 45 |
| `risk_reasons` | Pipe-separated reasons for the score |
| `data_source` | Which source the record came from |

### Highways

| Column | Description |
|---|---|
| `ref` | Road number (NH-44, SH-1, etc.) |
| `highway_class` | motorway / trunk / primary |
| `surface` | asphalt / concrete / gravel / unpaved |
| `lanes` | Number of lanes |
| `maxspeed_kmph` | Posted speed limit |
| `width_m` | Road width |
| `oneway` | yes/no |
| `toll` | yes/no |
| `smoothness` | excellent/good/intermediate/bad/horrible/impassable |
| `length_km` | Segment length (haversine) |
| `accidents_2022` | Accident count (NCRB 2022) |
| `fatalities_2022` | Fatality count (NCRB 2022) |
| `accident_severity` | very_high/high/medium/low |

### Bridges

| Column | Description |
|---|---|
| `bridge_type` | yes / viaduct / suspension / arch |
| `bridge_structure` | beam / arch / cable-stayed / truss |
| `material` | concrete / steel / iron / wood |
| `length_m` | Span length in metres |
| `width_m` | Deck width |
| `maxweight_tonnes` | Load limit |
| `maxheight_m` | Clearance height |
| `inspection_date` | Last recorded inspection |
| `waterway` | River/canal crossed |

### Railways

| Column | Description |
|---|---|
| `railway_type` | rail / station / halt / narrow_gauge |
| `gauge_mm` | Track gauge (1676 = Indian broad gauge) |
| `electrified` | yes/no/contact_line |
| `voltage_V` | Electrification voltage |
| `tracks` | Number of tracks (1/2/3) |
| `zone` | Indian Railways zone |
| `service` | main / branch / siding |
| `usage` | main / branch / tourism |
| `accidents_2023` | Zone-level accident count |
| `derailments_2023` | Zone-level derailment count |

### Hospitals

| Column | Description |
|---|---|
| `amenity_type` | hospital / clinic |
| `beds` | Bed count |
| `emergency` | yes/no |
| `operator_type` | public / private / ngo |
| `healthcare_speciality` | cardiology / orthopaedic / etc. |
| `building_levels` | Number of floors |
| `building_condition` | OSM building:condition tag |
| `wheelchair` | Accessibility |

### Power Plants

| Column | Description |
|---|---|
| `gppd_id` | WRI Global Power Plant Database ID |
| `fuel_type` | Coal / Gas / Hydro / Wind / Solar / Nuclear |
| `capacity_mw` | Installed capacity (MW) |
| `commissioning_year` | Year of commissioning |
| `annual_gen_gwh` | Estimated annual generation (GWh) |
| `owner` | Owning entity (NTPC, TNEB, etc.) |

---

## Risk Score Logic

The risk score (0–100) is computed per record using these heuristics:

| Factor | Score Impact |
|---|---|
| Age > 50 years | +35 |
| Age 30–50 years | +20 |
| Age 15–30 years | +10 |
| Unknown age | +5 |
| condition = bad/very_bad | +20 to +30 |
| condition = horrible/impassable | +40 to +50 |
| condition = good/excellent | −5 to −10 |
| Bridge material = wood | +25 |
| Bridge material = iron | +15 |
| Highway surface = unpaved/gravel | +20 |
| Accident severity = very_high | +25 |
| Accident severity = high | +15 |

Risk levels: **Low** (0–24), **Medium** (25–44), **High** (45–64), **Critical** (65+)

`repair_needed = True` when `risk_score ≥ 45`

---

## CLI Reference

```
collect_infrastructure.py
  --category   highways bridges railways hospitals power_plants  (one or more)
  --state      Indian state name (e.g. "Maharashtra")
  --bbox       Custom S,W,N,E bounding box
  --no-overpass  Skip Overpass (WRI power plants only)
  --output-dir   Output directory (default: ./outputs)

analyse_infrastructure.py
  --data       Path to CSV directory (default: ./outputs)
  --top        Top-N repair priorities to display (default: 20)
  --excel      Export multi-sheet Excel report
```

---

## Notes on Data Completeness

**OpenStreetMap coverage in India is good but uneven.** Urban areas, national
highways, and major railways are well-mapped. Rural roads and small bridges
may have limited attribute coverage (missing `start_date`, `width`, etc.).

**WRI Power Plant Database** (2021 edition) covers ~99% of grid-connected
plants ≥ 1 MW. It does not include distributed rooftop solar.

**Accident data** is enriched at the NH-number level (NCRB) and Railway Zone
level (Ministry of Railways). Individual bridge/station accident records are
not available in open data — the script attempts a live download from
data.gov.in and falls back to the embedded 2022/2023 lookup tables.

For production use, supplement with:
- NHAI project database (https://nhai.gov.in)
- RVNL/IRCON bridge registers (Ministry of Railways)
- CEA power plant data (https://cea.nic.in)
- State PWD maintenance records
