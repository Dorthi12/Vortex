// components/health/RiskIndicator.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskIndicator({ level, size = 'md' }: RiskIndicatorProps) {
  const normalizedLevel = level.toUpperCase();
  
  const colors = {
    CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/10 dot-bg-red',
    HIGH: 'text-orange-400 border-orange-500/30 bg-orange-500/10 dot-bg-orange',
    MEDIUM: 'text-amber-400 border-amber-500/30 bg-amber-500/10 dot-bg-amber',
    LOW: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 dot-bg-emerald'
  };

  const dotColors = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500'
  };

  const defaultStyle = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  const style = colors[normalizedLevel as keyof typeof colors] || defaultStyle;
  const dotColor = dotColors[normalizedLevel as keyof typeof dotColors] || 'bg-blue-500';

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1 font-bold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-extrabold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black'
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-md border tracking-wide uppercase leading-none font-mono",
      style,
      sizeClasses[size]
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full", 
        dotColor, 
        (normalizedLevel === 'CRITICAL' || normalizedLevel === 'HIGH') && "animate-pulse"
      )} />
      {normalizedLevel}
    </span>
  );
}
