'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  TrendingUp, 
  Droplet, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  CloudSun, 
  ChevronRight,
  TrendingDown,
  Gauge,
  Wheat,
  LayoutGrid,
  DollarSign,
  Phone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

// Types for Farm Plots
interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  area: number; // Hectares
  moisture: number; // %
  ph: number;
  irrigation: 'Drip' | 'Sprinkler' | 'Canal' | 'Rainfed';
  coords: { x: number; y: number; width: number; height: number };
}

const MOCK_PLOTS: FarmPlot[] = [
  { id: 'plot-1', name: 'North Sector A', crop: 'Sugarcane', area: 12.5, moisture: 72, ph: 6.8, irrigation: 'Drip', coords: { x: 5, y: 10, width: 42, height: 35 } },
  { id: 'plot-2', name: 'North Sector B', crop: 'Rice (Paddy)', area: 8.2, moisture: 85, ph: 6.2, irrigation: 'Canal', coords: { x: 52, y: 10, width: 43, height: 35 } },
  { id: 'plot-3', name: 'Central Sector A', crop: 'Cotton', area: 15.0, moisture: 48, ph: 7.2, irrigation: 'Sprinkler', coords: { x: 5, y: 50, width: 28, height: 40 } },
  { id: 'plot-4', name: 'Central Sector B', crop: 'Wheat', area: 10.4, moisture: 64, ph: 6.5, irrigation: 'Drip', coords: { x: 37, y: 50, width: 28, height: 40 } },
  { id: 'plot-5', name: 'South Sector', crop: 'Groundnuts', area: 6.8, moisture: 55, ph: 6.9, irrigation: 'Rainfed', coords: { x: 69, y: 50, width: 26, height: 40 } },
];

export default function AgricultureOverview() {
  const { setActiveTab } = useUiStore();
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(MOCK_PLOTS[0]);
  const [activeTabSub, setActiveTabSub] = useState<'map' | 'weather'>('map');
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<'soil_check' | 'pest_control' | 'subsidy_help' | 'market_advice' | 'general'>('general');

  // Sync sidebar active highlight
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HEADER                                                                 */}
      {/* ========================================================================= */}
      <div className="border-b border-border-subtle pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sea-green animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
            Agricultural Operations
          </span>
          <span className="text-slate-350 dark:text-slate-650">â€¢</span>
          <span className="text-xs text-slate-500 font-semibold">Agro-Intelligence Core</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Agriculture Intelligence
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Real-time soil telemetry, predictive yield models, localized advisory logs, and mandi market indexing.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* CALL PROFESSIONAL â€” Quick Service Grid                                     */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-sea-green" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Call a Professional</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Soil & Crop */}
          <button
            onClick={() => { setSelectedService('soil_check'); setIsProfModalOpen(true); }}
            className="group text-left p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97] bg-gradient-to-br from-emerald-700 via-emerald-800 to-green-900 border-2 border-emerald-500 shadow-lg shadow-emerald-900/40 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-800 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-800/50"
          >
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 group-hover:bg-white/25 transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-black text-white drop-shadow">Soil &amp; Crop Check</h4>
            <p className="text-[11px] text-emerald-100 mt-1 leading-snug font-medium">In-person soil analysis &amp; yield audit</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-200 group-hover:text-white group-hover:gap-2 transition-all uppercase tracking-wide">
              Book Visit <ChevronRight className="w-3 h-3" />
            </span>
          </button>

          {/* Pest Control */}
          <button
            onClick={() => { setSelectedService('pest_control'); setIsProfModalOpen(true); }}
            className="group text-left p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97] bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 border-2 border-amber-500 shadow-lg shadow-amber-900/40 hover:from-amber-500 hover:via-orange-600 hover:to-red-700 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-800/50"
          >
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 group-hover:bg-white/25 transition-colors">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-black text-white drop-shadow">Pest Alert Response</h4>
            <p className="text-[11px] text-amber-100 mt-1 leading-snug font-medium">IPM specialist for outbreak management</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-200 group-hover:text-white group-hover:gap-2 transition-all uppercase tracking-wide">
              Call Specialist <ChevronRight className="w-3 h-3" />
            </span>
          </button>

          {/* Subsidy */}
          <button
            onClick={() => { setSelectedService('subsidy_help'); setIsProfModalOpen(true); }}
            className="group text-left p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97] bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 border-2 border-indigo-500 shadow-lg shadow-indigo-900/40 hover:from-indigo-500 hover:via-violet-600 hover:to-purple-700 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-800/50"
          >
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 group-hover:bg-white/25 transition-colors">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-black text-white drop-shadow">Subsidy Advisor</h4>
            <p className="text-[11px] text-indigo-100 mt-1 leading-snug font-medium">Scheme eligibility &amp; application support</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-200 group-hover:text-white group-hover:gap-2 transition-all uppercase tracking-wide">
              Get Guidance <ChevronRight className="w-3 h-3" />
            </span>
          </button>

          {/* Market */}
          <button
            onClick={() => { setSelectedService('market_advice'); setIsProfModalOpen(true); }}
            className="group text-left p-5 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97] bg-gradient-to-br from-blue-600 via-sky-700 to-cyan-800 border-2 border-blue-500 shadow-lg shadow-blue-900/40 hover:from-blue-500 hover:via-sky-600 hover:to-cyan-700 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-800/50"
          >
            <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 group-hover:bg-white/25 transition-colors">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-black text-white drop-shadow">Market Counsel</h4>
            <p className="text-[11px] text-blue-100 mt-1 leading-snug font-medium">APMC pricing &amp; selling strategy</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-200 group-hover:text-white group-hover:gap-2 transition-all uppercase tracking-wide">
              Connect Now <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI MATRIX (6 Cards)                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Cultivated Land */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-sea-green p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Cultivated Land</span>
              <Sprout className="w-4 h-4 text-sea-green" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">52.9 Ha</h3>
          </div>
          <span className="text-[10px] font-semibold text-sea-green mt-2">5 active farm plots</span>
        </Card>

        {/* KPI 2: Harvest Prediction */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-dark-green p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Harvest Forecast</span>
              <Wheat className="w-4 h-4 text-dark-green" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">214.5 T</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2">Avg yield: 4.05 Tons/Ha</span>
        </Card>

        {/* KPI 3: Recommend Match */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-sea-green p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Top Rec Crop</span>
              <LayoutGrid className="w-4 h-4 text-sea-green" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 leading-none">Rice (Paddy)</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2">94% Suitability score</span>
        </Card>

        {/* KPI 4: Pest Threat */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-warning p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Pest Threat</span>
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">Moderate</h3>
          </div>
          <span className="text-[10px] font-bold text-warning mt-2">1 active warning (Aphids)</span>
        </Card>

        {/* KPI 5: Market Index */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-dark-green p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Mandi Index</span>
              <DollarSign className="w-4 h-4 text-dark-green" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2 leading-none">â‚¹5,400/Q</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2 flex items-center gap-0.5 text-success">
            <TrendingUp className="w-3 h-3" /> +3.2% this week
          </span>
        </Card>

        {/* KPI 6: Active Subsidies */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-sea-green p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Subsidies Open</span>
              <FileText className="w-4 h-4 text-sea-green" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">3 Schemes</h3>
          </div>
          <span className="text-[10px] font-semibold text-sea-green mt-2">Drip irrigation: 80% credit</span>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION (SVG FARM MAPS vs WEATHER INTEL)                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Farm Map / Weather Card */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-xs flex flex-col justify-between min-h-[390px]">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold">Sector 4B Farm Intelligence Map</CardTitle>
              <CardDescription className="text-[11px]">
                Interactive parcel mapping detailing crop types, pH metrics, and moisture levels
              </CardDescription>
            </div>
            
            {/* View Mode Toggle Controls */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
              <button
                onClick={() => setActiveTabSub('map')}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all',
                  activeTabSub === 'map' 
                    ? 'bg-white dark:bg-slate-800 text-sea-green dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                )}
              >
                Farm Map
              </button>
              <button
                onClick={() => setActiveTabSub('weather')}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all',
                  activeTabSub === 'weather' 
                    ? 'bg-white dark:bg-slate-800 text-sea-green dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                )}
              >
                Weather Telemetry
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 relative bg-slate-50/50 dark:bg-slate-900/60 p-0 overflow-hidden flex items-center justify-center min-h-[300px]">
            {activeTabSub === 'map' ? (
              <div className="relative w-full h-full p-4 flex items-center justify-center">
                {/* SVG Map Layout */}
                <svg className="w-full max-w-[420px] aspect-square text-slate-200 dark:text-slate-800" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid background contour lines */}
                  <defs>
                    <pattern id="farmGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.25" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#farmGrid)" opacity="0.3" />
                  
                  {/* Render Farm plots as clickable SVG shapes */}
                  {MOCK_PLOTS.map((plot) => {
                    const isSelected = selectedPlot?.id === plot.id;
                    
                    // Explicit styles to avoid CSS relative-color SVG rendering bugs
                    const getPlotStyle = () => {
                      if (isSelected) {
                        return {
                          fill: 'rgba(11, 74, 37, 0.45)', // dark-green selected background
                          stroke: '#0B4A25', // dark-green border
                          strokeWidth: '2.5px'
                        };
                      }
                      
                      // For Sugarcane and Wheat, style as dark green/black backdrop blocks as in user's image
                      if (plot.crop === 'Sugarcane' || plot.crop === 'Wheat') {
                        return {
                          fill: '#0B4A25', // Dark green backdrop
                          stroke: '#2E8B57', // Sea green border
                          strokeWidth: '2px'
                        };
                      }

                      // Rice (Paddy): light green block
                      if (plot.moisture >= 80) {
                        return {
                          fill: 'rgba(16, 185, 129, 0.15)', // emerald-500/15
                          stroke: '#10B981', // emerald-500
                          strokeWidth: '2px'
                        };
                      }

                      // Cotton, Groundnuts: light cream/amber block
                      return {
                        fill: 'rgba(245, 158, 11, 0.1)', // amber-500/10
                        stroke: '#F59E0B', // amber-500
                        strokeWidth: '2px'
                      };
                    };

                    const getPlotTextColor = () => {
                      // Sugarcane and Wheat are the dark backdrop blocks -> Text is vibrant crop yellow for excellent contrast!
                      if (plot.crop === 'Sugarcane' || plot.crop === 'Wheat') {
                        return '#EAB308'; // Bright yellow
                      }
                      // Rice: dark green text on light green background
                      if (plot.moisture >= 80) {
                        return '#064E3B'; 
                      }
                      // Cotton, Groundnuts: dark brown text on light cream background
                      return '#78350F';
                    };

                    const style = getPlotStyle();
                    const textColor = getPlotTextColor();

                    return (
                      <g key={plot.id} className="cursor-pointer" onClick={() => setSelectedPlot(plot)}>
                        <rect
                          x={plot.coords.x}
                          y={plot.coords.y}
                          width={plot.coords.width}
                          height={plot.coords.height}
                          rx="4"
                          style={{
                            fill: style.fill,
                            stroke: style.stroke,
                            strokeWidth: style.strokeWidth,
                          }}
                          className="transition-all duration-200 hover:brightness-105"
                        />
                        <text
                          x={plot.coords.x + plot.coords.width / 2}
                          y={plot.coords.y + plot.coords.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="3.4"
                          style={{ fill: textColor }}
                          className="font-black pointer-events-none uppercase tracking-wide"
                        >
                          {plot.crop}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Map legend overlay */}
                <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 rounded-lg text-[9px] font-bold border border-border-subtle flex flex-col gap-1 text-slate-500 shadow-md">
                  <span className="text-slate-800 dark:text-slate-200 border-b border-border-subtle pb-0.5 mb-0.5 font-extrabold uppercase">Soil Moisture</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> High (&gt;80%)</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sea-green" /> Optimal (60-80%)</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Dry (&lt;60%)</span>
                </div>
              </div>
            ) : (
              // Weather Intelligence panel
              <div className="w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Weather dials */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-border-subtle shadow-2xs">
                    <div className="h-10 w-10 rounded-full bg-sea-green/10 flex items-center justify-center shrink-0 text-sea-green">
                      <CloudSun className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Temperature & Sky</span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">28.5Â°C â€¢ Partial Cloud</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-border-subtle shadow-2xs">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                      <Droplet className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Humidity Level</span>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">74% Atmospheric Moisture</h4>
                    </div>
                  </div>
                </div>

                {/* Rain forecast & advice */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-border-subtle flex flex-col justify-between shadow-2xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-sea-green animate-pulse" />
                      <span className="text-[9px] uppercase font-bold text-sea-green">IMD Crop Advisory</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed">
                      Drizzling showers forecasted starting at 2 PM. Farmers are advised to delay chemical fertilizer sprays and suspend active micro-irrigation cycles for the next 24 hours.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold border-t border-slate-100 dark:border-slate-900 pt-2.5 mt-4">
                    Precipitation probability: 82%
                  </div>
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected plot inspect drawer */}
        <Card className="bg-card border-border-subtle shadow-xs flex flex-col justify-between min-h-[390px]">
          <CardHeader className="pb-3 border-b border-border-subtle">
            <CardTitle>Plot Inspect Panel</CardTitle>
            <CardDescription>Click a farm map sector to inspect soil indices</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-5 flex flex-col justify-between">
            {selectedPlot ? (
              <div className="space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{selectedPlot.id}</span>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                      selectedPlot.moisture >= 60 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                    )}>
                      {selectedPlot.moisture >= 60 ? 'Healthy Moisture' : 'Dry Alert'}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">{selectedPlot.name}</h4>
                  
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Cultivated Crop:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedPlot.crop}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Sector Size:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedPlot.area} Hectares</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Soil pH rating:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedPlot.ph} pH</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Soil Moisture:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedPlot.moisture}%</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Irrigation Delivery:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{selectedPlot.irrigation}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link href="/agriculture/yield" passHref className="block">
                    <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-[11px] py-1.5 h-9 cursor-pointer">
                      Simulate Yield Prediction
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      setSelectedService('soil_check');
                      setIsProfModalOpen(true);
                    }}
                    className="w-full bg-sea-green hover:bg-dark-green text-white flex items-center justify-center gap-1.5 text-[11px] py-1.5 h-9 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Professional for Soil Check
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-450 py-10">
                <Sprout className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                Select a plot coordinate on the locator map to inspect detail variables.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 4. NAVIGATION MODULES SHORTCUT GRID (6 Cards)                             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Agricultural Command Core Modules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* Module 1: Crop Yield â€” Emerald */}
          <Link href="/agriculture/yield" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-emerald-500 bg-gradient-to-br from-card to-emerald-950/10 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 hover:from-emerald-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                    <Wheat className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-400 transition-colors">
                    Crop Yield Prediction
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Calculate expected seasonal harvest outputs (Tons) based on farm area size, region temperature, average rainfall and pH scales.
                </p>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Access Simulator <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Module 2: Crop Recommendation â€” Teal */}
          <Link href="/agriculture/recommendation" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-teal-500 bg-gradient-to-br from-card to-teal-950/10 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 hover:from-teal-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:bg-teal-500/30 transition-colors">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-400 transition-colors">
                    Crop Recommendation
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Determine optimal crops for planting based on soil nutrient measurements (Nitrogen, Phosphorus, Potassium) and moisture profiles.
                </p>
              </div>
              <span className="text-[10px] text-teal-400 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Match Crops <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Module 3: Fertilizer Advisor â€” Lime */}
          <Link href="/agriculture/fertilizer" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-lime-500 bg-gradient-to-br from-card to-lime-950/10 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/10 hover:from-lime-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-lime-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-400 shrink-0 group-hover:bg-lime-500/30 transition-colors">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-lime-400 transition-colors">
                    Fertilizer Advisor
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Input target crops and check current soil deficits to calculate Urea, DAP, and MOP dosages with composting guidelines.
                </p>
              </div>
              <span className="text-[10px] text-lime-400 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Analyze Soil <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Module 4: Market Intelligence â€” Blue */}
          <Link href="/agriculture/market" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-blue-950/10 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 hover:from-blue-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-400 transition-colors">
                    Market Intelligence
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Monitor live wholesale Mandi trading prices, compare regional crop valuations, and view 6-month historical indices.
                </p>
              </div>
              <span className="text-[10px] text-blue-400 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Check Mandi Prices <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Module 5: Pest Alerts â€” Amber */}
          <Link href="/agriculture/pests" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-amber-500 bg-gradient-to-br from-card to-amber-950/10 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:from-amber-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500/30 transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors">
                    Pest Alerts
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  View localized biological infestation warning ratings, inspect outbreak hotspots, and access chemical treatment plans.
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Monitor Warnings <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

          {/* Module 6: Subsidy Advisor â€” Violet */}
          <Link href="/agriculture/subsidies" className="block group">
            <Card className="relative overflow-hidden p-5 border-border-subtle shadow-xs flex flex-col justify-between min-h-[150px] cursor-pointer transition-all duration-200 border-l-4 border-l-violet-500 bg-gradient-to-br from-card to-violet-950/10 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 hover:from-violet-950/25 active:scale-[0.98]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 group-hover:bg-violet-500/30 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-violet-400 transition-colors">
                    Subsidy Advisor
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Review open agricultural welfare schemes, check farming eligibility thresholds, and simulate application validation checks.
                </p>
              </div>
              <span className="text-[10px] text-violet-400 font-bold flex items-center gap-0.5 mt-4 self-end group-hover:gap-1.5 transition-all">
                Check Schemes <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Card>
          </Link>

        </div>
      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService={selectedService} 
      />

    </div>
  );
}
