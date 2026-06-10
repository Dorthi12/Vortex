'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wind, 
  AlertTriangle, 
  ArrowLeft, 
  Compass, 
  Activity, 
  Radio, 
  Bell, 
  ShieldCheck, 
  Send,
  MapPin
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface PathNode {
  id: string;
  name: string;
  time: string;
  coords: { x: number; y: number };
  windSpeed: number; // km/h
  pressure: number; // hPa
  category: string;
}

const MOCK_PATH: PathNode[] = [
  { id: 'n-1', name: 'Pre-depression Stage', time: 'June 09, 06:00', coords: { x: 25, y: 75 }, windSpeed: 45, pressure: 1002, category: 'Depression' },
  { id: 'n-2', name: 'Deep Depression Alert', time: 'June 09, 18:00', coords: { x: 45, y: 65 }, windSpeed: 65, pressure: 994, category: 'Deep Depression' },
  { id: 'n-3', name: 'Storm Formation Phase', time: 'June 10, 06:00', coords: { x: 68, y: 50 }, windSpeed: 90, pressure: 982, category: 'Cyclonic Storm' },
  { id: 'n-4', name: 'Current Storm Eye Position', time: 'June 10, 17:00 (Current)', coords: { x: 92, y: 35 }, windSpeed: 118, pressure: 971, category: 'Severe Cyclonic Storm' },
  { id: 'n-5', name: 'Projected Landfall Zone', time: 'June 11, 03:00 (Forecast)', coords: { x: 118, y: 22 }, windSpeed: 130, pressure: 962, category: 'Very Severe Cyclonic Storm' },
];

export default function CyclonesDashboard() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Civic Hazards');
  }, [setActiveTab]);

  // Cyclone simulation parameters
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(MOCK_PATH[3]);
  const [windSpeed, setWindSpeed] = useState<number>(118);
  const [pressure, setPressure] = useState<number>(971);
  const [stormName, setStormName] = useState<string>('NISARGA-II');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('EMERGENCY ALERT: Severe Cyclonic Storm NISARGA-II approaching district limits. Wind velocity exceeding 110km/h. Residents are advised to move to the nearest shelter immediately.');
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  // Sync parameters with selected node
  useEffect(() => {
    if (selectedNode) {
      setWindSpeed(selectedNode.windSpeed);
      setPressure(selectedNode.pressure);
    }
  }, [selectedNode]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 2500);
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
        <span className="text-xs text-red-600 dark:text-red-400 font-bold">Cyclone Tracking</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wind className="w-8 h-8 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
          Cyclone Tracking & Wind Velocity
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Live barometric coordinates, Doppler radar telemetry, uncertainty cones, and early warning broadcast stations.
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Gauges (Wind & Pressure) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Wind Speed Dial */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-red-500" />
                Doppler Gust Velocity
              </CardTitle>
              <CardDescription className="text-xs">
                Wind speed calculations at storm eye walls.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              {/* SVG Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                  {/* Gauge Arc Background */}
                  <path
                    d="M 10,45 A 40,40 0 0,1 90,45"
                    fill="transparent"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Gauge Arc Active Fill */}
                  <path
                    d="M 10,45 A 40,40 0 0,1 90,45"
                    fill="transparent"
                    className={cn(
                      "transition-all duration-500 ease-out",
                      windSpeed >= 118 ? "stroke-red-500" :
                      windSpeed >= 88 ? "stroke-orange-500" : "stroke-amber-500"
                    )}
                    strokeWidth="8"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * Math.min(150, windSpeed)) / 150}
                    strokeLinecap="round"
                  />
                  {/* Needle */}
                  {/* Angle calculation for rotate: (speed/150)*180 - 180 */}
                  <line
                    x1="50" y1="45" x2="50" y2="15"
                    className="stroke-slate-800 dark:stroke-slate-200"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    transform={`rotate(${Math.round((Math.min(150, windSpeed) / 150) * 180 - 90)} 50 45)`}
                  />
                  <circle cx="50" cy="45" r="4.5" className="fill-slate-800 dark:fill-slate-200" />
                </svg>
                <div className="absolute bottom-1 flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{windSpeed} km/h</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Eye Gusts</span>
                </div>
              </div>

              {/* Storm Category classification */}
              <div className="w-full mt-4 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5">
                <span className="text-slate-600 dark:text-slate-400">IMD Classification:</span>
                <span className="font-bold text-red-600 dark:text-red-400 uppercase">
                  {windSpeed >= 118 ? 'Severe Cyclone' : 
                   windSpeed >= 88 ? 'Cyclonic Storm' : 'Deep Depression'}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Barometric Pressure Gauge */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-500" />
                Central Core Pressure
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Radial Gauge for Pressure */}
                {/* Scale is 940 hPa to 1020 hPa */}
                {/* Math: percent = (1020 - pressure) / (1020 - 940) */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="6"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-red-500 transition-all duration-500"
                    strokeWidth="6"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.max(0, Math.min(80, 1020 - pressure))) / 80}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">{pressure} hPa</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Core Pressure</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <span className="text-slate-600 dark:text-slate-400">Pressure Status:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 uppercase">
                  {pressure <= 970 ? 'Extreme Low' : 'Depressed'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Trajectory SVG Map & Broadcast Box */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cyclone Path Map */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-red-500" />
                Cyclone Path Trajectory Map
              </CardTitle>
              <CardDescription className="text-xs">
                GIS projections representing historical storm path and uncertainty cone landfall coordinates. Click nodes to audit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Interactive SVG trajectory tracking map */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Coastline outline */}
                  <path
                    d="M 110,-10 C 110,40 100,50 120,65 T 140,100"
                    fill="transparent"
                    className="stroke-amber-600/30 dark:stroke-amber-400/20 stroke-[3] stroke-dasharray[2,2]"
                  />
                  <text x="135" y="80" className="fill-slate-400 text-[3.5px] font-bold tracking-wider uppercase">Inland Region</text>
                  <text x="50" y="80" className="fill-slate-400 text-[3.5px] font-bold tracking-wider uppercase font-black">Arabian Sea</text>

                  {/* Uncertainty cone projection (Red/Orange gradient overlay) */}
                  {/* Cone starts at node 4 (x=92, y=35) and expands to x=150, y=10 to y=45 */}
                  <polygon
                    points="92,35 130,15 145,28 92,35"
                    className="fill-red-500/10 stroke-red-500/20 stroke-[1] stroke-dasharray[2,2]"
                  />
                  <polygon
                    points="92,35 140,5 155,20 92,35"
                    className="fill-orange-500/5 stroke-orange-500/10 stroke-[0.5] stroke-dasharray[1,1]"
                  />

                  {/* Trajectory path connection lines */}
                  <path
                    d="M 25,75 L 45,65 L 68,50 L 92,35 L 118,22"
                    fill="transparent"
                    className="stroke-red-500/50 stroke-[1.5] stroke-dasharray[3,3]"
                  />
                  <path
                    d="M 25,75 L 45,65 L 68,50 L 92,35"
                    fill="transparent"
                    className="stroke-red-500 stroke-[2.5]"
                  />

                  {/* Path Nodes */}
                  {MOCK_PATH.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isCurrent = node.id === 'n-4';
                    const isForecast = node.id === 'n-5';
                    
                    return (
                      <g key={node.id} className="cursor-pointer" onClick={() => setSelectedNode(node)}>
                        {/* Ring highlight if selected */}
                        {isSelected && (
                          <circle
                            cx={node.coords.x}
                            cy={node.coords.y}
                            r="6"
                            className="fill-none stroke-red-500 stroke-[1.5] animate-ping"
                          />
                        )}
                        {/* Node circle */}
                        <circle
                          cx={node.coords.x}
                          cy={node.coords.y}
                          r={isCurrent ? "4.5" : "3.5"}
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1.5] transition-colors",
                            isCurrent ? "fill-red-600 animate-pulse" :
                            isForecast ? "fill-orange-500/50" : "fill-red-500/80"
                          )}
                        />
                        {/* Node labels */}
                        <text
                          x={node.coords.x}
                          y={node.coords.y - 6}
                          textAnchor="middle"
                          className={cn(
                            "text-[3.5px] font-black",
                            isCurrent ? "fill-red-600 dark:fill-red-400" : "fill-slate-600 dark:fill-slate-300"
                          )}
                        >
                          {isCurrent ? 'EYE' : isForecast ? 'Proj.' : 'H'}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-600 rounded-full" />Current Eye Center</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500/80 rounded-full" />Historical Track</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 bg-orange-500/50 rounded-full" />Projected Landfall</span>
                  <span className="flex items-center gap-1"><span className="h-3 w-5 bg-red-500/10 border border-dashed border-red-500/20 rounded-xs" />Cone of Uncertainty</span>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30">
                {selectedNode ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Path Node Inspector</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                        {selectedNode.name}
                        <span className="text-xs font-medium text-slate-500">({selectedNode.time})</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Coordinates: <strong className="text-slate-700 dark:text-slate-300">18.52°N, 73.85°E</strong> • Stage: <strong className="text-slate-700 dark:text-slate-300">{selectedNode.category}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-center min-w-[90px]">
                        <span className="block text-[8px] uppercase font-black text-slate-400">Wind Gust</span>
                        <span className="text-xs font-extrabold text-red-600 dark:text-red-400 leading-none">{selectedNode.windSpeed} km/h</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800 text-center min-w-[90px]">
                        <span className="block text-[8px] uppercase font-black text-slate-400">Pressure</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-none">{selectedNode.pressure} hPa</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    Click a node on the trajectory map to audit details.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Alert Dispatcher Form */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-red-500" />
                Emergency Operations Broadcasting
              </CardTitle>
              <CardDescription className="text-xs">
                Broadcast warning alerts and safety notifications to the district.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-target">Broadcast Target Wards</Label>
                    <input 
                      id="broadcast-target" 
                      type="text" 
                      defaultValue="East Pune, Sangam Bridge sectors" 
                      className="flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-channel">Dispatch Channel</Label>
                    <select id="broadcast-channel" className="flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
                      <option>Consolidated SMS Gateways & Sirens</option>
                      <option>Wireless Broadcaster</option>
                      <option>Civil Defense Radio Mast</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broadcast-text">Broadcast Warning Message</Label>
                  <textarea
                    id="broadcast-text"
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    disabled={broadcastSent || !broadcastMessage}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {broadcastSent ? 'Broadcasting Alert...' : 'Dispatch Warning Broadcast'}
                  </Button>
                </div>
              </form>

              {broadcastSent && (
                <div className="mt-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Alert dispatch code 200: Warning successfully pushed to cell towers.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
