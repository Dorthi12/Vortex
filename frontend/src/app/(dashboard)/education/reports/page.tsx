'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  MapPin, 
  Calendar,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EducationHeader } from '@/components/education/EducationHeader';
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
      id: 'sec-edu-nat-1',
      name: 'Pupil Enrollment Outlay',
      category: 'Enrollment',
      summary: 'National primary school enrollment ratios remained stable at 98.4%, while higher education enrollment experienced a 3.4% YoY increase.',
      metrics: [
        { label: 'Total Pupils Enrolled', value: '3.4 Lakhs' },
        { label: 'YoY Growth Rate', value: '+3.4%' }
      ]
    },
    {
      id: 'sec-edu-nat-2',
      name: 'Scholarship Disbursal Summary',
      category: 'Scholarships',
      summary: 'Federal need-based and girls education scholarships reached ₹14.2 Crore disbursed across 32,410 verified student recipients.',
      metrics: [
        { label: 'Total Disbursed', value: '₹14.2 Cr' },
        { label: 'Scholarships Granted', value: '32,410' }
      ]
    }
  ],
  State: [
    {
      id: 'sec-edu-st-1',
      name: 'Hadapsar Staffing Audit',
      category: 'Staffing',
      summary: 'Critical teacher shortages identified in Hadapsar division. Recommended pupil-teacher reallocations have been compiled by the AI model.',
      metrics: [
        { label: 'Hadapsar Vacancies', value: '20 Teachers' },
        { label: 'Student-Teacher Ratio', value: '38:1' }
      ]
    },
    {
      id: 'sec-edu-st-2',
      name: 'School Infrastructure Compliance',
      category: 'Infrastructure',
      summary: 'Infrastructure monitoring score averages at 82% state-wide. Main upgrades priority flags placed on restroom and smart classroom modules.',
      metrics: [
        { label: 'Averaged Infra Score', value: '82/100' },
        { label: 'High Priority Upgrades', value: '12 Wards' }
      ]
    }
  ],
  District: [
    {
      id: 'sec-edu-dst-1',
      name: 'District Academic Rankings',
      category: 'Academic',
      summary: 'Shivajinagar wards lead the sub-division rankings with 94.2% pass rates, while Hadapsar outer wards require targeted tutoring recovery.',
      metrics: [
        { label: 'Shivajinagar Pass Rate', value: '94.2%' },
        { label: 'Hadapsar Outer Pass Rate', value: '72.4%' }
      ]
    }
  ]
};

export default function ReportsPage() {
  const { setActiveTab } = useUiStore();
  const [selectedScope, setSelectedScope] = useState<'National' | 'State' | 'District'>('State');
  const [checkedSectionIds, setCheckedSectionIds] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [excelProgress, setExcelProgress] = useState<number>(0);

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

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
    if (isExportingPdf || isExportingExcel) return;
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

  const handleExportExcel = () => {
    if (isExportingPdf || isExportingExcel) return;
    setIsExportingExcel(true);
    setExcelProgress(0);
    const interval = setInterval(() => {
      setExcelProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExportingExcel(false), 500);
          return 100;
        }
        return p + 8;
      });
    }, 150);
  };

  const activeSections = SECTIONS_POOL[selectedScope].filter(s => checkedSectionIds.includes(s.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Education Report Generator" 
        subtitle="Compile, preview, and generate official education reports for local, state, and national audits."
      />

      {/* 2. Main Workspace Split (Report Builder left, Preview right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Report Builder Console (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Builder Controls Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-edu-purple" />
                <span>Scope & Target Profile</span>
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
                          ? "bg-white dark:bg-slate-850 text-edu-purple dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                          : "text-slate-900 hover:text-edu-purple dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-850"
                      )}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Sections Checklist Card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-edu-purple" />
                <span>Report Sections Checklist</span>
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
                        ? "bg-slate-50 dark:bg-slate-900/40 border-slate-300 dark:border-slate-850" 
                        : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className="mt-0.5 shrink-0 text-edu-purple">
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

          {/* Export Actions Card */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white">Export & Download Options</h3>
            
            <div className="space-y-3.5">
              {/* PDF button */}
              <div className="space-y-1">
                <Button 
                  onClick={handleExportPdf}
                  disabled={isExportingPdf || isExportingExcel || activeSections.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-purple-650 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all dark:bg-purple-600 dark:hover:bg-purple-700 cursor-pointer disabled:opacity-40"
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
                      <div className="h-full bg-purple-600 transition-all" style={{ width: `${pdfProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-right font-mono font-bold text-slate-900 dark:text-slate-450">{pdfProgress}% Compiled</p>
                  </div>
                )}
              </div>

              {/* Excel button */}
              <div className="space-y-1">
                <Button 
                  onClick={handleExportExcel}
                  disabled={isExportingPdf || isExportingExcel || activeSections.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs border border-border transition-all dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white cursor-pointer disabled:opacity-40"
                >
                  {isExportingExcel ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Layers className="w-4 h-4 text-edu-purple" />
                  )}
                  <span>{isExportingExcel ? 'Exporting Excel...' : 'Generate Excel spreadsheet'}</span>
                </Button>
                {isExportingExcel && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-slate-950 dark:bg-white transition-all" style={{ width: `${excelProgress}%` }} />
                    </div>
                    <p className="text-[9px] text-right font-mono font-bold text-slate-900 dark:text-slate-450">{excelProgress}% Compiled</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column: Report Live Preview Canvas (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-border bg-card shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Preview header */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4.5 h-4.5 text-edu-purple" />
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
                  Report Preview Canvas
                </h3>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-450 px-2 py-0.5 rounded border border-border select-none">
                PREVIEW MODE
              </span>
            </div>

            {/* Simulated Printed Page Layout */}
            <div className="flex-1 p-8 bg-white dark:bg-slate-950/40 overflow-y-auto max-h-[620px] space-y-6 relative border-t-4 border-edu-purple shadow-inner">
              
              {/* Official Seal and Header block */}
              <div className="flex justify-between items-start border-b border-slate-300 dark:border-slate-800 pb-5">
                <div className="space-y-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-500 font-mono">
                    GOVERNMENT OF INDIA • EDUCATION COMMAND
                  </span>
                  <h2 className="text-sm font-extrabold text-slate-950 dark:text-slate-100 font-serif">
                    EDUCATION INTELLIGENCE DOSSIER REPORT
                  </h2>
                  <p className="text-[10px] text-slate-900 dark:text-slate-450 font-semibold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 text-edu-purple" />
                    <span>Jurisdiction: <strong>{selectedScope} Division</strong></span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[9px] font-mono font-bold text-slate-900 dark:text-slate-400 flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>CYCLE: JUN 2026</span>
                  </p>
                  <p className="text-[8px] font-bold text-slate-800 dark:text-slate-500">Ref: NET-EDU-{selectedScope.toUpperCase()}-06</p>
                </div>
              </div>

              {/* Checked/Active Sections Output */}
              <div className="space-y-6">
                {activeSections.map((section, idx) => (
                  <div key={section.id} className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-850 pb-1.5">
                      <span className="text-xs font-black font-serif text-slate-950 dark:text-slate-200">
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
                          <span className="text-xs font-black font-mono text-slate-950 dark:text-white">{met.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {activeSections.length === 0 && (
                  <div className="text-center py-16 text-slate-800 dark:text-slate-505 font-medium font-sans">
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
                    <div className="font-serif italic text-xs font-bold text-edu-purple select-none">Netravaah Autograph AI</div>
                    <div className="h-0.5 w-28 bg-slate-200 dark:bg-slate-800 mt-1 ml-auto" />
                    <p className="text-[8px] font-bold text-slate-900 dark:text-slate-500 uppercase tracking-widest mt-1">Authorized Compiler</p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions footer */}
            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-900 border-t border-border flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-900 dark:text-slate-500 font-mono">
                COMPILE STATUS: READY FOR DISPATCH
              </span>
              <button 
                onClick={() => window.print()}
                disabled={activeSections.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer disabled:opacity-40"
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
