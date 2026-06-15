// components/health/HealthMap.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MapPoint {
  latitude: number;
  longitude: number;
  label: string;
  type: 'hospital' | 'ambulance' | 'outbreak' | 'center';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface HealthMapProps {
  points: MapPoint[];
  districtName?: string;
  width?: number;
  height?: number;
}

export function HealthMap({
  points,
  districtName = "Lucknow",
  width = 500,
  height = 200
}: HealthMapProps) {
  
  // Calculate relative bounds based on input coordinates
  const lats = points.map(p => p.latitude);
  const lngs = points.map(p => p.longitude);
  
  const minLat = lats.length > 0 ? Math.min(...lats) - 0.05 : 26.75;
  const maxLat = lats.length > 0 ? Math.max(...lats) + 0.05 : 26.95;
  const minLng = lngs.length > 0 ? Math.min(...lngs) - 0.05 : 80.85;
  const maxLng = lngs.length > 0 ? Math.max(...lngs) + 0.05 : 81.05;

  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const projectCoords = (lat: number, lng: number) => {
    // Map GPS coordinates to SVG coordinate grid
    const x = 50 + ((lng - minLng) / (lngRange || 0.1)) * (width - 100);
    const y = height - 40 - ((lat - minLat) / (latRange || 0.1)) * (height - 80);
    return { x, y };
  };

  const getPointColor = (p: MapPoint) => {
    if (p.type === 'hospital') return 'fill-blue-500 stroke-blue-400';
    if (p.type === 'ambulance') return 'fill-amber-500 stroke-amber-400';
    if (p.type === 'center') return 'fill-purple-500 stroke-purple-400';
    
    // Outbreak risk color
    switch (p.riskLevel) {
      case 'CRITICAL': return 'fill-red-500 stroke-red-400';
      case 'HIGH': return 'fill-orange-500 stroke-orange-400';
      case 'MEDIUM': return 'fill-amber-500 stroke-amber-400';
      default: return 'fill-emerald-500 stroke-emerald-400';
    }
  };

  return (
    <div className="w-full relative rounded-lg border border-[#1A2744] bg-[#070D1A]/40 overflow-hidden select-none">
      <div className="absolute top-3 left-4 flex flex-col gap-0.5">
        <span className="text-[7px] font-black uppercase text-[#D4AF37] tracking-widest leading-none">GEOSPATIAL COORDINATES MATRIX</span>
        <span className="text-[11px] font-black text-white leading-none mt-1">{districtName} Command District Grid</span>
      </div>

      {/* SVG Map Grid */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-md p-4">
        {/* District Boundary Matrix Grid lines */}
        <line x1="30" y1="40" x2="30" y2={height - 30} className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />
        <line x1={width - 30} y1="40" x2={width - 30} y2={height - 30} className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="30" y1="40" x2={width - 30} y2="40" className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />
        <line x1="30" y1={height - 30} x2={width - 30} y2={height - 30} className="stroke-slate-800" strokeWidth="0.5" strokeDasharray="3" />

        {/* Dynamic target blips */}
        {points.map((p, idx) => {
          const { x, y } = projectCoords(p.latitude, p.longitude);
          const isCritical = p.type === 'outbreak' && (p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH');
          const isAmbulance = p.type === 'ambulance';
          
          return (
            <g key={idx} className="group/blip cursor-pointer">
              {/* Pulsing ring indicator */}
              {(isCritical || isAmbulance) && (
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isCritical ? "12" : "8"} 
                  className={cn(
                    "stroke-current opacity-25 fill-none animate-ping duration-1000",
                    isCritical ? "text-red-500" : "text-amber-500"
                  )} 
                  strokeWidth="0.5" 
                />
              )}
              
              {/* Main dot blip */}
              <circle 
                cx={x} 
                cy={y} 
                r={p.type === 'hospital' ? "4.5" : "3.5"} 
                className={cn("stroke-[1.5] transition-all duration-300", getPointColor(p))} 
              />
              
              {/* Dot label */}
              <text 
                x={x} 
                y={y - 8} 
                className="fill-slate-400 text-[6px] font-bold tracking-tight opacity-75 select-none" 
                textAnchor="middle"
              >
                {p.label}
              </text>
              
              {/* Coordinates tooltip */}
              <g className="opacity-0 group-hover/blip:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect 
                  x={x - 40} 
                  y={y + 8} 
                  width="80" 
                  height="16" 
                  rx="3" 
                  className="fill-[#101F42] stroke-[#1A2744] stroke-[0.5]" 
                />
                <text 
                  x={x} 
                  y={y + 19} 
                  className="fill-white text-[6px] font-bold" 
                  textAnchor="middle"
                >
                  GPS: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-3 right-4 flex items-center gap-3.5 text-[8px] font-black uppercase tracking-wider text-slate-400 font-mono">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>HOSPITALS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>AMBULANCES</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          <span>VACCINE CLINICS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span>OUTBREAK HAZARDS</span>
        </div>
      </div>
    </div>
  );
}
