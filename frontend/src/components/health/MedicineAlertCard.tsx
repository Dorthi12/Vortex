// components/health/MedicineAlertCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp, AlertOctagon, Info } from 'lucide-react';

interface MedicineAlertCardProps {
  medicineName: string;
  stockLevel: number;
  pharmacyName: string;
  matchPercentage: number;
  suggestedDisease: string;
  severity: 'CRITICAL' | 'ALERT' | 'WARNING' | string;
}

export function MedicineAlertCard({
  medicineName,
  stockLevel,
  pharmacyName,
  matchPercentage,
  suggestedDisease,
  severity
}: MedicineAlertCardProps) {
  
  const borderColors = {
    CRITICAL: 'border-red-500',
    ALERT: 'border-orange-500',
    WARNING: 'border-amber-500'
  };

  const bgColors = {
    CRITICAL: 'bg-red-500/10 border-red-500/20 text-red-400',
    ALERT: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    WARNING: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
  };

  const iconMap = {
    CRITICAL: AlertOctagon,
    ALERT: AlertTriangle,
    WARNING: Info
  };

  const Icon = iconMap[severity as keyof typeof iconMap] || Info;
  const borderColor = borderColors[severity as keyof typeof borderColors] || 'border-[#1A2744]';
  const bgColor = bgColors[severity as keyof typeof bgColors] || 'bg-slate-800/10 text-slate-400 border-slate-700/20';

  return (
    <Card className={cn("bg-[#0A1228] border text-white relative overflow-hidden", borderColor)}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", severity === 'CRITICAL' ? 'bg-red-500' : severity === 'ALERT' ? 'bg-orange-500' : 'bg-amber-500')} />
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black border tracking-wide uppercase leading-none font-mono",
              bgColor
            )}>
              <Icon className="w-3 h-3" />
              {severity}
            </span>
            
            <h4 className="text-base font-black text-slate-100 mt-2">{medicineName}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Node: {pharmacyName}</p>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-white">{stockLevel}</span>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">UNITS IN STOCK</p>
          </div>
        </div>

        {/* Pattern detection details */}
        <div className="mt-4 p-3 rounded bg-[#070D1A]/50 border border-[#1A2744] space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-400">Profile Match:</span>
            <span className="text-[#D4AF37] font-mono">{matchPercentage}% {suggestedDisease} Match</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-[#1A2744]">
            <div 
              className="h-full bg-[#D4AF37]" 
              style={{ width: `${matchPercentage}%` }} 
            />
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Spike threshold crossed, triggering surveillance signal alert.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
