'use client';

import React from 'react';
import { MapPin, Compass, Info } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

export interface LocationDetail {
  id: string;
  name: string;
  coords: string;
  nodes: number;
  description: string;
}

export const LOCATION_DETAILS: Record<string, LocationDetail> = {
  Shivajinagar: {
    id: 'Shivajinagar',
    name: 'Shivajinagar (Pune Central)',
    coords: '18.5302° N, 73.8474° E',
    nodes: 124,
    description: 'Includes Pune Municipal Corp, Shivajinagar Hub, and Sangam Bridge corridor.'
  },
  Hadapsar: {
    id: 'Hadapsar',
    name: 'Hadapsar (Industrial Zone)',
    coords: '18.5018° N, 73.9242° E',
    nodes: 98,
    description: 'Includes Hadapsar Substation, Mundhwa Industrial margins, and Solapur highway segments.'
  },
  Aundh: {
    id: 'Aundh',
    name: 'Aundh (Western Corridor)',
    coords: '18.5602° N, 73.8031° E',
    nodes: 110,
    description: 'Includes Aundh Causeway, Baner Tech Link, and Khadakwasla spillway feeds.'
  },
  Yerawada: {
    id: 'Yerawada',
    name: 'Yerawada (Confluence Ward)',
    coords: '18.5529° N, 73.8824° E',
    nodes: 104,
    description: 'Includes Yerawada riverbed margins, Sangam confluence, and Alandi Road grids.'
  }
};

export function LocationScopeBanner() {
  const { userLocation, setUserLocation } = useUiStore();
  const currentDetails = LOCATION_DETAILS[userLocation] || LOCATION_DETAILS.Shivajinagar;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-border-subtle rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
      
      {/* Left side: Pulsing lock & location selector */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#4682B4] shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Citizen GPS:</span>
          
          <select 
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            className="font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-[#4682B4]/50 focus:border-[#4682B4] focus:outline-none cursor-pointer pr-1"
          >
            {Object.values(LOCATION_DETAILS).map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-card text-slate-800 dark:text-slate-100">
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <span className="hidden md:inline text-slate-300 dark:text-slate-700 font-medium">|</span>

        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#4682B4] shrink-0" />
          <span className="text-slate-400 font-medium whitespace-nowrap">Telemetry Scope:</span>
          <strong className="text-white bg-[#4682B4] dark:bg-[#4682B4] px-2 py-0.5 rounded-md text-[10px] tracking-wide uppercase font-black shadow-xs">
            Next 50 km Radius
          </strong>
        </div>
      </div>

      {/* Right side: Coordinates & Description details */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium self-end md:self-auto">
        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase shrink-0">
          {currentDetails.coords}
        </span>
        <span className="hidden lg:inline">•</span>
        <div className="hidden lg:flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>{currentDetails.description}</span>
        </div>
        <span className="text-[#4682B4] bg-[#4682B4]/10 dark:bg-[#4682B4]/20 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider shrink-0 ml-1">
          {currentDetails.nodes} Nodes Active
        </span>
      </div>

    </div>
  );
}
