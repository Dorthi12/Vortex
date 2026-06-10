'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  School, 
  Building, 
  GraduationCap, 
  Search, 
  ArrowRight,
  BookOpen,
  Sparkles,
  Info,
  ChevronRight,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface SchoolData {
  id: string;
  name: string;
  district: string;
  passRate: number;
  avgMarks: number;
  attendance: number;
  teachers: number;
  students: number;
  infraScore: number;
  weakSubjects: string[];
}

const MOCK_SCHOOLS: SchoolData[] = [
  {
    id: 'sch-1',
    name: 'Hadapsar Government High School',
    district: 'Hadapsar Sector 4-B',
    passRate: 81.2,
    avgMarks: 72.5,
    attendance: 89.4,
    teachers: 34,
    students: 780,
    infraScore: 78,
    weakSubjects: ['Mathematics', 'Science']
  },
  {
    id: 'sch-2',
    name: 'Shivajinagar Adarsh Vidyalaya',
    district: 'Shivajinagar Wards',
    passRate: 94.2,
    avgMarks: 86.8,
    attendance: 94.8,
    teachers: 42,
    students: 950,
    infraScore: 92,
    weakSubjects: ['English Literature']
  },
  {
    id: 'sch-3',
    name: 'Pune Cantonment Board School No. 3',
    district: 'Pune Cantonment',
    passRate: 88.1,
    avgMarks: 79.4,
    attendance: 91.2,
    teachers: 28,
    students: 620,
    infraScore: 84,
    weakSubjects: ['Information Technology']
  },
  {
    id: 'sch-4',
    name: 'Kothrud Model School',
    district: 'Kothrud Sub-division',
    passRate: 85.4,
    avgMarks: 76.2,
    attendance: 90.1,
    teachers: 30,
    students: 680,
    infraScore: 81,
    weakSubjects: ['Basic Sciences']
  }
];

export default function PerformancePage() {
  const { setActiveTab } = useUiStore();
  const [schoolAId, setSchoolAId] = useState<string>('sch-1');
  const [schoolBId, setSchoolBId] = useState<string>('sch-2');

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  const schoolA = MOCK_SCHOOLS.find(s => s.id === schoolAId) || MOCK_SCHOOLS[0];
  const schoolB = MOCK_SCHOOLS.find(s => s.id === schoolBId) || MOCK_SCHOOLS[1];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="School Performance Analytics" 
        subtitle="Perform district and school comparative analysis, tracking subject-wise metrics and learning gaps."
      />

      {/* 1. Comparison Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Comparison controls (12 cols) */}
        <Card className="lg:col-span-12 bg-card border-border shadow-xs">
          <CardHeader className="p-4.5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <School className="w-4.5 h-4.5 text-edu-purple" />
                <span>Side-by-Side School Comparison Console</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Select School A */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Target School A (Baseline)
                </label>
                <select
                  value={schoolAId}
                  onChange={(e) => setSchoolAId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-edu-purple"
                >
                  {MOCK_SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === schoolBId}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Select School B */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Target School B (Comparison)
                </label>
                <select
                  value={schoolBId}
                  onChange={(e) => setSchoolBId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-sm text-slate-950 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-edu-purple"
                >
                  {MOCK_SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === schoolAId}>{s.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Side-by-Side Analytics Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* School A Details (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-card border-border hover:border-slate-350 dark:hover:border-slate-750 transition-all shadow-3xs relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-edu-purple" />
            <CardContent className="p-5 space-y-5">
              <div>
                <span className="text-[9px] font-bold font-mono bg-purple-100 dark:bg-purple-950/40 text-edu-purple px-2 py-0.5 rounded border border-border">
                  {schoolA.district}
                </span>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mt-2">
                  {schoolA.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">SSC Pass Percentage</p>
                  <h4 className="text-xl font-black font-mono text-slate-950 dark:text-white mt-0.5">{schoolA.passRate}%</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Average Marks Score</p>
                  <h4 className="text-xl font-black font-mono text-royal-blue dark:text-edu-gold mt-0.5">{schoolA.avgMarks} / 100</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Student Attendance</p>
                  <h4 className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-450 mt-0.5">{schoolA.attendance}%</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Infrastructure Rating</p>
                  <h4 className="text-xl font-black font-mono text-amber-700 dark:text-edu-gold mt-0.5">{schoolA.infraScore} / 100</h4>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">Key Staffing Ratio</span>
                <p className="text-slate-950 dark:text-slate-350 font-semibold">
                  Total Students: <strong>{schoolA.students}</strong> • Total Teachers: <strong>{schoolA.teachers}</strong> (Ratio: {Math.floor(schoolA.students/schoolA.teachers)}:1)
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">Weak / Support Area subjects</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {schoolA.weakSubjects.map((sub, sIdx) => (
                    <span key={sIdx} className="px-2.5 py-0.5 bg-rose-100 text-rose-950 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded-full font-bold text-[9px]">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* School B Details (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="bg-card border-border hover:border-slate-350 dark:hover:border-slate-750 transition-all shadow-3xs relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-royal-blue dark:bg-edu-gold" />
            <CardContent className="p-5 space-y-5">
              <div>
                <span className="text-[9px] font-bold font-mono bg-blue-100 dark:bg-blue-950/40 text-royal-blue dark:text-edu-gold px-2 py-0.5 rounded border border-border">
                  {schoolB.district}
                </span>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mt-2">
                  {schoolB.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">SSC Pass Percentage</p>
                  <h4 className="text-xl font-black font-mono text-slate-950 dark:text-white mt-0.5">{schoolB.passRate}%</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Average Marks Score</p>
                  <h4 className="text-xl font-black font-mono text-royal-blue dark:text-edu-gold mt-0.5">{schoolB.avgMarks} / 100</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Student Attendance</p>
                  <h4 className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-450 mt-0.5">{schoolB.attendance}%</h4>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Infrastructure Rating</p>
                  <h4 className="text-xl font-black font-mono text-amber-700 dark:text-edu-gold mt-0.5">{schoolB.infraScore} / 100</h4>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">Key Staffing Ratio</span>
                <p className="text-slate-950 dark:text-slate-350 font-semibold">
                  Total Students: <strong>{schoolB.students}</strong> • Total Teachers: <strong>{schoolB.teachers}</strong> (Ratio: {Math.floor(schoolB.students/schoolB.teachers)}:1)
                </p>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">Weak / Support Area subjects</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {schoolB.weakSubjects.map((sub, sIdx) => (
                    <span key={sIdx} className="px-2.5 py-0.5 bg-rose-100 text-rose-950 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded-full font-bold text-[9px]">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* 3. AI Learning Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: AI insights summary (8 cols) */}
        <Card className="lg:col-span-8 bg-card border-border shadow-xs">
          <CardHeader className="p-4.5 border-b border-border">
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-edu-purple" />
              <span>AI Learning Insights & Diagnostics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl space-y-2">
              <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1">
                <Info className="w-4 h-4 text-edu-purple" />
                <span>Primary Learning Gap Identified: Math & Science Concept Gaps</span>
              </h4>
              <p className="text-xs text-slate-900 dark:text-slate-350 leading-relaxed text-justify">
                Comparative telemetry checks on Hadapsar subdivision schools indicate a localized drop in Math sub-scores during class audits. The concept gap correlates with a shortage of specialized Math/Science educators in specific rural boundaries. 
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
              <div className="p-3 border border-border rounded-xl space-y-1 bg-card">
                <span className="text-[8px] uppercase font-bold text-amber-600">Upgrade Recommendation</span>
                <h5 className="font-bold text-slate-950 dark:text-white">Implement Smart Lab Simulators</h5>
                <p className="text-[11px] text-slate-900 dark:text-slate-450 mt-1 leading-normal">
                  Redeploying 12 smart laboratories with digital simulators will boost science scores by projected 14% over next quarter.
                </p>
              </div>
              
              <div className="p-3 border border-border rounded-xl space-y-1 bg-card">
                <span className="text-[8px] uppercase font-bold text-emerald-600">Intervention Success Index</span>
                <h5 className="font-bold text-slate-950 dark:text-white">Peer Tutoring Program Phase I</h5>
                <p className="text-[11px] text-slate-900 dark:text-slate-450 mt-1 leading-normal">
                  Wards utilizing weekly peer tutoring groups demonstrated 8.4% faster learning recovery in weak subject diagnostics.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Right: Quick Links / Mini ranks (4 cols) */}
        <Card className="lg:col-span-4 bg-card border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="p-4.5 border-b border-border">
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-edu-purple" />
              <span>Subject Performance Ranks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4.5 space-y-4">
            
            <div className="space-y-3">
              {[
                { name: 'Social Studies', val: '92%', color: 'bg-emerald-500' },
                { name: 'Languages / English', val: '88%', color: 'bg-blue-600' },
                { name: 'Basic Sciences', val: '79%', color: 'bg-purple-600' },
                { name: 'Mathematics', val: '71%', color: 'bg-rose-500' }
              ].map((sub, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-950 dark:text-slate-350">
                    <span>{sub.name}</span>
                    <span className="font-mono">{sub.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border">
                    <div className={cn("h-full rounded-full", sub.color)} style={{ width: sub.val }} />
                  </div>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
}
