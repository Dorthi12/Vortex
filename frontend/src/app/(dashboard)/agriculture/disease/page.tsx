'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, ShieldCheck, UploadCloud, Info, RefreshCw, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiseaseDetection() {
  const store = useAgricultureStore();
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSimulatedUpload = () => {
    setIsScanning(true);
    // Simulate deep learning crop diagnostic model
    setTimeout(() => {
      store.simulateDetection('disease', 'simulated_leaf_specimen');
      setIsScanning(false);
    }, 1500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSimulatedUpload();
    }
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
            Disease Detection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload agricultural leaf imagery to diagnose crop pathogens and access instant curative advisories.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Grid: Uploader and Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Drag & Drop Uploader */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Diagnostics Scanner</CardTitle>
              <CardDescription className="text-xs">
                Drag leaf photo or click browse to run computer vision diagnostic scan.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-5">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={handleSimulatedUpload}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]",
                  dragActive 
                    ? "border-emerald-500 bg-emerald-500/5" 
                    : "border-slate-300 dark:border-[#1A2744] hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-[#070D1A]/50"
                )}
              >
                {isScanning ? (
                  <div className="space-y-4">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">AI Pathogen Analysis...</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Extracting leaf pixel matrices</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        Drag Leaf Image Here
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Supports PNG, JPG (Simulated Camera scan on click)
                      </span>
                    </div>
                    <Button size="sm" className="mt-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] h-8 cursor-pointer font-bold">
                      Upload Leaf Image
                    </Button>
                  </div>
                )}
              </div>

              {store.diseaseResult && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => store.clearDetection('disease')}
                  className="w-full mt-4 h-9 text-xs text-red-500 hover:text-red-600 cursor-pointer font-semibold"
                >
                  Clear Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Diagnosis results & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {store.diseaseResult ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* Result metrics */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-red-500">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Pathology Result</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                          {store.diseaseResult.diseaseName}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-red-500">{store.diseaseResult.confidence}%</span>
                        <span className="block text-[8px] uppercase font-bold text-slate-400">Model Conf</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Severity Level:</span>
                      <span className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-full border',
                        store.diseaseResult.severity === 'Severe' 
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-[#D4AF37]'
                      )}>
                        {store.diseaseResult.severity} Pathogen Load
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Side-by-Side Image / SVG Leaf Specimen Comparison */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Side-By-Side Specimen Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 grid grid-cols-2 gap-4">
                    
                    {/* Left: Uploaded leaf */}
                    <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] text-center flex flex-col items-center justify-between min-h-[190px]">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-2">Uploaded Specimen</span>
                      
                      {/* Leaf SVG representation with lesions */}
                      <svg className="w-24 h-24 text-emerald-600" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 50 10 C 20 40 20 70 50 90 C 80 70 80 40 50 10 Z" fill="currentColor" opacity="0.85" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="#047857" strokeWidth="1.5" />
                        {/* Red spots showing sugarcane rot */}
                        <circle cx="45" cy="40" r="4.5" fill="#ef4444" opacity="0.9" />
                        <circle cx="55" cy="55" r="3.5" fill="#b91c1c" opacity="0.9" />
                        <circle cx="48" cy="65" r="5" fill="#ef4444" opacity="0.95" />
                      </svg>

                      <span className="text-[9px] font-bold text-slate-450 mt-2 block">Crop leaf detail</span>
                    </div>

                    {/* Right: Reference spec */}
                    <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] text-center flex flex-col items-center justify-between min-h-[190px]">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-2">Reference Database Match</span>
                      
                      {/* Leaf SVG library match */}
                      <svg className="w-24 h-24 text-emerald-600" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 50 10 C 20 40 20 70 50 90 C 80 70 80 40 50 10 Z" fill="currentColor" opacity="0.85" />
                        <line x1="50" y1="10" x2="50" y2="90" stroke="#047857" strokeWidth="1.5" />
                        {/* Identical red spot pattern for sugarcane rot */}
                        <circle cx="45" cy="40" r="4.5" fill="#b91c1c" />
                        <circle cx="55" cy="55" r="3.5" fill="#b91c1c" />
                        <circle cx="48" cy="65" r="5" fill="#b91c1c" />
                      </svg>

                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 block">Colletotrichum Match</span>
                    </div>

                  </CardContent>
                </Card>

                {/* Treatment details */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Recommended Treatment Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed space-y-3">
                    <p className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-200 dark:border-[#1A2744]">
                      {store.diseaseResult.treatment}
                    </p>
                    <div className="flex gap-2 items-start text-[11px] text-slate-400">
                      <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p>
                        Note: Early intervention prevents systemic spread to adjacent sugarcane stalks. Disinfect all cutting tools before field redeployment.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full border border-dashed border-slate-350 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-8 py-20 bg-slate-50/20 dark:bg-[#0A1228]/10"
              >
                <Eye className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">No Active Diagnosis</h3>
                <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                  Trigger a simulated diagnostic camera capture or drag a file to compute pathogenetic classification results.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
