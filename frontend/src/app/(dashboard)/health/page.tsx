// app/(dashboard)/health/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  HeartPulse, Activity, MapPin, Sparkles, TrendingUp, AlertTriangle, 
  ShieldAlert, ShieldCheck, ChevronRight, Zap, RefreshCw, Layers, BarChart3, Truck,
  Phone, UserCheck, CheckCircle2, AlertOctagon, X, User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OfficialContact {
  name: string;
  role: string;
  phone: string;
  type: 'Chief' | 'Lab Specialist' | 'Field Agent';
}

interface CapabilityItem {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  status: 'AI Active' | 'Forecasting' | 'Routing Active' | 'Analysis Online' | 'Advisory Online' | 'Simulator Ready';
  stat: string;
  department: string;
  primaryPhone: string;
  officersCount: number;
  contacts: OfficialContact[];
  colorClasses: {
    lightBg: string;
    darkBg: string;
    lightBorder: string;
    darkBorder: string;
    accentColor: string;
    badgeStyle: string;
    badgeStyleDark: string;
  };
}

const HEALTH_CAPABILITIES: CapabilityItem[] = [
  {
    name: 'Disease Outbreak Predictor',
    description: 'Forecast spatial propagation models. Computes regional outbreak indexes utilizing environment indicators.',
    href: '/health/outbreaks',
    icon: Activity,
    status: 'AI Active',
    stat: '96% Model Accuracy',
    department: 'Epidemiology & Outbreaks',
    primaryPhone: '+91 22 2262 0244',
    officersCount: 12,
    contacts: [
      { name: 'Dr. Rajesh Tope', role: 'Director of Disease Control', phone: '+91 22 2262 0244', type: 'Chief' },
      { name: 'Dr. Archana Patil', role: 'Chief Epidemiologist', phone: '+91 22 2262 0255', type: 'Lab Specialist' },
      { name: 'Shri Anil Kumar', role: 'District Surveillance Officer', phone: '+91 22 2262 0266', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-rose-50/95',
      darkBg: 'dark:bg-[#200D11]',
      lightBorder: 'border-rose-300',
      darkBorder: 'dark:border-rose-500/30',
      accentColor: 'text-rose-700 dark:text-rose-400',
      badgeStyle: 'bg-rose-200/80 text-rose-900 border-rose-300',
      badgeStyleDark: 'dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
    }
  },
  {
    name: 'Hospital Load Forecaster',
    description: 'Predict medical bed occupancy and ICU usage thresholds. Flag deficit metrics and suggest resources divert.',
    href: '/health/hospitals',
    icon: Layers,
    status: 'Forecasting',
    stat: 'Capacity Forecast Active',
    department: 'Hospital Administration',
    primaryPhone: '+91 22 2265 1421',
    officersCount: 15,
    contacts: [
      { name: 'Dr. Nitin Karir', role: 'Director of Medical Education', phone: '+91 22 2265 1421', type: 'Chief' },
      { name: 'Dr. Tatyarao Lahane', role: 'State Bed Allocation Officer', phone: '+91 22 2265 1431', type: 'Field Agent' },
      { name: 'Smt. Medha Gadgil', role: 'Health Infrastructure Analyst', phone: '+91 22 2265 1441', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-orange-50/95',
      darkBg: 'dark:bg-[#24140D]',
      lightBorder: 'border-orange-300',
      darkBorder: 'dark:border-orange-500/30',
      accentColor: 'text-orange-700 dark:text-orange-400',
      badgeStyle: 'bg-orange-200/80 text-orange-900 border-orange-300',
      badgeStyleDark: 'dark:bg-orange-500/10 dark:text-orange-450 dark:border-orange-500/20'
    }
  },
  {
    name: 'Ambulance Dispatch Optimizer',
    description: 'Optimize ambulance dispatch locations and ETA times utilizing real-time traffic grids and hospital availabilities.',
    href: '/health/ambulances',
    icon: Truck,
    status: 'Routing Active',
    stat: 'Real-time GPS Tracking',
    department: 'Emergency Medical Services',
    primaryPhone: '+91 22 2269 4102',
    officersCount: 24,
    contacts: [
      { name: 'Dr. Dheeraj Kumar', role: 'Director of Emergency Services', phone: '+91 22 2269 4102', type: 'Chief' },
      { name: 'Shri Vijay Pawar', role: 'Ambulance Fleet Coordinator', phone: '+91 22 2269 4112', type: 'Field Agent' },
      { name: 'Kumari Neha Deshmukh', role: 'GPS Dispatch Controller', phone: '+91 22 2269 4122', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-blue-50/95',
      darkBg: 'dark:bg-[#0D182E]',
      lightBorder: 'border-blue-300',
      darkBorder: 'dark:border-blue-500/30',
      accentColor: 'text-blue-700 dark:text-blue-400',
      badgeStyle: 'bg-blue-200/80 text-blue-900 border-blue-300',
      badgeStyleDark: 'dark:bg-blue-500/10 dark:text-blue-450 dark:border-blue-500/20'
    }
  },
  {
    name: 'Medicine Demand Forecasting',
    description: 'Forecast inventory depletion and stockout probability for pharmacies. Calculate restock timeline values.',
    href: '/health/medicine',
    icon: BarChart3,
    status: 'Analysis Online',
    stat: 'Stockout Risk Prediction',
    department: 'Pharmaceutical Supply Chain',
    primaryPhone: '+91 22 2267 8099',
    officersCount: 10,
    contacts: [
      { name: 'Shri Abhimanyu Kale', role: 'Commissioner of FDA', phone: '+91 22 2267 8099', type: 'Chief' },
      { name: 'Smt. Pallavi Darade', role: 'Stock Replenishment Manager', phone: '+91 22 2267 8109', type: 'Lab Specialist' },
      { name: 'Shri Satish Patel', role: 'State Drug Inspector', phone: '+91 22 2267 8119', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-emerald-50/95',
      darkBg: 'dark:bg-[#0D2218]',
      lightBorder: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-500/30',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      badgeStyle: 'bg-emerald-200/80 text-emerald-900 border-emerald-300',
      badgeStyleDark: 'dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20'
    }
  },
  {
    name: 'Vaccination Planning AI',
    description: 'Map immunization campaigns across high-risk sectors. Plan required doses based on demographics.',
    href: '/health/vaccinations',
    icon: Sparkles,
    status: 'Analysis Online',
    stat: 'Target Coverage Met',
    department: 'Immunization & Public Health',
    primaryPhone: '+91 22 2264 5110',
    officersCount: 18,
    contacts: [
      { name: 'Dr. Pradeep Vyas', role: 'State Immunization Officer', phone: '+91 22 2264 5110', type: 'Chief' },
      { name: 'Shri Sunil Kamble', role: 'Cold Chain Logistics Lead', phone: '+91 22 2264 5120', type: 'Field Agent' },
      { name: 'Dr. Aarti Singh', role: 'Vaccine Coverage Analyst', phone: '+91 22 2264 5130', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-violet-50/95',
      darkBg: 'dark:bg-[#1C0D2E]',
      lightBorder: 'border-violet-300',
      darkBorder: 'dark:border-violet-500/30',
      accentColor: 'text-violet-700 dark:text-violet-400',
      badgeStyle: 'bg-violet-200/80 text-violet-900 border-violet-300',
      badgeStyleDark: 'dark:bg-violet-500/10 dark:text-violet-450 dark:border-violet-500/20'
    }
  },
  {
    name: 'Health Governance Agent',
    description: 'Interact directly with the AI Governance expert. Ask questions on outbreak vectors, containment policies, and resources.',
    href: '/health/agent',
    icon: HeartPulse,
    status: 'Advisory Online',
    stat: '24/7 Generative Guidance',
    department: 'Health Policy & AI Council',
    primaryPhone: '+91 22 2261 3005',
    officersCount: 8,
    contacts: [
      { name: 'Shri Sanjay Kumar', role: 'Chief Secretary (Health)', phone: '+91 22 2261 3005', type: 'Chief' },
      { name: 'Smt. Sujata Saunik', role: 'Principal Secretary', phone: '+91 22 2261 3015', type: 'Chief' },
      { name: 'AI Agent HealthNet', role: 'Generative AI Advisor', phone: '+91 22 2261 3025', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-amber-50/95',
      darkBg: 'dark:bg-[#271E0B]',
      lightBorder: 'border-amber-300',
      darkBorder: 'dark:border-amber-500/30',
      accentColor: 'text-amber-700 dark:text-[#D4AF37]',
      badgeStyle: 'bg-amber-200/80 text-amber-900 border-amber-300',
      badgeStyleDark: 'dark:bg-amber-500/10 dark:text-amber-450 dark:border-amber-500/20'
    }
  },
  {
    name: 'Healthcare Digital Twin Simulation Engine',
    description: 'Simulate epidemiological SEIR curves, public intervention lockdowns, vaccination coverage gains, and hospital bed overflows. Review the reduction in mortality rates over time.',
    href: '/health/simulation',
    icon: Layers,
    status: 'Simulator Ready',
    stat: 'SEIR Models Configured',
    department: 'Healthcare Simulations',
    primaryPhone: '+91 22 2263 7091',
    officersCount: 14,
    contacts: [
      { name: 'Dr. Subhash Salunkhe', role: 'Simulation Lab Director', phone: '+91 22 2263 7091', type: 'Chief' },
      { name: 'Shri Manoj Naik', role: 'SEIR Model Lead Developer', phone: '+91 22 2263 7101', type: 'Lab Specialist' },
      { name: 'Kumari Pooja Patil', role: 'Simulation Field Officer', phone: '+91 22 2263 7111', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-fuchsia-50/95',
      darkBg: 'dark:bg-[#250D2B]',
      lightBorder: 'border-fuchsia-300',
      darkBorder: 'dark:border-fuchsia-500/30',
      accentColor: 'text-fuchsia-700 dark:text-fuchsia-400',
      badgeStyle: 'bg-fuchsia-200/80 text-fuchsia-900 border-fuchsia-300',
      badgeStyleDark: 'dark:bg-fuchsia-500/10 dark:text-fuchsia-450 dark:border-fuchsia-500/20'
    }
  }
];

export default function HealthOverview() {
  const { summary, loading, error, wsConnected, fetchSummary, initializeWebSocket, closeWebSocket } = useHealthStore();

  // Call system state
  const [selectedCapability, setSelectedCapability] = useState<CapabilityItem | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCallNumber, setActiveCallNumber] = useState<string | null>(null);
  const [activeCallName, setActiveCallName] = useState<string | null>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  useEffect(() => {
    fetchSummary();
    initializeWebSocket();
    return () => {
      closeWebSocket();
    };
  }, [fetchSummary, initializeWebSocket, closeWebSocket]);

  // Color helper based on risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'text-red-650 dark:text-red-400 border-red-300 dark:border-red-500/20 bg-red-100/80 dark:bg-red-500/10';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20 bg-orange-100/80 dark:bg-orange-50/10';
      case 'MEDIUM': return 'text-amber-600 dark:text-amber-450 border-amber-300 dark:border-amber-500/20 bg-amber-100/80 dark:bg-amber-50/10';
      default: return 'text-emerald-700 dark:text-emerald-450 border-emerald-300 dark:border-emerald-500/20 bg-emerald-100/80 dark:bg-emerald-50/10';
    }
  };

  const handleOpenCall = (e: React.MouseEvent, item: CapabilityItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCapability(item);
    setComplaintTitle('');
    setComplaintDesc('');
    setComplaintSubmitted(false);
    setCallState('idle');
    setActiveCallNumber(null);
    setActiveCallName(null);
    setShowCallModal(true);
  };

  const initiateCall = (number: string, name: string) => {
    setActiveCallNumber(number);
    setActiveCallName(name);
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 1200);
  };

  const terminateCall = () => {
    setCallState('idle');
    setActiveCallNumber(null);
    setActiveCallName(null);
  };

  const handleLogComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;
    setComplaintSubmitted(true);
    setTimeout(() => {
      setShowCallModal(false);
      setSelectedCapability(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-[#D4AF37]">
              CLASSIFIED • NATIONAL HEALTH INTELLIGENCE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Predictive Healthcare Governance Command
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5 font-bold">
            Real-time disease vectors monitoring, hospital capacity stress forecasting, and automated ambulance dispatch routing.
          </p>
        </div>
        
        {/* Connection status and manual refresh */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
            wsConnected 
              ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/30" 
              : "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
          )}>
            <Zap className={cn("w-3.5 h-3.5", wsConnected && "animate-pulse")} />
            {wsConnected ? 'Realtime WebSocket Active' : 'Realtime Stream Offline'}
          </div>
          
          <Button 
            onClick={fetchSummary} 
            disabled={loading}
            className="bg-[#1A3A6C] hover:bg-[#2A4D8C] text-white border border-[#3A5D9C] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">High Risk Outbreak Zones</p>
                <h3 className="text-3xl font-black mt-2 text-red-600 dark:text-red-400">
                  {summary?.kpis.high_outbreak_zones ?? 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-655 dark:text-red-405">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 font-bold">Active district risk score threshold exceeded (&gt;70%)</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Hospital Capacity Warnings</p>
                <h3 className="text-3xl font-black mt-2 text-orange-600 dark:text-orange-400">
                  {summary?.kpis.hospital_bed_alerts ?? 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 text-orange-655 dark:text-orange-405">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 font-bold">Hospitals forecasted to experience bed deficits</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Active Ambulance Dispatches</p>
                <h3 className="text-3xl font-black mt-2 text-blue-600 dark:text-blue-400">
                  {summary?.kpis.active_ambulance_dispatches ?? 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 text-blue-655 dark:text-blue-405">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 font-bold">Emergency transits currently tracked by fleet GPS</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Medicine Stockout Risks</p>
                <h3 className="text-3xl font-black mt-2 text-emerald-700 dark:text-emerald-400">
                  {summary?.kpis.critical_stockout_medicines ?? 0}
                </h3>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-405">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 font-bold">Critical drugs under critical replenishment warning</p>
          </CardContent>
        </Card>

      </div>

      {/* Main Core Engines Portal Panel */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-655 dark:text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4AF37]" />
          Health Analytics &amp; Control Portals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {HEALTH_CAPABILITIES.map((item, idx) => {
            const Icon = item.icon;
            const isTwin = item.href === '/health/simulation';
            
            return (
              <Link 
                href={item.href} 
                key={item.name} 
                className={cn(
                  "group no-underline block", 
                  isTwin ? "md:col-span-2 xl:col-span-3" : ""
                )}
              >
                <motion.div 
                  whileHover={{ 
                    y: -5, 
                    boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.1)',
                  }}
                  className={cn(
                    "h-full rounded-2xl p-5 flex flex-col justify-between min-h-[240px] transition-all relative overflow-hidden shadow-sm border",
                    item.colorClasses.lightBg,
                    item.colorClasses.darkBg,
                    item.colorClasses.lightBorder,
                    item.colorClasses.darkBorder
                  )}
                >
                  {/* Top color indicator border */}
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-900/10 dark:bg-white/10" />

                  <div className="space-y-3.5">
                    {/* Icon + Status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#070D1A] border border-slate-300 dark:border-emerald-500/20 flex items-center justify-center text-slate-900 dark:text-[#D4AF37] shrink-0 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-all shadow-xs">
                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <span className={cn('text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 shadow-2xs', item.colorClasses.badgeStyle, item.colorClasses.badgeStyleDark)}>
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-950 dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-[#D4AF37] transition-colors leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-900 dark:text-slate-350 leading-relaxed font-black">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer metadata with Call Escalation Button */}
                  <div className="border-t border-slate-300 dark:border-[#1A2744] pt-3.5 mt-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 dark:text-slate-400 bg-white/50 dark:bg-black/10 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                      <span className="truncate max-w-[130px]">{item.department}</span>
                      <span className="font-mono text-slate-950 dark:text-white font-black">{item.primaryPhone}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-slate-950 dark:text-slate-400 italic block truncate max-w-[150px]">
                        {item.stat}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Calling facility trigger */}
                        <button
                          onClick={(e) => handleOpenCall(e, item)}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-emerald-500/25 hover:border-slate-500 bg-white dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-450 hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 font-black text-[9px]"
                          title="Call Officials or Register Complaints"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-450" />
                          Call Office
                        </button>

                        <span className="text-[10px] font-black text-slate-950 dark:text-[#D4AF37] flex items-center gap-0.5 group-hover:gap-1.5 transition-all uppercase tracking-wide">
                          Open
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Live Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Outbreak risks log */}
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-[#1A2744]">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Outbreak Forecasting Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[350px] overflow-y-auto">
            {summary && summary.recent_outbreaks.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-[#1A2744]">
                {summary.recent_outbreaks.map((out, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors">
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white">{out.disease}</h4>
                      <p className="text-xs text-slate-655 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {out.district}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded text-[10px] font-black border",
                        out.prob > 0.7 
                          ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30" 
                          : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
                      )}>
                        {(out.prob * 100).toFixed(0)}% Prob
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-550 mt-1 font-black">
                        Proj Cases: {out.cases_7d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-black text-xs">
                No outbreak logs computed. Try running predictions first.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hospital loads log */}
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-[#1A2744]">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Hospital Load Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[350px] overflow-y-auto">
            {summary && summary.recent_hospital_loads.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-[#1A2744]">
                {summary.recent_hospital_loads.map((hosp, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors">
                    <div>
                      <h4 className="text-sm font-black text-slate-950 dark:text-white">{hosp.hospital}</h4>
                      <p className="text-xs text-slate-655 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {hosp.district}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded text-[10px] font-black border",
                        hosp.shortage 
                          ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30" 
                          : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                      )}>
                        {hosp.shortage ? 'Shortage Warning' : 'Adequate Capacity'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-550 mt-1 font-black">
                        Beds: {hosp.occupancy} / {hosp.expected}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-black text-xs">
                No capacity forecasts computed. Try submitting load metrics.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Interactive Call Escalation & Complaint Modal */}
      <AnimatePresence>
        {showCallModal && selectedCapability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] text-slate-900 dark:text-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-[#1A2744] flex items-center justify-between bg-slate-50 dark:bg-black/20">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-[#D4AF37] uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5" />
                    Interactive Calling Facility
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedCapability.name} Hotline
                  </h3>
                </div>
                <button 
                  onClick={() => setShowCallModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* 1. Official Directory */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-655 dark:text-slate-400 tracking-wider">
                    Official Directory ({selectedCapability.officersCount} Department Officials Available)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedCapability.contacts.map((contact) => (
                      <div 
                        key={contact.name}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070D1A]/50 flex flex-col justify-between"
                      >
                        <div>
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase border mb-2",
                            contact.type === 'Chief' 
                              ? "bg-red-100 text-red-750 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                              : contact.type === 'Lab Specialist'
                                ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                                : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                          )}>
                            {contact.type}
                          </span>
                          <h5 className="text-xs font-black leading-tight text-slate-900 dark:text-white">{contact.name}</h5>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{contact.role}</p>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-mono text-[9px] text-slate-500 dark:text-slate-405">{contact.phone}</span>
                          <button
                            onClick={() => initiateCall(contact.phone, contact.name)}
                            disabled={callState !== 'idle'}
                            className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white cursor-pointer transition-colors"
                            title="Call this Official"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Call Dialer Interface (Live simulator) */}
                {callState !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                        <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                          <Phone className="w-5 h-5 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-widest animate-pulse">
                          {callState === 'calling' ? 'DIALING SECURE GOV LINE...' : 'LINE SECURE • CONNECTED'}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{activeCallName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{activeCallNumber}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={terminateCall}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                    >
                      Disconnect Call
                    </Button>
                  </motion.div>
                )}

                {/* 3. Complaint Registry (Integrated) */}
                <div className="border-t border-slate-200 dark:border-[#1A2744] pt-5">
                  <h4 className="text-xs font-black uppercase text-slate-655 dark:text-slate-400 tracking-wider mb-3">
                    Department Complaint Registration System
                  </h4>
                  
                  {complaintSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-2"
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                      <h5 className="text-sm font-black text-slate-900 dark:text-white">Complaint Registered Successfully</h5>
                      <p className="text-xs text-slate-550 dark:text-slate-400">
                        Incident Ticket logged and broadcasted to {selectedCapability.contacts[0].name} and the district command center.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleLogComplaint} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-405">
                            Issue Title / Subject
                          </label>
                          <input 
                            type="text" 
                            required
                            value={complaintTitle}
                            onChange={(e) => setComplaintTitle(e.target.value)}
                            placeholder="e.g. Bed capacity mismatch in District Hospital..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-[#070D1A] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-405">
                            Incident Details & Emergency Request
                          </label>
                          <textarea 
                            required
                            rows={3}
                            value={complaintDesc}
                            onChange={(e) => setComplaintDesc(e.target.value)}
                            placeholder="Provide full description of the hazard event or emergency resources required..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-[#070D1A] text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Submit Formal Complaint
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
