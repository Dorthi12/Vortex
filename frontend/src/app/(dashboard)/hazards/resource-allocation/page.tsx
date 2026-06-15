'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Package, Truck, RefreshCw, ShieldAlert,
  AlertTriangle, Droplets, Heart, CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useHazardStore } from '@/store/useHazardStore';

const HEATMAP_COLORS = [
  '#ef4444','#ef4444','#f97316','#ef4444','#f97316','#ef4444','#22c55e','#6b7280',
  '#f97316','#ef4444','#22c55e','#f59e0b','#ef4444','#f97316','#6b7280','#22c55e',
  '#22c55e','#f97316','#f59e0b','#22c55e','#6b7280','#ef4444','#f97316','#22c55e',
  '#6b7280','#22c55e','#f59e0b','#ef4444','#22c55e','#6b7280','#f97316','#6b7280',
];

export default function ResourceAllocationPage() {
  const store = useHazardStore();
  const { resourceInput, resourceResult, resourceLoading } = store;

  const getPriorityColor = (p: string) => {
    if (p === 'CRITICAL') return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
    if (p === 'HIGH') return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    if (p === 'MEDIUM') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-slate-200/50 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
  };

  const getPriorityScoreColor = (score: number) => {
    if (score >= 75) return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
    if (score >= 50) return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500' };
    if (score >= 25) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
    return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
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
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              MODULE 07
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Relief Resource Allocation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated deployment planning based on affected population, threat level, shelter occupancy and inventory.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#1A2744]">
          <Truck className="w-4 h-4 text-emerald-500" />
          Deterministic Rule Engine
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Inputs */}
        <div className="lg:col-span-4">
          <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-500" />
                Allocation Parameters
              </CardTitle>
              <CardDescription className="text-xs">Configure population and resource inputs.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">

              {/* Population */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label>Affected Population</label>
                  <span className="text-emerald-600 dark:text-emerald-400">{resourceInput.population.toLocaleString()}</span>
                </div>
                <input type="range" min="1000" max="500000" step="1000" value={resourceInput.population}
                  onChange={e => store.setResourceInput('population', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500" />
              </div>

              {/* Threat Level */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label>Threat Level</label>
                  <span className={cn(resourceInput.threatLevel >= 8 ? 'text-red-500' : resourceInput.threatLevel >= 6 ? 'text-orange-500' : 'text-amber-500')}>
                    {resourceInput.threatLevel}/10
                  </span>
                </div>
                <input type="range" min="1" max="10" step="0.5" value={resourceInput.threatLevel}
                  onChange={e => store.setResourceInput('threatLevel', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-500" />
              </div>

              {/* Shelter Occupancy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label>Shelter Occupancy</label>
                  <span className={cn(resourceInput.shelterOccupancy >= 90 ? 'text-red-500' : 'text-amber-500')}>
                    {resourceInput.shelterOccupancy}%
                  </span>
                </div>
                <input type="range" min="0" max="100" step="1" value={resourceInput.shelterOccupancy}
                  onChange={e => store.setResourceInput('shelterOccupancy', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500" />
              </div>

              <div className="border-t border-slate-100 dark:border-[#1A2744] pt-3">
                <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 block mb-3">Current Inventory</span>

                {/* Food */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs font-bold">
                    <label>Food Packets in Stock</label>
                    <span className="text-orange-500">{resourceInput.foodInventory.toLocaleString()}</span>
                  </div>
                  <input type="range" min="0" max="50000" step="500" value={resourceInput.foodInventory}
                    onChange={e => store.setResourceInput('foodInventory', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500" />
                </div>

                {/* Water */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs font-bold">
                    <label>Water Stock (Liters)</label>
                    <span className="text-blue-500">{resourceInput.waterInventory.toLocaleString()}</span>
                  </div>
                  <input type="range" min="0" max="500000" step="5000" value={resourceInput.waterInventory}
                    onChange={e => store.setResourceInput('waterInventory', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500" />
                </div>

                {/* Medical */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <label>Medical Kits in Stock</label>
                    <span className="text-purple-500">{resourceInput.medicalInventory}</span>
                  </div>
                  <input type="range" min="0" max="2000" step="10" value={resourceInput.medicalInventory}
                    onChange={e => store.setResourceInput('medicalInventory', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-purple-500" />
                </div>
              </div>

              <Button
                onClick={() => store.runResourceAllocation()}
                disabled={resourceLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-10 text-xs font-bold cursor-pointer"
              >
                {resourceLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Computing Plan...</>
                ) : (
                  <><Truck className="w-4 h-4" /> Compute Allocation Plan</>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {resourceResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-5"
              >

                {/* Priority Score */}
                {(() => {
                  const colors = getPriorityScoreColor(resourceResult.priorityScore);
                  return (
                    <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
                      <CardContent className="p-5 flex items-center gap-6">
                        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                            <circle cx="50" cy="50" r="40" fill="none"
                              className={cn('transition-all duration-700', resourceResult.priorityScore >= 75 ? 'stroke-red-500' : resourceResult.priorityScore >= 50 ? 'stroke-orange-500' : 'stroke-amber-500')}
                              strokeWidth="10"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 - (251.2 * resourceResult.priorityScore) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className={cn('text-xl font-black', colors.text)}>{Math.round(resourceResult.priorityScore)}</span>
                            <span className="text-[8px] text-slate-400 font-bold">/100</span>
                          </div>
                        </div>
                        <div>
                          <h3 className={cn('text-lg font-black', colors.text)}>Deployment Priority Score</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Based on population × threat × occupancy factors</p>
                          <div className="mt-3 h-2 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-700', colors.bg)} style={{ width: `${resourceResult.priorityScore}%` }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Resource Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Truck, label: 'Trucks Needed', value: resourceResult.trucksNeeded, unit: 'vehicles', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { icon: Package, label: 'Food Packets', value: resourceResult.foodPackets.toLocaleString(), unit: 'ration packs', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { icon: Droplets, label: 'Water Required', value: resourceResult.waterRequired.toLocaleString(), unit: 'liters', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: Heart, label: 'Medical Kits', value: resourceResult.medicinesRequired.toLocaleString(), unit: 'first-aid kits', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                  ].map((item, i) => (
                    <Card key={i} className={cn('bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]')}>
                      <CardContent className="p-4 text-center space-y-2">
                        <div className={cn('w-9 h-9 rounded-xl mx-auto flex items-center justify-center', item.bg)}>
                          <item.icon className={cn('w-4 h-4', item.color)} />
                        </div>
                        <div>
                          <span className={cn('text-lg font-black block', item.color)}>{item.value}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{item.label}</span>
                          <span className="text-[9px] text-slate-400">{item.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Critical Shortages */}
                {resourceResult.criticalShortages.length > 0 ? (
                  <Card className="border border-red-500/30 bg-red-500/5">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-500 block mb-2">Critical Shortages Detected</span>
                        <div className="flex flex-wrap gap-2">
                          {resourceResult.criticalShortages.map((s, i) => (
                            <span key={i} className="px-2 py-1 rounded text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              ⚠ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All resources within acceptable thresholds. No critical shortages detected.</span>
                    </CardContent>
                  </Card>
                )}

                {/* Deployment Plan Table */}
                <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Deployment Plan</CardTitle>
                    <CardDescription className="text-xs">Resource deployment prioritized by urgency and need.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#1A2744] text-slate-400 uppercase text-[9px] font-black tracking-wider">
                          <th className="py-2 text-left">Resource</th>
                          <th className="py-2 text-center">Quantity</th>
                          <th className="py-2 text-left">Destination</th>
                          <th className="py-2 text-right">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {resourceResult.deploymentPlan.map((item, i) => (
                          <tr key={i}>
                            <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{item.resource}</td>
                            <td className="py-2.5 text-center text-slate-600 dark:text-slate-400 font-mono">{item.quantity.toLocaleString()}</td>
                            <td className="py-2.5 text-slate-500">{item.destination}</td>
                            <td className="py-2.5 text-right">
                              <span className={cn('px-2 py-0.5 rounded text-[9px] font-black border', getPriorityColor(item.priority))}>
                                {item.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Resource Heatmap */}
                <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">District Resource Coverage Heatmap</CardTitle>
                    <CardDescription className="text-xs">Red = high need, Orange = moderate, Green = covered, Grey = not assessed.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                      {HEATMAP_COLORS.map((color, i) => (
                        <div
                          key={i}
                          title={`Zone ${i + 1}`}
                          className="aspect-square rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      {[
                        { color: '#ef4444', label: 'Critical Need' },
                        { color: '#f97316', label: 'Moderate' },
                        { color: '#22c55e', label: 'Covered' },
                        { color: '#6b7280', label: 'N/A' },
                      ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                          <span className="text-[9px] font-bold text-slate-400">{l.label}</span>
                        </div>
                      ))}
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
                <Package className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">No Allocation Plan Generated</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Configure the population, threat level, and inventory parameters then click "Compute Allocation Plan".
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
