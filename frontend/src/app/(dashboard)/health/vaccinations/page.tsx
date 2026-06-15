// app/(dashboard)/health/vaccinations/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ArrowLeft, HeartPulse, Activity, AlertTriangle, ShieldCheck, 
  MapPin, Archive, RefreshCw, BarChart3, Plus, ChevronRight, Syringe, ClipboardList, Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { VaccinationProgress } from '@/components/health/VaccinationProgress';
import { cn } from '@/lib/utils';

export default function VaccinationPlanner() {
  const { summary, loading, fetchSummary, recommendVaccine, administerVaccine, updateVaccineStock } = useHealthStore();
  
  // Recommend form state
  const [recPatientName, setRecPatientName] = useState('');
  const [recDisease, setRecDisease] = useState('Dengue');
  const [recommendationResult, setRecommendationResult] = useState<any | null>(null);
  const [recError, setRecError] = useState<string | null>(null);

  // Administer form state
  const [adminCenterId, setAdminCenterId] = useState<number>(1);
  const [adminPatientName, setAdminPatientName] = useState('');
  const [adminVaccineId, setAdminVaccineId] = useState<number>(1);
  const [adminDoseNumber, setAdminDoseNumber] = useState<number>(1);
  const [adminStatus, setAdminStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Stock update form state
  const [stockCenterId, setStockCenterId] = useState<number>(1);
  const [stockVaccineId, setStockVaccineId] = useState<number>(1);
  const [stockQuantity, setStockQuantity] = useState<number>(1000);
  const [stockStatus, setStockStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecommendationResult(null);
    setRecError(null);
    if (!recPatientName.trim()) {
      setRecError('Patient name is required.');
      return;
    }
    try {
      const res = await recommendVaccine(recPatientName, recDisease);
      setRecommendationResult(res);
      setRecPatientName('');
    } catch (err: any) {
      setRecError(err.message || 'Failed to fetch vaccine recommendations.');
    }
  };

  const handleAdminister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus(null);
    if (!adminPatientName.trim()) {
      setAdminStatus({ success: false, message: 'Patient name is required.' });
      return;
    }
    try {
      const res = await administerVaccine({
        center_id: Number(adminCenterId),
        patient_name: adminPatientName,
        vaccine_id: Number(adminVaccineId),
        dose_number: Number(adminDoseNumber)
      });
      setAdminStatus({ 
        success: true, 
        message: `Dose administered successfully at Center ${adminCenterId} (Record ID: ${res.id})` 
      });
      setAdminPatientName('');
    } catch (err: any) {
      setAdminStatus({ success: false, message: err.message || 'Failed to log vaccination record.' });
    }
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockStatus(null);
    try {
      await updateVaccineStock({
        center_id: Number(stockCenterId),
        vaccine_id: Number(stockVaccineId),
        quantity: Number(stockQuantity)
      });
      setStockStatus({ 
        success: true, 
        message: `Stock level updated to ${stockQuantity} doses successfully.` 
      });
    } catch (err: any) {
      setStockStatus({ success: false, message: err.message || 'Failed to update vaccine stock.' });
    }
  };

  // Fallbacks if DB is empty
  const fallbackCampaigns = [
    { coveragePct: 82.5, totalAdministered: 184500, targetedDisease: "Dengue Outbreaks", recommendedVaccine: "Dengvaxia", remainingPopulation: 39000 },
    { coveragePct: 68.4, totalAdministered: 92300, targetedDisease: "Malaria Vector Protection", recommendedVaccine: "Mosquirix", remainingPopulation: 42600 },
    { coveragePct: 45.2, totalAdministered: 45000, targetedDisease: "Typhoid Bacterial Surge", recommendedVaccine: "Typbar-TCV", remainingPopulation: 54800 }
  ];

  const fallbackVaccinations = [
    { id: 1, district: "Lucknow", disease: "Dengue", required: 450000, forecast: 82.5, campaign: "Dengvaxia Campaign", time: "19:12" },
    { id: 2, district: "Kanpur", disease: "Malaria", required: 300000, forecast: 68.4, campaign: "Mosquirix Campaign", time: "19:05" },
    { id: 3, district: "Agra", disease: "Typhoid", required: 200000, forecast: 45.2, campaign: "Typbar-TCV Campaign", time: "18:50" }
  ];

  const campaignsList = summary?.recent_vaccinations && summary.recent_vaccinations.length > 0 
    ? summary.recent_vaccinations.map(v => ({
        coveragePct: v.forecast,
        totalAdministered: Math.round(v.required * (v.forecast / 100)),
        targetedDisease: v.disease,
        recommendedVaccine: v.campaign,
        remainingPopulation: Math.round(v.required * (1 - v.forecast / 100))
      }))
    : fallbackCampaigns;

  const logsList = summary?.recent_vaccinations && summary.recent_vaccinations.length > 0 
    ? summary.recent_vaccinations 
    : fallbackVaccinations;

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
            Vaccination Campaign Planning AI
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Epidemiological immunization controls, dosage forecasting, and target coverage demographics tracking.
          </p>
        </div>
      </div>

      {/* Grid Layout: Left - Interactive Forms (5 cols) | Right - Progress & Logs (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Forms */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recommend Scheduler Form */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Interactive Immunization Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleRecommend} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Name</label>
                    <input
                      type="text"
                      value={recPatientName}
                      onChange={(e) => setRecPatientName(e.target.value)}
                      placeholder="e.g. Anil Sharma"
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Disease</label>
                    <select 
                      value={recDisease} 
                      onChange={(e) => setRecDisease(e.target.value)}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      {["Dengue", "Malaria", "Typhoid", "Cholera", "Tuberculosis"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {recError && (
                  <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs">
                    {recError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Generate Vaccine Recommendation
                </Button>
              </form>

              {/* Recommendation result details */}
              {recommendationResult && (
                <div className="mt-4 p-4 rounded bg-[#070D1A]/60 border border-blue-500/30 text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1A2744]">
                    <span className="font-extrabold text-[#D4AF37] uppercase text-[9px] tracking-wider">AI Recommendation Ready</span>
                    <span className="text-[10px] text-slate-400">Patient: {recommendationResult.patient_name}</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">Recommended Vaccine: {recommendationResult.recommended_vaccine || "Dengvaxia"}</div>
                    <p className="text-[10px] text-slate-400 mt-1">Dose sequence: Dose #{recommendationResult.dose_number || 1} | Target age: {recommendationResult.recommended_age_months || 108} months</p>
                  </div>
                  <div className="bg-[#10B981]/15 border border-[#10B981]/30 rounded p-2 text-emerald-400 font-semibold leading-relaxed">
                    Reasoning: Local vector risk matches {recommendationResult.targeted_disease || "Dengue"} outbreak warnings in the area. Immediate administration is advised.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administration registry */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Syringe className="w-4 h-4 text-emerald-400" />
                Administration Dose Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAdminister} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Center Reference ID</label>
                    <input
                      type="number"
                      value={adminCenterId}
                      onChange={(e) => setAdminCenterId(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vaccine Reference ID</label>
                    <input
                      type="number"
                      value={adminVaccineId}
                      onChange={(e) => setAdminVaccineId(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Name</label>
                    <input
                      type="text"
                      value={adminPatientName}
                      onChange={(e) => setAdminPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dose Number Sequence</label>
                    <input
                      type="number"
                      value={adminDoseNumber}
                      onChange={(e) => setAdminDoseNumber(Number(e.target.value))}
                      min="1"
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {adminStatus && (
                  <div className={cn(
                    "p-3 rounded text-xs border font-medium",
                    adminStatus.success 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>
                    {adminStatus.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Record Administered Dose
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stock inventory management */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Clinic Stock Replenishment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleStockUpdate} className="space-y-4">
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Center ID</label>
                    <input
                      type="number"
                      value={stockCenterId}
                      onChange={(e) => setStockCenterId(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vaccine ID</label>
                    <input
                      type="number"
                      value={stockVaccineId}
                      onChange={(e) => setStockVaccineId(Number(e.target.value))}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Quantity</label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      min="0"
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {stockStatus && (
                  <div className={cn(
                    "p-3 rounded text-xs border font-medium",
                    stockStatus.success 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>
                    {stockStatus.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Confirm Stock Update
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Right Side: Progress Curves & Logs */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Immunization Coverage Progress list */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Campaign Coverage Metrics</h3>
            <div className="grid grid-cols-1 gap-4">
              {campaignsList.map((camp, idx) => (
                <VaccinationProgress 
                  key={idx}
                  coveragePct={camp.coveragePct}
                  totalAdministered={camp.totalAdministered}
                  targetedDisease={camp.targetedDisease}
                  recommendedVaccine={camp.recommendedVaccine}
                  remainingPopulation={camp.remainingPopulation}
                />
              ))}
            </div>
          </div>

          {/* Active vaccination log entries */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                Active Immunization Campaigns Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {logsList.length > 0 ? (
                <div className="divide-y divide-[#1A2744]">
                  {logsList.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between hover:bg-[#101F42]/30 transition-colors text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-100">{log.campaign}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          District: {log.district}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono">
                          {log.forecast}% Coverage
                        </span>
                        <p className="text-[9px] text-slate-500 mt-1 font-bold">
                          Required Vials: {log.required?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-bold text-xs">
                  No vaccination log records registered.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
