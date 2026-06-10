'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Wrench,
  Activity,
  Info,
  Droplet,
  Tv,
  BookOpen,
  Wifi,
  Zap,
  Flame
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface InfraData {
  id: string;
  schoolName: string;
  district: string;
  totalScore: number;
  classrooms: number; // 0-100 score
  electricity: 'Stable' | 'Intermittent' | 'No Grid';
  internet: 'Broadband' | 'Cellular' | 'No Connectivity';
  smartClass: number; // count
  toilets: 'Functional' | 'Requires Repair' | 'Insufficient';
  drinkingWater: 'Potable' | 'Contaminated' | 'No Supply';
  labs: number; // score
  library: boolean;
  sports: boolean;
  upgradeRequired: string;
  priority: 'High' | 'Medium' | 'Low';
}

const MOCK_INFRA: InfraData[] = [
  {
    id: 'inf-sch-1',
    schoolName: 'Hadapsar Government High School',
    district: 'Hadapsar Sector 4-B',
    totalScore: 72,
    classrooms: 78,
    electricity: 'Stable',
    internet: 'Cellular',
    smartClass: 2,
    toilets: 'Requires Repair',
    drinkingWater: 'Potable',
    labs: 68,
    library: true,
    sports: true,
    upgradeRequired: 'Repair restrooms block & install high-speed broadband connections.',
    priority: 'High'
  },
  {
    id: 'inf-sch-2',
    schoolName: 'Shivajinagar Adarsh Vidyalaya',
    district: 'Shivajinagar Wards',
    totalScore: 92,
    classrooms: 94,
    electricity: 'Stable',
    internet: 'Broadband',
    smartClass: 8,
    toilets: 'Functional',
    drinkingWater: 'Potable',
    labs: 90,
    library: true,
    sports: true,
    upgradeRequired: 'Routine solar panels cleaning audit.',
    priority: 'Low'
  },
  {
    id: 'inf-sch-3',
    schoolName: 'Pune Cantonment Board School No. 3',
    district: 'Pune Cantonment',
    totalScore: 81,
    classrooms: 82,
    electricity: 'Stable',
    internet: 'Broadband',
    smartClass: 4,
    toilets: 'Functional',
    drinkingWater: 'Potable',
    labs: 74,
    library: true,
    sports: false,
    upgradeRequired: 'Construct sports field fencing & add 2 smart-boards.',
    priority: 'Medium'
  },
  {
    id: 'inf-sch-4',
    schoolName: 'Kothrud Model School',
    district: 'Kothrud Sub-division',
    totalScore: 84,
    classrooms: 86,
    electricity: 'Stable',
    internet: 'Broadband',
    smartClass: 5,
    toilets: 'Functional',
    drinkingWater: 'Potable',
    labs: 80,
    library: true,
    sports: true,
    upgradeRequired: 'Procure additional science laboratory reagents.',
    priority: 'Low'
  }
];

export default function InfrastructurePage() {
  const { setActiveTab } = useUiStore();
  const [selectedSchId, setSelectedSchId] = useState<string>('inf-sch-1');

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  const activeInfra = useMemo(() => {
    return MOCK_INFRA.find(i => i.id === selectedSchId) || MOCK_INFRA[0];
  }, [selectedSchId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="School Infrastructure Monitoring" 
        subtitle="Monitor core utilities, internet connectivity, smart-board distributions, and restroom audits."
      />

      {/* 1. Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Schools directory (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-slate-900 dark:text-slate-400 font-bold">Auditable Facilities Directory</span>
            <span className="text-[9px] font-mono text-slate-900 dark:text-slate-500 font-bold uppercase">4 SCHOOLS LOGGED</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[520px]">
            {MOCK_INFRA.map((infra) => (
              <button
                key={infra.id}
                onClick={() => setSelectedSchId(infra.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 shadow-3xs",
                  selectedSchId === infra.id
                    ? "bg-purple-50/70 border-edu-purple dark:bg-slate-900 dark:border-edu-gold ring-2 ring-purple-650/10 dark:ring-edu-gold/10"
                    : "bg-card border-border"
                )}
              >
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[9px] font-bold font-mono bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-350 px-2 py-0.5 rounded border border-border">
                      {infra.district}
                    </span>
                    
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      infra.priority === 'High' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/20 dark:text-rose-450' :
                      infra.priority === 'Medium' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450' :
                      'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450'
                    )}>
                      {infra.priority} Priority
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white mt-2.5 leading-snug">
                    {infra.schoolName}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px] font-bold">
                  <div className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-royal-blue dark:text-edu-gold" />
                    <span className="text-slate-900 dark:text-slate-400">Classrooms: {infra.classrooms}%</span>
                  </div>
                  <div className="font-mono text-royal-blue dark:text-edu-gold font-bold">
                    Score: {infra.totalScore} / 100
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Infrastructure Details Auditor (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden">
            
            {/* Auditor Header */}
            <CardHeader className="p-5 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold font-mono bg-purple-100 dark:bg-purple-950/40 text-edu-purple px-2 py-0.5 rounded border border-border">
                  TELEMETRY REPORT
                </span>
                <span className="text-xs font-black font-mono text-royal-blue dark:text-edu-gold">
                  SCORE: {activeInfra.totalScore} / 100
                </span>
              </div>
              
              <CardTitle className="text-base font-extrabold text-slate-950 dark:text-white mt-3">
                {activeInfra.schoolName}
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                Detailed audit of facilities, connectivity, and smart classrooms.
              </CardDescription>
            </CardHeader>

            {/* Parameters Matrix Grid */}
            <CardContent className="p-5 space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Electricity */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Electricity Connection</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.electricity}</p>
                  </div>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>

                {/* Internet */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Internet Service</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.internet}</p>
                  </div>
                  <Wifi className="w-5 h-5 text-blue-500" />
                </div>

                {/* Toilets */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Restrooms / Toilets</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.toilets}</p>
                  </div>
                  {activeInfra.toilets === 'Functional' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  )}
                </div>

                {/* Drinking Water */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Drinking Water</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.drinkingWater}</p>
                  </div>
                  <Droplet className="w-5 h-5 text-sky-500" />
                </div>

                {/* Smart class count */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Smart Classrooms</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.smartClass} Setup Wards</p>
                  </div>
                  <Tv className="w-5 h-5 text-purple-500" />
                </div>

                {/* Laboratories score */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Laboratory Rating</p>
                    <p className="text-xs font-bold text-slate-950 dark:text-white">{activeInfra.labs} / 100</p>
                  </div>
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>

              </div>
            </CardContent>

            {/* Recommended action footer */}
            <div className="p-4.5 bg-slate-100 dark:bg-slate-900 border-t border-border space-y-2 rounded-b-2xl">
              <span className="text-[9px] font-black uppercase text-edu-purple dark:text-edu-gold tracking-widest flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-edu-purple" />
                <span>Recommended Upgrade Actions</span>
              </span>
              <p className="text-[11px] text-slate-950 dark:text-slate-350 font-bold leading-normal">
                {activeInfra.upgradeRequired}
              </p>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
}
