'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gauge, Info, Activity, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function SoilHealthIntelligence() {
  const store = useAgricultureStore();

  // Highlight and run calculations on mount/change
  useEffect(() => {
    store.runSoilHealthAnalysis();
  }, [store.soilN, store.soilP, store.soilK, store.soilOC, store.soilPh, store.soilMoisture]);

  // Calculate coordinates for circular SVG dial
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (store.soilHealthScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Advisory Engines
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Soil Health Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chemical simulation and micro-nutrient diagnostics for optimal soil fertilization.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Form and Output Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Soil Telemetry Input Variables */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] shadow-xs">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-emerald-500" />
                Soil Telemetry Simulation
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Adjust mineral levels to evaluate chemical health thresholds.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-5 space-y-5">
              
              {/* Nitrogen (N) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Nitrogen (N) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilN} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={store.soilN}
                  onChange={(e) => store.setField('soilN', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Phosphorus (P) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Phosphorus (P) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilP} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={store.soilP}
                  onChange={(e) => store.setField('soilP', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Potassium (K) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Potassium (K) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilK} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={store.soilK}
                  onChange={(e) => store.setField('soilK', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Organic Carbon */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Organic Carbon (OC)</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilOC} %</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.01"
                  value={store.soilOC}
                  onChange={(e) => store.setField('soilOC', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Soil pH */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Soil pH Acidity</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilPh} pH</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="9.0"
                  step="0.1"
                  value={store.soilPh}
                  onChange={(e) => store.setField('soilPh', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Soil Moisture */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Soil Moisture</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.soilMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={store.soilMoisture}
                  onChange={(e) => store.setField('soilMoisture', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Circular SVG Gauges & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Primary Dial: Soil Health Score */}
            <Card className="md:col-span-2 bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Soil Health Score</span>
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx="50"
                    cy="50"
                    className="text-slate-100 dark:text-slate-900"
                  />
                  <circle
                    stroke="#059669"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{store.soilHealthScore}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Index Score</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-slate-450 block">Assigned Grade</span>
                <span className="text-base font-black text-emerald-600 dark:text-[#D4AF37] block mt-0.5">{store.soilGrade}</span>
              </div>
            </Card>

            {/* Quick Metrics Breakdown */}
            <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Deficit Indices</span>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center">
                  <span>Nitrogen:</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    store.soilBreakdown.n === 'Optimal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  )}>{store.soilBreakdown.n}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Phosphorus:</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    store.soilBreakdown.p === 'Optimal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  )}>{store.soilBreakdown.p}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Potassium:</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    store.soilBreakdown.k === 'Optimal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  )}>{store.soilBreakdown.k}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Organic Carbon:</span>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    store.soilBreakdown.oc === 'Optimal' || store.soilBreakdown.oc === 'High' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  )}>{store.soilBreakdown.oc}</span>
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-[#1A2744] pt-3 mt-4 text-[10px] font-bold text-slate-400">
                PH Status: {store.soilPh >= 6.0 && store.soilPh <= 7.2 ? 'Neutral (Optimal)' : store.soilPh < 6.0 ? 'Acidic' : 'Alkaline'}
              </div>
            </Card>

          </div>

          {/* Improvement Recommendations */}
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-500" />
                Soil Improvement & Restoration Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              {store.soilHealthScore < 70 ? (
                <div className="flex gap-3 items-start bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-700 dark:text-red-400">
                  <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Critical Soil Deficiency Warning: Soil indices indicate low potassium and high acidity. Broadcast gypsum at 2.5 Tons/Ha to buffer acidity and delay synthetic nitrogen addition until organic composting is complete.
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 items-start bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-700 dark:text-emerald-400">
                  <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Soil Balance is Healthy: Maintain the baseline by scheduling regular crop rotation with legumes (e.g. Soybeans/Groundnuts) to naturally support nitrogen fixation.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Biological Action Plan</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Apply Trichoderma viride bio-fungicides to bolster soil microflora activity. Mix with 5 tons of well-decomposed farmyard manure.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Chemical Correction Protocol</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    To satisfy Phosphorus and Nitrogen targets, schedule split applications of DAP at sowing, and MOP on Day 30 post-tillage.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
