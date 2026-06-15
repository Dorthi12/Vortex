'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle, Activity, LayoutGrid, Sprout, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
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
  const store = useAgricultureStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

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
      const nDiff = Math.abs(store.recN - crop.optimalNPK.n);
      const pDiff = Math.abs(store.recP - crop.optimalNPK.p);
      const kDiff = Math.abs(store.recK - crop.optimalNPK.k);

      const nScore = Math.max(0, 100 - (nDiff / crop.optimalNPK.n) * 100);
      const pScore = Math.max(0, 100 - (pDiff / crop.optimalNPK.p) * 100);
      const kScore = Math.max(0, 100 - (kDiff / crop.optimalNPK.k) * 100);

      // pH suitability
      let phScore = 100;
      if (store.recPh < crop.phRange.min) phScore = Math.max(0, 100 - (crop.phRange.min - store.recPh) * 80);
      else if (store.recPh > crop.phRange.max) phScore = Math.max(0, 100 - (store.recPh - crop.phRange.max) * 80);

      // Humidity suitability
      let humScore = 100;
      if (store.recHumidity < crop.humidityRange.min) humScore = Math.max(0, 100 - (crop.humidityRange.min - store.recHumidity) * 3);
      else if (store.recHumidity > crop.humidityRange.max) humScore = Math.max(0, 100 - (store.recHumidity - crop.humidityRange.max) * 3);

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

    // Sync back top match choice to store
    if (results[0]) {
      store.setField('recommendationResult', {
        crop: results[0].name,
        confidence: results[0].suitability,
        alternatives: results.slice(1).map(r => r.name),
        profitability: results[0].name === 'Sugarcane' || results[0].name === 'Cotton' ? 'High' : 'Medium',
        waterReq: results[0].name === 'Sugarcane' || results[0].name === 'Rice (Paddy)' ? 'High' : 'Moderate',
        growingSeason: results[0].name === 'Sugarcane' ? 'Perennial' : 'Kharif',
        explanation: results[0].details
      });
    }

  }, [store.recN, store.recP, store.recK, store.recPh, store.recHumidity]);

  const topMatch = recommendations[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Back to Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
            Agro-Telemetry Models
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Crop Recommendation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Match target crop selections using soil N-P-K mineral levels, moisture properties, and air humidity profiles.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
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
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold text-slate-850 dark:text-slate-200">
                Soil Telemetry Inputs
              </CardTitle>
              <CardDescription className="text-xs">
                Simulate soil chemistry values to compute optimal matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Nitrogen slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Nitrogen (N) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.recN} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="140"
                  value={store.recN}
                  onChange={(e) => store.setField('recN', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Phosphorus slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Phosphorus (P) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.recP} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="140"
                  value={store.recP}
                  onChange={(e) => store.setField('recP', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Potassium slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Potassium (K) level</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.recK} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={store.recK}
                  onChange={(e) => store.setField('recK', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* pH slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Soil pH Acidity</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.recPh} pH</span>
                </div>
                <input
                  type="range"
                  min="4.5"
                  max="8.5"
                  step="0.1"
                  value={store.recPh}
                  onChange={(e) => store.setField('recPh', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Humidity slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <Label>Soil Humidity</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.recHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={store.recHumidity}
                  onChange={(e) => store.setField('recHumidity', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {topMatch && (
            <Card className="relative overflow-hidden border-0 shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <div className="flex items-start sm:items-center gap-3 relative z-10">
                <div className="h-11 w-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
                  <Sprout className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-emerald-100/70">Optimal Sowing Choice</span>
                  <h3 className="text-xl font-black leading-none mt-0.5 drop-shadow-sm">
                    {topMatch.name}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1 max-w-md">
                    {topMatch.details}
                  </p>
                </div>
              </div>
              <div className="shrink-0 relative z-10 text-center bg-white/25 border border-white/40 p-3 rounded-xl min-w-[80px] backdrop-blur-xs">
                <span className="block text-[8px] uppercase font-black text-emerald-100/60 tracking-widest">Match Score</span>
                <strong className="text-2xl font-black">{topMatch.suitability}%</strong>
              </div>
            </Card>
          )}

          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-450">
                Recommended Crop Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-150 dark:divide-slate-800">
                {recommendations.map((item, index) => {
                  const ROW_COLORS = [
                    { bar: 'bg-emerald-500', rank: 'text-emerald-500', pct: 'text-emerald-600 dark:text-emerald-450' },
                    { bar: 'bg-teal-500', rank: 'text-teal-500', pct: 'text-teal-605 dark:text-teal-400' },
                    { bar: 'bg-blue-500', rank: 'text-blue-500', pct: 'text-blue-600 dark:text-blue-400' },
                    { bar: 'bg-amber-500', rank: 'text-amber-500', pct: 'text-amber-600 dark:text-amber-400' },
                    { bar: 'bg-purple-500', rank: 'text-purple-500', pct: 'text-purple-600 dark:text-purple-400' },
                  ];
                  const color = ROW_COLORS[index % ROW_COLORS.length];

                  return (
                    <div key={item.name} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-black font-mono', color.rank)}>#{String(index + 1).padStart(2, '0')}</span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">{item.name}</h4>
                        </div>
                        
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', color.bar)}
                            style={{ width: `${item.suitability}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={cn('text-xs font-black', color.pct)}>{item.suitability}%</span>
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
