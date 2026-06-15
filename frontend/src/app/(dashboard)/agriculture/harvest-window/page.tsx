'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Download, Share2, FileText, Info, Flame, Thermometer, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup, Input } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function HarvestWindowPrediction() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    store.runHarvestWindowPrediction();
  }, [store.harvestCrop, store.harvestPlantingDate, store.harvestHeatUnits, store.harvestSoilTemp]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.harvestResult;

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
            Harvest Window Prediction
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-modeled heat accumulation calculations to forecast optimal crop harvesting calendars.
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
                <Calendar className="w-4 h-4 text-emerald-500" />
                Harvest Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Enter cultivar metrics to calculate ripening timelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <FormGroup label="Select Crop Cultivar">
                <Select 
                  value={store.harvestCrop} 
                  onChange={(e) => store.setField('harvestCrop', e.target.value)} 
                  className="h-10 text-xs"
                >
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Rice (Paddy)">Rice (Paddy)</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                </Select>
              </FormGroup>

              <div className="space-y-1.5">
                <Label>Sowing / Planting Date</Label>
                <input
                  type="date"
                  value={store.harvestPlantingDate}
                  onChange={(e) => store.setField('harvestPlantingDate', e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#070D1A] rounded-lg text-xs"
                />
              </div>

              {/* Accumulated Heat Units */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> Heat Units (GDD)</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.harvestHeatUnits} GDD</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  value={store.harvestHeatUnits}
                  onChange={(e) => store.setField('harvestHeatUnits', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Soil Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Soil Temperature</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.harvestSoilTemp} °C</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={store.harvestSoilTemp}
                  onChange={(e) => store.setField('harvestSoilTemp', Number(e.target.value))}
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
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Harvest Prediction</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Predicted Harvesting Window Range
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Estimated Start</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.estimatedStart}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Estimated End</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.estimatedEnd}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Maturity Ratio</span>
                <strong className="block text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">{res?.cropMaturityPct}%</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Harvest Risk</span>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-1',
                  res?.riskLevel === 'High' ? 'bg-red-50 text-red-755 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}>
                  {res?.riskLevel} Risk
                </span>
              </div>

            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Physiological Ripening GDD Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                The model uses cumulative Growing Degree Days (GDD) calculated from planting date ({store.harvestPlantingDate}) to evaluate sucrose accumulation levels. High temperature and solar radiation accelerate chemical maturity curves. If GDD registers under 1200, crops are still inside cellular elongation phases, and premature harvesting results in lower dry-weight yields.
              </p>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Sucrose Maturity Ratio Index
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative flex items-center justify-center">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 absolute left-0 top-0 transition-all duration-500" 
                  style={{ width: `${res?.cropMaturityPct}%` }}
                />
                <span className="relative z-10 text-[10px] font-black text-slate-800 dark:text-slate-150">
                  {res?.cropMaturityPct}% Maturity (Target: 100%)
                </span>
              </div>
              <span className="text-[9px] font-bold text-slate-450">Estimated days remaining: {res?.cropMaturityPct && res.cropMaturityPct >= 95 ? '0-5 days (Harvesting ready)' : '25-45 days'}</span>
            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Cooperative Mandi Booking Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>District Cooperative Notice:</strong> {res?.advice} Farmers must register harvesting calendars on the Maha-Mandi portal 15 days before the forecast start date to secure cooperative transport slots.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
