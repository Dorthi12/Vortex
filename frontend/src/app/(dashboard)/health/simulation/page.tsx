// app/(dashboard)/health/simulation/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, ArrowLeft, HeartPulse, Activity, AlertTriangle, ShieldCheck, 
  Settings, Play, BarChart3, TrendingUp, Info, HelpCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { SimulationChart } from '@/components/health/SimulationChart';
import { cn } from '@/lib/utils';

export default function DigitalTwinSimulator() {
  const { lastSimulationRun, loading, error, runSimulation, fetchSummary } = useHealthStore();
  const [district, setDistrict] = useState('Lucknow');
  const [pop, setPop] = useState(1000000);
  const [infected, setInfected] = useState(100);
  const [recoveryDays, setRecoveryDays] = useState(7.0);
  const [incubationDays, setIncubationDays] = useState(5.0);
  const [transmission, setTransmission] = useState(0.35);
  const [interventionDay, setInterventionDay] = useState(15);
  const [efficacy, setEfficacy] = useState(0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSimulation({
      scenario_type: 'outbreak',
      district_name: district,
      time_horizon: 90,
      population: pop,
      initial_infected: infected,
      recovery_days: recoveryDays,
      incubation_days: incubationDays,
      transmission_rate: transmission,
      intervention_day: interventionDay,
      intervention_efficacy: efficacy
    });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Back button and header */}
      <div className="flex items-center gap-3 border-b border-[#1A2744] pb-5">
        <Link href="/health">
          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-[#101F42]/40 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Healthcare Digital Twin Simulation
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Model 6 — Simulates discrete-time epidemiological curves, medical resource stress, and public policy mitigation efficacy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters Input (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Simulation Hyperparameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* District */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target District</label>
                  <select 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white"
                  >
                    {["Lucknow", "Agra", "Kanpur", "Varanasi", "Allahabad"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Numeric sliders */}
                <div className="space-y-3 pt-2">
                  
                  {/* Population */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Susceptible Population</span>
                      <span>{pop.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" min="100000" max="2500000" step="50000" value={pop} 
                      onChange={(e) => setPop(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Initial infected */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Initial Infected Seed (I0)</span>
                      <span>{infected} cases</span>
                    </div>
                    <input 
                      type="range" min="10" max="1000" step="10" value={infected} 
                      onChange={(e) => setInfected(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Transmission rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Contact Transmission Rate (β)</span>
                      <span>{transmission.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="0.9" step="0.05" value={transmission} 
                      onChange={(e) => setTransmission(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Incubation days */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Average Incubation Days (1/σ)</span>
                      <span>{incubationDays} days</span>
                    </div>
                    <input 
                      type="range" min="1" max="14" step="0.5" value={incubationDays} 
                      onChange={(e) => setIncubationDays(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Recovery days */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Average Recovery Days (1/γ)</span>
                      <span>{recoveryDays} days</span>
                    </div>
                    <input 
                      type="range" min="3" max="21" step="0.5" value={recoveryDays} 
                      onChange={(e) => setRecoveryDays(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Intervention day */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Intervention Day (Lockdown/fogging)</span>
                      <span>Day {interventionDay}</span>
                    </div>
                    <input 
                      type="range" min="1" max="60" value={interventionDay} 
                      onChange={(e) => setInterventionDay(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Intervention Efficacy */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Intervention Efficacy (%)</span>
                      <span>{(efficacy * 100).toFixed(0)}% transmission reduction</span>
                    </div>
                    <input 
                      type="range" min="0.0" max="0.95" step="0.05" value={efficacy} 
                      onChange={(e) => setEfficacy(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#1A3A6C] hover:bg-[#2A4D8C] text-white border border-[#3A5D9C] font-bold mt-4 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white text-none" />
                  {loading ? 'Executing SEIR Model...' : 'Run Simulation Run'}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Visualizing curves (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {lastSimulationRun ? (
            <div className="space-y-6">
              
              {/* Output statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <Card className="bg-[#0A1228] border border-[#1A2744] p-4 text-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peak Day</span>
                  <h3 className="text-xl font-black mt-1 text-[#D4AF37]">
                    Day {lastSimulationRun.impact_metrics.peak_day}
                  </h3>
                </Card>

                <Card className="bg-[#0A1228] border border-[#1A2744] p-4 text-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peak Infected Count</span>
                  <h3 className="text-xl font-black mt-1 text-red-400">
                    {lastSimulationRun.impact_metrics.peak_infected.toLocaleString()}
                  </h3>
                </Card>

                <Card className="bg-[#0A1228] border border-[#1A2744] p-4 text-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attack Rate %</span>
                  <h3 className="text-xl font-black mt-1 text-slate-200">
                    {lastSimulationRun.impact_metrics.attack_rate_pct}%
                  </h3>
                </Card>

                <Card className="bg-[#0A1228] border border-[#1A2744] p-4 text-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mortality Reduction</span>
                  <h3 className="text-xl font-black mt-1 text-emerald-400">
                    -{lastSimulationRun.mortality_reduction_pct}%
                  </h3>
                </Card>

              </div>

              {/* SEIR curves SVG projection */}
              <SimulationChart timeline={lastSimulationRun.timeline} height={250} />

              {/* Resource requirement projection */}
              <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
                <CardHeader className="border-b border-[#1A2744]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Projected Hospital Bed Surge requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6 text-center leading-normal">
                    <div className="bg-[#101F42]/30 border border-[#1A2744] p-4 rounded-lg">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Peak General Bed Demand</span>
                      <strong className="text-2xl font-black text-[#D4AF37]">
                        {lastSimulationRun.resource_utilization?.peak_bed_demand.toLocaleString()}
                      </strong>
                    </div>
                    <div className="bg-[#101F42]/30 border border-[#1A2744] p-4 rounded-lg">
                      <span className="text-xs text-slate-400 font-bold block mb-1">Peak ICU Beds Demand</span>
                      <strong className="text-2xl font-black text-red-400">
                        {lastSimulationRun.resource_utilization?.peak_icu_demand.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="h-full border border-dashed border-[#1A2744] bg-[#0A1228]/20 rounded-xl flex flex-col items-center justify-center text-center p-12 text-slate-500">
              <Layers className="w-12 h-12 text-[#1A3A6C] mb-4 animate-pulse" />
              <h3 className="text-sm font-extrabold text-slate-350">Digital Twin Idle</h3>
              <p className="text-xs mt-1 max-w-sm">
                Set epidemiological coefficients and execute the SEIR simulation model to plot susceptible, infected, and recovered timelines.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
