'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ArrowLeft, 
  Coins, 
  Sliders, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  RefreshCcw, 
  ShieldCheck, 
  Activity, 
  Wrench,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

// Constants for initial values
const DEFAULT_ALLOCATIONS = {
  roads: 12.0,     // ₹12.0M
  bridges: 10.0,   // ₹10.0M
  dams: 8.0,       // ₹8.0M
  grid: 8.5,       // ₹8.5M
  admin: 4.0,      // ₹4.0M
};

const FISCAL_CAP = 42.5; // ₹42.5M

export default function BudgetOptimization() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  // Compute location-specific default allocations
  const defaultAllocationsForLocation = useMemo(() => {
    switch (userLocation) {
      case 'Hadapsar':
        return { roads: 14.0, bridges: 10.0, dams: 7.0, grid: 10.0, admin: 4.5 };
      case 'Aundh':
        return { roads: 9.0, bridges: 9.0, dams: 8.0, grid: 7.0, admin: 3.5 };
      case 'Yerawada':
        return { roads: 11.5, bridges: 12.0, dams: 9.0, grid: 8.0, admin: 4.0 };
      case 'Shivajinagar':
      default:
        return { roads: 12.0, bridges: 10.0, dams: 8.0, grid: 8.5, admin: 4.0 };
    }
  }, [userLocation]);

  // Allocation states (in ₹ Millions)
  const [allocations, setAllocations] = useState(DEFAULT_ALLOCATIONS);
  const [showReportLogged, setShowReportLogged] = useState(false);

  // Sync allocations when location changes
  useEffect(() => {
    setAllocations(defaultAllocationsForLocation);
  }, [defaultAllocationsForLocation]);

  // Total allocated calculator
  const totalAllocated = useMemo(() => {
    return parseFloat(
      (
        allocations.roads +
        allocations.bridges +
        allocations.dams +
        allocations.grid +
        allocations.admin
      ).toFixed(2)
    );
  }, [allocations]);

  const budgetDelta = useMemo(() => {
    return parseFloat((FISCAL_CAP - totalAllocated).toFixed(2));
  }, [totalAllocated]);

  // Dynamic Metrics Computations
  const roadSafety = useMemo(() => {
    const diff = allocations.roads - defaultAllocationsForLocation.roads;
    const baseVal = userLocation === 'Hadapsar' ? 61.2 : userLocation === 'Aundh' ? 85.0 : userLocation === 'Yerawada' ? 69.8 : 76.5;
    const computed = baseVal + diff * 2.2;
    return Math.max(35, Math.min(98.5, parseFloat(computed.toFixed(1))));
  }, [allocations.roads, defaultAllocationsForLocation.roads, userLocation]);

  const bridgeIntegrity = useMemo(() => {
    const diff = allocations.bridges - defaultAllocationsForLocation.bridges;
    const baseVal = userLocation === 'Hadapsar' ? 88.5 : userLocation === 'Aundh' ? 96.2 : userLocation === 'Yerawada' ? 79.5 : 91.0;
    const computed = baseVal + diff * 1.5;
    return Math.max(50, Math.min(99.0, parseFloat(computed.toFixed(1))));
  }, [allocations.bridges, defaultAllocationsForLocation.bridges, userLocation]);

  const damSafety = useMemo(() => {
    const diff = allocations.dams - defaultAllocationsForLocation.dams;
    const baseVal = userLocation === 'Hadapsar' ? 95.0 : userLocation === 'Aundh' ? 98.0 : userLocation === 'Yerawada' ? 99.0 : 98.0;
    const computed = baseVal + diff * 1.1;
    return Math.max(70, Math.min(99.5, parseFloat(computed.toFixed(1))));
  }, [allocations.dams, defaultAllocationsForLocation.dams, userLocation]);

  const gridEfficiency = useMemo(() => {
    const diff = allocations.grid - defaultAllocationsForLocation.grid;
    const baseVal = userLocation === 'Hadapsar' ? 84.5 : userLocation === 'Aundh' ? 92.0 : userLocation === 'Yerawada' ? 88.0 : 88.0;
    const computed = baseVal + diff * 1.8;
    return Math.max(45, Math.min(98.5, parseFloat(computed.toFixed(1))));
  }, [allocations.grid, defaultAllocationsForLocation.grid, userLocation]);

  // Overall infrastructure risk level (base is ~22.5%)
  const overallRisk = useMemo(() => {
    const avgSafety = (roadSafety + bridgeIntegrity + damSafety + gridEfficiency) / 4;
    return parseFloat((100 - avgSafety).toFixed(1));
  }, [roadSafety, bridgeIntegrity, damSafety, gridEfficiency]);

  // Maintenance backlogs and resolution time SLA
  const backlogCases = useMemo(() => {
    const baseVal = userLocation === 'Hadapsar' ? 24 : userLocation === 'Aundh' ? 7 : userLocation === 'Yerawada' ? 18 : 14;
    const roadBridgeImpact = (defaultAllocationsForLocation.roads - allocations.roads) * 0.9 + (defaultAllocationsForLocation.bridges - allocations.bridges) * 0.8;
    const adminImpact = allocations.admin < 3.0 ? (3.0 - allocations.admin) * 3 : 0;
    const calculated = baseVal + roadBridgeImpact + adminImpact;
    return Math.max(2, Math.round(calculated));
  }, [allocations.roads, allocations.bridges, allocations.admin, defaultAllocationsForLocation.roads, defaultAllocationsForLocation.bridges, userLocation]);

  const resolutionSla = useMemo(() => {
    // Base resolution SLA = 48 hours
    const baseVal = userLocation === 'Hadapsar' ? 64 : userLocation === 'Aundh' ? 36 : userLocation === 'Yerawada' ? 52 : 48;
    const coreSlaImpact = (defaultAllocationsForLocation.roads - allocations.roads) * 2.5 + (defaultAllocationsForLocation.bridges - allocations.bridges) * 2;
    const baseSla = baseVal + coreSlaImpact;

    // Admin multiplier: severe low funding slows crew scheduling dramatically
    let adminMultiplier = 1.0;
    if (allocations.admin < 2.5) {
      adminMultiplier = 2.0 - (allocations.admin / 2.5); // scales up to 2.0x delay
    } else if (allocations.admin < 4.0) {
      adminMultiplier = 1.0 + (4.0 - allocations.admin) * 0.15;
    } else {
      adminMultiplier = Math.max(0.7, 1.0 - (allocations.admin - 4.0) * 0.05);
    }
    
    return Math.max(12, Math.round(baseSla * adminMultiplier));
  }, [allocations.roads, allocations.bridges, allocations.admin, defaultAllocationsForLocation.roads, defaultAllocationsForLocation.bridges, userLocation]);

  const handleSliderChange = (key: keyof typeof DEFAULT_ALLOCATIONS, value: number) => {
    setAllocations(prev => ({
      ...prev,
      [key]: parseFloat(value.toFixed(1))
    }));
  };

  const resetAllocations = () => {
    setAllocations(defaultAllocationsForLocation);
  };

  // SVG Area Chart points based on total allocations
  const spendingTrend = useMemo(() => {
    const q1 = parseFloat((totalAllocated * 0.22).toFixed(1));
    const q2 = parseFloat((totalAllocated * 0.48).toFixed(1));
    const q3 = parseFloat((totalAllocated * 0.76).toFixed(1));
    const q4 = totalAllocated;
    return { q1, q2, q3, q4 };
  }, [totalAllocated]);

  // Generate local report toast mockup
  const handleGenerateReport = () => {
    setShowReportLogged(true);
    setTimeout(() => {
      setShowReportLogged(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Link 
          href="/infrastructure" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Infrastructure Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-[#4682B4] font-bold">Budget Optimization</span>
      </div>

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-8 h-8 text-[#4682B4]" />
            Capital Allocations & Budget Optimization
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Shift CapEx allocations between smart municipal utilities and infrastructure components to optimize resolution schedules.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={resetAllocations}
          className="inline-flex items-center gap-1.5 border-[#4682B4]/30 text-[#4682B4] hover:bg-[#4682B4]/5 text-xs font-bold w-fit shrink-0 self-start md:self-center"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reset Defaults
        </Button>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Notification banner for logged optimization report */}
      {showReportLogged && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <strong>Capital Optimization Blueprint Logged:</strong> Allocation data has been synced to the municipal servers. Target SLA models initialized.
          </div>
        </div>
      )}

      {/* Division 1 (Row 1): Sliders on Left, Impact Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Block 1: Budget Channel Allocators */}
        <Card className="border border-border-subtle bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Sliders className="w-4 h-4 text-[#4682B4]" />
              Infrastructure CapEx Allocations
            </CardTitle>
            <CardDescription className="text-xs">
              Distribute the ₹42.50M fiscal budget among smart city assets.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Target Budget Deficit/Reserves Warning Alert */}
            <div className={cn(
              "p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 transition-colors",
              budgetDelta < 0 
                ? "bg-red-50 dark:bg-red-950/20 border-red-500/30 text-red-700 dark:text-red-400" 
                : budgetDelta > 0 
                  ? "bg-amber-50 dark:bg-amber-950/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            )}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn(
                  "w-4 h-4 shrink-0",
                  budgetDelta < 0 ? "text-red-500" : budgetDelta > 0 ? "text-amber-500" : "text-emerald-500"
                )} />
                <span>
                  {budgetDelta < 0 ? (
                    <span><strong>Fiscal Deficit:</strong> Budget exceeds cap by ₹{Math.abs(budgetDelta).toFixed(1)}M!</span>
                  ) : budgetDelta > 0 ? (
                    <span><strong>Reserves Available:</strong> ₹{budgetDelta.toFixed(1)}M unallocated cash pool.</span>
                  ) : (
                    <span><strong>Balanced Budget:</strong> Allocations match the ₹{FISCAL_CAP.toFixed(1)}M cap exactly.</span>
                  )}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="block text-[8px] text-slate-400 uppercase tracking-widest leading-none">Total Distributed</span>
                <span className="text-sm font-black">₹{totalAllocated.toFixed(1)}M <span className="text-slate-400 font-medium">/ ₹{FISCAL_CAP.toFixed(1)}M</span></span>
              </div>
            </div>

            {/* Sliders list */}
            <div className="space-y-5">
              
              {/* Slider 1: Roads */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Roads & Street Networks</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4682B4]">₹{allocations.roads.toFixed(1)}M</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded",
                      allocations.roads > defaultAllocationsForLocation.roads ? "bg-emerald-500/10 text-emerald-600" :
                      allocations.roads < defaultAllocationsForLocation.roads ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    )}>
                      {allocations.roads > defaultAllocationsForLocation.roads ? `+₹${(allocations.roads - defaultAllocationsForLocation.roads).toFixed(1)}M` :
                       allocations.roads < defaultAllocationsForLocation.roads ? `-₹${(defaultAllocationsForLocation.roads - allocations.roads).toFixed(1)}M` : 'default'}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="20.0"
                  step="0.5"
                  value={allocations.roads}
                  onChange={(e) => handleSliderChange('roads', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

              {/* Slider 2: Bridges */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Bridges & Causeways</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4682B4]">₹{allocations.bridges.toFixed(1)}M</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded",
                      allocations.bridges > defaultAllocationsForLocation.bridges ? "bg-emerald-500/10 text-emerald-600" :
                      allocations.bridges < defaultAllocationsForLocation.bridges ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    )}>
                      {allocations.bridges > defaultAllocationsForLocation.bridges ? `+₹${(allocations.bridges - defaultAllocationsForLocation.bridges).toFixed(1)}M` :
                       allocations.bridges < defaultAllocationsForLocation.bridges ? `-₹${(defaultAllocationsForLocation.bridges - allocations.bridges).toFixed(1)}M` : 'default'}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="20.0"
                  step="0.5"
                  value={allocations.bridges}
                  onChange={(e) => handleSliderChange('bridges', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

              {/* Slider 3: Dams */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Dams & Water Reservoirs</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4682B4]">₹{allocations.dams.toFixed(1)}M</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded",
                      allocations.dams > defaultAllocationsForLocation.dams ? "bg-emerald-500/10 text-emerald-600" :
                      allocations.dams < defaultAllocationsForLocation.dams ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    )}>
                      {allocations.dams > defaultAllocationsForLocation.dams ? `+₹${(allocations.dams - defaultAllocationsForLocation.dams).toFixed(1)}M` :
                       allocations.dams < defaultAllocationsForLocation.dams ? `-₹${(defaultAllocationsForLocation.dams - allocations.dams).toFixed(1)}M` : 'default'}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="15.0"
                  step="0.5"
                  value={allocations.dams}
                  onChange={(e) => handleSliderChange('dams', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

              {/* Slider 4: Grid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Power Grid Nodes</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4682B4]">₹{allocations.grid.toFixed(1)}M</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded",
                      allocations.grid > defaultAllocationsForLocation.grid ? "bg-emerald-500/10 text-emerald-600" :
                      allocations.grid < defaultAllocationsForLocation.grid ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    )}>
                      {allocations.grid > defaultAllocationsForLocation.grid ? `+₹${(allocations.grid - defaultAllocationsForLocation.grid).toFixed(1)}M` :
                       allocations.grid < defaultAllocationsForLocation.grid ? `-₹${(defaultAllocationsForLocation.grid - allocations.grid).toFixed(1)}M` : 'default'}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="15.0"
                  step="0.5"
                  value={allocations.grid}
                  onChange={(e) => handleSliderChange('grid', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

              {/* Slider 5: Admin */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Administration & Support (SLA Desk)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4682B4]">₹{allocations.admin.toFixed(1)}M</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded",
                      allocations.admin > defaultAllocationsForLocation.admin ? "bg-emerald-500/10 text-emerald-600" :
                      allocations.admin < defaultAllocationsForLocation.admin ? "bg-amber-500/10 text-amber-600" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    )}>
                      {allocations.admin > defaultAllocationsForLocation.admin ? `+₹${(allocations.admin - defaultAllocationsForLocation.admin).toFixed(1)}M` :
                       allocations.admin < defaultAllocationsForLocation.admin ? `-₹${(defaultAllocationsForLocation.admin - allocations.admin).toFixed(1)}M` : 'default'}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={allocations.admin}
                  onChange={(e) => handleSliderChange('admin', parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4682B4]"
                />
              </div>

            </div>

          </CardContent>
        </Card>

        {/* Block 2: Impact Metrics & Status Monitor */}
        <Card className="border border-border-subtle bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Activity className="w-4 h-4 text-[#4682B4]" />
              Simulation Safety & SLA Impact
            </CardTitle>
            <CardDescription className="text-xs">
              Preview simulated performance parameters based on dynamic allocations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-6">
            
            {/* Big Risk Indicator */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-center">
              
              <div className="col-span-1 flex flex-col items-center border-r border-slate-200 dark:border-slate-800 pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 text-center leading-tight">Combined Risk Index</span>
                <span className={cn(
                  "text-3xl font-black mt-1.5",
                  overallRisk > 25 ? "text-red-500" : overallRisk > 15 ? "text-amber-500" : "text-emerald-500"
                )}>
                  {overallRisk}%
                </span>
                <span className={cn(
                  "text-[8px] font-extrabold uppercase px-1 rounded mt-1.5",
                  overallRisk > 25 ? "bg-red-500/10 text-red-600" : overallRisk > 15 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                )}>
                  {overallRisk > 25 ? 'Critical' : overallRisk > 15 ? 'Moderate' : 'Optimal'}
                </span>
              </div>

              <div className="col-span-2 space-y-3 pl-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500"><Wrench className="w-3.5 h-3.5 text-[#4682B4]" /> Backlog Items</span>
                  <span className={cn(
                    "font-bold text-sm",
                    backlogCases > 18 ? "text-red-500" : "text-slate-800 dark:text-slate-100"
                  )}>{backlogCases} cases</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3.5 h-3.5 text-[#4682B4]" /> Resolution SLA</span>
                  <span className={cn(
                    "font-bold text-sm",
                    resolutionSla > 60 ? "text-red-500" : "text-slate-800 dark:text-slate-100"
                  )}>{resolutionSla} hours</span>
                </div>
              </div>

            </div>

            {/* Individual Safety Indexes */}
            <div className="space-y-3.5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asset Safety Ratings</span>
              
              {/* Road safety progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Road Network Safety</span>
                  <span className={cn(roadSafety >= 80 ? 'text-emerald-500' : 'text-amber-500')}>{roadSafety}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-steel-blue transition-all duration-300" 
                    style={{ width: `${roadSafety}%` }}
                  />
                </div>
              </div>

              {/* Bridge safety progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Bridge Structural Integrity</span>
                  <span className={cn(bridgeIntegrity >= 90 ? 'text-emerald-500' : 'text-amber-500')}>{bridgeIntegrity}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-steel-blue transition-all duration-300" 
                    style={{ width: `${bridgeIntegrity}%` }}
                  />
                </div>
              </div>

              {/* Dam safety progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Dam Gate Safety Factor</span>
                  <span className={cn(damSafety >= 95 ? 'text-emerald-500' : 'text-amber-500')}>{damSafety}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-steel-blue transition-all duration-300" 
                    style={{ width: `${damSafety}%` }}
                  />
                </div>
              </div>

              {/* Grid safety progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Power Transmission Efficiency</span>
                  <span className={cn(gridEfficiency >= 85 ? 'text-emerald-500' : 'text-amber-500')}>{gridEfficiency}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-steel-blue transition-all duration-300" 
                    style={{ width: `${gridEfficiency}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Critical alert underfunding triggers */}
            <div className="h-10">
              {allocations.roads < 6.0 && (
                <div className="text-[10px] bg-red-500/10 text-red-600 p-2 border border-red-500/20 rounded flex items-center gap-1.5 font-bold leading-none animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  CRITICAL: Underfunding road resurfacing speeds asphalt micro-cracking!
                </div>
              )}
              {allocations.bridges < 5.0 && allocations.roads >= 6.0 && (
                <div className="text-[10px] bg-red-500/10 text-red-600 p-2 border border-red-500/20 rounded flex items-center gap-1.5 font-bold leading-none animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  CRITICAL: Low bridge reinforcement funding triggers sensor alarms!
                </div>
              )}
              {allocations.admin < 2.0 && allocations.roads >= 6.0 && allocations.bridges >= 5.0 && (
                <div className="text-[10px] bg-amber-500/10 text-amber-600 p-2 border border-amber-500/20 rounded flex items-center gap-1.5 font-bold leading-none">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  WARNING: SLA desk underfunded! Work order scheduling bottleneck active.
                </div>
              )}
              {allocations.roads >= 6.0 && allocations.bridges >= 5.0 && allocations.admin >= 2.0 && (
                <div className="text-[10px] bg-emerald-500/10 text-emerald-600 p-2 border border-emerald-500/20 rounded flex items-center gap-1.5 font-bold leading-none">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  No critical funding warnings detected. Telemetry thresholds stable.
                </div>
              )}
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Division 2 (Row 2): Spending Trends on Left, Cost Matrix breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Block 3: Projected spending trends area chart */}
        <Card className="border border-border-subtle bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4 h-4 text-[#4682B4]" />
              Projected Fiscal Expenditures (Area Curve)
            </CardTitle>
            <CardDescription className="text-xs">
              Cumulative spending trend across fiscal quarters Q1 to Q4 (in ₹ Millions).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center">
            
            {/* SVG Area Chart */}
            <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 flex flex-col items-center">
              <svg className="w-full aspect-[2.2/1] max-w-[420px]" viewBox="0 0 220 100">
                <defs>
                  {/* Linear Gradient for Area fill */}
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4682B4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#4682B4" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[20, 40, 60, 80].map((y) => (
                  <line 
                    key={y}
                    x1="20" y1={y} x2="210" y2={y}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Y-axis values */}
                <text x="18" y="83" textAnchor="end" className="fill-slate-400 text-[6px] font-bold">₹0M</text>
                <text x="18" y="63" textAnchor="end" className="fill-slate-400 text-[6px] font-bold">₹15M</text>
                <text x="18" y="43" textAnchor="end" className="fill-slate-400 text-[6px] font-bold">₹30M</text>
                <text x="18" y="23" textAnchor="end" className="fill-slate-400 text-[6px] font-bold">₹45M</text>

                {/* Y-axis line */}
                <line x1="20" y1="10" x2="20" y2="85" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="0.75" />
                {/* X-axis line */}
                <line x1="20" y1="85" x2="210" y2="85" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="0.75" />

                {/* Graph coordinates points:
                    Q1 -> x: 60, y: 85 - (spendingTrend.q1 / 50) * 70
                    Q2 -> x: 110, y: 85 - (spendingTrend.q2 / 50) * 70
                    Q3 -> x: 160, y: 85 - (spendingTrend.q3 / 50) * 70
                    Q4 -> x: 210, y: 85 - (spendingTrend.q4 / 50) * 70
                */}
                {(() => {
                  const xQ1 = 60;
                  const yQ1 = 85 - (spendingTrend.q1 / 50) * 70;
                  
                  const xQ2 = 110;
                  const yQ2 = 85 - (spendingTrend.q2 / 50) * 70;
                  
                  const xQ3 = 160;
                  const yQ3 = 85 - (spendingTrend.q3 / 50) * 70;
                  
                  const xQ4 = 210;
                  const yQ4 = 85 - (spendingTrend.q4 / 50) * 70;

                  const areaD = `M 20,85 L 20,${yQ1} L ${xQ1},${yQ1} L ${xQ2},${yQ2} L ${xQ3},${yQ3} L ${xQ4},${yQ4} L ${xQ4},85 Z`;
                  const lineD = `M 20,${yQ1} L ${xQ1},${yQ1} L ${xQ2},${yQ2} L ${xQ3},${yQ3} L ${xQ4},${yQ4}`;

                  return (
                    <g>
                      {/* Area Fill */}
                      <path d={areaD} fill="url(#area-grad)" />

                      {/* Area Line */}
                      <path d={lineD} fill="transparent" className="stroke-[#4682B4]" strokeWidth="2" strokeLinecap="round" />

                      {/* Node Circles */}
                      {[
                        { x: xQ1, y: yQ1, label: `₹${spendingTrend.q1.toFixed(1)}M` },
                        { x: xQ2, y: yQ2, label: `₹${spendingTrend.q2.toFixed(1)}M` },
                        { x: xQ3, y: yQ3, label: `₹${spendingTrend.q3.toFixed(1)}M` },
                        { x: xQ4, y: yQ4, label: `₹${spendingTrend.q4.toFixed(1)}M` },
                      ].map((pt, idx) => (
                        <g key={idx}>
                          <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r="3" 
                            className="fill-white dark:fill-slate-900 stroke-[#4682B4] stroke-[1.5] cursor-pointer" 
                          />
                          {/* Value label text */}
                          <text 
                            x={pt.x} 
                            y={pt.y - 6} 
                            textAnchor="middle" 
                            className="fill-slate-700 dark:fill-slate-300 text-[5px] font-black"
                          >
                            {pt.label}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })()}

                {/* X-axis labels */}
                <text x="60" y="94" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[6px] font-black">Q1 (Proj)</text>
                <text x="110" y="94" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[6px] font-black">Q2 (Proj)</text>
                <text x="160" y="94" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[6px] font-black">Q3 (Proj)</text>
                <text x="210" y="94" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[6px] font-black">Q4 (Final)</text>
              </svg>
            </div>

          </CardContent>
        </Card>

        {/* Block 4: Cost Breakdown Matrix & Dispatch Report */}
        <Card className="border border-border-subtle bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50/50 dark:bg-slate-900/50">
            <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
              <Building2 className="w-4 h-4 text-[#4682B4]" />
              Funding Optimization Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Check budget variances and submit reallocation blueprints.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between gap-4">
            
            {/* Visual Breakdown bar */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sector Percentages</span>
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex font-sans text-[8px] font-black text-white text-center">
                {totalAllocated > 0 ? (
                  <>
                    <div className="bg-[#2C5282] h-full flex items-center justify-center transition-all duration-300" style={{ width: `${(allocations.roads / totalAllocated) * 100}%` }} title="Roads">
                      {((allocations.roads / totalAllocated) * 100) > 10 && 'Roads'}
                    </div>
                    <div className="bg-[#4682B4] h-full flex items-center justify-center transition-all duration-300" style={{ width: `${(allocations.bridges / totalAllocated) * 100}%` }} title="Bridges">
                      {((allocations.bridges / totalAllocated) * 100) > 10 && 'Bridges'}
                    </div>
                    <div className="bg-[#5F9EA0] h-full flex items-center justify-center transition-all duration-300" style={{ width: `${(allocations.dams / totalAllocated) * 100}%` }} title="Dams">
                      {((allocations.dams / totalAllocated) * 100) > 10 && 'Dams'}
                    </div>
                    <div className="bg-[#B0C4DE] h-full flex items-center justify-center text-slate-800 transition-all duration-300" style={{ width: `${(allocations.grid / totalAllocated) * 100}%` }} title="Grid">
                      {((allocations.grid / totalAllocated) * 100) > 10 && 'Grid'}
                    </div>
                    <div className="bg-slate-400 h-full flex items-center justify-center transition-all duration-300" style={{ width: `${(allocations.admin / totalAllocated) * 100}%` }} title="Admin">
                      {((allocations.admin / totalAllocated) * 100) > 10 && 'Admin'}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-slate-400 text-center flex items-center justify-center font-medium">No budget allocated</div>
                )}
              </div>
            </div>

            {/* Shift Matrix table */}
            <div className="overflow-x-auto my-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-slate-400 font-bold uppercase text-[9px]">
                    <th className="pb-1.5">Asset Class</th>
                    <th className="pb-1.5 text-right">Current</th>
                    <th className="pb-1.5 text-right">Base Default</th>
                    <th className="pb-1.5 text-right">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  
                  {/* Roads */}
                  <tr>
                    <td className="py-2">Roads & Streets</td>
                    <td className="py-2 text-right">₹{allocations.roads.toFixed(1)}M</td>
                    <td className="py-2 text-right text-slate-400">₹{defaultAllocationsForLocation.roads.toFixed(1)}M</td>
                    <td className={cn(
                      "py-2 text-right font-bold",
                      allocations.roads > defaultAllocationsForLocation.roads ? "text-emerald-500" :
                      allocations.roads < defaultAllocationsForLocation.roads ? "text-amber-500" : "text-slate-400"
                    )}>
                      {allocations.roads > defaultAllocationsForLocation.roads ? `+₹${(allocations.roads - defaultAllocationsForLocation.roads).toFixed(1)}M` :
                       allocations.roads < defaultAllocationsForLocation.roads ? `-₹${(defaultAllocationsForLocation.roads - allocations.roads).toFixed(1)}M` : '0.0M'}
                    </td>
                  </tr>

                  {/* Bridges */}
                  <tr>
                    <td className="py-2">Bridges</td>
                    <td className="py-2 text-right">₹{allocations.bridges.toFixed(1)}M</td>
                    <td className="py-2 text-right text-slate-400">₹{defaultAllocationsForLocation.bridges.toFixed(1)}M</td>
                    <td className={cn(
                      "py-2 text-right font-bold",
                      allocations.bridges > defaultAllocationsForLocation.bridges ? "text-emerald-500" :
                      allocations.bridges < defaultAllocationsForLocation.bridges ? "text-amber-500" : "text-slate-400"
                    )}>
                      {allocations.bridges > defaultAllocationsForLocation.bridges ? `+₹${(allocations.bridges - defaultAllocationsForLocation.bridges).toFixed(1)}M` :
                       allocations.bridges < defaultAllocationsForLocation.bridges ? `-₹${(defaultAllocationsForLocation.bridges - allocations.bridges).toFixed(1)}M` : '0.0M'}
                    </td>
                  </tr>

                  {/* Dams */}
                  <tr>
                    <td className="py-2">Dams & Water</td>
                    <td className="py-2 text-right">₹{allocations.dams.toFixed(1)}M</td>
                    <td className="py-2 text-right text-slate-400">₹{defaultAllocationsForLocation.dams.toFixed(1)}M</td>
                    <td className={cn(
                      "py-2 text-right font-bold",
                      allocations.dams > defaultAllocationsForLocation.dams ? "text-emerald-500" :
                      allocations.dams < defaultAllocationsForLocation.dams ? "text-amber-500" : "text-slate-400"
                    )}>
                      {allocations.dams > defaultAllocationsForLocation.dams ? `+₹${(allocations.dams - defaultAllocationsForLocation.dams).toFixed(1)}M` :
                       allocations.dams < defaultAllocationsForLocation.dams ? `-₹${(defaultAllocationsForLocation.dams - allocations.dams).toFixed(1)}M` : '0.0M'}
                    </td>
                  </tr>

                  {/* Grid */}
                  <tr>
                    <td className="py-2">Smart Grid</td>
                    <td className="py-2 text-right">₹{allocations.grid.toFixed(1)}M</td>
                    <td className="py-2 text-right text-slate-400">₹{defaultAllocationsForLocation.grid.toFixed(1)}M</td>
                    <td className={cn(
                      "py-2 text-right font-bold",
                      allocations.grid > defaultAllocationsForLocation.grid ? "text-emerald-500" :
                      allocations.grid < defaultAllocationsForLocation.grid ? "text-amber-500" : "text-slate-400"
                    )}>
                      {allocations.grid > defaultAllocationsForLocation.grid ? `+₹${(allocations.grid - defaultAllocationsForLocation.grid).toFixed(1)}M` :
                       allocations.grid < defaultAllocationsForLocation.grid ? `-₹${(defaultAllocationsForLocation.grid - allocations.grid).toFixed(1)}M` : '0.0M'}
                    </td>
                  </tr>

                  {/* Admin */}
                  <tr>
                    <td className="py-2">Administration</td>
                    <td className="py-2 text-right">₹{allocations.admin.toFixed(1)}M</td>
                    <td className="py-2 text-right text-slate-400">₹{defaultAllocationsForLocation.admin.toFixed(1)}M</td>
                    <td className={cn(
                      "py-2 text-right font-bold",
                      allocations.admin > defaultAllocationsForLocation.admin ? "text-emerald-500" :
                      allocations.admin < defaultAllocationsForLocation.admin ? "text-amber-500" : "text-slate-400"
                    )}>
                      {allocations.admin > defaultAllocationsForLocation.admin ? `+₹${(allocations.admin - defaultAllocationsForLocation.admin).toFixed(1)}M` :
                       allocations.admin < defaultAllocationsForLocation.admin ? `-₹${(defaultAllocationsForLocation.admin - allocations.admin).toFixed(1)}M` : '0.0M'}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Action submit button */}
            <div className="pt-2 border-t border-border-subtle flex gap-4 w-full">
              <Button 
                onClick={handleGenerateReport}
                disabled={budgetDelta < 0}
                className={cn(
                  "w-full py-2.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors",
                  budgetDelta < 0 
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-[#4682B4] hover:bg-[#4682B4]/90"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Commit Optimization Blueprint
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Upgraded Optimization Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="border border-border-subtle bg-white dark:bg-[#0A1228] p-5">
          <CardHeader className="p-0 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Best Fund Allocation</span>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white mt-1">AI Recommendation Model</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs font-semibold text-slate-655 dark:text-slate-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Roads Target:</span>
              <span className="text-slate-950 dark:text-white font-mono">₹14.0M</span>
            </div>
            <div className="flex justify-between">
              <span>Bridges Target:</span>
              <span className="text-slate-950 dark:text-white font-mono">₹12.0M</span>
            </div>
            <div className="flex justify-between">
              <span>Dams Target:</span>
              <span className="text-slate-950 dark:text-white font-mono">₹9.0M</span>
            </div>
            <div className="flex justify-between">
              <span>Smart Grid Target:</span>
              <span className="text-slate-950 dark:text-white font-mono">₹11.5M</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border-subtle bg-white dark:bg-[#0A1228] p-5">
          <CardHeader className="p-0 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Expected Risk Reduction</span>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white mt-1">Infrastructure Safety Gains</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col justify-between h-full min-h-[70px]">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">
              {Math.max(1.0, Math.round(100 - overallRisk - 70))}% Reduction
            </span>
            <span className="text-[10px] text-slate-450 leading-relaxed font-bold">
              Derived from reallocation of administration indexes into structural joint overlays.
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border-subtle bg-white dark:bg-[#0A1228] p-5">
          <CardHeader className="p-0 pb-2">
            <span className="text-[9px] font-black uppercase text-slate-400">Projected Savings</span>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white mt-1">Prevention & Emergency Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col justify-between h-full min-h-[70px]">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450 flex items-center">
              <DollarSign className="w-5 h-5 shrink-0" />
              ₹{Math.max(12.5, parseFloat(((100 - overallRisk) * 0.45).toFixed(2)))} Lakhs / yr
            </span>
            <span className="text-[10px] text-slate-450 leading-relaxed font-bold">
              Projected reduction in emergency structural damage response fees.
            </span>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

