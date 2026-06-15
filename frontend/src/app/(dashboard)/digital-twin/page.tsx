// app/(dashboard)/digital-twin/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Layers, MapPin, Activity, TrendingUp, AlertTriangle, ShieldCheck, 
  Zap, Building, RefreshCw, Info, PlayCircle, StopCircle, ArrowLeft, Waves
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

type SimulationScenario = 'None' | 'Flood' | 'TrafficSurge' | 'Failure';

interface TelemetryNode {
  id: string;
  name: string;
  category: 'Infrastructure' | 'Energy' | 'Health' | 'Water';
  coords: { x: number; y: number };
  status: 'optimal' | 'warning' | 'critical';
  details: {
    metric: string;
    value: string;
    threshold: string;
    engineerLead: string;
    recentAudit: string;
  };
}

const INITIAL_NODES: TelemetryNode[] = [
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
];

export default function DigitalTwinOverview() {
  const { setActiveTab } = useUiStore();
  const [nodes, setNodes] = useState<TelemetryNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-dst-1');
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('None');

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Adjust telemetry nodes based on active simulation scenario
  const activeNodes = useMemo(() => {
    if (activeScenario === 'None') return INITIAL_NODES;

    return INITIAL_NODES.map(node => {
      const updated = { ...node, details: { ...node.details } };
      if (activeScenario === 'Flood') {
        if (node.category === 'Water') {
          updated.status = 'critical';
          updated.details.value = '98.5% Silt Overflow';
        } else if (node.category === 'Infrastructure') {
          updated.status = 'critical';
          updated.details.value = '92.4 MPa Stress limit';
        }
      } else if (activeScenario === 'TrafficSurge') {
        if (node.category === 'Infrastructure') {
          updated.status = 'warning';
          updated.details.value = '84.2 MPa Stress';
        } else if (node.category === 'Health') {
          updated.status = 'warning';
          updated.details.value = '76% Bed Fill';
        }
      } else if (activeScenario === 'Failure') {
        updated.status = 'critical';
        if (node.category === 'Energy') {
          updated.details.value = 'Thermal Collapse / OFF';
        } else if (node.category === 'Infrastructure') {
          updated.details.value = 'Joint Shear Collapse';
        } else if (node.category === 'Water') {
          updated.details.value = 'Pumping Station Outage';
        }
      }
      return updated;
    });
  }, [activeScenario]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/infrastructure" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4]">Module 10</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Digital Twin Infrastructure Simulator</h1>
        </div>
      </div>

      {/* Simulator Scenario Selectors */}
      <div className="space-y-3">
        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Active Simulation Control Panel</span>
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: 'None', label: 'Live Telemetry Stream', icon: Activity },
            { id: 'Flood', label: 'Flood Surge Scenario', icon: Waves },
            { id: 'TrafficSurge', label: 'Traffic Surge Scenario', icon: TrendingUp },
            { id: 'Failure', label: 'Cascade Failure Scenario', icon: AlertTriangle }
          ].map((scen) => {
            const Icon = scen.icon;
            const isActive = activeScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setActiveScenario(scen.id as SimulationScenario)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-black border cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5",
                  isActive 
                    ? scen.id === 'Failure' 
                      ? "bg-red-600 border-red-600 text-white" 
                      : "bg-[#4682B4] border-[#4682B4] text-white" 
                    : "bg-white dark:bg-[#0A1228] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {scen.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Interactive Isometric Wireframe Grid SVG */}
        <div className="xl:col-span-8">
          <div className="relative border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] rounded-2xl overflow-hidden aspect-video shadow-sm">
            <svg className="w-full h-full p-6 text-slate-200 dark:text-[#1E293B]" viewBox="0 0 500 300">
              
              {/* Isometric grid lines */}
              <path d="M 50,150 L 250,50 L 450,150 L 250,250 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
              <path d="M 100,125 L 250,200 L 400,125" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,2" />
              <path d="M 150,100 L 250,150 L 350,100" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1,2" />

              {/* Laser Sweep line overlaying twin */}
              <line x1="50" y1="150" x2="450" y2="150" stroke="#4682B4" strokeWidth="1.5" className="laser-sweep stroke-dashed" />

              {/* Render simulated Nodes */}
              {activeNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                let markerColor = 'text-[#4682B4]';
                if (node.status === 'warning') markerColor = 'text-amber-500';
                else if (node.status === 'critical') markerColor = 'text-red-500';

                return (
                  <g key={node.id} onClick={() => setSelectedNodeId(node.id)} className="cursor-pointer">
                    <line x1={node.coords.x} y1={node.coords.y} x2={node.coords.x} y2={node.coords.y - 40} stroke="currentColor" strokeWidth="1.2" />
                    <circle cx={node.coords.x} cy={node.coords.y - 40} r="4.5" className={cn("fill-current", markerColor)} />
                    {isSelected && <circle cx={node.coords.x} cy={node.coords.y - 40} r="10" className="fill-none stroke-[#4682B4] stroke-[1] animate-ping" />}
                  </g>
                );
              })}

            </svg>
          </div>
        </div>

        {/* Right: Simulation Inspector & Outlay Panel */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[9px] font-black uppercase text-[#4682B4] tracking-widest">Simulation Audit Logs</span>
              <CardTitle className="text-base font-black text-slate-950 dark:text-white mt-1">Twin Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1">
              {activeScenario === 'None' && (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-[#4682B4] animate-pulse" />
                  <p className="font-bold">No active simulation overlay.</p>
                  <p>Twin scanning Pune telemetry nodes at real-time intervals.</p>
                </div>
              )}

              {activeScenario === 'Flood' && (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-red-500/10 text-red-950 dark:text-red-400 border border-red-500/20 rounded-xl space-y-1 font-bold">
                    <h4 className="font-black text-sm uppercase">Flood Simulation Active</h4>
                    <p>Affected Roads: Yerawada bed causeway (CLOSED)</p>
                    <p>Bridge Joint Stress: Sangam Bridge Strain (+42% Delta)</p>
                    <p>Dam status: Khadakwasla spillway gates overflow alert</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400">Recovery Estimation</span>
                    <div className="flex justify-between font-bold">
                      <span>Restoration Time:</span>
                      <span className="font-mono text-red-500">18 Hours</span>
                    </div>
                  </div>
                </div>
              )}

              {activeScenario === 'TrafficSurge' && (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-[#4682B4]/10 text-slate-950 dark:text-[#4682B4] border border-[#4682B4]/20 rounded-xl space-y-1 font-bold">
                    <h4 className="font-black text-sm uppercase">Traffic Surge Simulation Active</h4>
                    <p>Congestion score: Sangamwadi (92%), Hadapsar Bypass (84%)</p>
                    <p>Infrastructure strain: Aundh Segment Wear multiplier at 1.45x</p>
                    <p>Hospital transit delayed: Primary clinic bed occupancy warning</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400">Recovery Estimation</span>
                    <div className="flex justify-between font-bold">
                      <span>Restoration Time:</span>
                      <span className="font-mono text-amber-500">4 Hours</span>
                    </div>
                  </div>
                </div>
              )}

              {activeScenario === 'Failure' && (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3 bg-red-550/10 text-red-950 dark:text-red-400 border border-red-500/25 rounded-xl space-y-1 font-bold">
                    <h4 className="font-black text-sm uppercase">Grid Cascading Failure Scenario</h4>
                    <p>Feeder outage: Hadapsar substation overload</p>
                    <p>Cascading collapse: Shivajinagar substation shuts down</p>
                    <p>Water pumping outage: Central drainage gates lock closed</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-lg space-y-2">
                    <span className="block text-[8px] uppercase font-bold text-slate-400">Recovery Estimation</span>
                    <div className="flex justify-between font-bold">
                      <span>Restoration Time:</span>
                      <span className="font-mono text-red-500">36 Hours</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
