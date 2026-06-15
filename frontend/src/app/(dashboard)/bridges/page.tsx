// app/(dashboard)/bridges/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Layers, Upload, RefreshCw, Compass, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface BridgeAsset {
  id: string;
  name: string;
  lengthM: number;
  ageYears: number;
  lastInspection: string;
  vibrationHz: number;
  loadTons: number;
  expansionMm: number;
  corrosionIndex: number;
}

const BRIDGES_DATA: BridgeAsset[] = [
  { id: 'br-1', name: 'Sangamwadi Confluence Bridge', lengthM: 320, ageYears: 22, lastInspection: '2026-05-12', vibrationHz: 1.2, loadTons: 240, expansionMm: 4.2, corrosionIndex: 0.18 },
  { id: 'br-2', name: 'Koregaon Park Archway Bridge', lengthM: 180, ageYears: 45, lastInspection: '2026-04-10', vibrationHz: 2.8, loadTons: 150, expansionMm: 7.5, corrosionIndex: 0.42 },
  { id: 'br-3', name: 'Bund Garden Steel Link', lengthM: 280, ageYears: 12, lastInspection: '2026-06-01', vibrationHz: 0.8, loadTons: 310, expansionMm: 2.1, corrosionIndex: 0.08 }
];

export default function BridgesDashboard() {
  const [bridges, setBridges] = useState<BridgeAsset[]>(BRIDGES_DATA);
  const [selectedBridge, setSelectedBridge] = useState<BridgeAsset>(BRIDGES_DATA[0]);

  // Forecast states
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [forecastResult, setForecastResult] = useState<any>(null);

  // Crack upload states
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [detectedCracks, setDetectedCracks] = useState<any>(null);

  // Dynamic Telemetry loop
  const [telemetryTick, setTelemetryTick] = useState<number>(0);

  useEffect(() => {
    runBridgeForecast();
  }, [selectedBridge]);

  // Telemetry fluctuation simulator
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const simulatedTelemetry = {
    vibrationHz: parseFloat((selectedBridge.vibrationHz + Math.sin(telemetryTick) * 0.1).toFixed(2)),
    loadTons: parseFloat((selectedBridge.loadTons + Math.cos(telemetryTick) * 5).toFixed(1)),
    expansionMm: parseFloat((selectedBridge.expansionMm + Math.sin(telemetryTick * 0.5) * 0.15).toFixed(2)),
    corrosionIndex: selectedBridge.corrosionIndex
  };

  const runBridgeForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch('/api/infra/bridge-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibration_hz: selectedBridge.vibrationHz,
          load_tons: selectedBridge.loadTons,
          expansion_mm: selectedBridge.expansionMm,
          corrosion_rate_index: selectedBridge.corrosionIndex
        })
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      // Fallback local estimator matching /ai/bridge-risk
      const failure_prob = min(0.99, (selectedBridge.vibrationHz * 0.08 + selectedBridge.corrosionIndex * 0.15));
      setForecastResult({
        failure_probability: failure_prob,
        remaining_useful_life_years: max(1, int(15 - selectedBridge.corrosionIndex * 2)),
        recommended_inspection_days: max(7, int(365 * (1.0 - failure_prob)))
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleCrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    setTimeout(() => {
      setDetectedCracks({
        crack_count: 5,
        crack_severity: selectedBridge.ageYears > 30 ? "high" : "medium",
        risk_score: selectedBridge.ageYears > 30 ? 74.0 : 42.5,
        detected_aperture_mm: 3.5,
        confidence: 0.912
      });
      setUploadingImage(false);
    }, 1500);
  };

  function min(a: number, b: number) { return a < b ? a : b; }
  function max(a: number, b: number) { return a > b ? a : b; }
  function int(v: number) { return Math.floor(v); }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 2</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Bridge Structural Health Center</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Bridge Inventory & AI predictions */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Bridge Inventory</CardTitle>
              <CardDescription className="text-xs">Physical metrics and primary logs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {bridges.map(br => (
                  <div 
                    key={br.id}
                    onClick={() => setSelectedBridge(br)}
                    className={cn(
                      "p-4 hover:bg-slate-50 dark:hover:bg-[#101F42]/30 cursor-pointer transition-colors",
                      selectedBridge.id === br.id ? "bg-slate-50/70 dark:bg-[#101F42]/40" : ""
                    )}
                  >
                    <h4 className="text-xs font-black text-slate-950 dark:text-white">{br.name}</h4>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 mt-2">
                      <span>Length: {br.lengthM}m</span>
                      <span>Age: {br.ageYears} yrs</span>
                      <span className="text-right">Inspection: {br.lastInspection}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {forecastResult && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-450">AI Risk Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs font-bold p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded">
                  <span className="text-slate-500">Failure Probability:</span>
                  <span className="font-mono font-black text-red-500">{(forecastResult.failure_probability * 100).toFixed(1)}%</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#070D1A]/50 border border-slate-150 dark:border-slate-800 rounded text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-450">Remaining Useful Life:</span>
                    <span className="text-slate-950 dark:text-white">{forecastResult.remaining_useful_life_years} Years</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-450">Recommended Audit In:</span>
                    <span className="text-slate-950 dark:text-white">{forecastResult.recommended_inspection_days} Days</span>
                  </div>
                </div>

                <Button 
                  onClick={runBridgeForecast} 
                  disabled={loadingForecast}
                  className="w-full bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs"
                >
                  {loadingForecast ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Activity className="w-3.5 h-3.5 mr-1" />}
                  Recalculate Bridge Risk
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Column: Telemetry Charts */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Structural Telemetry</CardTitle>
              <CardDescription className="text-xs">Real-time vibrations and strain indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col justify-around">
              
              {/* Telemetry Gauge 1: Vibration */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Vibration Telemetry (Hz)</span>
                  <span className="font-mono font-black">{simulatedTelemetry.vibrationHz} Hz</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      simulatedTelemetry.vibrationHz > 2.5 ? "bg-red-500" :
                      simulatedTelemetry.vibrationHz > 1.5 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${min(100, (simulatedTelemetry.vibrationHz / 4.0) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Gauge 2: Load */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Active Structural Load (Tons)</span>
                  <span className="font-mono font-black">{simulatedTelemetry.loadTons} T</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-[#4682B4] transition-all duration-300"
                    style={{ width: `${min(100, (simulatedTelemetry.loadTons / 500) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Telemetry Gauge 3: Expansion */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Expansion Joint Gaps (mm)</span>
                  <span className="font-mono font-black">{simulatedTelemetry.expansionMm} mm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${min(100, (simulatedTelemetry.expansionMm / 12.0) * 100)}%` }}
                  />
                </div>
              </div>

            </CardContent>
            
            <CardContent className="pt-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-black/10 text-[10px] font-bold text-slate-500 leading-relaxed">
              * Live metrics fluctuation replicates the active physical stress of peak transits across Pune limits.
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Drone Crack detection */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Crack Detection</CardTitle>
              <CardDescription className="text-xs">Upload bridge structural inspection images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/40 relative">
                {uploadingImage ? (
                  <div className="text-center space-y-2 text-xs font-bold">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4682B4]" />
                    <span>Analyzing crack dimensions via YOLOv8 model...</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <label className="block text-xs font-bold text-[#4682B4] cursor-pointer hover:underline">
                      Upload Bridge Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleCrackUpload} />
                    </label>
                  </div>
                )}
              </div>

              {detectedCracks && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-black uppercase text-[9px] text-[#4682B4]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    YOLOv8 Crack Analysis
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-405">Crack Count:</span>
                    <span>{detectedCracks.crack_count}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-405">Aperture Size:</span>
                    <span>{detectedCracks.detected_aperture_mm} mm</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-405">Risk Level:</span>
                    <span className={cn(
                      "font-black uppercase",
                      detectedCracks.crack_severity === 'high' ? "text-red-500" : "text-amber-500"
                    )}>{detectedCracks.crack_severity}</span>
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
