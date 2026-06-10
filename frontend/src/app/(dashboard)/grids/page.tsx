'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft, 
  Activity, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Compass,
  Radio
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';

interface GridNode {
  id: string;
  name: string;
  voltage: number; // kV
  load: number; // MW
  capacity: number; // max MW
  temp: number; // Celsius
  status: 'operational' | 'overload' | 'blackout';
  coords: { x: number; y: number }; // SVG Map coordinates
}

const INITIAL_NODES: GridNode[] = [
  { id: 'gn-1', name: 'Hadapsar Substation 4A', voltage: 220, load: 145, capacity: 150, temp: 84, status: 'overload', coords: { x: 125, y: 65 } },
  { id: 'gn-2', name: 'Shivajinagar Central Hub', voltage: 220, load: 88, capacity: 200, temp: 52, status: 'operational', coords: { x: 75, y: 55 } },
  { id: 'gn-3', name: 'Kothrud Substation Node', voltage: 110, load: 42, capacity: 100, temp: 48, status: 'operational', coords: { x: 30, y: 85 } },
  { id: 'gn-4', name: 'Aundh Feed Station', voltage: 110, load: 65, capacity: 100, temp: 50, status: 'operational', coords: { x: 35, y: 25 } },
  { id: 'gn-5', name: 'Yerawada Distribution Mast', voltage: 110, load: 0, capacity: 120, temp: 22, status: 'blackout', coords: { x: 115, y: 20 } },
];

export default function GridsDashboard() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  const [nodes, setNodes] = useState<GridNode[]>(INITIAL_NODES);
  const [selectedNode, setSelectedNode] = useState<GridNode | null>(INITIAL_NODES[0]);
  const [gridFrequency, setGridFrequency] = useState<number>(49.8); // Hz (normal is 50.0)

  // Set default baselines based on location
  useEffect(() => {
    switch (userLocation) {
      case 'Hadapsar':
        setNodes(INITIAL_NODES.map(n => {
          if (n.id === 'gn-1') return { ...n, load: 148, temp: 88, status: 'overload' };
          return n;
        }));
        setGridFrequency(49.5);
        break;
      case 'Aundh':
        setNodes(INITIAL_NODES.map(n => {
          if (n.id === 'gn-4') return { ...n, load: 45, temp: 42 };
          if (n.id === 'gn-1') return { ...n, load: 105, temp: 55, status: 'operational' };
          return n;
        }));
        setGridFrequency(50.0);
        break;
      case 'Yerawada':
        setNodes(INITIAL_NODES.map(n => {
          if (n.id === 'gn-5') return { ...n, load: 92, temp: 58, status: 'operational' };
          return n;
        }));
        setGridFrequency(49.9);
        break;
      case 'Shivajinagar':
      default:
        setNodes(INITIAL_NODES);
        setGridFrequency(49.8);
        break;
    }
  }, [userLocation]);

  // Sync selected node
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find(n => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [nodes, selectedNode]);

  const toggleNodeStatus = (id: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === id) {
        let nextStatus: 'operational' | 'overload' | 'blackout' = 'operational';
        if (n.status === 'operational') nextStatus = 'overload';
        else if (n.status === 'overload') nextStatus = 'blackout';
        
        // Adjust load/temp accordingly
        const loadVal = nextStatus === 'blackout' ? 0 : nextStatus === 'overload' ? n.capacity - 5 : Math.round(n.capacity * 0.6);
        const tempVal = nextStatus === 'blackout' ? 22 : nextStatus === 'overload' ? 84 : 52;
        
        return { ...n, status: nextStatus, load: loadVal, temp: tempVal };
      }
      return n;
    }));
  };

  const reallocateGridLoad = () => {
    // Distribute load away from overloaded node to other active nodes
    setNodes(prev => {
      const overloaded = prev.find(n => n.status === 'overload');
      if (!overloaded) return prev;
      
      const excessLoad = overloaded.load - (overloaded.capacity * 0.7); // reduce to 70%
      if (excessLoad <= 0) return prev;

      return prev.map(n => {
        if (n.id === overloaded.id) {
          return { ...n, load: Math.round(n.capacity * 0.7), temp: 58, status: 'operational' };
        }
        if (n.status === 'operational') {
          // Add share of excess load
          const share = Math.round(excessLoad / 2);
          const nextLoad = Math.min(n.capacity, n.load + share);
          const nextTemp = n.temp + Math.round(share * 0.2);
          return { ...n, load: nextLoad, temp: nextTemp };
        }
        return n;
      });
    });
    setGridFrequency(50.0);
  };

  const getNodeColor = (node: GridNode) => {
    if (node.status === 'blackout') return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    if (node.status === 'overload') return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  };

  const getSVGNodeColor = (node: GridNode) => {
    if (node.status === 'blackout') return 'fill-slate-400';
    if (node.status === 'overload') return 'fill-red-500';
    return 'fill-emerald-500';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2">
        <Link href="/infrastructure" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 no-underline bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-border-subtle">
          <ArrowLeft className="w-3.5 h-3.5" />
          Infrastructure Desk
        </Link>
        <span className="text-xs text-slate-400 font-bold">•</span>
        <span className="text-xs text-[#4682B4] font-bold">Grid Monitoring</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-8 h-8 text-[#4682B4] animate-pulse" />
            Grid Monitoring & Transformer Telemetry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor substation kV outputs, power grid frequencies, transformer heat levels, and execute emergency load balancing.
          </p>
        </div>
        <div>
          <Button 
            onClick={reallocateGridLoad}
            className="bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Execute Load Balancing
          </Button>
        </div>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Downstream Alert Banner */}
      {nodes.some(n => n.status === 'overload') && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500 text-white animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 text-sm leading-none flex items-center gap-2">
                ACTIVE GRID WARNING: TRANS-LOAD CRITICAL LIMIT
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
              </h3>
              <p className="text-xs text-red-600/90 dark:text-red-300/80 mt-1 font-medium">
                Hadapsar Substation 4A load ratio has exceeded 95%. Phase frequency fluctuations detected. Recommended to run load balancing re-routes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Line Frequency & Transformer Temp */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Line Frequency */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Grid Line Frequency (Hz)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Gauge */}
                {/* Scale is 49.0 to 51.0 Hz */}
                {/* Math: percentage = (frequency - 49) / 2 */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-300",
                      gridFrequency < 49.9 ? "stroke-red-500" : "stroke-emerald-500"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.max(0, Math.min(2, gridFrequency - 49))) / 2}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{gridFrequency.toFixed(2)} Hz</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Frequency</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-[#4682B4]/20 bg-[#4682B4]/5">
                <span className="text-slate-600 dark:text-slate-400">Grid State:</span>
                <span className={cn(
                  "font-bold uppercase",
                  gridFrequency < 49.9 ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {gridFrequency < 49.9 ? 'Frequency Dip' : 'Stable Feed'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Selected Node Transformer Temp */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Compass className="w-4 h-4 text-[#4682B4]" />
                Transformer Core Temp (°C)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Gauge */}
                {/* Scale is 20 to 100 Celsius */}
                {/* Math: percentage = (temp - 20) / 80 */}
                <svg className="w-full h-full transform -rotate-225" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={cn(
                      "transition-all duration-300",
                      selectedNode && selectedNode.temp >= 80 ? "stroke-red-500" :
                      selectedNode && selectedNode.temp >= 60 ? "stroke-orange-500" : "stroke-emerald-500"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.max(0, Math.min(80, (selectedNode?.temp || 50) - 20))) / 80}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedNode?.temp || 52}°C</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Core Temp</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-[#4682B4]/20 bg-[#4682B4]/5">
                <span className="text-slate-600 dark:text-slate-400">Cooling System:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {selectedNode && selectedNode.temp >= 80 ? 'Fans Full Speed' : 'Passive'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: GIS Grid Topology SVG Map & Node Inspector */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Power Grid Topology SVG Map */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Compass className="w-5 h-5 text-[#4682B4]" />
                Power Grid Topology Map
              </CardTitle>
              <CardDescription className="text-xs">
                Transmission grid lines and distribution masts. Click nodes to toggle status and trigger overload shedding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Interactive grid topology map */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Transmission lines layout */}
                  {/* Line 1: Aundh (35, 25) to Shivajinagar (75, 55) */}
                  <line x1="35" y1="25" x2="75" y2="55" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  <line x1="35" y1="25" x2="75" y2="55" className={cn("stroke-[#4682B4]/30 stroke-[1.5]", nodes[3].status === 'operational' ? 'stroke-emerald-500/20' : '')} />

                  {/* Line 2: Shivajinagar (75, 55) to Hadapsar (125, 65) */}
                  <line x1="75" y1="55" x2="125" y2="65" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />
                  <line x1="75" y1="55" x2="125" y2="65" className={cn("stroke-[2]", nodes[0].status === 'overload' ? 'stroke-red-500 animate-pulse' : 'stroke-emerald-500/20')} />

                  {/* Line 3: Shivajinagar (75, 55) to Kothrud (30, 85) */}
                  <line x1="75" y1="55" x2="30" y2="85" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5]" />

                  {/* Line 4: Yerawada (115, 20) to Shivajinagar (75, 55) */}
                  <line x1="115" y1="20" x2="75" y2="55" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5] stroke-dasharray[2,2]" />

                  {/* Plotted nodes */}
                  {nodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <g 
                        key={node.id} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedNode(node)}
                      >
                        {isSelected && (
                          <circle cx={node.coords.x} cy={node.coords.y} r="8" className="fill-none stroke-[#4682B4] stroke-[1] animate-ping" />
                        )}
                        <circle
                          cx={node.coords.x}
                          cy={node.coords.y}
                          r="4.5"
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1.5] transition-all duration-200",
                            getSVGNodeColor(node)
                          )}
                        />
                        <text x={node.coords.x} y={node.coords.y - 7} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[3.5px] font-bold">
                          {node.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />Operational</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />Overloaded</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-slate-400 rounded-full" />Blackout/Off</span>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30">
                {selectedNode ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-bold">Substation Inspector</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {selectedNode.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Voltage class: <strong className="text-slate-700 dark:text-slate-300">{selectedNode.voltage} kV</strong> • Temperature: <strong className="text-slate-700 dark:text-slate-300">{selectedNode.temp}°C</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={cn(
                        "px-3 py-1.5 rounded-lg border text-center min-w-[120px]",
                        getNodeColor(selectedNode)
                      )}>
                        <span className="block text-[8px] uppercase font-black text-slate-400">Load</span>
                        <span className="text-xs font-extrabold leading-none">{selectedNode.load} MW / {selectedNode.capacity}</span>
                      </div>
                      <button
                        onClick={() => toggleNodeStatus(selectedNode.id)}
                        className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Toggle Status
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    Click a node on the power grid map to inspect parameters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grid Health Status logs */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Transmission Grid Health Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2.5 text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-start gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">Line Frequency Stable:</strong>
                  Primary grid frequency recovered to 50.00 Hz after automated re-allocation.
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
