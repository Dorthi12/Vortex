// app/(dashboard)/traffic/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, RefreshCw, Compass, ShieldAlert, ShieldCheck, Truck, Hospital
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

// Node Coordinate Points for SVG visualization
const NODE_MAP: Record<string, { x: number; y: number }> = {
  "Sangamwadi": { x: 90, y: 70 },
  "Yerawada": { x: 130, y: 50 },
  "Hadapsar": { x: 150, y: 120 },
  "Shivajinagar": { x: 50, y: 90 },
  "Aundh": { x: 20, y: 40 },
  "Khadakwasla": { x: 40, y: 140 },
  "KalyaniNagar": { x: 140, y: 80 },
  "Baner": { x: 10, y: 80 }
};

const SHIELD_ROADS = [
  "Sangamwadi-Yerawada", "Yerawada-KalyaniNagar", "KalyaniNagar-Hadapsar",
  "Shivajinagar-Hadapsar", "Aundh-Baner", "Shivajinagar-Aundh", "Khadakwasla-Shivajinagar"
];

export default function TrafficDashboard() {
  const [startNode, setStartNode] = useState<string>("Yerawada");
  const [endNode, setEndNode] = useState<string>("Hadapsar");
  
  // Exclusions (road closures, flood zones)
  const [roadClosures, setRoadClosures] = useState<string[]>([]);
  const [floodZones, setFloodZones] = useState<string[]>([]);

  // Telemetry API states
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [congestionResult, setCongestionResult] = useState<any>(null);

  useEffect(() => {
    calculateRoute();
    runCongestionForecast();
  }, [startNode, endNode, roadClosures, floodZones]);

  const calculateRoute = async () => {
    setLoadingRoute(true);
    try {
      const res = await fetch('/api/infra/emergency-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance_location: startNode,
          hospital_location: endNode,
          road_closures: roadClosures,
          flood_zones: floodZones
        })
      });
      const data = await res.json();
      setRoutingResult(data);
    } catch (err) {
      // Fallback
      setRoutingResult({
        fastest_route: [startNode, "Sangamwadi", endNode],
        dijkstra_distance_km: 7.2,
        astar_route: [startNode, "Sangamwadi", endNode],
        astar_distance_km: 7.2,
        eta_minutes: 11.5,
        alternative_route: [startNode, endNode],
        risk_route: [startNode, "Hadapsar", endNode]
      });
    } finally {
      setLoadingRoute(false);
    }
  };

  const runCongestionForecast = async () => {
    try {
      const res = await fetch('/api/infra/traffic-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_count: 750,
          road_closures: roadClosures
        })
      });
      const data = await res.json();
      setCongestionResult(data);
    } catch (err) {
      setCongestionResult({
        congestion_score: 72.4,
        predicted_hotspots: ["Yerawada Causeway", "Sangamwadi Highway"]
      });
    }
  };

  const toggleClosure = (road: string) => {
    setRoadClosures(prev => 
      prev.includes(road) ? prev.filter(r => r !== road) : [...prev, road]
    );
  };

  const toggleFloodZone = (zone: string) => {
    setFloodZones(prev => 
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 8</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Smart Traffic & Emergency Routing</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols) - Inputs */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Emergency Route Engine</CardTitle>
              <CardDescription className="text-xs">Identify paths with A* & Dijkstra algorithms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Ambulance Start</label>
                  <select 
                    value={startNode} 
                    onChange={(e) => setStartNode(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1A] rounded text-xs font-semibold"
                  >
                    {Object.keys(NODE_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Hospital Destination</label>
                  <select 
                    value={endNode} 
                    onChange={(e) => setEndNode(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1A] rounded text-xs font-semibold"
                  >
                    {Object.keys(NODE_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {/* Exclusion Checklist */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="block text-[10px] font-black uppercase text-slate-450">Exclusion Overrides (Roads / Flood Zones)</span>
                
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {Object.keys(NODE_MAP).map(node => (
                    <label key={node} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={floodZones.includes(node)} 
                        onChange={() => toggleFloodZone(node)}
                        className="rounded border-slate-300 dark:border-slate-700 text-[#4682B4] focus:ring-[#4682B4]"
                      />
                      <span>Block Node: {node}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={calculateRoute} 
                disabled={loadingRoute}
                className="w-full bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold"
              >
                {loadingRoute ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Activity className="w-4 h-4 mr-1" />}
                Solve Emergency Route
              </Button>
            </CardContent>
          </Card>

          {congestionResult && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-4 text-xs space-y-2 font-bold">
              <span className="text-[9px] font-black uppercase text-slate-400">Congestion Forecast Model</span>
              <div className="flex justify-between">
                <span>Predicted Volume Index:</span>
                <span className="text-amber-500">{congestionResult.congestion_score}%</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[8px] uppercase text-slate-400 mb-1">Forecast Hotspots</span>
                {congestionResult.predicted_hotspots.map((hot: string) => (
                  <p key={hot} className="text-slate-900 dark:text-slate-350">• {hot}</p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Center Column (5 cols) - Map Canvas */}
        <div className="xl:col-span-5">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Emergency Route Map Overlay</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-xl aspect-square relative max-w-[400px] mx-auto w-full border border-slate-150 dark:border-slate-800">
              <svg className="w-full h-full p-4 text-slate-300 dark:text-slate-800" viewBox="0 0 160 160">
                {/* Draw Road Connections */}
                {Object.entries(NODE_MAP).map(([name, coords]) => {
                  return (
                    <g key={`lines-${name}`}>
                      {name === "Sangamwadi" && (
                        <>
                          <line x1={coords.x} y1={coords.y} x2={NODE_MAP["Yerawada"].x} y2={NODE_MAP["Yerawada"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                          <line x1={coords.x} y1={coords.y} x2={NODE_MAP["Shivajinagar"].x} y2={NODE_MAP["Shivajinagar"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                        </>
                      )}
                      {name === "Yerawada" && (
                        <line x1={coords.x} y1={coords.y} x2={NODE_MAP["KalyaniNagar"].x} y2={NODE_MAP["KalyaniNagar"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                      )}
                      {name === "KalyaniNagar" && (
                        <line x1={coords.x} y1={coords.y} x2={NODE_MAP["Hadapsar"].x} y2={NODE_MAP["Hadapsar"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                      )}
                      {name === "Shivajinagar" && (
                        <line x1={coords.x} y1={coords.y} x2={NODE_MAP["Aundh"].x} y2={NODE_MAP["Aundh"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                      )}
                      {name === "Aundh" && (
                        <line x1={coords.x} y1={coords.y} x2={NODE_MAP["Baner"].x} y2={NODE_MAP["Baner"].y} className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.5]" />
                      )}
                    </g>
                  );
                })}

                {/* Draw Solver Path if generated */}
                {routingResult && routingResult.fastest_route && routingResult.fastest_route.map((node: string, idx: number) => {
                  if (idx === 0) return null;
                  const prev = NODE_MAP[routingResult.fastest_route[idx - 1]];
                  const curr = NODE_MAP[node];
                  if (!prev || !curr) return null;
                  return (
                    <line 
                      key={`path-${idx}`}
                      x1={prev.x} y1={prev.y} x2={curr.x} y2={curr.y} 
                      className="stroke-emerald-500 stroke-[3.5] stroke-linecap-round stroke-linejoin-round"
                    />
                  );
                })}

                {/* Draw Map Nodes */}
                {Object.entries(NODE_MAP).map(([name, coords]) => {
                  const isBlocked = floodZones.includes(name);
                  const isStart = startNode === name;
                  const isEnd = endNode === name;
                  return (
                    <g key={name}>
                      <circle 
                        cx={coords.x} cy={coords.y} r="5" 
                        className={cn(
                          "stroke-white dark:stroke-slate-900 stroke-[1.5]",
                          isBlocked ? "fill-red-650" : isStart ? "fill-blue-500" : isEnd ? "fill-emerald-500" : "fill-slate-400 dark:fill-slate-700"
                        )} 
                      />
                      <text 
                        x={coords.x} y={coords.y - 7} 
                        textAnchor="middle" 
                        className="fill-slate-500 dark:fill-slate-400 text-[5px] font-black uppercase"
                      >
                        {name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (3 cols) - Outcomes */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Route Solver Outputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              {routingResult ? (
                <div className="space-y-4 w-full text-xs font-bold">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Estimated Ambulance ETA</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450 font-mono">
                        {routingResult.eta_minutes} Mins
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400">Total Path Distance</span>
                      <span className="text-base font-black text-[#4682B4] font-mono">
                        {routingResult.dijkstra_distance_km || routingResult.astar_distance_km} Km
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-[#070D1A]/50 border border-slate-150 dark:border-slate-800 rounded-lg space-y-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400">Solver Path Output</span>
                    <p className="text-slate-700 dark:text-slate-300 truncate font-mono">
                      {routingResult.fastest_route ? routingResult.fastest_route.join(" ➔ ") : 'Computing...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Select start/end parameters to run Solver pathfinders.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
