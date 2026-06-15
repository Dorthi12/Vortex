'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AgricultureAnalytics() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-150 dark:border-[#1A2744] pb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-[#D4AF37]">
              Control Panel
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Agriculture Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Advanced multi-seasonal telemetry analysis and budget audits.
          </p>
        </div>

        <Link href="/agriculture">
          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1 text-xs cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Button>
        </Link>
      </div>

      {/* Main Charts Grid (Yield & Farmer Adoption) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Yield Analytics */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Yield Analytics (National Harvest Output)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-[200px]">
              <svg className="w-full h-full text-slate-150 dark:text-slate-800" viewBox="0 0 100 45">
                <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2" />
                <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2" />
                
                {/* Yield Curve 1: Target (Emerald) */}
                <path d="M 5 38 Q 25 32 45 20 T 85 8 L 95 6" fill="none" stroke="#059669" strokeWidth="1.8" />
                
                {/* Yield Curve 2: Actual (Blue) */}
                <path d="M 5 40 L 25 36 L 45 28 L 65 24 L 85 14" fill="none" stroke="#3b82f6" strokeWidth="1.8" />
                
                {/* Dot highlights */}
                <circle cx="85" cy="14" r="2.2" fill="#3b82f6" />
                <circle cx="85" cy="8" r="2.2" fill="#059669" />

                <text x="5" y="44" fontSize="3" fill="currentColor">2022</text>
                <text x="50" y="44" fontSize="3" fill="currentColor" textAnchor="middle">2024</text>
                <text x="95" y="44" fontSize="3" fill="currentColor" textAnchor="end">2026 (Target)</text>
              </svg>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Target Output</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Actual Output</span>
            </div>
          </CardContent>
        </Card>

        {/* Farmer Adoption Analytics */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <Users className="w-4 h-4 text-emerald-500" />
              Farmer Adoption Analytics (Registry Growth)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-[200px]">
              <svg className="w-full h-full text-slate-150 dark:text-slate-800" viewBox="0 0 100 45">
                <line x1="0" y1="22.5" x2="100" y2="22.5" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2" />
                
                {/* Bar blocks by district */}
                <rect x="5" y="15" width="10" height="30" rx="1.5" fill="#3b82f6" />
                <rect x="24" y="8" width="10" height="37" rx="1.5" fill="#059669" />
                <rect x="43" y="18" width="10" height="27" rx="1.5" fill="#3b82f6" />
                <rect x="62" y="12" width="10" height="33" rx="1.5" fill="#059669" />
                <rect x="81" y="5" width="10" height="40" rx="1.5" fill="#f59e0b" /> {/* Target reached */}

                <text x="10" y="44" fontSize="3" fill="currentColor" textAnchor="middle">Pune</text>
                <text x="29" y="44" fontSize="3" fill="currentColor" textAnchor="middle">Nagpur</text>
                <text x="48" y="44" fontSize="3" fill="currentColor" textAnchor="middle">Nashik</text>
                <text x="67" y="44" fontSize="3" fill="currentColor" textAnchor="middle">Satara</text>
                <text x="86" y="44" fontSize="3" fill="currentColor" textAnchor="middle">Kolhapur</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-500 font-bold">Registry active profiles count by district (Kolhapur leads with 15k+).</p>
          </CardContent>
        </Card>

      </div>

      {/* Minor Charts Grid (Disease, Subsidies, Risk Trends) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Disease Analytics */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-emerald-500" />
              Pathogen Outbreaks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-900" />
                {/* Red rot: 45% */}
                <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="45 55" strokeDashoffset="0" />
                {/* Rice Blast: 30% */}
                <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-45" />
                {/* Rust: 25% */}
                <circle cx="21" cy="21" r="15.91" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-75" />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-sm font-black text-slate-850 dark:text-slate-100">4,820</span>
                <span className="text-[7px] uppercase font-bold text-slate-400">Alerts</span>
              </div>
            </div>
            <div className="w-full text-[9px] font-bold text-slate-500 space-y-1">
              <span className="flex items-center justify-between"><span>Red Rot:</span> <strong className="text-red-500">45%</strong></span>
              <span className="flex items-center justify-between"><span>Rice Blast:</span> <strong className="text-amber-500">30%</strong></span>
              <span className="flex items-center justify-between"><span>Leaf Rust:</span> <strong className="text-blue-500">25%</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Subsidy Analytics */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <FileText className="w-4 h-4 text-emerald-500" />
              Subsidy Disbursements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="h-[110px]">
              <svg className="w-full h-full text-slate-150 dark:text-slate-800" viewBox="0 0 100 45">
                {/* Horizontal bar charts represent scheme budgets */}
                <rect x="0" y="5" width="75" height="6" rx="1.5" fill="#059669" />
                <rect x="0" y="18" width="60" height="6" rx="1.5" fill="#3b82f6" />
                <rect x="0" y="31" width="40" height="6" rx="1.5" fill="#f59e0b" />
              </svg>
            </div>
            <div className="text-[9px] font-bold text-slate-500 space-y-1">
              <div className="flex justify-between"><span>Drip Irrigation:</span> <strong>₹7.5 Cr</strong></div>
              <div className="flex justify-between"><span>Solar subvention:</span> <strong>₹6.0 Cr</strong></div>
              <div className="flex justify-between"><span>Farm custom rent:</span> <strong>₹4.0 Cr</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Analytics */}
        <Card className="bg-white dark:bg-[#0A1228] border-slate-200 dark:border-[#1A2744]">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-[#1A2744]">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              Composite Risk Index
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col justify-between h-[190px]">
            <div className="w-full flex-1">
              <svg className="w-full h-full text-slate-150 dark:text-slate-800" viewBox="0 0 100 45">
                <path d="M 5 15 L 25 22 L 45 10 L 65 30 L 85 24 L 95 26" fill="none" stroke="#ef4444" strokeWidth="1.6" />
                <circle cx="95" cy="26" r="2.2" fill="#ef4444" />
              </svg>
            </div>
            <span className="text-[9px] font-bold text-slate-500 mt-2 block">
              30-day Risk Index baseline (26% composite rating indicates high safety corridors).
            </span>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
