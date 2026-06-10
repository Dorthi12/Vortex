'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle, Activity, LayoutGrid, Sprout, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

interface RecommendedCrop {
  name: string;
  suitability: number; // %
  details: string;
  optimalNPK: { n: number; p: number; k: number };
}

export default function CropRecommendation() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Agriculture in sidebar
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  // Soil Nutrient States
  const [nitrogen, setNitrogen] = useState<number>(70);
  const [phosphorus, setPhosphorus] = useState<number>(45);
  const [potassium, setPotassium] = useState<number>(35);
  const [ph, setPh] = useState<number>(6.5);
  const [humidity, setHumidity] = useState<number>(65);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendedCrop[]>([]);

  // Real-time crop matching calculations
  useEffect(() => {
    const crops = [
      {
        name: 'Rice (Paddy)',
        optimalNPK: { n: 90, p: 50, k: 40 },
        phRange: { min: 6.0, max: 7.0 },
        humidityRange: { min: 70, max: 95 },
        details: 'Demands water-saturated soils, high nitrogen absorption, and loamy soil profiles.'
      },
      {
        name: 'Wheat',
        optimalNPK: { n: 70, p: 40, k: 35 },
        phRange: { min: 6.0, max: 7.2 },
        humidityRange: { min: 45, max: 65 },
        details: 'Thrives in clayey/loamy soil under cool growing seasons with dry harvest windows.'
      },
      {
        name: 'Sugarcane',
        optimalNPK: { n: 110, p: 60, k: 50 },
        phRange: { min: 6.5, max: 7.5 },
        humidityRange: { min: 60, max: 80 },
        details: 'A high-feed heavy crop with extreme potassium requirements. Best under perennial irrigation.'
      },
      {
        name: 'Cotton',
        optimalNPK: { n: 60, p: 45, k: 25 },
        phRange: { min: 7.0, max: 8.0 },
        humidityRange: { min: 35, max: 55 },
        details: 'Deep black soil adaptive crop. Highly drought-tolerant with low humidity preference.'
      },
      {
        name: 'Groundnuts',
        optimalNPK: { n: 25, p: 35, k: 30 },
        phRange: { min: 6.5, max: 7.0 },
        humidityRange: { min: 50, max: 70 },
        details: 'Leguminous nitrogen-fixing crop. Demands very low chemical nitrogen supplementation.'
      }
    ];

    // Calculate match score for each crop
    const results = crops.map((crop) => {
      // NPK deviations
      const nDiff = Math.abs(nitrogen - crop.optimalNPK.n);
      const pDiff = Math.abs(phosphorus - crop.optimalNPK.p);
      const kDiff = Math.abs(potassium - crop.optimalNPK.k);

      const nScore = Math.max(0, 100 - (nDiff / crop.optimalNPK.n) * 100);
      const pScore = Math.max(0, 100 - (pDiff / crop.optimalNPK.p) * 100);
      const kScore = Math.max(0, 100 - (kDiff / crop.optimalNPK.k) * 100);

      // pH suitability
      let phScore = 100;
      if (ph < crop.phRange.min) phScore = Math.max(0, 100 - (crop.phRange.min - ph) * 80);
      else if (ph > crop.phRange.max) phScore = Math.max(0, 100 - (ph - crop.phRange.max) * 80);

      // Humidity suitability
      let humScore = 100;
      if (humidity < crop.humidityRange.min) humScore = Math.max(0, 100 - (crop.humidityRange.min - humidity) * 3);
      else if (humidity > crop.humidityRange.max) humScore = Math.max(0, 100 - (humidity - crop.humidityRange.max) * 3);

      // Weighted overall suitability score
      const totalScore = (nScore * 0.25) + (pScore * 0.20) + (kScore * 0.20) + (phScore * 0.20) + (humScore * 0.15);

      return {
        name: crop.name,
        suitability: Math.round(Math.min(99, totalScore)),
        details: crop.details,
        optimalNPK: crop.optimalNPK
      };
    });

    // Sort by suitability descending
    results.sort((a, b) => b.suitability - a.suitability);

    setRecommendations(results);

  }, [nitrogen, phosphorus, potassium, ph, humidity]);

  const topMatch = recommendations[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/agriculture" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sea-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Agriculture Overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
          Agro-Telemetry Models
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Crop Recommendation
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Match target crop selections using soil N-P-K mineral levels, moisture properties, and air humidity profiles.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="crop"
        title="Request Expert Crop Recommendation"
        description="Not sure which crop to sow? A specialist agronomist can visit your field, test soil chemistry, and provide a certified sowing schedule tailored to your land."
        buttonLabel="Call Crop Advisor"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Soil Telemetry & Unsure Blocks */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Soil Telemetry Inputs - Light Pale Yellow */}
          <Card className="bg-gradient-to-br from-yellow-50 via-amber-50/30 to-yellow-100/40 border border-amber-200/50 shadow-md">
            <CardHeader className="pb-4 border-b border-amber-200/40">
              <CardTitle className="text-base font-extrabold text-amber-950 dark:text-amber-100">
                Soil Telemetry Inputs
              </CardTitle>
              <CardDescription className="text-xs text-amber-800/80">
                Simulate soil chemistry values to compute optimal matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Nitrogen slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <Label className="text-amber-900">Nitrogen (N) level</Label>
                  <span className="text-amber-700 font-black">{nitrogen} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="140"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-amber-100/60 dark:bg-amber-900/40 rounded-lg appearance-none"
                />
              </div>

              {/* Phosphorus slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <Label className="text-amber-900">Phosphorus (P) level</Label>
                  <span className="text-amber-700 font-black">{phosphorus} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="140"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-amber-100/60 dark:bg-amber-900/40 rounded-lg appearance-none"
                />
              </div>

              {/* Potassium slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <Label className="text-amber-900">Potassium (K) level</Label>
                  <span className="text-amber-700 font-black">{potassium} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={potassium}
                  onChange={(e) => setPotassium(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-amber-100/60 dark:bg-amber-900/40 rounded-lg appearance-none"
                />
              </div>

              {/* pH slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <Label className="text-amber-900">Soil pH Acidity</Label>
                  <span className="text-amber-700 font-black">{ph} pH</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="8.5"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-amber-100/60 dark:bg-amber-900/40 rounded-lg appearance-none"
                />
              </div>

              {/* Humidity slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <Label className="text-amber-900">Soil Humidity</Label>
                  <span className="text-amber-700 font-black">{humidity}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-amber-100/60 dark:bg-amber-900/40 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>

          {/* Soil expert booking card - Light Pale Yellow */}
          <Card className="bg-gradient-to-br from-yellow-50 via-amber-50/30 to-yellow-100/40 border border-amber-200/50 shadow-md p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Unsure about values?</h4>
            <p className="text-[11px] text-amber-900/85 leading-normal font-medium">
              Request an in-person soil analysis. A technical professional will visit your location to test Nitrogen, Phosphorus, and Potassium levels.
            </p>
            <Button 
              onClick={() => setIsProfModalOpen(true)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer font-bold"
            >
              <Phone className="w-3.5 h-3.5" />
              Book Specialist Soil Check
            </Button>
          </Card>
        </div>

        {/* Right Column: Recommendation Panels & Matching Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Optimal Recommendation Match Banner */}
          {topMatch && (
            <Card className="relative overflow-hidden border-0 shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
              bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500">
              {/* Dot pattern */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}
              />
              <div className="flex items-start sm:items-center gap-3 relative z-10">
                <div className="h-11 w-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-amber-900 shrink-0">
                  <Sprout className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-amber-900/70">Optimal Sowing Choice</span>
                  <h3 className="text-xl font-black text-amber-950 leading-none mt-0.5 drop-shadow-sm">
                    {topMatch.name}
                  </h3>
                  <p className="text-xs text-amber-900/80 mt-1 max-w-md font-medium">
                    {topMatch.details}
                  </p>
                </div>
              </div>
              <div className="shrink-0 relative z-10 text-center bg-white/25 border border-white/40 p-3 rounded-xl min-w-[80px] backdrop-blur-sm">
                <span className="block text-[8px] uppercase font-black text-amber-900/60 tracking-widest">Match Score</span>
                <strong className="text-2xl font-black text-amber-950 drop-shadow">{topMatch.suitability}%</strong>
              </div>
            </Card>
          )}

          {/* List of alternative suitable matches */}
          <Card className="bg-card border-border-subtle shadow-xs">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550">
                Recommended Crop Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {recommendations.map((item, index) => {

                  // Each rank gets a unique distinct color
                  const ROW_COLORS = [
                    { bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400', rank: 'text-emerald-500', pct: 'text-emerald-600 dark:text-emerald-400', row: 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10' },
                    { bar: 'bg-gradient-to-r from-teal-500 to-cyan-400',      rank: 'text-teal-500',    pct: 'text-teal-600 dark:text-teal-400',    row: 'hover:bg-teal-50/40 dark:hover:bg-teal-950/10' },
                    { bar: 'bg-gradient-to-r from-blue-500 to-sky-400',       rank: 'text-blue-500',    pct: 'text-blue-600 dark:text-blue-400',    row: 'hover:bg-blue-50/40 dark:hover:bg-blue-950/10' },
                    { bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',   rank: 'text-amber-500',   pct: 'text-amber-600 dark:text-amber-400',  row: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/10' },
                    { bar: 'bg-gradient-to-r from-violet-500 to-purple-400',  rank: 'text-violet-500',  pct: 'text-violet-600 dark:text-violet-400', row: 'hover:bg-violet-50/40 dark:hover:bg-violet-950/10' },
                  ];
                  const color = ROW_COLORS[index % ROW_COLORS.length];

                  return (
                    <div key={item.name} className={cn('p-4 flex items-center justify-between gap-4 transition-colors', color.row)}>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-black font-mono', color.rank)}>#{String(index + 1).padStart(2, '0')}</span>
                          <h4 className="text-sm font-bold text-slate-950 dark:text-slate-100">{item.name}</h4>
                        </div>
                        
                        {/* Colored progress bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500 shadow-sm', color.bar)}
                            style={{ width: `${item.suitability}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={cn('text-sm font-black', color.pct)}>{item.suitability}%</span>
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Match</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="soil_check" 
      />

    </div>
  );
}
