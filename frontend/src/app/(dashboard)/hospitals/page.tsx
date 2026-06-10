'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  HeartPulse, 
  Phone, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Landmark, 
  ClipboardCheck, 
  Info, 
  Map, 
  Plus, 
  FileText, 
  Search, 
  Activity, 
  PlusCircle, 
  Check 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup, Textarea } from '@/components/ui/form';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallHealthProfessionalModal } from '@/components/health/CallHealthProfessionalModal';

interface MedicineStock {
  name: string;
  stock: number;
  unit: string;
  status: 'Critical' | 'Low' | 'Normal';
}

interface TestCost {
  testName: string;
  cost: number;
  duration: string;
}

interface Hospital {
  id: string;
  name: string;
  type: string;
  location: string;
  generalBeds: { available: number; total: number };
  icuBeds: { available: number; total: number };
  ventilators: { available: number; total: number };
  phone: string;
  queueTime: number; // mins
  status: 'Critical' | 'Warning' | 'Stable';
  routeInfo: {
    distance: string;
    eta: string;
    steps: string[];
  };
  medInventory: MedicineStock[];
  testCosts: TestCost[];
}

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'Pune Central Medical Hospital',
    type: 'Government Apex Hospital',
    location: 'Sector 4B North Main St, Pune',
    generalBeds: { available: 142, total: 500 },
    icuBeds: { available: 6, total: 80 },
    ventilators: { available: 4, total: 30 },
    phone: '+91 20 2612 3456',
    queueTime: 45,
    status: 'Warning',
    routeInfo: {
      distance: '3.2 km',
      eta: '8 mins',
      steps: [
        'Head North on Main Ave towards Sector 4 Loop (400m).',
        'Turn right onto Central Link Road (1.8 km).',
        'Turn left onto North Main St (1.0 km).',
        'Destination will be on your left.'
      ]
    },
    medInventory: [
      { name: 'Paracetamol', stock: 4200, unit: 'Tablets', status: 'Normal' },
      { name: 'Amoxicillin', stock: 80, unit: 'Tablets', status: 'Critical' },
      { name: 'Insulin Glargine', stock: 12, unit: 'Vials', status: 'Critical' },
      { name: 'Ibuprofen', stock: 300, unit: 'Tablets', status: 'Low' }
    ],
    testCosts: [
      { testName: 'Ultrasound Scan', cost: 1200, duration: '2h delivery' },
      { testName: 'Sonography (Abdomen)', cost: 1500, duration: '1h delivery' },
      { testName: 'X-Ray Chest', cost: 600, duration: '30m delivery' },
      { testName: 'ECG Cardiac', cost: 450, duration: '15m delivery' },
      { testName: 'CBC Blood Count', cost: 300, duration: '4h delivery' }
    ]
  },
  {
    id: 'hosp-2',
    name: 'Sector 4 Civic Care Hospital',
    type: 'Municipal Clinic',
    location: 'Sector 4B East Link Rd, Pune',
    generalBeds: { available: 48, total: 100 },
    icuBeds: { available: 12, total: 20 },
    ventilators: { available: 2, total: 5 },
    phone: '+91 20 2688 1122',
    queueTime: 15,
    status: 'Stable',
    routeInfo: {
      distance: '1.4 km',
      eta: '4 mins',
      steps: [
        'Head East on Central Link Ave (800m).',
        'Turn left at Civic Chowk onto East Link Rd (600m).',
        'Clinic will be on your right next to ration hub.'
      ]
    },
    medInventory: [
      { name: 'Paracetamol', stock: 8000, unit: 'Tablets', status: 'Normal' },
      { name: 'Amoxicillin', stock: 1200, unit: 'Tablets', status: 'Normal' },
      { name: 'Oral Rehydration Salts', stock: 6000, unit: 'Sachets', status: 'Normal' },
      { name: 'Insulin Glargine', stock: 80, unit: 'Vials', status: 'Low' }
    ],
    testCosts: [
      { testName: 'Ultrasound Scan', cost: 1000, duration: '4h delivery' },
      { testName: 'Sonography (Abdomen)', cost: 1300, duration: '2h delivery' },
      { testName: 'X-Ray Chest', cost: 500, duration: '45m delivery' },
      { testName: 'ECG Cardiac', cost: 400, duration: '20m delivery' }
    ]
  },
  {
    id: 'hosp-3',
    name: 'Apex Emergency Trauma Hub',
    type: 'Super-Specialty Trauma Hub',
    location: 'Bypass Highway Sector 4, Pune',
    generalBeds: { available: 14, total: 120 },
    icuBeds: { available: 1, total: 40 },
    ventilators: { available: 0, total: 25 },
    phone: '+91 20 2633 9999',
    queueTime: 85,
    status: 'Critical',
    routeInfo: {
      distance: '5.6 km',
      eta: '12 mins',
      steps: [
        'Head South towards Bypass Hwy (1.2 km).',
        'Merge onto Southern Link Bypass (3.4 km).',
        'Take the trauma exit (1.0 km).',
        'Destination is directly ahead at the medical enclave.'
      ]
    },
    medInventory: [
      { name: 'Paracetamol', stock: 1500, unit: 'Tablets', status: 'Low' },
      { name: 'Insulin Glargine', stock: 2, unit: 'Vials', status: 'Critical' },
      { name: 'Amoxicillin', stock: 15, unit: 'Tablets', status: 'Critical' }
    ],
    testCosts: [
      { testName: 'Ultrasound Scan', cost: 1800, duration: '1h delivery' },
      { testName: 'Sonography (Abdomen)', cost: 2200, duration: '30m delivery' },
      { testName: 'X-Ray Chest', cost: 800, duration: '15m delivery' },
      { testName: 'ECG Cardiac', cost: 600, duration: '10m delivery' },
      { testName: 'CT Scan Brain', cost: 3500, duration: '1h delivery' }
    ]
  },
  {
    id: 'hosp-4',
    name: 'City Biotech Research Hospital',
    type: 'Private Trust Hospital',
    location: 'Bypass West Enclave, Pune',
    generalBeds: { available: 94, total: 180 },
    icuBeds: { available: 18, total: 30 },
    ventilators: { available: 9, total: 15 },
    phone: '+91 20 2655 4433',
    queueTime: 20,
    status: 'Stable',
    routeInfo: {
      distance: '4.8 km',
      eta: '10 mins',
      steps: [
        'Head West towards Bypass Hwy (1.5 km).',
        'Take the West Enclave slip road (2.5 km).',
        'At the roundabout, take the 3rd exit (800m).',
        'Hospital entrance is on your right.'
      ]
    },
    medInventory: [
      { name: 'Paracetamol', stock: 5000, unit: 'Tablets', status: 'Normal' },
      { name: 'Amoxicillin', stock: 2200, unit: 'Tablets', status: 'Normal' },
      { name: 'Insulin Glargine', stock: 180, unit: 'Vials', status: 'Normal' }
    ],
    testCosts: [
      { testName: 'Ultrasound Scan', cost: 1400, duration: '1.5h delivery' },
      { testName: 'Sonography (Abdomen)', cost: 1800, duration: '45m delivery' },
      { testName: 'X-Ray Chest', cost: 700, duration: '20m delivery' },
      { testName: 'ECG Cardiac', cost: 500, duration: '15m delivery' }
    ]
  }
];

export default function HospitalCapacity() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [selectedHospId, setSelectedHospId] = useState<string>('hosp-1');
  const [inspectTab, setInspectTab] = useState<'booking' | 'tests' | 'pharmacy' | 'route' | 'complaint'>('booking');

  // Highlight Health Services in sidebar
  useEffect(() => {
    setActiveTab('Health Services');
  }, [setActiveTab]);

  // Bed booking form state
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bedType, setBedType] = useState<string>( 'General Bed');

  // Add hospital form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addLocation, setAddLocation] = useState<string>('');
  const [addType, setAddType] = useState<string>('Municipal Clinic');
  const [addGenBeds, setAddGenBeds] = useState<number>(80);
  const [addIcuBeds, setAddIcuBeds] = useState<number>(15);
  const [addVents, setAddVents] = useState<number>(5);
  const [addPhone, setAddPhone] = useState<string>('+91 20 ');

  // Complaint form state
  const [complaintSuccess, setComplaintSuccess] = useState<boolean>(false);
  const [complaintId, setComplaintId] = useState<string>('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState<boolean>(false);
  const [complaintCategory, setComplaintCategory] = useState<string>('Improper conduct');
  const [complaintText, setComplaintText] = useState<string>('');

  const activeHosp = hospitals.find(h => h.id === selectedHospId) || hospitals[0];

  const handleBookBed = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setBookingSuccess(true);
      setBookingId(`BED-RES-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  const handleAddHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addLocation) return;

    const newHosp: Hospital = {
      id: `hosp-${hospitals.length + 1}`,
      name: addName,
      type: addType,
      location: addLocation,
      generalBeds: { available: addGenBeds, total: addGenBeds },
      icuBeds: { available: addIcuBeds, total: addIcuBeds },
      ventilators: { available: addVents, total: addVents },
      phone: addPhone || '+91 20 5555 1234',
      queueTime: Math.floor(10 + Math.random() * 30),
      status: 'Stable',
      routeInfo: {
        distance: `${(2 + Math.random() * 5).toFixed(1)} km`,
        eta: `${Math.floor(5 + Math.random() * 10)} mins`,
        steps: [
          'Head towards Sector 4 junction.',
          `Merge onto local highway towards ${addLocation}.`,
          'Destination will be directly visible next to landmarks.'
        ]
      },
      medInventory: [
        { name: 'Paracetamol', stock: 2000, unit: 'Tablets', status: 'Normal' },
        { name: 'Amoxicillin', stock: 150, unit: 'Tablets', status: 'Low' },
        { name: 'Insulin Glargine', stock: 35, unit: 'Vials', status: 'Normal' }
      ],
      testCosts: [
        { testName: 'Ultrasound Scan', cost: 1100, duration: '3h delivery' },
        { testName: 'Sonography (Abdomen)', cost: 1400, duration: '1.5h delivery' },
        { testName: 'X-Ray Chest', cost: 550, duration: '30m delivery' },
        { testName: 'ECG Cardiac', cost: 420, duration: '15m delivery' }
      ]
    };

    setHospitals([...hospitals, newHosp]);
    setSelectedHospId(newHosp.id);
    
    // Reset form
    setAddName('');
    setAddLocation('');
    setAddPhone('+91 20 ');
    setShowAddForm(false);
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText) return;

    setIsSubmittingComplaint(true);
    setTimeout(() => {
      setIsSubmittingComplaint(false);
      setComplaintSuccess(true);
      setComplaintId(`TKT-COMP-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  // Calculate global bed capacity stats
  const totalAvailBeds = hospitals.reduce((acc, curr) => acc + curr.generalBeds.available + curr.icuBeds.available, 0);
  const totalTotalBeds = hospitals.reduce((acc, curr) => acc + curr.generalBeds.total + curr.icuBeds.total, 0);
  const totalAvailIcu = hospitals.reduce((acc, curr) => acc + curr.icuBeds.available, 0);
  const totalTotalIcu = hospitals.reduce((acc, curr) => acc + curr.icuBeds.total, 0);
  const icuPercentage = Math.round(((totalTotalIcu - totalAvailIcu) / totalTotalIcu) * 100);
  const totalAvailVents = hospitals.reduce((acc, curr) => acc + curr.ventilators.available, 0);
  const totalTotalVents = hospitals.reduce((acc, curr) => acc + curr.ventilators.total, 0);

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-med-green font-black dark:text-med-green-light">
            Medical Infrastructure Status
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Hospital Bed Capacity
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor real-time beds, check cost files, verify diagnostic test listings, and submit hospital complaints.
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-med-green hover:bg-emerald-800 text-white font-semibold text-xs h-9 cursor-pointer self-start flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" />
          {showAddForm ? 'Cancel Registration' : 'Register New Hospital'}
        </Button>
      </div>

      {/* Register Hospital Form (Collapsible) */}
      {showAddForm && (
        <Card className="border-border-subtle bg-slate-50/50 dark:bg-slate-900/40 p-5 shadow-inner animate-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3 px-0 pt-0">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-med-green" /> Register New Facility
            </CardTitle>
            <CardDescription className="text-xs">
              Add facility name and location coordinates to populate Pune District registry.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleAddHospital} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormGroup label="Hospital Name" required>
                  <Input 
                    type="text" 
                    value={addName} 
                    onChange={(e) => setAddName(e.target.value)} 
                    placeholder="e.g. Pune Life Care Center" 
                    className="h-10 text-xs"
                    required
                  />
                </FormGroup>

                <FormGroup label="Hospital Location" required>
                  <Input 
                    type="text" 
                    value={addLocation} 
                    onChange={(e) => setAddLocation(e.target.value)} 
                    placeholder="e.g. Sector 4B West Main St" 
                    className="h-10 text-xs"
                    required
                  />
                </FormGroup>

                <FormGroup label="Facility Classification">
                  <Select value={addType} onChange={(e) => setAddType(e.target.value)} className="h-10 text-xs">
                    <option value="Government Apex Hospital">Government Apex Hospital</option>
                    <option value="Municipal Clinic">Municipal Clinic</option>
                    <option value="Super-Specialty Trauma Hub">Super-Specialty Trauma Hub</option>
                    <option value="Private Trust Hospital">Private Trust Hospital</option>
                  </Select>
                </FormGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormGroup label="General Bed Capacity">
                  <Input 
                    type="number" 
                    value={addGenBeds} 
                    onChange={(e) => setAddGenBeds(Number(e.target.value))} 
                    className="h-10 text-xs"
                  />
                </FormGroup>

                <FormGroup label="ICU Bed Capacity">
                  <Input 
                    type="number" 
                    value={addIcuBeds} 
                    onChange={(e) => setAddIcuBeds(Number(e.target.value))} 
                    className="h-10 text-xs"
                  />
                </FormGroup>

                <FormGroup label="Ventilators Installed">
                  <Input 
                    type="number" 
                    value={addVents} 
                    onChange={(e) => setAddVents(Number(e.target.value))} 
                    className="h-10 text-xs"
                  />
                </FormGroup>

                <FormGroup label="Contact Phone Line">
                  <Input 
                    type="text" 
                    value={addPhone} 
                    onChange={(e) => setAddPhone(e.target.value)} 
                    placeholder="+91 20 2688 " 
                    className="h-10 text-xs"
                  />
                </FormGroup>
              </div>

              <Button
                type="submit"
                className="bg-med-green hover:bg-emerald-800 text-white text-xs font-bold px-6 h-10 mt-2 cursor-pointer shadow"
              >
                Register & Initialize Datasets
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Capacity Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="bg-card border-border-subtle shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Total Available Beds</span>
              <strong className="block text-3xl font-black text-med-green">{totalAvailBeds} / {totalTotalBeds}</strong>
              <span className="text-[10px] text-slate-400 font-semibold">Across all registered facilities</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-250/20 flex items-center justify-center text-med-green">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border-subtle shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">ICU Bed Occupancy</span>
              <strong className="block text-3xl font-black text-amber-600">{icuPercentage}%</strong>
              <span className="text-[10px] text-amber-500 font-semibold">{totalAvailIcu} / {totalTotalIcu} beds free</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-250/20 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border-subtle shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Ventilator Reserves</span>
              <strong className="block text-3xl font-black text-emerg-red">{totalAvailVents} / {totalTotalVents} Free</strong>
              <span className="text-[10px] text-emerg-red font-semibold">Active reserve telemetry</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-250/20 flex items-center justify-center text-emerg-red">
              <HeartPulse className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Hospital Capacity Cards */}
        <div className="lg:col-span-2 space-y-4">
          
          {hospitals.map((hosp) => {
            const isCritical = hosp.status === 'Critical';
            const isWarning = hosp.status === 'Warning';
            const isSelected = selectedHospId === hosp.id;
            
            return (
              <Card 
                key={hosp.id} 
                className={cn(
                  "p-5 bg-card hover:shadow-md transition-all flex flex-col justify-between border cursor-pointer",
                  isCritical 
                    ? 'border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/5' 
                    : isWarning 
                      ? 'border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-950/5' 
                      : 'border-border-subtle',
                  isSelected && 'ring-2 ring-med-green border-med-green bg-emerald-500/5'
                )}
                onClick={() => {
                  setSelectedHospId(hosp.id);
                  setBookingSuccess(false);
                  setComplaintSuccess(false);
                  setComplaintText('');
                }}
              >
                <div className="space-y-4">
                  {/* Title and stats */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">{hosp.type}</span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                        {hosp.name} 
                        {isSelected && <Check className="w-4 h-4 text-med-green" />}
                      </h4>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{hosp.location}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      isCritical 
                        ? "bg-red-500/10 text-emerg-red border-red-200/25" 
                        : isWarning 
                          ? "bg-amber-500/10 text-amber-600 border-amber-250/25" 
                          : "bg-emerald-500/10 text-med-green border-emerald-250/25"
                    )}>
                      {hosp.status} Alert
                    </span>
                  </div>

                  {/* Bed Details row */}
                  <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 dark:border-slate-850 py-3">
                    {/* General Beds */}
                    <div className="space-y-1">
                      <span className="block text-[8px] font-extrabold uppercase text-slate-400">General Beds</span>
                      <div className="flex items-baseline gap-1">
                        <strong className="text-base font-black text-slate-800 dark:text-slate-200">{hosp.generalBeds.available}</strong>
                        <span className="text-[10px] text-slate-400">/ {hosp.generalBeds.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-med-green rounded-full" 
                          style={{ width: `${(hosp.generalBeds.available / hosp.generalBeds.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* ICU Beds */}
                    <div className="space-y-1">
                      <span className="block text-[8px] font-extrabold uppercase text-slate-400">ICU Beds</span>
                      <div className="flex items-baseline gap-1">
                        <strong className={cn(
                          "text-base font-black",
                          hosp.icuBeds.available < 5 ? "text-emerg-red" : "text-slate-800 dark:text-slate-200"
                        )}>{hosp.icuBeds.available}</strong>
                        <span className="text-[10px] text-slate-400">/ {hosp.icuBeds.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            hosp.icuBeds.available < 5 ? "bg-emerg-red" : "bg-med-green"
                          )} 
                          style={{ width: `${(hosp.icuBeds.available / hosp.icuBeds.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Ventilators */}
                    <div className="space-y-1">
                      <span className="block text-[8px] font-extrabold uppercase text-slate-400">Ventilators</span>
                      <div className="flex items-baseline gap-1">
                        <strong className={cn(
                          "text-base font-black",
                          hosp.ventilators.available === 0 ? "text-emerg-red" : "text-slate-800 dark:text-slate-200"
                        )}>{hosp.ventilators.available}</strong>
                        <span className="text-[10px] text-slate-400">/ {hosp.ventilators.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            hosp.ventilators.available === 0 ? "bg-emerg-red" : "bg-med-green"
                          )} 
                          style={{ width: `${(hosp.ventilators.available / hosp.ventilators.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footing info */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-med-green" /> Tel: {hosp.phone}
                    </span>
                    <span className="bg-slate-50 dark:bg-slate-900 border border-border-subtle px-2 py-0.5 rounded">
                      Queue Time: <strong className={cn(hosp.queueTime > 40 ? "text-emerg-red" : "text-slate-700")}>{hosp.queueTime}m</strong>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}

        </div>

        {/* Right Column: Multi-tab details inspector */}
        <div className="lg:col-span-1 space-y-6">
          
          <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-med-green overflow-hidden">
            <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-450">Active Inspector</span>
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {activeHosp.name}
              </CardTitle>
            </CardHeader>
            
            {/* Tabs Controller */}
            <div className="flex bg-slate-100/50 dark:bg-slate-950 border-b border-border-subtle">
              {([
                { id: 'booking', label: 'Beds' },
                { id: 'tests', label: 'Tests' },
                { id: 'pharmacy', label: 'Meds' },
                { id: 'route', label: 'Route' },
                { id: 'complaint', label: 'File Complaint' }
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInspectTab(tab.id)}
                  className={cn(
                    "flex-1 py-2.5 text-[9px] font-black uppercase text-center border-r border-border-subtle last:border-r-0 transition-colors",
                    inspectTab === tab.id
                      ? "bg-white dark:bg-card border-b-2 border-b-med-green text-med-green font-bold"
                      : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CardContent className="p-5">
              
              {/* Tab 1: Beds Reservation */}
              {inspectTab === 'booking' && (
                <div>
                  {bookingSuccess ? (
                    <div className="space-y-4 py-2 text-center animate-in fade-in duration-200">
                      <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 mx-auto flex items-center justify-center text-med-green">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Reserved Bed Ticket</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                        Your bed reservation request at <strong>{activeHosp.name}</strong> is booked. Show reference ID below at triage desk.
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-border-subtle p-2 rounded font-mono text-xs font-black text-med-green">
                        {bookingId}
                      </div>
                      <Button 
                        onClick={() => setBookingSuccess(false)}
                        className="w-full bg-med-green hover:bg-emerald-800 text-white font-bold text-xs h-9 cursor-pointer"
                      >
                        Reserve Another Bed
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleBookBed} className="space-y-3 pt-1">
                      <FormGroup label="Selected Facility">
                        <Input type="text" value={activeHosp.name} className="h-9 text-xs" disabled />
                      </FormGroup>

                      <FormGroup label="Bed Priority Type">
                        <Select value={bedType} onChange={(e) => setBedType(e.target.value)} className="h-9 text-xs">
                          <option value="General Bed">General Ward Bed (Stable/Observation)</option>
                          <option value="ICU Bed">Intensive Care Unit (ICU) Bed</option>
                          <option value="Ventilator">ICU Bed + Ventilator Support</option>
                        </Select>
                      </FormGroup>

                      <FormGroup label="Patient Symptom Urgency">
                        <Select className="h-9 text-xs">
                          <option value="low">Stable (Observation requested)</option>
                          <option value="medium">Severe (Admissions recommended)</option>
                          <option value="high">Critical (Immediate rescue needed)</option>
                        </Select>
                      </FormGroup>

                      <Button
                        type="submit"
                        isLoading={isBooking}
                        className="w-full h-9 text-xs font-semibold mt-4 bg-med-green hover:bg-emerald-800 text-white cursor-pointer"
                      >
                        Reserve Bed Ticket
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab 2: Test Costs & Pricing */}
              {inspectTab === 'tests' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Diagnostic Procedure Cost Card</span>
                  <div className="border border-border-subtle rounded-lg overflow-hidden bg-slate-50/20 dark:bg-slate-950">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border-subtle">
                          <TableHead className="text-[10px] font-bold py-2">Test Name</TableHead>
                          <TableHead className="text-[10px] font-bold py-2 text-right">Cost</TableHead>
                          <TableHead className="text-[10px] font-bold py-2 text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeHosp.testCosts.map((test) => (
                          <TableRow key={test.testName} className="border-border-subtle hover:bg-slate-100/10">
                            <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200 py-2">{test.testName}</TableCell>
                            <TableCell className="text-xs font-black text-right text-med-green py-2">₹{test.cost.toLocaleString()}</TableCell>
                            <TableCell className="text-[10px] text-right text-slate-450 py-2">{test.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-lg flex gap-1.5 items-start">
                    <Info className="w-3.5 h-3.5 text-med-green shrink-0 mt-0.5" />
                    <p className="text-[9px] text-slate-500 leading-normal">
                      Govt Health Scheme Card holders (Ayushman Bharat) qualify for 100% cashless diagnostics coverage.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Pharmacy Stock Inventory */}
              {inspectTab === 'pharmacy' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Pharmacy Medicine Stock Registry</span>
                  <div className="border border-border-subtle rounded-lg overflow-hidden bg-slate-50/20 dark:bg-slate-950">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border-subtle">
                          <TableHead className="text-[10px] font-bold py-2">Medicine</TableHead>
                          <TableHead className="text-[10px] font-bold py-2 text-right">Stock</TableHead>
                          <TableHead className="text-[10px] font-bold py-2 text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeHosp.medInventory.map((med) => (
                          <TableRow key={med.name} className="border-border-subtle hover:bg-slate-100/10">
                            <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200 py-2">{med.name}</TableCell>
                            <TableCell className="text-xs font-black text-right text-slate-650 dark:text-slate-350 py-2">
                              {med.stock} {med.unit.slice(0,4)}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1 rounded-sm border",
                                med.status === 'Critical' 
                                  ? 'bg-red-500/10 text-emerg-red border-red-200/20 animate-pulse'
                                  : med.status === 'Low'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-200/20'
                                    : 'bg-emerald-500/10 text-med-green border-emerald-250/20'
                              )}>
                                {med.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Tab 4: Routing & "How to Reach" */}
              {inspectTab === 'route' && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-border-subtle p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-400 block">Total Transit Distance</span>
                      <strong className="text-lg font-black text-slate-900 dark:text-slate-100">{activeHosp.routeInfo.distance}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase font-bold text-slate-400 block">Average ETA (Car)</span>
                      <strong className="text-lg font-black text-med-green">{activeHosp.routeInfo.eta}</strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Map className="w-3.5 h-3.5 text-med-green" /> Guided Route Steps
                    </span>
                    <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 list-decimal pl-4 font-medium">
                      {activeHosp.routeInfo.steps.map((step, idx) => (
                        <li key={idx} className="leading-normal">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 5: Hospital Complaint Box */}
              {inspectTab === 'complaint' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  {complaintSuccess ? (
                    <div className="space-y-3 py-2 text-center">
                      <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 mx-auto flex items-center justify-center text-emerg-red">
                        <FileText className="w-5 h-5 text-emerg-red" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">Grievance Case Registered</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                        Your complaint against <strong>{activeHosp.name}</strong> has been logged and forwarded to the District Health Directorate for investigation.
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-900/60 border border-border-subtle p-2 rounded font-mono text-xs font-black text-emerg-red">
                        {complaintId}
                      </div>
                      <Button 
                        onClick={() => {
                          setComplaintSuccess(false);
                          setComplaintText('');
                        }}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs h-9 cursor-pointer"
                      >
                        File New Complaint
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitComplaint} className="space-y-3">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Report Misconduct or Triage Failures</span>
                      
                      <FormGroup label="Incident Category">
                        <Select value={complaintCategory} onChange={(e) => setComplaintCategory(e.target.value)} className="h-9 text-xs">
                          <option value="Improper conduct">Improper conduct by staff</option>
                          <option value="Overcharging">Overcharging / Billing inflation</option>
                          <option value="Hygiene alert">Poor sanitation / Hygiene alert</option>
                          <option value="Triage delay">Unreasonable triage queue delay</option>
                          <option value="Resource neglect">ICU bed / Ventilator neglect</option>
                        </Select>
                      </FormGroup>

                      <FormGroup label="Detailed Incident Notes" required>
                        <Textarea 
                          value={complaintText} 
                          onChange={(e) => setComplaintText(e.target.value)} 
                          placeholder="Provide details of dates, times, staff involved, or specific complaints..."
                          className="text-xs min-h-[70px] resize-none"
                          required
                        />
                      </FormGroup>

                      <Button
                        type="submit"
                        disabled={isSubmittingComplaint}
                        className="w-full h-9 bg-emerg-red hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                      >
                        {isSubmittingComplaint ? 'Registering Case ID...' : 'Register Public Complaint'}
                      </Button>
                    </form>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          {/* Booking Info Card */}
          <Card className="bg-card border-border-subtle shadow-md">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-med-green" /> Admission Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 text-xs">
                
                {/* Rule 1 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-med-green font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    A
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Aadhaar Health Link</strong>
                    <p className="text-[11px] text-slate-500">Link your government health records to fetch diagnosis profiles immediately.</p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="flex gap-2 items-start">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-med-green font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    B
                  </span>
                  <div className="space-y-0.5 leading-normal">
                    <strong className="text-slate-850 dark:text-slate-150">Triage Verification</strong>
                    <p className="text-[11px] text-slate-500">Critical cases are prioritized. If queues are long, contact our ambulance dispatch hub.</p>
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
        defaultService="hospital" 
      />

    </div>
  );
}
