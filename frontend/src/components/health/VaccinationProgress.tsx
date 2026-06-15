// components/health/VaccinationProgress.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface VaccinationProgressProps {
  coveragePct: number;
  totalAdministered: number;
  targetedDisease: string;
  recommendedVaccine: string;
  remainingPopulation?: number;
}

export function VaccinationProgress({
  coveragePct,
  totalAdministered,
  targetedDisease,
  recommendedVaccine,
  remainingPopulation = 24000
}: VaccinationProgressProps) {
  
  let progressColor = "bg-emerald-500";
  let textColor = "text-emerald-400";
  
  if (coveragePct < 50) {
    progressColor = "bg-red-500";
    textColor = "text-red-400";
  } else if (coveragePct < 75) {
    progressColor = "bg-amber-500";
    textColor = "text-amber-400";
  }

  return (
    <div className="space-y-4 p-4 rounded-lg bg-[#070D1A]/50 border border-[#1A2744]">
      {/* Vaccine details */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-extrabold text-white">{recommendedVaccine} Campaign</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Target: {targetedDisease}</p>
        </div>
        <div className="text-right">
          <span className={cn("text-lg font-black font-mono", textColor)}>{coveragePct.toFixed(1)}%</span>
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">COVERAGE</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative border border-[#1A2744]">
          <div 
            className={cn("h-full transition-all duration-1000 ease-out", progressColor)} 
            style={{ width: `${Math.min(coveragePct, 100)}%` }} 
          />
        </div>
        <div className="flex justify-between text-[8px] font-bold text-slate-500 font-mono">
          <span>0%</span>
          <span>50%</span>
          <span>70% TARGET</span>
          <span>100%</span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1A2744] text-left">
        <div>
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Doses Administered</span>
          <p className="text-sm font-black text-slate-200 mt-0.5">{totalAdministered.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Remaining Target</span>
          <p className="text-sm font-black text-slate-200 mt-0.5">{remainingPopulation.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
