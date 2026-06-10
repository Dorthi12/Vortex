'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft, 
  Activity, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Info,
  Layers,
  MapPin
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface RoadSegment {
  id: string;
  name: string;
  trafficCount: number; // vehicles/day
  baseWear: number; // 0.0 - 2.0
  currentWear: number; // dynamically computed
  status: 'good' | 'fair' | 'poor' | 'failed';
}

const INITIAL_SEGMENTS: RoadSegment[] = [
  { id: 'rs-1', name: 'Sangam Bridge Confluence Highway', trafficCount: 52000, baseWear: 1.1, currentWear: 1.1, status: 'fair' },
  { id: 'rs-2', name: 'Kalyani Nagar Riverside Drive', trafficCount: 34000, baseWear: 0.7, currentWear: 0.7, status: 'good' },
  { id: 'rs-3', name: 'Yerawada Market Causeway', trafficCount: 65000, baseWear: 1.6, currentWear: 1.6, status: 'poor' },
  { id: 'rs-4', name: 'Aundh Bypass Lane', trafficCount: 28000, baseWear: 0.4, currentWear: 0.4, status: 'good' },
  { id: 'rs-5', name: 'Baner Tech Arterial Link', trafficCount: 42000, baseWear: 1.3, currentWear: 1.3, status: 'fair' },
];

interface PotholeTicket {
  id: string;
  segmentId: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'scheduled' | 'repaired';
  reportedDate: string;
}

const INITIAL_POTHOLES: PotholeTicket[] = [
  { id: 'PH-401', segmentId: 'rs-3', location: 'Yerawada Causeway, Near Confluence Plaza', severity: 'critical', status: 'reported', reportedDate: 'June 09, 14:30' },
  { id: 'PH-402', segmentId: 'rs-1', location: 'Sangam Bridge, Eastbound Lane 3', severity: 'high', status: 'scheduled', reportedDate: 'June 10, 08:15' },
  { id: 'PH-403', segmentId: 'rs-5', location: 'Baner Link, Opposite IT Plaza Gate 2', severity: 'medium', status: 'repaired', reportedDate: 'June 08, 11:00' },
  { id: 'PH-404', segmentId: 'rs-3', location: 'Yerawada Causeway, Lane 1 outer edge', severity: 'high', status: 'reported', reportedDate: 'June 10, 15:40' },
];

export default function RoadsDashboard() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  // Telemetry simulator states
  const [heavyTransitLoad, setHeavyTransitLoad] = useState<number>(30); // % ratio of trucks
  const [segments, setSegments] = useState<RoadSegment[]>(INITIAL_SEGMENTS);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(INITIAL_SEGMENTS[0]);
  const [potholes, setPotholes] = useState<PotholeTicket[]>(INITIAL_POTHOLES);

  // Compute location-specific base multiplier
  const locationMultiplier = useMemo(() => {
    switch (userLocation) {
      case 'Hadapsar': return 1.35; // Heavy cargo trucks
      case 'Aundh': return 0.75; // Residential streetscape
      case 'Yerawada': return 1.1; // Moderate riverfront transit
      case 'Shivajinagar':
      default: return 1.0; // Standard
    }
  }, [userLocation]);

  // Compute road wear based on heavy transit load
  useEffect(() => {
    const factor = (heavyTransitLoad / 30) * locationMultiplier;
    setSegments(prev => prev.map(seg => {
      const computed = parseFloat((seg.baseWear * factor).toFixed(2));
      let state: 'good' | 'fair' | 'poor' | 'failed' = 'good';
      if (computed >= 1.8) state = 'failed';
      else if (computed >= 1.3) state = 'poor';
      else if (computed >= 0.8) state = 'fair';
      
      return { ...seg, currentWear: computed, status: state };
    }));
  }, [heavyTransitLoad, locationMultiplier]);

  // Sync selected segment with simulator
  useEffect(() => {
    if (selectedSegment) {
      const updated = segments.find(s => s.id === selectedSegment.id);
      if (updated) setSelectedSegment(updated);
    }
  }, [segments, selectedSegment]);

  // Handle heavy transit slider changes and dynamically spawn potholes if wear gets critical
  useEffect(() => {
    if (heavyTransitLoad >= 80 && potholes.length === INITIAL_POTHOLES.length) {
      // Spawn extra pothole ticket
      const extra: PotholeTicket = {
        id: 'PH-EXTRA',
        segmentId: 'rs-3',
        location: 'Yerawada Causeway, Junction Concourse 4',
        severity: 'critical',
        status: 'reported',
        reportedDate: 'June 10, Just Now (Simulated)'
      };
      setPotholes(prev => [extra, ...prev]);
    } else if (heavyTransitLoad < 80 && potholes.length > INITIAL_POTHOLES.length) {
      // Remove spawned ticket
      setPotholes(INITIAL_POTHOLES);
    }
  }, [heavyTransitLoad, potholes]);

  const getWearColor = (wear: number) => {
    if (wear >= 1.8) return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500';
    if (wear >= 1.3) return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500';
    if (wear >= 0.8) return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  };

  const getSVGPathColor = (seg: RoadSegment) => {
    if (seg.currentWear >= 1.8) return 'stroke-red-500';
    if (seg.currentWear >= 1.3) return 'stroke-orange-500';
    if (seg.currentWear >= 0.8) return 'stroke-amber-500';
    return 'stroke-emerald-500';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/infrastructure" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Infrastructure Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-[#4682B4] font-bold">Road Monitoring</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-[#4682B4]" />
          Road Wear & Pothole Telemetry
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Monitor district paving wear rates, active pothole repair schedules, and adjust transit vehicle weight impact simulators.
        </p>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Telemetry Index dials & simulator */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* average Wear Index */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Average District Wear Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Gauge */}
                {/* Scale is 0.0 to 2.5 wear index */}
                {/* Math: percentage = (avgWear / 2.5) */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-500",
                      heavyTransitLoad >= 80 ? "stroke-red-500 animate-pulse" :
                      heavyTransitLoad >= 55 ? "stroke-orange-500" : "stroke-[#4682B4]"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.min(100, (heavyTransitLoad / 100) * 100)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{(heavyTransitLoad * 0.03 + 0.3).toFixed(2)}x</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Wear Coefficient</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-[#4682B4]/20 bg-[#4682B4]/5">
                <span className="text-slate-600 dark:text-slate-400">Pavement Status:</span>
                <span className={cn(
                  "font-bold uppercase",
                  heavyTransitLoad >= 80 ? 'text-red-600' :
                  heavyTransitLoad >= 55 ? 'text-orange-600' : 'text-emerald-600'
                )}>
                  {heavyTransitLoad >= 80 ? 'Accelerated Degradation' : 
                   heavyTransitLoad >= 55 ? 'Moderate Wear' : 'Stable'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Transit Load Simulator */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Settings className="w-4 h-4 text-[#4682B4]" />
                Heavy Transit Simulator
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust the ratio of heavy commercial trucks to test wear acceleration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <Label htmlFor="truck-ratio">Truck Transit Ratio</Label>
                  <span className="text-[#4682B4]">{heavyTransitLoad}%</span>
                </div>
                <input
                  id="truck-ratio"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={heavyTransitLoad}
                  onChange={(e) => setHeavyTransitLoad(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs leading-normal">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Impact Warning</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Ratios exceeding 75% accelerate asphalt micro-cracking and can trigger emergency pothole report tickers within low-elevation causeway segments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GIS Segment wear SVG Map & Pothole tickets */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GIS Wear map */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Layers className="w-5 h-5 text-[#4682B4]" />
                GIS Road Segment wear Map
              </CardTitle>
              <CardDescription className="text-xs">
                Sector 4B streets. Click segments to inspect localized vehicle load and wear levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Interactive Segment wear SVG map */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Segment 1: Sangam Bridge Highway (x=30, y=25 to x=130, y=25) */}
                  <line
                    x1="25" y1="20" x2="135" y2="20"
                    className={cn(
                      "stroke-[5] stroke-linecap-round cursor-pointer transition-colors duration-300 hover:opacity-85",
                      getSVGPathColor(segments[0]),
                      selectedSegment?.id === 'rs-1' ? 'stroke-slate-800 dark:stroke-white stroke-[7.5]' : ''
                    )}
                    onClick={() => setSelectedSegment(segments[0])}
                  />
                  {/* Inner fill line to represent selection */}
                  {selectedSegment?.id === 'rs-1' && (
                    <line x1="25" y1="20" x2="135" y2="20" className={cn("stroke-[4] stroke-linecap-round pointer-events-none", getSVGPathColor(segments[0]))} />
                  )}

                  {/* Segment 2: Kalyani Nagar Riverside Drive (x=115, y=20 to x=115, y=70) */}
                  <line
                    x1="125" y1="22" x2="125" y2="78"
                    className={cn(
                      "stroke-[5] stroke-linecap-round cursor-pointer transition-colors duration-300 hover:opacity-85",
                      getSVGPathColor(segments[1]),
                      selectedSegment?.id === 'rs-2' ? 'stroke-slate-800 dark:stroke-white stroke-[7.5]' : ''
                    )}
                    onClick={() => setSelectedSegment(segments[1])}
                  />
                  {selectedSegment?.id === 'rs-2' && (
                    <line x1="125" y1="22" x2="125" y2="78" className={cn("stroke-[4] stroke-linecap-round pointer-events-none", getSVGPathColor(segments[1]))} />
                  )}

                  {/* Segment 3: Yerawada Market (x=75, y=45 to x=125, y=78) */}
                  <line
                    x1="80" y1="45" x2="125" y2="78"
                    className={cn(
                      "stroke-[5] stroke-linecap-round cursor-pointer transition-colors duration-300 hover:opacity-85",
                      getSVGPathColor(segments[2]),
                      selectedSegment?.id === 'rs-3' ? 'stroke-slate-800 dark:stroke-white stroke-[7.5]' : ''
                    )}
                    onClick={() => setSelectedSegment(segments[2])}
                  />
                  {selectedSegment?.id === 'rs-3' && (
                    <line x1="80" y1="45" x2="125" y2="78" className={cn("stroke-[4] stroke-linecap-round pointer-events-none", getSVGPathColor(segments[2]))} />
                  )}

                  {/* Segment 4: Aundh Bypass (x=30, y=25 to x=80, y=45) */}
                  <line
                    x1="25" y1="20" x2="80" y2="45"
                    className={cn(
                      "stroke-[5] stroke-linecap-round cursor-pointer transition-colors duration-300 hover:opacity-85",
                      getSVGPathColor(segments[3]),
                      selectedSegment?.id === 'rs-4' ? 'stroke-slate-800 dark:stroke-white stroke-[7.5]' : ''
                    )}
                    onClick={() => setSelectedSegment(segments[3])}
                  />
                  {selectedSegment?.id === 'rs-4' && (
                    <line x1="25" y1="20" x2="80" y2="45" className={cn("stroke-[4] stroke-linecap-round pointer-events-none", getSVGPathColor(segments[3]))} />
                  )}

                  {/* Segment 5: Baner Link (x=30, y=70 to x=80, y=45) */}
                  <line
                    x1="30" y1="70" x2="80" y2="45"
                    className={cn(
                      "stroke-[5] stroke-linecap-round cursor-pointer transition-colors duration-300 hover:opacity-85",
                      getSVGPathColor(segments[4]),
                      selectedSegment?.id === 'rs-5' ? 'stroke-slate-800 dark:stroke-white stroke-[7.5]' : ''
                    )}
                    onClick={() => setSelectedSegment(segments[4])}
                  />
                  {selectedSegment?.id === 'rs-5' && (
                    <line x1="30" y1="70" x2="80" y2="45" className={cn("stroke-[4] stroke-linecap-round pointer-events-none", getSVGPathColor(segments[4]))} />
                  )}

                  {/* Segment Labels */}
                  <text x="80" y="14" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[3.5px] font-black pointer-events-none">Confluence Hwy</text>
                  <text x="135" y="50" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[3.5px] font-black pointer-events-none" transform="rotate(90, 135, 50)">Riverside Dr</text>
                  <text x="108" y="58" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[3.5px] font-black pointer-events-none" transform="rotate(35, 108, 58)">Yerawada Causeway</text>
                  
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-emerald-500" />Stable (&lt;0.8x)</span>
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-amber-500" />Cracked/Fair (0.8x - 1.29x)</span>
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-orange-500" />Severely Worn (1.3x - 1.79x)</span>
                  <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-red-500" />Failed (&gt;1.8x)</span>
                </div>
              </div>

              {/* Segment Details Inspector */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {selectedSegment ? (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Roadway Inspector</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedSegment.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Traffic Load: <strong className="text-slate-700 dark:text-slate-300">{selectedSegment.trafficCount.toLocaleString()} vehicles/day</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={cn(
                        "px-4 py-2.5 rounded-lg border text-center flex-1 md:flex-none min-w-[125px]",
                        getWearColor(selectedSegment.currentWear)
                      )}>
                        <span className="block text-[8px] uppercase font-black text-slate-400">Pavement Wear</span>
                        <span className="text-base font-black leading-none mt-0.5">{selectedSegment.currentWear.toFixed(2)}x</span>
                      </div>
                      
                      {selectedSegment.currentWear >= 1.3 ? (
                        <Link href="/maintenance" className="px-3 py-2 rounded bg-[#4682B4] hover:bg-[#4682B4]/90 text-white text-xs font-bold text-center no-underline cursor-pointer">
                          Schedule Repaving
                        </Link>
                      ) : (
                        <span className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold text-center flex items-center gap-1">
                          <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                          Stable Surface
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center py-4 text-xs text-slate-400">
                    Select a street segment on the GIS layout map to audit.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reported Potholes Directory */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <AlertTriangle className="w-5 h-5 text-[#4682B4]" />
                Municipal Reported Potholes Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Active tickets generated from citizens reports and telemetry scans.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-slate-500 dark:text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-2.5">Ticket ID</th>
                      <th className="py-2.5">Reported Location</th>
                      <th className="py-2.5">Severity</th>
                      <th className="py-2.5">Mock Status</th>
                      <th className="py-2.5 text-right">Reported Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {potholes.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 font-bold text-[#4682B4]">{ticket.id}</td>
                        <td className="py-2.5">
                          <span className="block text-slate-800 dark:text-slate-100 font-bold">{ticket.location}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                            ticket.severity === 'critical' ? 'bg-red-500/10 text-red-600' :
                            ticket.severity === 'high' ? 'bg-orange-500/10 text-orange-600' :
                            'bg-amber-500/10 text-amber-600'
                          )}>
                            {ticket.severity}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            ticket.status === 'reported' ? 'bg-red-500/10 text-red-600 animate-pulse' :
                            ticket.status === 'scheduled' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-emerald-500/10 text-emerald-600'
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              ticket.status === 'reported' ? 'bg-red-500' :
                              ticket.status === 'scheduled' ? 'bg-amber-500' : 'bg-emerald-500'
                            )} />
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">{ticket.reportedDate}</td>
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
