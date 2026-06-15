'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, UploadCloud, Info, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { id: 'sowing', name: 'Sowing / Seedling', days: 'Day 0 - 20' },
  { id: 'tillering', name: 'Active Tillering', days: 'Day 20 - 45' },
  { id: 'elongation', name: 'Grand Elongation', days: 'Day 45 - 120' },
  { id: 'maturity', name: 'Yield / Maturity', days: 'Day 120 - 280' },
  { id: 'harvest', name: 'Harvest Period', days: 'Day 280 - 365' }
];

export default function CropGrowthStage() {
  const store = useAgricultureStore();
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulatedUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      store.simulateDetection('stage', 'simulated_growth_stage');
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Diagnostics AI
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Crop Growth Stage Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Classify crop physiological growth phases using computer vision to sync watering and fertilizing schedules.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Uploader */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Phenology Sensor</CardTitle>
              <CardDescription className="text-xs">
                Upload crop field photograph to categorize developmental phases.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              
              <div 
                onClick={handleSimulatedUpload}
                className="border-2 border-dashed border-slate-300 dark:border-[#1A2744] hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-[#070D1A]/50 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px]"
              >
                {isScanning ? (
                  <div className="space-y-4">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Classifying Phenological Stage...</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Measuring internode node sizes</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        Upload Field Photo
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        JPEG or PNG format
                      </span>
                    </div>
                    <Button size="sm" className="mt-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] h-8 cursor-pointer font-bold">
                      Scan Crop Stage
                    </Button>
                  </div>
                )}
              </div>

              {store.stageResult && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => store.clearDetection('stage')}
                  className="w-full mt-4 h-9 text-xs text-red-500 hover:text-red-600 cursor-pointer font-semibold"
                >
                  Clear Results
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right: Results & Timeline */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {store.stageResult ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* Result Info Card */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-blue-500">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Current Stage</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {store.stageResult.stage}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {store.stageResult.daysRemaining} Days
                        </span>
                        <span className="block text-[8px] uppercase font-bold text-slate-400">Remaining to Harvest</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Visualization */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Crop Phenology Stage Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    
                    {/* SVG Progress Timeline */}
                    <div className="relative w-full py-4 overflow-x-auto">
                      <div className="min-w-[450px] space-y-4">
                        
                        {/* Connecting Line */}
                        <div className="relative h-1.5 bg-slate-150 dark:bg-slate-800 rounded-full w-full">
                          <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full w-[60%]" />
                          
                          {/* Circle indicators */}
                          <div className="absolute -top-1.5 left-[5%] h-4.5 w-4.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#0A1228] flex items-center justify-center">
                            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                          </div>

                          <div className="absolute -top-1.5 left-[30%] h-4.5 w-4.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#0A1228] flex items-center justify-center">
                            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                          </div>

                          <div className="absolute -top-1.5 left-[58%] h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center animate-pulse">
                            <span className="h-2 w-2 bg-white rounded-full" />
                          </div>

                          <div className="absolute -top-1.5 left-[80%] h-4.5 w-4.5 rounded-full border-2 border-slate-300 dark:border-slate-750 bg-white dark:bg-[#0A1228] flex items-center justify-center">
                            <span className="h-1.5 w-1.5 bg-slate-350 dark:bg-slate-700 rounded-full" />
                          </div>
                        </div>

                        {/* Labels row */}
                        <div className="grid grid-cols-5 text-center text-[10px] font-bold text-slate-500">
                          {STAGES.map((s, idx) => (
                            <div key={s.id} className={cn(
                              "space-y-0.5",
                              idx === 2 ? "text-blue-500 font-extrabold" : idx < 2 ? "text-slate-850 dark:text-slate-300" : "text-slate-400"
                            )}>
                              <span className="block truncate">{s.name}</span>
                              <span className="text-[8px] opacity-75 font-semibold block">{s.days}</span>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Recommended Immediate Actions */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Recommended Action Protocols
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed space-y-3">
                    <p className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-350">
                      {store.stageResult.actions}
                    </p>
                    <div className="flex gap-2 items-start text-[11px] text-slate-400">
                      <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p>
                        Note: Flowering and grand growth phases are critical water stress periods. Verify that soil moisture stays above 40% using the micro-irrigation controller.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ) : (
              <div className="h-full border border-dashed border-slate-300 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-8 py-20 bg-slate-50/20 dark:bg-[#0A1228]/10">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Awaiting Image Scan</h3>
                <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                  Upload a photo of your field crops. The model will analyze node geometry to establish the developmental growth stage.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
