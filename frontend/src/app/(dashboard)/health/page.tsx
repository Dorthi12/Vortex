'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HeartPulse, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  Search, 
  Plus, 
  AlertTriangle, 
  Sparkles,
  Info,
  MapPin,
  Map,
  Flame,
  Award,
  Star,
  Users,
  Phone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallHealthProfessionalModal } from '@/components/health/CallHealthProfessionalModal';
import { CallHealthProfessionalBanner } from '@/components/health/CallHealthProfessionalBanner';

interface ChemistMedicine {
  name: string;
  stock: number;
  price: number;
  available: boolean;
}

interface NearbyChemist {
  id: string;
  name: string;
  location: string;
  distance: string;
  phone: string;
  medicines: ChemistMedicine[];
}

interface HospitalReview {
  reviewerName: string;
  rating: number;
  date: string;
  comment: string;
}

interface DistrictHospital {
  name: string;
  rating: number;
  reviewsCount: number;
  reviews: HospitalReview[];
}

const MOCK_CHEMISTS: NearbyChemist[] = [
  {
    id: 'ch-1',
    name: 'Sector 4B Wellness Pharmacy',
    location: 'Shop 12, Market Rd, Sector 4B, Pune',
    distance: '0.8 km',
    phone: '+91 20 2555 6789',
    medicines: [
      { name: 'Paracetamol', stock: 150, price: 15, available: true },
      { name: 'Amoxicillin 500mg', stock: 45, price: 80, available: true },
      { name: 'Insulin Glargine', stock: 8, price: 420, available: true },
      { name: 'Ibuprofen 400mg', stock: 200, price: 25, available: true },
      { name: 'Azithromycin 250mg', stock: 30, price: 120, available: true },
      { name: 'Amlodipine 5mg', stock: 180, price: 30, available: true },
      { name: 'Atorvastatin 10mg', stock: 90, price: 95, available: true },
    ]
  },
  {
    id: 'ch-2',
    name: 'Arogya Chemists & Druggists',
    location: 'Block C Plaza, Near Civic Chowk, Pune',
    distance: '1.5 km',
    phone: '+91 20 2444 1122',
    medicines: [
      { name: 'Paracetamol', stock: 300, price: 14, available: true },
      { name: 'Amoxicillin 500mg', stock: 0, price: 85, available: false },
      { name: 'Insulin Glargine', stock: 0, price: 410, available: false },
      { name: 'Ibuprofen 400mg', stock: 120, price: 24, available: true },
      { name: 'Oral Rehydration Salts (ORS)', stock: 500, price: 10, available: true },
      { name: 'Azithromycin 250mg', stock: 0, price: 125, available: false },
      { name: 'Amlodipine 5mg', stock: 250, price: 28, available: true },
    ]
  },
  {
    id: 'ch-3',
    name: 'Metro Pharma & Surgical',
    location: 'Apex Enclave, Bypass Highway, Pune',
    distance: '2.4 km',
    phone: '+91 20 2666 8899',
    medicines: [
      { name: 'Paracetamol', stock: 50, price: 18, available: true },
      { name: 'Amoxicillin 500mg', stock: 120, price: 90, available: true },
      { name: 'Insulin Glargine', stock: 15, price: 450, available: true },
      { name: 'Ibuprofen 400mg', stock: 60, price: 30, available: true },
      { name: 'Oral Rehydration Salts (ORS)', stock: 200, price: 12, available: true },
      { name: 'Azithromycin 250mg', stock: 80, price: 110, available: true },
      { name: 'Atorvastatin 10mg', stock: 140, price: 100, available: true },
    ]
  },
  {
    id: 'ch-4',
    name: 'Lifeline Medico',
    location: 'Sector 4B North Chowk, Pune',
    distance: '3.1 km',
    phone: '+91 20 2333 4455',
    medicines: [
      { name: 'Paracetamol', stock: 400, price: 12, available: true },
      { name: 'Amoxicillin 500mg', stock: 10, price: 75, available: true },
      { name: 'Insulin Glargine', stock: 2, price: 400, available: true },
      { name: 'Oral Rehydration Salts (ORS)', stock: 1000, price: 8, available: true },
      { name: 'Amlodipine 5mg', stock: 0, price: 25, available: false },
      { name: 'Atorvastatin 10mg', stock: 300, price: 90, available: true },
    ]
  }
];

const DISTRICT_HOSPITALS_REVIEWS: DistrictHospital[] = [
  {
    name: 'Pune Central Medical Hospital',
    rating: 4.8,
    reviewsCount: 240,
    reviews: [
      { reviewerName: 'Ramesh Gawde', rating: 5, date: '2026-06-02', comment: 'The ICU staff responded extremely fast. Cashless registration under Ayushman Bharat card worked seamlessly.' },
      { reviewerName: 'Suresh Deshmukh', rating: 4, date: '2026-05-28', comment: 'Doctor checkup was excellent, but the general ward bed queue took around 45 minutes to process.' }
    ]
  },
  {
    name: 'Sector 4 Civic Care Hospital',
    rating: 4.5,
    reviewsCount: 98,
    reviews: [
      { reviewerName: 'Sunita Patil', rating: 5, date: '2026-06-08', comment: 'Clean municipal clinic. We booked a pediatric Rotavirus vaccine slot online and got the dose within 10 minutes.' },
      { reviewerName: 'Anil Joshi', rating: 4, date: '2026-06-01', comment: 'Cooperative doctors, and paracetamol stocks are always full.' }
    ]
  },
  {
    name: 'Apex Emergency Trauma Hub',
    rating: 4.9,
    reviewsCount: 480,
    reviews: [
      { reviewerName: 'Vikram Shinde', rating: 5, date: '2026-06-09', comment: 'Life-saving emergency response. The dispatched ambulance reached our bypass location in exactly 8 minutes with complete life support.' },
      { reviewerName: 'Priya Verma', rating: 5, date: '2026-06-05', comment: 'Best cardiac emergency triage unit in Pune. Highly professional paramedics.' }
    ]
  },
  {
    name: 'City Biotech Research Hospital',
    rating: 4.6,
    reviewsCount: 150,
    reviews: [
      { reviewerName: 'Meera Nair', rating: 5, date: '2026-05-30', comment: 'Very advanced diagnostic laboratory. Ultrasound and sonography costs are clearly listed and fair.' },
      { reviewerName: 'Rohan Malhotra', rating: 4, date: '2026-05-25', comment: 'Quality treatment and clean facilities. Staff conducts are professional.' }
    ]
  }
];

export default function HealthOverview() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<'ambulance' | 'outbreak' | 'hospital' | 'vaccination' | 'general'>('general');

  // Highlight Health Services in sidebar
  useEffect(() => {
    setActiveTab('Health Services');
  }, [setActiveTab]);

  // Telemetry Variables to Simulate Health Risk Index
  const [activeOutbreaks, setActiveOutbreaks] = useState<number>(2);
  const [icuOccupancy, setIcuOccupancy] = useState<number>(78);
  const [criticalMeds, setCriticalMeds] = useState<number>(2);
  const [riskIndex, setRiskIndex] = useState<number>(34);

  // Recalculate Risk Index when inputs change
  useEffect(() => {
    const calculatedRisk = Math.min(99, Math.round(
      (activeOutbreaks * 12) + 
      ((icuOccupancy - 50) * 0.8) + 
      (criticalMeds * 8) + 
      12
    ));
    setRiskIndex(calculatedRisk);
  }, [activeOutbreaks, icuOccupancy, criticalMeds]);

  // Chemists Search and Filter
  const [searchQuery, setSearchQuery] = useState<string>('Paracetamol');
  const [filterType, setFilterType] = useState<'All' | 'In Stock' | 'Under 2km'>('All');

  const filteredChemists = MOCK_CHEMISTS.filter((chemist) => {
    const matchedMed = chemist.medicines.find(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const sellsMedicine = searchQuery === '' || !!matchedMed;
    
    if (filterType === 'In Stock') {
      return sellsMedicine && (matchedMed ? matchedMed.stock > 0 : false);
    }
    if (filterType === 'Under 2km') {
      const distVal = parseFloat(chemist.distance);
      return sellsMedicine && distVal < 2.0;
    }
    
    return sellsMedicine;
  });

  const openServiceModal = (srv: 'ambulance' | 'outbreak' | 'hospital' | 'vaccination' | 'general') => {
    setSelectedService(srv);
    setIsProfModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-med-green font-black dark:text-med-green-light">
          District Health & Welfare Telemetry
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Health Intelligence Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Monitor epidemic outbreak containment, medical center bed capacities, pharmaceutical inventories, and coordinate emergency dispatch ETAs.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallHealthProfessionalBanner
        variant="general"
        title="Need Emergency Health Coordination?"
        description="A municipal health officer can fast-track critical patient admissions, schedule emergency ambulance dispatches, or book localized vaccine batches."
        buttonLabel="Request Medical Support"
        onCallClick={() => openServiceModal('general')}
      />

      {/* Quick Access Services Grid (2x2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Outbreak Containment Map (Emergency Red) */}
        <Link href="/outbreaks" className="group no-underline block">
          <Card className="h-full border-0 shadow-md p-5 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fef2f2 100%)' }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:16px_16px]" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-200/40 flex items-center justify-center text-emerg-red shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-red-700">Epidemic Watch</span>
                <h3 className="text-base font-black text-red-950 mt-0.5 group-hover:text-emerg-red transition-colors">
                  Outbreak Containment Map &rarr;
                </h3>
                <p className="text-xs text-red-800/80 mt-1 font-medium leading-relaxed">
                  Track infection vectors, regional sanitation grades, and active quarantine boundaries.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 2: Bed Capacity & Tests (Medical Green) */}
        <Link href="/hospitals" className="group no-underline block">
          <Card className="h-full border-0 shadow-md p-5 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)' }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:16px_16px]" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-200/40 flex items-center justify-center text-med-green shrink-0 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-850">Admissions &amp; Cost Registry</span>
                <h3 className="text-base font-black text-emerald-950 mt-0.5 group-hover:text-med-green transition-colors">
                  Bed Capacity &amp; Diagnostic Pricing &rarr;
                </h3>
                <p className="text-xs text-emerald-900/80 mt-1 font-medium leading-relaxed">
                  Book general/ICU beds, check Ultrasound &amp; Sonography rates, and report misconduct.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 3: Scheme Vaccine Booking (Indigo/Purple) */}
        <Link href="/vaccinations" className="group no-underline block">
          <Card className="h-full border-0 shadow-md p-5 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 50%, #f5f3ff 100%)' }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:16px_16px]" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-200/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-indigo-700">Immunization drives</span>
                <h3 className="text-base font-black text-indigo-950 mt-0.5 group-hover:text-indigo-650 transition-colors">
                  Scheme Vaccine Booking Portal &rarr;
                </h3>
                <p className="text-xs text-indigo-900/80 mt-1 font-medium leading-relaxed">
                  Book pediatric or booster vaccine slots under government schemes and view dose metrics.
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {/* Card 4: Ambulance Live GPS (Slate/Blue) */}
        <Link href="/ambulances" className="group no-underline block">
          <Card className="h-full border-0 shadow-md p-5 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)' }}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_#000_1px,_transparent_1px)] bg-[size:16px_16px]" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-slate-500/10 border border-slate-200/40 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-650">Emergency Transit</span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-slate-600 transition-colors">
                  Ambulance Live GPS Fleet Tracker &rarr;
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Monitor active dispatch units, check ETAs, and request prompt ambulance response.
                </p>
              </div>
            </div>
          </Card>
        </Link>

      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Health Risk Index & Affected Cases */}
        <Card className="bg-card border-border-subtle shadow-md flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-2">
              <Activity className="w-4 h-4 text-med-green" />
              Health Risk Index
            </CardTitle>
            <CardDescription className="text-xs">
              Risk quotient based on active cases.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex flex-col justify-between space-y-4 flex-1">
            
            {/* Risk Gauge Circle */}
            <div className="flex items-center gap-4 justify-center py-2">
              <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className={cn(
                      "transition-all duration-1000 ease-out",
                      riskIndex > 60 ? "stroke-emerg-red" : riskIndex > 40 ? "stroke-amber-500" : "stroke-med-green"
                    )}
                    strokeWidth="8"
                    strokeDasharray={251}
                    strokeDashoffset={251 - (251 * riskIndex) / 100}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="text-center relative z-10">
                  <span className="block text-lg font-black text-slate-900 dark:text-slate-100">{riskIndex}%</span>
                  <span className="text-[6px] font-extrabold uppercase text-slate-400 block tracking-widest leading-none">Risk Score</span>
                </div>
              </div>

              {/* Localized Telemetry Data (10 km affected cases) */}
              <div className="space-y-1.5 flex-1">
                <div className="space-y-0.5">
                  <span className="block text-[8px] uppercase font-bold text-slate-400 leading-none">Localized Outbreak</span>
                  <strong className="text-xs font-black text-emerg-red flex items-center gap-1 leading-none mt-1">
                    <Flame className="w-3.5 h-3.5" />
                    342 Active Cases
                  </strong>
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Within 10 km radius</span>
                </div>

                <div className="space-y-0.5">
                  <span className="block text-[8px] uppercase font-bold text-slate-400 leading-none">Spreading Vector</span>
                  <span className="text-[10px] text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 mt-0.5 leading-none">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Dengue Type-2 / H1N1
                  </span>
                </div>
              </div>
            </div>

            {/* Simulators */}
            <div className="w-full space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
              <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">Live Simulation Controls</span>
              
              {/* Outbreaks slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <Label>Active Outbreak Hotspots</Label>
                  <span className="font-extrabold">{activeOutbreaks} zones</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={activeOutbreaks}
                  onChange={(e) => setActiveOutbreaks(Number(e.target.value))}
                  className="w-full accent-med-green cursor-pointer h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* ICU Occupancy slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <Label>ICU Bed Occupancy</Label>
                  <span className="font-extrabold">{icuOccupancy}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="98"
                  value={icuOccupancy}
                  onChange={(e) => setIcuOccupancy(Number(e.target.value))}
                  className="w-full accent-med-green cursor-pointer h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Column 2: Disease Containment Map Preview */}
        <Card className="bg-card border-border-subtle shadow-md flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <Map className="w-4 h-4 text-emerg-red" />
              Containment Zones
            </CardTitle>
            <CardDescription className="text-xs">
              Interactive local quarantine zones (10 km).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-lg p-2 flex items-center justify-center">
              <svg viewBox="0 0 200 120" className="w-full h-auto drop-shadow-xs">
                {/* Sector A - North (Pulsing Red) */}
                <path
                  d="M 20,15 L 110,15 L 100,60 L 20,60 Z"
                  className="fill-red-500/20 stroke-emerg-red stroke-[1.5] animate-pulse"
                />
                <circle cx="60" cy="35" r="8" className="fill-emerg-red/30 stroke-emerg-red stroke-[0.5]" />
                <circle cx="60" cy="35" r="2.5" className="fill-emerg-red animate-ping" />
                <text x="60" y="48" className="text-[7px] font-black fill-emerg-red" textAnchor="middle">
                  Ward A [10km Active]
                </text>

                {/* Sector B - East (Stable Green) */}
                <path
                  d="M 110,15 L 180,15 L 180,70 L 100,60 Z"
                  className="fill-emerald-500/10 stroke-med-green stroke-[1]"
                />

                {/* Sector C - South (Warning Amber) */}
                <path
                  d="M 20,60 L 100,60 L 115,105 L 35,105 Z"
                  className="fill-amber-500/15 stroke-amber-500 stroke-[1]"
                />

                {/* Sector D - West (Stable Green) */}
                <path
                  d="M 100,60 L 180,70 L 165,105 L 115,105 Z"
                  className="fill-emerald-500/10 stroke-med-green stroke-[1]"
                />
              </svg>
            </div>
            
            <div className="mt-3 text-[10px] text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-850 pt-2 font-medium">
              <strong className="text-emerg-red">Containment Zone Active:</strong> Ward A has a high vector outbreak probability. Public gatherings are restricted.
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Scheme Vaccinations Tracker */}
        <Card className="bg-card border-border-subtle shadow-md flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-650 dark:text-indigo-450" />
              Govt Scheme Vaccinations
            </CardTitle>
            <CardDescription className="text-xs">
              Immunizations given under national schemes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
            
            {/* Total vaccination counter */}
            <div className="flex items-baseline justify-between bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-border-subtle">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Administered:</span>
              <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400">45,210 Doses</strong>
            </div>

            {/* Doses breakdown */}
            <div className="space-y-1.5 text-[10px] leading-none">
              
              {/* Vaccine 1 */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-650 dark:text-slate-400">
                  <span>Pediatric Polio drops</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">18,200 (91%)</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '91%' }} />
                </div>
              </div>

              {/* Vaccine 2 */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-650 dark:text-slate-400">
                  <span>Rotavirus Shield</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">14,350 (84%)</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '84%' }} />
                </div>
              </div>

              {/* Vaccine 3 */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-650 dark:text-slate-400">
                  <span>H1N1 Influenza Booster</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">12,660 (79%)</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: '79%' }} />
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 dark:border-slate-850 pt-2 flex items-center justify-between text-[10px] text-slate-550">
              <span>Immunization Target:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">90.4% Reached</span>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Schemes & Patient Reviews Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Government Schemes & Health Benefits */}
        <Card className="lg:col-span-1 bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-med-green" />
              Government Scheme Benefits
            </CardTitle>
            <CardDescription className="text-xs">
              Cashless hospital credits and subsidy allotments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            {/* Benefit 1 */}
            <div className="p-3 rounded-lg border border-border-subtle bg-slate-50/50 dark:bg-slate-950/30 flex gap-3">
              <span className="h-7 w-7 rounded bg-emerald-500/15 text-med-green font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                AB
              </span>
              <div className="space-y-0.5 leading-normal">
                <strong className="text-xs font-bold text-slate-905 dark:text-slate-105">Ayushman Bharat Coverage</strong>
                <p className="text-[10px] text-slate-500 font-medium">Provides cashless secondary/tertiary hospitalization of up to ₹5 Lakhs per family per year.</p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="p-3 rounded-lg border border-border-subtle bg-slate-50/50 dark:bg-slate-950/30 flex gap-3">
              <span className="h-7 w-7 rounded bg-indigo-500/15 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                IS
              </span>
              <div className="space-y-0.5 leading-normal">
                <strong className="text-xs font-bold text-slate-905 dark:text-slate-105">National Immunization Scheme</strong>
                <p className="text-[10px] text-slate-500 font-medium">Provides 100% free dose bookings (BCG, Polio, Rotavirus, Influenza) at municipal centers.</p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="p-3 rounded-lg border border-border-subtle bg-slate-50/50 dark:bg-slate-950/30 flex gap-3">
              <span className="h-7 w-7 rounded bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                MC
              </span>
              <div className="space-y-0.5 leading-normal">
                <strong className="text-xs font-bold text-slate-905 dark:text-slate-105">Senior Citizen Medical Credit</strong>
                <p className="text-[10px] text-slate-500 font-medium">Allots ₹10,000 credit for chronic medicine refills at certified government pharmacies.</p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Hospital Directory & Reviews */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-2">
              <Users className="w-4 h-4 text-med-green" />
              District Hospitals Patient Directory & Reviews
            </CardTitle>
            <CardDescription className="text-xs">
              Live feedback, satisfaction ratings, and written testimonials from visiting patients.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-[310px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
            {DISTRICT_HOSPITALS_REVIEWS.map((hosp, idx) => (
              <div key={idx} className="p-4 space-y-3 hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                
                {/* Hospital Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{hosp.name}</h4>
                    <span className="text-[9px] text-slate-400 font-semibold">{hosp.reviewsCount} verified checkins</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded text-[10px] font-black text-amber-700">
                    <Star className="w-3 h-3 fill-amber-500 stroke-none" />
                    {hosp.rating}
                  </div>
                </div>

                {/* Patient reviews scroller */}
                <div className="space-y-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                  {hosp.reviews.map((rev, revIdx) => (
                    <div key={revIdx} className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-bold text-slate-450">
                        <span>Patient: {rev.reviewerName}</span>
                        <span>{rev.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-605 dark:text-slate-355 leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* Nearby Chemists & Druggists Stock Locator */}
      <Card className="bg-card border-border-subtle shadow-md">
        <CardHeader className="pb-3 border-b border-border-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550 flex items-center gap-2">
              <Plus className="w-4 h-4 text-med-green" />
              Nearby Chemists &amp; Druggists locator
            </CardTitle>
            <CardDescription className="text-xs">
              Search for desired medicines to check stock levels and prices at local pharmacies.
            </CardDescription>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search desired medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs w-[200px] bg-slate-50/50 dark:bg-slate-900/50"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center border border-border-subtle rounded-md overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              {([
                { id: 'All', label: 'All Stores' },
                { id: 'In Stock', label: 'In Stock Only' },
                { id: 'Under 2km', label: 'Under 2 km' }
              ] as const).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-extrabold uppercase border-r border-border-subtle last:border-r-0 transition-colors",
                    filterType === filter.id 
                      ? "bg-med-green text-white" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-slate-50/20">
                <TableHead className="pl-6 font-bold text-xs">Chemist &amp; Druggist Shop</TableHead>
                <TableHead className="font-bold text-xs">Location &amp; Distance</TableHead>
                <TableHead className="font-bold text-xs">Matched Medicine</TableHead>
                <TableHead className="font-bold text-xs text-right">Price (INR)</TableHead>
                <TableHead className="font-bold text-xs text-center">Stock Status</TableHead>
                <TableHead className="pr-6 font-bold text-xs text-right">Quick Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChemists.length > 0 ? (
                filteredChemists.map((chemist) => {
                  const matchedMed = chemist.medicines.find(m => 
                    m.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  return (
                    <TableRow key={chemist.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                      <TableCell className="font-bold pl-6 text-slate-900 dark:text-slate-100 text-xs">
                        <div className="space-y-0.5">
                          <span className="block font-black text-slate-805 dark:text-slate-195">{chemist.name}</span>
                          <span className="text-[10px] text-slate-450 font-semibold">{chemist.phone}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-xs text-slate-500">
                        <div className="space-y-0.5">
                          <span className="block truncate max-w-[180px]">{chemist.location}</span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500/10 text-med-green border border-emerald-250/20 rounded-full">
                            <MapPin className="w-2.5 h-2.5" />
                            {chemist.distance}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        {searchQuery ? (
                          <span className="font-bold text-slate-900 dark:text-slate-100">{matchedMed?.name || searchQuery}</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {chemist.medicines.slice(0, 3).map((m, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
                                {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-xs font-black text-right text-slate-800 dark:text-slate-200">
                        {searchQuery && matchedMed ? (
                          <span>₹{matchedMed.price}</span>
                        ) : (
                          <span className="text-slate-450 font-normal">Various rates</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {searchQuery && matchedMed ? (
                          <span className={cn(
                            "inline-flex items-center justify-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            matchedMed.stock > 0 
                              ? "bg-emerald-500/15 text-med-green border-emerald-250/30" 
                              : "bg-red-500/15 text-emerg-red border-red-200/30"
                          )}>
                            {matchedMed.stock > 0 ? `${matchedMed.stock} In Stock` : 'Out of Stock'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/15 text-med-green border-emerald-250/30">
                            Store Open
                          </span>
                        )}
                      </TableCell>
                      
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`tel:${chemist.phone}`)}
                          className="text-[10px] font-extrabold cursor-pointer text-med-green hover:text-emerald-800 flex items-center gap-1 justify-end ml-auto"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call Pharmacist
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-slate-400">
                    <Info className="w-5 h-5 mx-auto mb-1 text-slate-350" />
                    No nearby chemists found matching the criteria. Try a different medicine or filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CallHealthProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService={selectedService} 
      />

    </div>
  );
}
