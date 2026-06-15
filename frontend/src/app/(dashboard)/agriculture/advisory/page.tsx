'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, FileText, CheckCircle2, RefreshCw, Download, Sparkles, Sprout } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgricultureAdvisoryAgent() {
  const store = useAgricultureStore();
  const [owner, setOwner] = useState('Gov-Farmer #2481');
  const [size, setSize] = useState('2.5');
  const [crop, setCrop] = useState('Sugarcane');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleCompileReport = () => {
    setIsCompiling(true);
    setTimeout(() => {
      store.generateAdvisoryReport({
        owner,
        size: Number(size),
        crop
      });
      setIsCompiling(false);
    }, 1500);
  };

  const report = store.advisoryReport;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              AI Decision Assistants
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Agriculture Advisory Agent
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compile a comprehensive, AI-powered agricultural advisory report integrating soil telemetry and market intelligence.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Split layout: Inputs and Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Profile settings */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-4 border-b border-slate-150 dark:border-[#1A2744]">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Bot className="w-4 h-4 text-emerald-500" />
                Report Compiler Inputs
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Sync current profile metadata to generate the automated dossier.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <div className="space-y-1">
                <Label>Farmer Owner Identifer</Label>
                <Input 
                  value={owner} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwner(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label>Farm Size (Hectares)</Label>
                <Input 
                  type="number"
                  value={size} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSize(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label>Target Sown Crop</Label>
                <Input 
                  value={crop} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrop(e.target.value)} 
                  className="h-10 text-xs" 
                />
              </div>

              <Button
                onClick={handleCompileReport}
                disabled={isCompiling}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 text-xs py-2.5 h-10 cursor-pointer font-bold"
              >
                {isCompiling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Compiling Farm Dossier...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Generate Advisory Report
                  </>
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Dossier Output */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div 
                key="dossier"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                
                {/* Dossier Card Sheet */}
                <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] shadow-md relative overflow-hidden">
                  
                  {/* Top Header Badge */}
                  <div className="bg-slate-50 dark:bg-[#080E1E] p-5 border-b border-slate-150 dark:border-[#1A2744] flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] block">Official AI Advisory Dossier</span>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{report.id}</h3>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      Export PDF
                    </Button>
                  </div>

                  <CardContent className="p-6 space-y-6 text-xs text-slate-500 font-semibold leading-relaxed">
                    
                    {/* Grid of Profile / Soil / Weather */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-150 dark:border-[#1A2744] pb-5">
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Farm Profile</span>
                        <p className="text-slate-800 dark:text-slate-200 font-bold">{report.farmProfile.owner}</p>
                        <p>{report.farmProfile.location}</p>
                        <p>{report.farmProfile.size} Hectares Cultivated</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Soil Health rating</span>
                        <p className="text-slate-800 dark:text-slate-200 font-bold">Grade: {report.soilReport.grade}</p>
                        <p>N: {report.soilReport.nitrogen} mg/kg | pH: {report.soilReport.ph}</p>
                        <p>Moisture: {report.soilReport.moisture}%</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Weather Context</span>
                        <p className="text-slate-800 dark:text-slate-200 font-bold">{report.weatherContext.forecast}</p>
                        <p>Temp: {report.weatherContext.temp}°C | Humidity: {report.weatherContext.humidity}%</p>
                      </div>
                    </div>

                    {/* AI Recommendations Summary */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Recommended Agricultural Strategy</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1">
                            <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                            Crop Choice & Yield Forecast
                          </span>
                          <p className="text-slate-800 dark:text-slate-100 font-bold">Crop: {report.recommendations.crop}</p>
                          <p>Expected Harvest Output: <strong>{report.recommendations.yieldForecast} Tons</strong></p>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            Fertilizer Dosing Schedule
                          </span>
                          <p className="text-slate-800 dark:text-slate-100 font-bold">NPK Chemical Target:</p>
                          <p>Urea: {report.recommendations.fertilizerPlan.urea} kg | DAP: {report.recommendations.fertilizerPlan.dap} kg | MOP: {report.recommendations.fertilizerPlan.mop} kg</p>
                          <p className="italic text-[10px] text-slate-450 mt-1">Compost supplement: {report.recommendations.fertilizerPlan.organics}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            Irrigation Forecast
                          </span>
                          <p className="text-slate-800 dark:text-slate-100 font-bold">Discharge Schedule:</p>
                          <p>{report.recommendations.irrigationPlan.cycle}</p>
                          <p>Water Stress Indicator: <strong>{report.recommendations.irrigationPlan.risk}</strong></p>
                        </div>

                        <div className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] space-y-2">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-emerald-500" />
                            Mandi Market Outlook
                          </span>
                          <p className="text-slate-800 dark:text-slate-100 font-bold">Trading Pricing Profile:</p>
                          <p>Current: ₹{report.recommendations.marketOutlook.current}/Q | 7d Forecast: ₹{report.recommendations.marketOutlook.forecast}/Q</p>
                          <p className="text-emerald-600 dark:text-emerald-400">Market trend is: {report.recommendations.marketOutlook.trend}</p>
                        </div>

                      </div>
                    </div>

                    {/* Eligible Welfare Subsidies */}
                    <div className="border-t border-slate-150 dark:border-[#1A2744] pt-4 space-y-2">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Welfare Schemes Matching</span>
                      <div className="flex flex-wrap gap-2">
                        {report.recommendations.subsidies.map((sub, idx) => (
                          <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="h-full border border-dashed border-slate-350 dark:border-[#1A2744] rounded-2xl flex flex-col items-center justify-center text-center p-8 py-24 bg-slate-50/20 dark:bg-[#0A1228]/10">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">No Advisory Compiled</h3>
                <p className="text-xs text-slate-450 max-w-sm mt-1 leading-relaxed">
                  Enter farmer credentials and click generate. The AI agent will compile diagnostic and pricing telemetry into a structured farm dossier sheet.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
