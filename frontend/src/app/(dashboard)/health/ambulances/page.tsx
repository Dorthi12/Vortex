// app/(dashboard)/health/ambulances/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, ArrowLeft, HeartPulse, Activity, AlertTriangle, ShieldCheck, 
  MapPin, Clock, Navigation, CheckCircle2, RefreshCw, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { cn } from '@/lib/utils';

export default function AmbulanceCommandPage() {
  const { summary, loading, fetchSummary, requestAmbulance, dispatchAmbulance } = useHealthStore();

  // Request form state
  const [lat, setLat] = useState<number>(26.8450);
  const [lng, setLng] = useState<number>(80.9450);
  const [severity, setSeverity] = useState('critical');
  const [requestResult, setRequestResult] = useState<any | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Dispatch traffic state
  const [traffic, setTraffic] = useState('moderate');
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestResult(null);
    setRequestError(null);
    setDispatchResult(null);
    try {
      const res = await requestAmbulance({
        emergency_lat: Number(lat),
        emergency_lng: Number(lng),
        severity_level: severity
      });
      setRequestResult(res);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to calculate nearest ambulance.');
    }
  };

  const handleConfirmDispatch = async () => {
    if (!requestResult?.request_id) return;
    try {
      const res = await dispatchAmbulance(requestResult.request_id, traffic);
      setDispatchResult(res);
      setRequestResult(null); // Clear request after successful dispatch
      fetchSummary();
    } catch (err: any) {
      setRequestError(err.message || 'Dispatch confirmation failed.');
    }
  };

  // Fallbacks if data doesn't exist yet
  const fallbackDispatches = [
    { dispatch_id: "D-901", plate: "UP-32-EH-4532", hospital: "Sanjay Gandhi Trauma Center", eta: 8, status: "DISPATCHED", severity: "critical", lat: 26.8450, lng: 80.9450, time: "19:15:30" },
    { dispatch_id: "D-902", plate: "UP-32-FK-9021", hospital: "Lucknow Central Hospital", eta: 14, status: "EN_ROUTE", severity: "serious", lat: 26.8520, lng: 80.9380, time: "19:08:12" },
    { dispatch_id: "D-903", plate: "UP-32-AJ-1200", hospital: "King George Emergency Hub", eta: 5, status: "ARRIVED", severity: "critical", lat: 26.8390, lng: 80.9550, time: "19:02:45" }
  ];

  const activeDispatches = summary?.recent_dispatches && summary.recent_dispatches.length > 0 
    ? summary.recent_dispatches 
    : fallbackDispatches;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-3 border-b border-[#1A2744] pb-5">
        <Link href="/health">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-[#101F42]/40 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Ambulance Dispatch Optimizer
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time emergency routing, traffic flow integration, and nearest-responder allocation algorithms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Request & Optimize Panel (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dispatch Request Trigger Form */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Emergency Location Profiler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleRequest} className="space-y-4">
                
                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Severity Level */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity Level</label>
                  <select 
                    value={severity} 
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="critical">Critical (Life Threatening)</option>
                    <option value="serious">Serious (Urgent Attention)</option>
                    <option value="minor">Minor (OPD Transit)</option>
                  </select>
                </div>

                {requestError && (
                  <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs">
                    {requestError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {loading ? 'Evaluating Vectors...' : 'Find Nearest Responder'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* AI Recommended Router Panel */}
          {requestResult && (
            <Card className="bg-[#0A1228] border border-blue-500/40 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <CardHeader className="border-b border-[#1A2744] pb-3">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Optimal Dispatch Vector Calculated
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                
                {/* Nearest Ambulance */}
                <div className="bg-[#070D1A]/60 border border-[#1A2744] rounded p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 font-bold">Closest Unit</span>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">{requestResult.closest_ambulance?.plate_number || "UP-32-AMB-201"}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase text-slate-500 font-bold font-mono">Distance</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">{requestResult.closest_ambulance?.distance_km?.toFixed(2) || "1.45"} km</div>
                  </div>
                </div>

                {/* Recommended Hospitals */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Recommended Destination Facilities</span>
                  <div className="space-y-1.5">
                    {requestResult.hospital_recommendations?.slice(0, 2).map((h: any, idx: number) => (
                      <div key={idx} className="bg-[#070D1A]/30 border border-[#1A2744] rounded p-2.5 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-200">{h.name}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Available Beds: {h.available_beds} | ICU: {h.available_icu}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black uppercase text-blue-400">{h.occupancy_rate?.toFixed(0)}% Cap</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic configuration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Route Traffic Density</label>
                  <select 
                    value={traffic} 
                    onChange={(e) => setTraffic(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="light">Light Flow (Minimal delay)</option>
                    <option value="moderate">Moderate Flow (Normal delay)</option>
                    <option value="heavy">Heavy Gridlock (High delay)</option>
                  </select>
                </div>

                {/* Confirm Dispatch */}
                <Button 
                  onClick={handleConfirmDispatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Confirm Dispatch Emergency Mission
                </Button>

              </CardContent>
            </Card>
          )}

          {/* Dispatch Outcome Alert */}
          {dispatchResult && (
            <Card className="bg-[#0A1228] border border-emerald-500/40 text-white">
              <CardContent className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-white">Ambulance Dispatched successfully</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Route optimization calculated. Assigned Hospital: <strong className="text-slate-200">{dispatchResult.assigned_hospital || "Trauma Hub"}</strong>.
                  </p>
                  <p className="text-xs text-blue-400 mt-2 font-mono">
                    Estimated Travel Duration (ETA): {dispatchResult.eta_minutes} Minutes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right column: Dispatch Queue Log & SVG routing matrix */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dispatch tracking map */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744] pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Command GPS Coordinates Grid
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative w-full aspect-video md:aspect-[2.5/1] bg-[#070D1A]/50 border border-[#1A2744] rounded-lg p-2 flex items-center justify-center">
                {/* SVG layout representing coordinates map */}
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect width="20" height="20" fill="none" className="stroke-slate-900" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="400" height="150" fill="url(#grid)" />

                  {/* Grid boundary outline */}
                  <rect x="10" y="10" width="380" height="130" fill="none" className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />

                  {/* Render fallback hospital spots */}
                  <g>
                    <circle cx="80" cy="50" r="5" className="fill-blue-500/80 stroke-blue-400 stroke-[1.5]" />
                    <text x="80" y="42" className="fill-slate-400 text-[6px] font-black" textAnchor="middle">TRAUMA CTR</text>

                    <circle cx="280" cy="110" r="5" className="fill-blue-500/80 stroke-blue-400 stroke-[1.5]" />
                    <text x="280" y="102" className="fill-slate-400 text-[6px] font-black" textAnchor="middle">CITY HOSP</text>
                  </g>

                  {/* Render dispatches on grid */}
                  {activeDispatches.map((d, i) => {
                    // Map lat/lng around Lucknow bounds
                    const x = 120 + ((d.lng - 80.9300) / 0.03) * 200;
                    const y = 110 - ((d.lat - 26.8300) / 0.03) * 80;
                    
                    return (
                      <g key={i}>
                        {d.status !== 'COMPLETED' && (
                          <circle cx={x} cy={y} r="8" className="fill-none stroke-amber-500/30 stroke-[0.5] animate-ping" />
                        )}
                        <circle cx={x} cy={y} r="3.5" className="fill-amber-500 stroke-amber-400 stroke-[1.5]" />
                        <text x={x} y={y - 7} className="fill-slate-300 text-[5px] font-bold" textAnchor="middle">{d.plate}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Active Dispatches queue log */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Active Emergency Transit Mission Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[350px] overflow-y-auto">
              {activeDispatches.length > 0 ? (
                <div className="divide-y divide-[#1A2744]">
                  {activeDispatches.map((disp, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#101F42]/30 transition-colors text-xs">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-100">{disp.plate}</h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Navigation className="w-3 h-3 text-[#D4AF37]" />
                            Dest: {disp.hospital}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <span className={cn(
                            "inline-block px-2.5 py-0.5 rounded text-[9px] font-black border tracking-wider",
                            disp.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          )}>
                            {disp.severity?.toUpperCase()}
                          </span>
                          <p className="text-[10px] text-slate-450 mt-1 font-bold flex items-center justify-end gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            ETA: {disp.eta} MIN
                          </p>
                        </div>

                        <div>
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-black border font-mono tracking-wider",
                            disp.status === 'COMPLETED'
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
                          )}>
                            {disp.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-bold text-xs">
                  No active transits logged.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
