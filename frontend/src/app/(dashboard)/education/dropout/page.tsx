'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Search, 
  User, 
  Map, 
  Sliders, 
  CheckCircle, 
  RefreshCw, 
  Info,
  ShieldAlert,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface StudentRisk {
  id: string;
  name: string;
  school: string;
  attendance: number;
  avgMarks: number;
  income: string; // "Low", "Medium", "High"
  distance: number; // km
  riskScore: number; // 0-100
  category: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending Intervention' | 'Counselor Assigned' | 'Stable';
}

const MOCK_STUDENTS: StudentRisk[] = [
  { id: 'st-01', name: 'Rahul Sharma', school: 'Hadapsar Government High School', attendance: 64.2, avgMarks: 48, income: 'Low', distance: 6.8, riskScore: 88, category: 'Critical', status: 'Pending Intervention' },
  { id: 'st-02', name: 'Ananya Deshmukh', school: 'Hadapsar Government High School', attendance: 78.4, avgMarks: 58, income: 'Low', distance: 4.2, riskScore: 68, category: 'High', status: 'Counselor Assigned' },
  { id: 'st-03', name: 'Amit Patil', school: 'Shivajinagar Adarsh Vidyalaya', attendance: 92.1, avgMarks: 82, income: 'Medium', distance: 1.5, riskScore: 12, category: 'Low', status: 'Stable' },
  { id: 'st-04', name: 'Sneha Kulkarni', school: 'Kothrud Model School', attendance: 82.4, avgMarks: 62, income: 'Low', distance: 5.5, riskScore: 48, category: 'Medium', status: 'Pending Intervention' },
  { id: 'st-05', name: 'Vikram Singh', school: 'Pune Cantonment Board School No. 3', attendance: 71.8, avgMarks: 52, income: 'Low', distance: 7.2, riskScore: 74, category: 'High', status: 'Pending Intervention' }
];

export default function DropoutPage() {
  const { setActiveTab } = useUiStore();
  const [students, setStudents] = useState<StudentRisk[]>(MOCK_STUDENTS);

  // Input states for custom simulator
  const [simAttendance, setSimAttendance] = useState<number>(75);
  const [simIncome, setSimIncome] = useState<string>('Low');
  const [simDistance, setSimDistance] = useState<number>(5.5);

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  // Compute simulated risk score
  const computedRisk = useMemo(() => {
    let base = 100 - simAttendance; // Lower attendance = higher risk
    if (simIncome === 'Low') base += 20;
    else if (simIncome === 'High') base -= 15;
    
    base += simDistance * 3; // Farther distance = higher risk
    const final = Math.min(100, Math.max(0, Math.floor(base)));
    
    let cat: StudentRisk['category'] = 'Low';
    if (final > 80) cat = 'Critical';
    else if (final > 60) cat = 'High';
    else if (final > 35) cat = 'Medium';

    return { score: final, category: cat };
  }, [simAttendance, simIncome, simDistance]);

  const handleAssignCounselor = (id: string) => {
    setStudents(prev => prev.map(st => 
      st.id === id ? { ...st, status: 'Counselor Assigned' } : st
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Dropout Risk Prediction Console" 
        subtitle="Forecast and audit student dropout risks based on economic status, commute distances, and class attendance parameters."
      />

      {/* 1. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Simulator Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-edu-purple" />
                <span>Risk Projection Simulator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-4">
              
              {/* Attendance slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Monthly Attendance Rate</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">{simAttendance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simAttendance}
                  onChange={(e) => setSimAttendance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

              {/* Income select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Household Income Bracket
                </label>
                <select
                  value={simIncome}
                  onChange={(e) => setSimIncome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-xs text-slate-950 dark:text-white focus:outline-hidden"
                >
                  <option value="Low">Low Income Bracket</option>
                  <option value="Medium">Medium Income Bracket</option>
                  <option value="High">High Income Bracket</option>
                </select>
              </div>

              {/* Distance slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Distance from School (Commute)</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">{simDistance} km</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={simDistance}
                  onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

              {/* Calculated Outputs block */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl flex items-center justify-between mt-4">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">Calculated Risk Score</p>
                  <h4 className={cn(
                    "text-xl font-black font-mono mt-0.5",
                    computedRisk.category === 'Critical' ? 'text-rose-600 dark:text-rose-400' :
                    computedRisk.category === 'High' ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-450'
                  )}>
                    {computedRisk.score}%
                  </h4>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450 text-right">Risk Level</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-black uppercase border px-2.5 py-0.5 rounded-full mt-1.5",
                    computedRisk.category === 'Critical' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400' :
                    computedRisk.category === 'High' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450'
                  )}>
                    {computedRisk.category}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Intervention guidelines */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1">
              <Info className="w-4.5 h-4.5 text-edu-purple" />
              <span>Recommended Interventions</span>
            </h3>
            <div className="text-[11px] text-slate-950 dark:text-slate-400 space-y-2 leading-relaxed font-sans font-medium">
              {computedRisk.category === 'Critical' && (
                <div className="p-2.5 bg-red-500/10 text-red-900 dark:text-red-400 border border-red-500/20 rounded-lg font-bold">
                  ⚠️ Mandate immediate physical home audit. Disburse girls-education scholarship booster coordinates.
                </div>
              )}
              {computedRisk.category === 'High' && (
                <div className="p-2.5 bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-500/20 rounded-lg font-bold">
                  ⚠️ Schedule counselor meeting. Route options for subsidized municipal school bus passes.
                </div>
              )}
              {(computedRisk.category === 'Low' || computedRisk.category === 'Medium') && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-950 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
                  ✅ Maintain standard attendance monitoring. Standard performance recovery steps apply.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Student Risk List Registry (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                <span>High-Risk Dropout Student Registry</span>
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                Live monitoring list of pupils identified as dropout risks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-900 dark:text-slate-450 border-b border-border font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-5 py-3">Student / School</th>
                      <th className="px-5 py-3">Commute / Attend</th>
                      <th className="px-5 py-3">Threat Score</th>
                      <th className="px-5 py-3 text-right">Intervention Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-950 dark:text-slate-350">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all font-medium">
                        <td className="px-5 py-3.5">
                          <h4 className="font-bold text-slate-950 dark:text-slate-200">{st.name}</h4>
                          <p className="text-[10px] text-slate-800 dark:text-slate-500 font-medium">{st.school}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-350">Dist: {st.distance} km</p>
                          <p className="text-[10px] text-slate-800 dark:text-slate-500">Attend: {st.attendance}%</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          <span className={cn(
                            "px-2 py-0.5 rounded-sm border font-bold text-[10px]",
                            st.category === 'Critical' ? 'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/20 dark:text-rose-450' :
                            st.category === 'High' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450'
                          )}>
                            {st.riskScore}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {st.status === 'Pending Intervention' ? (
                            <button
                              onClick={() => handleAssignCounselor(st.id)}
                              className="px-2.5 py-1 bg-edu-purple hover:bg-purple-700 text-white font-bold text-[9px] rounded-lg transition-all cursor-pointer shadow-3xs"
                            >
                              Assign Counselor
                            </button>
                          ) : (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                              st.status === 'Counselor Assigned' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/10 dark:text-amber-400' :
                              'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/10 dark:text-emerald-450'
                            )}>
                              {st.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* GIS Map mini placeholder */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Map className="w-4.5 h-4.5 text-edu-purple" />
                <span>GIS Dropout Hotspots Map grid</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex justify-center">
              <div className="w-full max-w-sm grid grid-cols-5 gap-2.5">
                {Array.from({ length: 15 }).map((_, idx) => {
                  const seed = (idx * 11) % 100;
                  // Critical if score is high
                  const cellColor = 
                    seed > 75 ? 'bg-rose-500/25 border-rose-500/50 dark:bg-rose-950/40 dark:border-rose-500/50 text-rose-600' :
                    seed > 40 ? 'bg-amber-500/20 border-amber-500/40 dark:bg-amber-950/30 dark:border-amber-500/50 text-amber-600' :
                    'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-400';

                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "aspect-square rounded-lg border flex flex-col items-center justify-center text-[8px] font-bold font-mono transition-all duration-300",
                        cellColor
                      )}
                      title={`Sector Grid ${idx + 1} Risk Factor: ${seed}%`}
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
