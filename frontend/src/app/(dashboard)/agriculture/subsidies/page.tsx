'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Share2, Info, CheckCircle2, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup, Input } from '@/components/ui/form';
import { useAgricultureStore } from '@/store/useAgricultureStore';
import { cn } from '@/lib/utils';

export default function SubsidyAdvisor() {
  const store = useAgricultureStore();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    store.runSubsidyAdvisor();
  }, [store.subsidyState, store.subsidyCategory, store.subsidyLandholding, store.subsidyCrop]);

  const handleShare = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const handleEvaluateClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setTimeout(() => {
      store.runSubsidyAdvisor();
      setIsEvaluating(false);
    }, 800);
  };

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
            Subsidy Advisor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify farming eligibility limits and locate open welfare scheme grants.
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
                <FileText className="w-4 h-4 text-emerald-500" />
                Farmer Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Configure farmer profiles to verify subvention limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleEvaluateClick} className="space-y-4">
                
                <FormGroup label="Farmer Category">
                  <Select 
                    value={store.subsidyCategory} 
                    onChange={(e) => store.setField('subsidyCategory', e.target.value)} 
                    className="h-10 text-xs"
                  >
                    <option value="General">General Category</option>
                    <option value="SC/ST">Scheduled Caste / Tribe (SC/ST)</option>
                    <option value="Women">Women Farm Operator</option>
                  </Select>
                </FormGroup>

                <FormGroup label="Farming State">
                  <Select 
                    value={store.subsidyState} 
                    onChange={(e) => store.setField('subsidyState', e.target.value)} 
                    className="h-10 text-xs"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                  </Select>
                </FormGroup>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <Label>Landholding Size</Label>
                    <span className="text-emerald-600 dark:text-[#D4AF37] font-black">{store.subsidyLandholding} Ha</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={store.subsidyLandholding}
                    onChange={(e) => store.setField('subsidyLandholding', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                <FormGroup label="Target Sown Crop">
                  <Select 
                    value={store.subsidyCrop} 
                    onChange={(e) => store.setField('subsidyCrop', e.target.value)} 
                    className="h-10 text-xs"
                  >
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Rice (Paddy)">Rice (Paddy)</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Cotton">Cotton</option>
                  </Select>
                </FormGroup>

                <Button
                  type="submit"
                  disabled={isEvaluating}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 text-xs py-2.5 h-10 cursor-pointer font-bold"
                >
                  {isEvaluating ? 'Evaluating Subsidies...' : 'Evaluate Eligibility'}
                </Button>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Predictions, Explanation & Insights */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Prediction Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744] border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">AI Scheme Evaluator</span>
              <CardTitle className="text-sm font-bold mt-1 text-slate-900 dark:text-slate-100">
                Matched Welfare Programs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              
              {store.eligibleSchemes.map((scheme, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-[#070D1A] p-4 rounded-xl border border-slate-150 dark:border-[#1A2744] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-850 dark:text-slate-150">{scheme.name}</h4>
                    <span className="block text-[10px] text-slate-450">Required documents: {scheme.docs.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-250">
                      {scheme.status}
                    </span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1.5 h-8 font-bold cursor-pointer">
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>

          {/* Explanation Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Direct Benefit Transfer (DBT) Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                Government subsidies are disbursed utilizing Aadhaar-linked Direct Benefit Transfer (DBT) directly into cooperative bank account directories. Land registry records (under {store.subsidyLandholding} Ha) determine marginal farmer priority status. SC/ST and women categories receive a 10% subvention premium on micro-irrigation hardware installations.
              </p>
            </CardContent>
          </Card>

          {/* Insights Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Welfare Scheme Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs font-semibold text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Maximum Subsidy Limit:</span>
                <strong className="text-slate-805 dark:text-slate-200">₹60,000 / Farmer</strong>
              </div>
              <div className="flex justify-between">
                <span>Direct Bank Transfer Verification:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">Aadhaar Seeded & Active</strong>
              </div>
            </CardContent>
          </Card>

          {/* Government Advisory Section */}
          <Card className="bg-white dark:bg-[#0B1530] border-slate-200 dark:border-[#1A2744]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black uppercase text-slate-450 tracking-wider">
                Application Deadlines & Extension Circulars
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
              <div className="flex gap-2 items-start bg-slate-50 dark:bg-[#070D1A] p-3 rounded-lg border border-slate-150 dark:border-[#1A2744]">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Deadline Warning:</strong> Subsidies for Kharif micro-irrigation systems close on June 30th. Ensure that invoice copies and land maps are uploaded before the deadline to qualify for bank transfers.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
