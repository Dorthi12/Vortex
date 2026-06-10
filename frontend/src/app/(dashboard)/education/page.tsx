'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  School, 
  Users, 
  BookOpen, 
  Award, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  ThumbsUp, 
  Heart,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

export default function EducationDashboard() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  // KPIs
  const kpis = [
    { label: 'Total Schools', value: '1,420', change: '+12 New Wards', icon: School, color: 'text-edu-purple bg-purple-100 dark:bg-purple-950/40' },
    { label: 'Total Students', value: '3,45,200', change: '+3.4% YoY', icon: Users, color: 'text-blue-900 bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Total Teachers', value: '14,850', change: '94% Allocated', icon: GraduationCap, color: 'text-amber-700 bg-amber-100 dark:bg-amber-950/40' },
    { label: 'Student-Teacher Ratio', value: '23:1', change: 'National standard: 30:1', icon: Activity, color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'School Attendance %', value: '91.4%', change: '+0.8% MoM', icon: CheckSquare, color: 'text-pink-700 bg-pink-100 dark:bg-pink-950/40' }
  ];

  function CheckSquare({ className }: { className?: string }) {
    return <span className={cn("text-xs font-bold", className)}>✓</span>;
  }

  // District Rankings
  const rankings = [
    { district: 'Shivajinagar Wards', pass: '94.2%', score: 91, status: 'Excellent' },
    { district: 'Hadapsar Division', pass: '89.6%', score: 86, status: 'Good' },
    { district: 'Pune Cantonment', pass: '88.1%', score: 84, status: 'Good' },
    { district: 'Kothrud Sub-division', pass: '85.4%', score: 81, status: 'Good' },
    { district: 'Hadapsar Sector 4-B', pass: '81.2%', score: 76, status: 'Average' },
    { district: 'Hadapsar Outer Wards', pass: '72.4%', score: 64, status: 'Average' }
  ];

  // Composite Health Score
  const healthScore = 84; // 0-100
  const healthCategory = 'Good'; // Excellent, Good, Average, Poor, Critical

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Education Subnavigation Header */}
      <EducationHeader 
        title="Education Intelligence Module" 
        subtitle="Dossier audit matrix compiling public school performance, staffing optimizer models, and dropout risks."
      />

      {/* 1. Main Key Performance Indexes (KPIs) Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="bg-card border-border shadow-3xs overflow-hidden">
              <CardContent className="p-4 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">
                    {kpi.label}
                  </p>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white font-mono">
                    {kpi.value}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-500">
                    {kpi.change}
                  </p>
                </div>
                <div className={cn("p-2.5 rounded-xl border border-border/60 shrink-0", kpi.color)}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2. Health Index & Impact counters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Education Health Index Card (4 cols) */}
        <Card className="lg:col-span-4 bg-card border-border shadow-xs flex flex-col justify-between p-5 min-h-[260px]">
          <div className="flex justify-between items-center text-slate-900 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Education Health Index</span>
            <Activity className="w-4.5 h-4.5 text-edu-purple" />
          </div>

          <div className="flex items-center justify-center py-4 relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* background track */}
              <circle cx="50" cy="50" r="40" className="fill-transparent stroke-slate-100 dark:stroke-slate-900" strokeWidth="8" />
              {/* active progress */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                className="fill-transparent stroke-edu-purple transition-all duration-700" 
                strokeWidth="8" 
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-mono">{healthScore}</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-900 dark:text-slate-500 font-bold">
                COMPOSITE SCORE
              </span>
            </div>
          </div>

          <div className="text-center space-y-1 pt-2 border-t border-border/60">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
              Health Status: {healthCategory}
            </span>
            <p className="text-[9px] text-slate-800 dark:text-slate-500">
              Computed from Attendance, Infrastructure, & Pass Ratios.
            </p>
          </div>
        </Card>

        {/* Impact Dashboard counters (8 cols) */}
        <Card className="lg:col-span-8 bg-card border-border shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-900 dark:text-slate-400">
              <span className="text-[10px] uppercase font-bold tracking-wider">Social Impact & Achievements</span>
              <span className="text-[9px] font-bold font-mono text-edu-purple dark:text-edu-gold">UPDATED JUN 2026</span>
            </div>
            
            <h3 className="text-sm font-extrabold text-slate-950 dark:text-white mt-2">
              National Education Directives Output Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Students Benefited</p>
                <h4 className="text-xl font-black text-edu-purple font-mono">84,250</h4>
                <p className="text-[8px] font-semibold text-emerald-600">+12% MoM</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Scholarships Granted</p>
                <h4 className="text-xl font-black text-royal-blue dark:text-edu-gold font-mono">₹14.2 Cr</h4>
                <p className="text-[8px] font-semibold text-emerald-600">32,410 Pupils</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Dropouts Blocked</p>
                <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">1,840</h4>
                <p className="text-[8px] font-semibold text-emerald-600">Saved Risk Cases</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Schools Upgraded</p>
                <h4 className="text-xl font-black text-amber-700 dark:text-edu-gold font-mono">242 Wards</h4>
                <p className="text-[8px] font-semibold text-emerald-600">Smart Utility Connections</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-800 dark:text-slate-500 border-t border-border/60 pt-3 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-edu-purple" />
            <span>Telemetry verified by state departments for budget disbursements audits.</span>
          </div>
        </Card>

      </div>

      {/* 3. District Rankings Table & Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* District Rankings (7 cols) */}
        <Card className="lg:col-span-7 bg-card border-border shadow-xs">
          <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
                Sub-division Performance Matrix
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                Auditing pass percentages and overall score rankings.
              </CardDescription>
            </div>
            <button className="text-[10px] font-bold text-edu-purple hover:underline flex items-center gap-1 cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Full CSV Export</span>
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-450 border-b border-border font-bold uppercase tracking-wider text-[9px]">
                    <th className="px-5 py-3">Sub-division / Ward</th>
                    <th className="px-5 py-3">SSC Pass Percentage</th>
                    <th className="px-5 py-3">Performance Score</th>
                    <th className="px-5 py-3 text-right">Rating Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-950 dark:text-slate-350">
                  {rankings.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all font-medium">
                      <td className="px-5 py-3.5 font-bold text-slate-950 dark:text-slate-200">{r.district}</td>
                      <td className="px-5 py-3.5 font-mono">{r.pass}</td>
                      <td className="px-5 py-3.5 font-bold font-mono text-royal-blue dark:text-edu-gold">{r.score} / 100</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                          r.status === 'Excellent' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450' :
                          r.status === 'Good' ? 'bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400' :
                          'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400'
                        )}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trends SVG Chart (5 cols) */}
        <Card className="lg:col-span-5 bg-card border-border shadow-xs">
          <CardHeader className="p-5 border-b border-border">
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-edu-purple" />
              <span>School Attendance Trends (6-Month Outlines)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex items-center justify-center">
            <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner">
              
              {/* Custom SVG Line Chart */}
              <svg viewBox="0 0 400 180" className="w-full h-full text-slate-300 dark:text-slate-800">
                {/* grid lines */}
                <line x1="40" y1="20" x2="360" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="40" y1="70" x2="360" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="40" y1="120" x2="360" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="40" y1="140" x2="360" y2="140" stroke="currentColor" strokeWidth="0.8" />
                
                {/* coordinates */}
                {/* Jan: 88%, Feb: 89%, Mar: 90%, Apr: 87%, May: 91%, Jun: 91.4% */}
                <path
                  d="M 40 125 L 100 115 L 160 90 L 220 120 L 280 60 L 340 50"
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* data dots */}
                <circle cx="40" cy="125" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="100" cy="115" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="160" cy="90" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="220" cy="120" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="280" cy="60" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="340" cy="50" r="4.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* X labels */}
                <text x="40" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Jan</text>
                <text x="100" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Feb</text>
                <text x="160" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Mar</text>
                <text x="220" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Apr</text>
                <text x="280" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">May</text>
                <text x="340" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Jun</text>

                {/* Y labels */}
                <text x="32" y="123" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="end">85%</text>
                <text x="32" y="73" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="end">90%</text>
                <text x="32" y="23" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="end">95%</text>
              </svg>

              {/* Chart Overlay Badge */}
              <div className="absolute top-3 right-3 bg-card border border-border px-2 py-1 rounded text-[8px] font-black uppercase text-slate-900 dark:text-slate-400 tracking-wider">
                Average Rate: 91.4%
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
