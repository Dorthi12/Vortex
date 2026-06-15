// app/(dashboard)/grids/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, RefreshCw, Zap, ShieldAlert, ShieldCheck, Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface TransformerNode {
  id: string;
  substation: string;
  loadMva: number;
  capacityMva: number;
  feederLine: string;
  activeTransformers: number;
}

const TRANSFORMERS_DATA: TransformerNode[] = [
  { id: 'tx-201', substation: 'Hadapsar Heavy Grid Node 1', loadMva: 68.4, capacityMva: 90.0, feederLine: 'FDR-Zone-3A', activeTransformers: 4 },
  { id: 'tx-202', substation: 'Shivajinagar Civic Command Grid', loadMva: 52.0, capacityMva: 80.0, feederLine: 'FDR-Zone-1B', activeTransformers: 3 },
  { id: 'tx-203', substation: 'Kothrud Substation Node 4', loadMva: 84.5, capacityMva: 100.0, feederLine: 'FDR-Zone-5C', activeTransformers: 5 }
];

export default function GridsDashboard() {
  const [nodes, setNodes] = useState<TransformerNode[]>(TRANSFORMERS_DATA);
  const [selectedNode, setSelectedNode] = useState<TransformerNode>(TRANSFORMERS_DATA[0]);

  // Model states
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [forecastResult, setForecastResult] = useState<any>(null);

  // Substation load slider
  const [activeLoad, setActiveLoad] = useState<number>(68.4);

  useEffect(() => {
    runGridForecast();
  }, [selectedNode, activeLoad]);

  const runGridForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch('/api/infra/grid-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformer_id: selectedNode.id,
          substation_load_mva: activeLoad,
          peak_load_mva: selectedNode.capacityMva
        })
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      // Fallback matching model_loader.py
      const risk = (activeLoad / selectedNode.capacityMva) ** 2;
      setForecastResult({
        demand_24h_mva: activeLoad * 1.05,
        weekly_demand_avg_mva: activeLoad * 0.98,
        peak_load_estimate_mva: selectedNode.capacityMva * 1.12,
        outage_risk: {
          risk_percent: risk * 100,
          likely_cause: risk > 0.8 ? "Transformer Thermal Overload" : "Vegetation Intrusion / Transient fault",
          impact_radius_km: risk * 4.5
        }
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 4</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Smart Power Grid Operations Center</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Transformer Substation Registry */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Substation Inventory</CardTitle>
              <CardDescription className="text-xs">Feeder distribution nodes and capacities.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {nodes.map(node => (
                  <div 
                    key={node.id}
                    onClick={() => {
                      setSelectedNode(node);
                      setActiveLoad(node.loadMva);
                    }}
                    className={cn(
                      "p-4 hover:bg-slate-50 dark:hover:bg-[#101F42]/30 cursor-pointer transition-colors",
                      selectedNode.id === node.id ? "bg-slate-50/70 dark:bg-[#101F42]/40" : ""
                    )}
                  >
                    <h4 className="text-xs font-black text-slate-950 dark:text-white">{node.substation}</h4>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 mt-2">
                      <span>Feeder: {node.feederLine}</span>
                      <span>Transformers: {node.activeTransformers}</span>
                      <span className="text-right font-mono">Load: {node.loadMva} MVA</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Load Simulator & Demand Forecast */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Active Demand Telemetry</CardTitle>
                <CardDescription className="text-xs">Adjust active substation load to calculate demand forecasts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Active Load (MVA)</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-450">{activeLoad} MVA</span>
                  </div>
                  <input 
                    type="range" min="10" max={selectedNode.capacityMva * 1.2} step="1" value={activeLoad} 
                    onChange={(e) => setActiveLoad(parseFloat(e.target.value))}
                    className="w-full accent-[#4682B4]"
                  />
                </div>

                {forecastResult && (
                  <div className="space-y-3.5 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-450">Demand Predictions</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                        <span className="block text-[8px] uppercase text-slate-400">24h Peak</span>
                        <span className="block font-black text-xs text-[#4682B4]">{forecastResult.demand_24h_mva.toFixed(1)} MVA</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                        <span className="block text-[8px] uppercase text-slate-400">Weekly Avg</span>
                        <span className="block font-black text-xs text-[#4682B4]">{forecastResult.weekly_demand_avg_mva.toFixed(1)} MVA</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                        <span className="block text-[8px] uppercase text-slate-400">Peak Cap.</span>
                        <span className="block font-black text-xs text-red-500">{forecastResult.peak_load_estimate_mva.toFixed(1)} MVA</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
            
            <CardContent className="pt-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-black/10 text-[10px] font-bold text-slate-500 leading-relaxed flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              SCADA systems actively balancing feeder loads to mitigate thermal grid degradation.
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Outage Risk Predictions */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Predictive Outage Intelligence</CardTitle>
              <CardDescription className="text-xs">Model outputs predicting feeder node failure points.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
              {forecastResult && forecastResult.outage_risk && (
                <div className="space-y-4 w-full">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3 text-center">
                    <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Outage Probability Risk</span>
                    <span className={cn(
                      "text-3xl font-black block font-mono",
                      forecastResult.outage_risk.risk_percent > 75 ? "text-red-500" :
                      forecastResult.outage_risk.risk_percent > 35 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {forecastResult.outage_risk.risk_percent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-405">Likely Fault Cause:</span>
                      <span className="text-slate-950 dark:text-white text-right truncate max-w-[150px]">{forecastResult.outage_risk.likely_cause}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-405">Impact Grid Radius:</span>
                      <span className="text-slate-950 dark:text-white">{forecastResult.outage_risk.impact_radius_km.toFixed(2)} Km</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
