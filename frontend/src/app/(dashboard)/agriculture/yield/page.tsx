'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wheat, HelpCircle, RefreshCw, Calculator, BarChart3, AlertCircle, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Select, FormGroup } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

// Historical Yield averages per crop type
const HISTORICAL_YIELDS: Record<string, { year: string; avg: number }[]> = {
  'Sugarcane': [
    { year: '2022', avg: 72.4 },
    { year: '2023', avg: 74.8 },
    { year: '2024', avg: 73.1 },
    { year: '2025', avg: 76.5 },
    { year: 'Predicted', avg: 80.2 },
  ],
  'Rice (Paddy)': [
    { year: '2022', avg: 3.5 },
    { year: '2023', avg: 3.8 },
    { year: '2024', avg: 3.6 },
    { year: '2025', avg: 4.1 },
    { year: 'Predicted', avg: 4.3 },
  ],
  'Wheat': [
    { year: '2022', avg: 3.1 },
    { year: '2023', avg: 3.2 },
    { year: '2024', avg: 3.0 },
    { year: '2025', avg: 3.3 },
    { year: 'Predicted', avg: 3.6 },
  ],
  'Cotton': [
    { year: '2022', avg: 1.8 },
    { year: '2023', avg: 2.1 },
    { year: '2024', avg: 1.9 },
    { year: '2025', avg: 2.2 },
    { year: 'Predicted', avg: 2.4 },
  ],
  'Groundnuts': [
    { year: '2022', avg: 2.2 },
    { year: '2023', avg: 2.4 },
    { year: '2024', avg: 2.3 },
    { year: '2025', avg: 2.5 },
    { year: 'Predicted', avg: 2.6 },
  ],
};

export default function CropYieldPrediction() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Agriculture in sidebar
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  // Form State
  const [crop, setCrop] = useState<string>('Rice (Paddy)');
  const [area, setArea] = useState<number>(10); // Hectares
  const [rainfall, setRainfall] = useState<number>(900); // mm
  const [ph, setPh] = useState<number>(6.5);
  const [region, setRegion] = useState<string>('Pune');

  // Outputs
  const [predictedYield, setPredictedYield] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(0);

  // Dynamic Yield Calculator Algorithm
  useEffect(() => {
    // Base Yield Factor per crop (Tons / Ha)
    const baseFactors: Record<string, number> = {
      'Sugarcane': 75.0,
      'Rice (Paddy)': 3.8,
      'Wheat': 3.2,
      'Cotton': 2.0,
      'Groundnuts': 2.4,
    };

    const base = baseFactors[crop] || 3.0;

    // Rainfall modifier: optimal around 800-1200mm
    let rainMod = 1.0;
    if (rainfall < 500) rainMod = 0.75;
    else if (rainfall < 800) rainMod = 0.90;
    else if (rainfall > 1500) rainMod = 0.80; // Water logging damage
    else if (rainfall > 1200) rainMod = 0.95;

    // pH modifier: optimal around 6.0 - 7.0
    let phMod = 1.0;
    if (ph < 5.5) phMod = 0.80; // highly acidic
    else if (ph < 6.0) phMod = 0.92;
    else if (ph > 7.5) phMod = 0.82; // highly alkaline
    else if (ph > 7.0) phMod = 0.95;

    // Region factor
    let regionMod = 1.0;
    if (region === 'Konkan' && crop === 'Rice (Paddy)') regionMod = 1.15; // Coastal rice advantage
    if (region === 'Nagpur' && crop === 'Cotton') regionMod = 1.10; // Black cotton soil advantage
    if (region === 'Pune' && crop === 'Sugarcane') regionMod = 1.08;

    // Calculation
    const yieldPerHectare = base * rainMod * phMod * regionMod;
    const totalYield = yieldPerHectare * area;

    setPredictedYield(Number(totalYield.toFixed(2)));

    // Confidence index matches input deviations from optimal zones
    const optimalScore = (rainMod + phMod + regionMod) / 3;
    const baseConfidence = 90 + optimalScore * 8;
    setConfidence(Number(Math.min(98.5, baseConfidence).toFixed(1)));

  }, [crop, area, rainfall, ph, region]);

  // Chart data matching crop
  const chartData = HISTORICAL_YIELDS[crop] || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Agriculture Overview */}
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
          Crop Yield Prediction
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Estimate seasonal crop harvest yields based on geographic division, soil pH parameters, average rainfall levels, and cultivated area size.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="crop"
        title="Book a Crop & Soil Quality Assessment"
        description="An agricultural officer will visit your farm with digital soil probes and crop-scanner kits to provide high-precision yield data and corrective action reports."
        buttonLabel="Call Soil & Crop Specialist"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Simulator Panel */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-md border-t-4 border-t-sea-green">
          <CardHeader className="pb-4 border-b border-border-subtle">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
              Yield Simulator Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Adjust sliders and fields to run machine learning yield estimation models.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Region & Crop type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormGroup label="Select Farm Region">
                <Select value={region} onChange={(e) => setRegion(e.target.value)} className="h-10 text-xs">
                  <option value="Pune">Pune Division (Deccan)</option>
                  <option value="Nagpur">Nagpur Division (Vidarbha)</option>
                  <option value="Konkan">Konkan Division (Coastal)</option>
                </Select>
              </FormGroup>

              <FormGroup label="Select Crop Type">
                <Select value={crop} onChange={(e) => setCrop(e.target.value)} className="h-10 text-xs">
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Groundnuts">Groundnuts</option>
                </Select>
              </FormGroup>
            </div>

            {/* Farm Area Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Farm Area Size</Label>
                <span className="text-xs font-black text-sea-green">{area} Hectares</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full accent-sea-green cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
              <span className="block text-[10px] text-slate-400">Range: 1 Ha to 100 Ha (1 Hectare = 2.47 Acres)</span>
            </div>

            {/* Rainfall Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Rainfall</Label>
                <span className="text-xs font-black text-sea-green">{rainfall} mm</span>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                step="50"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-sea-green cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
              <span className="block text-[10px] text-slate-400">Range: 200mm (Dry) to 2000mm (Monsoon Inundation)</span>
            </div>

            {/* pH Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Soil pH acidity</Label>
                <span className="text-xs font-black text-sea-green">{ph} pH</span>
              </div>
              <input
                type="range"
                min="4.5"
                max="8.5"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full accent-sea-green cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
              <span className="block text-[10px] text-slate-400">Range: 4.5 pH (Highly Acidic) to 8.5 pH (Highly Alkaline)</span>
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Prediction Cards & SVG Chart */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Prediction Result Card — Yellow/Amber background */}
          <Card className="relative overflow-hidden border-0 shadow-lg p-5 flex flex-col justify-between h-52
            bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-900/80">Model Harvest Yield</span>
                <Wheat className="w-5 h-5 text-amber-900/70 shrink-0" />
              </div>
              
              <div className="pt-2">
                <span className="block text-[10px] uppercase font-black text-amber-900/60">Estimated Volume</span>
                <h2 className="text-3xl font-black text-amber-950 mt-1 drop-shadow-sm">
                  {predictedYield} Tons
                </h2>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-amber-600/30 pt-3 mt-4 text-xs font-semibold">
              <span className="text-amber-900/70 font-bold">Model Confidence:</span>
              <span className="text-amber-950 font-black bg-white/30 px-2.5 py-0.5 rounded-full border border-amber-600/30">
                {confidence}% Confidence
              </span>
            </div>
          </Card>

          {/* SVG Hist Column chart */}
          <Card className="bg-card border-border-subtle shadow-xs min-h-[200px]">
            <CardHeader className="pb-2 border-b border-border-subtle">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-550">
                Comparative Yield (Tons/Ha)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-between h-[160px]">
              
              {/* Custom SVG Column Bars — trend colored */}
              <div className="h-[90px] w-full flex items-end justify-between relative bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-lg p-2 pt-5">
                {chartData.map((item, idx) => {
                  const maxVal = Math.max(...chartData.map(c => c.avg));
                  const isPrediction = item.year === 'Predicted';
                  const relativeVal = isPrediction ? (predictedYield / area) : item.avg;
                  const barHeight = `${(relativeVal / maxVal) * 80}%`;

                  // Color bars by trend vs previous bar
                  const prevVal = idx > 0
                    ? (chartData[idx - 1].year === 'Predicted'
                        ? (predictedYield / area)
                        : chartData[idx - 1].avg)
                    : relativeVal;
                  const isIncrease = relativeVal >= prevVal;

                  const barColor = isPrediction
                    ? 'bg-gradient-to-t from-amber-600 to-yellow-400 border border-amber-500 shadow-sm shadow-amber-400/40'
                    : isIncrease || idx === 0
                      ? 'bg-gradient-to-t from-emerald-700 to-emerald-400 border border-emerald-500 shadow-sm shadow-emerald-400/30'
                      : 'bg-gradient-to-t from-red-700 to-red-400 border border-red-500 shadow-sm shadow-red-400/30';

                  const labelColor = isPrediction
                    ? 'text-amber-500 font-black'
                    : isIncrease || idx === 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-red-500 dark:text-red-400 font-bold';

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                      <div
                        className={cn('w-4 rounded-t-sm hover:opacity-80 transition-all', barColor)}
                        style={{ height: barHeight }}
                        title={`${item.year}: ${relativeVal.toFixed(2)} Tons/Ha`}
                      />
                      <span className={cn('text-[8px] mt-1', labelColor)}>
                        {item.year}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[9px] text-slate-500 font-bold border-t border-slate-150 dark:border-slate-800 pt-2 flex items-center gap-1.5 justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" /> Up</span>
                  <span className="inline-flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-red-500 inline-block" /> Down</span>
                  <span className="inline-flex items-center gap-0.5"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" /> Predicted</span>
                </div>
                <strong className="text-sea-green">{(predictedYield / area).toFixed(2)} T/Ha</strong>
              </div>

            </CardContent>
          </Card>

          {/* Call Professional soil check card — Blue theme */}
          <Card className="relative overflow-hidden border-0 shadow-lg p-4 space-y-3
            bg-gradient-to-br from-blue-600 via-sky-700 to-cyan-800">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />
            <div className="relative z-10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Need High Precision Data?</h4>
              <p className="text-[11px] text-blue-100 leading-normal font-medium">
                Book an in-person crop and soil quality assessment. An agricultural officer will visit your farm with digital testing instruments.
              </p>
              <Button
                onClick={() => setIsProfModalOpen(true)}
                className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer backdrop-blur-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                Book Soil Quality Check
              </Button>
            </div>
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
