'use client';
import { create } from 'zustand';

// ── Alert System ──────────────────────────────────────────────────────────────
export type AlertLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface HazardAlert {
  id: string;
  level: AlertLevel;
  type: 'FLOOD' | 'CYCLONE' | 'LANDSLIDE' | 'HEATWAVE' | 'RESOURCE';
  district: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ── Flood Prediction (Module 05) ──────────────────────────────────────────────
export interface FloodPredictionInput {
  rainfall: number;             // mm/hr, 0-200
  riverLevel: number;           // meters, 0-15
  damDischarge: number;         // cusecs, 0-100000
  soilMoisture: number;         // %, 0-100
  humidity: number;             // %, 0-100
  historicalFloodIndex: number; // 0-10 scale
}

export interface FloodTimelineEntry {
  window: '6h' | '12h' | '24h' | '48h';
  probability: number;        // 0-1
  expectedWaterLevel: number; // meters
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

export interface FloodPredictionResult {
  overallProbability: number;
  expectedWaterLevel: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  affectedRegions: Array<{ name: string; risk: string; population: number }>;
  confidenceScore: number;
  timeline: FloodTimelineEntry[];
  governmentAdvisory: string;
}

// ── Evacuation Route (Module 06) ──────────────────────────────────────────────
export interface EvacuationInput {
  source: string;
  destination: string;
  blockedRoads: string[];
  hazardZones: string[];
}

export interface EvacuationRoute {
  path: string[];           // ordered waypoints
  travelTimeMinutes: number;
  distanceKm: number;
  safetyScore: number;      // 0-100
  isSafest: boolean;
}

export interface EvacuationResult {
  safestRoute: EvacuationRoute;
  alternativeRoutes: EvacuationRoute[];
  recommendedShelters: Array<{ name: string; distance: string; capacity: number; occupancy: number }>;
  algorithm: 'DIJKSTRA' | 'ASTAR';
}

// ── Resource Allocation (Module 07) ───────────────────────────────────────────
export interface ResourceInput {
  population: number;
  threatLevel: number;       // 1-10
  shelterOccupancy: number;  // %
  foodInventory: number;     // packets
  waterInventory: number;    // liters
  medicalInventory: number;  // kits
}

export interface ResourceResult {
  trucksNeeded: number;
  foodPackets: number;
  medicinesRequired: number;
  waterRequired: number;     // liters
  priorityScore: number;     // 0-100
  criticalShortages: string[];
  deploymentPlan: Array<{ resource: string; quantity: number; destination: string; priority: string }>;
}

// ── Landslide Risk (Module 08) ────────────────────────────────────────────────
export interface LandslideInput {
  rainfall: number;          // mm/hr, 0-200
  terrainSlope: number;      // degrees, 0-90
  soilType: 'CLAY' | 'SANDY' | 'LOAMY' | 'ROCKY' | 'MIXED';
  vegetationIndex: number;   // NDVI 0-1
}

export interface LandslideResult {
  riskProbability: number;   // 0-1
  alertLevel: AlertLevel;
  affectedVillages: Array<{ name: string; population: number; riskScore: number; distance: string }>;
  confidenceScore: number;
  evacuationUrgency: 'IMMEDIATE' | 'MONITOR' | 'WATCH' | 'NORMAL';
  governmentAdvisory: string;
  modelSource?: string;
}

// ── Siren & Shelter ───────────────────────────────────────────────────────────
export interface SirenRecord {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'SILENT' | 'OFFLINE' | 'TESTING';
  coverage: string;
  zone: string;
  lastActivated: string | null;
}

export interface ShelterRecord {
  id: string;
  name: string;
  district: string;
  capacity: number;
  currentOccupancy: number;
  foodStock: number;       // days remaining
  waterStock: number;      // days remaining
  medicalStock: number;    // days remaining
  volunteers: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  coordinates: { lat: number; lng: number };
}

// ── WebSocket Telemetry ───────────────────────────────────────────────────────
export interface TelemetrySnapshot {
  riverLevel: number;
  rainfall: number;
  shelterOccupancyPct: number;
  activeSirens: number;
  alertLevel: AlertLevel;
  lastUpdated: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSeverity(prob: number): 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' {
  if (prob >= 0.75) return 'EXTREME';
  if (prob >= 0.55) return 'HIGH';
  if (prob >= 0.35) return 'MODERATE';
  return 'LOW';
}

function getAdvisoryForFlood(severity: string): string {
  switch (severity) {
    case 'EXTREME':
      return 'IMMEDIATE MANDATORY EVACUATION ORDER issued for all low-elevation wards. All relief camps activated. NDRF teams deployed. Citizens must evacuate within 2 hours.';
    case 'HIGH':
      return 'HIGH ALERT: Vulnerable populations in flood-prone areas advised to evacuate to designated relief camps. District authorities on full standby.';
    case 'MODERATE':
      return 'MODERATE WATCH: River levels rising. Residents near river banks should prepare emergency kits. Monitor official channels for updates.';
    default:
      return 'LOW RISK: Situation under observation. Normal precautions advised. No immediate threat.';
  }
}

function getAdvisoryForLandslide(urgency: string): string {
  switch (urgency) {
    case 'IMMEDIATE':
      return 'IMMEDIATE EVACUATION ORDERED for all identified high-risk villages. Movement through Katraj Ghats and hill-slope roads prohibited. SDRF teams activated.';
    case 'MONITOR':
      return 'ORANGE WATCH: Heavy rainfall on unstable terrain. Residents in hill-slope areas advised to move to safer locations. District authorities alerted.';
    case 'WATCH':
      return 'YELLOW WATCH: Elevated risk conditions. Avoid travel near steep slopes and hill roads. Monitor rainfall data closely.';
    default:
      return 'LOW RISK: Terrain and moisture levels within normal parameters. Routine monitoring active.';
  }
}

// ── Full Store Interface ──────────────────────────────────────────────────────
interface HazardState {
  // Alert system
  currentAlertLevel: AlertLevel;
  activeAlerts: HazardAlert[];
  acknowledgeAlert: (id: string) => void;
  triggerAlert: (alert: Omit<HazardAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;

  // Module 05 — Flood Prediction
  floodInput: FloodPredictionInput;
  floodResult: FloodPredictionResult | null;
  floodLoading: boolean;
  setFloodInput: <K extends keyof FloodPredictionInput>(key: K, val: FloodPredictionInput[K]) => void;
  runFloodPrediction: () => void;

  // Module 06 — Evacuation
  evacuationInput: EvacuationInput;
  evacuationResult: EvacuationResult | null;
  evacuationLoading: boolean;
  setEvacuationInput: <K extends keyof EvacuationInput>(key: K, val: EvacuationInput[K]) => void;
  runEvacuationRoute: () => void;

  // Module 07 — Resource Allocation
  resourceInput: ResourceInput;
  resourceResult: ResourceResult | null;
  resourceLoading: boolean;
  setResourceInput: <K extends keyof ResourceInput>(key: K, val: ResourceInput[K]) => void;
  runResourceAllocation: () => void;

  // Module 08 — Landslide
  landslideInput: LandslideInput;
  landslideResult: LandslideResult | null;
  landslideLoading: boolean;
  setLandslideInput: <K extends keyof LandslideInput>(key: K, val: LandslideInput[K]) => void;
  runLandslidePrediction: () => void;

  // Sirens
  sirens: SirenRecord[];
  activateSiren: (id: string) => void;
  silenceSiren: (id: string) => void;
  activateZone: (zone: string) => void;
  silenceAll: () => void;
  activateAll: () => void;

  // Shelters
  shelters: ShelterRecord[];
  updateShelterOccupancy: (id: string, occupancy: number) => void;

  // WebSocket telemetry
  telemetry: TelemetrySnapshot;
  wsConnected: boolean;
  setTelemetry: (t: Partial<TelemetrySnapshot>) => void;
  setWsConnected: (v: boolean) => void;
}

// ── Store Implementation ──────────────────────────────────────────────────────
export const useHazardStore = create<HazardState>((set, get) => ({
  // ── Alert system ──────────────────────────────────────────────────────────
  currentAlertLevel: 'RED',
  activeAlerts: [
    {
      id: 'alert-1',
      level: 'RED',
      type: 'FLOOD',
      district: 'Pune East',
      message:
        'Mula River gauge exceeded caution mark at 8.9m. Immediate evacuation advised for low-elevation wards.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
    },
    {
      id: 'alert-2',
      level: 'ORANGE',
      type: 'LANDSLIDE',
      district: 'Katraj',
      message:
        'Heavy rainfall combined with steep terrain. Landslide watch active for Katraj Ghats sector.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
    },
  ],

  acknowledgeAlert: (id) =>
    set((s) => ({
      activeAlerts: s.activeAlerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),

  triggerAlert: (alert) =>
    set((s) => ({
      activeAlerts: [
        {
          ...alert,
          id: `alert-${Date.now()}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        },
        ...s.activeAlerts,
      ],
    })),

  // ── Module 05 — Flood Prediction ──────────────────────────────────────────
  floodInput: {
    rainfall: 45,
    riverLevel: 6.2,
    damDischarge: 28000,
    soilMoisture: 65,
    humidity: 78,
    historicalFloodIndex: 4,
  },
  floodResult: null,
  floodLoading: false,

  setFloodInput: (key, val) =>
    set((s) => ({ floodInput: { ...s.floodInput, [key]: val } })),

  runFloodPrediction: () => {
    set({ floodLoading: true });
    setTimeout(() => {
      const { rainfall, riverLevel, damDischarge, soilMoisture, historicalFloodIndex } =
        get().floodInput;

      const overallProbability = Math.min(
        1,
        (rainfall / 200) * 0.3 +
          (riverLevel / 15) * 0.35 +
          (damDischarge / 100000) * 0.2 +
          (1 - soilMoisture / 100) * 0.15
      );

      const expectedWaterLevel = riverLevel + (rainfall / 50) * 0.8;
      const severity = getSeverity(overallProbability);

      const makeTimelineEntry = (
        window: '6h' | '12h' | '24h' | '48h',
        multiplier: number
      ): FloodTimelineEntry => {
        const prob = Math.min(1, overallProbability * multiplier);
        return {
          window,
          probability: prob,
          expectedWaterLevel: expectedWaterLevel * (0.85 + multiplier * 0.08),
          severity: getSeverity(prob),
        };
      };

      const timeline: FloodTimelineEntry[] = [
        makeTimelineEntry('6h', 0.75),
        makeTimelineEntry('12h', 0.9),
        makeTimelineEntry('24h', 1.05),
        makeTimelineEntry('48h', 1.15),
      ];

      const result: FloodPredictionResult = {
        overallProbability,
        expectedWaterLevel,
        severity,
        confidenceScore: 78 + Math.random() * 15,
        timeline,
        affectedRegions: [
          {
            name: 'Pune East',
            risk: severity === 'EXTREME' || severity === 'HIGH' ? 'HIGH' : 'MODERATE',
            population: 142000,
          },
          {
            name: 'Shivajinagar',
            risk: overallProbability >= 0.55 ? 'MODERATE' : 'LOW',
            population: 98000,
          },
          {
            name: 'Kothrud',
            risk: overallProbability >= 0.75 ? 'MODERATE' : 'LOW',
            population: 76000,
          },
        ],
        governmentAdvisory: getAdvisoryForFlood(severity),
      };

      set({ floodResult: result, floodLoading: false });
    }, 1200);
  },

  // ── Module 06 — Evacuation Route ─────────────────────────────────────────
  evacuationInput: {
    source: 'Pune Cantonment',
    destination: 'Magarpatta Shelter',
    blockedRoads: [],
    hazardZones: [],
  },
  evacuationResult: null,
  evacuationLoading: false,

  setEvacuationInput: (key, val) =>
    set((s) => ({ evacuationInput: { ...s.evacuationInput, [key]: val } })),

  runEvacuationRoute: () => {
    set({ evacuationLoading: true });
    setTimeout(() => {
      const { source, destination } = get().evacuationInput;

      const safestRoute: EvacuationRoute = {
        path: [source, 'NH-48 Junction', 'Swargate', destination],
        travelTimeMinutes: 25 + Math.random() * 20,
        distanceKm: 12.4,
        safetyScore: 87,
        isSafest: true,
      };

      const alternativeRoutes: EvacuationRoute[] = [
        {
          path: [source, 'Camp Road', 'Deccan Gymkhana', destination],
          travelTimeMinutes: 35 + Math.random() * 15,
          distanceKm: 14.8,
          safetyScore: 74,
          isSafest: false,
        },
        {
          path: [source, 'Bund Garden Road', 'Koregaon Park', destination],
          travelTimeMinutes: 42 + Math.random() * 18,
          distanceKm: 17.2,
          safetyScore: 61,
          isSafest: false,
        },
      ];

      const result: EvacuationResult = {
        safestRoute,
        alternativeRoutes,
        recommendedShelters: [
          {
            name: 'Bal Gandharva Shelter Camp',
            distance: '3.2 km',
            capacity: 500,
            occupancy: 340,
          },
          {
            name: 'Hadapsar Sports Complex',
            distance: '7.6 km',
            capacity: 400,
            occupancy: 120,
          },
          {
            name: 'Nehru Stadium Relief Centre',
            distance: '9.1 km',
            capacity: 800,
            occupancy: 720,
          },
        ],
        algorithm: 'DIJKSTRA',
      };

      set({ evacuationResult: result, evacuationLoading: false });
    }, 1200);
  },

  // ── Module 07 — Resource Allocation ──────────────────────────────────────
  resourceInput: {
    population: 50000,
    threatLevel: 7,
    shelterOccupancy: 65,
    foodInventory: 8000,
    waterInventory: 120000,
    medicalInventory: 350,
  },
  resourceResult: null,
  resourceLoading: false,

  setResourceInput: (key, val) =>
    set((s) => ({ resourceInput: { ...s.resourceInput, [key]: val } })),

  runResourceAllocation: () => {
    set({ resourceLoading: true });
    setTimeout(() => {
      const {
        population,
        threatLevel,
        shelterOccupancy,
        foodInventory,
        waterInventory,
        medicalInventory,
      } = get().resourceInput;

      const trucksNeeded = Math.ceil((population / 5000) * (threatLevel / 5));
      const foodPackets = Math.ceil(population * 0.3 * (threatLevel / 10));
      const waterRequired = Math.ceil(foodPackets * 3.5);
      const medicinesRequired = Math.ceil(population * 0.05);
      const priorityScore = Math.min(
        100,
        threatLevel * 8 + (shelterOccupancy > 80 ? 20 : 0)
      );

      const criticalShortages: string[] = [];
      if (foodInventory < foodPackets) criticalShortages.push('Food Packets');
      if (waterInventory < waterRequired) criticalShortages.push('Water Supply');
      if (medicalInventory < medicinesRequired) criticalShortages.push('Medical Kits');

      const result: ResourceResult = {
        trucksNeeded,
        foodPackets,
        medicinesRequired,
        waterRequired,
        priorityScore,
        criticalShortages,
        deploymentPlan: [
          {
            resource: 'Food Packets',
            quantity: foodPackets,
            destination: 'Bal Gandharva Shelter Camp',
            priority: priorityScore >= 80 ? 'CRITICAL' : priorityScore >= 56 ? 'HIGH' : 'NORMAL',
          },
          {
            resource: 'Water Tankers',
            quantity: Math.ceil(waterRequired / 10000),
            destination: 'Nehru Stadium Relief Centre',
            priority: priorityScore >= 80 ? 'CRITICAL' : 'HIGH',
          },
          {
            resource: 'Medical Kits',
            quantity: medicinesRequired,
            destination: 'District Civil Hospital',
            priority: 'HIGH',
          },
          {
            resource: 'Rescue Trucks',
            quantity: trucksNeeded,
            destination: 'Pune East Ward',
            priority: 'CRITICAL',
          },
        ],
      };

      set({ resourceResult: result, resourceLoading: false });
    }, 1200);
  },

  // ── Module 08 — Landslide Prediction ─────────────────────────────────────
  landslideInput: {
    rainfall: 85,
    terrainSlope: 35,
    soilType: 'CLAY',
    vegetationIndex: 0.42,
  },
  landslideResult: null,
  landslideLoading: false,

  setLandslideInput: (key, val) =>
    set((s) => ({ landslideInput: { ...s.landslideInput, [key]: val } })),

  runLandslidePrediction: () => {
    set({ landslideLoading: true });
    setTimeout(() => {
      const { rainfall, terrainSlope, vegetationIndex } = get().landslideInput;

      const riskProbability = Math.min(
        1,
        (rainfall / 200) * 0.4 +
          (terrainSlope / 90) * 0.35 +
          (1 - vegetationIndex) * 0.25
      );

      let alertLevel: AlertLevel = 'GREEN';
      let evacuationUrgency: LandslideResult['evacuationUrgency'] = 'NORMAL';

      if (riskProbability >= 0.75) {
        alertLevel = 'RED';
        evacuationUrgency = 'IMMEDIATE';
      } else if (riskProbability >= 0.55) {
        alertLevel = 'ORANGE';
        evacuationUrgency = 'MONITOR';
      } else if (riskProbability >= 0.35) {
        alertLevel = 'YELLOW';
        evacuationUrgency = 'WATCH';
      }

      const baseScore = Math.round(riskProbability * 100);

      const result: LandslideResult = {
        riskProbability,
        alertLevel,
        confidenceScore: 72 + Math.random() * 18,
        evacuationUrgency,
        affectedVillages: [
          {
            name: 'Katraj Village',
            population: 4200,
            riskScore: Math.min(100, baseScore + 8),
            distance: '0.8 km from slope edge',
          },
          {
            name: 'Ambegaon Budruk',
            population: 6800,
            riskScore: Math.min(100, baseScore + 2),
            distance: '1.4 km from slope edge',
          },
          {
            name: 'Dattawadi',
            population: 3100,
            riskScore: Math.max(0, baseScore - 12),
            distance: '2.1 km from slope edge',
          },
          {
            name: 'Nanded Village',
            population: 2400,
            riskScore: Math.max(0, baseScore - 22),
            distance: '3.5 km from slope edge',
          },
        ],
        governmentAdvisory: getAdvisoryForLandslide(evacuationUrgency),
        modelSource: 'rule_engine',
      };

      set({ landslideResult: result, landslideLoading: false });
    }, 1200);
  },

  // ── Sirens ────────────────────────────────────────────────────────────────
  sirens: [
    {
      id: 'sr-1',
      name: 'Mula-Mutha Confluence Siren',
      location: 'Sangam Bridge, Pune',
      status: 'ACTIVE',
      coverage: '2.5 km',
      zone: 'ZONE-A',
      lastActivated: '2026-06-13T17:30:00Z',
    },
    {
      id: 'sr-2',
      name: 'Sector 4 Emergency Mast',
      location: 'Sector 4 Sports Ground',
      status: 'SILENT',
      coverage: '3.0 km',
      zone: 'ZONE-B',
      lastActivated: null,
    },
    {
      id: 'sr-3',
      name: 'Hill Slope Early Warning Siren',
      location: 'Katraj Ghats',
      status: 'SILENT',
      coverage: '1.5 km',
      zone: 'ZONE-C',
      lastActivated: null,
    },
    {
      id: 'sr-4',
      name: 'Civic HQ Central Alarm',
      location: 'Municipal Corporation Plaza',
      status: 'OFFLINE',
      coverage: '5.0 km',
      zone: 'ZONE-A',
      lastActivated: null,
    },
    {
      id: 'sr-5',
      name: 'Hadapsar Industrial Siren',
      location: 'Hadapsar Industrial Estate',
      status: 'SILENT',
      coverage: '2.0 km',
      zone: 'ZONE-D',
      lastActivated: null,
    },
  ],

  activateSiren: (id) =>
    set((s) => ({
      sirens: s.sirens.map((sr) =>
        sr.id === id && sr.status !== 'OFFLINE'
          ? { ...sr, status: 'ACTIVE', lastActivated: new Date().toISOString() }
          : sr
      ),
    })),

  silenceSiren: (id) =>
    set((s) => ({
      sirens: s.sirens.map((sr) =>
        sr.id === id && sr.status !== 'OFFLINE' ? { ...sr, status: 'SILENT' } : sr
      ),
    })),

  activateZone: (zone) =>
    set((s) => ({
      sirens: s.sirens.map((sr) =>
        sr.zone === zone && sr.status !== 'OFFLINE'
          ? { ...sr, status: 'ACTIVE', lastActivated: new Date().toISOString() }
          : sr
      ),
    })),

  silenceAll: () =>
    set((s) => ({
      sirens: s.sirens.map((sr) =>
        sr.status !== 'OFFLINE' ? { ...sr, status: 'SILENT' } : sr
      ),
    })),

  activateAll: () =>
    set((s) => ({
      sirens: s.sirens.map((sr) =>
        sr.status !== 'OFFLINE'
          ? { ...sr, status: 'ACTIVE', lastActivated: new Date().toISOString() }
          : sr
      ),
    })),

  // ── Shelters ──────────────────────────────────────────────────────────────
  shelters: [
    {
      id: 'sh-1',
      name: 'Bal Gandharva Shelter Camp',
      district: 'Pune Central',
      capacity: 500,
      currentOccupancy: 340,
      foodStock: 4,
      waterStock: 6,
      medicalStock: 8,
      volunteers: 24,
      status: 'OPEN',
      coordinates: { lat: 18.5196, lng: 73.8553 },
    },
    {
      id: 'sh-2',
      name: 'Nehru Stadium Relief Centre',
      district: 'Shivajinagar',
      capacity: 800,
      currentOccupancy: 720,
      foodStock: 2,
      waterStock: 3,
      medicalStock: 5,
      volunteers: 42,
      status: 'OPEN',
      coordinates: { lat: 18.5308, lng: 73.8475 },
    },
    {
      id: 'sh-3',
      name: 'Hadapsar Sports Complex',
      district: 'Hadapsar',
      capacity: 400,
      currentOccupancy: 120,
      foodStock: 7,
      waterStock: 9,
      medicalStock: 12,
      volunteers: 18,
      status: 'OPEN',
      coordinates: { lat: 18.5018, lng: 73.9257 },
    },
    {
      id: 'sh-4',
      name: 'Katraj Community Hall',
      district: 'Katraj',
      capacity: 250,
      currentOccupancy: 250,
      foodStock: 1,
      waterStock: 2,
      medicalStock: 3,
      volunteers: 8,
      status: 'FULL',
      coordinates: { lat: 18.4529, lng: 73.8687 },
    },
  ],

  updateShelterOccupancy: (id, occupancy) =>
    set((s) => ({
      shelters: s.shelters.map((sh) =>
        sh.id === id ? { ...sh, currentOccupancy: occupancy } : sh
      ),
    })),

  // ── WebSocket Telemetry ───────────────────────────────────────────────────
  telemetry: {
    riverLevel: 8.2,
    rainfall: 45,
    shelterOccupancyPct: 68,
    activeSirens: 1,
    alertLevel: 'RED',
    lastUpdated: new Date().toISOString(),
  },
  wsConnected: false,

  setTelemetry: (t) =>
    set((s) => ({ telemetry: { ...s.telemetry, ...t } })),

  setWsConnected: (v) => set({ wsConnected: v }),
}));
