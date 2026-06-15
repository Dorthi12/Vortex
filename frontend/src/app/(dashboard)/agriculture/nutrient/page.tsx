'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, UploadCloud, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function NutrientDeficiency() {
  const store = useAgricultureStore();
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulatedUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      store.simulateDetection('nutrient', 'simulated_nutrient_leaf');
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
            Nutrient Deficiency Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyze crop leaf pigmentation anomalies to diagnose macro and micro-mineral deficiencies.
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Uploader */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Spectral Pigment Analyzer</CardTitle>
              <CardDescription className="text-xs">
                Upload leaf photograph to analyze chlorosis or necrosis signatures.
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
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Analyzing Pigment Spectra...</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Detecting chlorotic margins</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        Upload Leaf Image
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        JPEG or PNG format
                      </span>
                    </div>
                    <Button size="sm" className="mt-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] h-8 cursor-pointer font-bold">
                      Scan Crop Specimen
                    </Button>
                  </div>
                )}
              </div>

              {store.nutrientResult && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => store.clearDetection('nutrient')}
                  className="w-full mt-4 h-9 text-xs text-red-500 hover:text-red-600 cursor-pointer font-semibold"
                >
                  Clear Results
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right: Diagnosis Outputs */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {store.nutrientResult ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* Result Card */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-amber-500">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mineral Status</span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {store.nutrientResult.deficiency}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Deficiency Level:</span>
                      <span className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-full border',
                        store.nutrientResult.severity === 'Severe' 
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-[#D4AF37]'
                      )}>
                        {store.nutrientResult.severity} Depletion
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recs */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Recovery Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 text-xs text-slate-500 font-semibold leading-relaxed">
                    <p className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-350">
                      {store.nutrientResult.recommendations}
                    </p>

                    <div className="flex gap-2 items-start text-[11px] text-slate-400 border-t border-slate-150 dark:border-[#1A2744] pt-3.5">
                      <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p>
                        Soil correction is recommended alongside foliar sprays to ensure systemic root replenishment. Check soil pH before chemical supplementation, as high alkaline levels block trace mineral absorption.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ) : (
              <div className="h-full border border-dashed border-slate-300 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-8 py-20 bg-slate-50/20 dark:bg-[#0A1228]/10">
                <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Awaiting Spectral Scan</h3>
                <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                  Upload or capture a leaf specimen image. The AI will inspect chloroplast color coordinates to verify health indices.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
