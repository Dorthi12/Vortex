'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Play, 
  RefreshCw, 
  HelpCircle, 
  Activity, 
  Users, 
  Coins, 
  CloudRain, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  Map,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

type Scenario = 'Flood' | 'Disease' | 'Budget' | 'Migration';

interface OutputMetric {
  label: string;
  value: string;
  status: 'critical' | 'stable' | 'optimal';
  desc: string;
}

export default function SimulationPage() {
  const { setActiveTab } = useUiStore();
  const [activeScenario, setActiveScenario] = useState<Scenario>('Flood');

  // Input states (sliders 0-100)
  const [population, setPopulation] = useState<number>(45);
  const [budget, setBudget] = useState<number>(60);
  const [rainfall, setRainfall] = useState<number>(30);
  const [resources, setResources] = useState<number>(70);

  // Simulation Running State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simRunCount, setSimRunCount] = useState<number>(0);

  useEffect(() => {
    setActiveTab('Simulation');
  }, [setActiveTab]);

  // Handle run simulation trigger animation
  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setSimRunCount(c => c + 1);
    }, 1000);
  };

  // Reset sliders
  const handleResetSliders = () => {
    setPopulation(45);
    setBudget(60);
    setRainfall(30);
    setResources(70);
  };

  // Calculate dynamic outputs based on sliders + active scenario
  const outputMetrics = useMemo((): OutputMetric[] => {
    switch (activeScenario) {
      case 'Flood': {
        const severity = Math.max(0, Math.floor((rainfall * 1.2 + population * 0.4 - resources * 0.6)));
        let status: OutputMetric['status'] = 'stable';
        if (severity > 65) status = 'critical';
        else if (severity < 30) status = 'optimal';

        return [
          { 
            label: 'Inundation Severity Index', 
            value: `${severity}%`, 
            status, 
            desc: 'Calculated threat level for Mula river lower elevation basin.' 
          },
          { 
            label: 'Required Evacuation Units', 
            value: `${Math.floor(population * 0.8 * (severity / 50))} Wards`, 
            status: severity > 60 ? 'critical' : 'stable',
            desc: 'Targeted residential blocks needing emergency evacuation routes.' 
          },
          { 
            label: 'Bridges Stress Factor', 
            value: `${Math.floor(40 + severity * 0.5)} MPa`, 
            status: severity > 70 ? 'critical' : 'stable',
            desc: 'Calculated structural stress threshold across causeways.' 
          }
        ];
      }
      case 'Disease': {
        const outbreakRisk = Math.max(0, Math.floor((population * 1.1 + rainfall * 0.5 - resources * 0.7 - budget * 0.3)));
        let status: OutputMetric['status'] = 'stable';
        if (outbreakRisk > 60) status = 'critical';
        else if (outbreakRisk < 25) status = 'optimal';

        return [
          { 
            label: 'Transmission Vector Risk', 
            value: `${outbreakRisk}%`, 
            status, 
            desc: 'Dengue & water-borne outbreak transmission coefficient.' 
          },
          { 
            label: 'Hospital Bed Shortage', 
            value: outbreakRisk > 50 ? `+${Math.floor((outbreakRisk - 50) * 12)} Beds` : 'Zero Deficit', 
            status: outbreakRisk > 50 ? 'critical' : 'optimal',
            desc: 'Projected diagnostic bed shortages across municipal clinics.' 
          },
          { 
            label: 'Outbreak Containment Cost', 
            value: `₹${((outbreakRisk * 15) / 10).toFixed(1)} Cr`, 
            status: 'stable',
            desc: 'Emergency health outlay required to block containment zones.' 
          }
        ];
      }
      case 'Budget': {
        const fiscalDeficit = Math.max(0, Math.floor((100 - budget) * 1.2 + population * 0.3 - resources * 0.4));
        let status: OutputMetric['status'] = 'stable';
        if (fiscalDeficit > 70) status = 'critical';
        else if (fiscalDeficit < 30) status = 'optimal';

        return [
          { 
            label: 'Fiscal Allocation Deficit', 
            value: `${fiscalDeficit}%`, 
            status, 
            desc: 'Consolidated fiscal shortfall against the development plan.' 
          },
          { 
            label: 'Subsidies Cap Restrictions', 
            value: fiscalDeficit > 50 ? 'Severe Restrictions' : 'Standard Cap', 
            status: fiscalDeficit > 50 ? 'critical' : 'optimal',
            desc: 'Bylaw limitations applied on solar rooftop net-metering grants.' 
          },
          { 
            label: 'Credit Leverage Capacity', 
            value: `₹${(Math.max(5, 120 - fiscalDeficit * 1.1)).toFixed(0)} Cr`, 
            status: 'stable',
            desc: 'State credit reserve leverage buffer capability.' 
          }
        ];
      }
      case 'Migration': {
        const migrationFlow = Math.max(0, Math.floor((population * 0.8 + resources * 0.6 - budget * 0.5)));
        let status: OutputMetric['status'] = 'stable';
        if (migrationFlow > 65) status = 'critical';
        else if (migrationFlow < 35) status = 'optimal';

        return [
          { 
            label: 'Inward Urban Transit Rate', 
            value: `+${migrationFlow * 120} Wards/Day`, 
            status, 
            desc: 'Projected inward population transit count into outer wards.' 
          },
          { 
            label: 'Sub-division Utility Load', 
            value: `${Math.floor(50 + migrationFlow * 0.45)}% Demand`, 
            status: migrationFlow > 60 ? 'critical' : 'stable',
            desc: 'Electrical grid & municipal sewage expansion load multiplier.' 
          },
          { 
            label: 'Affordable Housing Shortfall', 
            value: `${Math.floor(migrationFlow * 12)} Units`, 
            status: migrationFlow > 50 ? 'critical' : 'stable',
            desc: 'Affordable shelter deficits calculated in Hadapsar districts.' 
          }
        ];
      }
    }
  }, [activeScenario, population, budget, rainfall, resources]);

  // Dynamic SVG Chart Coordinates based on sliders
  const chartPath = useMemo(() => {
    // Generate a nice curve representing the forecast trend
    const severityFactor = outputMetrics[0].value.replace('%', '');
    const sev = parseFloat(severityFactor) || 50;
    
    // We map 5 coordinates along the curve
    const p1 = { x: 50, y: 140 - sev * 0.2 };
    const p2 = { x: 150, y: 130 - sev * 0.5 };
    const p3 = { x: 250, y: 110 - sev * 0.8 };
    const p4 = { x: 350, y: 80 - sev * 1.1 };
    const p5 = { x: 450, y: 60 - sev * 1.3 };

    return `M 50 140 Q 150 ${p2.y} 250 ${p3.y} T 450 ${p5.y}`;
  }, [outputMetrics]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-blue-900 dark:text-brand-yellow font-bold">
              Predictive Crisis Simulation Engine
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Simulation Engine UI
          </h1>
          <p className="text-slate-850 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Run multi-variable scenarios (Flood, Disease, Budget, Migration) to model policy stresses.
          </p>
        </div>

        {/* Dynamic Scenario Selection */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['Flood', 'Disease', 'Budget', 'Migration'] as Scenario[]).map((scen) => (
            <button
              key={scen}
              onClick={() => setActiveScenario(scen)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all",
                activeScenario === scen
                  ? "bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-850"
              )}
            >
              {scen === 'Flood' ? '🌧️ Flood' : scen === 'Disease' ? '🦠 Disease' : scen === 'Budget' ? '💰 Budget' : '🚶 Migration'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Sliders & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
                  Scenario Parameter Inputs
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                  Adjust metrics to recalculate crisis risk values.
                </CardDescription>
              </div>
              <button 
                onClick={handleResetSliders}
                className="p-1.5 rounded-lg border border-border text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                title="Reset Parameters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </CardHeader>
            <CardContent className="p-4.5 space-y-5">
              
              {/* Slider 1: Population Density */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-900 dark:text-emerald-500" />
                    <span>Population Density</span>
                  </span>
                  <span className="font-mono text-blue-950 dark:text-emerald-400 font-bold">{population}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={population}
                  onChange={(e) => setPopulation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-slate-900 dark:text-slate-500 font-bold">
                  <span>LOW DENSITY</span>
                  <span>CONGESTED GRID</span>
                </div>
              </div>

              {/* Slider 2: Budget Allowance */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-blue-900 dark:text-emerald-500" />
                    <span>Budget Allocation</span>
                  </span>
                  <span className="font-mono text-blue-950 dark:text-emerald-400 font-bold">{budget}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-slate-900 dark:text-slate-500 font-bold">
                  <span>FISCAL CRISIS</span>
                  <span>SURPLUS FUNDS</span>
                </div>
              </div>

              {/* Slider 3: Rainfall Discharge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-blue-900 dark:text-emerald-500" />
                    <span>Rainfall / Discharge</span>
                  </span>
                  <span className="font-mono text-blue-950 dark:text-emerald-400 font-bold">{rainfall}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rainfall}
                  onChange={(e) => setRainfall(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-slate-900 dark:text-slate-500 font-bold">
                  <span>DROUGHT MARGIN</span>
                  <span>CLOUDBURST PEAK</span>
                </div>
              </div>

              {/* Slider 4: Infrastructure Resources */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-blue-900 dark:text-emerald-500" />
                    <span>Mitigation Resources</span>
                  </span>
                  <span className="font-mono text-blue-950 dark:text-emerald-400 font-bold">{resources}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={resources}
                  onChange={(e) => setResources(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-emerald-500"
                />
                <div className="flex justify-between text-[8px] text-slate-900 dark:text-slate-500 font-bold">
                  <span>DEPLETED CORPS</span>
                  <span>FULLY STOCKED</span>
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="pt-2 border-t border-border/60">
                <button
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isRunning ? 'CALCULATING PROJECTIONS...' : 'EXECUTE SIMULATION MODEL'}</span>
                </button>
              </div>

            </CardContent>
          </Card>

          {/* Quick Warnings / Impact Summary Card */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <span>Telemetry Alert Matrix</span>
            </h3>
            <div className="text-[11px] text-slate-950 dark:text-slate-400 space-y-2 leading-relaxed font-sans font-medium">
              {population > 70 && (
                <div className="p-2.5 bg-red-500/10 text-red-900 dark:text-red-400 border border-red-500/20 rounded-lg font-bold">
                  ⚠️ Congestion risk detected in Hadapsar sector 4-B. Utility channels are near saturation levels.
                </div>
              )}
              {rainfall > 80 && activeScenario === 'Flood' && (
                <div className="p-2.5 bg-red-500/10 text-red-900 dark:text-red-400 border border-red-500/20 rounded-lg font-bold">
                  ⚠️ Mula gauge levels forecast exceeds causeway heights. Dam release schedules should be modified.
                </div>
              )}
              {budget < 30 && (
                <div className="p-2.5 bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-500/20 rounded-lg font-bold">
                  ⚠️ Low budget allocations limits solar rooftop net-metering support. Project delays expected.
                </div>
              )}
              {population <= 70 && rainfall <= 80 && budget >= 30 && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-950 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
                  ✅ Grid telemetry models indicate stable parameters. No crisis warning overrides needed.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Simulation Outputs & Visualizations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Output metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {outputMetrics.map((met, idx) => (
              <Card key={idx} className="bg-card border-border shadow-2xs p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">
                    {met.label}
                  </p>
                  <h3 className={cn(
                    "text-xl font-black font-mono mt-1",
                    met.status === 'critical' ? 'text-rose-600 dark:text-rose-400' :
                    met.status === 'optimal' ? 'text-emerald-600 dark:text-emerald-450' : 'text-blue-950 dark:text-white'
                  )}>
                    {met.value}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-900 dark:text-slate-450 mt-3 leading-snug font-medium font-sans">
                  {met.desc}
                </p>
              </Card>
            ))}
          </div>

          {/* Forecast Chart Panel */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <span>Forecast Trend Curve (48h Interval)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex items-center justify-center">
              <div className="w-full max-w-lg aspect-video relative bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                
                {/* SVG Chart */}
                <svg viewBox="0 0 500 200" className="w-full h-full text-slate-300 dark:text-slate-700">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="50" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="150" y1="20" x2="150" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="250" y1="20" x2="250" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="350" y1="20" x2="350" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="450" y1="20" x2="450" y2="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  
                  <line x1="50" y1="140" x2="450" y2="140" stroke="currentColor" strokeWidth="1" />
                  <line x1="50" y1="80" x2="450" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="20" x2="450" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Axes labels */}
                  <text x="40" y="145" fill="currentColor" fontSize="8" fontWeight="bold">0%</text>
                  <text x="35" y="85" fill="currentColor" fontSize="8" fontWeight="bold">50%</text>
                  <text x="30" y="25" fill="currentColor" fontSize="8" fontWeight="bold">100%</text>
                  
                  <text x="50" y="175" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">T+0h</text>
                  <text x="150" y="175" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">T+12h</text>
                  <text x="250" y="175" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">T+24h</text>
                  <text x="350" y="175" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">T+36h</text>
                  <text x="450" y="175" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">T+48h</text>

                  {/* Trend Curve Line */}
                  <path
                    d={chartPath}
                    fill="none"
                    stroke={activeScenario === 'Flood' ? '#3b82f6' : activeScenario === 'Disease' ? '#10b981' : activeScenario === 'Budget' ? '#f59e0b' : '#8b5cf6'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />

                  {/* Gradient Area Fill under curve */}
                  <path
                    d={`${chartPath} L 450 140 L 50 140 Z`}
                    fill={activeScenario === 'Flood' ? 'rgba(59, 130, 246, 0.08)' : activeScenario === 'Disease' ? 'rgba(16, 185, 129, 0.08)' : activeScenario === 'Budget' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(139, 92, 246, 0.08)'}
                    className="transition-all duration-700"
                  />
                </svg>

                {/* Legend indicator overlay */}
                <div className="absolute top-4 right-4 bg-card border border-border px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs select-none">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    activeScenario === 'Flood' ? 'bg-blue-600' : activeScenario === 'Disease' ? 'bg-emerald-500' : activeScenario === 'Budget' ? 'bg-amber-500' : 'bg-purple-500'
                  )} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-400">
                    {activeScenario} Severity Curve
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GIS Grid Cell Visualizer */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <Map className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <span>GIS Sub-division Grid Density</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex justify-center">
              <div className="w-full max-w-sm grid grid-cols-5 gap-2.5">
                {Array.from({ length: 25 }).map((_, idx) => {
                  // Calculate dynamic colors per cell based on sliders
                  const seed = (idx * 7) % 100;
                  const factor = Math.max(0, Math.floor(
                    (population * 0.4 + rainfall * 0.6) * (seed / 100)
                  ));

                  let cellColor = 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800';
                  if (factor > 65) {
                    cellColor = 'bg-rose-500/25 border-rose-500/50 dark:bg-rose-950/40 dark:border-rose-500/50';
                  } else if (factor > 35) {
                    cellColor = 'bg-amber-500/20 border-amber-500/40 dark:bg-amber-950/35 dark:border-amber-500/50';
                  } else if (factor > 15) {
                    cellColor = 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/40';
                  }

                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "aspect-square rounded-lg border flex flex-col items-center justify-center text-[8px] font-bold font-mono transition-all duration-300",
                        cellColor
                      )}
                      title={`Sector ${idx + 1} Load: ${factor}%`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
