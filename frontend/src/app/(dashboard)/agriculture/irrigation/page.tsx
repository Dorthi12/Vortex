'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Droplet, CloudSun, Calendar, Info, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function IrrigationForecast() {
  const store = useAgricultureStore();

  useEffect(() => {
    store.runIrrigationForecast();
  }, [store.irriCrop, store.irriStage, store.irriMoisture, store.irriWeather]);

  // SVG Gauge variables
  const maxWaterVal = 500; // max scale 500mm or L/sqm
  const scoreVal = store.irriResult?.waterRequired || 0;
  const pct = Math.min(100, Math.max(0, (scoreVal / maxWaterVal) * 100));
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Advisory Engines
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Irrigation Forecast
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize water discharge cycles using soil moisture content and meteorological forecasting.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-250">
                <Droplet className="w-4 h-4 text-emerald-500" />
                Water Cycle Telemetry
              </CardTitle>
              <CardDescription className="text-xs">
                Set crop parameters to predict optimal watering intervals.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <FormGroup label="Target Crop">
                <Select 
                  value={store.irriCrop} 
                  onChange={(e) => store.setField('irriCrop', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnuts">Groundnuts</option>
                </Select>
              </FormGroup>

              <FormGroup label="Growth Stage">
                <Select 
                  value={store.irriStage} 
                  onChange={(e) => store.setField('irriStage', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Initial Germination">Initial Germination</option>
                  <option value="Vegetative Phase">Vegetative Phase</option>
                  <option value="Flowering / Panicle Initiation">Flowering / Panicle Initiation</option>
                  <option value="Yield Formation / Maturity">Yield Formation / Maturity</option>
                  <option value="Harvest Phase">Harvest Phase</option>
                </Select>
              </FormGroup>

              <FormGroup label="Weather Conditions">
                <Select 
                  value={store.irriWeather} 
                  onChange={(e) => store.setField('irriWeather', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Partly Cloudy, No Rain Forecast">Partly Cloudy, No Rain</option>
                  <option value="Scattered Showers, 12mm Rain Expected">Scattered Showers (12mm)</option>
                  <option value="Heavy Rain Alert, Flood Risk">Heavy Rain Alert</option>
                  <option value="Heatwave Alert, Extreme Evaporation">Heatwave Alert</option>
                </Select>
              </FormGroup>

              {/* Soil Moisture Slider */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Soil Moisture Level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.irriMoisture}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={store.irriMoisture}
                  onChange={(e) => store.setField('irriMoisture', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output Dials & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Circular Gauge: Water Required */}
            <Card className="md:col-span-2 bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">Water Volume Target</span>
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx="50"
                    cy="50"
                    className="text-slate-100 dark:text-slate-900"
                  />
                  <circle
                    stroke="#3b82f6"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {store.irriResult?.waterRequired}
                  </span>
                  <span className="text-[8px] uppercase font-bold text-slate-400">Liters / Sqm</span>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs font-bold text-slate-450 block">Requirement Level</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 block mt-0.5">
                  {pct > 60 ? 'Heavy Irrigation Required' : pct > 20 ? 'Moderate Supplement' : 'Adequate Moisture'}
                </span>
              </div>
            </Card>

            {/* Target Schedule Info */}
            <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3">Schedule Outlaw</span>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 uppercase font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      Next Target Date
                    </span>
                    <strong className="text-sm font-black text-slate-800 dark:text-slate-150 block">
                      {store.irriResult?.nextDate}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 uppercase font-bold flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      Water Stress Risk
                    </span>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block',
                      store.irriResult?.waterStressRisk === 'None' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : store.irriResult?.waterStressRisk === 'Mild'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                    )}>
                      {store.irriResult?.waterStressRisk} Risk
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-[#1A2744] pt-2.5 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Telemetry source: IMD grid
              </div>
            </Card>

          </div>

          {/* Meteorological sync warnings */}
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-500" />
                Meteorological Forecast & Crop Protection Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs text-slate-500 font-semibold leading-relaxed">
              
              {store.irriWeather.includes('Rain') ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                  <CloudSun className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Rainfall suppression triggered:</strong> The weather model predicts natural precipitation. Drip and micro-sprinklers should be disabled to prevent waterlogging and root rot.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-700 dark:text-[#D4AF37] flex items-start gap-2">
                  <CloudSun className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>High evaporation rate alert:</strong> Dry atmospheric parameters indicate increased transpiration loss. Run drip systems for 2.5 hours starting at early dawn (5:30 AM) to optimize water absorption.
                  </p>
                </div>
              )}

              <p className="pl-1">
                For heavy-feeders like Sugarcane, keeping moisture index above 65% is essential during the active elongation phase. If soil moisture falls below 35%, cellular turgor drops, reducing expected sucrose accumulation.
              </p>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
