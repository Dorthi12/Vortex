// app/(dashboard)/health/medicine/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, ArrowLeft, HeartPulse, Activity, AlertTriangle, ShieldCheck, 
  Plus, Archive, Sparkles, TrendingUp, ShoppingBag, Database, ListOrdered
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { MedicineAlertCard } from '@/components/health/MedicineAlertCard';
import { cn } from '@/lib/utils';

export default function MedicineDemandForecaster() {
  const { summary, loading, fetchSummary, logMedicineUsage } = useHealthStore();
  
  // Log usage form state
  const [pharmacyName, setPharmacyName] = useState('District Jan Aushadhi Kendra');
  const [medicineName, setMedicineName] = useState('Paracetamol 650mg');
  const [quantity, setQuantity] = useState<number>(50);
  const [logStatus, setLogStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setLogStatus({ success: false, message: 'Quantity sold must be greater than 0.' });
      return;
    }
    setLogStatus(null);
    try {
      const res = await logMedicineUsage({
        pharmacy_name: pharmacyName,
        medicine_name: medicineName,
        quantity_sold: Number(quantity)
      });
      setLogStatus({ 
        success: true, 
        message: `Logged sales: ${quantity} units of ${medicineName} at ${pharmacyName}. Surveillance matched: ${res.status || 'NOMINAL'}` 
      });
      setQuantity(50);
    } catch (err: any) {
      setLogStatus({ success: false, message: err.message || 'Log request failed.' });
    }
  };

  // Fallbacks if data doesn't exist yet
  const fallbackAlerts = [
    { medicineName: "Paracetamol 650mg", stockLevel: 340, pharmacyName: "District Jan Aushadhi Kendra", matchPercentage: 88, suggestedDisease: "Dengue Surge", severity: "CRITICAL" },
    { medicineName: "ORS Powder Vials", stockLevel: 120, pharmacyName: "Sector 4B Government Pharmacy", matchPercentage: 74, suggestedDisease: "Cholera Outbreak", severity: "ALERT" },
    { medicineName: "Amoxicillin 500mg", stockLevel: 450, pharmacyName: "Charak Hospital Drug Store", matchPercentage: 55, suggestedDisease: "Typhoid Spike", severity: "WARNING" }
  ];

  const fallbackMedicines = [
    { id: 1, pharmacy: "District Jan Aushadhi Kendra", medicine: "Paracetamol 650mg", inventory: 340, demand: 800, risk: "CRITICAL" as const, time: "18:30" },
    { id: 2, pharmacy: "Sector 4B Government Pharmacy", medicine: "ORS Powder Vials", inventory: 120, demand: 400, risk: "HIGH" as const, time: "18:42" },
    { id: 3, pharmacy: "Charak Hospital Drug Store", medicine: "Amoxicillin 500mg", inventory: 450, demand: 600, risk: "MEDIUM" as const, time: "19:02" },
    { id: 4, pharmacy: "Arogya Wellness Depot", medicine: "Insulin Glargine", inventory: 890, demand: 920, risk: "LOW" as const, time: "19:05" }
  ];

  const medicinesList = summary?.recent_medicines && summary.recent_medicines.length > 0 
    ? summary.recent_medicines 
    : fallbackMedicines;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header and Back Button */}
      <div className="flex items-center gap-3 border-b border-[#1A2744] pb-5">
        <Link href="/health">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-[#101F42]/40 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Medicine Surveillance &amp; Demand Tracking
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time pharmacy sales telemetry logs, epidemiological spike signals, and automated inventory depletion warnings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Log Sales Usage (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Log Pharmacy Sales Entry
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Record drug inventory consumption to run vector matching.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Select Pharmacy */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pharmacy Center</label>
                  <select 
                    value={pharmacyName} 
                    onChange={(e) => setPharmacyName(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {[
                      "District Jan Aushadhi Kendra", 
                      "Sector 4B Government Pharmacy", 
                      "Charak Hospital Drug Store", 
                      "Arogya Wellness Depot"
                    ].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Select Medicine */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Medicine Dispensed</label>
                  <select 
                    value={medicineName} 
                    onChange={(e) => setMedicineName(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {[
                      "Paracetamol 650mg", 
                      "Amoxicillin 500mg", 
                      "Azithromycin 250mg", 
                      "ORS Powder Vials", 
                      "Insulin Glargine"
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity Sold */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity Sold (Units)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min="1"
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {logStatus && (
                  <div className={cn(
                    "p-3 rounded text-xs border font-medium",
                    logStatus.success 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>
                    {logStatus.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Log Dispensation Entry
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Historical Usage Trend SVG */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Rule-Based Outbreak Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full aspect-video bg-[#070D1A]/50 border border-[#1A2744] rounded-lg p-2.5 flex items-center justify-center">
                <svg viewBox="0 0 300 120" className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="30" y1="20" x2="280" y2="20" className="stroke-slate-800" strokeWidth="0.5" />
                  <line x1="30" y1="60" x2="280" y2="60" className="stroke-slate-800" strokeWidth="0.5" />
                  <line x1="30" y1="100" x2="280" y2="100" className="stroke-slate-800" strokeWidth="0.5" />
                  
                  {/* Spike pattern path */}
                  <path 
                    d="M 30,95 L 80,92 L 130,85 L 180,30 L 230,22 L 280,88" 
                    fill="none" 
                    className="stroke-[#D4AF37] stroke-[2.5]" 
                  />
                  <circle cx="180" cy="30" r="3.5" className="fill-red-500 animate-pulse" />
                  <text x="180" y="22" className="fill-red-400 text-[6px] font-black" textAnchor="middle">SPIKE TRIGGERED</text>
                  
                  <text x="30" y="112" className="fill-slate-500 text-[6px]" textAnchor="middle">Day 1</text>
                  <text x="180" y="112" className="fill-slate-500 text-[6px]" textAnchor="middle">Day 15</text>
                  <text x="280" y="112" className="fill-slate-500 text-[6px]" textAnchor="middle">Day 30</text>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Spike Pattern Cards & Inventory feed (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Spike warning patterns list */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Pattern Matching Alarms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fallbackAlerts.map((alert, idx) => (
                <MedicineAlertCard 
                  key={idx}
                  medicineName={alert.medicineName}
                  stockLevel={alert.stockLevel}
                  pharmacyName={alert.pharmacyName}
                  matchPercentage={alert.matchPercentage}
                  suggestedDisease={alert.suggestedDisease}
                  severity={alert.severity}
                />
              ))}
            </div>
          </div>

          {/* Current Inventory stock alerts list */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Live District Pharmacy Stock Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A2744]/85 text-[9px] uppercase tracking-wider text-slate-500 font-black bg-[#070D1A]/50">
                      <th className="p-4">Medicine Name</th>
                      <th className="p-4">Pharmacy node</th>
                      <th className="p-4">Current Stock</th>
                      <th className="p-4 text-right">Replenishment Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2744]/40 text-xs">
                    {medicinesList.map((med, idx) => {
                      const isCritical = med.risk === 'CRITICAL';
                      const isHigh = med.risk === 'HIGH';
                      return (
                        <tr key={idx} className="hover:bg-[#101F42]/20 transition-colors">
                          <td className="p-4">
                            <span className="font-extrabold text-white">{med.medicine}</span>
                          </td>
                          <td className="p-4 text-slate-450 font-semibold">{med.pharmacy}</td>
                          <td className="p-4 font-mono text-slate-300 font-bold">{med.inventory} units</td>
                          <td className="p-4 text-right">
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded text-[10px] font-black border font-mono tracking-wide",
                              isCritical 
                                ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" 
                                : isHigh 
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                              {med.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
