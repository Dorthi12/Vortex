'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mountain,
  RefreshCw,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useHazardStore,
  type LandslideInput,
  type LandslideResult,
} from '@/store/useHazardStore';

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  RED: {
    arc: 'stroke-red-500',
    text: 'text-red-650 dark:text-red-400',
    bg: 'bg-red-500/10 border-red-500/20 dark:border-red-500/30',
    badge: 'bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-450 border-red-500/10',
  },
  ORANGE: {
    arc: 'stroke-orange-500',
    text: 'text-orange-650 dark:text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20 dark:border-orange-500/30',
    badge: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-655 dark:text-orange-450 border-orange-500/10',
  },
  YELLOW: {
    arc: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-405',
    bg: 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30',
    badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-655 dark:text-amber-450 border-amber-500/10',
  },
  GREEN: {
    arc: 'stroke-green-500',
    text: 'text-green-650 dark:text-green-400',
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/30',
    badge: 'bg-green-500/10 dark:bg-green-500/20 text-green-650 dark:text-green-450 border-green-500/10',
  },
};

const SOIL_STYLES = {
  CLAY: { label: 'Clay Soil', color: '#8B7355', darkColor: '#6E5B3C', desc: 'Highly cohesive, retains water, high slide threat when saturated.' },
  SANDY: { label: 'Sandy Soil', color: '#EEDC82', darkColor: '#C5B358', desc: 'Granular, drains quickly but easily washed away by heavy runoff.' },
  LOAMY: { label: 'Loamy Soil', color: '#5C4033', darkColor: '#3D2B1F', desc: 'Balanced composted soil, moderate cohesion.' },
  ROCKY: { label: 'Rocky Terrain', color: '#808080', darkColor: '#505050', desc: 'High friction slope, low slide risk unless fractured or sheared.' },
  MIXED: { label: 'Mixed Strata', color: '#CD853F', darkColor: '#8B5A2B', desc: 'Variable layers of soil & rock with complex shearing behaviors.' },
};

// ── Slider row component ──────────────────────────────────────────────────────
interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  accentClass: string;
  onChange: (v: number) => void;
}

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  accentClass,
  onChange,
}: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label htmlFor={id} className="font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider text-[10px]">
          {label}
        </label>
        <span className={cn('font-bold tabular-nums', accentClass)}>
          {typeof value === 'number' && !Number.isInteger(value)
            ? value.toFixed(2)
            : value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-800',
          accentClass.includes('orange') ? 'accent-orange-500' :
          accentClass.includes('red') ? 'accent-red-500' :
          accentClass.includes('green') ? 'accent-green-500' :
          accentClass.includes('blue') ? 'accent-blue-500' :
          'accent-amber-500'
        )}
      />
      <div className="flex justify-between text-[9px] text-slate-405 dark:text-slate-500 font-medium">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function LandslideRiskPage() {
  const {
    landslideInput,
    landslideResult,
    landslideLoading,
    setLandslideInput,
    runLandslidePrediction,
  } = useHazardStore();

  const handleSoilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLandslideInput('soilType', e.target.value as LandslideInput['soilType']);
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE': return 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20';
      case 'MONITOR': return 'bg-orange-500/10 text-orange-655 dark:text-orange-400 border-orange-500/20';
      case 'WATCH': return 'bg-amber-500/10 text-amber-655 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-green-500/10 text-green-650 dark:text-green-400 border-green-500/20';
    }
  };

  // SVG hill path calculation based on slope input
  // Flat ground is at height 80, hill height rises as slope increases (hillY goes down to 30)
  const hillY = 80 - (landslideInput.terrainSlope / 90) * 45;
  const soilColor = SOIL_STYLES[landslideInput.soilType]?.color || '#8B7355';
  const soilDarkColor = SOIL_STYLES[landslideInput.soilType]?.darkColor || '#6E5B3C';

  // Raindrops helper
  const rainDropsCount = Math.min(25, Math.ceil(landslideInput.rainfall / 8));
  const rainLines = Array.from({ length: rainDropsCount }, (_, i) => ({
    x: 15 + (i * 75) / rainDropsCount + Math.random() * 5,
    y: 10 + Math.random() * 30,
    len: 6 + Math.random() * 6,
  }));

  // Vegetation trees helper
  const treeCount = Math.min(6, Math.ceil(landslideInput.vegetationIndex * 6));
  const treePositions = Array.from({ length: treeCount }, (_, i) => ({
    x: 10 + i * 8,
    y: hillY,
  }));

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <Link href="/hazards">
            <button className="mt-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1829] hover:bg-slate-100 dark:hover:bg-[#1A2744] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">
              MODULE 08
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Landslide Risk Prediction
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              ML-powered terrain stability assessment using real-time precipitation, slope gradient, vegetation indexes, and soil types.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Inputs Panel (col-span-4) ── */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mountain className="w-5 h-5 text-amber-500" />
                Terrain Parameters
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                Configure geographical features and local precipitation readings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              
              {/* Rainfall Slider */}
              <SliderRow
                id="landslide-rainfall"
                label="Precipitation / Rainfall"
                value={landslideInput.rainfall}
                min={0}
                max={200}
                step={1}
                unit=" mm/hr"
                accentClass="text-orange-655 dark:text-orange-450 font-bold"
                onChange={(v) => setLandslideInput('rainfall', v)}
              />

              {/* Slope Slider */}
              <SliderRow
                id="landslide-slope"
                label="Terrain Slope"
                value={landslideInput.terrainSlope}
                min={0}
                max={90}
                step={1}
                unit="°"
                accentClass="text-red-500 dark:text-red-400 font-bold"
                onChange={(v) => setLandslideInput('terrainSlope', v)}
              />

              {/* NDVI Slider */}
              <SliderRow
                id="landslide-ndvi"
                label="Vegetation Index (NDVI)"
                value={landslideInput.vegetationIndex}
                min={0}
                max={1.0}
                step={0.01}
                unit=""
                accentClass="text-green-650 dark:text-green-400 font-bold"
                onChange={(v) => setLandslideInput('vegetationIndex', v)}
              />

              {/* Soil Type Select */}
              <div className="space-y-1.5">
                <label htmlFor="soil-type" className="block text-xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Soil Composition
                </label>
                <select
                  id="soil-type"
                  value={landslideInput.soilType}
                  onChange={handleSoilChange}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1A] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                >
                  <option value="CLAY">Clay Stratum (Water-retaining)</option>
                  <option value="SANDY">Sandy Loam (Porous / Loose)</option>
                  <option value="LOAMY">Loamy Soil (Standard)</option>
                  <option value="ROCKY">Rocky Base (High-friction)</option>
                  <option value="MIXED">Mixed Sub-layers</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed mt-1">
                  {SOIL_STYLES[landslideInput.soilType].desc}
                </p>
              </div>

              {/* Info Box */}
              <div className="flex gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Runs terrain shear calculations using SVM model loaded at <code>models/hazard/landslide_model.pkl</code>. Automatically falls back to regulatory physics rules when model unavailable.</span>
              </div>

              <Button
                onClick={runLandslidePrediction}
                disabled={landslideLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-2 disabled:opacity-70 active:scale-95 transition-all cursor-pointer"
              >
                {landslideLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Computing...
                  </span>
                ) : (
                  'Run Landslide Assessment'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Results Panel (col-span-8) ── */}
        <div className="lg:col-span-8 space-y-5">
          <AnimatePresence mode="wait">
            {landslideResult ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Visual Terrain Simulation Card + Gauge */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Gauge (col-span-4) */}
                  <Card className="md:col-span-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Overall Risk Probability</span>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-4 justify-center">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform rotate-180" viewBox="0 0 100 100">
                          {/* Half Gauge track */}
                          <circle
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            strokeWidth="8"
                            stroke="currentColor"
                            className="text-slate-100 dark:text-slate-800"
                            strokeDasharray="125.6 125.6"
                            strokeLinecap="round"
                          />
                          {/* Half Gauge fill */}
                          <circle
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            strokeWidth="8"
                            className={cn(
                              'transition-all duration-700 ease-out',
                              landslideResult.riskProbability >= 0.75 ? 'stroke-red-500' :
                              landslideResult.riskProbability >= 0.55 ? 'stroke-orange-500' :
                              landslideResult.riskProbability >= 0.35 ? 'stroke-amber-500' : 'stroke-green-500'
                            )}
                            strokeDasharray="125.6 125.6"
                            strokeDashoffset={125.6 - (125.6 * landslideResult.riskProbability)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center mt-[-15px]">
                          <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                            {Math.round(landslideResult.riskProbability * 100)}%
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Shear Risk</span>
                        </div>
                      </div>
                      <span className={cn(
                        'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border mt-2',
                        SEVERITY_COLORS[landslideResult.alertLevel].bg,
                        SEVERITY_COLORS[landslideResult.alertLevel].text
                      )}>
                        {landslideResult.alertLevel} Alert
                      </span>
                    </CardContent>
                  </Card>

                  {/* Interactive Parametric Hill SVG (col-span-7) */}
                  <Card className="md:col-span-7 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm flex flex-col">
                    <CardHeader className="pb-1.5 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Dynamic Terrain Profile</CardTitle>
                        <CardDescription className="text-[10px]">Real-time visual geometry modeled from parameters.</CardDescription>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Interactive View</span>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 flex items-center justify-center">
                      <div className="w-full max-w-[320px] aspect-[4/3] bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-850 p-3 relative overflow-hidden">
                        
                        {/* Interactive dynamic SVG */}
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          {/* Grid lines */}
                          <line x1="20" y1="0" x2="20" y2="100" stroke="#808080" strokeWidth="0.1" strokeDasharray="3,3" />
                          <line x1="50" y1="0" x2="50" y2="100" stroke="#808080" strokeWidth="0.1" strokeDasharray="3,3" />
                          <line x1="80" y1="0" x2="80" y2="100" stroke="#808080" strokeWidth="0.1" strokeDasharray="3,3" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#808080" strokeWidth="0.1" strokeDasharray="3,3" />
                          
                          {/* Raindrops animations overlay */}
                          {landslideInput.rainfall > 0 && rainLines.map((drop, i) => (
                            <line
                              key={i}
                              x1={drop.x}
                              y1={drop.y}
                              x2={drop.x - 1.5}
                              y2={drop.y + drop.len}
                              stroke="#00bfff"
                              strokeWidth="0.8"
                              opacity="0.6"
                              className="animate-pulse"
                            />
                          ))}

                          {/* Hill shape - changes slope height based on terrainSlope input */}
                          <path
                            d={`M 10 95 L 10 ${hillY} C 40 ${hillY}, 50 82, 90 82 L 90 95 Z`}
                            fill={soilColor}
                            stroke={soilDarkColor}
                            strokeWidth="1.5"
                            className="transition-all duration-500 ease-out"
                            opacity="0.85"
                          />

                          {/* Dynamic Vegetation (Green Trees/Grass) depending on NDVI */}
                          {treePositions.map((pos, i) => (
                            <g key={i} className="transition-all duration-500 ease-out">
                              {/* Tree trunk */}
                              <line x1={pos.x} y1={pos.y} x2={pos.x} y2={pos.y - 4} stroke="#5c4033" strokeWidth="0.8" />
                              {/* Leaves */}
                              <circle cx={pos.x} cy={pos.y - 4.5} r="2.5" fill="#2e8b57" opacity="0.9" />
                            </g>
                          ))}

                          {/* Evacuee House shape: at base or tilting on slope depending on risk */}
                          <g 
                            transform={`translate(${82}, ${73.5})`}
                            className={cn(
                              "transition-all duration-500 origin-[4px_8px]",
                              landslideResult.riskProbability >= 0.75 ? "animate-bounce rotate-12 fill-red-500 stroke-red-800" :
                              landslideResult.riskProbability >= 0.55 ? "rotate-6 fill-orange-500" : "fill-slate-700 dark:fill-white"
                            )}
                          >
                            <polygon points="4,0 0,5 8,5" stroke="currentColor" strokeWidth="0.5" />
                            <rect x="1.5" y="5" width="5" height="4.5" stroke="currentColor" strokeWidth="0.5" />
                          </g>

                          {/* Slide Debris Arrow Indicator when risk is red/orange */}
                          {landslideResult.riskProbability >= 0.55 && (
                            <path
                              d={`M 40 ${hillY + 10} L 55 ${hillY + 22}`}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="animate-pulse"
                              markerEnd="url(#arrow)"
                            />
                          )}

                          {/* SVG arrow definition */}
                          <defs>
                            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                            </marker>
                          </defs>
                        </svg>

                        {/* Visual alerts text overlay */}
                        {landslideResult.riskProbability >= 0.75 && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-[8px] px-2 py-0.5 rounded uppercase animate-pulse">
                            Unstable Slope
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Additional Stats Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Evacuation Urgency */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Evacuation Urgency</span>
                    </CardHeader>
                    <CardContent className="pt-1 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-805 dark:text-slate-300">Urgency Level:</span>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-black border',
                          getUrgencyBadgeColor(landslideResult.evacuationUrgency)
                        )}>
                          {landslideResult.evacuationUrgency}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            landslideResult.evacuationUrgency === 'IMMEDIATE' ? 'bg-red-500' :
                            landslideResult.evacuationUrgency === 'MONITOR' ? 'bg-orange-500' :
                            landslideResult.evacuationUrgency === 'WATCH' ? 'bg-amber-500' : 'bg-green-500'
                          )}
                          style={{
                            width:
                              landslideResult.evacuationUrgency === 'IMMEDIATE' ? '100%' :
                              landslideResult.evacuationUrgency === 'MONITOR' ? '70%' :
                              landslideResult.evacuationUrgency === 'WATCH' ? '40%' : '15%'
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Confidence Index */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                    <CardHeader className="pb-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Algorithm & Model details</span>
                    </CardHeader>
                    <CardContent className="pt-1 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Confidence Score:</span>
                        <span className="font-bold text-slate-850 dark:text-slate-200">{(landslideResult.confidenceScore * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Model Source:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{landslideResult.modelSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Soil Weight Penalty:</span>
                        <span className="font-mono font-bold text-slate-850 dark:text-slate-350">
                          {landslideInput.soilType === 'CLAY' ? '1.3x (Critical)' :
                           landslideInput.soilType === 'MIXED' ? '1.1x (Elevated)' :
                           landslideInput.soilType === 'LOAMY' ? '1.0x (Normal)' :
                           landslideInput.soilType === 'SANDY' ? '0.9x (Porous)' : '0.7x (Low Risk)'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Affected Villages Table */}
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                  <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Affected Settlements & Population</CardTitle>
                    <CardDescription className="text-xs text-slate-550 dark:text-slate-400">Potential impact zones ordered by proximity to sliding slope.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 uppercase text-[9px] font-black tracking-wider">
                          <th className="pb-2.5 text-left">Village / Settlement</th>
                          <th className="pb-2.5 text-center">Slide Risk Score</th>
                          <th className="pb-2.5 text-right">Distance to Edge</th>
                          <th className="pb-2.5 text-right">Village Pop.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                        {landslideResult.affectedVillages.map((village) => (
                          <tr key={village.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{village.name}</td>
                            <td className="py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      village.riskScore >= 75 ? 'bg-red-500' :
                                      village.riskScore >= 55 ? 'bg-orange-500' :
                                      village.riskScore >= 35 ? 'bg-amber-500' : 'bg-green-500'
                                    )}
                                    style={{ width: `${village.riskScore}%` }}
                                  />
                                </div>
                                <span className={cn(
                                  'font-bold',
                                  village.riskScore >= 75 ? 'text-red-600 dark:text-red-400' :
                                  village.riskScore >= 55 ? 'text-orange-600 dark:text-orange-400' :
                                  village.riskScore >= 35 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600'
                                )}>
                                  {Math.round(village.riskScore)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-slate-500 dark:text-slate-400 font-bold">{village.distance}</td>
                            <td className="py-2.5 text-right text-slate-800 dark:text-slate-300 font-extrabold tabular-nums">{village.population.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Government Advisory */}
                <Card className="border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5 shadow-md shadow-amber-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex-shrink-0 mt-0.5 border border-amber-500/20">
                        <ShieldAlert className="w-5 h-5 text-amber-655 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wide">
                          Government Advisory
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                          {landslideResult.governmentAdvisory}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-28 gap-4">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-[#1A2744]">
                      <Mountain className="w-10 h-10 text-slate-400 dark:text-slate-650" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-400">No Assessment Run Yet</h3>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                        Adjust the terrain parameters on the left and click{' '}
                        <span className="text-amber-600 dark:text-amber-400 font-bold">Run Landslide Assessment</span>{' '}
                        to generate a detailed soil shear risk report.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
