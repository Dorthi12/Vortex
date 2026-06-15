'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bug, Download, Share2, FileText, Info, UploadCloud, RefreshCw, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function PestDetection() {
  const store = useAgricultureStore();
  const [isScanning, setIsScanning] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleSimulatedUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      store.simulateDetection('pest', 'simulated_pest_leaf');
      setIsScanning(false);
    }, 1200);
  };

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.pestResult;

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
            Pest Detection
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan crop leaves or insect captures to classify pests and generate suppression plans.
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
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-emerald-500" />
                Pest Diagnostics Scanner
              </CardTitle>
              <CardDescription className="text-xs">
                Upload insect photo to categorize species.
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
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Classifying Insect Pest...</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Matching segmented contours</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-650 mx-auto" />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        Upload Insect Image
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        PNG or JPG format (Click to simulate scan)
                      </span>
                    </div>
                    <Button size="sm" className="mt-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[11px] h-8 cursor-pointer font-bold">
                      Scan Specimen
                    </Button>
                  </div>
                )}
              </div>

              {res && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => store.clearDetection('pest')}
                  className="w-full mt-4 h-9 text-xs text-red-500 hover:text-red-600 cursor-pointer font-semibold"
                >
                  Clear Results
                </Button>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right: Predictions, Explanation & Insights */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {res ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                
                {/* Prediction Section */}
                <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-red-500">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Classification Output</span>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                          {res.pestName}
                        </h3>
                      </div>
                      <span className={cn(
                        'text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0',
                        res.risk === 'High' ? 'bg-red-50 text-red-755 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}>
                        {res.risk} Infestation Risk
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      <span>Quick Action Trigger:</span>
                      <p className="text-slate-800 dark:text-slate-200 font-bold mt-1">{res.action}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Explanation Section */}
                <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                      Insect Lifecycle Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
                    <p>
                      The detected species belongs to sap-feeding insects (e.g. Pyrilla). These insects suck foliage sap, excreting sticky honeydew that induces black sooty mold growth. Pesticides are most effective during the nymph phase. Sprays should target the underside of leaves where nymphs cluster.
                    </p>
                  </CardContent>
                </Card>

                {/* Insights Section (Treatment Plan Detail) */}
                <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                      Integrated Pest Management (IPM) Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
                    <p className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744] text-slate-700 dark:text-slate-350">
                      {res.treatment}
                    </p>
                  </CardContent>
                </Card>

                {/* Government Advisory Section */}
                <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                      Chemical Safety & Parasitoid release schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
                    <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                      <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p>
                        <strong>Insecticide safety guidelines:</strong> Wear protective gear during chemical sprays. Do not release biological egg parasitoid cocoons (Trichogramma) within 10 days of chemical spraying to prevent parasitoid mortality.
                      </p>
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            ) : (
              <div className="h-full border border-dashed border-slate-300 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-8 py-20 bg-slate-50/20 dark:bg-[#0B1530]/10">
                <Eye className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Awaiting Insect Scan</h3>
                <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                  Upload or scan insect photos. The AI model will run taxonomic boundary match logic to generate targeted IPM instructions.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
