'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Waves, 
  AlertTriangle, 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  Activity, 
  CloudRain, 
  Layers, 
  Navigation,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface FloodSector {
  id: string;
  name: string;
  elevation: number; // meters above sea level
  baseRisk: 'critical' | 'high' | 'medium' | 'low';
  currentDepth: number; // meters of water logging
  status: 'dry' | 'waterlogged' | 'inundated';
}

const INITIAL_SECTORS: FloodSector[] = [
  { id: 'f-1', name: 'Sangamwadi Confluence Area', elevation: 542, baseRisk: 'critical', currentDepth: 0.8, status: 'waterlogged' },
  { id: 'f-2', name: 'Kalyani Nagar Lowlands', elevation: 546, baseRisk: 'high', currentDepth: 0.4, status: 'waterlogged' },
  { id: 'f-3', name: 'Yerawada Riverbed Margins', elevation: 540, baseRisk: 'critical', currentDepth: 1.5, status: 'inundated' },
  { id: 'f-4', name: 'Aundh Causeway Environs', elevation: 549, baseRisk: 'medium', currentDepth: 0.0, status: 'dry' },
  { id: 'f-5', name: 'Baner Tech Park Ridges', elevation: 565, baseRisk: 'low', currentDepth: 0.0, status: 'dry' },
  { id: 'f-6', name: 'Koregaon Park Sector A', elevation: 545, baseRisk: 'high', currentDepth: 0.2, status: 'waterlogged' },
];

export default function FloodsDashboard() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Civic Hazards');
  }, [setActiveTab]);

  // Simulation state
  const [damReleaseActive, setDamReleaseActive] = useState<boolean>(false);
  const [riverLevel, setRiverLevel] = useState<number>(7.8); // normal-high
  const [dischargeRate, setDischargeRate] = useState<number>(28000); // cusecs
  const [rainRate, setRainRate] = useState<number>(18); // mm/hr
  const [sectors, setSectors] = useState<FloodSector[]>(INITIAL_SECTORS);
  const [selectedSector, setSelectedSector] = useState<FloodSector | null>(INITIAL_SECTORS[0]);

  // Run simulation interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (damReleaseActive) {
      // Start flooding
      timer = setInterval(() => {
        setRiverLevel(prev => {
          const next = Math.min(9.8, prev + 0.15);
          return parseFloat(next.toFixed(2));
        });
        setDischargeRate(prev => Math.min(65000, Math.round(prev + 1200)));
        setRainRate(prev => Math.min(45, prev + 1));
        
        // Dynamically update sectors
        setSectors(prev => prev.map(sec => {
          let extraDepth = 0;
          if (sec.elevation <= 542) extraDepth = 1.6;
          else if (sec.elevation <= 546) extraDepth = 0.9;
          else if (sec.elevation <= 550) extraDepth = 0.3;
          
          const newDepth = parseFloat((sec.currentDepth + extraDepth * 0.08).toFixed(2));
          const newStatus = newDepth >= 1.0 ? 'inundated' : newDepth > 0.0 ? 'waterlogged' : 'dry';
          return { ...sec, currentDepth: newDepth, status: newStatus };
        }));
      }, 500);
    } else {
      // Revert to baseline
      timer = setInterval(() => {
        setRiverLevel(prev => {
          if (prev <= 7.8) return 7.8;
          return parseFloat((prev - 0.2).toFixed(2));
        });
        setDischargeRate(prev => {
          if (prev <= 28000) return 28000;
          return Math.max(28000, prev - 1500);
        });
        setRainRate(prev => {
          if (prev <= 18) return 18;
          return Math.max(18, prev - 2);
        });
        
        // Dry up sectors slowly
        setSectors(prev => prev.map(sec => {
          const base = INITIAL_SECTORS.find(s => s.id === sec.id);
          if (!base) return sec;
          let newDepth = sec.currentDepth;
          if (sec.currentDepth > base.currentDepth) {
            newDepth = parseFloat((sec.currentDepth - 0.1).toFixed(2));
            if (newDepth < base.currentDepth) newDepth = base.currentDepth;
          }
          const newStatus = newDepth >= 1.0 ? 'inundated' : newDepth > 0.0 ? 'waterlogged' : 'dry';
          return { ...sec, currentDepth: newDepth, status: newStatus };
        }));
      }, 500);
    }

    return () => clearInterval(timer);
  }, [damReleaseActive]);

  // Keep selected sector up to date with simulation
  useEffect(() => {
    if (selectedSector) {
      const updated = sectors.find(s => s.id === selectedSector.id);
      if (updated) setSelectedSector(updated);
    }
  }, [sectors, selectedSector]);

  const toggleDamSimulation = () => {
    setDamReleaseActive(!damReleaseActive);
  };

  const resetSimulation = () => {
    setDamReleaseActive(false);
    setRiverLevel(7.8);
    setDischargeRate(28000);
    setRainRate(18);
    setSectors(INITIAL_SECTORS);
    setSelectedSector(INITIAL_SECTORS[0]);
  };

  const getStatusColor = (sec: FloodSector) => {
    if (sec.status === 'inundated') return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500';
    if (sec.status === 'waterlogged') return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500';
    return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/hazards" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Hazards Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">Flood Telemetry</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Waves className="w-8 h-8 text-orange-500 animate-pulse" />
            Flood Monitoring & River Gauges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor Khadakwasla reservoir outflows, Pune river basin height indicators, and low-elevation neighborhood inundation maps.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={toggleDamSimulation}
            className={cn(
              "font-bold text-xs shadow-sm cursor-pointer",
              damReleaseActive 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {damReleaseActive ? 'Stop Reservoir Release' : 'Simulate Dam Outflow'}
          </Button>
          <Button 
            variant="ghost"
            onClick={resetSimulation}
            className="border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Water Gauge Widget (SVG) & Stats */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SVG Water level gauge */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-500" />
                Mula-Mutha Confluence Gauge
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time river height indicator against safety parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              {/* Gauge Graphic */}
              <div className="relative w-32 h-64 flex items-center justify-center mt-2">
                {/* SVG Thermometer-style Gauge */}
                <svg className="w-full h-full" viewBox="0 0 80 160">
                  {/* Gauge background frame */}
                  <rect x="25" y="10" width="30" height="120" rx="15" className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" strokeWidth="2" />
                  
                  {/* Danger Line (9.0m) - mapped to y=26 */}
                  <line x1="15" y1="26" x2="65" y2="26" className="stroke-red-500" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="10" y="22" className="fill-red-600 font-bold text-[6px] dark:fill-red-400">Danger: 9.0m</text>

                  {/* Warning Line (8.0m) - mapped to y=42 */}
                  <line x1="15" y1="42" x2="65" y2="42" className="stroke-orange-500" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="10" y="38" className="fill-orange-600 font-bold text-[6px] dark:fill-orange-400">Warning: 8.0m</text>

                  {/* Water Fill */}
                  {/* Fill height goes from y=120 (level 4m or below) to y=15 (level 10m) */}
                  {/* Math: y_val = 120 - ((riverLevel - 4) / 6) * 105 */}
                  <path
                    d={`M 26,115 L 26,${Math.max(16, 120 - ((riverLevel - 4) / 6) * 105)} C 35,${Math.max(16, 120 - ((riverLevel - 4) / 6) * 105) - 4} 45,${Math.max(16, 120 - ((riverLevel - 4) / 6) * 105) + 4} 54,${Math.max(16, 120 - ((riverLevel - 4) / 6) * 105)} L 54,115 Z`}
                    className={cn(
                      "transition-all duration-500 ease-out fill-blue-500/80",
                      riverLevel >= 9.0 ? "fill-red-500/80" : 
                      riverLevel >= 8.0 ? "fill-orange-500/80" : "fill-blue-500/80"
                    )}
                  />

                  {/* Tick Marks */}
                  {[4, 5, 6, 7, 8, 9, 10].map((t) => {
                    const y = 120 - ((t - 4) / 6) * 105;
                    return (
                      <g key={t}>
                        <line x1="50" y1={y} x2="55" y2={y} className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1" />
                        <text x="58" y={y + 2} className="fill-slate-500 dark:fill-slate-400 text-[6px] font-semibold">{t}m</text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Interactive digital read-out */}
                <div className="absolute bottom-2 bg-slate-900 text-white px-3 py-1 rounded border border-slate-700 text-center shadow">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold leading-none">Current</span>
                  <span className={cn(
                    "text-base font-black leading-tight",
                    riverLevel >= 9.0 ? 'text-red-400' :
                    riverLevel >= 8.0 ? 'text-orange-400' : 'text-blue-400'
                  )}>
                    {riverLevel.toFixed(2)}m
                  </span>
                </div>
              </div>

              {/* Threshold Status */}
              <div className="mt-4 w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
                <span className="text-slate-600 dark:text-slate-400">Alert Level:</span>
                <span className={cn(
                  "font-bold uppercase",
                  riverLevel >= 9.0 ? "text-red-600 dark:text-red-400" :
                  riverLevel >= 8.0 ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
                )}>
                  {riverLevel >= 9.0 ? 'CRITICAL EVACUATION' :
                   riverLevel >= 8.0 ? 'WARNING ACTIVATED' : 'STABLE LEVEL'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Precipitation & Outflow Meters */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-orange-500" />
                Rainfall & Dam Discharge
              </CardTitle>
              <CardDescription className="text-xs">
                Sensors deployed at catchment area.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Precipitation Sensor</span>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{rainRate} mm/hr</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Rain Intensity</span>
                  <span className={cn(
                    "block text-xs font-bold uppercase mt-0.5",
                    rainRate >= 40 ? 'text-red-600' :
                    rainRate >= 25 ? 'text-orange-600' : 'text-slate-600 dark:text-slate-400'
                  )}>
                    {rainRate >= 40 ? 'Severe Downpour' :
                     rainRate >= 25 ? 'Heavy Showers' : 'Moderate'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Khadakwasla Release</span>
                  <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{dischargeRate.toLocaleString()} Cusecs</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">SLA Dispatch Time</span>
                  <span className="block text-xs font-bold text-emerald-600 mt-0.5">Real-time Feed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GIS Inundation Map Grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Grid Map layout */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-orange-500" />
                GIS Flood Inundation Grid Map
              </CardTitle>
              <CardDescription className="text-xs">
                Pune riverside sectors mapped dynamically. Click any cell to audit local depth parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* SVG Grid Map showing sectors along the river */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                {/* SVG drawing */}
                <svg className="w-full max-w-[420px] aspect-[16/9]" viewBox="0 0 160 90">
                  {/* River Flow - Blue line winding across the grid */}
                  <path
                    d="M -10,45 Q 40,30 80,55 T 170,40"
                    fill="transparent"
                    className="stroke-blue-500 dark:stroke-blue-400 stroke-[12] opacity-80"
                  />
                  {/* Dynamic water level highlight on top of river */}
                  <path
                    d="M -10,45 Q 40,30 80,55 T 170,40"
                    fill="transparent"
                    className={cn(
                      "stroke-blue-400 dark:stroke-blue-300 stroke-[12] opacity-35 transition-all duration-500",
                      riverLevel >= 9.0 ? 'stroke-red-500 animate-pulse stroke-[16]' :
                      riverLevel >= 8.0 ? 'stroke-orange-500 stroke-[14]' : ''
                    )}
                  />

                  {/* Sectors layout overlay */}
                  {/* Sector 1: Sangamwadi (y=20, x=70) */}
                  <rect
                    x="75" y="20" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[0].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[0].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-1' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[0])}
                  />
                  <text x="86" y="30" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Sangamwadi</text>

                  {/* Sector 2: Kalyani Nagar (y=45, x=110) */}
                  <rect
                    x="105" y="52" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[1].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[1].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-2' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[1])}
                  />
                  <text x="116" y="62" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Kalyani Ngr</text>

                  {/* Sector 3: Yerawada (y=20, x=105) */}
                  <rect
                    x="105" y="15" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[2].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[2].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-3' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[2])}
                  />
                  <text x="116" y="25" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Yerawada</text>

                  {/* Sector 4: Aundh (y=15, x=25) */}
                  <rect
                    x="25" y="15" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[3].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[3].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-4' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[3])}
                  />
                  <text x="36" y="25" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Aundh</text>

                  {/* Sector 5: Baner (y=55, x=20) */}
                  <rect
                    x="20" y="55" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[4].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[4].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-5' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[4])}
                  />
                  <text x="31" y="65" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Baner</text>

                  {/* Sector 6: Koregaon Park (y=50, x=75) */}
                  <rect
                    x="72" y="55" width="22" height="16" rx="2"
                    className={cn(
                      "stroke-white dark:stroke-slate-900 stroke-[1] cursor-pointer transition-all duration-200 hover:opacity-80",
                      sectors[5].status === 'inundated' ? 'fill-red-500/70' :
                      sectors[5].status === 'waterlogged' ? 'fill-orange-500/60' : 'fill-slate-500/20',
                      selectedSector?.id === 'f-6' ? 'stroke-slate-800 dark:stroke-white stroke-[2.5]' : ''
                    )}
                    onClick={() => setSelectedSector(sectors[5])}
                  />
                  <text x="83" y="65" textAnchor="middle" className="fill-slate-800 dark:fill-slate-200 text-[3.5px] font-black pointer-events-none">Koregaon Pk</text>

                </svg>

                {/* Map Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-red-500/70 rounded border border-red-500" />Inundated (&gt;1.0m)</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-orange-500/60 rounded border border-orange-500" />Waterlogged (0.1m - 0.9m)</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-3 bg-slate-300 dark:bg-slate-800 rounded border border-slate-400" />Dry (0.0m)</span>
                </div>
              </div>

              {/* Selected Sector Details Inspector */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {selectedSector ? (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Sector Inspector</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedSector.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Elevation: <strong className="text-slate-700 dark:text-slate-300">{selectedSector.elevation}m ASL</strong> • Base Risk Profile: <strong className="capitalize text-slate-700 dark:text-slate-300">{selectedSector.baseRisk}</strong>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={cn(
                        "px-4 py-2.5 rounded-lg border text-center flex-1 md:flex-none min-w-[120px]",
                        getStatusColor(selectedSector)
                      )}>
                        <span className="block text-[8px] uppercase font-black">Water Depth</span>
                        <span className="text-base font-black leading-none mt-0.5">{selectedSector.currentDepth.toFixed(2)}m</span>
                      </div>

                      <div className="flex flex-col gap-1 flex-1 md:flex-none">
                        {selectedSector.currentDepth >= 1.0 ? (
                          <Link href="/shelters" className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold text-center no-underline flex items-center justify-center gap-1 cursor-pointer">
                            <Navigation className="w-3.5 h-3.5" />
                            Evacuate Now
                          </Link>
                        ) : (
                          <span className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold text-center flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            Normal Routing
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-4">
                    <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Select a sector grid cells above to audit local parameters.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Action plan / Flood guidelines */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Emergency Operations Action Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-bold">1</span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Siren Deployment (Threshold &gt; 8.0m):</strong> Confluence & Aundh bridge sirens triggered when river height passes warning mark.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 font-bold">2</span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Transit Closure (Threshold &gt; 8.5m):</strong> Aundh and Sangamwadi causeways will be shut by traffic authorities. Evacuation paths routed via bypass flyovers.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 font-bold">3</span>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Ration Distribution Mobilization:</strong> Relief kits dispatched from Central Stores to Sector 4B shelters.
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
