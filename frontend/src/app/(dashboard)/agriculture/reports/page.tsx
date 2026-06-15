'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function AgricultureReports() {
  const store = useAgricultureStore();
  const [compilingId, setCompilingId] = useState<string | null>(null);
  const [downloadReadyId, setDownloadReadyId] = useState<string | null>(null);

  const handleTriggerCompile = (reportId: string) => {
    setCompilingId(reportId);
    setDownloadReadyId(null);
    setTimeout(() => {
      setCompilingId(null);
      setDownloadReadyId(reportId);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Control Panel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Agricultural Reports Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compile and download official seasonal harvest outlooks, soil analysis charts, and regional mandi metrics.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Grid: Compilers & Archives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Report Compiler Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">Generate New Dossier</span>
          
          <div className="space-y-3.5">
            
            {/* Seasonal report card */}
            <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">Seasonal Outlooks</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-150">MH Kharif Harvest Forecast 2026</h4>
                <p className="text-xs text-slate-500 max-w-md">Calculates expected crop yields, rainfall distributions, and district production rankings.</p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {compilingId === 'seasonal' ? (
                  <Button disabled className="w-full sm:w-auto bg-slate-200 text-slate-500 border border-slate-350 text-xs py-2 h-9">
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Compiling...
                  </Button>
                ) : downloadReadyId === 'seasonal' ? (
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 h-9 font-bold flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleTriggerCompile('seasonal')}
                    className="w-full sm:w-auto bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-[#1A2744] hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 dark:hover:text-emerald-400 text-xs py-2 h-9 cursor-pointer font-semibold"
                  >
                    Compile Report
                  </Button>
                )}
              </div>
            </Card>

            {/* District report card */}
            <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">District Audits</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-150">Pune District Soil Telemetry Index</h4>
                <p className="text-xs text-slate-500 max-w-md">Aggregated Nitrogen, Organic Carbon, and pH statistics mapped across 12 blocks.</p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {compilingId === 'district' ? (
                  <Button disabled className="w-full sm:w-auto bg-slate-200 text-slate-500 border border-slate-350 text-xs py-2 h-9">
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Compiling...
                  </Button>
                ) : downloadReadyId === 'district' ? (
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 h-9 font-bold flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleTriggerCompile('district')}
                    className="w-full sm:w-auto bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-[#1A2744] hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 dark:hover:text-emerald-400 text-xs py-2 h-9 cursor-pointer font-semibold"
                  >
                    Compile Report
                  </Button>
                )}
              </div>
            </Card>

            {/* Farmer report card */}
            <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-450 font-bold block">Individual Farmer Dossiers</span>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-150">Cooperative Soil & Crop Advisory Dossier</h4>
                <p className="text-xs text-slate-500 max-w-md">Detailed single-farm report sheets listing NPK application schedules and market projections.</p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {compilingId === 'farmer' ? (
                  <Button disabled className="w-full sm:w-auto bg-slate-200 text-slate-500 border border-slate-350 text-xs py-2 h-9">
                    <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    Compiling...
                  </Button>
                ) : downloadReadyId === 'farmer' ? (
                  <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 h-9 font-bold flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleTriggerCompile('farmer')}
                    className="w-full sm:w-auto bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-[#1A2744] hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 dark:hover:text-emerald-400 text-xs py-2 h-9 cursor-pointer font-semibold"
                  >
                    Compile Report
                  </Button>
                )}
              </div>
            </Card>

          </div>
        </div>

        {/* Right: Pre-generated Archive index */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">Recent Archives</span>
          
          <div className="space-y-3">
            {store.recentReports.map((rep) => (
              <Card key={rep.id} className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744] p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate max-w-[170px]">{rep.name}</h5>
                    <span className="block text-[8px] text-slate-450 mt-0.5">{rep.date} • {rep.size}</span>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-450 hover:text-emerald-500 cursor-pointer">
                  <Download className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
