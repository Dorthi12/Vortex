'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  Settings, 
  CheckSquare, 
  Square, 
  RefreshCw,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface ReportSection {
  id: string;
  name: string;
  category: string;
  summary: string;
  metrics: { label: string; value: string }[];
}

const SECTIONS_POOL: Record<string, ReportSection[]> = {
  National: [
    {
      id: 'sec-nat-1',
      name: 'Macroeconomic Fiscal Outlay',
      category: 'Economy',
      summary: 'National growth metrics remained resilient. Subsidies allocations for smart utilities grid expansion are running at 94.2% budget utilization.',
      metrics: [
        { label: 'GDP Growth Rate', value: '+6.8% YoY' },
        { label: 'Total Allocation', value: '₹42,800 Cr' }
      ]
    },
    {
      id: 'sec-nat-2',
      name: 'National Pandemic Response & Coverage',
      category: 'Health',
      summary: 'Vaccinations metrics in Tier 2 and Tier 3 cities are highly favorable. Outbreak tracking indices represent zero critical sectors.',
      metrics: [
        { label: 'Immunization Coverage', value: '98.4%' },
        { label: 'Active Wards Clean', value: '99.2%' }
      ]
    },
    {
      id: 'sec-nat-3',
      name: 'Inter-State Transport Logistics Corridor',
      category: 'Infrastructure',
      summary: 'Heavy freight corridors have bypassed major population wards, reducing civilian road incidents by 22% during peak cycles.',
      metrics: [
        { label: 'Corridor Load Factor', value: '88%' },
        { label: 'Average Transit Delay', value: '-12 Min' }
      ]
    }
  ],
  State: [
    {
      id: 'sec-st-1',
      name: 'Hadapsar Grid Capacity Review',
      category: 'Infrastructure',
      summary: 'The Maharashtra grid loop has incorporated the 150MW high-voltage substation, mitigating voltage drops across industrial zones.',
      metrics: [
        { label: 'Grid Voltage Standard', value: '400 kV Stable' },
        { label: 'Substation Load Factor', value: '72%' }
      ]
    },
    {
      id: 'sec-st-2',
      name: 'Sugarcane Aquifer Drawdown Index',
      category: 'Agriculture',
      summary: 'Critical groundwater depletion has stabilized in Pune rural blocks after enforces crop rotation rules and micro-drip mandates.',
      metrics: [
        { label: 'Aquifer Replenish Rate', value: '+4.2%' },
        { label: 'Drip Retrofit Area', value: '18,500 Hectares' }
      ]
    },
    {
      id: 'sec-st-3',
      name: 'State School Zone Safety Bylaws',
      category: 'Education',
      summary: 'Zero-emission solar microgrids were activated in 12 state schools, providing clean net-metered power backing.',
      metrics: [
        { label: 'Solar Rooftop Power', value: '540 kW' },
        { label: 'Pedestrian Incidents', value: '0' }
      ]
    }
  ],
  District: [
    {
      id: 'sec-dst-1',
      name: 'Hadapsar Sub-division Road Corridors',
      category: 'Infrastructure',
      summary: 'Road resurfacing checks confirm structural compliance. Weight limit monitors have been set up near residential schools.',
      metrics: [
        { label: 'Road Quality Score', value: '92/100' },
        { label: 'Bridge Strain Index', value: 'Within Safety Margin' }
      ]
    },
    {
      id: 'sec-dst-2',
      name: 'Pune Ward 14 & 15 Health Centers',
      category: 'Health',
      summary: 'Primary clinical diagnostic units confirm 14% drop in pediatric asthma outpatient spikes following diesel bans.',
      metrics: [
        { label: 'Asthma Admissions', value: '-14%' },
        { label: 'Medicines Availability', value: '100%' }
      ]
    }
  ]
};

const TEMPLATES = [
  { id: 'tmp-1', name: 'Monthly Governance Operations Audit', desc: 'Standard operational summary across key sectors' },
  { id: 'tmp-2', name: 'Quarterly Critical Infrastructure Briefing', desc: 'Focuses on grid, water, and transport logistics safety' },
  { id: 'tmp-3', name: 'Emergency Disaster Readiness Report', desc: 'Risk and response models summary' }
];

export default function ReportsPage() {
  const { setActiveTab } = useUiStore();
  const [selectedScope, setSelectedScope] = useState<'National' | 'State' | 'District'>('State');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmp-1');
  const [checkedSectionIds, setCheckedSectionIds] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPpt, setIsExportingPpt] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pptProgress, setPptProgress] = useState<number>(0);

  useEffect(() => {
    setActiveTab('Reports');
  }, [setActiveTab]);

  // Set default sections when scope changes
  useEffect(() => {
    const defaultIds = SECTIONS_POOL[selectedScope].map(s => s.id);
    setCheckedSectionIds(defaultIds);
  }, [selectedScope]);

  const handleToggleSection = (id: string) => {
    setCheckedSectionIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportPdf = () => {
    if (isExportingPdf || isExportingPpt) return;
    setIsExportingPdf(true);
    setPdfProgress(0);
    const interval = setInterval(() => {
      setPdfProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExportingPdf(false), 500);
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  const handleExportPpt = () => {
    if (isExportingPdf || isExportingPpt) return;
    setIsExportingPpt(true);
    setPptProgress(0);
    const interval = setInterval(() => {
      setPptProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExportingPpt(false), 500);
          return 100;
        }
        return p + 8;
      });
    }, 150);
  };

  const activeSections = SECTIONS_POOL[selectedScope].filter(s => checkedSectionIds.includes(s.id));
  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-blue-900 dark:text-brand-yellow font-bold">
            Executive Operations Reporting Suite
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Executive Reporting Module
        </h1>
        <p className="text-slate-850 dark:text-slate-400 text-sm mt-0.5 font-medium">
          Compile operational reports, customize target scopes, and simulate PDF/PPT print exports.
        </p>
      </div>

      {/* 2. Main Workspace Split (Report Builder left, Preview right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Report Builder Console (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Builder Controls Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <span>Report Scope & Target</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-4">
              
              {/* Target Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Target Scope Jurisdiction
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  {['National', 'State', 'District'].map((scope) => (
                    <button
                      key={scope}
                      onClick={() => setSelectedScope(scope as any)}
                      className={cn(
                        "py-2 text-xs font-bold rounded-lg cursor-pointer transition-all",
                        selectedScope === scope
                          ? "bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-850"
                      )}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Pre-configured Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-900 dark:text-slate-400 italic">
                  {activeTemplate.desc}
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Sections Checklist Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <span>Report Section Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-3">
              {SECTIONS_POOL[selectedScope].map((section) => {
                const isChecked = checkedSectionIds.includes(section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => handleToggleSection(section.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                      isChecked 
                        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800" 
                        : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="mt-0.5 shrink-0 text-blue-900 dark:text-emerald-500">
                      {isChecked ? (
                        <CheckSquare className="w-4.5 h-4.5" />
                      ) : (
                        <Square className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-350 rounded border border-border">
                          {section.category}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-950 dark:text-slate-200">{section.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-900 dark:text-slate-450 mt-1 font-medium">{section.summary}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Simulated Export Action Cards */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white">Export & Release Actions</h3>
            
            <div className="space-y-3.5">
              {/* PDF Export button */}
              <div className="space-y-1.5">
                <Button 
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || isExportingPpt || activeSections.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Official PDF Report'}</span>
                </Button>
                {isExportingPdf && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-blue-600 dark:bg-emerald-500 transition-all" style={{ width: `${pdfProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-right font-mono font-bold text-slate-900 dark:text-slate-450">{pdfProgress}% Compiled</p>
                  </div>
                )}
              </div>

              {/* PPT Export button */}
              <div className="space-y-1.5">
                <Button 
                  onClick={handleExportPpt}
                  disabled={isExportingPdf || isExportingPpt || activeSections.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs border border-border transition-all dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white cursor-pointer"
                >
                  {isExportingPpt ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4 text-blue-900 dark:text-emerald-500" />
                  )}
                  <span>{isExportingPpt ? 'Generating Slides...' : 'Generate PPT Presentation Deck'}</span>
                </Button>
                {isExportingPpt && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-slate-950 dark:bg-white transition-all" style={{ width: `${pptProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-right font-mono font-bold text-slate-900 dark:text-slate-450">{pptProgress}% Compiled</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column: Report Live Preview Canvas (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-border bg-card shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Preview Control header */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4.5 h-4.5 text-blue-900 dark:text-emerald-500" />
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
                  Report Preview Pane
                </h3>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-400 px-2 py-0.5 rounded border border-border select-none">
                PREVIEW MODE
              </span>
            </div>

            {/* Simulated Printed Paper Layout */}
            <div className="flex-1 p-8 bg-white dark:bg-slate-950/40 overflow-y-auto max-h-[620px] space-y-6 relative border-t-4 border-blue-950 dark:border-emerald-600 shadow-inner">
              
              {/* Official Seal and Header block */}
              <div className="flex justify-between items-start border-b border-slate-300 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-500 font-mono">
                    GOVERNMENT OF INDIA • OPERATIONS COMMAND
                  </span>
                  <h2 className="text-sm font-extrabold text-blue-950 dark:text-slate-100 font-serif">
                    NETRAVAAH EXECUTIVE SUMMARY REPORT
                  </h2>
                  <p className="text-[10px] text-slate-900 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 text-blue-900 dark:text-emerald-500" />
                    <span>Jurisdiction Scope: <strong>{selectedScope} Division</strong></span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[9px] font-mono font-bold text-slate-900 dark:text-slate-400 flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>CYCLE: JUN 2026</span>
                  </p>
                  <p className="text-[8px] font-bold text-slate-800 dark:text-slate-500">Ref: NET-REP-{selectedScope.toUpperCase()}-06</p>
                </div>
              </div>

              {/* Template title & desc inside document */}
              <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <h3 className="text-xs font-black uppercase text-blue-950 dark:text-slate-250">{activeTemplate.name}</h3>
                <p className="text-xs text-slate-900 dark:text-slate-400 font-medium mt-1">
                  This dossier consolidates active multi-agent consensus models, risk forecasts, and telemetry checks matching the scope parameters of the {selectedScope} division.
                </p>
              </div>

              {/* Checked/Active Sections Output */}
              <div className="space-y-6">
                {activeSections.map((section, idx) => (
                  <div key={section.id} className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-850 pb-1.5">
                      <span className="text-xs font-black font-serif text-blue-950 dark:text-slate-200">
                        {idx + 1}. {section.name}
                      </span>
                      <span className="text-[8px] font-bold font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-slate-400 rounded-sm border border-border">
                        {section.category.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-950 dark:text-slate-350 leading-relaxed font-sans text-justify font-medium">
                      {section.summary}
                    </p>

                    {/* Section metrics row */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {section.metrics.map((met, mIdx) => (
                        <div key={mIdx} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">{met.label}</span>
                          <span className="text-xs font-black font-mono text-blue-950 dark:text-emerald-400">{met.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {activeSections.length === 0 && (
                  <div className="text-center py-16 text-slate-800 dark:text-slate-500 font-medium font-sans">
                    No report sections have been checked. Please use the Builder Console to include audit divisions.
                  </div>
                )}
              </div>

              {/* Signature stamp area */}
              {activeSections.length > 0 && (
                <div className="border-t border-slate-300 dark:border-slate-850 pt-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-6 w-36 bg-slate-50 dark:bg-transparent border border-dashed border-slate-300 dark:border-slate-800 rounded flex items-center justify-center">
                      <span className="text-[9px] font-bold font-mono text-slate-900 dark:text-slate-500 select-none uppercase">STAMP OF AUTHENTICITY</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-900 dark:text-slate-500">DIGITAL CERTIFICATE IDENTIFIER</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-serif italic text-xs font-bold text-blue-900 dark:text-emerald-500 select-none">Netravaah Autograph AI</div>
                    <div className="h-0.5 w-28 bg-slate-200 dark:bg-slate-800 mt-1 ml-auto" />
                    <p className="text-[8px] font-bold text-slate-900 dark:text-slate-500 uppercase tracking-widest mt-1">Authorized Compiler</p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions footer inside Preview Card */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900 border-t border-border flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-900 dark:text-slate-500 font-mono">
                COMPILE STATUS: READY FOR DISPATCH
              </span>
              <button 
                onClick={() => window.print()}
                disabled={activeSections.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-950 hover:text-blue-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                <span>Print Local Copy</span>
              </button>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
