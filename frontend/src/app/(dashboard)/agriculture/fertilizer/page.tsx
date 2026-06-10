'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Activity, Droplet, Sprout, ClipboardList, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup } from '@/components/ui/form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

export default function FertilizerAdvisor() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Agriculture in sidebar
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  // Form states
  const [crop, setCrop] = useState<string>('Rice (Paddy)');
  const [nDeficit, setNDeficit] = useState<number>(30); // kg/ha
  const [pDeficit, setPDeficit] = useState<number>(20); // kg/ha
  const [kDeficit, setKDeficit] = useState<number>(15); // kg/ha
  const [soilType, setSoilType] = useState<string>('Loamy');

  // Calculated dosages
  const [urea, setUrea] = useState<number>(0);
  const [dap, setDap] = useState<number>(0);
  const [mop, setMop] = useState<number>(0);

  // Dosage computation formula
  useEffect(() => {
    // Urea is 46% Nitrogen. DAP is 46% Phosphorus and 18% Nitrogen. MOP is 60% Potassium.
    // If we apply DAP to meet P deficit, it also contributes some Nitrogen:
    // DAP amount = P_deficit / 0.46
    // Nitrogen contributed by DAP = DAP amount * 0.18
    // Remaining N deficit = N_deficit - Nitrogen contributed
    // Urea amount = Remaining N deficit / 0.46 (if positive)

    const calculatedDap = pDeficit / 0.46;
    const nFromDap = calculatedDap * 0.18;
    const remainingN = Math.max(0, nDeficit - nFromDap);
    const calculatedUrea = remainingN / 0.46;
    const calculatedMop = kDeficit / 0.60;

    setDap(Number(calculatedDap.toFixed(1)));
    setUrea(Number(calculatedUrea.toFixed(1)));
    setMop(Number(calculatedMop.toFixed(1)));

  }, [nDeficit, pDeficit, kDeficit]);

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
          Fertilizer Advisor
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Compute precise chemical fertilization dosages (Urea, DAP, MOP) and organic nutrient application schedules based on crop target deficits.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="fertilizer"
        title="Get a Certified Fertilizer Dosage Audit"
        description="An agricultural extension officer will visit your field with soil testing instruments and provide a certified NPK dosage plan, organic compost ratio, and application schedule."
        buttonLabel="Request Dosage Audit"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Soil Deficits & Audit Request */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Soil Deficit Parameters */}
          <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-sea-green">
            <CardHeader className="pb-4 border-b border-border-subtle">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                Soil Deficit Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Input target crop type and mineral deficits in kg/hectare.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Target Crop Select */}
              <FormGroup label="Target Crop">
                <Select value={crop} onChange={(e) => setCrop(e.target.value)} className="h-10 text-xs">
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnuts">Groundnuts</option>
                </Select>
              </FormGroup>

              {/* Soil Type Select */}
              <FormGroup label="Soil Texture">
                <Select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="h-10 text-xs">
                  <option value="Loamy">Loamy (Optimal)</option>
                  <option value="Clayey">Clayey (High retention)</option>
                  <option value="Sandy">Sandy (High leaching risk)</option>
                  <option value="Saline">Saline (Low uptake)</option>
                </Select>
              </FormGroup>

              {/* Nitrogen Deficit Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Nitrogen (N) Deficit</Label>
                  <span className="text-sea-green font-black">{nDeficit} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={nDeficit}
                  onChange={(e) => setNDeficit(Number(e.target.value))}
                  className="w-full accent-sea-green cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Phosphorus Deficit Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Phosphorus (P) Deficit</Label>
                  <span className="text-sea-green font-black">{pDeficit} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pDeficit}
                  onChange={(e) => setPDeficit(Number(e.target.value))}
                  className="w-full accent-sea-green cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Potassium Deficit Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Potassium (K) Deficit</Label>
                  <span className="text-sea-green font-black">{kDeficit} kg/ha</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={kDeficit}
                  onChange={(e) => setKDeficit(Number(e.target.value))}
                  className="w-full accent-sea-green cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>

          {/* Professional audit request card */}
          <Card className="bg-card border-border-subtle shadow-md p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dosage Audit Needed?</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Need an organic compost recommendation or custom dosage schedule? Schedule a visit with an agricultural extension officer.
            </p>
            <Button 
              onClick={() => setIsProfModalOpen(true)}
              className="w-full bg-sea-green hover:bg-dark-green text-white flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Request Professional Dosage Audit
            </Button>
          </Card>
        </div>

        {/* Right Column: Fertilizer Recommendations & Application Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Calculated Dosages Table — Pale Yellow */}
          <Card className="border-0 shadow-md overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 50%, #fefce8 100%)' }}>
            <CardHeader className="pb-3 border-b border-amber-200/60"
              style={{ background: 'linear-gradient(90deg, #fef08a40, #fde68a30)' }}>
              <CardTitle className="text-sm font-black uppercase tracking-wider text-amber-800">
                Calculated Fertilizer Dosage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-amber-200/50 hover:bg-amber-100/30">
                    <TableHead className="pl-6 text-amber-700 font-bold">Fertilizer Type</TableHead>
                    <TableHead className="text-amber-700 font-bold">Required Dosage</TableHead>
                    <TableHead className="text-amber-700 font-bold">Primary Nutrients Provided</TableHead>
                    <TableHead className="pr-6 text-amber-700 font-bold">Action Trigger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-amber-200/40 hover:bg-amber-100/40 transition-colors">
                    <TableCell className="font-bold pl-6 text-amber-950">Urea</TableCell>
                    <TableCell className="font-black text-amber-700 text-sm">{urea} kg / Hectare</TableCell>
                    <TableCell className="text-xs text-amber-800/70">46% Nitrogen (N)</TableCell>
                    <TableCell className="text-xs text-amber-600 pr-6 font-semibold">Basal + Top Dress</TableCell>
                  </TableRow>
                  <TableRow className="border-amber-200/40 hover:bg-amber-100/40 transition-colors">
                    <TableCell className="font-bold pl-6 text-amber-950">DAP (Diammonium Phosphate)</TableCell>
                    <TableCell className="font-black text-amber-700 text-sm">{dap} kg / Hectare</TableCell>
                    <TableCell className="text-xs text-amber-800/70">46% Phosphate (P) + 18% N</TableCell>
                    <TableCell className="text-xs text-amber-600 pr-6 font-semibold">Basal placement</TableCell>
                  </TableRow>
                  <TableRow className="border-amber-200/40 hover:bg-amber-100/40 transition-colors">
                    <TableCell className="font-bold pl-6 text-amber-950">MOP (Muriate of Potash)</TableCell>
                    <TableCell className="font-black text-amber-700 text-sm">{mop} kg / Hectare</TableCell>
                    <TableCell className="text-xs text-amber-800/70">60% Potassium (K)</TableCell>
                    <TableCell className="text-xs text-amber-600 pr-6 font-semibold">Split applications</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Application Split Schedule — Persian Blue */}
          <Card className="relative overflow-hidden border-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 70%, #3b82f6 100%)' }}>
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <CardHeader className="pb-3 border-b border-white/15 relative z-10">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-white">
                Split Application Schedule (Days from Sowing)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              <div className="space-y-5">

                {/* Basal Dose */}
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 backdrop-blur-sm">
                    B
                  </div>
                  <div className="space-y-1 flex-1">
                    <h5 className="text-xs font-black text-white">Basal Placement (Sowing Day 0)</h5>
                    <p className="text-[11px] text-blue-100 leading-normal font-medium">
                      Apply 100% of DAP ({dap} kg/ha) and 50% of MOP ({Math.round(mop * 0.5)} kg/ha) during soil tillage prep.
                      Add a starter dose of {Math.round(urea * 0.25)} kg/ha Urea.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Top Dressing 1 */}
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 backdrop-blur-sm">
                    T1
                  </div>
                  <div className="space-y-1 flex-1">
                    <h5 className="text-xs font-black text-white">Active Tillering Phase (Day 25-30)</h5>
                    <p className="text-[11px] text-blue-100 leading-normal font-medium">
                      Broadcast top-dressing of 50% of Urea ({Math.round(urea * 0.5)} kg/ha) to support rapid vegetative growth.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Top Dressing 2 */}
                <div className="flex gap-3 items-start">
                  <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 backdrop-blur-sm">
                    T2
                  </div>
                  <div className="space-y-1 flex-1">
                    <h5 className="text-xs font-black text-white">Panicle Initiation Phase (Day 55-60)</h5>
                    <p className="text-[11px] text-blue-100 leading-normal font-medium">
                      Apply the remaining 25% of Urea ({Math.round(urea * 0.25)} kg/ha) and 50% of MOP ({Math.round(mop * 0.5)} kg/ha)
                      to optimize seed setting.
                    </p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="soil_check" 
      />

    </div>
  );
}
