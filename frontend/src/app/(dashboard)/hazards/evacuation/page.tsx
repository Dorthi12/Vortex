'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Navigation, RefreshCw, ShieldAlert, CheckCircle2,
  AlertTriangle, MapPin, Clock, Route, Home, ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHazardStore } from '@/store/useHazardStore';

const ROAD_OPTIONS = [
  'NH-48 Junction (Flooded)',
  'Swargate Bridge (Damaged)',
  'Deccan Gymkhana Road (Debris)',
  'University Road (Waterlogged)',
  'Kothrud Main Road (Blocked)',
];

const HAZARD_ZONES = [
  'Pune East (Critical Flood Zone)',
  'Katraj Hills (Landslide Zone)',
  'Mula-Mutha Floodplain',
];

export default function EvacuationPage() {
  const store = useHazardStore();
  const [localSource, setLocalSource] = useState(store.evacuationInput.source);
  const [localDest, setLocalDest] = useState(store.evacuationInput.destination);
  const [blockedRoads, setBlockedRoads] = useState<string[]>([]);
  const [hazardZones, setHazardZones] = useState<string[]>([]);

  const toggleRoad = (road: string) => {
    setBlockedRoads(prev =>
      prev.includes(road) ? prev.filter(r => r !== road) : [...prev, road]
    );
  };

  const toggleHazard = (zone: string) => {
    setHazardZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const handleCompute = () => {
    store.setEvacuationInput('source', localSource);
    store.setEvacuationInput('destination', localDest);
    store.setEvacuationInput('blockedRoads', blockedRoads);
    store.setEvacuationInput('hazardZones', hazardZones);
    store.runEvacuationRoute();
  };

  const result = store.evacuationResult;
  const loading = store.evacuationLoading;

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSafetyBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/hazards">
              <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            </Link>
            <span className="text-xs font-black uppercase tracking-widest text-blue-500 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              MODULE 06
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Evacuation Route Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dijkstra + A* algorithm computes safest evacuation corridors around flooded roads and hazard zones.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1A2744]">
          <Route className="w-4 h-4 text-blue-500" />
          Dijkstra + A* Algorithm
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Inputs */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-500" />
                Route Parameters
              </CardTitle>
              <CardDescription className="text-xs">Define start point and safe destination shelter.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">

              {/* Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Origin Point
                </label>
                <input
                  type="text"
                  value={localSource}
                  onChange={e => setLocalSource(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-slate-200 dark:border-[#1A2744] bg-slate-50 dark:bg-[#070D1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Pune Cantonment"
                />
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-500" />
                  Destination / Shelter
                </label>
                <input
                  type="text"
                  value={localDest}
                  onChange={e => setLocalDest(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-md border border-slate-200 dark:border-[#1A2744] bg-slate-50 dark:bg-[#070D1A] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Magarpatta Shelter"
                />
              </div>

              {/* Blocked Roads */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Road Blockages
                </span>
                <div className="space-y-2">
                  {ROAD_OPTIONS.map(road => (
                    <label key={road} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={blockedRoads.includes(road)}
                        onChange={() => toggleRoad(road)}
                        className="accent-red-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-red-500 transition-colors">{road}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hazard Zones */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Active Hazard Zones
                </span>
                <div className="space-y-2">
                  {HAZARD_ZONES.map(zone => (
                    <label key={zone} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={hazardZones.includes(zone)}
                        onChange={() => toggleHazard(zone)}
                        className="accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-orange-500 transition-colors">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCompute}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-10 text-xs font-bold cursor-pointer"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Computing Route...</>
                ) : (
                  <><Route className="w-4 h-4" /> Compute Safest Route</>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-5"
              >

                {/* SVG Route Visualization */}
                <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-blue-500" />
                      Safest Evacuation Corridor
                    </CardTitle>
                    <CardDescription className="text-xs">Green solid route = recommended. Blue dashed = alternative path.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="bg-slate-50 dark:bg-[#070D1A] rounded-xl border border-slate-100 dark:border-[#1A2744] p-4">
                      <svg className="w-full" height="120" viewBox="0 0 600 120">
                        {/* Background grid */}
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <line key={i} x1={i * 100} y1="0" x2={i * 100} y2="120" stroke="#1A2744" strokeWidth="0.5" strokeDasharray="4,4" />
                        ))}

                        {/* Alternative route (blue dashed) */}
                        <path d="M 40 90 Q 180 20 300 70 Q 420 110 560 90" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="8,5" opacity="0.6" />

                        {/* Main green route */}
                        <path d="M 40 90 L 180 90 L 300 55 L 420 55 L 560 55" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Nodes */}
                        {[
                          { x: 40, y: 90, label: result.safestRoute.path[0] ?? 'Origin', color: '#ef4444' },
                          { x: 180, y: 90, label: result.safestRoute.path[1] ?? 'Waypoint 1', color: '#f59e0b' },
                          { x: 300, y: 55, label: result.safestRoute.path[2] ?? 'Waypoint 2', color: '#f59e0b' },
                          { x: 420, y: 55, label: result.safestRoute.path[3] ?? 'Checkpoint', color: '#f59e0b' },
                          { x: 560, y: 55, label: 'SHELTER', color: '#10b981' },
                        ].map((node, i) => (
                          <g key={i}>
                            <circle cx={node.x} cy={node.y} r="8" fill={node.color} opacity="0.9" />
                            <circle cx={node.x} cy={node.y} r="4" fill="white" />
                            <text x={node.x} y={node.y + 20} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                              {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
                            </text>
                          </g>
                        ))}

                        {/* Shelter house icon at end */}
                        <polygon points="555,38 560,32 565,38" fill="#10b981" />
                        <rect x="557" y="38" width="6" height="6" fill="#10b981" />

                        {/* Blocked road X markers */}
                        {blockedRoads.length > 0 && (
                          <g>
                            <line x1="240" y1="85" x2="255" y2="100" stroke="#ef4444" strokeWidth="2.5" />
                            <line x1="255" y1="85" x2="240" y2="100" stroke="#ef4444" strokeWidth="2.5" />
                            <text x="248" y="112" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">BLOCKED</text>
                          </g>
                        )}

                        {/* Legend */}
                        <g transform="translate(10, 10)">
                          <line x1="0" y1="5" x2="20" y2="5" stroke="#10b981" strokeWidth="2.5" />
                          <text x="24" y="8" fill="#94a3b8" fontSize="8">Safe Route</text>
                          <line x1="0" y1="18" x2="20" y2="18" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,3" />
                          <text x="24" y="21" fill="#94a3b8" fontSize="8">Alternative</text>
                        </g>
                      </svg>

                      {/* Route details below SVG */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Distance</span>
                          <span className="text-sm font-black text-blue-500">{result.safestRoute.distanceKm.toFixed(1)} km</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">ETA</span>
                          <span className="text-sm font-black text-emerald-500">{Math.round(result.safestRoute.travelTimeMinutes)} min</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Safety Score</span>
                          <span className={cn('text-sm font-black', getSafetyColor(result.safestRoute.safetyScore))}>
                            {result.safestRoute.safetyScore}/100
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', getSafetyBg(result.safestRoute.safetyScore))}
                          style={{ width: `${result.safestRoute.safetyScore}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Route Comparison Table */}
                <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">Available Routes</CardTitle>
                      <CardDescription className="text-xs">All computed paths sorted by safety score.</CardDescription>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-blue-500/30 text-blue-500 bg-blue-500/10">
                      {result.algorithm}
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#1A2744] text-slate-400 uppercase text-[9px] font-black tracking-wider">
                          <th className="py-2 text-left">Route</th>
                          <th className="py-2 text-center">Distance</th>
                          <th className="py-2 text-center">ETA</th>
                          <th className="py-2 text-center">Safety</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {result.safestRoute.path.join(' → ').slice(0, 40)}…
                          </td>
                          <td className="py-2.5 text-center text-slate-500">{result.safestRoute.distanceKm.toFixed(1)} km</td>
                          <td className="py-2.5 text-center text-slate-500 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />{Math.round(result.safestRoute.travelTimeMinutes)} min
                          </td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1">
                              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.safestRoute.safetyScore}%` }} />
                              </div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.safestRoute.safetyScore}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              RECOMMENDED
                            </span>
                          </td>
                        </tr>
                        {result.alternativeRoutes.map((route, i) => (
                          <tr key={i}>
                            <td className="py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                              Alternative Route {i + 2}
                            </td>
                            <td className="py-2.5 text-center text-slate-500">{(route.distanceKm).toFixed(1)} km</td>
                            <td className="py-2.5 text-center text-slate-500 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />{Math.round(route.travelTimeMinutes)} min
                            </td>
                            <td className="py-2.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full', getSafetyBg(route.safetyScore))} style={{ width: `${route.safetyScore}%` }} />
                                </div>
                                <span className={cn('font-bold', getSafetyColor(route.safetyScore))}>{route.safetyScore}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                ALTERNATIVE
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Recommended Shelters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.recommendedShelters.map((shelter, i) => {
                    const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
                    const isFull = pct >= 100;
                    return (
                      <Card key={i} className={cn(
                        'bg-white dark:bg-[#0A1228] border',
                        isFull ? 'border-red-500/30' : 'border-slate-200 dark:border-[#1A2744]'
                      )}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{shelter.name}</span>
                            <span className={cn(
                              'text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0',
                              isFull ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            )}>
                              {isFull ? 'FULL' : 'OPEN'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3" /> {shelter.distance}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Occupancy</span>
                              <span className={isFull ? 'text-red-500' : 'text-emerald-500'}>{shelter.occupancy}/{shelter.capacity}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', isFull ? 'bg-red-500' : 'bg-emerald-500')}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Government Advisory */}
                <Card className="border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-orange-500 block mb-0.5">Government Advisory</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        All residents in flood-risk zones should evacuate immediately via the recommended GREEN corridor.
                        Avoid NH-48 and Swargate Bridge which are currently inundated. Proceed to nearest open shelter.
                        Emergency helpline: <span className="font-black text-orange-500">1078</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full border-2 border-dashed border-slate-200 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-10 py-24 bg-slate-50/20 dark:bg-[#0A1228]/10"
              >
                <Navigation className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">No Route Computed</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Enter your origin point and destination shelter, mark any blocked roads, then click "Compute Safest Route".
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
