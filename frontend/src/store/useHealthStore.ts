// store/useHealthStore.ts
import { create } from 'zustand';
import { 
  HealthDashboardSummary, OutbreakPrediction, HospitalForecast, 
  AmbulanceDispatch, MedicineForecast, VaccinationForecast, 
  HealthAgentReport, SimulationRun 
} from '../types/health';

interface HealthState {
  summary: HealthDashboardSummary | null;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  wsInstance: WebSocket | null;
  
  // Real-time Event Feed
  eventsFeed: Array<{ id: string; type: string; message: string; timestamp: string }>;

  // Active predictions / responses
  lastOutbreakPrediction: OutbreakPrediction | null;
  lastAgentReport: HealthAgentReport | null;
  lastSimulationRun: SimulationRun | null;
  
  // Chat History for Agent
  agentChatHistory: Array<{ role: 'user' | 'agent'; text: string; report?: HealthAgentReport }>;

  // Actions
  fetchSummary: () => Promise<void>;
  predictOutbreak: (data: {
    disease: string;
    disease_reports: number;
    historical_outbreaks: number;
    temperature: number;
    humidity: number;
    rainfall: number;
    sanitation_index: number;
    population_density: number;
  }) => Promise<OutbreakPrediction>;
  
  // Hospital actions
  admitPatient: (data: { hospital_id: number; patient_name: string; bed_type: string }) => Promise<any>;
  dischargePatient: (data: { admission_id: number; medical_notes?: string }) => Promise<any>;
  
  // Medicine actions
  logMedicineUsage: (data: { pharmacy_name: string; medicine_name: string; quantity_sold: number }) => Promise<any>;
  
  // Vaccination actions
  recommendVaccine: (patientName: string, disease: string) => Promise<any>;
  administerVaccine: (data: { center_id: number; patient_name: string; vaccine_id: number; dose_number: number }) => Promise<any>;
  updateVaccineStock: (data: { center_id: number; vaccine_id: number; quantity: number }) => Promise<any>;
  
  // Ambulance actions
  registerAmbulance: (data: { plate_number: string; vehicle_type: string }) => Promise<any>;
  updateAmbulanceLocation: (data: { ambulance_id: number; latitude: number; longitude: number }) => Promise<any>;
  requestAmbulance: (data: { emergency_lat: number; emergency_lng: number; severity_level: string }) => Promise<any>;
  dispatchAmbulance: (requestId: number, traffic?: string) => Promise<any>;
  
  // Agent & Simulation actions
  queryAgent: (queryText: string, district?: string) => Promise<HealthAgentReport>;
  runSimulation: (params: any) => Promise<SimulationRun>;

  // Real-time WebSockets Init
  initializeWebSocket: () => void;
  closeWebSocket: () => void;
  addChatMessage: (msg: { role: 'user' | 'agent'; text: string; report?: HealthAgentReport }) => void;
}

const API_BASE = 'http://localhost:8000/api/health';
const WS_BASE = 'ws://localhost:8000/api/health/ws';

export const useHealthStore = create<HealthState>((set, get) => ({
  summary: null,
  loading: false,
  error: null,
  wsConnected: false,
  wsInstance: null,
  eventsFeed: [],
  
  lastOutbreakPrediction: null,
  lastAgentReport: null,
  lastSimulationRun: null,
  agentChatHistory: [],

  addChatMessage: (msg) => {
    set((state) => ({ agentChatHistory: [...state.agentChatHistory, msg] }));
  },

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (!res.ok) throw new Error('Failed to load dashboard summary stats');
      const data = await res.json();
      set({ summary: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  predictOutbreak: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/outbreak/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Outbreak prediction request failed');
      const data = await res.json();
      set({ lastOutbreakPrediction: data, loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  admitPatient: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/hospital/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Patient admission failed');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  dischargePatient: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/hospital/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Patient discharge failed');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logMedicineUsage: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/medicine/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to log medicine usage');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  recommendVaccine: async (patientName, disease) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/vaccination/recommend?patient_name=${encodeURIComponent(patientName)}&disease=${encodeURIComponent(disease)}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Vaccine recommendation failed');
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  administerVaccine: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/vaccination/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Vaccination record log failed');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateVaccineStock: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/vaccination/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to update vaccine stock');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  registerAmbulance: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/ambulance/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Ambulance registration failed');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateAmbulanceLocation: async (params) => {
    try {
      await fetch(`${API_BASE}/ambulance/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (err) {
      console.error("Failed to update ambulance location:", err);
    }
  },

  requestAmbulance: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/ambulance/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Ambulance request dispatch failed');
      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  dispatchAmbulance: async (requestId, traffic = 'moderate') => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/ambulance/dispatch?request_id=${requestId}&traffic=${traffic}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Ambulance dispatch command failed');
      const data = await res.json();
      set({ loading: false });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  queryAgent: async (queryText, district = 'Lucknow') => {
    set({ loading: true, error: null });
    get().addChatMessage({ role: 'user', text: queryText });
    
    try {
      const res = await fetch(`${API_BASE}/agent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_text: queryText, district_name: district }),
      });
      if (!res.ok) throw new Error('AI Governance Agent failed to respond');
      const data = await res.json();
      
      const agentResponseText = `Risk Level: ${data.risk_level}\n\nContributing Factors:\n${data.key_issues.map((f: string) => `• ${f}`).join('\n')}\n\nRecommended Actions:\n${data.recommended_actions.map((f: string) => `• ${f}`).join('\n')}\n\nConfidence Score: ${(data.confidence_score * 100).toFixed(0)}%`;
      
      set({ lastAgentReport: data, loading: false });
      get().addChatMessage({ role: 'agent', text: agentResponseText, report: data });
      get().fetchSummary();
      return data;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      get().addChatMessage({ role: 'agent', text: `Sorry, I encountered an error: ${err.message}` });
      throw err;
    }
  },

  runSimulation: async (params) => {
    // Generate compartmental SEIR simulation mathematically in frontend for responsiveness
    // and to match scenario building parameters
    set({ loading: true, error: null });
    try {
      // Direct mock math SEIR run to render timeline charts instantly without lagging
      const days = params.time_horizon || 90;
      const pop = params.population || 1000000;
      const initial_infected = params.initial_infected || 100;
      const beta = params.transmission_rate || 0.35;
      const gamma = 1 / (params.recovery_days || 7);
      const sigma = 1 / (params.incubation_days || 5);
      
      let S = pop - initial_infected;
      let E = 0;
      let I = initial_infected;
      let R = 0;
      
      const timeline = [];
      let peakInfected = 0;
      let peakDay = 0;
      let totalCases = initial_infected;

      for (let day = 1; day <= days; day++) {
        const new_exposed = (beta * S * I) / pop;
        const new_infected = sigma * E;
        const new_recovered = gamma * I;

        S = Math.max(0, S - new_exposed);
        E = Math.max(0, E + new_exposed - new_infected);
        I = Math.max(0, I + new_infected - new_recovered);
        R = Math.max(0, R + new_recovered);

        totalCases += new_infected;
        if (I > peakInfected) {
          peakInfected = I;
          peakDay = day;
        }

        timeline.push({
          day,
          S: Math.round(S),
          E: Math.round(E),
          I: Math.round(I),
          R: Math.round(R),
          new_cases: Math.round(new_infected)
        });
      }

      const simRun: SimulationRun = {
        simulation_id: Math.random().toString(36).substr(2, 9),
        simulation_type: params.scenario_type || 'outbreak',
        district_name: params.district_name || 'Lucknow',
        parameters: params,
        timeline: timeline,
        impact_metrics: {
          peak_day: peakDay,
          peak_infected: Math.round(peakInfected),
          total_cases_simulated: Math.round(totalCases),
          attack_rate_pct: parseFloat(((totalCases / pop) * 100).toFixed(2)),
          total_recovered_final: Math.round(R)
        },
        resource_utilization: {
          peak_bed_demand: Math.round(peakInfected * 0.15),
          peak_icu_demand: Math.round(peakInfected * 0.05)
        },
        mortality_reduction_pct: params.intervention_day ? 15.5 : 0.0
      };

      set({ lastSimulationRun: simRun, loading: false });
      return simRun;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  initializeWebSocket: () => {
    if (get().wsInstance) return;

    console.log("Connecting to Health WebSocket: " + WS_BASE);
    const ws = new WebSocket(WS_BASE);

    ws.onopen = () => {
      set({ wsConnected: true, wsInstance: ws });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.event_type || !msg.data) return;

        const currentSummary = get().summary;
        const newSummary = currentSummary ? { ...currentSummary } : null;

        // Push to real-time events feed
        const timestamp = new Date().toLocaleTimeString();
        let messageText = "";

        switch (msg.event_type) {
          case "OUTBREAK_PREDICTION":
            messageText = `Disease outbreak warning: ${msg.data.disease} risk calculated at ${(msg.data.outbreak_probability * 100).toFixed(0)}% in ${msg.data.district_name || "district"}.`;
            if (newSummary) {
              const mapped = {
                id: msg.data.prediction_id || msg.data.id,
                district: msg.data.district_name || "Lucknow",
                disease: msg.data.disease,
                prob: msg.data.outbreak_probability,
                severity: 0.5,
                cases_7d: int(msg.data.expected_case_growth),
                time: msg.data.created_at
              };
              newSummary.recent_outbreaks = [mapped, ...newSummary.recent_outbreaks.slice(0, 9)];
              newSummary.kpis.high_outbreak_zones = newSummary.recent_outbreaks.filter(o => o.prob > 0.7).length;
            }
            break;
            
          case "HOSPITAL_ADMISSION":
            messageText = `Hospital admission logged: Patient admitted to bed ${msg.data.bed_number || "G-1"} at ${msg.data.hospital_name || "Hospital"}.`;
            if (newSummary) {
              const idx = newSummary.recent_hospital_loads.findIndex(h => h.id === msg.data.hospital_id);
              if (idx > -1) {
                newSummary.recent_hospital_loads[idx].occupancy = msg.data.occupied_beds;
                newSummary.recent_hospital_loads[idx].shortage = msg.data.occupancy_rate >= 85.0;
              }
              newSummary.kpis.hospital_bed_alerts = newSummary.recent_hospital_loads.filter(h => h.shortage).length;
            }
            break;

          case "HOSPITAL_DISCHARGE":
            messageText = `Patient discharge logged: Released from bed at ${msg.data.hospital_name || "Hospital"}.`;
            if (newSummary) {
              const idx = newSummary.recent_hospital_loads.findIndex(h => h.id === msg.data.hospital_id);
              if (idx > -1) {
                newSummary.recent_hospital_loads[idx].occupancy = msg.data.occupied_beds;
                newSummary.recent_hospital_loads[idx].shortage = msg.data.occupancy_rate >= 85.0;
              }
              newSummary.kpis.hospital_bed_alerts = newSummary.recent_hospital_loads.filter(h => h.shortage).length;
            }
            break;

          case "DISEASE_SURVEILLANCE_ALERT":
            messageText = `Surveillance spike alarm: ${msg.data.match_percentage}% matching profiles for ${msg.data.disease}.`;
            if (newSummary) {
              newSummary.active_alerts += 1;
            }
            break;

          case "VACCINATION_ADMINISTERED":
            messageText = `Vaccination dose administered: Center ID ${msg.data.center_id} patient ${msg.data.patient_name}.`;
            break;

          case "VACCINATION_ALERT":
            messageText = `Vaccine supply warning: ${msg.data.message}`;
            if (newSummary) {
              newSummary.kpis.critical_stockout_medicines = newSummary.recent_medicines.filter(m => m.risk === 'CRITICAL' || m.risk === 'HIGH').length;
            }
            break;

          case "AMBULANCE_LOCATION_UPDATE":
            messageText = `Ambulance position update: ID ${msg.data.ambulance_id} is currently ${msg.data.status}.`;
            break;

          case "AMBULANCE_DISPATCHED":
            messageText = `Emergency Dispatch Alert: Ambulance dispatched to incident. ETA: ${msg.data.eta_minutes} mins.`;
            if (newSummary) {
              const mapped = {
                dispatch_id: msg.data.dispatch_id,
                plate: msg.data.plate || "UP-32-AMB-101",
                hospital: msg.data.hospital || "District Hospital",
                eta: msg.data.eta_minutes,
                status: "DISPATCHED",
                severity: msg.data.severity || "critical",
                lat: msg.data.lat || 26.85,
                lng: msg.data.lng || 80.95,
                time: msg.data.created_at
              };
              newSummary.recent_dispatches = [mapped, ...newSummary.recent_dispatches.slice(0, 14)];
              newSummary.kpis.active_ambulance_dispatches = newSummary.recent_dispatches.filter(d => d.status !== 'COMPLETED').length;
            }
            break;
            
          default:
            messageText = `Health system update logged.`;
        }

        const newEvent = {
          id: Math.random().toString(),
          type: msg.event_type,
          message: messageText,
          timestamp: timestamp
        };

        set((state) => ({ 
          eventsFeed: [newEvent, ...state.eventsFeed.slice(0, 49)],
          summary: newSummary || state.summary
        }));

      } catch (e) {
        console.error("Error parsing WebSocket event data:", e);
      }
    };

    ws.onclose = () => {
      set({ wsConnected: false, wsInstance: null });
      setTimeout(() => {
        if (get().wsInstance === null) {
          get().initializeWebSocket();
        }
      }, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  },

  closeWebSocket: () => {
    const ws = get().wsInstance;
    if (ws) {
      ws.close();
      set({ wsConnected: false, wsInstance: null });
    }
  }
}));

// Helper to convert float to int in TypeScript
function int(val: any): number {
  return Math.round(parseFloat(val) || 0);
}
