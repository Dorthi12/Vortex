'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coins, Download, Share2, FileText, Info, Award, Percent, Landmark } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function FarmerCreditRisk() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    store.runFarmerCreditRisk();
  }, [store.creditAnnualRevenue, store.creditLandholding, store.creditFicoScore, store.creditCurrentDebt]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const res = store.creditResult;

  // Credit gauge variables
  const minFico = 300;
  const maxFico = 900;
  const range = maxFico - minFico;
  const pct = Math.min(100, Math.max(0, ((store.creditFicoScore - minFico) / range) * 100));

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
            Farmer Credit Risk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI underwriting index to evaluate agricultural credit scores, loan caps and interest subsidies.
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
                <Coins className="w-4 h-4 text-emerald-500" />
                Underwriting Parameters
              </CardTitle>
              <CardDescription className="text-xs">
                Enter registry metrics to run credit risk scoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Annual Revenue */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Annual Farm Revenue</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">₹{store.creditAnnualRevenue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="25000"
                  value={store.creditAnnualRevenue}
                  onChange={(e) => store.setField('creditAnnualRevenue', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Landholding size */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Landholding size</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.creditLandholding} Ha</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={store.creditLandholding}
                  onChange={(e) => store.setField('creditLandholding', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Credit Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>CIBIL / Credit Score</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.creditFicoScore}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="900"
                  step="10"
                  value={store.creditFicoScore}
                  onChange={(e) => store.setField('creditFicoScore', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Current Debt */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                  <Label>Current Agri Debt</Label>
                  <span className="text-emerald-600 dark:text-[#D4AF37] font-black">₹{store.creditCurrentDebt.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300000"
                  step="10000"
                  value={store.creditCurrentDebt}
                  onChange={(e) => store.setField('creditCurrentDebt', Number(e.target.value))}
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
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Underwriting Index</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Loan Underwriting Output Result
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Risk Classification</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.riskRating}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Max Loan Cap</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">₹{res?.maxLoanCap.toLocaleString()}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Subsidy Eligible</span>
                <strong className="block text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">{res?.subsidyEligible ? 'Yes (3% subvention)' : 'No'}</strong>
              </div>

              <div className="bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <span className="block text-[8px] uppercase font-bold text-slate-450">Interest Rate</span>
                <strong className="block text-xs font-black text-slate-850 dark:text-slate-200 mt-1">{res?.interestRate}%</strong>
              </div>

            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Amortization Capacity Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                The model processes CIBIL registry values ({store.creditFicoScore}) alongside debt-to-revenue ratios (current debt ₹{store.creditCurrentDebt.toLocaleString()} vs revenue ₹{store.creditAnnualRevenue.toLocaleString()}) to calculate repayment hazard matrices. Farmers operating smaller land holdings below 2 hectares receive priority interest subsidies (3% subvention credits) provided history logs remain clear of cooperative defaults.
              </p>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                CIBIL Credit Score Bands
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                <svg className="w-full h-full transform" viewBox="0 0 100 50">
                  {/* Gauge Arc */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  
                  {/* Active segment */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" 
                    fill="none" 
                    stroke={store.creditFicoScore >= 700 ? '#059669' : store.creditFicoScore >= 600 ? '#f59e0b' : '#ef4444'} 
                    strokeWidth="6" 
                    strokeDasharray={`${pct} 100`} 
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center bottom-1">
                  <span className="text-xl font-black text-slate-850 dark:text-slate-100">{store.creditFicoScore}</span>
                  <span className="text-[7px] uppercase font-bold text-slate-400">Registry Score</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-450">FICO/CIBIL rating scale: 300 to 900</span>
            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                PM Kisan Credit Card (KCC) Policy Directives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>KCC Subvention Clause:</strong> {res?.creditVerdict} Eligible borrowers receive interest caps at 4% per annum for prompt repayment windows up to ₹3,00,000 limits under cooperative directives.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
