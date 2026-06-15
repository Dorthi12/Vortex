'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, AlertTriangle, Info, Sliders, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function RiskIntelligence() {
  const store = useAgricultureStore();

  // Re-calculate overall risk index when component scores shift
  const overallScore = Math.round(
    (store.riskWeather + store.riskDisease + store.riskPest + store.riskMarket + store.riskYield) / 5
  );

  // Radar Chart Coordinates Generator
  const center = 50; // SVG center point (50, 50)
  const maxVal = 100;
  const radius = 38; // Outer scale radius

  const getCoordinates = (index: number, value: number) => {
    // 5 vertices angle: i * 2 * PI / 5 - PI/2 (starting from top)
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const distance = (value / maxVal) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  const getGridPoints = (index: number, gridPct: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const distance = gridPct * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return `${x},${y}`;
  };

  // Generate radar polygon path
  const weatherPt = getCoordinates(0, store.riskWeather);
  const diseasePt = getCoordinates(1, store.riskDisease);
  const pestPt = getCoordinates(2, store.riskPest);
  const marketPt = getCoordinates(3, store.riskMarket);
  const yieldPt = getCoordinates(4, store.riskYield);

  const polygonPath = `${weatherPt.x},${weatherPt.y} ${diseasePt.x},${diseasePt.y} ${pestPt.x},${pestPt.y} ${marketPt.x},${marketPt.y} ${yieldPt.x},${yieldPt.y}`;

  // Grid contour boundaries at 25%, 50%, 75%, 100%
  const grid25 = Array.from({ length: 5 }, (_, i) => getGridPoints(i, 0.25)).join(' ');
  const grid50 = Array.from({ length: 5 }, (_, i) => getGridPoints(i, 0.50)).join(' ');
  const grid75 = Array.from({ length: 5 }, (_, i) => getGridPoints(i, 0.75)).join(' ');
  const grid100 = Array.from({ length: 5 }, (_, i) => getGridPoints(i, 1.0)).join(' ');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Strategic Intel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Risk Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate multidimensional agricultural hazards across climate, market volatility, and biological pathogen vectors.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Component Risk Adjusters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Sliders className="w-4 h-4 text-emerald-500" />
                Risk Factor Simulation
              </CardTitle>
              <CardDescription className="text-xs">
                Tune vulnerability thresholds to simulate farm stress loads.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              {/* Weather Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Weather Risk Index</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.riskWeather}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.riskWeather}
                  onChange={(e) => store.setField('riskWeather', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Disease Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Pathogen Disease Risk</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.riskDisease}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.riskDisease}
                  onChange={(e) => store.setField('riskDisease', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Pest Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Insect Pest Outbreak Risk</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.riskPest}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.riskPest}
                  onChange={(e) => store.setField('riskPest', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Market Price Volatility Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Market Volatility Risk</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.riskMarket}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.riskMarket}
                  onChange={(e) => store.setField('riskMarket', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Yield Deficit Risk */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Yield Production Risk</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.riskYield}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.riskYield}
                  onChange={(e) => store.setField('riskYield', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right: Radar Chart Visualization and Score */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Radar Spider Chart SVG */}
            <Card className="md:col-span-3 bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs font-black uppercase text-slate-450 tracking-wider mb-2">Multidimensional Risk Radar</span>
              
              <div className="w-full aspect-square max-w-[260px]">
                <svg className="w-full h-full text-slate-200 dark:text-slate-800" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer boundary lines */}
                  <polygon points={grid100} fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <polygon points={grid75} fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1.5" />
                  <polygon points={grid50} fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1.5" />
                  <polygon points={grid25} fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1.5" />

                  {/* Web spokes connecting center to points */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const outerPt = getCoordinates(i, 100);
                    return (
                      <line 
                        key={i} 
                        x1={center} 
                        y1={center} 
                        x2={outerPt.x} 
                        y2={outerPt.y} 
                        stroke="currentColor" 
                        strokeWidth="0.4" 
                      />
                    );
                  })}

                  {/* Dynamic risk data polygon */}
                  <polygon 
                    points={polygonPath} 
                    fill="rgba(239, 68, 68, 0.15)" 
                    stroke="#ef4444" 
                    strokeWidth="1.5" 
                  />

                  {/* Glowing vertices dots */}
                  <circle cx={weatherPt.x} cy={weatherPt.y} r="1.5" fill="#ef4444" />
                  <circle cx={diseasePt.x} cy={diseasePt.y} r="1.5" fill="#ef4444" />
                  <circle cx={pestPt.x} cy={pestPt.y} r="1.5" fill="#ef4444" />
                  <circle cx={marketPt.x} cy={marketPt.y} r="1.5" fill="#ef4444" />
                  <circle cx={yieldPt.x} cy={yieldPt.y} r="1.5" fill="#ef4444" />

                  {/* Labels for radar vertices */}
                  <text x={center} y={center - radius - 3} fontSize="3.5" textAnchor="middle" className="font-extrabold fill-slate-500">Weather</text>
                  <text x={getCoordinates(1, 100).x + 4.5} y={getCoordinates(1, 100).y + 1} fontSize="3.5" textAnchor="start" className="font-extrabold fill-slate-500">Disease</text>
                  <text x={getCoordinates(2, 100).x + 4.5} y={getCoordinates(2, 100).y + 2.5} fontSize="3.5" textAnchor="start" className="font-extrabold fill-slate-500">Pests</text>
                  <text x={getCoordinates(3, 100).x - 4.5} y={getCoordinates(3, 100).y + 2.5} fontSize="3.5" textAnchor="end" className="font-extrabold fill-slate-500">Market</text>
                  <text x={getCoordinates(4, 100).x - 4.5} y={getCoordinates(4, 100).y + 1} fontSize="3.5" textAnchor="end" className="font-extrabold fill-slate-500">Yield</text>
                </svg>
              </div>
            </Card>

            {/* Overall Risk Score Badge */}
            <Card className="md:col-span-2 bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Composite Risk Assessment</span>
                
                <div className="space-y-4 mt-2">
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-450">Calculated Score</span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">{overallScore} <span className="text-xs font-semibold text-slate-400">/ 100</span></h3>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] uppercase font-bold text-slate-450 block">Hazard Class</span>
                    <span className={cn(
                      'text-xs font-black px-3 py-1 rounded-md border inline-block',
                      overallScore < 35 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : overallScore < 65
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-[#D4AF37]'
                          : 'bg-red-500/10 border-red-500/20 text-red-650 dark:text-red-400'
                    )}>
                      {overallScore < 35 ? 'Low Agricultural Risk' : overallScore < 65 ? 'Medium Alert Level' : 'Critical Risk Outlaw'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-150 dark:border-[#1A2744] pt-3 mt-4 text-[9px] text-slate-450 font-bold leading-relaxed">
                Mitigation priority: {overallScore >= 65 ? 'Immediate Interdepartmental Intervention Required' : 'Standard Advisory Dispatch'}
              </div>
            </Card>

          </div>

          {/* Mitigation Actions */}
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Risk Mitigation Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed space-y-3">
              {overallScore >= 65 ? (
                <div className="flex gap-2.5 items-start bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-750 dark:text-red-400">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-black text-sm mb-0.5">Critical Emergency Triggers Initiated</strong>
                    <p className="leading-relaxed">
                      Extreme hazard thresholds breached. The local district governance center is advised to mobilize subsidized chemical pesticide spray caches, deploy emergency water reserves, and trigger commodity pricing floors to protect marginal crop assets.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5 items-start bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-black text-sm mb-0.5">Stabilized Hazard Profile</strong>
                    <p className="leading-relaxed">
                      Risk parameters register within safe seasonal thresholds. Follow standard crop rotation cycles and monitor climatic indicators weekly.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
