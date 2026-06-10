'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle2, User, Landmark, ShieldCheck, ClipboardCheck, Info, Calendar, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallHealthProfessionalModal } from '@/components/health/CallHealthProfessionalModal';

interface VaccineCenter {
  id: string;
  name: string;
  location: string;
  vaccines: string[];
  slotsAvailable: number;
}

const MOCK_CENTERS: VaccineCenter[] = [
  { id: 'cent-1', name: 'Sector 4 Civic Clinic Hub', location: 'Sector 4B North Ward', vaccines: ['Covishield', 'Covaxin', 'BCG'], slotsAvailable: 45 },
  { id: 'cent-2', name: 'Pune General Hospital Zone', location: 'District Central Hub', vaccines: ['Covishield', 'Rotavirus', 'Influenza'], slotsAvailable: 120 },
  { id: 'cent-3', name: 'NHM Mobile Immunization Van 3', location: 'Sector 4B South Ward', vaccines: ['Covaxin', 'OPV (Polio)'], slotsAvailable: 18 },
  { id: 'cent-4', name: 'Apex Pediatric Clinic Hub', location: 'Sector 4B West Ward', vaccines: ['BCG', 'MMR', 'Rotavirus'], slotsAvailable: 60 },
];

export default function VaccinationCoverage() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Health Services in sidebar
  useEffect(() => {
    setActiveTab('Health Services');
  }, [setActiveTab]);

  // Booking states
  const [centerId, setCenterId] = useState<string>('cent-1');
  const [vaccineType, setVaccineType] = useState<string>('Covishield');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string>('');
  const [isBooking, setIsBooking] = useState<boolean>(false);
  
  const handleBookSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setBookingSuccess(true);
      setTicketId(`VAC-REG-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  // SVG Chart data: Monday to Friday vaccination counts
  const CHART_DATA = [
    { day: 'Mon', count: 420 },
    { day: 'Tue', count: 580 },
    { day: 'Wed', count: 810 },
    { day: 'Thu', count: 960 },
    { day: 'Fri', count: 1220 },
  ];
  const maxCount = Math.max(...CHART_DATA.map(d => d.count));

  const activeCenter = MOCK_CENTERS.find(c => c.id === centerId) || MOCK_CENTERS[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/health" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-med-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Health Overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-black">
          Immunization Tracking
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Vaccination Coverage
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Verify district vaccination thresholds, examine booster achievements, and schedule immunization dose booking slots.
        </p>
      </div>

      {/* Coverage Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <Card className="bg-card border-border-subtle shadow-md p-5 space-y-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Pediatric Coverage</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200">92.4%</strong>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-med-green rounded-full" style={{ width: '92.4%' }} />
          </div>
          <span className="text-[9px] text-slate-450 font-semibold block">Target: 95.0% for Herd Immunity</span>
        </Card>

        {/* Metric 2 */}
        <Card className="bg-card border-border-subtle shadow-md p-5 space-y-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Adult Coverage</span>
            <strong className="text-2xl font-black text-slate-800 dark:text-slate-200">85.1%</strong>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-med-green rounded-full" style={{ width: '85.1%' }} />
          </div>
          <span className="text-[9px] text-slate-450 font-semibold block">First & Second Doses verified</span>
        </Card>

        {/* Metric 3 */}
        <Card className="bg-card border-border-subtle shadow-md p-5 space-y-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Senior Booster Dose</span>
            <strong className="text-2xl font-black text-amber-600">68.2%</strong>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '68.2%' }} />
          </div>
          <span className="text-[9px] text-amber-500 font-semibold block">Urgent: Influenza booster requested</span>
        </Card>

      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Custom SVG Daily doses Chart */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-md">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550">
              Daily Vaccine Doses Administered (Sector 4B)
            </CardTitle>
            <CardDescription className="text-xs">
              Weekly progress report tracking doses distributed at clinic hubs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between h-[300px]">
            
            {/* Custom SVG Column Chart */}
            <div className="flex-1 w-full relative pt-4 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 450 180">
                {/* Grid Lines */}
                <line x1="30" y1="20" x2="420" y2="20" className="stroke-slate-100 dark:stroke-slate-800/40" strokeWidth="1" />
                <line x1="30" y1="70" x2="420" y2="70" className="stroke-slate-100 dark:stroke-slate-800/40" strokeWidth="1" />
                <line x1="30" y1="120" x2="420" y2="120" className="stroke-slate-100 dark:stroke-slate-800/40" strokeWidth="1" />
                <line x1="30" y1="150" x2="420" y2="150" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />

                {/* Y-axis Labels */}
                <text x="22" y="24" className="text-[9px] fill-slate-400 font-bold" textAnchor="end">1,500</text>
                <text x="22" y="74" className="text-[9px] fill-slate-400 font-bold" textAnchor="end">1,000</text>
                <text x="22" y="124" className="text-[9px] fill-slate-400 font-bold" textAnchor="end">500</text>
                <text x="22" y="154" className="text-[9px] fill-slate-400 font-bold" textAnchor="end">0</text>

                {/* Bars */}
                {CHART_DATA.map((d, index) => {
                  const x = 50 + (index * 75);
                  const barHeight = (d.count / 1500) * 130;
                  const y = 150 - barHeight;
                  
                  return (
                    <g key={d.day} className="group">
                      {/* Column block */}
                      <rect
                        x={x}
                        y={y}
                        width="38"
                        height={barHeight}
                        className="fill-med-green/85 hover:fill-med-green transition-colors cursor-pointer"
                        rx="4"
                      />
                      {/* Tooltip value */}
                      <text
                        x={x + 19}
                        y={y - 6}
                        className="text-[10px] font-black fill-slate-800 dark:fill-slate-200 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                        textAnchor="middle"
                      >
                        {d.count}
                      </text>
                      {/* X-axis Label */}
                      <text
                        x={x + 19}
                        y="168"
                        className="text-[9px] font-bold fill-slate-400"
                        textAnchor="middle"
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex justify-between items-center text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-med-green" /> Total doses administered this week: <strong>3,990 doses</strong>
              </span>
              <span className="text-slate-400">Telemetry updated 2h ago</span>
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Dose Booking Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Reservation Card */}
          <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-indigo-650">
            <CardHeader className="pb-4 border-b border-border-subtle">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                Book Vaccination Slot
              </CardTitle>
              <CardDescription className="text-xs">
                Reserve immunisation doses at nearby health centers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {bookingSuccess ? (
                <div className="space-y-4 py-4 text-center animate-in fade-in duration-200">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 mx-auto flex items-center justify-center text-indigo-500">
                    <CheckCircle2 className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Immunization Appointment Booked</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-normal">
                    Your appointment at <strong>{activeCenter.name}</strong> is registered. Present this QR case code at registration.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-border-subtle p-2.5 rounded font-mono text-xs font-black text-indigo-600">
                    {ticketId}
                  </div>
                  <Button 
                    onClick={() => setBookingSuccess(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs h-9 cursor-pointer"
                  >
                    Register New Slot
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleBookSlot} className="space-y-4">
                  
                  {/* Select Center */}
                  <FormGroup label="Immunization Center">
                    <Select value={centerId} onChange={(e) => setCenterId(e.target.value)} className="h-10 text-xs">
                      {MOCK_CENTERS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </FormGroup>

                  {/* Select Vaccine */}
                  <FormGroup label="Vaccine Type">
                    <Select value={vaccineType} onChange={(e) => setVaccineType(e.target.value)} className="h-10 text-xs">
                      {activeCenter.vaccines.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </Select>
                  </FormGroup>

                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-border-subtle p-3 rounded-lg text-[10px] space-y-1 text-slate-500">
                    <div className="flex justify-between font-bold">
                      <span>Center Location:</span>
                      <span className="text-slate-800 dark:text-slate-200">{activeCenter.location}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Slots Free Today:</span>
                      <span className="text-indigo-650 font-black">{activeCenter.slotsAvailable} slots</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isBooking}
                    className="w-full h-10 text-xs font-semibold mt-4 bg-indigo-600 hover:bg-indigo-755 text-white cursor-pointer"
                  >
                    Confirm Vaccine Booking
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Guidelines info card */}
          <Card className="bg-card border-border-subtle shadow-md">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" /> Patient Immunization Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 text-xs">
                
                {/* Point 1 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Aadhaar Verification</strong>
                    <p className="text-[11px] text-slate-500">Ensure photo identification matches your case registration ticket details.</p>
                  </div>
                </div>

                {/* Point 2 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Post-Dose Observation</strong>
                    <p className="text-[11px] text-slate-500">Plan for a 15-minute post-dose observation period at the vaccination hub.</p>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      <CallHealthProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="vaccination" 
      />

    </div>
  );
}
