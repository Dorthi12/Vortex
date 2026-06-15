// app/(dashboard)/health/outbreaks/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HeartPulse, Activity, ArrowLeft, Thermometer, Droplets, CloudRain, 
  Users, Layers, Sparkles, ShieldAlert, BarChart3, TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthStore } from '@/store/useHealthStore';
import { cn } from '@/lib/utils';

export default function OutbreakPredictor() {
  const { lastOutbreakPrediction, loading, error, predictOutbreak } = useHealthStore();
  const [district, setDistrict] = useState('Lucknow');
  const [disease, setDisease] = useState('Dengue');
  const [temp, setTemp] = useState(28.5);
  const [humidity, setHumidity] = useState(75);
  const [rainfall, setRainfall] = useState(120);
  const [density, setDensity] = useState(1800);
  const [history, setHistory] = useState(45);
  const [sanitation, setSanitation] = useState(0.65);
  const [mosquito, setMosquito] = useState(0.8);
  const [waterLogging, setWaterLogging] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    predictOutbreak({
      disease: disease,
      disease_reports: history,
      historical_outbreaks: Math.max(1, Math.round(history * 0.3)),
      temperature: temp,
      humidity: humidity,
      rainfall: rainfall,
      sanitation_index: sanitation,
      population_density: density
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
            Disease Outbreak Prediction Engine
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Model 5 — Forecasts epidemiological vector risks based on dynamic climatic and geographic telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters Input Form (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
            <CardHeader className="border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Climatic &amp; Environmental Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* District and Disease */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">District</label>
                    <select 
                      value={district} 
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white"
                    >
                      {["Lucknow", "Agra", "Kanpur", "Varanasi", "Allahabad", "Meerut", "Ghaziabad", "Bareilly"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disease</label>
                    <select 
                      value={disease} 
                      onChange={(e) => setDisease(e.target.value)}
                      className="w-full bg-[#101F42]/80 border border-[#1A2744] rounded p-2 text-xs text-white"
                    >
                      {["Dengue", "Malaria", "Typhoid", "Cholera", "Tuberculosis", "Pneumonia"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slider values */}
                <div className="space-y-3 pt-2">
                  
                  {/* Temp */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Thermometer className="w-3.5 h-3.5" /> Temperature (°C)
                      </span>
                      <span>{temp}°C</span>
                    </div>
                    <input 
                      type="range" min="10" max="45" step="0.5" value={temp} 
                      onChange={(e) => setTemp(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Humidity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Droplets className="w-3.5 h-3.5" /> Humidity (%)
                      </span>
                      <span>{humidity}%</span>
                    </div>
                    <input 
                      type="range" min="20" max="100" value={humidity} 
                      onChange={(e) => setHumidity(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Rainfall */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <CloudRain className="w-3.5 h-3.5" /> Rainfall (mm)
                      </span>
                      <span>{rainfall} mm</span>
                    </div>
                    <input 
                      type="range" min="0" max="400" value={rainfall} 
                      onChange={(e) => setRainfall(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Density */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3.5 h-3.5" /> Population Density (per km²)
                      </span>
                      <span>{density}</span>
                    </div>
                    <input 
                      type="range" min="100" max="5000" step="50" value={density} 
                      onChange={(e) => setDensity(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Historical cases */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5" /> Historical Disease Cases
                      </span>
                      <span>{history}</span>
                    </div>
                    <input 
                      type="range" min="0" max="300" value={history} 
                      onChange={(e) => setHistory(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Sanitation Index */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Sparkles className="w-3.5 h-3.5" /> Sanitation Index (0-1)
                      </span>
                      <span>{sanitation.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.1" max="1.0" step="0.05" value={sanitation} 
                      onChange={(e) => setSanitation(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Mosquito breeding */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <ShieldAlert className="w-3.5 h-3.5" /> Mosquito Breeding Density
                      </span>
                      <span>{mosquito.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0.0" max="1.0" step="0.05" value={mosquito} 
                      onChange={(e) => setMosquito(parseFloat(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Water logging */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Layers className="w-3.5 h-3.5" /> Water Logging Reports
                      </span>
                      <span>{waterLogging}</span>
                    </div>
                    <input 
                      type="range" min="0" max="30" value={waterLogging} 
                      onChange={(e) => setWaterLogging(parseInt(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#1A3A6C] hover:bg-[#2A4D8C] text-white border border-[#3A5D9C] font-bold mt-4"
                >
                  {loading ? 'Predicting Outbreak Model...' : 'Run Prediction Engine'}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Prediction Output Visualizations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {lastOutbreakPrediction ? (
            <div className="space-y-6">
              
              {/* Output Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Risk Gauge Card */}
                <Card className="bg-[#0A1228] border border-[#1A2744] text-white flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-[#1A2744]">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Outbreak Probability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="relative h-28 w-28 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" className="stroke-slate-800" strokeWidth="8" fill="none" />
                        <circle 
                          cx="56" cy="56" r="48" 
                          className={cn(
                            "transition-all duration-1000 ease-out",
                            lastOutbreakPrediction.outbreak_probability > 0.7 ? "stroke-red-500" : "stroke-amber-500"
                          )} 
                          strokeWidth="8" 
                          strokeDasharray={301.6} 
                          strokeDashoffset={301.6 - (301.6 * lastOutbreakPrediction.outbreak_probability)} 
                          strokeLinecap="round" 
                          fill="none" 
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="block text-2xl font-black">{(lastOutbreakPrediction.outbreak_probability * 100).toFixed(0)}%</span>
                        <span className="text-[7px] font-extrabold uppercase text-slate-400 block tracking-widest leading-none mt-1">RISK RATIO</span>
                      </div>
                    </div>
                    
                    <span className={cn(
                      "mt-4 inline-block px-3 py-1 rounded text-xs font-black border",
                      lastOutbreakPrediction.outbreak_probability > 0.7 
                        ? "bg-red-500/10 text-red-400 border-red-500/30" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    )}>
                      Severity: {(lastOutbreakPrediction.severity_score * 100).toFixed(0)}%
                    </span>
                  </CardContent>
                </Card>

                {/* Projections Card */}
                <Card className="bg-[#0A1228] border border-[#1A2744] text-white flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-[#1A2744]">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Forecast Projections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-[#1A2744] pb-2">
                      <span className="text-xs text-slate-400 font-bold">Expected Cases (7 Days):</span>
                      <strong className="text-lg font-black text-slate-100">{lastOutbreakPrediction.expected_cases_7d}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#1A2744] pb-2">
                      <span className="text-xs text-slate-400 font-bold">Expected Cases (30 Days):</span>
                      <strong className="text-lg font-black text-slate-100">{lastOutbreakPrediction.expected_cases_30d}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-bold">Model Confidence Index:</span>
                      <strong className="text-xs font-black text-emerald-400">{(lastOutbreakPrediction.confidence_score * 100).toFixed(0)}% Match</strong>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Forecast SVG line Chart */}
              <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
                <CardHeader className="border-b border-[#1A2744]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    30-Day Outbreak Progression Line
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="w-full aspect-video md:aspect-[2.5/1] bg-[#101F42]/20 border border-[#1A2744] rounded p-2 flex items-center justify-center relative">
                    <svg viewBox="0 0 400 150" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="380" y2="20" className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="4" />
                      <line x1="40" y1="60" x2="380" y2="60" className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="4" />
                      <line x1="40" y1="100" x2="380" y2="100" className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="4" />
                      <line x1="40" y1="130" x2="380" y2="130" className="stroke-slate-800" strokeWidth="1" />
                      
                      {/* Y Axis Labels */}
                      <text x="30" y="25" className="fill-slate-500 text-[8px] font-bold" textAnchor="end">{lastOutbreakPrediction.expected_cases_30d}</text>
                      <text x="30" y="65" className="fill-slate-500 text-[8px] font-bold" textAnchor="end">{(lastOutbreakPrediction.expected_cases_30d / 2).toFixed(0)}</text>
                      <text x="30" y="105" className="fill-slate-500 text-[8px] font-bold" textAnchor="end">{(lastOutbreakPrediction.expected_cases_7d)}</text>
                      <text x="30" y="133" className="fill-slate-500 text-[8px] font-bold" textAnchor="end">0</text>

                      {/* X Axis Labels */}
                      <text x="40" y="145" className="fill-slate-500 text-[8px] font-bold" textAnchor="middle">Day 0</text>
                      <text x="150" y="145" className="fill-slate-500 text-[8px] font-bold" textAnchor="middle">Day 7</text>
                      <text x="260" y="145" className="fill-slate-500 text-[8px] font-bold" textAnchor="middle">Day 15</text>
                      <text x="380" y="145" className="fill-slate-500 text-[8px] font-bold" textAnchor="middle">Day 30</text>

                      {/* Line Paths */}
                      {/* Baseline historical */}
                      <path 
                        d={`M 40,120 Q 95,${120 - lastOutbreakPrediction.expected_cases_7d * 0.1} 150,${130 - lastOutbreakPrediction.expected_cases_7d * 0.4}`}
                        className="fill-none stroke-blue-500 stroke-[2.5]"
                      />
                      {/* Forecasted progression */}
                      <path 
                        d={`M 150,${130 - lastOutbreakPrediction.expected_cases_7d * 0.4} Q 265,${120 - lastOutbreakPrediction.expected_cases_7d * 0.8} 380,${130 - lastOutbreakPrediction.expected_cases_30d * 0.35}`}
                        className="fill-none stroke-red-500 stroke-[2.5] stroke-dasharray"
                        strokeDasharray="4 2"
                      />
                      
                      {/* Anchor dots */}
                      <circle cx="40" cy="120" r="3" className="fill-blue-500" />
                      <circle cx="150" cy={130 - lastOutbreakPrediction.expected_cases_7d * 0.4} r="4.5" className="fill-slate-100 stroke-blue-500 stroke-[1.5]" />
                      <circle cx="380" cy={130 - lastOutbreakPrediction.expected_cases_30d * 0.35} r="4" className="fill-red-500" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              {/* Coordinates Risk Heatmap */}
              <Card className="bg-[#0A1228] border border-[#1A2744] text-white">
                <CardHeader className="border-b border-[#1A2744]">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-500" />
                    Outbreak Hotspots Coordinates Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative w-full aspect-video md:aspect-[3/1] bg-[#101F42]/10 border border-[#1A2744] rounded-lg p-2 flex items-center justify-center">
                    {/* SVG map of district grid */}
                    <svg viewBox="0 0 300 100" className="w-full h-auto drop-shadow-xs">
                      {/* Background grid */}
                      <path d="M 0,0 L 300,0 L 300,100 L 0,100 Z" className="fill-slate-900/50" />
                      <circle cx="150" cy="50" r="25" className="fill-[#1A3A6C]/10 stroke-[#1A3A6C] stroke-[0.5]" />
                      
                      {/* Render coordinates points */}
                      {lastOutbreakPrediction.risk_heatmap?.points.map((p, idx) => (
                        <g key={idx}>
                          <circle 
                            cx={100 + (p.lng % 0.1) * 1500} 
                            cy={20 + (p.lat % 0.1) * 900} 
                            r={p.weight * 18} 
                            className="fill-red-500/20 stroke-red-500 stroke-[0.5] animate-pulse" 
                          />
                          <circle 
                            cx={100 + (p.lng % 0.1) * 1500} 
                            cy={20 + (p.lat % 0.1) * 900} 
                            r="2" 
                            className="fill-red-500" 
                          />
                          <text 
                            x={100 + (p.lng % 0.1) * 1500} 
                            y={32 + (p.lat % 0.1) * 900} 
                            className="fill-slate-400 text-[6px] font-bold" 
                            textAnchor="middle"
                          >
                            ({p.lat}, {p.lng})
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="h-full border border-dashed border-[#1A2744] bg-[#0A1228]/20 rounded-xl flex flex-col items-center justify-center text-center p-12 text-slate-500">
              <ShieldAlert className="w-12 h-12 text-[#1A3A6C] mb-4" />
              <h3 className="text-sm font-extrabold text-slate-350">Outbreak Prediction Idle</h3>
              <p className="text-xs mt-1 max-w-sm">
                Enter district features and run the forecasting engine to plot regional vector risks and outbreak velocities.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
