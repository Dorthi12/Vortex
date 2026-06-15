// app/(dashboard)/health/hospitals/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, ArrowLeft, HeartPulse, Activity, AlertTriangle, ShieldCheck, 
  Settings, Sparkles, Plus, CheckCircle2, UserPlus, UserMinus, Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { CapacityGauge } from '@/components/health/CapacityGauge';
import { cn } from '@/lib/utils';

export default function HospitalCapacityPage() {
  const { summary, loading, fetchSummary, admitPatient, dischargePatient } = useHealthStore();
  
  // Admission Form State
  const [admitHospitalId, setAdmitHospitalId] = useState<number>(1);
  const [patientName, setPatientName] = useState('');
  const [bedType, setBedType] = useState('GENERAL');
  const [admitStatus, setAdmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Discharge Form State
  const [dischargeId, setDischargeId] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [dischargeStatus, setDischargeStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Set default admitHospitalId when summary loads
  useEffect(() => {
    if (summary?.recent_hospital_loads && summary.recent_hospital_loads.length > 0) {
      setAdmitHospitalId(summary.recent_hospital_loads[0].id);
    }
  }, [summary]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setAdmitStatus({ success: false, message: 'Patient name is required.' });
      return;
    }
    setAdmitStatus(null);
    try {
      const res = await admitPatient({
        hospital_id: Number(admitHospitalId),
        patient_name: patientName,
        bed_type: bedType
      });
      setAdmitStatus({ 
        success: true, 
        message: `Patient admitted successfully. Assigned Bed: ${res.bed_number || 'G-1'} (Admission ID: ${res.id})` 
      });
      setPatientName('');
    } catch (err: any) {
      setAdmitStatus({ success: false, message: err.message || 'Admission request failed.' });
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(dischargeId);
    if (isNaN(parsedId)) {
      setDischargeStatus({ success: false, message: 'Valid Admission ID is required.' });
      return;
    }
    setDischargeStatus(null);
    try {
      await dischargePatient({
        admission_id: parsedId,
        medical_notes: medicalNotes
      });
      setDischargeStatus({ 
        success: true, 
        message: `Patient under admission ID ${parsedId} discharged successfully.` 
      });
      setDischargeId('');
      setMedicalNotes('');
    } catch (err: any) {
      setDischargeStatus({ success: false, message: err.message || 'Discharge request failed.' });
    }
  };

  // Fallback data if DB has no hospital entries yet
  const fallbackHospitals = [
    { id: 1, hospital: "Lucknow Central Hospital", district: "Lucknow", occupancy: 240, expected: 300, shortage: false },
    { id: 2, hospital: "Sanjay Gandhi Trauma Center", district: "Lucknow", occupancy: 46, expected: 50, shortage: true },
    { id: 3, hospital: "King George Emergency Hub", district: "Lucknow", occupancy: 120, expected: 150, shortage: false },
    { id: 4, hospital: "Charak Medical Dispensary", district: "Lucknow", occupancy: 18, expected: 30, shortage: false }
  ];

  const hospitalsList = summary?.recent_hospital_loads && summary.recent_hospital_loads.length > 0 
    ? summary.recent_hospital_loads 
    : fallbackHospitals;

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
            Hospital Bed Capacity Command
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time admissions intake control, ICU/ventilator stress levels, and localized resource redistribution.
          </p>
        </div>
      </div>

      {/* Grid: Left - Forms & Actions (5 columns) | Right - Capacity Status (7 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Admit & Discharge Panels */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Patient Admission Card */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Intake Admission Registry
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Admit incoming patients to designated facility beds.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAdmit} className="space-y-4">
                
                {/* Select Hospital */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination Hospital</label>
                  <select 
                    value={admitHospitalId} 
                    onChange={(e) => setAdmitHospitalId(Number(e.target.value))}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    {hospitalsList.map(h => (
                      <option key={h.id} value={h.id}>{h.hospital} ({h.district})</option>
                    ))}
                  </select>
                </div>

                {/* Patient Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Full Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter name (e.g. Ramesh Kumar)"
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bed Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Bed Allocation</label>
                  <select 
                    value={bedType} 
                    onChange={(e) => setBedType(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="GENERAL">GENERAL WARD</option>
                    <option value="ICU">ICU WARD</option>
                  </select>
                </div>

                {admitStatus && (
                  <div className={cn(
                    "p-3 rounded text-xs border font-medium",
                    admitStatus.success 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>
                    {admitStatus.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Confirm Intake Admission
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Patient Discharge Card */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-amber-400" />
                Discharge Registry
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Record discharges and log medical recovery metrics.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleDischarge} className="space-y-4">
                
                {/* Admission ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admission Reference ID</label>
                  <input
                    type="text"
                    value={dischargeId}
                    onChange={(e) => setDischargeId(e.target.value)}
                    placeholder="Enter reference number (e.g. 15)"
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Medical Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discharge Medical Notes</label>
                  <textarea
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Enter medical observations, recovery details, etc."
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {dischargeStatus && (
                  <div className={cn(
                    "p-3 rounded text-xs border font-medium",
                    dischargeStatus.success 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}>
                    {dischargeStatus.message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Approve Patient Discharge
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Right column: Capacity Status Gauges & Inventory list */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Capacity Gauges Dashboard */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744] pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Facility Occupancy Gauges</span>
                <span className="text-[9px] text-slate-500 font-mono">Stress Index Threshold: 85%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
                {hospitalsList.map((h) => (
                  <div key={h.id} className="border border-[#1A2744]/60 bg-[#070D1A]/30 rounded-lg p-2.5 flex flex-col items-center">
                    <CapacityGauge 
                      occupied={h.occupancy} 
                      total={h.expected} 
                      label="Stress Index"
                      size={95}
                    />
                    <div className="text-center mt-2 w-full">
                      <div className="text-[10px] font-extrabold text-white truncate px-1">{h.hospital}</div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{h.district}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Bed Inventory Table */}
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Live Ward Inventory Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A2744]/80 text-[9px] uppercase tracking-wider text-slate-500 font-black bg-[#070D1A]/50">
                      <th className="p-4">Facility / Hospital</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Beds Occupancy</th>
                      <th className="p-4 text-right">Status Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2744]/40 text-xs">
                    {hospitalsList.map((h) => {
                      const load_pct = Math.round((h.occupancy / h.expected) * 100);
                      const isStressed = load_pct >= 85;
                      const isWarning = load_pct >= 70 && load_pct < 85;
                      
                      return (
                        <tr key={h.id} className="hover:bg-[#101F42]/20 transition-colors">
                          <td className="p-4">
                            <span className="font-extrabold text-white">{h.hospital}</span>
                          </td>
                          <td className="p-4 text-slate-400 font-semibold">{h.district}</td>
                          <td className="p-4 font-mono font-bold text-slate-200">
                            {h.occupancy} / {h.expected} beds ({load_pct}%)
                          </td>
                          <td className="p-4 text-right">
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded text-[10px] font-black border tracking-wider",
                              isStressed 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : isWarning 
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                              {isStressed ? 'CRITICAL DEFICIT' : isWarning ? 'WARNING THRESHOLD' : 'NOMINAL STRESS'}
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
