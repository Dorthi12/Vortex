// app/(dashboard)/infrastructure/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, ChevronRight, Wrench, TrendingUp, Map, Info, AlertTriangle, 
  Activity, Sparkles, Layers, ArrowRight, ShieldCheck, Compass, Eye, EyeOff, Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

// Upgraded Asset Risk Structure
interface AssetRiskItem {
  id: string;
  name: string;
  type: 'road' | 'bridge' | 'dam' | 'grid' | 'utility';
  location: string;
  healthScore: number; // 0-100
  riskScore: number; // 0-100
  failureProbability: number; // 0.0 - 1.0
  lastInspection: string;
  recommendedAction: string;
  status: 'healthy' | 'watch' | 'risk' | 'critical';
  coords: { x: number; y: number };
  maintenanceHistory: string[];
  historicalRecords: string[];
  telemetry: Record<string, string>;
}

const UPGRADED_ASSETS: AssetRiskItem[] = [
  {
    id: 'as-1',
    name: 'Sangamwadi Confluence Bridge',
    type: 'bridge',
    location: 'Sangam Bridge Road',
    healthScore: 91,
    riskScore: 15,
    failureProbability: 0.05,
    lastInspection: '2026-05-12',
    recommendedAction: 'Monitor Only',
    status: 'healthy',
    coords: { x: 75, y: 35 },
    maintenanceHistory: ['Resurfaced deck: Q2 2025', 'Expansion joint sensor upgrade: Q4 2024'],
    historicalRecords: ['Erected in 2004', 'Safety certification renewed: 2025'],
    telemetry: { "Vibration": "1.2 Hz", "Load": "240 Tons", "Expansion": "4.2 mm", "Corrosion Index": "0.18" }
  },
  {
    id: 'as-2',
    name: 'Hadapsar Substation Node',
    type: 'grid',
    location: 'Hadapsar Industrial Zone',
    healthScore: 82,
    riskScore: 35,
    failureProbability: 0.12,
    lastInspection: '2026-06-02',
    recommendedAction: 'Schedule Thermal Audit',
    status: 'watch',
    coords: { x: 125, y: 65 },
    maintenanceHistory: ['Transformer oil flush: Q1 2026', 'Feeder cable insulation: 2024'],
    historicalRecords: ['Installed capacity 150MVA', 'Primary civic grid feeder'],
    telemetry: { "Transformer Temp": "84°C", "Load Level": "82.4%", "Outage Risk": "12.0%", "Feeder Loss": "2.1%" }
  },
  {
    id: 'as-3',
    name: 'Khadakwasla Dam Spillway',
    type: 'dam',
    location: 'Khadakwasla Reservoir',
    healthScore: 98,
    riskScore: 5,
    failureProbability: 0.01,
    lastInspection: '2026-06-10',
    recommendedAction: 'Monitor Only',
    status: 'healthy',
    coords: { x: 30, y: 25 },
    maintenanceHistory: ['Radial gates lubrication: Q2 2026', 'Structural ultrasound: Q3 2025'],
    historicalRecords: ['Masonry gravity dam', 'Capacity limit 1.97 TMC'],
    telemetry: { "Water Level": "78% Capacity", "Inflow": "12k cusecs", "Outflow": "11.5k cusecs", "Gate Position": "25% open" }
  },
  {
    id: 'as-4',
    name: 'Yerawada Bed Causeway',
    type: 'road',
    location: 'Yerawada Riverbed Margins',
    healthScore: 45,
    riskScore: 80,
    failureProbability: 0.65,
    lastInspection: '2026-06-12',
    recommendedAction: 'Immediate Overlay & Patching',
    status: 'critical',
    coords: { x: 115, y: 20 },
    maintenanceHistory: ['Emergency pothole filling: Q2 2026', 'Seal coating: Q3 2023'],
    historicalRecords: ['Heavy vehicle bypass lane', 'Prone to monsoonal riverbed erosion'],
    telemetry: { "Pothole Density": "14 / km", "Base Wear Index": "1.85", "Traffic count": "52k / day", "Friction Index": "0.32" }
  },
  {
    id: 'as-5',
    name: 'Aundh Highway Segment',
    type: 'road',
    location: 'Aundh Causeway Road',
    healthScore: 78,
    riskScore: 48,
    failureProbability: 0.28,
    lastInspection: '2026-04-18',
    recommendedAction: 'Micro-surfacing Within 30 Days',
    status: 'risk',
    coords: { x: 25, y: 15 },
    maintenanceHistory: ['Crack sealing: Q1 2026', 'Rutting repair: Q4 2024'],
    historicalRecords: ['Arterial residential link', 'Upgraded to smart lighting: 2023'],
    telemetry: { "Pothole count": "4 total", "Base Wear Index": "1.21", "Traffic count": "28k / day", "Friction Index": "0.58" }
  },
  {
    id: 'as-6',
    name: 'Shivajinagar Grid Hub',
    type: 'grid',
    location: 'Shivajinagar Civic Block',
    healthScore: 90,
    riskScore: 10,
    failureProbability: 0.03,
    lastInspection: '2026-05-20',
    recommendedAction: 'Monitor Only',
    status: 'healthy',
    coords: { x: 75, y: 55 },
    maintenanceHistory: ['Switchgear replaced: Q3 2025', 'Substation enclosure seal: 2024'],
    historicalRecords: ['Constructed in 2012', 'Fully automated SCADA gateway node'],
    telemetry: { "Transformer Temp": "52°C", "Load Level": "62.0%", "Outage Risk": "3.0%", "Feeder Loss": "0.9%" }
  },
  {
    id: 'as-7',
    name: 'Koregaon Pipeline Trunk',
    type: 'utility',
    location: 'Koregaon Park Road',
    healthScore: 81,
    riskScore: 28,
    failureProbability: 0.14,
    lastInspection: '2026-06-08',
    recommendedAction: 'Check Pressure Transducers',
    status: 'watch',
    coords: { x: 95, y: 45 },
    maintenanceHistory: ['Trunk valve overhaul: 2025', 'Acoustic leak sweep: Q2 2026'],
    historicalRecords: ['Feeds East Zone municipal supply', 'Cast iron main diameter 800mm'],
    telemetry: { "Water Pressure": "58 PSI", "Acoustic Leak Alert": "None", "Daily Output": "4.2M Liters", "Chlorine Level": "1.8ppm" }
  }
];

export default function InfrastructureOverview() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  const [assets, setAssets] = useState<AssetRiskItem[]>(UPGRADED_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<AssetRiskItem | null>(UPGRADED_ASSETS[0]);

  // GIS Layer Controls
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [showAssetLayer, setShowAssetLayer] = useState(true);
  const [showMaintenanceLayer, setShowMaintenanceLayer] = useState(false);
  const [showComplaintLayer, setShowComplaintLayer] = useState(true);
  const [showSensorLayer, setShowSensorLayer] = useState(true);

  // Filter Active Display Elements based on Toggles
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!showAssetLayer) return false;
      return true;
    });
  }, [assets, showAssetLayer]);

  // Compute location-specific telemetry
  const locationStats = useMemo(() => {
    switch (userLocation) {
      case 'Hadapsar':
        return {
          roadHealth: '61.2%',
          roadAlert: '29 reported',
          bridgeHealth: '88.5%',
          bridgeAlert: '4 sensor rings',
          damTelemetry: '95.0%',
          damAlert: '72% Reservoir',
          gridLoad: '84.5%',
          gridAlert: '15.5% vacancy',
          backlog: '24 cases',
          backlogAlert: '4 crews out',
          capex: '₹48.2M',
          capexAlert: '+15% optimized'
        };
      case 'Aundh':
        return {
          roadHealth: '85.0%',
          roadAlert: '8 reported',
          bridgeHealth: '96.2%',
          bridgeAlert: '2 sensor rings',
          damTelemetry: '98.0%',
          damAlert: '78% Reservoir',
          gridLoad: '52.0%',
          gridAlert: '48% vacancy',
          backlog: '7 cases',
          backlogAlert: '1 crew out',
          capex: '₹35.1M',
          capexAlert: '+8% optimized'
        };
      case 'Yerawada':
        return {
          roadHealth: '69.8%',
          roadAlert: '21 reported',
          bridgeHealth: '79.5%',
          bridgeAlert: '6 sensor rings',
          damTelemetry: '99.0%',
          damAlert: '84% Reservoir',
          gridLoad: '62.3%',
          gridAlert: '37.7% vacancy',
          backlog: '18 cases',
          backlogAlert: '3 crews out',
          capex: '₹44.8M',
          capexAlert: '+10% optimized'
        };
      case 'Shivajinagar':
      default:
        return {
          roadHealth: '76.5%',
          roadAlert: '18 reported',
          bridgeHealth: '91.0%',
          bridgeAlert: '3 sensor rings',
          damTelemetry: '98.0%',
          damAlert: '78% Reservoir',
          gridLoad: '68.0%',
          gridAlert: '32% vacancy',
          backlog: '14 cases',
          backlogAlert: '2 crews out',
          capex: '₹42.5M',
          capexAlert: '+12% optimized'
        };
    }
  }, [userLocation]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-2 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#1A2744] pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#4682B4] dark:text-[#D4AF37] font-black">
            Municipal Works & Asset Management Desk
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Infrastructure Intelligence Dashboard
          </h1>
          <p className="text-slate-655 dark:text-slate-400 text-sm mt-0.5 font-bold">
            Real-time structural telemetry, smart electrical grids, dam volume dispatch, and maintenance CapEx/OpEx optimizations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/traffic">
            <Button size="sm" className="bg-[#1e3a8a] dark:bg-[#1C39BB] hover:bg-blue-800 text-white font-bold text-xs h-9">
              Emergency Route Engine
            </Button>
          </Link>
          <Link href="/utilities">
            <Button size="sm" className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs h-9">
              Utilities Panel
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic 50km Location Scan Banner */}
      <LocationScopeBanner />

      {/* Quick Access KPI Cards Grid (6 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: Roads */}
        <Link href="/roads" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Road Health</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.roadHealth}</span>
              <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded mt-2">{locationStats.roadAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Bridges */}
        <Link href="/bridges" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Bridge Struct</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.bridgeHealth}</span>
              <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded mt-2">{locationStats.bridgeAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Dams */}
        <Link href="/dams" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Dam Telemetry</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.damTelemetry}</span>
              <span className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded mt-2">{locationStats.damAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Grid */}
        <Link href="/grids" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Grid Load</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.gridLoad}</span>
              <span className="block text-[10px] font-semibold text-[#4682B4] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded mt-2">{locationStats.gridAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 5: Maintenance */}
        <Link href="/maintenance" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Planner Backlog</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.backlog}</span>
              <span className="block text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded mt-2">{locationStats.backlogAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 6: Budget */}
        <Link href="/budget" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#0A1228] shadow-sm">
            <CardContent className="p-4 text-center">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">CapEx spent</span>
              <span className="block text-2xl font-black text-[#4682B4] mt-1">{locationStats.capex}</span>
              <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded mt-2">{locationStats.capexAlert}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main 3-Column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left GIS Command Column (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Smart City Interactive GIS Map Card */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-1.5 text-slate-950 dark:text-slate-200">
                    <Map className="w-5 h-5 text-[#4682B4]" />
                    Interactive Smart City GIS Command Map
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-500">
                    Select nodes or toggle specific telemetry layers on the MC Command Canvas.
                  </CardDescription>
                </div>

                {/* Layer Control Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setShowRiskLayer(!showRiskLayer)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black border transition-colors cursor-pointer",
                      showRiskLayer ? "bg-red-500/10 text-red-700 border-red-300 dark:text-red-400 dark:border-red-900/50" : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                    )}
                  >
                    Risk Overlay
                  </button>
                  <button 
                    onClick={() => setShowSensorLayer(!showSensorLayer)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black border transition-colors cursor-pointer",
                      showSensorLayer ? "bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-900/50" : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                    )}
                  >
                    Sensor IoT
                  </button>
                  <button 
                    onClick={() => setShowComplaintLayer(!showComplaintLayer)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-black border transition-colors cursor-pointer",
                      showComplaintLayer ? "bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-450 dark:border-amber-900/50" : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                    )}
                  >
                    Citizen Reports
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Interactive Vector GIS Canvas */}
              <div className="md:col-span-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-150 dark:border-slate-800">
                <svg className="w-full aspect-square max-w-[280px]" viewBox="0 0 160 160">
                  {/* Grid Lines */}
                  <line x1="80" y1="0" x2="80" y2="160" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="160" y2="80" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Mutha River flow path */}
                  <path
                    d="M 0,40 Q 60,30 110,60 T 160,50"
                    fill="transparent"
                    className="stroke-[#4682B4]/20 stroke-[8] fill-none"
                  />

                  {/* Power Feeder Overlay Line */}
                  <path
                    d="M 75,55 L 125,65 L 95,45"
                    fill="transparent"
                    className="stroke-amber-500/15 stroke-[1.5] stroke-dasharray-[2,2] fill-none"
                  />

                  {/* Risk Halo Area (If Enabled) */}
                  {showRiskLayer && assets.map((asset) => {
                    if (asset.riskScore > 30) {
                      return (
                        <circle
                          key={`risk-${asset.id}`}
                          cx={asset.coords.x}
                          cy={asset.coords.y}
                          r={asset.riskScore * 0.25}
                          className={cn(
                            "fill-none stroke-red-500/20 stroke-[1] animate-pulse",
                            asset.riskScore > 60 ? "stroke-red-500/25" : "stroke-amber-500/20"
                          )}
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Citizen Complaints Markers (Mock Alerts) */}
                  {showComplaintLayer && (
                    <>
                      <circle cx="50" cy="85" r="3" className="fill-orange-600 dark:fill-orange-500 animate-ping" />
                      <circle cx="50" cy="85" r="1.5" className="fill-orange-600 dark:fill-orange-500" />
                      <circle cx="105" cy="115" r="3" className="fill-red-600 dark:fill-red-500 animate-ping" />
                      <circle cx="105" cy="115" r="1.5" className="fill-red-600 dark:fill-red-500" />
                    </>
                  )}

                  {/* Asset Node Markers */}
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <g
                        key={asset.id}
                        className="cursor-pointer group"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        {isSelected && (
                          <circle cx={asset.coords.x} cy={asset.coords.y} r="9" className="fill-none stroke-[#4682B4] stroke-[2] animate-pulse" />
                        )}
                        <circle
                          cx={asset.coords.x}
                          cy={asset.coords.y}
                          r="5.5"
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1.5] transition-all group-hover:scale-125",
                            asset.status === 'critical' ? 'fill-red-600 dark:fill-red-500' :
                            asset.status === 'risk' ? 'fill-orange-500' :
                            asset.status === 'watch' ? 'fill-amber-500' : 'fill-emerald-500'
                          )}
                        />
                        <text
                          x={asset.coords.x}
                          y={asset.coords.y - 8}
                          textAnchor="middle"
                          className="fill-slate-500 dark:fill-slate-400 text-[6px] font-black uppercase tracking-wider bg-black/50"
                        >
                          {asset.type}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Asset Details Click Panel (2/3 width equivalent) */}
              <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                {selectedAsset ? (
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-[9px] font-black uppercase text-[#4682B4] dark:text-[#D4AF37] tracking-wider">
                        Asset Click Panel (Telemetry)
                      </span>
                      <h4 className="font-extrabold text-slate-950 dark:text-slate-100 text-sm mt-1">{selectedAsset.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded">
                        <span className="block text-[8px] text-slate-450 uppercase">Health Score</span>
                        <span className={cn(
                          "text-sm font-black",
                          selectedAsset.healthScore >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                          selectedAsset.healthScore >= 75 ? "text-amber-600 dark:text-amber-550" : "text-red-600 dark:text-red-400"
                        )}>{selectedAsset.healthScore}%</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded">
                        <span className="block text-[8px] text-slate-450 uppercase">Risk Level</span>
                        <span className={cn(
                          "text-sm font-black capitalize",
                          selectedAsset.status === 'healthy' ? "text-emerald-600 dark:text-emerald-400" :
                          selectedAsset.status === 'watch' ? "text-amber-600 dark:text-amber-550" :
                          selectedAsset.status === 'risk' ? "text-orange-500" : "text-red-600 dark:text-red-400"
                        )}>{selectedAsset.status}</span>
                      </div>
                    </div>

                    {/* IoT Real-Time Telemetry Map */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-450">Active Sensors Status</span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {Object.entries(selectedAsset.telemetry).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-150 dark:border-slate-800">
                            <span className="text-slate-450 font-bold">{key}</span>
                            <span className="font-mono font-black text-slate-950 dark:text-white">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Historical Records */}
                    <div className="p-3 bg-slate-50 dark:bg-[#070D1A]/50 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs leading-normal">
                      <span className="block font-black text-slate-400 text-[8px] uppercase mb-1">Maintenance History Log</span>
                      <p className="text-slate-600 dark:text-slate-400 font-bold">{selectedAsset.maintenanceHistory[0]}</p>
                    </div>

                    {/* Navigation shortcut links */}
                    <div className="pt-2">
                      <Link 
                        href={
                          selectedAsset.type === 'road' ? '/roads' :
                          selectedAsset.type === 'bridge' ? '/bridges' :
                          selectedAsset.type === 'dam' ? '/dams' : '/grids'
                        }
                        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-black text-xs no-underline cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 mr-1" />
                        Audit Telemetry Dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400">Select an asset from the map or risk matrix to inspect parameters.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Planner Column (1/3 width) */}
        <div className="space-y-6">
          {/* Budget distribution preview */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-1.5 text-slate-950 dark:text-slate-200">
                <TrendingUp className="w-4 h-4 text-[#4682B4]" />
                Capital Allocations (CapEx vs OpEx)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2 pb-6">
              
              <div className="w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-150 dark:border-slate-800">
                <svg className="w-full aspect-[2/1] max-w-[200px]" viewBox="0 0 100 50">
                  <rect x="15" y="5" width="22" height="40" className="fill-slate-200 dark:fill-slate-800" rx="3" />
                  <rect x="15" y="18" width="22" height="27" className="fill-[#4682B4]" rx="3" />
                  <text x="26" y="40" textAnchor="middle" className="fill-white text-[5px] font-black">₹28.4M</text>
                  <text x="26" y="48" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[5px] font-bold">CapEx</text>

                  <rect x="63" y="5" width="22" height="40" className="fill-slate-200 dark:fill-slate-800" rx="3" />
                  <rect x="63" y="32" width="22" height="13" className="fill-[#B0C4DE]" rx="3" />
                  <text x="74" y="40" textAnchor="middle" className="fill-slate-800 dark:fill-white text-[5px] font-black">₹14.1M</text>
                  <text x="74" y="48" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[5px] font-bold">OpEx</text>
                </svg>
              </div>

              <div className="w-full mt-4">
                <Link href="/budget" className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#4682B4]/30 text-xs font-semibold text-[#4682B4] hover:bg-[#4682B4]/5 transition-colors no-underline">
                  Optimize Expenditures
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick operations guide */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-1.5 text-slate-950 dark:text-slate-200">
                <Wrench className="w-4 h-4 text-[#4682B4]" />
                Infrastructure Maintenance Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="grid grid-cols-1 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                <div className="p-3 bg-[#4682B4]/5 border border-[#4682B4]/20 rounded-lg">
                  <h5 className="font-bold text-[#4682B4] mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Pending Work Orders
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    14 active tasks scheduled for municipal crew dispatch. Average resolution SLA sits under 48 hours.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                  <h5 className="font-bold text-slate-950 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    Capital Allocation Target
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                    Reallocating funds from administration parameters to bridge cable reinforcement decreases core structural failure indices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Upgraded Asset Risk Intelligence Center */}
      <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm mt-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-1.5 text-slate-950 dark:text-slate-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Asset Risk Intelligence Center
              </CardTitle>
              <CardDescription className="text-xs font-bold text-slate-550 dark:text-slate-450">
                Automated risk analysis matrix evaluating asset structural longevity and deterioration risks.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs font-semibold text-left text-slate-800 dark:text-slate-300">
            <thead className="text-[10px] text-slate-500 dark:text-slate-450 uppercase bg-slate-50 dark:bg-black/20 border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Asset Name</th>
                <th className="px-6 py-3">Asset Type</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Health Score</th>
                <th className="px-6 py-3">Risk Score</th>
                <th className="px-6 py-3">Failure Prob</th>
                <th className="px-6 py-3">Last Inspection</th>
                <th className="px-6 py-3 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {assets.map((asset) => (
                <tr 
                  key={asset.id} 
                  className={cn(
                    "hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors cursor-pointer",
                    selectedAsset?.id === asset.id ? "bg-slate-50/80 dark:bg-[#101F42]/40" : ""
                  )}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <td className="px-6 py-4 font-black text-slate-950 dark:text-white truncate max-w-[180px]">{asset.name}</td>
                  <td className="px-6 py-4 uppercase font-bold text-[#4682B4]">{asset.type}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{asset.location}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "font-black text-xs",
                      asset.healthScore >= 90 ? "text-emerald-600 dark:text-emerald-450" :
                      asset.healthScore >= 75 ? "text-amber-600 dark:text-amber-550" : "text-red-600 dark:text-red-400"
                    )}>
                      {asset.healthScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            asset.riskScore > 60 ? "bg-red-500" :
                            asset.riskScore > 30 ? "bg-amber-500" : "bg-emerald-500"
                          )} 
                          style={{ width: `${asset.riskScore}%` }} 
                        />
                      </div>
                      <span className="font-mono">{asset.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-black">
                    {(asset.failureProbability * 100).toFixed(0)}%
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-450">{asset.lastInspection}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded text-[10px] font-black border",
                      asset.status === 'critical' ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" :
                      asset.status === 'risk' ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30" :
                      asset.status === 'watch' ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" :
                      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                    )}>
                      {asset.recommendedAction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
