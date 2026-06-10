'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Layers, 
  MapPin, 
  Users, 
  Radio, 
  Server, 
  TrendingUp, 
  ClipboardList, 
  HeartPulse, 
  Flame, 
  RefreshCw, 
  CheckCircle2, 
  Gauge, 
  Compass, 
  Zap, 
  Droplet, 
  Wind, 
  Clock, 
  Wifi, 
  Database, 
  ArrowLeft, 
  Truck, 
  Bell, 
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

// Simplified India map bounds check to generate the digital dot-matrix silhouette
const isPointInIndia = (x: number, y: number): boolean => {
  // y ranges from 60 to 510, x ranges from 70 to 450
  if (y >= 60 && y < 100) {
    // Kashmir / Far North
    return x >= 230 && x <= 265;
  }
  if (y >= 100 && y < 150) {
    // Punjab, HP, Uttarakhand
    return x >= 205 && x <= 280;
  }
  if (y >= 150 && y < 200) {
    // Rajasthan, UP, Haryana
    return x >= 170 && x <= 300;
  }
  if (y >= 200 && y < 250) {
    // Gujarat north, MP, UP, Bihar
    return x >= 135 && x <= 335;
  }
  if (y >= 250 && y < 290) {
    // Gujarat west, MP, Jharkhand, Bengal, Assam/NE connector
    if (x >= 80 && x <= 125) return true; // Kathiawar
    return (x >= 135 && x <= 345) || (x >= 370 && x <= 445);
  }
  if (y >= 290 && y < 330) {
    // Maharashtra, Chhattisgarh, Odisha, Assam, Meghalaya
    return (x >= 130 && x <= 350) || (x >= 380 && x <= 445);
  }
  if (y >= 330 && y < 370) {
    // Maharashtra, Karnataka, Telangana, Andhra, Odisha, Tripura/Mizoram
    return (x >= 145 && x <= 340) || (x >= 390 && x <= 435);
  }
  if (y >= 370 && y < 410) {
    // North Karnataka, Goa, Telangana, Andhra
    return x >= 160 && x <= 315;
  }
  if (y >= 410 && y < 450) {
    // South Karnataka, Tamil Nadu, Andhra
    return x >= 180 && x <= 295;
  }
  if (y >= 450 && y < 480) {
    // Kerala, Tamil Nadu
    return x >= 195 && x <= 280;
  }
  if (y >= 480 && y <= 510) {
    // Southern tip (Kanyakumari)
    return x >= 220 && x <= 250;
  }
  return false;
};

// Cities (Core Telemetry Hubs)
interface CityHub {
  name: string;
  x: number;
  y: number;
  lat: string;
  lng: string;
  region: string;
}

const CITIES: CityHub[] = [
  { name: 'New Delhi', x: 235, y: 155, lat: '28.6139° N', lng: '77.2090° E', region: 'North' },
  { name: 'Mumbai', x: 155, y: 315, lat: '19.0760° N', lng: '72.8777° E', region: 'West' },
  { name: 'Kolkata', x: 340, y: 280, lat: '22.5726° N', lng: '88.3639° E', region: 'East' },
  { name: 'Chennai', x: 245, y: 440, lat: '13.0827° N', lng: '80.2707° E', region: 'South' },
  { name: 'Bangalore', x: 215, y: 415, lat: '12.9716° N', lng: '77.5946° E', region: 'South' },
  { name: 'Pune', x: 168, y: 335, lat: '18.5204° N', lng: '73.8567° E', region: 'West' },
  { name: 'Hyderabad', x: 228, y: 345, lat: '17.3850° N', lng: '78.4867° E', region: 'South' },
  { name: 'Guwahati', x: 410, y: 270, lat: '26.1445° N', lng: '91.7362° E', region: 'North-East' },
];

// Mock Vehicles Tracking coordinates interpolation bases
interface VehicleAsset {
  id: string;
  type: 'NDRF Rescue' | 'Air Ambulance' | 'Fire Hazmat' | 'Sewer drone';
  speed: number; // km/h
  status: 'Active Command' | 'En Route' | 'Standby' | 'Returning';
  startCity: CityHub;
  endCity: CityHub;
  progress: number; // 0 to 100
}

interface AlertItem {
  id: string;
  time: string;
  tag: 'SYS' | 'CRITICAL' | 'ALERT' | 'TRAFFIC' | 'HEALTH' | 'INFRA';
  message: string;
}

interface IncidentItem {
  id: string;
  title: string;
  location: string;
  coordinates: string;
  severity: 'CRITICAL' | 'WARNING' | 'MINOR';
  dispatched: string;
  x: number;
  y: number;
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  { id: 'INC-104', title: 'Cyclone Yaas Coastline Threat', location: 'Odisha Coast Sector G', coordinates: '21.5° N, 86.9° E', severity: 'CRITICAL', dispatched: 'NDRF Battalion 08, 12', x: 310, y: 330 },
  { id: 'INC-105', title: 'Viral Outbreak Vector Cluster', location: 'Pune East Wards', coordinates: '18.5° N, 73.9° E', severity: 'CRITICAL', dispatched: 'Civic Health Squad 2', x: 168, y: 335 },
  { id: 'INC-106', title: 'Highway 48 Bridge Landslip', location: 'Lonavala Western Corridor', coordinates: '18.7° N, 73.4° E', severity: 'WARNING', dispatched: 'PWD Maintenance Team C', x: 155, y: 320 },
  { id: 'INC-107', title: 'Major Substation Voltage Surge', location: 'Delhi NCR Hub 4', coordinates: '28.6° N, 77.2° E', severity: 'WARNING', dispatched: 'State Power Engineers', x: 235, y: 155 },
  { id: 'INC-108', title: 'Civic Sewage Grid Overflow', location: 'Kolkata Sector 3', coordinates: '22.6° N, 88.4° E', severity: 'MINOR', dispatched: 'Municipal Sanitation Drones', x: 340, y: 280 }
];

export default function NationalCommandCenter() {
  const { setActiveTab } = useUiStore();
  
  // Tab highlight sync
  useEffect(() => {
    setActiveTab('National Command Center');
  }, [setActiveTab]);

  // Theme state coordination
  const [pageDarkMode, setPageDarkMode] = useState<boolean>(true); // default dark

  useEffect(() => {
    // Check global HTML theme config on mount
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setPageDarkMode(isDark);
  }, []);

  const togglePageTheme = () => {
    const nextDark = !pageDarkMode;
    setPageDarkMode(nextDark);
    
    // Sync globally with Next.js class-based dark styling
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Layer toggles state
  const [layers, setLayers] = useState({
    hazards: true,
    disease: true,
    traffic: true,
    infra: true,
    complaints: true,
    vehicles: true
  });

  // Highlighted / selected map node detail states
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [selectedHub, setSelectedHub] = useState<CityHub | null>(CITIES[0]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(INITIAL_INCIDENTS[0]);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState<boolean>(false);
  const [systemUptime, setSystemUptime] = useState<number>(99.88);
  const [diagnosticsLog, setDiagnosticsLog] = useState<string>('SYSTEM CHECK: VERIFIED NORMAL STATE');

  // Live real-time Clock state
  const [clockTime, setClockTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // System alerts feed state
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 'A-201', time: '17:21:40', tag: 'SYS', message: 'Primary Satellite COMM Link stabilized (98% signal strength)' },
    { id: 'A-202', time: '17:22:12', tag: 'ALERT', message: 'Koyna Reservoir Gate 3 discharge rate stabilized at 4200 cusecs' },
    { id: 'A-203', time: '17:22:58', tag: 'TRAFFIC', message: 'Heavy cargo congestion alert: Hadapsar Industrial Grid bypass road' },
    { id: 'A-204', time: '17:23:44', tag: 'HEALTH', message: 'Pune East clinics log 8% reduction in active outpatient load' },
    { id: 'A-205', time: '17:24:10', tag: 'INFRA', message: 'Shivajinagar Substation 4B auto-switched transformer line' },
  ]);

  // Realtime coordinates tracker hover state
  const [mouseCoord, setMouseCoord] = useState({ x: 235, y: 155, lat: '28.61° N', lng: '77.20° E' });

  // Generate map dot list (memoized)
  const mapDots = useMemo(() => {
    const dots: { x: number; y: number; region: string }[] = [];
    for (let y = 60; y <= 510; y += 14) {
      for (let x = 70; x <= 450; x += 14) {
        if (isPointInIndia(x, y)) {
          let region = 'Central';
          if (y < 180) region = 'North';
          else if (y > 360) region = 'South';
          else if (x < 190) region = 'West';
          else if (x > 330) region = 'East';
          dots.push({ x, y, region });
        }
      }
    }
    return dots;
  }, []);

  // Live vehicles simulation state
  const [vehicles, setVehicles] = useState<VehicleAsset[]>([
    { id: 'NDRF-V10', type: 'NDRF Rescue', speed: 45, status: 'Active Command', startCity: CITIES[1], endCity: CITIES[5], progress: 20 }, // Mumbai to Pune
    { id: 'AIR-AMB2', type: 'Air Ambulance', speed: 180, status: 'En Route', startCity: CITIES[0], endCity: CITIES[7], progress: 60 }, // Delhi to Guwahati
    { id: 'HAZMAT-4', type: 'Fire Hazmat', speed: 65, status: 'Active Command', startCity: CITIES[4], endCity: CITIES[3], progress: 40 }, // Bangalore to Chennai
    { id: 'MUNI-DRN1', type: 'Sewer drone', speed: 12, status: 'Standby', startCity: CITIES[2], endCity: CITIES[2], progress: 100 }, // Kolkata
  ]);

  // Run simulation intervals
  useEffect(() => {
    const alertTypes: Array<'SYS' | 'CRITICAL' | 'ALERT' | 'TRAFFIC' | 'HEALTH' | 'INFRA'> = ['SYS', 'CRITICAL', 'ALERT', 'TRAFFIC', 'HEALTH', 'INFRA'];
    const alertMessages = {
      SYS: ['Satellite telemetry packet verification complete', 'Database synchronization to national node verified', 'Encrypted link level: Tier 1 Security active'],
      CRITICAL: ['Emergency NDRF mobilization ordered for Coastal Sector Delta', 'Seismic monitor records minor 1.4 Richter tremor near Koyna Basin', 'Severe grid overload warning issued for Delhi Grid Hub B'],
      ALERT: ['Shivajinagar water treatment flow level at 94% capacity', 'Ambulance AMB-12 dispatch command successfully registered', 'Aundh reservoir sensor records sub-meter silt levels'],
      TRAFFIC: ['National Highway 48 reports 14 minute delay on Western Ghat section', 'Traffic speed reduction on Sector 3 confluence corridor', 'Gridlock clears on Delhi bypass expressway'],
      HEALTH: ['Pune Municipal Ward health registry registers downward dengue curve', 'Medical center bed capacity limits set to normal', 'Emergency quarantine ward standby checklist approved'],
      INFRA: ['Dam outlet valve testing scheduled for next 12 hours', 'Power transmission grid re-routed load successfully', 'Bridge strain sensor threshold calibrated']
    };

    const interval = setInterval(() => {
      // 1. Move vehicles along their paths
      setVehicles(prevVehicles => prevVehicles.map(v => {
        if (v.status === 'Standby') return v;
        const speedMultiplier = v.type === 'Air Ambulance' ? 2 : 1;
        let nextProgress = v.progress + speedMultiplier * 1.5;
        let nextStatus = v.status;
        
        if (nextProgress >= 100) {
          nextProgress = 0;
          const temp = v.startCity;
          v.startCity = v.endCity;
          v.endCity = temp;
          nextStatus = Math.random() > 0.3 ? 'Active Command' : 'Returning';
        }
        return {
          ...v,
          progress: nextProgress,
          status: nextStatus,
          speed: Math.round(v.speed + (Math.random() * 8 - 4))
        };
      }));

      // 2. Add random live telemetry alerts
      const selectedType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const messages = alertMessages[selectedType];
      const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
      
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      const newAlert: AlertItem = {
        id: `A-${Math.floor(Math.random() * 900) + 100}`,
        time: timeStr,
        tag: selectedType,
        message: selectedMessage
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 8)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Compute live interpolated coordinate of vehicles
  const vehicleCoordinates = useMemo(() => {
    return vehicles.map(v => {
      const startX = v.startCity.x;
      const startY = v.startCity.y;
      const endX = v.endCity.x;
      const endY = v.endCity.y;
      
      const currentX = startX + (endX - startX) * (v.progress / 100);
      const currentY = startY + (endY - startY) * (v.progress / 100);
      
      return {
        ...v,
        x: currentX,
        y: currentY
      };
    });
  }, [vehicles]);

  // Handle map cursor movements for lat/lng readout
  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 500);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 550);
    
    // Convert coordinate scale into mock Indian Coordinates
    const mockLatVal = (35.5 - (y / 550) * 29).toFixed(4);
    const mockLngVal = (68.5 + (x / 500) * 29).toFixed(4);
    
    setMouseCoord({
      x,
      y,
      lat: `${mockLatVal}° N`,
      lng: `${mockLngVal}° E`
    });
  };

  // Run mock full diagnostics trigger
  const runDiagnosticsCheck = () => {
    if (diagnosticsRunning) return;
    setDiagnosticsRunning(true);
    setDiagnosticsLog('INITIALIZING FULL SYSTEM SWEEP...');
    
    setTimeout(() => {
      setDiagnosticsLog('SCANNING SATELLITE TRANSCEIVERS: SECURE (100%)');
    }, 400);

    setTimeout(() => {
      setDiagnosticsLog('CHECKING HEURISTICS RISK ENGINES: RESPONSE TIER-1');
    }, 800);

    setTimeout(() => {
      setDiagnosticsLog('GRID POWER FLUX AUDITS: ALL STATIONS BALANCED');
    }, 1200);

    setTimeout(() => {
      setDiagnosticsRunning(false);
      setSystemUptime(99.94);
      setDiagnosticsLog('SYSTEM CHECKS COMPLETED. ALL SECTORS VERIFIED');
      
      // Add system success alert
      const now = new Date();
      setAlerts(prev => [
        {
          id: `A-SYS-CHECK`,
          time: now.toLocaleTimeString('en-US', { hour12: false }),
          tag: 'SYS',
          message: 'Manual diagnostic sweep complete. System integrity verified at 100%'
        },
        ...prev
      ]);
    }, 1600);
  };

  // Render tag styling for alert feeds
  const getAlertTagClass = (tag: AlertItem['tag']) => {
    switch (tag) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/30';
      case 'ALERT': return 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/30';
      case 'TRAFFIC': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'HEALTH': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30';
      case 'INFRA': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30';
      case 'SYS':
      default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/30';
    }
  };

  // Render message text styling for high contrast in bright theme
  const getAlertMessageClass = (tag: AlertItem['tag']) => {
    if (pageDarkMode) {
      return 'text-slate-300';
    }
    // Bright mode colors requested: black, dark blue, dark green
    switch (tag) {
      case 'HEALTH': 
        return 'text-green-800 font-bold'; // dark green
      case 'TRAFFIC': 
        return 'text-blue-900 font-bold'; // dark blue
      case 'CRITICAL':
      case 'ALERT':
        return 'text-red-950 font-extrabold'; // dark red/maroon
      case 'INFRA': 
        return 'text-indigo-950 font-bold'; // dark indigo
      case 'SYS':
      default: 
        return 'text-black font-semibold'; // black
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 h-screen w-screen flex flex-col overflow-hidden font-mono select-none z-50 transition-colors duration-300",
      pageDarkMode ? "bg-[#030712] text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      
      {/* ========================================================================= */}
      {/* 1. OPERATIONS HEADER                                                      */}
      {/* ========================================================================= */}
      <header className={cn(
        "h-16 shrink-0 border-b px-6 flex items-center justify-between transition-colors duration-300",
        pageDarkMode ? "bg-[#080d1a] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
      )}>
        <div className="flex items-center gap-3">
          <Link href="/command-center" className="no-underline group">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-300",
              pageDarkMode 
                ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white" 
                : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-650 hover:text-slate-900"
            )}>
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold font-sans">Portal</span>
            </div>
          </Link>
          <div className={cn("h-6 w-px", pageDarkMode ? "bg-slate-850" : "bg-slate-200")} />
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShieldAlert className="w-6 h-6 text-red-550 animate-pulse" />
              {pageDarkMode && <div className="absolute inset-0 bg-red-500/20 blur-md rounded-full pointer-events-none" />}
            </div>
            <div>
              <h1 className={cn(
                "text-sm font-bold tracking-wider leading-none uppercase",
                pageDarkMode ? "text-slate-100" : "text-slate-900"
              )}>
                National Security & Operations Command Center (N-SOCC)
              </h1>
              <p className={cn(
                "text-[10px] tracking-widest mt-0.5 uppercase font-bold",
                pageDarkMode ? "text-slate-500" : "text-slate-450"
              )}>
                Ministry of Disaster Mitigation & Governance • Union Command
              </p>
            </div>
          </div>
        </div>

        {/* Global Operational Metrics & Clock */}
        <div className="flex items-center gap-4 xl:gap-6">
          
          {/* Active Level */}
          <div className={cn(
            "hidden md:flex items-center gap-2 border px-3 py-1.5 rounded",
            pageDarkMode 
              ? "bg-red-950/40 border-red-900/60 text-red-400" 
              : "bg-red-50 border-red-200 text-red-650"
          )}>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-extrabold tracking-wider">ALERT LEVEL: ELEVATED</span>
          </div>

          {/* Core Diagnostics */}
          <div className="hidden lg:flex items-center gap-5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span>SAT-COMM: <strong className={pageDarkMode ? "text-slate-200" : "text-slate-800"}>ACTIVE</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>GRID-SYNC: <strong className={pageDarkMode ? "text-slate-200" : "text-slate-800"}>14ms</strong></span>
            </div>
          </div>

          <div className={cn("hidden lg:block h-6 w-px", pageDarkMode ? "bg-slate-850" : "bg-slate-200")} />

          {/* Theme Switcher Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={togglePageTheme}
            className={cn(
              "h-9 w-9 rounded border transition-colors",
              pageDarkMode 
                ? "bg-slate-900 border-slate-800 text-amber-500 hover:bg-slate-800 hover:text-amber-400" 
                : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            )}
            aria-label={pageDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {pageDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Time display */}
          <div className="flex items-center gap-2 text-slate-350">
            <Clock className="w-4 h-4 text-cyan-500" />
            <span className={cn(
              "text-xs sm:text-sm font-bold font-mono tracking-widest px-3 py-1 rounded border",
              pageDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-200" 
                : "bg-slate-100 border-slate-200 text-slate-800"
            )}>
              {clockTime || '00:00:00 IST'}
            </span>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE VIEWPORT                                                */}
      {/* ========================================================================= */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* ============================== */}
        {/* LEFT DECK: INCIDENTS & ALERTS  */}
        {/* ============================== */}
        <section className="w-[360px] xl:w-[380px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* Card 1: Active Incidents Registry */}
          <Card className={cn(
            "flex-1 border text-slate-100 flex flex-col overflow-hidden transition-colors duration-300",
            pageDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
          )}>
            <CardHeader className={cn(
              "pb-2 pt-4 px-4 border-b shrink-0",
              pageDarkMode ? "bg-slate-950/40 border-slate-850/60" : "bg-slate-50/50 border-slate-200/60"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <CardTitle className={cn(
                    "text-xs uppercase font-extrabold tracking-wider",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    Active Critical Incidents
                  </CardTitle>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/30 text-red-500 border border-red-900/40 animate-pulse">
                  {INITIAL_INCIDENTS.length} Live
                </span>
              </div>
              <CardDescription className="text-[10px] text-slate-500 mt-0.5">
                Primary disaster hotspots linked to rescue coordination response teams
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-2 overflow-y-auto flex-1">
              {INITIAL_INCIDENTS.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                
                return (
                  <button
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncident(incident);
                      const matchedHub = CITIES.find(c => c.name.toLowerCase().includes(incident.title.toLowerCase().split(' ')[0].toLowerCase())) || null;
                      if (matchedHub) setSelectedHub(matchedHub);
                    }}
                    className={cn(
                      'w-full p-2.5 rounded border text-left cursor-pointer transition-all flex flex-col gap-1.5',
                      pageDarkMode
                        ? (isSelected 
                            ? 'bg-slate-900 border-red-500/50 shadow-md shadow-red-950/20' 
                            : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 hover:bg-slate-900/40')
                        : (isSelected 
                            ? 'bg-red-50/30 border-red-300 shadow-xs' 
                            : 'bg-slate-50/40 border-slate-200 hover:border-slate-350 hover:bg-slate-100/30')
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[9px] font-bold font-mono text-slate-500">
                        {incident.id} • {incident.coordinates}
                      </span>
                      <span className={cn(
                        'text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-sans tracking-wide',
                        incident.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                        incident.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-550 border border-orange-500/30' :
                        'bg-yellow-500/20 text-yellow-650 border border-yellow-500/30'
                      )}>
                        {incident.severity}
                      </span>
                    </div>

                    <h4 className={cn(
                      "text-[11px] font-bold line-clamp-1",
                      pageDarkMode ? "text-slate-200" : "text-slate-800"
                    )}>
                      {incident.title}
                    </h4>

                    <div className={cn(
                      "flex items-center gap-1.5 text-[9px] border-t pt-1.5 mt-0.5",
                      pageDarkMode ? "text-slate-400 border-slate-850/60" : "text-slate-500 border-slate-200/60"
                    )}>
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span className="truncate">{incident.location}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Card 2: Live System Alerts Feed (Terminal style) */}
          <Card className={cn(
            "h-[260px] xl:h-[300px] border text-slate-100 flex flex-col overflow-hidden transition-colors duration-300",
            pageDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
          )}>
            <CardHeader className={cn(
              "pb-2 pt-4 px-4 border-b shrink-0",
              pageDarkMode ? "bg-slate-950/40 border-slate-850/60" : "bg-slate-50/50 border-slate-200/60"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <CardTitle className={cn(
                    "text-xs uppercase font-extrabold tracking-wider",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    Live Operational Stream
                  </CardTitle>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </CardHeader>
            <CardContent className={cn(
              "p-3 font-mono text-[10px] space-y-2.5 overflow-y-auto flex-1",
              pageDarkMode ? "bg-slate-950/30" : "bg-slate-50/20"
            )}>
              {alerts.map((alert, idx) => (
                <div key={`${alert.id}-${idx}`} className={cn(
                  "flex flex-col gap-0.5 border-b pb-2",
                  pageDarkMode ? "border-slate-900/40" : "border-slate-200/50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[9px] font-bold">{alert.time}</span>
                    <span className={cn('text-[8px] px-1 rounded-sm uppercase font-extrabold tracking-wider', getAlertTagClass(alert.tag))}>
                      {alert.tag}
                    </span>
                  </div>
                  <p className={cn(
                    "leading-relaxed font-sans mt-0.5",
                    getAlertMessageClass(alert.tag)
                  )}>{alert.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

        </section>

        {/* ================================== */}
        {/* CENTER DECK: INDIA DOT MATRIX MAP  */}
        {/* ================================== */}
        <section className={cn(
          "flex-1 border rounded-xl relative overflow-hidden flex flex-col transition-colors duration-300",
          pageDarkMode ? "bg-[#060a12] border-slate-850" : "bg-white border-slate-200 shadow-xs"
        )}>
          
          {/* Map Layer Panel Overlay (Float Right Top) */}
          <div className={cn(
            "absolute top-4 right-4 z-10 border p-3.5 rounded-lg shadow-xl max-w-[200px] space-y-2.5 backdrop-blur-md transition-colors duration-300",
            pageDarkMode ? "bg-slate-950/90 border-slate-850" : "bg-white/95 border-slate-200"
          )}>
            <div className={cn(
              "flex items-center gap-1.5 border-b pb-1.5",
              pageDarkMode ? "border-slate-850" : "border-slate-200"
            )}>
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                pageDarkMode ? "text-slate-300" : "text-slate-700"
              )}>Telemetry Layers</span>
            </div>
            
            {/* Toggles */}
            <div className="space-y-2 text-[10px]">
              {(Object.keys(layers) as Array<keyof typeof layers>).map((layer) => {
                const getLayerLabel = (name: string) => {
                  switch (name) {
                    case 'hazards': return '🔥 Hazard Zones';
                    case 'disease': return '🦠 Outbreaks';
                    case 'traffic': return '🚗 Transit Grid';
                    case 'infra': return '⚡ Utilities';
                    case 'complaints': return '⚠️ Complaints';
                    case 'vehicles': return '🚨 Fleet Locs';
                    default: return name;
                  }
                };
                
                return (
                  <label key={layer} className="flex items-center justify-between gap-3 cursor-pointer group text-slate-450 hover:text-cyan-500 dark:hover:text-white">
                    <span className="font-semibold">{getLayerLabel(layer)}</span>
                    <input
                      type="checkbox"
                      checked={layers[layer]}
                      onChange={(e) => setLayers(prev => ({ ...prev, [layer]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-7 h-4 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-cyan-100 relative",
                      pageDarkMode ? "bg-slate-850 after:bg-slate-400 after:border-slate-300" : "bg-slate-200 after:bg-slate-500 after:border-slate-400"
                    )} />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Coordinate Readout Panel (Float Left Top) */}
          <div className={cn(
            "absolute top-4 left-4 z-10 border px-3 py-2 rounded pointer-events-none transition-colors duration-300",
            pageDarkMode ? "bg-slate-950/80 border-slate-850" : "bg-white/90 border-slate-200 shadow-xs"
          )}>
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-500 animate-spin-slow" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                SCAN COORDINATES
              </span>
            </div>
            <div className={cn(
              "text-[11px] font-semibold mt-1 font-mono space-y-0.5",
              pageDarkMode ? "text-slate-200" : "text-slate-800"
            )}>
              <div>LAT: <span className="text-cyan-600 dark:text-cyan-400">{mouseCoord.lat}</span></div>
              <div>LNG: <span className="text-cyan-600 dark:text-cyan-400">{mouseCoord.lng}</span></div>
            </div>
          </div>

          {/* Central Map Canvas (Interactive SVG) */}
          <div className="flex-1 w-full h-full flex items-center justify-center p-6 relative">
            
            <svg 
              className="w-full h-full max-h-[520px] aspect-[1/1.1]" 
              viewBox="0 0 500 550" 
              xmlns="http://www.w3.org/2000/svg"
              onMouseMove={handleMapMouseMove}
            >
              
              {/* Radial Gradients for Glowing Threats */}
              <defs>
                <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                  <stop offset="50%" stopColor="rgba(239, 68, 68, 0.15)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </radialGradient>
                <radialGradient id="diseaseGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                  <stop offset="60%" stopColor="rgba(168, 85, 247, 0.15)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                </radialGradient>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
                </radialGradient>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="mapCanvasGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path 
                  d="M 25 0 L 0 0 0 25" 
                  fill="none" 
                  stroke={pageDarkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(226, 232, 240, 0.8)"} 
                  strokeWidth="0.5" 
                />
              </pattern>
              <rect width="100%" height="100%" fill="url(#mapCanvasGrid)" />

              {/* 1. TRAFFIC LAYER */}
              {layers.traffic && (
                <g opacity={pageDarkMode ? "0.6" : "0.75"}>
                  {/* Delhi-Mumbai */}
                  <line x1="235" y1="155" x2="155" y2="315" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* Mumbai-Pune */}
                  <line x1="155" y1="315" x2="168" y2="335" stroke="#ef4444" strokeWidth="2" />
                  {/* Pune-Bangalore */}
                  <line x1="168" y1="335" x2="215" y2="415" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                  {/* Bangalore-Chennai */}
                  <line x1="215" y1="415" x2="245" y2="440" stroke="#10b981" strokeWidth="1.5" />
                  {/* Chennai-Hyderabad */}
                  <line x1="245" y1="440" x2="228" y2="345" stroke="#10b981" strokeWidth="1.5" />
                  {/* Hyderabad-Mumbai */}
                  <line x1="228" y1="345" x2="155" y2="315" stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Delhi-Kolkata */}
                  <line x1="235" y1="155" x2="340" y2="280" stroke="#10b981" strokeWidth="1.5" />
                  {/* Kolkata-Guwahati */}
                  <line x1="340" y1="280" x2="410" y2="270" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* Chennai-Kolkata */}
                  <line x1="245" y1="440" x2="340" y2="280" stroke="#ef4444" strokeWidth="2" />
                </g>
              )}

              {/* 2. HAZARDS LAYER */}
              {layers.hazards && (
                <g>
                  {/* Cyclone Yaas Area */}
                  <circle cx="310" cy="330" r="50" fill="url(#hazardGlow)" />
                  <circle cx="310" cy="330" r="12" className="fill-red-500/10 stroke-red-500 stroke-1 animate-pulse" />
                  
                  {/* North Heatwave Zone */}
                  <circle cx="180" cy="180" r="45" fill="url(#hazardGlow)" />
                  <circle cx="180" cy="180" r="8" className="fill-orange-500/10 stroke-orange-500 stroke-1 animate-pulse" />
                </g>
              )}

              {/* 3. DISEASE LAYER */}
              {layers.disease && (
                <g>
                  {/* Pune Bio Outbreak */}
                  <circle cx="168" cy="335" r="30" fill="url(#diseaseGlow)" />
                  <circle cx="168" cy="335" r="10" className="fill-transparent stroke-purple-500 stroke-2 animate-ping" />
                </g>
              )}

              {/* 4. INDIA DOT-MATRIX BASE LAYER */}
              <g>
                {mapDots.map((dot, idx) => {
                  const isHovered = hoveredDot === idx;
                  
                  // Base color depends on region, theme and hover
                  let dotColor = pageDarkMode ? 'fill-slate-800' : 'fill-slate-200';
                  if (isHovered) {
                    dotColor = 'fill-cyan-550 dark:fill-cyan-400';
                  } else {
                    if (dot.region === 'North') dotColor = pageDarkMode ? 'fill-slate-800' : 'fill-slate-350';
                    else if (dot.region === 'South') dotColor = pageDarkMode ? 'fill-slate-800' : 'fill-slate-300';
                    else if (dot.region === 'West') dotColor = pageDarkMode ? 'fill-slate-800' : 'fill-slate-350';
                    else if (dot.region === 'East') dotColor = pageDarkMode ? 'fill-slate-800' : 'fill-slate-300';
                  }

                  return (
                    <circle
                      key={idx}
                      cx={dot.x}
                      cy={dot.y}
                      r={isHovered ? 4.5 : 2}
                      className={cn('transition-all duration-150 cursor-crosshair', dotColor)}
                      onMouseEnter={() => setHoveredDot(idx)}
                      onMouseLeave={() => setHoveredDot(null)}
                    />
                  );
                })}
              </g>

              {/* 5. UTILITY/INFRASTRUCTURE LAYER */}
              {layers.infra && (
                <g>
                  {/* Solar Array Rajasthan */}
                  <rect x="150" y="210" width="6" height="6" className="fill-sky-500 stroke-sky-800 stroke-1" />
                  {/* Delhi Power Substation */}
                  <rect x="232" y="152" width="6" height="6" className="fill-sky-500 stroke-sky-800 stroke-1" />
                  {/* Koyna Dam Reservoir */}
                  <polygon points="163,350 168,342 158,342" className="fill-blue-500 stroke-blue-800 stroke-1 animate-pulse" />
                </g>
              )}

              {/* 6. COMPLAINTS LAYER */}
              {layers.complaints && (
                <g>
                  {/* Delhi Complaint */}
                  <circle cx="240" cy="148" r="3" className="fill-amber-500 stroke-amber-800 stroke-0.5 animate-pulse" />
                  {/* Bangalore Complaint */}
                  <circle cx="218" cy="408" r="3" className="fill-amber-500 stroke-amber-800 stroke-0.5 animate-pulse" />
                  {/* Mumbai Complaint */}
                  <circle cx="150" cy="308" r="3" className="fill-amber-500 stroke-amber-800 stroke-0.5 animate-pulse" />
                </g>
              )}

              {/* 7. VEHICLES LAYER */}
              {layers.vehicles && (
                <g>
                  {vehicleCoordinates.map(v => (
                    <g key={v.id}>
                      {/* Vehicle pulse */}
                      <circle cx={v.x} cy={v.y} r="6" className="fill-transparent stroke-rose-500 stroke-1.5 animate-ping" />
                      <circle cx={v.x} cy={v.y} r="3" className="fill-rose-500 stroke-slate-900 dark:stroke-slate-950 stroke-1" />
                      <text x={v.x + 6} y={v.y + 3} className="fill-rose-550 dark:fill-rose-400 text-[6.5px] font-bold font-mono">
                        {v.id.split('-')[1] || v.id}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* 8. CITY CORE TELEMETRY HUBS */}
              {CITIES.map((city) => {
                const isSelected = selectedHub?.name === city.name;
                
                return (
                  <g 
                    key={city.name} 
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedHub(city);
                      const matchedInc = INITIAL_INCIDENTS.find(inc => inc.location.toLowerCase().includes(city.name.toLowerCase())) || null;
                      if (matchedInc) setSelectedIncident(matchedInc);
                    }}
                  >
                    {/* Glowing hub area */}
                    <circle cx={city.x} cy={city.y} r={isSelected ? "14" : "8"} fill="url(#hubGlow)" />
                    {/* Ring */}
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={isSelected ? "8" : "5"}
                      className={cn(
                        "fill-transparent stroke-2 transition-all duration-300",
                        isSelected 
                          ? "stroke-cyan-500 dark:stroke-cyan-400" 
                          : "stroke-cyan-600/40 dark:stroke-cyan-500/40 group-hover:stroke-cyan-550 dark:group-hover:stroke-cyan-400"
                      )}
                    />
                    {/* Core Point */}
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={isSelected ? "3.5" : "2"}
                      className={cn(
                        "transition-all duration-300",
                        isSelected ? "fill-cyan-500 dark:fill-cyan-300" : "fill-cyan-600 dark:fill-cyan-500"
                      )}
                    />
                    {/* Text Label */}
                    <text
                      x={city.x}
                      y={city.y - (isSelected ? 10 : 7)}
                      className={cn(
                        "font-mono font-bold text-[8px] pointer-events-none select-none transition-all duration-300",
                        isSelected 
                          ? "fill-cyan-600 dark:fill-cyan-300 scale-105" 
                          : "fill-slate-550 dark:fill-slate-400 group-hover:fill-slate-800 dark:group-hover:fill-slate-200"
                      )}
                      textAnchor="middle"
                    >
                      {city.name}
                    </text>
                  </g>
                );
              })}

            </svg>

            {/* Float Bottom Map Overlay - Hub Detailed stats */}
            {selectedHub && (
              <div className={cn(
                "absolute bottom-4 left-4 right-4 z-10 border p-3 rounded-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4 transition-colors duration-300",
                pageDarkMode ? "bg-slate-950/90 border-slate-850/80" : "bg-white/95 border-slate-200 shadow-md"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded border transition-colors",
                    pageDarkMode ? "bg-cyan-950/40 border-cyan-900/60" : "bg-cyan-50 border-cyan-200"
                  )}>
                    <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-xs font-bold uppercase",
                        pageDarkMode ? "text-slate-200" : "text-slate-800"
                      )}>{selectedHub.name} Telemetry Hub</h3>
                      <span className={cn(
                        "text-[8px] font-mono border px-1 rounded",
                        pageDarkMode ? "text-cyan-500 bg-cyan-950/40 border-cyan-900/50" : "text-cyan-700 bg-cyan-50 border-cyan-200/80"
                      )}>
                        {selectedHub.lat}, {selectedHub.lng}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Sub-System State: <strong className="text-emerald-600 dark:text-emerald-400">NOMINAL</strong> • Region Link: {selectedHub.region} Division
                    </p>
                  </div>
                </div>

                {/* Micro telemetry sensors */}
                <div className="flex items-center gap-4 xl:gap-6 text-[10px]">
                  <div className={cn("border-l pl-4", pageDarkMode ? "border-slate-800" : "border-slate-200")}>
                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Power Load</span>
                    <strong className={pageDarkMode ? "text-slate-200" : "text-slate-800"}>76% of Peak</strong>
                  </div>
                  <div className={cn("border-l pl-4", pageDarkMode ? "border-slate-800" : "border-slate-200")}>
                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Comm Uptime</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">99.98%</strong>
                  </div>
                  <div className={cn("border-l pl-4", pageDarkMode ? "border-slate-800" : "border-slate-200")}>
                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Civic Backlog</span>
                    <strong className="text-amber-600 dark:text-amber-500">14 open cases</strong>
                  </div>
                  {selectedIncident && selectedIncident.location.includes(selectedHub.name) && (
                    <div className={cn(
                      "border-l pl-4 px-2.5 py-1 rounded border",
                      pageDarkMode ? "bg-red-950/30 border-red-900/40 text-red-400" : "bg-red-50 border-red-200 text-red-650"
                    )}>
                      <span className="block text-[8px] font-bold uppercase animate-pulse">Critical Alert</span>
                      <strong className="font-extrabold">{selectedIncident.title.split(' ')[0]} Active</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ======================================= */}
        {/* RIGHT DECK: RESOURCES, FLEET & WEATHER */}
        {/* ======================================= */}
        <section className="w-[340px] xl:w-[360px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* Card 1: Resource Deployment Status */}
          <Card className={cn(
            "border text-slate-100 flex flex-col shrink-0 transition-colors duration-300",
            pageDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
          )}>
            <CardHeader className={cn(
              "pb-2 pt-4 px-4 border-b shrink-0",
              pageDarkMode ? "bg-slate-950/40 border-slate-850/60" : "bg-slate-50/50 border-slate-200/60"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <CardTitle className={cn(
                    "text-xs uppercase font-extrabold tracking-wider",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    Response Force Deployment
                  </CardTitle>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">84% Allocated</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              
              {/* Squad 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>NDRF Squadrons (Search & Rescue)</span>
                  <strong className={pageDarkMode ? "text-slate-300" : "text-slate-700"}>24 / 28 Battalions</strong>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden border", pageDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85.7%' }} />
                </div>
              </div>

              {/* Squad 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Medical Tactical Reserve Corps</span>
                  <strong className={pageDarkMode ? "text-slate-300" : "text-slate-700"}>92 / 120 Units</strong>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden border", pageDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '76.6%' }} />
                </div>
              </div>

              {/* Squad 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Fire & Hazmat Suppression Teams</span>
                  <strong className={pageDarkMode ? "text-slate-300" : "text-slate-700"}>42 / 50 Crews</strong>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden border", pageDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '84.0%' }} />
                </div>
              </div>

              {/* Squad 4 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Autonomous Recon Drones</span>
                  <strong className={pageDarkMode ? "text-slate-300" : "text-slate-700"}>18 / 20 Hubs</strong>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden border", pageDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
                  <div className="h-full bg-cyan-500 rounded-full animate-pulse" style={{ width: '90%' }} />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card 2: Live Vehicle Locator Log */}
          <Card className={cn(
            "border text-slate-100 flex-1 flex flex-col overflow-hidden transition-colors duration-300",
            pageDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
          )}>
            <CardHeader className={cn(
              "pb-2 pt-4 px-4 border-b shrink-0",
              pageDarkMode ? "bg-slate-950/40 border-slate-850/60" : "bg-slate-50/50 border-slate-200/60"
            )}>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-rose-500 animate-bounce" />
                <CardTitle className={cn(
                  "text-xs uppercase font-extrabold tracking-wider",
                  pageDarkMode ? "text-slate-200" : "text-slate-800"
                )}>
                  Operational Fleet Log
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className={cn(
              "p-0 overflow-y-auto flex-1 text-[10px]",
              pageDarkMode ? "bg-slate-950/30" : "bg-slate-50/20"
            )}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn(
                    "border-b font-bold",
                    pageDarkMode ? "border-slate-850 bg-slate-950/65 text-slate-500" : "border-slate-200 bg-slate-100 text-slate-500"
                  )}>
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5 text-right">SPEED</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", pageDarkMode ? "divide-slate-900/60" : "divide-slate-200/50")}>
                  {vehicleCoordinates.map((v) => (
                    <tr key={v.id} className={pageDarkMode ? "hover:bg-slate-900/30" : "hover:bg-slate-100/40"}>
                      <td className="p-2.5">
                        <span className={cn("block font-bold", pageDarkMode ? "text-slate-200" : "text-slate-800")}>{v.id}</span>
                        <span className="block text-[8px] text-slate-500 font-mono">
                          {v.type}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase',
                          v.status === 'Active Command' ? 'bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/20' :
                          v.status === 'En Route' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20' :
                          v.status === 'Returning' ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20' :
                          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        )}>
                          {v.status}
                        </span>
                        <span className="block text-[8px] text-slate-500 mt-1 font-mono">
                          {v.startCity.name.substring(0, 3)} ➔ {v.endCity.name.substring(0, 3)} ({Math.round(v.progress)}%)
                        </span>
                      </td>
                      <td className={cn(
                        "p-2.5 text-right font-bold",
                        pageDarkMode ? "text-slate-350" : "text-slate-700"
                      )}>
                        {v.speed} km/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Card 3: Weather Sat & System Diagnostics */}
          <Card className={cn(
            "border text-slate-100 flex flex-col shrink-0 transition-colors duration-300",
            pageDarkMode ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200 shadow-xs"
          )}>
            <CardHeader className={cn(
              "pb-2 pt-3 px-4 border-b shrink-0",
              pageDarkMode ? "bg-slate-950/40 border-slate-850/60" : "bg-slate-50/50 border-slate-200/60"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <CardTitle className={cn(
                    "text-xs uppercase font-extrabold tracking-wider",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    Diagnostics & Weather
                  </CardTitle>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={runDiagnosticsCheck}
                  disabled={diagnosticsRunning}
                  className="h-6 w-6 text-slate-500 hover:text-cyan-500"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', diagnosticsRunning && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-[10px]">
              
              {/* Satellite Metrics Grid */}
              <div className={cn(
                "grid grid-cols-2 gap-3 p-2.5 rounded border transition-colors duration-300",
                pageDarkMode ? "bg-slate-950/50 border-slate-850" : "bg-slate-50 border-slate-200"
              )}>
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-bold block uppercase text-[8px]">SAT Weather Index</span>
                  <div className={cn(
                    "flex items-center gap-1.5 font-bold text-xs mt-0.5",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    <Wind className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>42 kt (Wind)</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 font-bold block uppercase text-[8px]">Barometric Pres</span>
                  <div className={cn(
                    "flex items-center gap-1.5 font-bold text-xs mt-0.5",
                    pageDarkMode ? "text-slate-200" : "text-slate-800"
                  )}>
                    <Gauge className="w-3.5 h-3.5 text-amber-500" />
                    <span>994 hPa</span>
                  </div>
                </div>
              </div>

              {/* Console log of diagnostic */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-500 font-bold uppercase text-[8px]">
                  <span>System Diagnostics Console</span>
                  <span>Uptime: {systemUptime}%</span>
                </div>
                <div className={cn(
                  "p-2.5 rounded border font-mono text-[8px] min-h-[36px] flex items-center leading-normal break-all transition-colors duration-300",
                  pageDarkMode 
                    ? "bg-slate-950 border-slate-850 text-cyan-400/90" 
                    : "bg-slate-900 border-slate-950 text-cyan-400"
                )}>
                  {diagnosticsLog}
                </div>
              </div>

            </CardContent>
          </Card>

        </section>

      </main>

    </div>
  );
}
