'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore } from '@/store/useGovStore';
import {
  Radio, ShieldAlert, AlertTriangle, Users, MapPin,
  Clock, Truck, CheckCircle2, ChevronRight, Activity, Bell,
  Shield, Heart, Flame, PlusCircle, Play, 
  HelpCircle, RefreshCw, BarChart2, Check, Send, Award,
  CloudLightning, CloudRain, Sun, Wind, Droplets, Thermometer,
  Layers, Zap, Map, Info, Compass, Box, Terminal,
  TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Multi-Module Type Definitions
interface Incident {
  id: string;
  title: string;
  category: 'Health' | 'Hazards' | 'Infrastructure' | 'Agriculture' | 'Transport' | 'Complaints' | 'Utilities';
  state: string;
  district: string;
  severity: 'Critical' | 'High Risk' | 'Watch' | 'Safe';
  affectedPop: string;
  riskScore: number;
  impact: string;
  teams: string;
  resources: string;
  recommendation: string;
  timestamp: string;
  timeline: { time: string; note: string; status: 'Critical' | 'Warning' | 'System' | 'Resolved' }[];
}

interface StateTelemetry {
  name: string;
  capital: string;
  districts: { name: string; risk: 'Critical' | 'High Risk' | 'Watch' | 'Safe'; score: number }[];
  health: { spreadIndex: number; hospLoad: number; medStock: number; vaccination: number; outbreaks: number };
  infra: { bridgeRisk: number; roadClosures: number; damStress: number; gridFailures: number; maintEmerg: number };
  agro: { diseaseAlerts: number; droughtZones: number; waterStress: number; pestClusters: number; yieldRisk: number };
  weather: { temp: number; condition: string; windSpeed: number; humidity: number; alerts: string };
  coordinates: { cx: number; cy: number };
  path: string; // Simplified State SVG outline path
}

// Detailed Mock State Telemetry mapping to build a real India GIS Map
const STATE_DATABASE: Record<string, StateTelemetry> = {
  'Maharashtra': {
    name: 'Maharashtra',
    capital: 'Mumbai',
    districts: [
      { name: 'Pune', risk: 'High Risk', score: 78 },
      { name: 'Kolhapur', risk: 'Critical', score: 94 },
      { name: 'Solapur', risk: 'Watch', score: 55 },
      { name: 'Mumbai City', risk: 'Watch', score: 48 },
      { name: 'Nagpur', risk: 'Safe', score: 20 }
    ],
    health: { spreadIndex: 4.8, hospLoad: 82, medStock: 89, vaccination: 92, outbreaks: 5 },
    infra: { bridgeRisk: 4, roadClosures: 12, damStress: 78, gridFailures: 3, maintEmerg: 8 },
    agro: { diseaseAlerts: 2, droughtZones: 3, waterStress: 65, pestClusters: 1, yieldRisk: 30 },
    weather: { temp: 28, condition: 'Heavy Rain', windSpeed: 24, humidity: 95, alerts: 'Monsoon Flooding Alert' },
    coordinates: { cx: 210, cy: 320 },
    path: 'M 160 270 L 220 270 L 260 290 L 280 340 L 250 380 L 190 360 L 175 320 Z'
  },
  'Odisha': {
    name: 'Odisha',
    capital: 'Bhubaneswar',
    districts: [
      { name: 'Puri', risk: 'Critical', score: 96 },
      { name: 'Cuttack', risk: 'Critical', score: 91 },
      { name: 'Ganjam', risk: 'High Risk', score: 82 },
      { name: 'Balasore', risk: 'Watch', score: 60 }
    ],
    health: { spreadIndex: 3.1, hospLoad: 74, medStock: 85, vaccination: 88, outbreaks: 2 },
    infra: { bridgeRisk: 6, roadClosures: 8, damStress: 82, gridFailures: 5, maintEmerg: 11 },
    agro: { diseaseAlerts: 1, droughtZones: 1, waterStress: 40, pestClusters: 0, yieldRisk: 15 },
    weather: { temp: 26, condition: 'Cyclone Landfall Storm', windSpeed: 110, humidity: 98, alerts: 'Red Alert: Cyclone Warning' },
    coordinates: { cx: 310, cy: 300 },
    path: 'M 290 280 L 330 270 L 350 310 L 320 345 L 290 325 Z'
  },
  'Uttar Pradesh': {
    name: 'Uttar Pradesh',
    capital: 'Lucknow',
    districts: [
      { name: 'Lucknow', risk: 'Watch', score: 58 },
      { name: 'Kanpur', risk: 'Watch', score: 50 },
      { name: 'Varanasi', risk: 'Safe', score: 35 },
      { name: 'Gautam Buddha Nagar', risk: 'Safe', score: 28 }
    ],
    health: { spreadIndex: 2.5, hospLoad: 55, medStock: 91, vaccination: 94, outbreaks: 1 },
    infra: { bridgeRisk: 1, roadClosures: 4, damStress: 40, gridFailures: 2, maintEmerg: 5 },
    agro: { diseaseAlerts: 4, droughtZones: 8, waterStress: 85, pestClusters: 3, yieldRisk: 58 },
    weather: { temp: 42, condition: 'Extreme Heatwave', windSpeed: 12, humidity: 15, alerts: 'Yellow Warning: Heatwave' },
    coordinates: { cx: 270, cy: 190 },
    path: 'M 220 160 L 290 145 L 340 190 L 320 220 L 260 210 L 235 190 Z'
  },
  'Bihar': {
    name: 'Bihar',
    capital: 'Patna',
    districts: [
      { name: 'Patna', risk: 'High Risk', score: 72 },
      { name: 'Darbhanga', risk: 'High Risk', score: 80 },
      { name: 'Gaya', risk: 'Watch', score: 45 }
    ],
    health: { spreadIndex: 3.4, hospLoad: 68, medStock: 80, vaccination: 86, outbreaks: 3 },
    infra: { bridgeRisk: 2, roadClosures: 7, damStress: 62, gridFailures: 1, maintEmerg: 4 },
    agro: { diseaseAlerts: 3, droughtZones: 2, waterStress: 50, pestClusters: 1, yieldRisk: 25 },
    weather: { temp: 31, condition: 'Heavy Showers', windSpeed: 18, humidity: 90, alerts: 'Flood Advisory: River Levels rising' },
    coordinates: { cx: 330, cy: 200 },
    path: 'M 320 180 L 360 175 L 370 210 L 325 215 Z'
  },
  'Rajasthan': {
    name: 'Rajasthan',
    capital: 'Jaipur',
    districts: [
      { name: 'Jaipur', risk: 'Safe', score: 38 },
      { name: 'Jodhpur', risk: 'Watch', score: 48 },
      { name: 'Barmer', risk: 'Watch', score: 55 }
    ],
    health: { spreadIndex: 1.8, hospLoad: 48, medStock: 88, vaccination: 90, outbreaks: 0 },
    infra: { bridgeRisk: 0, roadClosures: 2, damStress: 30, gridFailures: 1, maintEmerg: 3 },
    agro: { diseaseAlerts: 1, droughtZones: 12, waterStress: 94, pestClusters: 2, yieldRisk: 62 },
    weather: { temp: 44, condition: 'Sunny / Dry', windSpeed: 20, humidity: 8, alerts: 'Drought Warning active' },
    coordinates: { cx: 175, cy: 200 },
    path: 'M 130 190 L 195 170 L 210 220 L 155 250 L 125 230 Z'
  },
  'Karnataka': {
    name: 'Karnataka',
    capital: 'Bengaluru',
    districts: [
      { name: 'Bengaluru Urban', risk: 'Safe', score: 32 },
      { name: 'Udupi', risk: 'Watch', score: 50 },
      { name: 'Belagavi', risk: 'Safe', score: 25 }
    ],
    health: { spreadIndex: 2.1, hospLoad: 60, medStock: 94, vaccination: 96, outbreaks: 1 },
    infra: { bridgeRisk: 1, roadClosures: 3, damStress: 48, gridFailures: 1, maintEmerg: 2 },
    agro: { diseaseAlerts: 1, droughtZones: 4, waterStress: 70, pestClusters: 0, yieldRisk: 28 },
    weather: { temp: 27, condition: 'Cloudy', windSpeed: 15, humidity: 75, alerts: 'Coastal Tide Advisory' },
    coordinates: { cx: 200, cy: 400 },
    path: 'M 185 370 L 210 375 L 218 435 L 195 460 L 180 410 Z'
  },
  'Gujarat': {
    name: 'Gujarat',
    capital: 'Gandhinagar',
    districts: [
      { name: 'Ahmedabad', risk: 'Watch', score: 52 },
      { name: 'Surat', risk: 'Watch', score: 48 },
      { name: 'Kutch', risk: 'Safe', score: 22 }
    ],
    health: { spreadIndex: 2.2, hospLoad: 58, medStock: 90, vaccination: 92, outbreaks: 1 },
    infra: { bridgeRisk: 2, roadClosures: 5, damStress: 42, gridFailures: 4, maintEmerg: 6 },
    agro: { diseaseAlerts: 0, droughtZones: 5, waterStress: 80, pestClusters: 1, yieldRisk: 35 },
    weather: { temp: 36, condition: 'Dry Wind', windSpeed: 25, humidity: 45, alerts: 'Industrial Area Inspection Warning' },
    coordinates: { cx: 130, cy: 250 },
    path: 'M 105 230 L 150 250 L 155 285 L 115 285 L 100 255 Z'
  },
  'Tamil Nadu': {
    name: 'Tamil Nadu',
    capital: 'Chennai',
    districts: [
      { name: 'Chennai', risk: 'Safe', score: 30 },
      { name: 'Coimbatore', risk: 'Safe', score: 24 },
      { name: 'Madurai', risk: 'Safe', score: 18 }
    ],
    health: { spreadIndex: 1.5, hospLoad: 50, medStock: 95, vaccination: 98, outbreaks: 0 },
    infra: { bridgeRisk: 0, roadClosures: 1, damStress: 35, gridFailures: 0, maintEmerg: 1 },
    agro: { diseaseAlerts: 0, droughtZones: 2, waterStress: 60, pestClusters: 0, yieldRisk: 18 },
    weather: { temp: 32, condition: 'Clear Sky', windSpeed: 14, humidity: 65, alerts: 'Optimal Parameters' },
    coordinates: { cx: 230, cy: 470 },
    path: 'M 215 440 L 238 445 L 242 490 L 220 505 L 210 470 Z'
  }
};

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-204',
    title: 'Panchganga Hydrology Overload',
    category: 'Hazards',
    state: 'Maharashtra',
    district: 'Kolhapur',
    severity: 'Critical',
    affectedPop: '2.4M',
    riskScore: 94,
    impact: 'Extreme low-lying sector flooding. Structural damage to key secondary road links.',
    teams: '3 NDRF Battalions + Navy Rescue Team C',
    resources: '50 Rescue boats, 10,000 sandbags, 4 mobile medical units',
    recommendation: 'Deploy immediate pump relays, evacuate low sectors 3-9, shut down local transformer banks.',
    timestamp: '11:06 PM',
    timeline: [
      { time: '11:06 PM', note: 'Cyclone landfall alert flagged by hydrology sensors', status: 'Critical' },
      { time: '11:07 PM', note: 'NDRF disaster response units deployed to Kolhapur', status: 'Warning' },
      { time: '11:12 PM', note: 'District collector notified and evacuation protocol activated', status: 'System' },
      { time: '11:15 PM', note: 'Relief shelters fully activated in Sector 4B', status: 'Resolved' }
    ]
  },
  {
    id: 'INC-109',
    title: 'Dengue Viral Outbreak Cluster',
    category: 'Health',
    state: 'Maharashtra',
    district: 'Pune',
    severity: 'High Risk',
    affectedPop: '42k',
    riskScore: 78,
    impact: 'Larval indexes exceeding 65%. Emergency clinics reporting high caseloads.',
    teams: 'Pune Vector Control + WHO Local Observers',
    resources: '10 fogging rigs, 5,000 insecticide packets, 200 emergency hospital beds',
    recommendation: 'Targeted spatial spraying in Sector 4B, set up temporary fever ward at Civil Center.',
    timestamp: '10:45 PM',
    timeline: [
      { time: '10:45 PM', note: 'Alert flagged from municipal clinic logs', status: 'Critical' },
      { time: '10:50 PM', note: 'Fever monitoring units dispatched to Hadapsar Ward', status: 'Warning' }
    ]
  },
  {
    id: 'INC-308',
    title: 'Dam Silt Expansion Strain',
    category: 'Infrastructure',
    state: 'Odisha',
    district: 'Puri',
    severity: 'Critical',
    riskScore: 96,
    affectedPop: '680k',
    impact: 'Silt accumulation causing excess bypass gate expansion pressure.',
    teams: 'Odisha Irrigation Board + PWD Civil Eng.',
    resources: 'Silt dredging equipment, structural monitor beacons',
    recommendation: 'Incremental spillway release of 12,000 cusecs, inspect main joints.',
    timestamp: '09:30 PM',
    timeline: [
      { time: '09:30 PM', note: 'Expansion beacons logged load threshold breach', status: 'Critical' }
    ]
  },
  {
    id: 'INC-402',
    title: 'Rice Blast Crop Epidemic',
    category: 'Agriculture',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    severity: 'Watch',
    riskScore: 58,
    affectedPop: '25k',
    impact: 'Fungal spread damaging rice yields across 3 central districts.',
    teams: 'Agri Extension Task Force',
    resources: '500,000 fungicide vouchers, drone sprayers',
    recommendation: 'Broadcast alert to farmers regarding chemical dosage schedules.',
    timestamp: '08:15 PM',
    timeline: [
      { time: '08:15 PM', note: 'Satellite crop health scans flagged stress', status: 'Warning' }
    ]
  }
];

const PREDICTION_DATA = {
  '24h': [
    { time: '00:00', val: 30 }, { time: '04:00', val: 35 }, { time: '08:00', val: 55 },
    { time: '12:00', val: 80 }, { time: '16:00', val: 92 }, { time: '20:00', val: 85 }
  ],
  '72h': [
    { time: 'Day 1', val: 80 }, { time: 'Day 2', val: 95 }, { time: 'Day 3', val: 60 }
  ],
  '7d': [
    { time: 'Mon', val: 50 }, { time: 'Tue', val: 65 }, { time: 'Wed', val: 90 },
    { time: 'Thu', val: 75 }, { time: 'Fri', val: 40 }, { time: 'Sat', val: 30 }, { time: 'Sun', val: 20 }
  ],
  '30d': [
    { time: 'Week 1', val: 80 }, { time: 'Week 2', val: 50 }, { time: 'Week 3', val: 40 }, { time: 'Week 4', val: 20 }
  ]
};

export default function GovCommandCenter() {
  const router = useRouter();
  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);

  // States
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(INITIAL_INCIDENTS[0]);
  const [activeLayer, setActiveLayer] = useState<'Health' | 'Hazards' | 'Infrastructure' | 'Agriculture' | 'Transport' | 'Complaints' | 'Utilities'>('Hazards');
  const [zoomedState, setZoomedState] = useState<string | null>(null);
  const [selectedStateData, setSelectedStateData] = useState<StateTelemetry>(STATE_DATABASE['Maharashtra']);
  const [approvedRecommendations, setApprovedRecommendations] = useState<string[]>([]);
  
  // Wait for auth validation
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (!isGovAuthenticated) {
      router.push('/gov/login');
    } else {
      setIsReady(true);
    }
  }, [isGovAuthenticated, router]);

  // Full Stack Integration: REST Initialization + WebSocket Telemetry
  useEffect(() => {
    let wsHealth: WebSocket;
    let wsHazard: WebSocket;

    const initApis = async () => {
      try {
        const healthRes = await fetch('http://localhost:8000/api/health/dashboard/summary').catch(() => null);
        if (healthRes && healthRes.ok) {
          console.log('[NETRAVAAH Core] Health API connected.');
        }

        const hazardRes = await fetch('http://localhost:8000/hazard/api/v1/dashboard').catch(() => null);
        if (hazardRes && hazardRes.ok) {
          console.log('[NETRAVAAH Core] Hazard API connected.');
        }

        wsHealth = new WebSocket('ws://localhost:8000/api/health/ws');
        wsHealth.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.event_type === 'OUTBREAK_PREDICTION') console.log('ML payload:', payload);
          } catch (err) {}
        };

        wsHazard = new WebSocket('ws://localhost:8000/ws/hazard/telemetry');
        wsHazard.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.event === 'telemetry_update') console.log('Hazard ML payload:', payload.data);
          } catch (err) {}
        };
      } catch (err) {
        console.warn('Backend services not fully reachable. Using local intelligence loop.');
      }
    };

    if (isReady) initApis();

    return () => {
      if (wsHealth) wsHealth.close();
      if (wsHazard) wsHazard.close();
    };
  }, [isReady]);

  if (!isReady) return null;

  return (
    <div className="min-h-screen bg-[#070D1A] text-slate-300 font-sans p-4 xl:p-6 pb-20 space-y-6">

      {/* ── HEADER WITH DIGITAL TWIN COMMANDS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1A2744] pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radio className="text-[#D4AF37] animate-pulse" size={24} />
            National Operations War Room
          </h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            NETRAVAAH Multi-Agent Governance Command
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="text-xs font-black tracking-wider border-[#1A2744] bg-[#0A1228] text-slate-300 hover:text-white hover:bg-[#101F42]">
            <Play className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            RUN SIMULATION
          </Button>
          <Button variant="outline" size="sm" className="text-xs font-black tracking-wider border-[#1A2744] bg-[#0A1228] text-slate-300 hover:text-white hover:bg-[#101F42]">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            OPEN DIGITAL TWIN
          </Button>
          <Button variant="danger" size="sm" className="text-xs font-black tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            EMERGENCY BROADCAST
          </Button>
        </div>
      </div>

      {/* ── ROW 1: NATIONAL STATUS STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { label: 'Active Incidents', val: '12', color: 'text-red-400', icon: ShieldAlert, pulse: true, trend: 'up' },
          { label: 'Critical Districts', val: '28', color: 'text-orange-400', icon: MapPin, pulse: true, trend: 'up' },
          { label: 'Ambulances Active', val: '1,248', color: 'text-blue-400', icon: Truck, trend: 'up' },
          { label: 'Hosp. Stress Index', val: '84%', color: 'text-red-400', icon: Heart, pulse: true, trend: 'up' },
          { label: 'Flood Alerts', val: '6', color: 'text-blue-400', icon: Droplets, trend: 'down' },
          { label: 'Disease Outbreaks', val: '4', color: 'text-amber-400', icon: Activity, trend: 'up' },
          { label: 'Infra Failures', val: '9', color: 'text-purple-400', icon: Zap, trend: 'flat' },
          { label: 'Personnel Deployed', val: '42.8k', color: 'text-emerald-400', icon: Users, trend: 'up' }
        ].map((kpi, idx) => (
          <div key={idx} className={cn(
            "p-3 rounded-lg border bg-[#0A1228] flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:bg-[#101F42]",
            kpi.pulse ? "border-red-900/40 shadow-[0_0_10px_rgba(239,68,68,0.05)]" : "border-[#1A2744]"
          )}>
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
              {kpi.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
              {kpi.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
              {kpi.trend === 'flat' && <Activity className="w-3 h-3 text-slate-500" />}
            </div>
            <span className={cn(
              "text-xl font-black leading-none", 
              kpi.color,
              kpi.pulse && "animate-pulse"
            )}>{kpi.val}</span>
            <span className="text-[9px] font-bold uppercase text-slate-450 tracking-wider mt-1 block">{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* ── ROW 2: AI COMMAND BRIEFING ── */}
      <div className="bg-[#100b00] border border-amber-500/30 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-500/20 rounded border border-amber-500/30 text-amber-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-1">AI National Briefing</h2>
            <p className="text-sm text-slate-200 font-bold max-w-3xl leading-snug">
              Cyclone intensity rising rapidly in Odisha sector. Hospital capacities in Pune exceeding 85% threshold due to vector-borne disease clusters. Recommended action: Pre-emptive deployment of 2 NDRF battalions to Puri coast and resource rerouting to Pune.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] font-mono text-slate-400">LAST UPDATED: LIVE</span>
          <span className="text-[10px] font-black uppercase bg-amber-950 text-amber-500 px-2 py-0.5 rounded border border-amber-800">
            Conf: 94.2%
          </span>
        </div>
      </div>

      {/* ── ROW 3: MAIN OPERATIONS AREA (33/33/33) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT 33%: Critical Incidents Feed */}
        <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg flex flex-col h-[500px]">
          <CardHeader className="p-3 border-b border-[#1A2744] bg-slate-950/40">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
              <span>Critical Incidents</span>
              <span className="text-red-400 animate-pulse">LIVE</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={cn(
                  "p-2.5 rounded-lg border text-left cursor-pointer transition-all",
                  selectedIncident?.id === inc.id 
                    ? "bg-[#101F42] border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                    : "bg-slate-950/40 border-[#1A2744] hover:bg-slate-950/70"
                )}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-extrabold text-white leading-tight pr-2">{inc.title}</span>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0",
                    inc.severity === 'Critical' ? "bg-red-950 text-red-400 border-red-800" :
                    inc.severity === 'High Risk' ? "bg-orange-950 text-orange-400 border-orange-800" :
                    "bg-slate-900 text-slate-400 border-slate-700"
                  )}>
                    {inc.severity}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 space-y-0.5 font-semibold">
                  <div>Pop. Impact: <span className="text-white">{inc.affectedPop}</span></div>
                  <div>Loc: <span className="text-white">{inc.district}, {inc.state}</span></div>
                  <div>Time Open: <span className="text-white font-mono">14h 22m</span></div>
                </div>
                {selectedIncident?.id === inc.id && (
                  <Button variant="secondary" size="sm" className="w-full mt-2 h-6 text-[9px] font-black uppercase">
                    Open Incident
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CENTER 33%: National GIS Map */}
        <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg flex flex-col h-[500px] relative overflow-hidden">
          <div className="p-3 border-b border-[#1A2744] bg-slate-950/40 flex items-center justify-between z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">National GIS Map</CardTitle>
            <div className="flex items-center gap-1.5">
              {(['Hazards', 'Health', 'Infrastructure', 'Agriculture'] as const).map(layer => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={cn(
                    "text-[9px] px-2 py-1 rounded font-black transition-all cursor-pointer uppercase",
                    activeLayer === layer ? "bg-blue-600 text-white" : "bg-[#070D1A] border border-[#1A2744] text-slate-500 hover:text-slate-300"
                  )}
                >
                  {layer}
                </button>
              ))}
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 text-slate-400 hover:text-white"><Compass className="w-3 h-3" /></Button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-[#050A14] relative group select-none overflow-hidden">
            <svg 
              viewBox="0 0 500 580" 
              className="w-full max-w-[380px] h-auto object-contain transition-all duration-300 transform hover:scale-[1.02]"
              style={{ filter: 'drop-shadow(0 0 40px rgba(28,57,187,0.15))' }}
            >
              <defs>
                <radialGradient id="heat-red" cx="50%" cy="50%" r="40%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-orange" cx="50%" cy="50%" r="40%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid lines */}
              {[80, 160, 240, 320, 400, 480].map(y => (
                <line key={y} x1="20" y1={y} x2="480" y2={y} stroke="#1A2744" strokeWidth="0.5" strokeDasharray="2,6" />
              ))}
              {[80, 160, 240, 320, 400, 480].map(x => (
                <line key={x} x1={x} y1="20" x2={x} y2="560" stroke="#1A2744" strokeWidth="0.5" strokeDasharray="2,6" />
              ))}

              {/* Heatmaps */}
              <g opacity={0.8}>
                <circle cx="210" cy="320" r="50" fill="url(#heat-red)" />
                <circle cx="310" cy="300" r="65" fill="url(#heat-red)" />
                <circle cx="270" cy="190" r="55" fill="url(#heat-orange)" />
              </g>

              {/* State boundaries */}
              {Object.values(STATE_DATABASE).map(state => {
                const isSelected = zoomedState === state.name;
                return (
                  <path
                    key={state.name}
                    d={state.path}
                    className={cn(
                      "stroke-[#1E3A8A] stroke-[1.5] fill-[#0A1228]/80 transition-all cursor-pointer hover:fill-blue-900/40",
                      isSelected && "fill-blue-950/80 stroke-blue-400 stroke-[2] shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                    )}
                    onClick={() => setZoomedState(isSelected ? null : state.name)}
                  />
                );
              })}

              {/* Telemetry Dots */}
              {Object.values(STATE_DATABASE).map(state => (
                <g key={`marker-${state.name}`} className="cursor-pointer">
                  <circle cx={state.coordinates.cx} cy={state.coordinates.cy} r="5" className="fill-blue-500 stroke-[#050A14] stroke-[2]" />
                  <circle cx={state.coordinates.cx} cy={state.coordinates.cy} r="12" className="fill-none stroke-blue-500/50 stroke-[1] animate-ping" />
                </g>
              ))}
            </svg>

            {/* Float Legends */}
            <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-[#1A2744] p-2 rounded flex flex-col gap-1.5 backdrop-blur-md">
              <div className="flex items-center gap-2 text-[9px] text-slate-300 font-bold"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#EF4444]"></span> Critical Risk</div>
              <div className="flex items-center gap-2 text-[9px] text-slate-300 font-bold"><span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_#F59E0B]"></span> High Risk</div>
              <div className="flex items-center gap-2 text-[9px] text-slate-300 font-bold"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3B82F6]"></span> Secure Node</div>
            </div>
          </div>
        </Card>

        {/* RIGHT 20%: Resource Deployment Center */}
        <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg flex flex-col h-[500px]">
          <CardHeader className="p-3 border-b border-[#1A2744] bg-slate-950/40">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Deployment</CardTitle>
          </CardHeader>
          <CardContent className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
            {[
              { name: 'NDRF', avail: 14, deployed: 42, critical: true, eta: '2h 15m' },
              { name: 'Ambulances', avail: 112, deployed: 1136, critical: true, eta: '12m' },
              { name: 'Hospitals', avail: '24%', deployed: '76%', critical: false, eta: '-' },
              { name: 'Fire Services', avail: 89, deployed: 214, critical: false, eta: '18m' },
              { name: 'Police Units', avail: 450, deployed: 1800, critical: false, eta: '8m' },
              { name: 'Shelters', avail: '12%', deployed: '88%', critical: true, eta: '-' },
              { name: 'Drone Fleet', avail: 45, deployed: 120, critical: false, eta: '35m' }
            ].map(res => (
              <div key={res.name} className="border-b border-[#1A2744]/60 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-white uppercase">{res.name}</span>
                  {res.critical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-slate-400">
                  <div className="flex flex-col"><span>Avail</span><span className="text-emerald-400 font-bold">{res.avail}</span></div>
                  <div className="flex flex-col"><span>Depl.</span><span className="text-blue-400 font-bold">{res.deployed}</span></div>
                  <div className="flex flex-col"><span>ETA</span><span className="text-white font-bold">{res.eta}</span></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 4: AI DECISION ROOM ── */}
      <Card className="bg-[#0A1228] border border-blue-500/30 shadow-lg border-l-4 border-l-blue-600">
        <CardHeader className="p-3 border-b border-[#1A2744] bg-slate-950/40 flex flex-row items-center justify-between">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            AI Decision Room: Recommended Command Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { id: 'REC-1', text: 'Deploy 2 NDRF battalions to Odisha coast.', conf: 96, impact: 'High', cost: '₹2.4M', active: false },
            { id: 'REC-2', text: 'Open 14 temporary shelters in Kolhapur.', conf: 92, impact: 'Critical', cost: '₹800k', active: false },
            { id: 'REC-3', text: 'Increase medicine stock in Pune (Dengue).', conf: 88, impact: 'High', cost: '₹1.2M', active: false },
            { id: 'REC-4', text: 'Issue Stage 3 Flood Alert for Assam region.', conf: 98, impact: 'Critical', cost: '-', active: false }
          ].map(rec => {
            const isApproved = approvedRecommendations.includes(rec.id);
            return (
              <div key={rec.id} className={cn(
                "p-3 rounded-lg border flex flex-col justify-between h-full transition-all bg-[#070D1A]",
                isApproved ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-[#1A2744]"
              )}>
                <p className="text-xs font-bold text-slate-200 mb-3">{rec.text}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-2">
                    <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Conf: {rec.conf}%</span>
                    <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">Imp: {rec.impact}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant={isApproved ? "secondary" : "outline"}
                    onClick={() => {
                      if (isApproved) setApprovedRecommendations(prev => prev.filter(id => id !== rec.id));
                      else setApprovedRecommendations(prev => [...prev, rec.id]);
                    }}
                    className={cn("h-6 text-[9px] font-black uppercase px-2", isApproved && "bg-emerald-900 text-emerald-400 hover:bg-emerald-800")}
                  >
                    {isApproved ? 'EXECUTED' : 'EXECUTE'}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── ROW 5: PREDICTION CENTER ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: '24 Hours: Flood Risk Forecast', dataKey: '24h', color: '#3B82F6' },
          { label: '72 Hours: Disease Spread', dataKey: '72h', color: '#F59E0B' },
          { label: '7 Days: Resource Demand', dataKey: '7d', color: '#10B981' },
          { label: '30 Days: Infrastructure Stress', dataKey: '30d', color: '#8B5CF6' }
        ].map(chart => (
          <Card key={chart.label} className="bg-[#0A1228] border border-[#1A2744] shadow-lg">
            <CardHeader className="p-3 border-b border-[#1A2744] bg-slate-950/40">
              <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400">{chart.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PREDICTION_DATA[chart.dataKey as keyof typeof PREDICTION_DATA]}>
                  <defs>
                    <linearGradient id={`grad-${chart.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#070D1A', border: '1px solid #1A2744', fontSize: '10px', color: '#fff' }} 
                    itemStyle={{ color: chart.color }}
                  />
                  <Area type="monotone" dataKey="val" stroke={chart.color} fillOpacity={1} fill={`url(#grad-${chart.dataKey})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── ROW 6: CROSS-DOMAIN INTELLIGENCE ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { title: 'Health Intelligence', icon: Heart, iconCol: 'text-red-400', metrics: [['Spread Index', '4.8 (High)'], ['Bed Occupancy', '85%'], ['Med Shortage', 'Low']] },
          { title: 'Infrastructure Intelligence', icon: Zap, iconCol: 'text-purple-400', metrics: [['Bridges at Risk', '14'], ['Grid Status', 'Stable'], ['Dam Stress', 'Critical']] },
          { title: 'Agriculture Intelligence', icon: Sun, iconCol: 'text-amber-400', metrics: [['Drought Zones', '12'], ['Crop Disease', 'Expanding'], ['Yield Risk', '34%']] },
          { title: 'Citizen Complaints Intel', icon: Box, iconCol: 'text-blue-400', metrics: [['Volume Spike', '+42%'], ['Sentiment', 'Negative'], ['Primary Issue', 'Water Supply']] }
        ].map(intel => (
          <Card key={intel.title} className="bg-[#0A1228] border border-[#1A2744] shadow-lg flex flex-col h-[180px]">
            <CardHeader className="p-3 border-b border-[#1A2744] bg-slate-950/40 flex flex-row items-center gap-2">
              <intel.icon className={cn("w-3.5 h-3.5", intel.iconCol)} />
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-300">{intel.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-center space-y-3">
              {intel.metrics.map(m => (
                <div key={m[0]} className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-semibold">{m[0]}</span>
                  <span className="text-white font-black">{m[1]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
