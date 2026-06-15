// components/health/HealthKpiCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HealthKpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  statusColor?: 'red' | 'orange' | 'amber' | 'emerald' | 'blue';
  description?: string;
  pulse?: boolean;
}

export function HealthKpiCard({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  statusColor = 'blue',
  description,
  pulse = false
}: HealthKpiCardProps) {
  
  const borderColors = {
    red: 'border-red-500',
    orange: 'border-orange-500',
    amber: 'border-amber-500',
    emerald: 'border-emerald-500',
    blue: 'border-[#1A3A6C]'
  };

  const textColors = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400'
  };

  const bgColors = {
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  return (
    <Card className={cn("bg-[#0A1228] border border-[#1A2744] text-white relative overflow-hidden")}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", borderColors[statusColor])} />
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
            <h3 className={cn("text-2xl font-black mt-2 flex items-baseline gap-1", textColors[statusColor])}>
              {value}
              {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
            </h3>
          </div>
          <div className={cn("p-2 rounded-lg border", bgColors[statusColor], pulse && "animate-pulse")}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold">
            <span className={trend.isPositive ? 'text-emerald-400' : 'text-red-400'}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
            <span className="text-slate-400 font-semibold">vs last interval</span>
          </div>
        )}
        
        {description && !trend && (
          <p className="text-[10px] text-slate-400 mt-4 font-semibold leading-relaxed">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
