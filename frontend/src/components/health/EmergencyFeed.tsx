// components/health/EmergencyFeed.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Terminal, ShieldAlert } from 'lucide-react';

interface EventItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface EmergencyFeedProps {
  events: EventItem[];
}

export function EmergencyFeed({ events }: EmergencyFeedProps) {
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'OUTBREAK_PREDICTION': return 'text-red-400 border-red-500/25 bg-red-500/10';
      case 'HOSPITAL_ADMISSION': return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10';
      case 'HOSPITAL_DISCHARGE': return 'text-blue-400 border-blue-500/25 bg-blue-500/10';
      case 'DISEASE_SURVEILLANCE_ALERT': return 'text-orange-400 border-orange-500/25 bg-orange-500/10';
      case 'AMBULANCE_DISPATCHED': return 'text-red-400 border-red-500/25 bg-red-500/10';
      case 'VACCINATION_ALERT': return 'text-amber-400 border-amber-500/25 bg-amber-500/10';
      default: return 'text-slate-400 border-slate-700/25 bg-slate-800/10';
    }
  };

  return (
    <Card className="bg-[#0A1228] border border-[#1A2744] text-white flex flex-col h-full">
      <CardHeader className="border-b border-[#1A2744] py-3.5 px-5 flex flex-row items-center gap-2">
        <Terminal className="w-4 h-4 text-[#D4AF37]" />
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
          EOC Operational Events Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-y-auto max-h-[360px] font-mono scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
        {events && events.length > 0 ? (
          <div className="space-y-3.5">
            {events.map((evt) => (
              <div 
                key={evt.id} 
                className="flex items-start gap-2.5 text-[10px] leading-relaxed border-b border-[#1A2744]/40 pb-2.5 last:border-b-0 last:pb-0"
              >
                <span className="text-slate-500 font-bold tracking-tight shrink-0 select-none">
                  [{evt.timestamp}]
                </span>
                
                <span className={cn(
                  "px-1.5 py-0.5 rounded border text-[8px] font-black shrink-0 tracking-wide uppercase font-mono",
                  getTypeColor(evt.type)
                )}>
                  {evt.type.replace('_', ' ')}
                </span>
                
                <span className="text-slate-300 font-semibold tracking-tight">
                  {evt.message}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-center text-slate-500">
            <ShieldAlert className="w-8 h-8 text-slate-700 mb-2" />
            <span className="text-[10px] font-bold text-slate-500">Awaiting Real-Time Event Broker Feed...</span>
            <p className="text-[9px] mt-1 max-w-[200px] leading-relaxed">
              Connect to WebSocket or trigger capacity events to stream updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
