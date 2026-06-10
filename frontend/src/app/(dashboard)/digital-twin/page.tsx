'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  MapPin, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  HeartPulse, 
  Building,
  RefreshCw,
  Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

type TwinScope = 'District' | 'State' | 'National';

interface TelemetryNode {
  id: string;
  name: string;
  category: 'Infrastructure' | 'Energy' | 'Health' | 'Water';
  coords: { x: number; y: number }; // Isometric grid offsets
  status: 'optimal' | 'warning' | 'critical';
  details: {
    metric: string;
    value: string;
    threshold: string;
    engineerLead: string;
    recentAudit: string;
  };
}

const MOCK_NODES: Record<TwinScope, TelemetryNode[]> = {
  District: [
    {
      id: 'node-dst-1',
      name: 'Hadapsar Causeway Bridge A',
      category: 'Infrastructure',
      coords: { x: 150, y: 120 },
      status: 'warning',
      details: {
        metric: 'Structural Strain Factor',
        value: '78.4 MPa',
        threshold: '90.0 MPa Limit',
        engineerLead: 'PWD Sector 4 Division',
        recentAudit: '08 Jun 2026'
      }
    },
    {
      id: 'node-dst-2',
      name: 'Sector 4-B High-Voltage Grid Substation',
      category: 'Energy',
      coords: { x: 300, y: 160 },
      status: 'optimal',
      details: {
        metric: 'Transformer Core Heat',
        value: '54.2 °C',
        threshold: '80.0 °C Limit',
        engineerLead: 'MSEDCL Grid Lead',
        recentAudit: '09 Jun 2026'
      }
    },
    {
      id: 'node-dst-3',
      name: 'Wards 14-15 Central Drainage Gates',
      category: 'Water',
      coords: { x: 220, y: 240 },
      status: 'critical',
      details: {
        metric: 'Silt Blockage Coefficient',
        value: '84.8% Blocked',
        threshold: '50.0% Max Alert',
        engineerLead: 'Municipal Water Works',
        recentAudit: '10 Jun 2026'
      }
    },
    {
      id: 'node-dst-4',
      name: 'Hadapsar Primary Diagnostic Clinic',
      category: 'Health',
      coords: { x: 380, y: 220 },
      status: 'optimal',
      details: {
        metric: 'Asthma Ward Occupancy',
        value: '22% Bed Fill',
        threshold: '85.0% Limit',
        engineerLead: 'MOHFW Division Head',
        recentAudit: '10 Jun 2026'
      }
    }
  ],
  State: [
    {
      id: 'node-st-1',
      name: 'Pune Industrial Power Loop Corridor',
      category: 'Energy',
      coords: { x: 200, y: 140 },
      status: 'optimal',
      details: {
        metric: 'Trunk Power Load Balance',
        value: '72% Load factor',
        threshold: '95% Peak Alert',
        engineerLead: 'State Electricity Transmission Corp',
        recentAudit: '07 Jun 2026'
      }
    },
    {
      id: 'node-st-2',
      name: 'Koyna Dam Gate discharge controller',
      category: 'Water',
      coords: { x: 340, y: 200 },
      status: 'warning',
      details: {
        metric: 'Inflow vs Outflow Rate',
        value: '42,000 Cusecs Out',
        threshold: '50k Warning',
        engineerLead: 'State Water Irrigation Dept',
        recentAudit: '09 Jun 2026'
      }
    }
  ],
  National: [
    {
      id: 'node-nat-1',
      name: 'Unified Health Consent Ledger API',
      category: 'Health',
      coords: { x: 250, y: 180 },
      status: 'optimal',
      details: {
        metric: 'API Query Response Speed',
        value: '142 ms Average',
        threshold: '500 ms Max SLA',
        engineerLead: 'National Informatics Center',
        recentAudit: '10 Jun 2026'
      }
    }
  ]
};

export default function DigitalTwinPage() {
  const { setActiveTab } = useUiStore();
  const [selectedScope, setSelectedScope] = useState<TwinScope>('District');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-dst-1');
  const [radarSweep, setRadarSweep] = useState<boolean>(true);

  useEffect(() => {
    setActiveTab('Digital Twin');
  }, [setActiveTab]);

  // Handle active nodes per scope selection
  const activeNodes = useMemo(() => {
    return MOCK_NODES[selectedScope] || [];
  }, [selectedScope]);

  // Set default node when scope changes to prevent out of bounds selection
  useEffect(() => {
    if (activeNodes.length > 0) {
      setSelectedNodeId(activeNodes[0].id);
    }
  }, [activeNodes]);

  const selectedNode = useMemo(() => {
    return activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];
  }, [activeNodes, selectedNodeId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* CSS Keyframes injected directly for scanning sweep radar animations */}
      <style jsx global>{`
        @keyframes scanSweep {
          0% { transform: translateY(-50px) scaleY(1); opacity: 0.1; }
          50% { transform: translateY(150px) scaleY(1.5); opacity: 0.5; }
          100% { transform: translateY(350px) scaleY(1); opacity: 0.1; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .laser-sweep {
          animation: scanSweep 4s linear infinite;
        }
        .pulse-indicator {
          animation: pulseDot 2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-blue-900 dark:text-brand-yellow font-bold">
              AI Cyber-Physical Infrastructure Twin
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Digital Twin Interface
          </h1>
          <p className="text-slate-850 dark:text-slate-400 text-sm mt-0.5 font-medium">
            Futuristic 3D isometric scanning wireframe representing active structural, grid, and water nodes.
          </p>
        </div>

        {/* Scope Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['District', 'State', 'National'] as TwinScope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => setSelectedScope(scope)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all",
                selectedScope === scope
                  ? "bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-900 hover:text-blue-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-850"
              )}
            >
              {scope === 'District' ? '🏢 District Twin' : scope === 'State' ? '🗺️ State Twin' : '🇮🇳 National Twin'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Double-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Isometric 3D scanning grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col border border-border bg-card rounded-2xl shadow-sm overflow-hidden h-[540px] relative">
          
          {/* Controls Bar Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-xs border border-border px-3 py-2 rounded-xl shadow-xs flex items-center gap-3 select-none">
            <span className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400">Radar Sweeper</span>
            <button
              onClick={() => setRadarSweep(!radarSweep)}
              className={cn(
                "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer",
                radarSweep ? "bg-blue-600 dark:bg-emerald-600" : "bg-slate-350 dark:bg-slate-850"
              )}
            >
              <div className={cn(
                "bg-white w-4 h-4 rounded-full shadow-md transition-transform",
                radarSweep ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>

          <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-450 uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Telemetry online</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 w-full h-full bg-slate-50 dark:bg-slate-950/40 relative overflow-hidden flex items-center justify-center">
            
            {/* Isometric Wireframe SVG Canvas */}
            <svg 
              viewBox="0 0 500 400" 
              className="w-full h-full max-w-xl text-slate-200 dark:text-slate-900"
            >
              
              {/* Grid Outline */}
              {/* Back to Front grid lines representing structural elevation */}
              {Array.from({ length: 9 }).map((_, idx) => {
                const step = idx * 40;
                return (
                  <React.Fragment key={idx}>
                    {/* Diagonal direction A */}
                    <line x1={50 + step} y1="50" x2={250 + step} y2="350" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    {/* Diagonal direction B */}
                    <line x1={450 - step} y1="50" x2={250 - step} y2="350" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                  </React.Fragment>
                );
              })}

              {/* Connecting virtual vectors between nodes */}
              {activeNodes.length > 1 && (
                <path
                  d={`M ${activeNodes[0].coords.x} ${activeNodes[0].coords.y} 
                      ${activeNodes.map(n => `L ${n.coords.x} ${n.coords.y}`).join(' ')} Z`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="4,4"
                  className="text-blue-900/30 dark:text-emerald-500/20"
                />
              )}

              {/* Laser Scan Sweep Line */}
              {radarSweep && (
                <line 
                  x1="20" 
                  y1="0" 
                  x2="480" 
                  y2="0" 
                  stroke={selectedScope === 'District' ? '#3b82f6' : selectedScope === 'State' ? '#f59e0b' : '#10b981'}
                  strokeWidth="2.5" 
                  className="laser-sweep"
                />
              )}

              {/* Interactive Telemetry Node Rings/Pins */}
              {activeNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                
                let markerColor = 'text-blue-600 dark:text-emerald-500';
                let pulseColor = 'bg-blue-600/20 dark:bg-emerald-500/25';
                if (node.status === 'warning') {
                  markerColor = 'text-amber-500';
                  pulseColor = 'bg-amber-500/20';
                } else if (node.status === 'critical') {
                  markerColor = 'text-rose-500';
                  pulseColor = 'bg-rose-500/20';
                }

                return (
                  <g 
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer group"
                  >
                    {/* Isometric structural tower cylinder sketch */}
                    <line 
                      x1={node.coords.x} 
                      y1={node.coords.y} 
                      x2={node.coords.x} 
                      y2={node.coords.y - 35} 
                      stroke="currentColor" 
                      strokeWidth="1.5" 
                    />
                    <circle 
                      cx={node.coords.x} 
                      cy={node.coords.y - 35} 
                      r="4" 
                      className="fill-card stroke-current text-slate-400 dark:text-slate-700" 
                      strokeWidth="1.5" 
                    />

                    {/* Ground base anchor circle */}
                    <ellipse
                      cx={node.coords.x}
                      cy={node.coords.y}
                      rx="12"
                      ry="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                    />

                    {/* Glowing active node target */}
                    <circle
                      cx={node.coords.x}
                      cy={node.coords.y - 35}
                      r={isSelected ? "9" : "6"}
                      className={cn("fill-current pulse-indicator transition-all duration-300", markerColor)}
                      fillOpacity={isSelected ? "0.35" : "0.2"}
                    />
                    <circle
                      cx={node.coords.x}
                      cy={node.coords.y - 35}
                      r="2.5"
                      className={cn("fill-current", markerColor)}
                    />

                    {/* Tooltip name banner */}
                    <text
                      x={node.coords.x}
                      y={node.coords.y - 50}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="8"
                      fontWeight="bold"
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none px-2",
                        isSelected ? "opacity-100 text-blue-950 dark:text-white" : "text-slate-900 dark:text-slate-400"
                      )}
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}

            </svg>

            {/* Bottom Wireframe Details Overlay */}
            <div className="absolute bottom-4 left-4 z-10 text-[9px] font-mono text-slate-900 dark:text-slate-500 font-bold select-none leading-none space-y-1">
              <p>CANVAS HEIGHT: 500PX</p>
              <p>ISOMETRIC ROTATION: 30°</p>
              <p>Z-AXIS PERSPECTIVE: ACTIVE</p>
            </div>

          </div>
        </div>

        {/* Right: Telemetry Node Details Auditing panel (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {selectedNode ? (
            <Card className="bg-card border-border shadow-xs h-full flex flex-col justify-between">
              
              {/* Header Details */}
              <CardHeader className="p-4.5 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-350 rounded border border-border">
                    {selectedNode.category.toUpperCase()}
                  </span>
                  
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                    selectedNode.status === 'optimal' ? 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                    selectedNode.status === 'warning' ? 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-500/30' :
                    'bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-500/30'
                  )}>
                    ● {selectedNode.status}
                  </span>
                </div>

                <CardTitle className="text-sm font-extrabold text-slate-950 dark:text-white mt-3 leading-snug">
                  {selectedNode.name}
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-900 dark:text-slate-400 font-medium">
                  Selected telemetry node telemetry data logs.
                </CardDescription>
              </CardHeader>

              {/* Parameters list */}
              <CardContent className="p-4.5 space-y-4 flex-1">
                
                {/* Metric Display */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-450">{selectedNode.details.metric}</p>
                  <p className={cn(
                    "text-xl font-black font-mono mt-1",
                    selectedNode.status === 'critical' ? 'text-rose-600 dark:text-rose-450' :
                    selectedNode.status === 'warning' ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-450'
                  )}>
                    {selectedNode.details.value}
                  </p>
                  <p className="text-[9px] text-slate-900 dark:text-slate-500 mt-1 font-bold">Safety Margin limit: {selectedNode.details.threshold}</p>
                </div>

                {/* Audit details metadata */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-slate-900 dark:text-slate-500 font-bold">Maintenance Lead</span>
                    <span className="font-bold text-slate-950 dark:text-slate-350">{selectedNode.details.engineerLead}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-slate-900 dark:text-slate-500 font-bold">Recent Physical Audit</span>
                    <span className="font-bold text-slate-950 dark:text-slate-350">{selectedNode.details.recentAudit}</span>
                  </div>

                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-900 dark:text-slate-500 font-bold">Sensor ID</span>
                    <span className="font-mono font-bold text-[10px] text-slate-950 dark:text-slate-400">{selectedNode.id.toUpperCase()}</span>
                  </div>
                </div>

              </CardContent>

              {/* Warning/Action message in footer */}
              <div className="p-4.5 bg-slate-100 dark:bg-slate-900 border-t border-border space-y-2 rounded-b-2xl">
                {selectedNode.status === 'critical' ? (
                  <div className="p-2.5 bg-red-500/10 text-red-950 dark:text-red-400 rounded-lg border border-red-500/20 text-[10px] font-bold flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>Immediate dispatch required! Silt layers have blocked the flow gates.</span>
                  </div>
                ) : selectedNode.status === 'warning' ? (
                  <div className="p-2.5 bg-amber-500/10 text-amber-950 dark:text-amber-400 rounded-lg border border-amber-500/20 text-[10px] font-bold flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Physical check scheduled. Strain levels are slightly elevated.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-950 dark:text-emerald-450 rounded-lg border border-emerald-500/20 text-[10px] font-bold flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>This infrastructure sub-unit compiles with regulatory code safety.</span>
                  </div>
                )}
              </div>

            </Card>
          ) : (
            <div className="text-center py-12 text-slate-800 dark:text-slate-400 font-medium">
              Click a wireframe node on the grid scanner to inspect telemetry logs.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
