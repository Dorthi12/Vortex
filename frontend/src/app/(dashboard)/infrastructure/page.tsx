'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronRight, 
  Wrench, 
  TrendingUp, 
  Map, 
  Info, 
  AlertTriangle, 
  Activity, 
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

// Mock Assets for Risk Matrix & Map
interface InfraAsset {
  id: string;
  name: string;
  type: 'road' | 'bridge' | 'dam' | 'grid';
  health: number; // 0 - 100
  likelihood: number; // 1 - 5
  consequence: number; // 1 - 5
  location: string;
  status: 'operational' | 'alert' | 'maintenance';
  coords: { x: number; y: number }; // SVG Map coordinates
  details: string;
}

const INITIAL_ASSETS: InfraAsset[] = [
  { id: 'as-1', name: 'Sangamwadi Confluence Bridge', type: 'bridge', health: 91, likelihood: 2, consequence: 5, location: 'Sangam Bridge Road', status: 'operational', coords: { x: 75, y: 30 }, details: 'Expansion joints wear detected. Sensor logs stable.' },
  { id: 'as-2', name: 'Hadapsar Substation Node', type: 'grid', health: 82, likelihood: 3, consequence: 4, location: 'Hadapsar Industrial Zone', status: 'alert', coords: { x: 125, y: 65 }, details: 'Transformer 2 running hot (84°C). Load balancing required.' },
  { id: 'as-3', name: 'Khadakwasla Dam Spillway', type: 'dam', health: 98, likelihood: 1, consequence: 5, location: 'Khadakwasla Reservoir', status: 'operational', coords: { x: 30, y: 25 }, details: 'Radial gates operational. Water level 78% capacity.' },
  { id: 'as-4', name: 'Yerawada Bed Causeway', type: 'road', health: 65, likelihood: 4, consequence: 3, location: 'Yerawada riverbed margins', status: 'maintenance', coords: { x: 115, y: 20 }, details: 'Active asphalt repavement on lanes 1 & 2. Speed restriction active.' },
  { id: 'as-5', name: 'Aundh Highway Segment', type: 'road', health: 88, likelihood: 2, consequence: 3, location: 'Aundh Causeway Road', status: 'operational', coords: { x: 25, y: 15 }, details: 'Minor surface cracking. Scheduled for resealing Q4.' },
  { id: 'as-6', name: 'Shivajinagar Grid Hub', type: 'grid', health: 90, likelihood: 2, consequence: 4, location: 'Shivajinagar Civic Block', status: 'operational', coords: { x: 75, y: 55 }, details: 'Line load 68%. All transformer banks within cooling spec.' },
];

export default function InfrastructureOverview() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  const [selectedAsset, setSelectedAsset] = useState<InfraAsset | null>(INITIAL_ASSETS[0]);

  // Compute location-specific telemetry
  const locationStats = useMemo(() => {
    switch (userLocation) {
      case 'Hadapsar':
        return {
          roadHealth: '61.2%',
          roadAlert: '29 reported',
          bridgeHealth: '88.5%',
          bridgeAlert: '4 sensor rings',
          damTelemetry: '95.0%',
          damAlert: '72% Reservoir',
          gridLoad: '84.5%',
          gridAlert: '15.5% vacancy',
          backlog: '24 cases',
          backlogAlert: '4 crews out',
          capex: '₹48.2M',
          capexAlert: '+15% optimized'
        };
      case 'Aundh':
        return {
          roadHealth: '85.0%',
          roadAlert: '8 reported',
          bridgeHealth: '96.2%',
          bridgeAlert: '2 sensor rings',
          damTelemetry: '98.0%',
          damAlert: '78% Reservoir',
          gridLoad: '52.0%',
          gridAlert: '48% vacancy',
          backlog: '7 cases',
          backlogAlert: '1 crew out',
          capex: '₹35.1M',
          capexAlert: '+8% optimized'
        };
      case 'Yerawada':
        return {
          roadHealth: '69.8%',
          roadAlert: '21 reported',
          bridgeHealth: '79.5%',
          bridgeAlert: '6 sensor rings',
          damTelemetry: '99.0%',
          damAlert: '84% Reservoir',
          gridLoad: '62.3%',
          gridAlert: '37.7% vacancy',
          backlog: '18 cases',
          backlogAlert: '3 crews out',
          capex: '₹44.8M',
          capexAlert: '+10% optimized'
        };
      case 'Shivajinagar':
      default:
        return {
          roadHealth: '76.5%',
          roadAlert: '18 reported',
          bridgeHealth: '91.0%',
          bridgeAlert: '3 sensor rings',
          damTelemetry: '98.0%',
          damAlert: '78% Reservoir',
          gridLoad: '68.0%',
          gridAlert: '32% vacancy',
          backlog: '14 cases',
          backlogAlert: '2 crews out',
          capex: '₹42.5M',
          capexAlert: '+12% optimized'
        };
    }
  }, [userLocation]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest text-[#4682B4] font-black">
          Municipal Works & Asset Management Desk
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
          Infrastructure Intelligence Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Real-time structural telemetry, smart electrical grids, dam volume dispatch, and maintenance CapEx/OpEx optimizations.
        </p>
      </div>

      {/* Dynamic 50km Location Scan Banner */}
      <LocationScopeBanner />

      {/* Quick Access KPI Cards Grid (6 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: Roads */}
        <Link href="/roads" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Road Health</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.roadHealth}</span>
              <span className="block text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.5 rounded mt-2">{locationStats.roadAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Bridges */}
        <Link href="/bridges" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Bridge Struct</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.bridgeHealth}</span>
              <span className="block text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded mt-2">{locationStats.bridgeAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Dams */}
        <Link href="/dams" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Dam Telemetry</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.damTelemetry}</span>
              <span className="block text-[9px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.5 rounded mt-2">{locationStats.damAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Grid */}
        <Link href="/grids" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Grid Load</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.gridLoad}</span>
              <span className="block text-[9px] font-semibold text-[#4682B4] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded mt-2">{locationStats.gridAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 5: Maintenance */}
        <Link href="/maintenance" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Planner Backlog</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.backlog}</span>
              <span className="block text-[9px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded mt-2">{locationStats.backlogAlert}</span>
            </CardContent>
          </Card>
        </Link>

        {/* Card 6: Budget */}
        <Link href="/budget" className="block no-underline group">
          <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-[#4682B4]/50 transition-all smooth-hover cursor-pointer relative overflow-hidden bg-card">
            <CardContent className="p-3 text-center">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">CapEx spent</span>
              <span className="block text-xl font-black text-[#4682B4] mt-1">{locationStats.capex}</span>
              <span className="block text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded mt-2">{locationStats.capexAlert}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Failure Risk Matrix & Budget Distribution */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Risk Matrix widget */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Layers className="w-4 h-4 text-[#4682B4]" />
                Infrastructure Failure Risk Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Asset probability vs. consequence of failure. Click dots to audit.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2 pb-6">
              
              {/* 5x5 Grid SVG Risk Matrix */}
              <div className="relative w-48 h-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Color Gradients backgrounds for Risk Matrix quadrants */}
                  {/* Low risk: green (bottom-left) */}
                  <rect x="0" y="60" width="40" height="40" className="fill-emerald-500/10" />
                  {/* Medium risk: yellow (diagonal) */}
                  <rect x="40" y="40" width="20" height="20" className="fill-amber-500/15" />
                  <rect x="0" y="40" width="40" height="20" className="fill-amber-500/10" />
                  <rect x="40" y="60" width="20" height="40" className="fill-amber-500/10" />
                  {/* High risk: orange */}
                  <rect x="60" y="20" width="40" height="40" className="fill-orange-500/15" />
                  <rect x="0" y="20" width="60" height="20" className="fill-orange-500/10" />
                  <rect x="60" y="60" width="40" height="40" className="fill-orange-500/10" />
                  {/* Critical risk: red (top-right) */}
                  <rect x="60" y="0" width="40" height="20" className="fill-red-500/25" />
                  <rect x="80" y="20" width="20" height="20" className="fill-red-500/20" />

                  {/* Grid Lines */}
                  {[20, 40, 60, 80].map((line) => (
                    <g key={line}>
                      <line x1={line} y1="0" x2={line} y2="100" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                      <line x1="0" y1={line} x2="100" y2={line} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" />
                    </g>
                  ))}

                  {/* Axis labels */}
                  <text x="5" y="96" className="fill-slate-400 text-[4px] font-bold">L:1</text>
                  <text x="88" y="96" className="fill-slate-400 text-[4px] font-bold">L:5</text>
                  <text x="2" y="8" className="fill-slate-400 text-[4px] font-bold">C:5</text>
                  <text x="2" y="90" className="fill-slate-400 text-[4px] font-bold">C:1</text>

                  {/* Plotted Assets */}
                  {INITIAL_ASSETS.map((asset) => {
                    // Coordinates mapping:
                    // likelihood: 1 - 5 maps to x: 10, 30, 50, 70, 90
                    // consequence: 1 - 5 maps to y: 90, 70, 50, 30, 10
                    const cx = 10 + (asset.likelihood - 1) * 20;
                    const cy = 90 - (asset.consequence - 1) * 20;
                    const isSelected = selectedAsset?.id === asset.id;
                    
                    return (
                      <g 
                        key={asset.id} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedAsset(asset)}
                      >
                        {isSelected && (
                          <circle cx={cx} cy={cy} r="5.5" className="fill-none stroke-[#4682B4] stroke-[1] animate-ping" />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="3.5"
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1] transition-all duration-200",
                            asset.status === 'alert' ? 'fill-red-500' :
                            asset.status === 'maintenance' ? 'fill-amber-500' : 'fill-emerald-500',
                            isSelected ? 'scale-125 stroke-[#4682B4]' : ''
                          )}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Risk Matrix Legend */}
              <div className="mt-4 flex gap-3 text-[9px] font-bold">
                <span className="flex items-center gap-1"><span className="h-2 w-2 bg-emerald-500 rounded-full" />Stable</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 bg-amber-500 rounded-full" />Repair</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500 rounded-full" />Critical</span>
              </div>
            </CardContent>
          </Card>

          {/* Budget chart preview */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <TrendingUp className="w-4 h-4 text-[#4682B4]" />
                Capital Allocations (CapEx vs OpEx)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-2 pb-6">
              
              {/* Custom SVG Budget Chart */}
              <div className="w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                <svg className="w-full aspect-[2/1] max-w-[200px]" viewBox="0 0 100 50">
                  {/* CapEx Bar */}
                  <rect x="15" y="5" width="22" height="40" className="fill-slate-100 dark:fill-slate-800" rx="3" />
                  <rect x="15" y="18" width="22" height="27" className="fill-[#4682B4]" rx="3" />
                  <text x="26" y="40" textAnchor="middle" className="fill-white text-[5px] font-black">₹28.4M</text>
                  <text x="26" y="48" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[4.5px] font-bold">CapEx</text>

                  {/* OpEx Bar */}
                  <rect x="63" y="5" width="22" height="40" className="fill-slate-100 dark:fill-slate-800" rx="3" />
                  <rect x="63" y="32" width="22" height="13" className="fill-[#B0C4DE]" rx="3" />
                  <text x="74" y="40" textAnchor="middle" className="fill-slate-800 text-[5px] font-black">₹14.1M</text>
                  <text x="74" y="48" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[4.5px] font-bold">OpEx</text>
                </svg>
              </div>

              <div className="w-full mt-4">
                <Link href="/budget" className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#4682B4]/30 text-xs font-semibold text-[#4682B4] hover:bg-[#4682B4]/5 transition-colors no-underline">
                  Optimize Expenditures
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GIS Map & Inspector Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GIS Asset Location Map */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Map className="w-5 h-5 text-[#4682B4]" />
                Smart City Infrastructure GIS Layout
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time mapping of structural nodes. Select an asset on the matrix or map to inspect parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* GIS Map Canvas (3 cols) */}
              <div className="md:col-span-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <svg className="w-full aspect-square max-w-[240px]" viewBox="0 0 160 160">
                  {/* Grid lines layout */}
                  <line x1="80" y1="0" x2="80" y2="160" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="0" y1="80" x2="160" y2="80" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="2,2" />

                  {/* River line crossing */}
                  <path
                    d="M 0,40 Q 60,30 110,60 T 160,50"
                    fill="transparent"
                    className="stroke-[#4682B4]/20 stroke-[8] fill-none"
                  />

                  {/* District Boundaries */}
                  <rect x="10" y="10" width="140" height="140" fill="transparent" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1" rx="5" />
                  <text x="20" y="145" className="fill-slate-400 text-[6px] font-bold tracking-wider uppercase">Pune Municipal Corp.</text>

                  {/* Plotted Assets */}
                  {INITIAL_ASSETS.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <g
                        key={asset.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        {/* Selector ring */}
                        {isSelected && (
                          <circle cx={asset.coords.x} cy={asset.coords.y} r="9" className="fill-none stroke-[#4682B4] stroke-[1.5] animate-pulse" />
                        )}
                        {/* Asset dot */}
                        <circle
                          cx={asset.coords.x}
                          cy={asset.coords.y}
                          r="5.5"
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1.5]",
                            asset.status === 'alert' ? 'fill-red-500' :
                            asset.status === 'maintenance' ? 'fill-amber-500' : 'fill-emerald-500'
                          )}
                        />
                        {/* Icon identifier text */}
                        <text
                          x={asset.coords.x}
                          y={asset.coords.y - 8}
                          textAnchor="middle"
                          className="fill-slate-500 dark:fill-slate-400 text-[5px] font-bold font-sans uppercase"
                        >
                          {asset.type}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Asset Inspector (2 cols) */}
              <div className="md:col-span-2 flex flex-col justify-between">
                {selectedAsset ? (
                  <div className="space-y-4">
                    <div className="pb-2 border-b border-border-subtle">
                      <span className="text-[10px] font-black uppercase text-[#4682B4]">Asset Audit Panel</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1">{selectedAsset.name}</h4>
                    </div>

                    <div className="space-y-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Telemetry Location:</span>
                        <span>{selectedAsset.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Asset Class:</span>
                        <span className="uppercase">{selectedAsset.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Health Grade:</span>
                        <span className={cn(
                          "font-bold",
                          selectedAsset.health >= 90 ? 'text-emerald-500' :
                          selectedAsset.health >= 80 ? 'text-[#4682B4]' : 'text-amber-500'
                        )}>{selectedAsset.health}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Operations:</span>
                        <span className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          selectedAsset.status === 'alert' ? 'bg-red-500/10 text-red-600' :
                          selectedAsset.status === 'maintenance' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        )}>
                          {selectedAsset.status}
                        </span>
                      </div>
                    </div>

                    {/* Asset Details info note */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg text-xs leading-normal">
                      <span className="block font-black text-slate-400 text-[8px] uppercase mb-1">Diagnostic Log</span>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">{selectedAsset.details}</p>
                    </div>

                    {/* Navigation shortcut links */}
                    <div className="pt-2">
                      <Link 
                        href={
                          selectedAsset.type === 'road' ? '/roads' :
                          selectedAsset.type === 'bridge' ? '/bridges' :
                          selectedAsset.type === 'dam' ? '/dams' : '/grids'
                        }
                        className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs no-underline cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5 mr-1" />
                        Audit Telemetry Dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs text-slate-400">Select an asset from the map or risk matrix to inspect parameters.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick operations guide */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Wrench className="w-4 h-4 text-[#4682B4]" />
                Infrastructure Maintenance Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="p-3 bg-[#4682B4]/5 border border-[#4682B4]/20 rounded-lg">
                  <h5 className="font-bold text-[#4682B4] mb-1 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Pending Work Orders
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                    14 active tasks scheduled for municipal crew dispatch. Average resolution SLA sits under 48 hours.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    Capital Allocation Target
                  </h5>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                    Reallocating funds from administration parameters to bridge cable reinforcement decreases core structural failure indices.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
