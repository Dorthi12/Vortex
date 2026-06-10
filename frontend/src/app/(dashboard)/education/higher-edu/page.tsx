'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  TrendingUp, 
  BookOpen, 
  Award, 
  MapPin, 
  FileText, 
  Briefcase,
  Users,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface CollegeData {
  id: string;
  name: string;
  type: 'University' | 'College';
  naac: string; // "A++", "A+", etc.
  enrollment: number;
  placementRate: number; // %
  publications: number;
  topSector: string;
}

const MOCK_COLLEGES: CollegeData[] = [
  { id: 'col-1', name: 'Hadapsar College of Engineering & IT', type: 'College', naac: 'A+', enrollment: 2400, placementRate: 84.2, publications: 142, topSector: 'Software Engineering' },
  { id: 'col-2', name: 'Pune Central National University', type: 'University', naac: 'A++', enrollment: 12500, placementRate: 78.6, publications: 840, topSector: 'Management & Research' },
  { id: 'col-3', name: 'Shivajinagar Medical Science College', type: 'College', naac: 'A', enrollment: 1800, placementRate: 92.4, publications: 210, topSector: 'Clinical Medicine' },
  { id: 'col-4', name: 'Pune Science & Arts Institute', type: 'College', naac: 'B++', enrollment: 3200, placementRate: 64.1, publications: 95, topSector: 'Basic Sciences' }
];

export default function HigherEduPage() {
  const { setActiveTab } = useUiStore();

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Higher Education Intelligence" 
        subtitle="Monitor university enrollment indices, placement ratios, and accredited research publication metrics."
      />

      {/* 1. KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <Card className="bg-card border-border shadow-3xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-edu-purple">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">Accredited Institutes</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">16 Centers</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-3xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-xl text-royal-blue dark:text-edu-gold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">Total Enrolled</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">48,500 Pupils</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-3xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">Avg Placement Rate</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">76.4%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-3xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-900 dark:text-slate-400">Research Publications</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">1,287 Papers</h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 2. Colleges table & Placement stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Colleges table (7 cols) */}
        <Card className="lg:col-span-7 bg-card border-border shadow-xs">
          <CardHeader className="p-5 border-b border-border">
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white">
              Accredited Higher Education Directories
            </CardTitle>
            <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
              Enrollment numbers, NAAC scores, and placement ratios.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-450 border-b border-border font-bold uppercase tracking-wider text-[9px]">
                    <th className="px-5 py-3">Institute Name</th>
                    <th className="px-5 py-3">NAAC</th>
                    <th className="px-5 py-3">Placement Rate</th>
                    <th className="px-5 py-3 text-right">Publications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-950 dark:text-slate-350">
                  {MOCK_COLLEGES.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all font-medium">
                      <td className="px-5 py-3.5">
                        <h4 className="font-bold text-slate-950 dark:text-slate-200">{c.name}</h4>
                        <p className="text-[10px] text-slate-800 dark:text-slate-500">{c.type} • {c.topSector}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 rounded font-bold">
                          {c.naac}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-royal-blue dark:text-edu-gold">{c.placementRate}%</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">{c.publications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Placement Sector Graph (5 cols) */}
        <Card className="lg:col-span-5 bg-card border-border shadow-xs">
          <CardHeader className="p-5 border-b border-border">
            <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-edu-purple" />
              <span>Placement Rates by Field</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex items-center justify-center">
            <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner">
              
              {/* Custom SVG Column Chart */}
              <svg viewBox="0 0 320 180" className="w-full h-full text-slate-300 dark:text-slate-800">
                {/* Horizontal baseline */}
                <line x1="30" y1="140" x2="290" y2="140" stroke="currentColor" strokeWidth="1" />
                
                {/* Column bars: Engineering (84%), Medical (92%), Commerce (72%), Arts (54%) */}
                {/* Eng */}
                <rect x="50" y="140 - 110" width="30" height="110" fill="#7C3AED" rx="2" className="hover:opacity-85 transition-opacity" />
                {/* Med */}
                <rect x="110" y="140 - 120" width="30" height="120" fill="#0F4C81" rx="2" className="hover:opacity-85 transition-opacity" />
                {/* Comm */}
                <rect x="170" y="140 - 95" width="30" height="95" fill="#10B981" rx="2" className="hover:opacity-85 transition-opacity" />
                {/* Arts */}
                <rect x="230" y="140 - 70" width="30" height="70" fill="#F59E0B" rx="2" className="hover:opacity-85 transition-opacity" />

                {/* X labels */}
                <text x="65" y="155" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="middle">ENG</text>
                <text x="125" y="155" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="middle">MED</text>
                <text x="185" y="155" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="middle">COMM</text>
                <text x="245" y="155" fill="currentColor" fontSize="7" fontWeight="bold" textAnchor="middle">ARTS</text>

                {/* Values on top */}
                <text x="65" y="25" fill="#7C3AED" fontSize="8" fontWeight="black" textAnchor="middle">84%</text>
                <text x="125" y="15" fill="#0F4C81" fontSize="8" fontWeight="black" textAnchor="middle">92%</text>
                <text x="185" y="40" fill="#10B981" fontSize="8" fontWeight="black" textAnchor="middle">72%</text>
                <text x="245" y="65" fill="#F59E0B" fontSize="8" fontWeight="black" textAnchor="middle">54%</text>
              </svg>

            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
