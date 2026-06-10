'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, XCircle, HelpCircle, ShieldCheck, ClipboardList, Info, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Select, FormGroup } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { CallProfessionalModal } from '@/components/agriculture/CallProfessionalModal';
import { CallProfessionalBanner } from '@/components/agriculture/CallProfessionalBanner';

interface Scheme {
  id: string;
  name: string;
  ministry: string;
  baseRate: number; // %
  desc: string;
  criteriaText: string;
}

const MOCK_SCHEMES: Scheme[] = [
  {
    id: 'sub-1',
    name: 'PM Krishi Sinchayee Yojana (Drip Irrigation)',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    baseRate: 60,
    desc: 'Financial assistance for installing micro-irrigation systems to improve water use efficiency.',
    criteriaText: 'Must possess cultivating land with access to water source. Preference to women and SC/ST.'
  },
  {
    id: 'sub-2',
    name: 'PM KUSUM (Solar Pump Subvention)',
    ministry: 'Ministry of New & Renewable Energy',
    baseRate: 75,
    desc: 'Subsidies up to 75% for installing standalone solar agricultural pumps to replace diesel pumps.',
    criteriaText: 'Applicable for wells, borewells, or open groundwater basins. Safe drinking water zone.'
  },
  {
    id: 'sub-3',
    name: 'SMAM (Farm Machinery Custom Hiring)',
    ministry: 'Ministry of Agriculture',
    baseRate: 50,
    desc: 'Grants for establishing Custom Hiring Centers to rent out modern tractors, tillers, and harvesters.',
    criteriaText: 'Targeted at groups of farmers, cooperatives, or individual marginal landholders.'
  },
  {
    id: 'sub-4',
    name: 'Paramparagat Krishi Vikas (Organic Farming)',
    ministry: 'Ministry of Agriculture',
    baseRate: 80,
    desc: 'Financial support for soil testing, organic certification, and organic compost fertilizer credits.',
    criteriaText: 'Requires cluster-based organic crop selection and certified residue-free soil testing.'
  }
];

export default function SubsidyAdvisor() {
  const { setActiveTab } = useUiStore();
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);

  // Highlight Agriculture in sidebar
  useEffect(() => {
    setActiveTab('Agriculture');
  }, [setActiveTab]);

  // Input states
  const [landholding, setLandholding] = useState<string>('Small');
  const [irrigation, setIrrigation] = useState<string>('Rainfed');
  const [category, setCategory] = useState<string>('General');

  // Evaluated eligibility output states
  const [eligibleSchemes, setEligibleSchemes] = useState<{ id: string; calculatedRate: number; details: string }[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalComplete, setEvalComplete] = useState<boolean>(false);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setEvalComplete(false);

    setTimeout(() => {
      const results = MOCK_SCHEMES.map((scheme) => {
        let calculatedRate = scheme.baseRate;
        let isEligible = true;
        let details = '';

        // SC/ST / Women farmers get +10% subsidy bonus up to 90%
        if (category === 'SC/ST' || category === 'Women') {
          calculatedRate = Math.min(90, calculatedRate + 10);
        }

        // Scheme specific logic
        if (scheme.id === 'sub-1') {
          // Drip irrigation requires land access and is optimized for drip/well
          if (irrigation === 'Rainfed') {
            details = 'Conditional approval: Rainfed systems require installing a farm pond buffer first.';
          } else {
            details = 'Highly recommended: Matches irrigation profile with direct bank transfer credits.';
          }
        } else if (scheme.id === 'sub-2') {
          // Solar pumps require groundwater sources
          if (irrigation === 'Canal') {
            isEligible = false;
            details = 'Ineligible: Solar pumps are restricted to borewell/groundwater pump sites.';
          } else {
            details = 'Approved: Qualifies for off-grid standalone solar pump allocation.';
          }
        } else if (scheme.id === 'sub-3') {
          // Custom Hiring is for Marginal and Small farmers
          if (landholding === 'Large') {
            calculatedRate = Math.max(30, calculatedRate - 15);
            details = 'Approved with lower credit cap: Large landholders receive lower hiring center credits.';
          } else {
            details = 'Priority allocation: Small/marginal landholders receive peak rental assistance.';
          }
        } else if (scheme.id === 'sub-4') {
          // Organic credit
          details = 'Approved: Organic compost credits can be claimed at local Pune cooperative bank hubs.';
        }

        return {
          id: scheme.id,
          calculatedRate,
          isEligible,
          details
        };
      }).filter(r => r.isEligible);

      setEligibleSchemes(results);
      setIsEvaluating(false);
      setEvalComplete(true);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back to Overview */}
      <div>
        <Link 
          href="/agriculture" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sea-green dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Agriculture Overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-sea-green dark:text-sea-green-light font-black">
          Welfare Policy Advisor
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Subsidy Advisor
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Locate open welfare schemes, verify landholding compliance, and simulate financial subsidy eligibility thresholds.
        </p>
      </div>

      {/* Call Professional Banner */}
      <CallProfessionalBanner
        variant="subsidy"
        title="Need Help with Subsidy Applications?"
        description="A Welfare Scheme Facilitator will help you verify land registry documents, complete application forms, and fast-track subsidy disbursement from government schemes."
        buttonLabel="Call Subsidy Advisor"
        onCallClick={() => setIsProfModalOpen(true)}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Farmer Credentials & Need Scheme Help */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Farmer Credentials */}
          <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-sea-green">
            <CardHeader className="pb-4 border-b border-border-subtle">
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">
                Farmer Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Input farm parameters to evaluate welfare credit thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleEvaluate} className="space-y-4">
                
                {/* Landholding category */}
                <FormGroup label="Landholding Classification">
                  <Select value={landholding} onChange={(e) => setLandholding(e.target.value)} className="h-10 text-xs">
                    <option value="Marginal">Marginal (under 1 Hectare)</option>
                    <option value="Small">Small (1 to 2 Hectares)</option>
                    <option value="Medium">Medium (2 to 10 Hectares)</option>
                    <option value="Large">Large (above 10 Hectares)</option>
                  </Select>
                </FormGroup>

                {/* Water irrigation profile */}
                <FormGroup label="Primary Water Source">
                  <Select value={irrigation} onChange={(e) => setIrrigation(e.target.value)} className="h-10 text-xs">
                    <option value="Rainfed">Rainfed (Dryland farming)</option>
                    <option value="Canal">Canal System Network</option>
                    <option value="Well">Open Well / Borewell pump</option>
                    <option value="Drip">Micro Drip / Sprinkler</option>
                  </Select>
                </FormGroup>

                {/* Farmer Category */}
                <FormGroup label="Farmer Category Group">
                  <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 text-xs">
                    <option value="General">General / Other</option>
                    <option value="SC/ST">Scheduled Caste / Tribe (SC/ST)</option>
                    <option value="Women">Women Farm Operator</option>
                  </Select>
                </FormGroup>

                {/* Evaluate button */}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isEvaluating}
                  className="w-full text-xs font-semibold h-10 mt-4 cursor-pointer"
                >
                  Evaluate Subsidies Eligibility
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* Need Scheme Help? - Purple with a hint of blue */}
          <Card className="relative overflow-hidden border-0 shadow-lg p-5 space-y-3"
            style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 78%, #a855f7 100%)' }}>
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            />
            <div className="relative z-10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-100">Need Scheme Help?</h4>
              <p className="text-[11px] text-purple-200/90 leading-normal font-medium">
                Need help matching scheme guidelines or filing land registry applications? Schedule a session with a Welfare Scheme advisor.
              </p>
              <Button 
                onClick={() => setIsProfModalOpen(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/25 flex items-center justify-center gap-1.5 text-xs py-2 h-9 cursor-pointer backdrop-blur-xs font-bold transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                Call Subsidy Advisor
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Schemes list & eligibility results */}
        <div className="lg:col-span-2 space-y-6">
          
          {evalComplete ? (
            // Results Panel
            <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-dark-green">
              <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-550">
                  Qualified Welfare Subsidies
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-transparent">
                <div className="divide-y divide-slate-150 dark:divide-slate-800">
                  {eligibleSchemes.length > 0 ? (
                    eligibleSchemes.map((res, idx) => {
                      const scheme = MOCK_SCHEMES.find(s => s.id === res.id);
                      if (!scheme) return null;

                      // Map schemes to yellow and purple blend style objects
                      const schemeIdx = MOCK_SCHEMES.findIndex(s => s.id === res.id);
                      const BLENDS = [
                        {
                          gradient: 'linear-gradient(135deg, rgba(254, 240, 138, 0.22) 0%, rgba(245, 243, 255, 0.25) 45%, rgba(216, 180, 254, 0.3) 100%)',
                          border: 'border-purple-200/50 dark:border-purple-800/30',
                          ministryText: 'text-purple-700 dark:text-purple-400',
                          titleText: 'text-purple-950 dark:text-purple-100',
                          badge: 'bg-amber-500/15 border-amber-250/30 text-amber-800 dark:text-amber-300'
                        },
                        {
                          gradient: 'linear-gradient(135deg, rgba(233, 213, 255, 0.25) 0%, rgba(255, 251, 235, 0.2) 50%, rgba(253, 224, 71, 0.2) 100%)',
                          border: 'border-amber-200/40 dark:border-amber-900/20',
                          ministryText: 'text-amber-800 dark:text-amber-400',
                          titleText: 'text-slate-900 dark:text-slate-100',
                          badge: 'bg-purple-500/15 border-purple-200/30 text-purple-800 dark:text-purple-300'
                        },
                        {
                          gradient: 'linear-gradient(135deg, rgba(253, 230, 138, 0.25) 0%, rgba(243, 232, 255, 0.2) 60%, rgba(192, 132, 252, 0.2) 100%)',
                          border: 'border-purple-200/50 dark:border-purple-800/30',
                          ministryText: 'text-purple-700 dark:text-purple-400',
                          titleText: 'text-purple-950 dark:text-purple-100',
                          badge: 'bg-amber-500/15 border-amber-250/30 text-amber-800 dark:text-amber-300'
                        },
                        {
                          gradient: 'linear-gradient(135deg, rgba(216, 180, 254, 0.25) 0%, rgba(254, 240, 138, 0.15) 60%, rgba(252, 211, 77, 0.2) 100%)',
                          border: 'border-amber-200/40 dark:border-amber-900/20',
                          ministryText: 'text-amber-800 dark:text-amber-400',
                          titleText: 'text-slate-900 dark:text-slate-100',
                          badge: 'bg-purple-500/15 border-purple-200/30 text-purple-800 dark:text-purple-300'
                        }
                      ];
                      const blend = BLENDS[schemeIdx !== -1 ? schemeIdx % BLENDS.length : idx % BLENDS.length];

                      return (
                        <div key={res.id} className="p-5 space-y-3 transition-colors animate-in fade-in duration-300 first:rounded-t-none last:rounded-b-lg border-b border-slate-150 dark:border-slate-800 last:border-b-0"
                          style={{ background: blend.gradient }}>
                          
                          {/* Title and rate */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <span className={cn("block text-[8px] uppercase font-bold", blend.ministryText)}>{scheme.ministry}</span>
                              <h4 className={cn("text-sm font-black leading-snug", blend.titleText)}>{scheme.name}</h4>
                            </div>
                            <div className={cn("shrink-0 text-center px-2.5 py-1 rounded-md min-w-[75px] border backdrop-blur-xs font-semibold", blend.badge)}>
                              <span className="block text-[8px] uppercase opacity-70">Credit Rate</span>
                              <strong className="text-base font-black">{res.calculatedRate}%</strong>
                            </div>
                          </div>

                          {/* Advice Note */}
                          <div className="flex gap-2 items-start bg-white/45 dark:bg-black/20 p-3 rounded-lg text-xs text-slate-800 dark:text-slate-200 border border-purple-200/20 dark:border-purple-800/10">
                            <Info className="w-4 h-4 text-purple-650 dark:text-purple-300 shrink-0 mt-0.5" />
                            <p className="font-medium">{res.details}</p>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-900/10">
                      No matching subsidies found for your crop and water credentials.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Default Catalog list
            <div className="space-y-4">
              {MOCK_SCHEMES.map((scheme, idx) => {
                // Different custom gradients blending yellow and purple
                const BLENDS = [
                  {
                    gradient: 'linear-gradient(135deg, rgba(254, 240, 138, 0.22) 0%, rgba(245, 243, 255, 0.25) 45%, rgba(216, 180, 254, 0.3) 100%)',
                    border: 'border-purple-200/50 dark:border-purple-800/30',
                    ministryText: 'text-purple-700 dark:text-purple-400',
                    titleText: 'text-purple-950 dark:text-purple-100',
                    badge: 'bg-amber-500/15 border-amber-250/30 text-amber-800 dark:text-amber-300',
                    criteriaBorder: 'border-purple-100 dark:border-purple-900/40'
                  },
                  {
                    gradient: 'linear-gradient(135deg, rgba(233, 213, 255, 0.25) 0%, rgba(255, 251, 235, 0.2) 50%, rgba(253, 224, 71, 0.2) 100%)',
                    border: 'border-amber-200/40 dark:border-amber-900/20',
                    ministryText: 'text-amber-800 dark:text-amber-450',
                    titleText: 'text-slate-900 dark:text-slate-100',
                    badge: 'bg-purple-500/15 border-purple-200/30 text-purple-800 dark:text-purple-300',
                    criteriaBorder: 'border-amber-100 dark:border-amber-900/40'
                  },
                  {
                    gradient: 'linear-gradient(135deg, rgba(253, 230, 138, 0.25) 0%, rgba(243, 232, 255, 0.2) 60%, rgba(192, 132, 252, 0.2) 100%)',
                    border: 'border-purple-200/50 dark:border-purple-800/30',
                    ministryText: 'text-purple-700 dark:text-purple-400',
                    titleText: 'text-purple-950 dark:text-purple-100',
                    badge: 'bg-amber-500/15 border-amber-250/30 text-amber-800 dark:text-amber-300',
                    criteriaBorder: 'border-purple-100 dark:border-purple-900/40'
                  },
                  {
                    gradient: 'linear-gradient(135deg, rgba(216, 180, 254, 0.25) 0%, rgba(254, 240, 138, 0.15) 60%, rgba(252, 211, 77, 0.2) 100%)',
                    border: 'border-amber-200/40 dark:border-amber-900/20',
                    ministryText: 'text-amber-800 dark:text-amber-450',
                    titleText: 'text-slate-900 dark:text-slate-100',
                    badge: 'bg-purple-500/15 border-purple-200/30 text-purple-800 dark:text-purple-300',
                    criteriaBorder: 'border-amber-100 dark:border-amber-900/40'
                  }
                ];
                const blend = BLENDS[idx % BLENDS.length];

                return (
                  <Card key={scheme.id} className={cn("p-5 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[140px] border", blend.border)}
                    style={{ background: blend.gradient }}>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className={cn("text-[9px] uppercase font-bold tracking-wider block", blend.ministryText)}>
                            {scheme.ministry}
                          </span>
                          <h4 className={cn("text-sm font-black leading-snug", blend.titleText)}>
                            {scheme.name}
                          </h4>
                        </div>
                        <span className={cn("shrink-0 text-xs font-black border px-2.5 py-0.5 rounded-full backdrop-blur-xs shadow-xs", blend.badge)}>
                          Up to {scheme.baseRate}% Credit
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {scheme.desc}
                      </p>
                    </div>

                    <div className={cn("text-[9px] text-slate-500 dark:text-slate-400 border-t pt-3 mt-3 font-semibold", blend.criteriaBorder)}>
                      Criteria: {scheme.criteriaText}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </div>

      </div>

      <CallProfessionalModal 
        isOpen={isProfModalOpen} 
        onClose={() => setIsProfModalOpen(false)} 
        defaultService="subsidy_help" 
      />

    </div>
  );
}
