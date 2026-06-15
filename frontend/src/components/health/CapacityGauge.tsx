// components/health/CapacityGauge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface CapacityGaugeProps {
  occupied: number;
  total: number;
  label?: string;
  size?: number;
}

export function CapacityGauge({
  occupied,
  total,
  label = "OCCUPANCY",
  size = 120
}: CapacityGaugeProps) {
  const ratio = total > 0 ? occupied / total : 0;
  const percentage = Math.round(ratio * 100);

  // Determine color based on threshold rules
  let colorClass = "stroke-emerald-500";
  let textClass = "text-emerald-400";
  let bgClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  
  if (percentage > 85) {
    colorClass = "stroke-red-500";
    textClass = "text-red-400";
    bgClass = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (percentage >= 70) {
    colorClass = "stroke-amber-500";
    textClass = "text-amber-400";
    bgClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }

  // Circle parameters for circular progress ring
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            className="stroke-slate-800" 
            strokeWidth={strokeWidth} 
            fill="none" 
          />
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            className={cn("transition-all duration-1000 ease-out", colorClass)} 
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            fill="none" 
          />
        </svg>
        
        <div className="text-center z-10">
          <span className="block text-2xl font-black text-white leading-none">{percentage}%</span>
          <span className="text-[7px] font-black uppercase text-slate-400 block tracking-widest leading-none mt-1">{label}</span>
        </div>
      </div>
      
      <span className={cn(
        "mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-black border font-mono tracking-wide uppercase",
        bgClass
      )}>
        {occupied} / {total} Beds
      </span>
    </div>
  );
}
