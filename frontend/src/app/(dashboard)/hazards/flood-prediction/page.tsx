'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  Waves,
  ShieldAlert,
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
  type FloodPredictionInput,
  type FloodTimelineEntry,
} from '@/store/useHazardStore';

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_COLORS = {
  EXTREME: {
    arc: 'stroke-red-505 dark:stroke-red-500',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10 border-red-500/20 dark:border-red-500/30',
    badge: 'bg-red-500/10 dark:bg-red-500/20 text-red-650 dark:text-red-400',
  },
  HIGH: {
    arc: 'stroke-orange-505 dark:stroke-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20 dark:border-orange-500/30',
    badge: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-655 dark:text-orange-400',
  },
  MODERATE: {
    arc: 'stroke-amber-505 dark:stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20 dark:border-amber-500/30',
    badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-655 dark:text-amber-400',
  },
  LOW: {
    arc: 'stroke-green-505 dark:stroke-green-500',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10 border-green-500/20 dark:border-green-500/30',
    badge: 'bg-green-500/10 dark:bg-green-500/20 text-green-650 dark:text-green-400',
  },
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
        <label htmlFor={id} className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
          {label}
        </label>
        <span className={cn('font-bold tabular-nums', accentClass)}>
          {typeof value === 'number' && !Number.isInteger(value)
            ? value.toFixed(1)
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
          'accent-purple-500'
        )}
      />
      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-medium">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── SVG Arc Gauge ─────────────────────────────────────────────────────────────
function ArcGauge({ probability, severity }: { probability: number; severity: string }) {
  const colors = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.LOW;
  const pct = Math.round(probability * 100);
  // Arc covers 240 degrees; circumference of r=40 = 251.2; 240/360 * 251.2 = 167.47
  const totalArc = 167.47;
  const filled = (pct / 100) * totalArc;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Rotated so the arc goes from bottom-left to bottom-right */}
        <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(150deg)' }}>
          {/* Track */}
          <circle
            cx="50" cy="50" r="40"
            fill="transparent"
            strokeWidth="8"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeDasharray={`${totalArc} ${251.2 - totalArc}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="50" cy="50" r="40"
            fill="transparent"
            strokeWidth="8"
            className={cn('transition-all duration-700 ease-out', colors.arc)}
            strokeDasharray={`${filled} ${251.2 - filled}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn('text-3xl font-black tabular-nums', colors.text)}>
            {pct}%
          </span>
          <span className="text-[9px] text-slate-550 dark:text-slate-500 uppercase tracking-widest font-bold mt-0.5">Probability</span>
        </div>
      </div>
      <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border', colors.bg, colors.text)}>
        {severity}
      </span>
    </div>
  );
}

// ── Timeline cell ─────────────────────────────────────────────────────────────
function TimelineCell({ entry }: { entry: FloodTimelineEntry }) {
  const colors = SEVERITY_COLORS[entry.severity];
  return (
    <div className={cn('rounded-xl p-3 border flex flex-col gap-1.5 text-center', colors.bg)}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {entry.window}
      </span>
      <span className={cn('text-2xl font-black tabular-nums', colors.text)}>
        {Math.round(entry.probability * 100)}%
      </span>
      <span className="text-[10px] text-slate-600 dark:text-slate-405 font-semibold">
        {entry.expectedWaterLevel.toFixed(1)}m level
      </span>
      <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-full self-center border', colors.badge)}>
        {entry.severity}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FloodPredictionPage() {
  const {
    floodInput,
    floodResult,
    floodLoading,
    setFloodInput,
    runFloodPrediction,
    wsConnected,
  } = useHazardStore();

  const sliders: Array<{
    key: keyof FloodPredictionInput;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    accentClass: string;
  }> = [
    { key: 'rainfall', label: 'Rainfall', min: 0, max: 200, step: 1, unit: ' mm/hr', accentClass: 'text-orange-600 dark:text-orange-400' },
    { key: 'riverLevel', label: 'River Level', min: 0, max: 15, step: 0.1, unit: ' m', accentClass: 'text-red-655 dark:text-red-400' },
    { key: 'damDischarge', label: 'Dam Discharge', min: 0, max: 100000, step: 500, unit: ' cusecs', accentClass: 'text-orange-600 dark:text-orange-400' },
    { key: 'soilMoisture', label: 'Soil Moisture', min: 0, max: 100, step: 1, unit: '%', accentClass: 'text-green-600 dark:text-green-400' },
    { key: 'humidity', label: 'Humidity', min: 0, max: 100, step: 1, unit: '%', accentClass: 'text-blue-600 dark:text-blue-400' },
    { key: 'historicalFloodIndex', label: 'Historical Flood Index', min: 0, max: 10, step: 0.1, unit: '', accentClass: 'text-purple-650 dark:text-purple-400' },
  ];

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
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-500 dark:text-orange-400">
              MODULE 05
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Flood Prediction Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              AI-powered 48-hour flood probability forecast using river telemetry, soil moisture and dam discharge data.
            </p>
          </div>
        </div>

        {/* WS status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0D1829] border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-sm">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              wsConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
            )}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {wsConnected ? 'Live Feed' : 'Simulated'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Input Panel (col-span-4) ── */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] h-full shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Waves className="w-5 h-5 text-orange-500" />
                Telemetry Input Parameters
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                Adjust hydrological parameters to compute flood risk assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {sliders.map((s) => (
                <SliderRow
                  key={s.key}
                  id={`flood-${s.key}`}
                  label={s.label}
                  value={floodInput[s.key] as number}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  unit={s.unit}
                  accentClass={s.accentClass}
                  onChange={(v) => setFloodInput(s.key, v)}
                />
              ))}

              <Button
                onClick={runFloodPrediction}
                disabled={floodLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold mt-2 disabled:opacity-70 active:scale-95 transition-all"
              >
                {floodLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Computing...
                  </span>
                ) : (
                  'Run Flood Prediction'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Results Panel (col-span-8) ── */}
        <div className="lg:col-span-8 space-y-5">
          <AnimatePresence mode="wait">
            {floodResult ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Top row: Gauge + Confidence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Probability Gauge */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Overall Flood Probability
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center py-2">
                      <ArcGauge
                        probability={floodResult.overallProbability}
                        severity={floodResult.severity}
                      />
                    </CardContent>
                  </Card>

                  {/* Confidence + Water Level */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Prediction Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Confidence Score</span>
                          <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                            {floodResult.confidenceScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${floodResult.confidenceScore}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Expected Water Level</span>
                          <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                            {floodResult.expectedWaterLevel.toFixed(2)} m
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500 dark:text-slate-400">Severity Assessment</span>
                          <span
                            className={cn(
                              'font-bold uppercase text-[10px] px-2.5 py-0.5 rounded-full border',
                              SEVERITY_COLORS[floodResult.severity].badge
                            )}
                          >
                            {floodResult.severity}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline */}
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      48-Hour Flood Timeline
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-405">
                      Projected flood probability and water level across forecast windows.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {floodResult.timeline.map((entry) => (
                        <TimelineCell key={entry.window} entry={entry} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Affected Regions */}
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1228] shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200">
                      Affected Wards & Population
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-500 uppercase text-[9px] font-black tracking-wider">
                          <th className="pb-2.5 text-left">Region</th>
                          <th className="pb-2.5 text-left">Risk Level</th>
                          <th className="pb-2.5 text-right">Est. Population</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium">
                        {floodResult.affectedRegions.map((region) => {
                          const sev = region.risk as keyof typeof SEVERITY_COLORS;
                          const c = SEVERITY_COLORS[sev] || SEVERITY_COLORS.LOW;
                          return (
                            <tr key={region.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 font-bold text-slate-800 dark:text-slate-250">{region.name}</td>
                              <td className="py-2.5">
                                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border', c.badge)}>
                                  {region.risk}
                                </span>
                              </td>
                              <td className="py-2.5 text-right text-slate-700 dark:text-slate-300 tabular-nums font-bold">
                                {region.population.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Government Advisory */}
                <Card className="border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/5 shadow-md shadow-orange-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex-shrink-0 mt-0.5 border border-orange-500/20">
                        <ShieldAlert className="w-5 h-5 text-orange-655 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1 uppercase tracking-wide">
                          Government Advisory
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                          {floodResult.governmentAdvisory}
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
                  <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-[#1A2744]">
                      <Waves className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-400">No Prediction Run Yet</h3>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Adjust the telemetry parameters on the left and click{' '}
                        <span className="text-orange-555 font-bold">Run Flood Prediction</span>{' '}
                        to generate a 48-hour flood risk assessment.
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
