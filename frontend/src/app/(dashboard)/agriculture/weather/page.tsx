'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CloudSun, Download, Share2, FileText, Info, Thermometer, Wind, Droplets, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function WeatherIntelligence() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    store.runWeatherIntelligence();
  }, [store.weatherTemp, store.weatherHumidity, store.weatherPrecip, store.weatherWindSpeed]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.weatherResult;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 text-slate-800 dark:text-[#F8FAFC]">
      
      {/* Header with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div className="space-y-1">
          <Link 
            href="/agriculture" 
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-[#D4AF37] transition-colors cursor-pointer group mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Agriculture Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Weather Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Micro-climate monitoring, organic evaporation rates, and localized frost threat forecasting.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer">
            <FileText className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="h-9 px-3 flex items-center gap-1 text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {shareSuccess ? 'Link Copied!' : 'Share'}
          </Button>
        </div>
      </div>

      {/* Page Body Split: Inputs and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Inputs Section */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-250">
                <CloudSun className="w-4 h-4 text-emerald-500" />
                Climate Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Adjust local weather sensors to compute agricultural hazards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Temperature</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.weatherTemp} °C</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  value={store.weatherTemp}
                  onChange={(e) => store.setField('weatherTemp', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Humidity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> Relative Humidity</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.weatherHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={store.weatherHumidity}
                  onChange={(e) => store.setField('weatherHumidity', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Precipitation */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Precipitation (Rain)</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.weatherPrecip} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={store.weatherPrecip}
                  onChange={(e) => store.setField('weatherPrecip', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Wind Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label className="flex items-center gap-1"><Wind className="w-3.5 h-3.5" /> Wind Speed</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.weatherWindSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={store.weatherWindSpeed}
                  onChange={(e) => store.setField('weatherWindSpeed', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right: Predictions, Explanation & Insights */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prediction Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Climate Diagnostic</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Micro-Climate Output Result
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Forecast Category</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.forecast}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Evaporation rate</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.evaporationIndex} Index</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Ground Frost Risk</span>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-1',
                  res?.frostRisk === 'High' ? 'bg-red-50 text-red-750 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {res?.frostRisk} Risk
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Scientific Prediction Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                The model correlates ambient temperatures ({store.weatherTemp}°C) alongside relative humidity ({store.weatherHumidity}%) to calculate the evapotranspiration index. Extreme temperatures create localized low pressure, elevating moisture loss from plants (transpiration) and soil surfaces. Sowing operations should adapt to these water loss profiles.
              </p>
            </CardContent>
          </Card>

          {/* Insights Section (SVG visual representation of wind & temperature dials) */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Atmospheric Dials Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 gap-6">
              
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Wind Velocity</span>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="currentColor" strokeWidth="3.5" className="text-slate-100 dark:text-slate-900" />
                    <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray={`${(store.weatherWindSpeed / 40) * 100} 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-slate-800 dark:text-slate-150">
                    {store.weatherWindSpeed} km/h
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Precipitation Chance</span>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="currentColor" strokeWidth="3.5" className="text-slate-100 dark:text-slate-900" />
                    <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#059669" strokeWidth="3.5" strokeDasharray={`${store.weatherPrecip} 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-slate-800 dark:text-slate-150">
                    {store.weatherPrecip}%
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Government Extension Advisory Directive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Chemical spray restrictions:</strong> {res?.advice} Spraying pesticides is legally restricted if wind speeds exceed 25 km/h to prevent spray drift onto neighbouring habitations.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
