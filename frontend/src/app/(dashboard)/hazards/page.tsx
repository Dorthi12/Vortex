'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Waves, 
  Wind, 
  Thermometer, 
  Shield, 
  Volume2, 
  Map, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Info,
  Navigation,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

// Mock Wards for mini threat map
interface WardThreat {
  id: string;
  name: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number; // 0 - 100
  flooding: string;
  windSpeed: string;
  temp: string;
}

const INITIAL_WARD_THREATS: WardThreat[] = [
  { id: 'w-1', name: 'Pune Cantonment (East)', riskLevel: 'critical', riskScore: 88, flooding: 'Critical (8.9m)', windSpeed: '55 km/h', temp: '41°C' },
  { id: 'w-2', name: 'Shivajinagar (Central)', riskLevel: 'high', riskScore: 72, flooding: 'High (8.1m)', windSpeed: '48 km/h', temp: '39°C' },
  { id: 'w-3', name: 'Kothrud (West)', riskLevel: 'medium', riskScore: 45, flooding: 'Moderate (6.5m)', windSpeed: '32 km/h', temp: '38°C' },
  { id: 'w-4', name: 'Hadapsar (South)', riskLevel: 'low', riskScore: 28, flooding: 'Safe (4.2m)', windSpeed: '25 km/h', temp: '36°C' },
];

interface SirenStation {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'silent' | 'offline';
  coverage: string;
}

export default function HazardsOverview() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Civic Hazards');
  }, [setActiveTab]);

  // Telemetry inputs that dynamically compute threat index
  const [floodGauge, setFloodGauge] = useState<number>(8.2); // meters
  const [cycloneWind, setCycloneWind] = useState<number>(75); // km/h
  const [heatwaveTemp, setHeatwaveTemp] = useState<number>(42); // °C
  const [landslideAlerts, setLandslideAlerts] = useState<number>(3); // active warnings
  const [threatLevel, setThreatLevel] = useState<number>(65);

  // Compute aggregate threat level based on active telemetry
  useEffect(() => {
    const floodWeight = Math.max(0, (floodGauge / 10) * 100) * 0.35;
    const cycloneWeight = Math.min(100, (cycloneWind / 150) * 100) * 0.3;
    const heatWeight = Math.max(0, ((heatwaveTemp - 30) / 20) * 100) * 0.2;
    const landslideWeight = Math.min(100, (landslideAlerts / 5) * 100) * 0.15;
    
    const computed = Math.min(100, Math.round(floodWeight + cycloneWeight + heatWeight + landslideWeight));
    setThreatLevel(computed);
  }, [floodGauge, cycloneWind, heatwaveTemp, landslideAlerts]);

  // Alert sirens status state
  const [sirens, setSirens] = useState<SirenStation[]>([
    { id: 'sr-1', name: 'Mula-Mutha Confluence Siren', location: 'Sangam Bridge, Pune', status: 'active', coverage: '2.5 km' },
    { id: 'sr-2', name: 'Sector 4 Emergency Mast', location: 'Sector 4 Sports Ground', status: 'silent', coverage: '3.0 km' },
    { id: 'sr-3', name: 'Hill Slope Early Warning Siren', location: 'Katraj Ghats', status: 'silent', coverage: '1.5 km' },
    { id: 'sr-4', name: 'Civic HQ Central Alarm', location: 'Municipal Corporation Plaza', status: 'offline', coverage: '5.0 km' },
  ]);

  // Interactive Ward select on GIS mini map
  const [selectedWard, setSelectedWard] = useState<WardThreat | null>(INITIAL_WARD_THREATS[0]);

  const toggleSirenStatus = (id: string) => {
    setSirens(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'silent' ? 'active' : 'silent';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const triggerGlobalTestSirens = () => {
    setSirens(prev => prev.map(s => s.status !== 'offline' ? { ...s, status: 'active' } : s));
  };

  const silenceAllSirens = () => {
    setSirens(prev => prev.map(s => s.status !== 'offline' ? { ...s, status: 'silent' } : s));
  };

  // Status colors helper
  const getThreatColorClass = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400 border-red-500 bg-red-500/10';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400 border-orange-500 bg-orange-500/10';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-500/10';
    return 'text-green-600 dark:text-green-400 border-green-500 bg-green-500/10';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-orange-600 font-black dark:text-orange-400">
          Disaster Management & Mitigation Desk
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Hazard Intelligence Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Real-time GIS flood monitoring, cyclone path projection, extreme regional heat telemetry, and relief camp shelter allocations.
        </p>
      </div>

      {/* Emergency Alert Banner */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500 text-white animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-red-700 dark:text-red-400 text-sm leading-none flex items-center gap-2">
              ACTIVE RED ALERT: SEVERE WATERLOGGING RISK
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
            </h3>
            <p className="text-xs text-red-600/90 dark:text-red-300/80 mt-1 font-medium">
              Discharge at Mula River Gauging Site has exceeded caution mark. low-elevation wards advised to mobilize evacuation plans.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={triggerGlobalTestSirens}
            className="flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Trigger All Sirens
          </button>
          <button 
            onClick={silenceAllSirens}
            className="flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Silence Alarms
          </button>
        </div>
      </div>

      {/* Quick Access Services Grid (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Flood Monitoring */}
        <Link href="/floods" className="block no-underline group">
          <Card className="h-full border border-orange-500/20 hover:border-orange-500/50 bg-card transition-all duration-200 smooth-hover cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
              <Waves className="w-8 h-8 text-orange-500" />
            </div>
            <CardHeader className="pb-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">MODULE 01</span>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Flood Inundation & Gauges
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Track water level meters, dam discharges, precipitation gauges, and dynamic flood elevation grids.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center px-3 py-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">MULA RIVER</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{floodGauge}m / 9.0m</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">DISCHARGE</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">42K Cusecs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Cyclone Tracking */}
        <Link href="/cyclones" className="block no-underline group">
          <Card className="h-full border border-red-500/20 hover:border-red-500/50 bg-card transition-all duration-200 smooth-hover cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
              <Wind className="w-8 h-8 text-red-500" />
            </div>
            <CardHeader className="pb-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">MODULE 02</span>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                Cyclone Trajectory
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Monitor barometric pressure, gust speeds, projected storm centers, and uncertainty cone landfall models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">EYE SPEED</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{cycloneWind} km/h</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">PRESSURE</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">975 hPa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Heatwave Monitoring */}
        <Link href="/heatwaves" className="block no-underline group">
          <Card className="h-full border border-orange-500/20 hover:border-orange-500/50 bg-card transition-all duration-200 smooth-hover cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
              <Thermometer className="w-8 h-8 text-orange-500" />
            </div>
            <CardHeader className="pb-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">MODULE 03</span>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Heatwave & Wet-Bulb
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Track temperature grids, wet-bulb thresholds, cooling center capacities, and municipal health guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center px-3 py-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">MAX TEMP</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{heatwaveTemp}°C</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black font-black">WET-BULB</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">28.5°C</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Shelter & Evacuation Routing */}
        <Link href="/shelters" className="block no-underline group">
          <Card className="h-full border border-red-500/20 hover:border-red-500/50 bg-card transition-all duration-200 smooth-hover cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <CardHeader className="pb-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">MODULE 04</span>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                Shelter Management & Routing
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Allocate relief camp supplies, register emergency camps, and trace route evacuation corridors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-center px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">CAMPS ACTIVE</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">8 Camps</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black">TOTAL OCCUPANCY</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">1,240 Pax</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main 2-Column Dashboard Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Telemetry controls and Threat Level Index */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Threat Gauge */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-orange-500" />
                Aggregated Threat Index
              </CardTitle>
              <CardDescription className="text-xs">
                Dynamically calculated disaster threat probability.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              
              {/* Radial Progress Gauge */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Fill ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-500 ease-out",
                      threatLevel >= 80 ? "stroke-red-500" :
                      threatLevel >= 60 ? "stroke-orange-500" : "stroke-amber-500"
                    )}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * threatLevel) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={cn(
                    "text-3xl font-black tracking-tight",
                    threatLevel >= 80 ? "text-red-600 dark:text-red-400" :
                    threatLevel >= 60 ? "text-orange-600 dark:text-orange-400" : "text-amber-600 dark:text-amber-400"
                  )}>
                    {threatLevel}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    {threatLevel >= 80 ? 'Critical Danger' : 
                     threatLevel >= 60 ? 'High Threat' : 
                     threatLevel >= 40 ? 'Moderate Alert' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Warning Legend */}
              <div className="mt-4 w-full flex items-center justify-between text-xs font-semibold px-2 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-orange-500" />
                  Status:
                </span>
                <span className={cn(
                  "font-bold uppercase",
                  threatLevel >= 80 ? "text-red-600" : "text-orange-600 dark:text-orange-400"
                )}>
                  {threatLevel >= 80 ? 'Red Alert Active' : 'Amber Watch'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Telemetry Simulator controls */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Live Telemetry Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust values below to test dashboard threat index calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              
              {/* Flood Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <Label htmlFor="flood-sim">Mula River Gauge (m)</Label>
                  <span className="text-orange-600 dark:text-orange-400">{floodGauge.toFixed(1)}m</span>
                </div>
                <input
                  id="flood-sim"
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.1"
                  value={floodGauge}
                  onChange={(e) => setFloodGauge(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Wind Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <Label htmlFor="cyclone-sim">Cyclone Gusts (km/h)</Label>
                  <span className="text-red-600">{cycloneWind} km/h</span>
                </div>
                <input
                  id="cyclone-sim"
                  type="range"
                  min="20"
                  max="150"
                  value={cycloneWind}
                  onChange={(e) => setCycloneWind(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <Label htmlFor="heat-sim">Air Temperature (°C)</Label>
                  <span className="text-orange-600 dark:text-orange-400">{heatwaveTemp}°C</span>
                </div>
                <input
                  id="heat-sim"
                  type="range"
                  min="32"
                  max="48"
                  value={heatwaveTemp}
                  onChange={(e) => setHeatwaveTemp(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Landslide Alerts Counter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <Label htmlFor="landslide-sim">Landslide Warnings</Label>
                  <span className="text-red-600">{landslideAlerts} Regions</span>
                </div>
                <input
                  id="landslide-sim"
                  type="range"
                  min="0"
                  max="5"
                  value={landslideAlerts}
                  onChange={(e) => setLandslideAlerts(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GIS Ward Threat Map and Siren Control Desk */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive GIS mini map */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Map className="w-5 h-5 text-red-500" />
                  District GIS Risk Layout
                </CardTitle>
                <CardDescription className="text-xs">
                  Pune district ward quadrants colored by hazard intensity. Select a sector to inspect.
                </CardDescription>
              </div>
              <div className="flex gap-1 text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded-sm bg-red-500/20 text-red-700 dark:text-red-400">Red: Critical</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-orange-500/20 text-orange-700 dark:text-orange-400">Org: High</span>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* SVG Map (3 cols) */}
              <div className="md:col-span-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <svg className="w-full aspect-square max-w-[240px]" viewBox="0 0 100 100">
                  {/* Ward 1: North East */}
                  <path
                    d="M 50,50 L 50,10 A 40,40 0 0,1 90,50 Z"
                    className={cn(
                      "stroke-white dark:stroke-slate-950 stroke-[2] cursor-pointer transition-all duration-200 hover:opacity-85",
                      selectedWard?.id === 'w-1' ? 'fill-red-500 stroke-red-800 dark:stroke-white stroke-[2.5]' : 'fill-red-500/60'
                    )}
                    onClick={() => setSelectedWard(INITIAL_WARD_THREATS[0])}
                  />
                  {/* Ward 2: North West */}
                  <path
                    d="M 50,50 L 10,50 A 40,40 0 0,1 50,10 Z"
                    className={cn(
                      "stroke-white dark:stroke-slate-950 stroke-[2] cursor-pointer transition-all duration-200 hover:opacity-85",
                      selectedWard?.id === 'w-2' ? 'fill-orange-500 stroke-orange-800 dark:stroke-white stroke-[2.5]' : 'fill-orange-500/60'
                    )}
                    onClick={() => setSelectedWard(INITIAL_WARD_THREATS[1])}
                  />
                  {/* Ward 3: South West */}
                  <path
                    d="M 50,50 L 50,90 A 40,40 0 0,1 10,50 Z"
                    className={cn(
                      "stroke-white dark:stroke-slate-950 stroke-[2] cursor-pointer transition-all duration-200 hover:opacity-85",
                      selectedWard?.id === 'w-3' ? 'fill-amber-500 stroke-amber-800 dark:stroke-white stroke-[2.5]' : 'fill-amber-500/60'
                    )}
                    onClick={() => setSelectedWard(INITIAL_WARD_THREATS[2])}
                  />
                  {/* Ward 4: South East */}
                  <path
                    d="M 50,50 L 90,50 A 40,40 0 0,1 50,90 Z"
                    className={cn(
                      "stroke-white dark:stroke-slate-950 stroke-[2] cursor-pointer transition-all duration-200 hover:opacity-85",
                      selectedWard?.id === 'w-4' ? 'fill-green-500 stroke-green-800 dark:stroke-white stroke-[2.5]' : 'fill-green-500/60'
                    )}
                    onClick={() => setSelectedWard(INITIAL_WARD_THREATS[3])}
                  />
                  {/* Center Node representing Confluence mast */}
                  <circle
                    cx="50"
                    cy="50"
                    r="4.5"
                    className="fill-slate-800 dark:fill-white stroke-white dark:stroke-slate-800 stroke-[1.5] animate-pulse"
                  />
                </svg>
              </div>

              {/* Selected Ward Details Inspector (2 cols) */}
              <div className="md:col-span-2 flex flex-col justify-between">
                {selectedWard ? (
                  <div className="space-y-3">
                    <div className="pb-2 border-b border-border-subtle">
                      <span className="text-[10px] font-black uppercase text-slate-400">Selected Ward</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{selectedWard.name}</h4>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Risk Score:</span>
                        <span className="font-bold">{selectedWard.riskScore} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Threat Level:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase",
                          selectedWard.riskLevel === 'critical' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          selectedWard.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                          selectedWard.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                          'bg-green-500/20 text-green-600 dark:text-green-400'
                        )}>
                          {selectedWard.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Flood Gauge:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWard.flooding}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Wind Gusts:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWard.windSpeed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Heat Index:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedWard.temp}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link href="/shelters" className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/5 transition-colors no-underline">
                        <Navigation className="w-3.5 h-3.5 mr-1" />
                        Plot Evacuation Corridor
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400">Click a sector on the GIS map to inspect localized threat indexes.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alarm Mast Control Desk */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Volume2 className="w-5 h-5 text-orange-500" />
                Municipal Warning Siren Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Audit siren health status and trigger sound tests across municipal early warning posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-slate-500 dark:text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-2.5">Siren Station</th>
                      <th className="py-2.5">Coverage Radius</th>
                      <th className="py-2.5">Mock Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {sirens.map((siren) => (
                      <tr key={siren.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5">
                          <span className="block font-bold text-slate-800 dark:text-slate-100">{siren.name}</span>
                          <span className="text-[10px] text-slate-400">{siren.location}</span>
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">{siren.coverage}</td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            siren.status === 'active' ? 'bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse' :
                            siren.status === 'silent' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                            'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              siren.status === 'active' ? 'bg-red-500' :
                              siren.status === 'silent' ? 'bg-green-500' : 'bg-slate-400'
                            )} />
                            {siren.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            disabled={siren.status === 'offline'}
                            onClick={() => toggleSirenStatus(siren.id)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                              siren.status === 'active' 
                                ? 'border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/5' 
                                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            )}
                          >
                            {siren.status === 'active' ? 'Silence' : 'Test Sound'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
