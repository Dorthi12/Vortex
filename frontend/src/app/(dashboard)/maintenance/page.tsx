// app/(dashboard)/maintenance/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, UserCheck, AlertTriangle, ShieldCheck, Wrench, Clock, DollarSign
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface MaintenanceAsset {
  id: string;
  name: string;
  type: string;
  failureProbability: number;
  downtimeHours: number;
  financialImpactLakhs: number;
  crewAssigned: string;
  scheduledDate: string;
  priority: 'Immediate' | 'Within 7 Days' | 'Within 30 Days' | 'Monitor Only';
}

const MAINTENANCE_ASSETS: MaintenanceAsset[] = [
  { id: 'as-4', name: 'Yerawada Bed Causeway', type: 'road', failureProbability: 0.65, downtimeHours: 36, financialImpactLakhs: 4.8, crewAssigned: 'Zone 4 Highway Works', scheduledDate: '2026-06-15', priority: 'Immediate' },
  { id: 'as-2', name: 'Hadapsar Substation Node', type: 'grid', failureProbability: 0.35, downtimeHours: 12, financialImpactLakhs: 12.5, crewAssigned: 'Substation Crew B', scheduledDate: '2026-06-18', priority: 'Within 7 Days' },
  { id: 'as-5', name: 'Aundh Highway Segment', type: 'road', failureProbability: 0.28, downtimeHours: 18, financialImpactLakhs: 2.2, crewAssigned: 'Zone 1 Maintenance', scheduledDate: '2026-06-25', priority: 'Within 30 Days' },
  { id: 'as-7', name: 'Koregaon Pipeline Trunk', type: 'utility', failureProbability: 0.14, downtimeHours: 8, financialImpactLakhs: 7.5, crewAssigned: 'Water Supply Team 2', scheduledDate: '2026-07-02', priority: 'Within 30 Days' },
  { id: 'as-1', name: 'Sangamwadi Confluence Bridge', type: 'bridge', failureProbability: 0.05, downtimeHours: 48, financialImpactLakhs: 25.0, crewAssigned: 'Bridges Engineering', scheduledDate: '2026-08-10', priority: 'Monitor Only' },
];

export default function MaintenanceDashboard() {
  const [assets, setAssets] = useState<MaintenanceAsset[]>(MAINTENANCE_ASSETS);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Filter based on Priority Selector
  const filteredAssets = useMemo(() => {
    if (filterPriority === 'ALL') return assets;
    return assets.filter(a => a.priority === filterPriority);
  }, [assets, filterPriority]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 5</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Predictive Maintenance Center</h1>
        </div>
      </div>

      <LocationScopeBanner />

      {/* Priority Recommendations Shortcuts */}
      <div className="space-y-3">
        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Maintenance Recommendations Filter</span>
        <div className="flex flex-wrap gap-2.5">
          {['ALL', 'Immediate', 'Within 7 Days', 'Within 30 Days', 'Monitor Only'].map((prio) => (
            <button
              key={prio}
              onClick={() => setFilterPriority(prio)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors shadow-2xs",
                filterPriority === prio 
                  ? "bg-[#4682B4] border-[#4682B4] text-white" 
                  : "bg-white dark:bg-[#0A1228] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
              )}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3 width) - Ranked Failures */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#4682B4]" />
                Upcoming Failures Ranked by Risk Index
              </CardTitle>
              <CardDescription className="text-xs">
                Asset vulnerability computed by deep learning degradation classifiers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-850 dark:text-slate-300">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 dark:bg-black/20 border-y border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Asset</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Failure Prob</th>
                    <th className="px-5 py-3">Est. Downtime</th>
                    <th className="px-5 py-3">Financial Impact</th>
                    <th className="px-5 py-3 text-right">Maintenance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors">
                      <td className="px-5 py-4 font-black text-slate-950 dark:text-white">{asset.name}</td>
                      <td className="px-5 py-4 uppercase font-bold text-[#4682B4]">{asset.type}</td>
                      <td className="px-5 py-4 font-mono font-black text-red-500">{(asset.failureProbability * 100).toFixed(0)}%</td>
                      <td className="px-5 py-4 font-mono font-black">{asset.downtimeHours} Hrs</td>
                      <td className="px-5 py-4 font-mono text-emerald-600 dark:text-emerald-400">₹{asset.financialImpactLakhs} Lakhs</td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                          asset.priority === 'Immediate' ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" :
                          asset.priority === 'Within 7 Days' ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30" :
                          asset.priority === 'Within 30 Days' ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" :
                          "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                        )}>
                          {asset.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width) - Calendar Planner */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4682B4]" />
                Maintenance Calendar
              </CardTitle>
              <CardDescription className="text-xs">Scheduled crew dispatches and checks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredAssets.map(asset => (
                <div 
                  key={`cal-${asset.id}`}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-[#4682B4] font-black">{asset.scheduledDate}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{asset.type}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">{asset.name}</h4>
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-[#4682B4]" />{asset.crewAssigned}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
