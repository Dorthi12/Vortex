'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Play, 
  RefreshCw, 
  Map, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Zap,
  Building,
  Activity,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface VacancyData {
  id: string;
  district: string;
  ratio: string;
  vacancyCount: number;
  subjectShortage: string;
  surplusCount: number;
}

const MOCK_VACANCIES: VacancyData[] = [
  { id: 'vac-1', district: 'Hadapsar Sector 4-B', ratio: '38:1', vacancyCount: 8, subjectShortage: 'Mathematics', surplusCount: 0 },
  { id: 'vac-2', district: 'Hadapsar Outer Wards', ratio: '42:1', vacancyCount: 12, subjectShortage: 'Science', surplusCount: 0 },
  { id: 'vac-3', district: 'Shivajinagar Wards', ratio: '19:1', vacancyCount: 0, subjectShortage: 'None', surplusCount: 5 },
  { id: 'vac-4', district: 'Pune Cantonment', ratio: '28:1', vacancyCount: 2, subjectShortage: 'English', surplusCount: 1 },
  { id: 'vac-5', district: 'Kothrud Sub-division', ratio: '22:1', vacancyCount: 1, subjectShortage: 'Social Studies', surplusCount: 2 }
];

export default function TeachersPage() {
  const { setActiveTab } = useUiStore();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [optimizerRun, setOptimizerRun] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  const handleRunOptimizer = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOptimizerRun(true);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Teacher Allocation Optimizer" 
        subtitle="Model and trigger teacher staffing allocations, matching subject shortages and student-teacher ratios."
      />

      {/* 1. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Staffing Shortages List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
                  Sub-division Staffing Status
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-900 dark:text-slate-450 font-medium">
                  Auditing pupil-teacher ratios and subject shortages.
                </CardDescription>
              </div>
              <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-950 px-2 py-0.5 rounded border border-rose-300 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-500/30 select-none">
                CRITICAL SHORTAGES IN Hadapsar
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-450 border-b border-border font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-5 py-3">District Sector</th>
                      <th className="px-5 py-3">Ratio</th>
                      <th className="px-5 py-3">Subject Shortage</th>
                      <th className="px-5 py-3 text-right">Vacancies / Surplus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-950 dark:text-slate-350">
                    {MOCK_VACANCIES.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all font-medium">
                        <td className="px-5 py-3.5 font-bold text-slate-950 dark:text-slate-200">{v.district}</td>
                        <td className="px-5 py-3.5 font-mono text-royal-blue dark:text-edu-gold font-bold">{v.ratio}</td>
                        <td className="px-5 py-3.5">
                          {v.subjectShortage !== 'None' ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-950 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded-full font-bold text-[9px]">
                              {v.subjectShortage}
                            </span>
                          ) : (
                            <span className="text-slate-900 dark:text-slate-500 font-bold">Optimal</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold">
                          {v.vacancyCount > 0 ? (
                            <span className="text-rose-600">-{v.vacancyCount} Vacancy</span>
                          ) : (
                            <span className="text-emerald-600">+{v.surplusCount} Surplus</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Optimizer & Vacancy Heatmap (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Allocation Optimizer control card */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4.5 h-4.5 text-edu-purple" />
                <span>AI Reallocation Model</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-4">
              
              <p className="text-[11px] text-slate-950 dark:text-slate-400 leading-relaxed font-sans font-medium text-justify">
                Run the heuristics model to match surplus teacher centers with high-ratio vacancy sub-divisions, outputting suggested transfers.
              </p>

              <button
                onClick={handleRunOptimizer}
                disabled={isRunning}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-xs cursor-pointer disabled:opacity-40"
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isRunning ? 'CALCULATING OPTIMAL TRANSFERS...' : 'RUN ALLOCATION OPTIMIZER'}</span>
              </button>

              {/* Optimizer Outputs */}
              {optimizerRun && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl space-y-2.5 animate-in slide-in-from-bottom-2 duration-200">
                  <h4 className="text-[10px] uppercase font-black text-edu-purple dark:text-edu-gold tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Reallocation Recommendations</span>
                  </h4>
                  <div className="text-[10px] text-slate-900 dark:text-slate-350 space-y-1.5 font-bold">
                    <div className="flex justify-between items-center bg-card p-2 border border-border rounded-lg">
                      <span>Shivajinagar ➜ Hadapsar Outer</span>
                      <span className="text-emerald-600 font-mono">+3 Math Teachers</span>
                    </div>
                    <div className="flex justify-between items-center bg-card p-2 border border-border rounded-lg">
                      <span>Kothrud ➜ Hadapsar Sector 4-B</span>
                      <span className="text-emerald-600 font-mono">+1 Science Teacher</span>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Vacancy Heatmap */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Map className="w-4.5 h-4.5 text-edu-purple" />
                <span>Vacancy Heatmap Grid (Pune)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex justify-center">
              <div className="w-full max-w-sm grid grid-cols-5 gap-2.5">
                {Array.from({ length: 15 }).map((_, idx) => {
                  const seed = (idx * 13) % 100;
                  // Critical shortage if seed is high
                  const cellColor = 
                    seed > 75 ? 'bg-rose-500/25 border-rose-500/50 dark:bg-rose-950/40 dark:border-rose-500/50 text-rose-600' :
                    seed > 40 ? 'bg-amber-500/20 border-amber-500/40 dark:bg-amber-950/30 dark:border-amber-500/50 text-amber-600' :
                    'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/40 text-emerald-600';

                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "aspect-square rounded-lg border flex flex-col items-center justify-center text-[8px] font-bold font-mono transition-all duration-300",
                        cellColor
                      )}
                      title={`Sector Grid ${idx + 1} Staffing Level`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
