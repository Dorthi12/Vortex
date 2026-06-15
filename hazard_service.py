"""
NETRAAVAH — Hazard Intelligence Service
File: hazard_service.py

Provides:
  Module 05: POST /api/hazard/flood-prediction
  Module 06: POST /api/hazard/evacuation-route
  Module 07: POST /api/hazard/resource-allocation
  Module 08: POST /api/hazard/landslide-risk
  Alert Engine: GET/POST /api/hazard/alerts, /api/hazard/alert-level
  Siren Control: POST /api/hazard/siren/activate, /api/hazard/siren/silence
  Shelter CRUD: GET/POST/PATCH /api/hazard/shelters
  WebSocket: WS /ws/hazard/telemetry
"""

# ──────────────────────────────────────────────────────────────────────────────
# Imports
# ──────────────────────────────────────────────────────────────────────────────
import heapq
import json
import math
import os
import pickle
import random
import time
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

# ──────────────────────────────────────────────────────────────────────────────
# Router
# ──────────────────────────────────────────────────────────────────────────────
hazard_router = APIRouter(tags=["Hazard Intelligence"])

# ──────────────────────────────────────────────────────────────────────────────
# Model Loader
# ──────────────────────────────────────────────────────────────────────────────
MODELS_DIR = Path(__file__).parent / "models" / "hazard"


class ModelLoader:
    def __init__(self):
        self._models: Dict[str, Any] = {}

    def load(self, name: str):
        if name not in self._models:
            path = MODELS_DIR / f"{name}.pkl"
            if path.exists():
                with open(path, "rb") as f:
                    self._models[name] = pickle.load(f)
            else:
                self._models[name] = None  # graceful fallback
        return self._models[name]

    def status(self) -> Dict[str, Any]:
        results = {}
        for model_name in ["flood_model", "landslide_model"]:
            path = MODELS_DIR / f"{model_name}.pkl"
            results[model_name] = {
                "available": path.exists(),
                "path": str(path),
                "loaded": model_name in self._models and self._models[model_name] is not None,
            }
        return results


model_loader = ModelLoader()

# ──────────────────────────────────────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────────────────────────────────────
class AlertLevel(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ORANGE = "ORANGE"
    RED = "RED"


class Severity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class SoilType(str, Enum):
    CLAY = "CLAY"
    SANDY = "SANDY"
    LOAMY = "LOAMY"
    ROCKY = "ROCKY"
    MIXED = "MIXED"


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Module 05 (Flood Prediction)
# ──────────────────────────────────────────────────────────────────────────────
class FloodPredictionRequest(BaseModel):
    rainfall: float = Field(..., ge=0, le=200, description="mm/hr")
    river_level: float = Field(..., ge=0, le=15, description="meters")
    dam_discharge: float = Field(..., ge=0, le=100000, description="cusecs")
    soil_moisture: float = Field(..., ge=0, le=100, description="%")
    humidity: float = Field(..., ge=0, le=100, description="%")
    historical_flood_index: float = Field(..., ge=0, le=10)


class FloodTimelineEntry(BaseModel):
    window: str
    probability: float
    expected_water_level: float
    severity: Severity


class AffectedRegion(BaseModel):
    name: str
    risk: str
    population: int


class FloodPredictionResponse(BaseModel):
    flood_probability: float
    expected_water_level: float
    severity: Severity
    affected_regions: List[AffectedRegion]
    confidence_score: float
    timeline: List[FloodTimelineEntry]
    government_advisory: str
    model_source: str  # "ml_model" or "rule_engine"


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Module 06 (Evacuation Route)
# ──────────────────────────────────────────────────────────────────────────────
class EvacuationRouteRequest(BaseModel):
    source: str
    destination: str
    blocked_roads: List[str] = []
    hazard_zones: List[str] = []


class RouteSegment(BaseModel):
    path: List[str]
    travel_time_minutes: float
    distance_km: float
    safety_score: float
    is_safest: bool


class ShelterRecommendation(BaseModel):
    name: str
    distance: str
    capacity: int
    occupancy: int


class EvacuationRouteResponse(BaseModel):
    safest_route: RouteSegment
    alternative_routes: List[RouteSegment]
    recommended_shelters: List[ShelterRecommendation]
    algorithm: str
    computation_time_ms: int


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Module 07 (Resource Allocation)
# ──────────────────────────────────────────────────────────────────────────────
class ResourceAllocationRequest(BaseModel):
    population: int = Field(..., ge=0)
    threat_level: float = Field(..., ge=1, le=10)
    shelter_occupancy: float = Field(..., ge=0, le=100)
    food_inventory: int = Field(..., ge=0)
    water_inventory: int = Field(..., ge=0)
    medical_inventory: int = Field(..., ge=0)


class DeploymentItem(BaseModel):
    resource: str
    quantity: int
    destination: str
    priority: str


class ResourceAllocationResponse(BaseModel):
    trucks_needed: int
    food_packets: int
    medicines_required: int
    water_required: int
    priority_score: float
    critical_shortages: List[str]
    deployment_plan: List[DeploymentItem]


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Module 08 (Landslide Risk)
# ──────────────────────────────────────────────────────────────────────────────
class LandslideRiskRequest(BaseModel):
    rainfall: float = Field(..., ge=0, le=200)
    terrain_slope: float = Field(..., ge=0, le=90)
    soil_type: SoilType
    vegetation_index: float = Field(..., ge=0, le=1)


class AffectedVillage(BaseModel):
    name: str
    population: int
    risk_score: float
    distance: str


class LandslideRiskResponse(BaseModel):
    risk_probability: float
    alert_level: AlertLevel
    affected_villages: List[AffectedVillage]
    confidence_score: float
    evacuation_urgency: str
    government_advisory: str
    model_source: str


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Siren Control
# ──────────────────────────────────────────────────────────────────────────────
class SirenCommand(BaseModel):
    siren_ids: List[str]
    action: str  # "ACTIVATE" | "SILENCE" | "TEST"
    zone: Optional[str] = None
    district_wide: bool = False


class SirenCommandResponse(BaseModel):
    affected_sirens: int
    action: str
    timestamp: str


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models — Alert Engine
# ──────────────────────────────────────────────────────────────────────────────
class AlertCreate(BaseModel):
    level: AlertLevel
    type: str
    district: str
    message: str


class AlertResponse(BaseModel):
    id: str
    level: AlertLevel
    type: str
    district: str
    message: str
    timestamp: str
    acknowledged: bool


# ──────────────────────────────────────────────────────────────────────────────
# In-Memory Alert Store
# ──────────────────────────────────────────────────────────────────────────────
alert_store: List[dict] = [
    {
        "id": str(uuid.uuid4()),
        "level": "RED",
        "type": "FLOOD",
        "district": "Pune East",
        "message": "Mula River gauge exceeded 8.9m caution mark.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "acknowledged": False,
    },
    {
        "id": str(uuid.uuid4()),
        "level": "ORANGE",
        "type": "LANDSLIDE",
        "district": "Katraj",
        "message": "Heavy rainfall combined with steep terrain — landslide watch active.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "acknowledged": False,
    },
]

# Alert level priority for sorting
_ALERT_PRIORITY = {"GREEN": 0, "YELLOW": 1, "ORANGE": 2, "RED": 3}

# ──────────────────────────────────────────────────────────────────────────────
# In-Memory Shelter Store
# ──────────────────────────────────────────────────────────────────────────────
shelter_store: List[dict] = [
    {
        "id": "shelter-001",
        "name": "Bal Gandharva Shelter Camp",
        "district": "Pune Central",
        "address": "Bal Gandharva Rang Mandir Complex",
        "capacity": 500,
        "current_occupancy": 340,
        "status": "OPEN",
        "volunteers": 24,
        "latitude": 18.5196,
        "longitude": 73.8553,
    },
    {
        "id": "shelter-002",
        "name": "Nehru Stadium Relief Centre",
        "district": "Shivajinagar",
        "address": "Nehru Stadium Complex, Shivajinagar",
        "capacity": 800,
        "current_occupancy": 720,
        "status": "OPEN",
        "volunteers": 42,
        "latitude": 18.5308,
        "longitude": 73.8475,
    },
    {
        "id": "shelter-003",
        "name": "Hadapsar Sports Complex",
        "district": "Hadapsar",
        "address": "Hadapsar Sports Complex, East Pune",
        "capacity": 400,
        "current_occupancy": 120,
        "status": "OPEN",
        "volunteers": 18,
        "latitude": 18.5018,
        "longitude": 73.9257,
    },
    {
        "id": "shelter-004",
        "name": "Katraj Community Hall",
        "district": "Katraj",
        "address": "Katraj Community Hall, Satara Road",
        "capacity": 250,
        "current_occupancy": 250,
        "status": "FULL",
        "volunteers": 8,
        "latitude": 18.4529,
        "longitude": 73.8687,
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# Pune Road Network Graph (Module 06)
# ──────────────────────────────────────────────────────────────────────────────
PUNE_ROAD_GRAPH: Dict[str, Dict[str, float]] = {
    "Pune Cantonment": {"Koregaon Park": 3.2, "Yerawada": 4.1, "NH-48 Junction": 5.5},
    "Koregaon Park": {"Pune Cantonment": 3.2, "Kalyani Nagar": 2.8, "Yerawada": 3.0},
    "Yerawada": {"Pune Cantonment": 4.1, "Koregaon Park": 3.0, "NH-48 Junction": 2.2},
    "NH-48 Junction": {"Yerawada": 2.2, "Pune Cantonment": 5.5, "Hadapsar": 7.3, "Swargate": 6.1},
    "Kalyani Nagar": {"Koregaon Park": 2.8, "Kharadi": 4.2, "Viman Nagar": 3.1},
    "Kharadi": {"Kalyani Nagar": 4.2, "Hadapsar": 5.8, "Magarpatta": 4.5},
    "Viman Nagar": {"Kalyani Nagar": 3.1, "Kharadi": 3.4, "Nagar Road Shelter": 6.2},
    "Hadapsar": {"NH-48 Junction": 7.3, "Kharadi": 5.8, "Magarpatta Shelter": 2.1, "Undri": 4.3},
    "Swargate": {"NH-48 Junction": 6.1, "Katraj": 5.2, "Deccan": 3.8},
    "Magarpatta Shelter": {"Hadapsar": 2.1, "Undri": 3.1},
    "Magarpatta": {"Kharadi": 4.5, "Hadapsar": 3.2},
    "Deccan": {"Swargate": 3.8, "Shivajinagar": 2.4},
    "Shivajinagar": {"Deccan": 2.4, "Kothrud": 4.1, "Pune Station": 3.2},
    "Pune Station": {"Shivajinagar": 3.2, "Katraj": 7.1},
    "Kothrud": {"Shivajinagar": 4.1, "Katraj": 6.3},
    "Katraj": {"Swargate": 5.2, "Kothrud": 6.3, "Pune Station": 7.1},
    "Undri": {"Hadapsar": 4.3, "Magarpatta Shelter": 3.1},
    "Nagar Road Shelter": {"Viman Nagar": 6.2},
}


def _fuzzy_match_node(name: str, nodes: List[str]) -> str:
    """Find the closest matching node name using character overlap."""
    name_lower = name.lower()
    best = max(nodes, key=lambda n: sum(1 for c in name_lower if c in n.lower()))
    return best


def dijkstra(
    graph: Dict[str, Dict[str, float]],
    source: str,
    destination: str,
    blocked: List[str],
) -> Optional[Tuple[List[str], float]]:
    """Returns (path, total_distance) or None if no path found."""
    nodes = list(graph.keys())

    if source not in graph:
        source = _fuzzy_match_node(source, nodes)
    if destination not in graph:
        destination = _fuzzy_match_node(destination, nodes)

    dist: Dict[str, float] = {node: float("inf") for node in graph}
    prev: Dict[str, Optional[str]] = {node: None for node in graph}
    dist[source] = 0.0
    pq: List[Tuple[float, str]] = [(0.0, source)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        if u == destination:
            break
        for v, w in graph[u].items():
            if v in blocked:
                continue
            nd = dist[u] + w
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))

    if dist[destination] == float("inf"):
        return None

    path: List[str] = []
    cur: Optional[str] = destination
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    return list(reversed(path)), dist[destination]


def astar(
    graph: Dict[str, Dict[str, float]],
    source: str,
    destination: str,
    blocked: List[str],
) -> Optional[Tuple[List[str], float]]:
    """A* with a zero heuristic (same as Dijkstra, structured separately for extensibility)."""
    return dijkstra(graph, source, destination, blocked)


# ──────────────────────────────────────────────────────────────────────────────
# Rule Engine — Module 07
# ──────────────────────────────────────────────────────────────────────────────
def compute_resource_allocation(req: ResourceAllocationRequest) -> ResourceAllocationResponse:
    pop = req.population
    threat = req.threat_level
    occ = req.shelter_occupancy

    # Compute needs
    food_needed = int(pop * 0.3 * (threat / 10))
    water_needed = int(food_needed * 3.5)
    medical_needed = max(1, int(pop * 0.05 * (threat / 10)))
    trucks = max(1, int(pop / 5000 * (threat / 5)))

    # Priority score
    priority = min(100.0, threat * 8 + (20 if occ > 80 else 0) + (15 if occ > 60 else 0))

    # Shortages
    shortages: List[str] = []
    if req.food_inventory < food_needed:
        shortages.append(f"Food deficit: {food_needed - req.food_inventory} packets")
    if req.water_inventory < water_needed:
        shortages.append(f"Water deficit: {water_needed - req.water_inventory} L")
    if req.medical_inventory < medical_needed:
        shortages.append(f"Medical deficit: {medical_needed - req.medical_inventory} kits")

    plan = [
        DeploymentItem(
            resource="Food Packets",
            quantity=food_needed,
            destination="Zone A Shelters",
            priority="HIGH" if threat > 7 else "MEDIUM",
        ),
        DeploymentItem(
            resource="Potable Water",
            quantity=water_needed,
            destination="Distribution Centers",
            priority="CRITICAL" if threat > 8 else "HIGH",
        ),
        DeploymentItem(
            resource="Medical Kits",
            quantity=medical_needed,
            destination="Field Medical Posts",
            priority="HIGH",
        ),
        DeploymentItem(
            resource="Rescue Trucks",
            quantity=trucks,
            destination="Staging Area, NH-48",
            priority="CRITICAL" if threat > 7 else "HIGH",
        ),
    ]

    return ResourceAllocationResponse(
        trucks_needed=trucks,
        food_packets=food_needed,
        medicines_required=medical_needed,
        water_required=water_needed,
        priority_score=round(priority, 1),
        critical_shortages=shortages,
        deployment_plan=plan,
    )


# ──────────────────────────────────────────────────────────────────────────────
# ML Inference — Module 05 (Flood Prediction)
# ──────────────────────────────────────────────────────────────────────────────
def predict_flood(req: FloodPredictionRequest) -> FloodPredictionResponse:
    model = model_loader.load("flood_model")

    features = [
        req.rainfall,
        req.river_level,
        req.dam_discharge,
        req.soil_moisture,
        req.humidity,
        req.historical_flood_index,
    ]

    if model is not None:
        import numpy as np  # noqa: F401

        prob = float(model.predict_proba([features])[0][1])
        model_source = "ml_model"
    else:
        # Rule-based fallback
        prob = min(
            1.0,
            (
                req.rainfall / 200 * 0.30
                + req.river_level / 15 * 0.35
                + req.dam_discharge / 100000 * 0.20
                + (1 - req.soil_moisture / 100) * 0.15
            ),
        )
        model_source = "rule_engine"

    wl = req.river_level + (req.rainfall / 50) * 0.8
    sev = (
        "EXTREME" if prob >= 0.75
        else "HIGH" if prob >= 0.55
        else "MODERATE" if prob >= 0.35
        else "LOW"
    )

    timeline: List[FloodTimelineEntry] = []
    for i, window in enumerate(["6h", "12h", "24h", "48h"]):
        factor = 1 + i * 0.08
        wp = min(1.0, prob * factor)
        wsev = (
            "EXTREME" if wp >= 0.75
            else "HIGH" if wp >= 0.55
            else "MODERATE" if wp >= 0.35
            else "LOW"
        )
        timeline.append(
            FloodTimelineEntry(
                window=window,
                probability=round(wp, 3),
                expected_water_level=round(wl + i * 0.3, 2),
                severity=Severity(wsev),
            )
        )

    regions = [
        AffectedRegion(
            name="Pune Cantonment (East)",
            risk="CRITICAL" if prob > 0.7 else "HIGH",
            population=124000,
        ),
        AffectedRegion(
            name="Shivajinagar (Central)",
            risk="HIGH" if prob > 0.5 else "MODERATE",
            population=89000,
        ),
        AffectedRegion(
            name="Kothrud (West)",
            risk="MODERATE" if prob > 0.4 else "LOW",
            population=210000,
        ),
    ]

    advisories = {
        "EXTREME": "IMMEDIATE EVACUATION REQUIRED. All residents in low-elevation areas must evacuate within 2 hours. Emergency sirens activated.",
        "HIGH": "Evacuation advisory issued. Residents near Mula-Mutha river banks should move to designated shelters immediately.",
        "MODERATE": "Flood watch active. Monitor river gauge readings. Prepare emergency kits and stay near shelter evacuation routes.",
        "LOW": "Normal monitoring protocol. River levels within manageable range. Continue routine observations.",
    }

    return FloodPredictionResponse(
        flood_probability=round(prob, 4),
        expected_water_level=round(wl, 2),
        severity=Severity(sev),
        affected_regions=regions,
        confidence_score=round(0.78 + (0.15 if model is not None else 0), 4),
        timeline=timeline,
        government_advisory=advisories[sev],
        model_source=model_source,
    )


# ──────────────────────────────────────────────────────────────────────────────
# ML Inference — Module 08 (Landslide Risk)
# ──────────────────────────────────────────────────────────────────────────────
def predict_landslide(req: LandslideRiskRequest) -> LandslideRiskResponse:
    model = model_loader.load("landslide_model")
    soil_weights = {
        "CLAY": 1.3,
        "SANDY": 0.9,
        "LOAMY": 1.0,
        "ROCKY": 0.7,
        "MIXED": 1.1,
    }
    sw = soil_weights[req.soil_type.value]

    if model is not None:
        import numpy as np  # noqa: F401

        features = [req.rainfall, req.terrain_slope, sw, req.vegetation_index]
        prob = float(model.predict_proba([features])[0][1])
        model_source = "ml_model"
    else:
        prob = min(
            1.0,
            (
                req.rainfall / 200 * 0.40
                + req.terrain_slope / 90 * 0.35
                + (1 - req.vegetation_index) * 0.25
            )
            * sw,
        )
        model_source = "rule_engine"

    alert = (
        AlertLevel.RED if prob >= 0.75
        else AlertLevel.ORANGE if prob >= 0.55
        else AlertLevel.YELLOW if prob >= 0.35
        else AlertLevel.GREEN
    )
    urgency = (
        "IMMEDIATE" if prob >= 0.75
        else "MONITOR" if prob >= 0.55
        else "WATCH" if prob >= 0.35
        else "NORMAL"
    )

    villages = [
        AffectedVillage(
            name="Khamboshi Village",
            population=3400,
            risk_score=round(prob * 0.95, 3),
            distance="1.2 km",
        ),
        AffectedVillage(
            name="Devachi Uruli",
            population=2100,
            risk_score=round(prob * 0.78, 3),
            distance="2.8 km",
        ),
        AffectedVillage(
            name="Wadachiwadi",
            population=1800,
            risk_score=round(prob * 0.62, 3),
            distance="4.1 km",
        ),
        AffectedVillage(
            name="Pisoli Settlement",
            population=4200,
            risk_score=round(prob * 0.45, 3),
            distance="5.5 km",
        ),
    ]

    advisories = {
        "RED": "CRITICAL LANDSLIDE RISK. Immediate evacuation of all villages within 3km of slope. Restrict all access to Ghats.",
        "ORANGE": "High landslide probability. Pre-position rescue teams. Evacuate vulnerable households in identified zones.",
        "YELLOW": "Landslide watch active. Continuous monitoring required. Inform district collectors and mobilize standby teams.",
        "GREEN": "Terrain stable. Continue routine geological monitoring. No immediate action required.",
    }

    return LandslideRiskResponse(
        risk_probability=round(prob, 4),
        alert_level=alert,
        affected_villages=villages,
        confidence_score=round(0.82 + (0.10 if model is not None else 0), 4),
        evacuation_urgency=urgency,
        government_advisory=advisories[alert.value],
        model_source=model_source,
    )


# ──────────────────────────────────────────────────────────────────────────────
# WebSocket — Connection Manager
# ──────────────────────────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead: List[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ──────────────────────────────────────────────────────────────────────────────
# Endpoint Helpers
# ──────────────────────────────────────────────────────────────────────────────
def _compute_safety_score(path: List[str], hazard_zones: List[str]) -> float:
    """Safety score 0-100: penalise paths passing through hazard zones."""
    if not path:
        return 0.0
    hazard_count = sum(1 for node in path if node in hazard_zones)
    base = 95.0 - hazard_count * 15.0
    return max(0.0, round(base, 1))


# ──────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────────────

# ── Module 05: Flood Prediction ───────────────────────────────────────────────
@hazard_router.post("/api/hazard/flood-prediction", response_model=FloodPredictionResponse)
def flood_prediction(req: FloodPredictionRequest):
    """Run flood probability prediction using ML model or rule-based fallback."""
    return predict_flood(req)


# ── Module 06: Evacuation Route ───────────────────────────────────────────────
@hazard_router.post("/api/hazard/evacuation-route", response_model=EvacuationRouteResponse)
def evacuation_route(req: EvacuationRouteRequest):
    """Compute safest evacuation route using Dijkstra + A* between Pune localities."""
    t_start = time.monotonic()

    blocked_all = req.blocked_roads + req.hazard_zones

    # Primary route via Dijkstra
    dijkstra_result = dijkstra(PUNE_ROAD_GRAPH, req.source, req.destination, blocked_all)
    if dijkstra_result is None:
        raise HTTPException(status_code=422, detail="No evacuation route found. All paths may be blocked.")

    primary_path, primary_dist = dijkstra_result
    primary_time = round(primary_dist / 40 * 60, 1)  # assume 40 km/h avg speed
    primary_safety = _compute_safety_score(primary_path, req.hazard_zones)

    safest_route = RouteSegment(
        path=primary_path,
        travel_time_minutes=primary_time,
        distance_km=round(primary_dist, 2),
        safety_score=primary_safety,
        is_safest=True,
    )

    # Alternative route via A* with one road additionally blocked (simulate divergence)
    alt_routes: List[RouteSegment] = []
    if len(primary_path) > 2:
        mid_block = primary_path[1]  # block second node to force alternative
        astar_result = astar(PUNE_ROAD_GRAPH, req.source, req.destination, blocked_all + [mid_block])
        if astar_result and astar_result[0] != primary_path:
            alt_path, alt_dist = astar_result
            alt_time = round(alt_dist / 35 * 60, 1)
            alt_safety = _compute_safety_score(alt_path, req.hazard_zones)
            alt_routes.append(
                RouteSegment(
                    path=alt_path,
                    travel_time_minutes=alt_time,
                    distance_km=round(alt_dist, 2),
                    safety_score=alt_safety,
                    is_safest=False,
                )
            )

    # Recommend shelters (top 2 open shelters sorted by distance heuristic)
    open_shelters = [s for s in shelter_store if s["status"] in ("OPEN",)]
    recommended = [
        ShelterRecommendation(
            name=s["name"],
            distance=f"{round(2 + i * 1.5, 1)} km",
            capacity=s["capacity"],
            occupancy=s["current_occupancy"],
        )
        for i, s in enumerate(open_shelters[:3])
    ]

    elapsed_ms = int((time.monotonic() - t_start) * 1000)

    return EvacuationRouteResponse(
        safest_route=safest_route,
        alternative_routes=alt_routes,
        recommended_shelters=recommended,
        algorithm="DIJKSTRA+ASTAR",
        computation_time_ms=elapsed_ms,
    )


# ── Module 07: Resource Allocation ────────────────────────────────────────────
@hazard_router.post("/api/hazard/resource-allocation", response_model=ResourceAllocationResponse)
def resource_allocation(req: ResourceAllocationRequest):
    """Compute resource deployment plan based on population and threat level."""
    return compute_resource_allocation(req)


# ── Module 08: Landslide Risk ─────────────────────────────────────────────────
@hazard_router.post("/api/hazard/landslide-risk", response_model=LandslideRiskResponse)
def landslide_risk(req: LandslideRiskRequest):
    """Run landslide risk assessment using ML model or rule-based fallback."""
    return predict_landslide(req)


# ── Alert Engine ──────────────────────────────────────────────────────────────
@hazard_router.get("/api/hazard/alerts", response_model=List[AlertResponse])
def get_alerts(district: Optional[str] = None, level: Optional[AlertLevel] = None):
    """Retrieve all hazard alerts, optionally filtered by district or level."""
    alerts = alert_store.copy()
    if district:
        alerts = [a for a in alerts if a["district"].lower() == district.lower()]
    if level:
        alerts = [a for a in alerts if a["level"] == level.value]
    return alerts


@hazard_router.post("/api/hazard/alert", response_model=AlertResponse, status_code=201)
def create_alert(payload: AlertCreate):
    """Create a new hazard alert and append to the alert store."""
    new_alert = {
        "id": str(uuid.uuid4()),
        "level": payload.level.value,
        "type": payload.type,
        "district": payload.district,
        "message": payload.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "acknowledged": False,
    }
    alert_store.append(new_alert)
    return new_alert


@hazard_router.post("/api/hazard/alert/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(alert_id: str):
    """Mark a specific alert as acknowledged."""
    for alert in alert_store:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return alert
    raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")


@hazard_router.get("/api/hazard/alert-level")
def get_alert_level():
    """Return the current maximum active (unacknowledged) alert level across all alerts."""
    active = [a for a in alert_store if not a["acknowledged"]]
    if not active:
        return {"alert_level": "GREEN", "active_alerts": 0}
    max_alert = max(active, key=lambda a: _ALERT_PRIORITY.get(a["level"], 0))
    return {
        "alert_level": max_alert["level"],
        "active_alerts": len(active),
        "total_alerts": len(alert_store),
    }


# ── Siren Control ─────────────────────────────────────────────────────────────
@hazard_router.post("/api/hazard/siren/activate", response_model=SirenCommandResponse)
def activate_siren(cmd: SirenCommand):
    """Activate one or more sirens (district-wide or by ID list)."""
    affected = len(cmd.siren_ids) if not cmd.district_wide else 5
    return SirenCommandResponse(
        affected_sirens=affected,
        action="ACTIVATE",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@hazard_router.post("/api/hazard/siren/silence", response_model=SirenCommandResponse)
def silence_siren(cmd: SirenCommand):
    """Silence one or more sirens."""
    affected = len(cmd.siren_ids) if not cmd.district_wide else 5
    return SirenCommandResponse(
        affected_sirens=affected,
        action="SILENCE",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ── Shelter CRUD ──────────────────────────────────────────────────────────────
@hazard_router.get("/api/hazard/shelters")
def get_shelters(district: Optional[str] = None, status: Optional[str] = None):
    """List all shelters, optionally filtered by district or status."""
    result = shelter_store.copy()
    if district:
        result = [s for s in result if s["district"].lower() == district.lower()]
    if status:
        result = [s for s in result if s["status"].upper() == status.upper()]
    return result


@hazard_router.patch("/api/hazard/shelters/{shelter_id}/occupancy")
def update_shelter_occupancy(shelter_id: str, occupancy: int):
    """Update current occupancy for a shelter (in-memory)."""
    if occupancy < 0:
        raise HTTPException(status_code=422, detail="Occupancy must be non-negative.")
    for shelter in shelter_store:
        if shelter["id"] == shelter_id:
            if occupancy > shelter["capacity"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"Occupancy {occupancy} exceeds capacity {shelter['capacity']}.",
                )
            shelter["current_occupancy"] = occupancy
            shelter["status"] = "FULL" if occupancy >= shelter["capacity"] else "OPEN"
            return shelter
    raise HTTPException(status_code=404, detail=f"Shelter '{shelter_id}' not found.")


# ── Model Status ──────────────────────────────────────────────────────────────
@hazard_router.get("/api/hazard/model-status")
def model_status():
    """Check availability of trained ML model files."""
    status = model_loader.status()
    all_available = all(v["available"] for v in status.values())
    return {
        "models": status,
        "models_dir": str(MODELS_DIR),
        "all_models_available": all_available,
        "inference_mode": "ml_model" if all_available else "rule_engine",
    }


# ── WebSocket: Telemetry ──────────────────────────────────────────────────────
@hazard_router.websocket("/ws/hazard/telemetry")
async def ws_telemetry(websocket: WebSocket):
    """Real-time hazard telemetry stream. Broadcasts sensor data every 5 seconds."""
    await manager.connect(websocket)
    try:
        while True:
            telemetry = {
                "type": "TELEMETRY",
                "payload": {
                    "riverLevel": round(7.5 + math.sin(time.time() / 30) * 1.5, 2),
                    "rainfall": round(30 + random.random() * 40, 1),
                    "shelterOccupancyPct": round(60 + random.random() * 20, 1),
                    "activeSirens": random.randint(1, 3),
                    "alertLevel": "RED",
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                },
            }
            await manager.broadcast(telemetry)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
