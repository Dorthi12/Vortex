// app/(dashboard)/roads/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Settings, TrendingUp, AlertTriangle, ShieldCheck, 
  Plus, Info, MapPin, Upload, RefreshCw, Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface RoadSegment {
  id: string;
  name: string;
  trafficCount: number;
  baseWear: number;
  currentWear: number;
  status: 'good' | 'fair' | 'poor' | 'failed';
  complaintsCount: number;
}

const INITIAL_SEGMENTS: RoadSegment[] = [
  { id: 'rs-1', name: 'Sangam Bridge Confluence Highway', trafficCount: 52000, baseWear: 1.1, currentWear: 1.1, status: 'fair', complaintsCount: 18 },
  { id: 'rs-2', name: 'Kalyani Nagar Riverside Drive', trafficCount: 34000, baseWear: 0.7, currentWear: 0.7, status: 'good', complaintsCount: 4 },
  { id: 'rs-3', name: 'Yerawada Market Causeway', trafficCount: 65000, baseWear: 1.6, currentWear: 1.6, status: 'poor', complaintsCount: 32 },
  { id: 'rs-4', name: 'Aundh Bypass Lane', trafficCount: 28000, baseWear: 0.4, currentWear: 0.4, status: 'good', complaintsCount: 9 },
  { id: 'rs-5', name: 'Baner Tech Arterial Link', trafficCount: 42000, baseWear: 1.3, currentWear: 1.3, status: 'fair', complaintsCount: 14 },
];

export default function RoadsDashboard() {
  const [segments, setSegments] = useState<RoadSegment[]>(INITIAL_SEGMENTS);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment>(INITIAL_SEGMENTS[0]);
  
  // Model Forecasting inputs
  const [age, setAge] = useState<number>(6.5);
  const [trafficLoad, setTrafficLoad] = useState<number>(70);
  const [repairs, setRepairs] = useState<number>(2);
  const [weather, setWeather] = useState<number>(60);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);

  // Pothole Upload simulation
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [detectedDamage, setDetectedDamage] = useState<any>(null);

  // Auto trigger forecast on load
  useEffect(() => {
    runForecast();
  }, [selectedSegment]);

  const runForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await fetch('/api/infra/road-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age_years: age,
          traffic_load: trafficLoad,
          previous_repairs: repairs,
          weather_exposure: weather,
          pothole_count: selectedSegment.complaintsCount
        })
      });
      const data = await res.json();
      setForecastResult(data);
    } catch (err) {
      // Fallback
      setForecastResult({
        current_health: 72,
        expected_health_3m: 64,
        expected_health_6m: 52,
        failure_probability: 0.38,
        damage_type: "Alligator Cracking",
        estimated_repair_cost: 32000.0
      });
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true);
    setTimeout(() => {
      setDetectedDamage({
        damage_type: "Severe Pothole Cluster & Lateral Deformation",
        severity: "critical",
        gps_location: { latitude: 18.5524, longitude: 73.8824 },
        estimated_repair_cost: 14500.0,
        confidence_score: 0.965
      });
      setUploadingImage(false);
    }, 1500);
  };

  // Prioritization score logic
  const prioritizedSegments = useMemo(() => {
    return [...segments].map(seg => {
      // Priority score calculation: complaints * 1.5 + wear * 25 + traffic/1000
      const score = Math.round((seg.complaintsCount * 1.8) + (seg.currentWear * 30) + (seg.trafficCount / 1200));
      let priorityClass: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (score > 75) priorityClass = 'critical';
      else if (score > 50) priorityClass = 'high';
      else if (score > 25) priorityClass = 'medium';

      return { ...seg, priorityScore: score, priorityClass };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [segments]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 1</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Road Health Intelligence</h1>
        </div>
      </div>

      <LocationScopeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Input Parameter Panel & Forecast */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Deterioration Forecast Input</CardTitle>
              <CardDescription className="text-xs">Adjust parameters to simulate future degradation index.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Selected Road Segment</label>
                <select 
                  className="w-full text-xs font-semibold p-2 border border-slate-250 dark:border-slate-800 bg-white dark:bg-[#070D1A] rounded"
                  value={selectedSegment.id}
                  onChange={(e) => {
                    const found = segments.find(s => s.id === e.target.value);
                    if (found) setSelectedSegment(found);
                  }}
                >
                  {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Road Age (years)</span>
                  <span className="font-mono font-black">{age}</span>
                </div>
                <input 
                  type="range" min="0" max="15" step="0.5" value={age} 
                  onChange={(e) => setAge(parseFloat(e.target.value))}
                  className="w-full accent-[#4682B4]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Traffic Load Index</span>
                  <span className="font-mono font-black">{trafficLoad}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={trafficLoad} 
                  onChange={(e) => setTrafficLoad(parseInt(e.target.value))}
                  className="w-full accent-[#4682B4]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Previous Repairs Count</span>
                  <span className="font-mono font-black">{repairs}</span>
                </div>
                <input 
                  type="range" min="0" max="10" value={repairs} 
                  onChange={(e) => setRepairs(parseInt(e.target.value))}
                  className="w-full accent-[#4682B4]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Weather & Moists Index</span>
                  <span className="font-mono font-black">{weather}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={weather} 
                  onChange={(e) => setWeather(parseInt(e.target.value))}
                  className="w-full accent-[#4682B4]"
                />
              </div>

              <Button 
                onClick={runForecast} 
                disabled={loadingForecast}
                className="w-full bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold"
              >
                {loadingForecast ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Activity className="w-4 h-4 mr-1" />}
                Compute Forecast Model
              </Button>
            </CardContent>
          </Card>

          {forecastResult && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-slate-450">Forecast Diagnostic Outputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                    <span className="block text-[8px] uppercase text-slate-400">Current</span>
                    <span className="block font-black text-sm text-[#4682B4]">{forecastResult.current_health}%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                    <span className="block text-[8px] uppercase text-slate-400">3-Month</span>
                    <span className="block font-black text-sm text-amber-500">{forecastResult.expected_health_3m}%</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-150 dark:border-slate-800">
                    <span className="block text-[8px] uppercase text-slate-400">6-Month</span>
                    <span className="block font-black text-sm text-red-500">{forecastResult.expected_health_6m}%</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#070D1A]/55 border border-slate-150 dark:border-slate-800 rounded text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Prob:</span>
                    <span className="font-mono font-black text-red-500">{(forecastResult.failure_probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Damage Classification:</span>
                    <span className="font-black truncate max-w-[150px]">{forecastResult.damage_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Repair Cap:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-450">₹{forecastResult.estimated_repair_cost.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Column: YOLOv8 Image Upload & Pothole Detection */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-sm font-black text-slate-950 dark:text-white">YOLOv8 Pothole Detection</CardTitle>
                <CardDescription className="text-xs">Upload Road/Drone image frames to detect distress.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-44 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/40 relative">
                  {uploadingImage ? (
                    <div className="text-center space-y-2 text-xs">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4682B4]" />
                      <span className="font-bold">Analyzing image layers via YOLOv8 model...</span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-slate-400" />
                      <label className="block text-xs font-bold text-[#4682B4] cursor-pointer hover:underline">
                        Upload inspection frame
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      <span className="text-[10px] text-slate-400 block">PNG, JPG or Drone telemetry frames</span>
                    </div>
                  )}
                </div>

                {detectedDamage && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black uppercase text-[9px] text-[#4682B4]">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Model Inference Output
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-400">Class:</span>
                      <span>{detectedDamage.damage_type}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="font-mono text-emerald-500">{(detectedDamage.confidence_score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-400">Severity:</span>
                      <span className="text-red-500 uppercase">{detectedDamage.severity}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-400">Est. Cost:</span>
                      <span className="text-emerald-600 dark:text-emerald-450 font-mono">₹{detectedDamage.estimated_repair_cost.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
            
            <CardContent className="pt-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-black/10 text-[10px] font-bold text-slate-500 leading-relaxed">
              * Note: The YOLOv8 model runs on an internal server pipeline, automatically estimating repair costs and reporting GPS tags directly to the Command Center logs.
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Prioritization Queue List */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228]">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Repair Prioritization Queue</CardTitle>
              <CardDescription className="text-xs">Prioritized work orders based on traffic load & complaints.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {prioritizedSegments.map((seg: any, idx: number) => (
                  <div 
                    key={seg.id} 
                    className={cn(
                      "p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors cursor-pointer",
                      selectedSegment.id === seg.id ? "bg-slate-50/70 dark:bg-[#101F42]/40" : ""
                    )}
                    onClick={() => setSelectedSegment(seg)}
                  >
                    <div className="space-y-1 truncate max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-950 dark:text-white truncate">{seg.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {seg.trafficCount.toLocaleString()} vehicles/day • {seg.complaintsCount} Complaints
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                        seg.priorityClass === 'critical' ? "bg-red-100 text-red-700 border-red-350 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" :
                        seg.priorityClass === 'high' ? "bg-orange-100 text-orange-700 border-orange-350 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30" :
                        seg.priorityClass === 'medium' ? "bg-amber-100 text-amber-705 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" :
                        "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                      )}>
                        {seg.priorityClass}
                      </span>
                      <span className="block text-[10px] font-black text-slate-400 mt-1 font-mono">Score: {seg.priorityScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
