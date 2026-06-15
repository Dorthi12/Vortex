// app/(dashboard)/dams/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, RefreshCw, Compass, ShieldAlert, ShieldCheck, Waves, Droplet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface DamTelemetry {
  id: string;
  name: string;
  waterLevelM: number;
  maxLevelM: number;
  capacityBillionL: number;
  maxCapacityBillionL: number;
  inflowCusecs: number;
  outflowCusecs: number;
  spillwayStatus: 'closed' | 'open_25' | 'open_50' | 'open_100';
}

const INITIAL_DAM: DamTelemetry = {
  id: 'dam-1',
  name: 'Khadakwasla Reservoir Spillway',
  waterLevelM: 78.5,
  maxLevelM: 100.0,
  capacityBillionL: 1.54,
  maxCapacityBillionL: 1.97,
  inflowCusecs: 14500,
  outflowCusecs: 11000,
  spillwayStatus: 'open_25'
};

export default function DamsDashboard() {
  const [dam, setDam] = useState<DamTelemetry>(INITIAL_DAM);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // Inflow slider state
  const [inflowInput, setInflowInput] = useState<number>(14500);

  useEffect(() => {
    runDamForecast();
  }, [inflowInput]);

  const runDamForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch('/api/infra/dam-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          water_level_meters: dam.waterLevelM,
          reservoir_capacity_percent: (dam.capacityBillionL / dam.maxCapacityBillionL) * 100,
          inflow_cusecs: inflowInput,
          outflow_cusecs: dam.outflowCusecs
        })
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      // Fallback
      setForecastResult({
        forecast_24h_meters: dam.waterLevelM + (inflowInput - dam.outflowCusecs) * 0.0001,
        forecast_48h_meters: dam.waterLevelM + (inflowInput - dam.outflowCusecs) * 0.0002,
        forecast_72h_meters: dam.waterLevelM + (inflowInput - dam.outflowCusecs) * 0.0003,
        risk_state: inflowInput > 30000 ? "critical" : inflowInput > 20000 ? "watch" : "safe"
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  // Rule-based Reservoir Optimization calculations
  const optimization = React.useMemo(() => {
    const netFlow = inflowInput - dam.outflowCusecs;
    const currentPercent = (dam.capacityBillionL / dam.maxCapacityBillionL) * 100;
    
    let releaseRecommendation = "Maintain current outflow level.";
    let irrigationAllocation = "Optimal allocation (100% standard flow)";
    let efficiency = 94.2;

    if (currentPercent > 90 && netFlow > 0) {
      releaseRecommendation = "Critical. Open spillway gates to 75% to release excess water.";
      irrigationAllocation = "Increase allocation (Surplus diversion active)";
      efficiency = 88.0;
    } else if (currentPercent < 50) {
      releaseRecommendation = "Restrict outflow to preserve water table.";
      irrigationAllocation = "Rationing active (Reduce by 30%)";
      efficiency = 76.5;
    } else if (inflowInput > 25000) {
      releaseRecommendation = "Pre-emptive discharge recommended. Open gates to 50% ahead of rain peak.";
      irrigationAllocation = "Optimal flow maintained";
      efficiency = 91.5;
    }

    return {
      releaseRecommendation,
      irrigationAllocation,
      efficiency,
      netFlow
    };
  }, [inflowInput, dam]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 3</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dam & Hydrology Intelligence</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Live Telemetry Metrics */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Reservoir Live Telemetry</CardTitle>
              <CardDescription className="text-xs">Real-time capacity sensors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">Water Level:</span>
                  <span className="font-mono font-black text-base text-[#4682B4]">{dam.waterLevelM} m / {dam.maxLevelM}m</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4682B4]" style={{ width: `${dam.waterLevelM}%` }} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">Reservoir Capacity:</span>
                  <span className="font-mono font-black text-base text-[#4682B4]">
                    {dam.capacityBillionL} / {dam.maxCapacityBillionL} TMC
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(dam.capacityBillionL / dam.maxCapacityBillionL) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-center font-bold">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded">
                  <span className="block text-[8px] text-slate-400 uppercase">Outflow</span>
                  <span className="text-slate-950 dark:text-white font-mono text-sm">{dam.outflowCusecs.toLocaleString()} Cusecs</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded">
                  <span className="block text-[8px] text-slate-400 uppercase">Gates Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs uppercase">{dam.spillwayStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Hydro Forecasting */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Flood Risk Forecasting</CardTitle>
              <CardDescription className="text-xs">Adjust inflow rates to test predictive risk models.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Live Inflow Telemetry</span>
                  <span className="font-mono font-black">{inflowInput.toLocaleString()} Cusecs</span>
                </div>
                <input 
                  type="range" min="5000" max="60000" step="500" value={inflowInput} 
                  onChange={(e) => setInflowInput(parseInt(e.target.value))}
                  className="w-full accent-[#4682B4]"
                />
              </div>

              {forecastResult && (
                <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                      <span className="block text-[8px] uppercase text-slate-400">24h Forecast</span>
                      <span className="block font-black text-sm text-[#4682B4]">{forecastResult.forecast_24h_meters.toFixed(2)}m</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                      <span className="block text-[8px] uppercase text-slate-400">48h Forecast</span>
                      <span className="block font-black text-sm text-[#4682B4]">{forecastResult.forecast_48h_meters.toFixed(2)}m</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                      <span className="block text-[8px] uppercase text-slate-400">72h Forecast</span>
                      <span className="block font-black text-sm text-[#4682B4]">{forecastResult.forecast_72h_meters.toFixed(2)}m</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-450">Inflow Risk Status:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] uppercase font-black border",
                      forecastResult.risk_state === 'critical' ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" :
                      forecastResult.risk_state === 'watch' ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" :
                      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                    )}>
                      {forecastResult.risk_state}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Reservoir Optimization (Rule-Based) */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Reservoir Release Optimizer</CardTitle>
              <CardDescription className="text-xs">Rule Engine allocations and efficiency indexing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450 font-bold">Storage Efficiency Index:</span>
                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{optimization.efficiency}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${optimization.efficiency}%` }} />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                  <span className="block text-[8px] font-black uppercase text-slate-400 mb-1">Gate Release Recommendation</span>
                  <p className="font-bold text-slate-700 dark:text-slate-350">{optimization.releaseRecommendation}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg">
                  <span className="block text-[8px] font-black uppercase text-slate-400 mb-1">Irrigation Supply Allocation</span>
                  <p className="font-bold text-slate-700 dark:text-slate-350">{optimization.irrigationAllocation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
