'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, ShieldCheck, HelpCircle, ShieldAlert, Sparkles, MapPin, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

interface PestAlert {
  id: string;
  name: string;
  crop: string;
  severity: 'Severe' | 'Moderate' | 'Low';
  location: string;
  symptoms: string;
  chemicalControl: string;
  organicControl: string;
  riskScore: number; // %
}

const MOCK_PESTS: PestAlert[] = [
  {
    id: 'pest-1',
    name: 'Cotton Aphids (Aphis gossypii)',
    crop: 'Cotton',
    severity: 'Severe',
    location: 'Sector 4B Ward 12 (Market Road Area)',
    symptoms: 'Yellowing leaves, sticky honeydew accumulation, leaf curling on terminals.',
    chemicalControl: 'Apply Imidacloprid (17.8% SL) at 100 ml/acre or Thiamethoxam (25% WG) at 40g/acre.',
    organicControl: 'Spray neem oil formulation (10,000 ppm) at 3ml/L water or release Lacewing larvae.',
    riskScore: 88,
  },
  {
    id: 'pest-2',
    name: 'Sugarcane Early Shoot Borer (Chilo infuscatellus)',
    crop: 'Sugarcane',
    severity: 'Moderate',
    location: 'Sector 4B Ward 16 (East Agricultural Belt)',
    symptoms: 'Dead hearts in young shoots, boreholes near the base of plants.',
    chemicalControl: 'Soil application of Chlorantraniliprole (0.4% G) at 7.5 kg/acre during planting.',
    organicControl: 'Release Trichogramma chilonis egg parasites (50,000/acre) at 15-day intervals.',
    riskScore: 54,
  },
  {
    id: 'pest-3',
    name: 'Fall Armyworm (Spodoptera frugiperda)',
    crop: 'Wheat & Maize',
    severity: 'Low',
    location: 'Sector 4B Ward 17 (Suburbs East)',
    symptoms: 'Scraped leaf margins, papery windowpanes, dry sawdust-like frass on whorls.',
    chemicalControl: 'Foliar spray of Spinetoram (11.7% SC) at 0.5 ml/L or Emamectin benzoate (5% SG) at 0.4g/L.',
    organicControl: 'Utilize Bacillus thuringiensis (Bt) sprays or place pheromone traps (5 traps/acre).',
    riskScore: 22,
  }
];

export default function PestAlerts() {
  const { setActiveTab } = useUiStore();
  const [selectedPest, setSelectedPest] = useState<PestAlert>(MOCK_PESTS[0]);
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Sync sidebar active highlight
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/agriculture" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sea-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Agriculture Overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
          Agro-Telemetry Models
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Pest Alerts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Monitor localized biological infestation risk levels, inspect outbreak locations, and access integrated pest management treatment guides.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="pest"
        title="Report Outbreak & Request IPM Specialist"
        description="Book an urgent in-person visit with a certified IPM Entomologist to conduct spray audits, release biological agents, and prevent crop losses."
        buttonLabel="Call Pest Control Specialist"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Danger Dial & Active List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Danger level gauge card - Pale Yellow */}
          <Card className="border-0 shadow-md p-5 text-center flex flex-col justify-between min-h-[180px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fefce8 100%)' }}>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-800">Outbreak Danger Index</span>
              <div className="relative flex items-center justify-center pt-2">
                {/* Visual Dial representation */}
                <div className="h-24 w-24 rounded-full border-8 border-amber-100 dark:border-amber-900/40 flex items-center justify-center relative bg-white/40">
                  <div className="absolute inset-0 rounded-full border-8 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent animate-spin-slow pointer-events-none" />
                  <span className="text-xl font-black text-amber-950">Level 2</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1 mt-4">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Active Status: Moderate Regional Threat
            </div>
          </Card>

          {/* Call Pest Expert card — Yellow */}
          <Card className="relative overflow-hidden border-0 shadow-lg p-4 space-y-3"
            style={{ background: 'linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)' }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <div className="relative z-10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-yellow-950">Outbreak Escalation?</h4>
              <p className="text-[11px] text-yellow-900 leading-normal font-medium">
                Book an urgent visit with an IPM Specialist to conduct chemical spray audits or release biological agents.
              </p>
              <Button
                onClick={() => setIsProfModalOpen(true)}
                className="w-full bg-yellow-950/10 hover:bg-yellow-950/20 border border-yellow-950/25 text-yellow-950 font-bold flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer backdrop-blur-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Report &amp; Call Specialist
              </Button>
            </div>
          </Card>

          {/* Active warnings list — Red */}
          <Card className="border-0 shadow-xs overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fff1f2 100%)' }}>
            <CardHeader className="pb-3 border-b border-red-200/60"
              style={{ background: 'linear-gradient(90deg, #fecdd340, #fda4af20)' }}>
              <CardTitle className="text-xs font-black uppercase tracking-wider text-red-800">
                Active Infestation Alarms
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-red-100">
                {MOCK_PESTS.map((pest) => {
                  const isSelected = selectedPest.id === pest.id;
                  return (
                    <button
                      key={pest.id}
                      onClick={() => setSelectedPest(pest)}
                      className={cn(
                        'w-full p-4 text-left transition-all cursor-pointer flex justify-between items-start gap-4',
                        isSelected
                          ? 'bg-red-100/70 border-l-2 border-l-red-500'
                          : 'hover:bg-red-50/60'
                      )}
                    >
                      <div className="space-y-1">
                        <h5 className={cn(
                          'text-xs font-bold',
                          isSelected ? 'text-red-700' : 'text-red-900'
                        )}>{pest.name}</h5>
                        <span className="block text-[9px] text-red-500 font-bold">{pest.crop} • {pest.location.split(' ')[2]}</span>
                      </div>
                      <span className={cn(
                        'text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase shrink-0',
                        pest.severity === 'Severe'
                          ? 'bg-red-600 text-white'
                          : pest.severity === 'Moderate'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                      )}>
                        {pest.severity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: IPM Treatment Protocol — Pale Yellow */}
        <Card className="lg:col-span-2 border-0 shadow-md flex flex-col justify-between overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 60%, #fefce8 100%)' }}>
          <CardHeader className="pb-3 border-b border-amber-200/60 flex items-center justify-between"
            style={{ background: 'linear-gradient(90deg, #fef08a50, #fde68a30)' }}>
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-amber-700">IPM Treatment Protocol</span>
              <CardTitle className="text-base font-extrabold text-amber-950 mt-0.5">
                {selectedPest.name}
              </CardTitle>
            </div>
            <div className="shrink-0 text-center bg-red-500/15 border border-red-400/30 px-3 py-1.5 rounded-lg">
              <span className="block text-[8px] uppercase font-black text-red-700/80 tracking-widest">Threat Risk</span>
              <strong className="text-sm font-black text-red-700">{selectedPest.riskScore}%</strong>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1">

            {/* Outbreak details */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-900">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Outbreak Zone: <strong>{selectedPest.location}</strong></span>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black text-amber-700">Observed Plant Symptoms</Label>
                <p className="text-xs text-amber-900/80 leading-relaxed p-3 rounded-lg border border-amber-200/60"
                  style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)' }}>
                  {selectedPest.symptoms}
                </p>
              </div>
            </div>

            {/* Chemical & Biological countermeasures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-200/60">

              {/* Biological control */}
              <div className="space-y-2 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Biological / Organic Control</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 leading-normal">
                    {selectedPest.organicControl}
                  </p>
                </div>
                <span className="text-[8px] font-black text-emerald-700 uppercase mt-4 block tracking-wide">Recommended First Action</span>
              </div>

              {/* Chemical control */}
              <div className="space-y-2 bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Chemical Pesticide Protocol</span>
                  </div>
                  <p className="text-[11px] text-red-900/80 leading-normal">
                    {selectedPest.chemicalControl}
                  </p>
                </div>
                <span className="text-[8px] font-black text-red-700 uppercase mt-4 block tracking-wide">Apply as Secondary Measure</span>
              </div>

            </div>

          </CardContent>
        </Card>

      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="pest_control" 
      />

    </div>
  );
}
