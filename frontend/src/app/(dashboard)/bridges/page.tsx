'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

interface BridgeNode {
  id: string;
  name: string;
  stress: number; // psi
  limit: number; // max psi
  cracks: 'none' | 'hairline' | 'minor' | 'critical';
  status: 'good' | 'alert' | 'danger';
  coords: { x: number; y: number }; // SVG blueprint coordinates
}

const INITIAL_NODES: BridgeNode[] = [
  { id: 'bn-1', name: 'West Abutment Anchor', stress: 1800, limit: 5000, cracks: 'none', status: 'good', coords: { x: 15, y: 55 } },
  { id: 'bn-2', name: 'Pier 1 Support Base', stress: 3200, limit: 6000, cracks: 'hairline', status: 'good', coords: { x: 45, y: 70 } },
  { id: 'bn-3', name: 'Center Hanger Tension Cable', stress: 4500, limit: 8000, cracks: 'none', status: 'good', coords: { x: 80, y: 25 } },
  { id: 'bn-4', name: 'Pier 2 Support Base', stress: 5100, limit: 6000, cracks: 'minor', status: 'alert', coords: { x: 115, y: 70 } },
  { id: 'bn-5', name: 'East Abutment Anchor', stress: 2200, limit: 5000, cracks: 'none', status: 'good', coords: { x: 145, y: 55 } },
];

export default function BridgesDashboard() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  // Set default baselines based on location
  const locationBaselines = useMemo(() => {
    switch (userLocation) {
      case 'Yerawada': return { vibration: 6.8, tilt: 0.14, stressMult: 1.25 };
      case 'Hadapsar': return { vibration: 5.1, tilt: 0.09, stressMult: 1.10 };
      case 'Aundh': return { vibration: 2.9, tilt: 0.04, stressMult: 0.80 };
      case 'Shivajinagar':
      default: return { vibration: 4.2, tilt: 0.08, stressMult: 1.00 };
    }
  }, [userLocation]);

  const baselineNodes = useMemo<BridgeNode[]>(() => {
    return INITIAL_NODES.map(node => {
      const stress = Math.round(node.stress * locationBaselines.stressMult);
      const status: 'danger' | 'alert' | 'good' = stress >= node.limit * 0.9 ? 'danger' : stress >= node.limit * 0.8 ? 'alert' : 'good';
      return { ...node, stress, status };
    });
  }, [locationBaselines]);

  // Load test state
  const [loadTestActive, setLoadTestActive] = useState<boolean>(false);
  const [truckPosition, setTruckPosition] = useState<number>(-20); // x-axis of truck in SVG
  const [nodes, setNodes] = useState<BridgeNode[]>(baselineNodes);
  const [selectedNode, setSelectedNode] = useState<BridgeNode | null>(INITIAL_NODES[3]);
  const [vibration, setVibration] = useState<number>(4.2); // Hz (normal)
  const [tiltAngle, setTiltAngle] = useState<number>(0.08); // degrees (normal)

  // Update nodes when baselineNodes change
  useEffect(() => {
    if (!loadTestActive) {
      setNodes(baselineNodes);
      setVibration(locationBaselines.vibration);
      setTiltAngle(locationBaselines.tilt);
    }
  }, [baselineNodes, locationBaselines, loadTestActive]);

  // Run vehicle load test simulation sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadTestActive) {
      setVibration(12.8);
      setTiltAngle(0.24);
      
      // Animate truck crossing from x=-20 to x=180
      timer = setInterval(() => {
        setTruckPosition(prev => {
          if (prev >= 170) {
            // End test
            setLoadTestActive(false);
            setVibration(locationBaselines.vibration);
            setTiltAngle(locationBaselines.tilt);
            setNodes(baselineNodes);
            return -20;
          }
          const nextPos = prev + 8;
          
          // Dynamically spike stress on bridge nodes depending on truck proximity
          setNodes(prevNodes => prevNodes.map(node => {
            const distance = Math.abs(node.coords.x - nextPos);
            let addedStress = 0;
            if (distance < 20) {
              addedStress = Math.round((20 - distance) * 120);
            }
            const currentStress = node.stress + addedStress;
            const state: 'danger' | 'alert' | 'good' = currentStress >= node.limit * 0.9 ? 'danger' : currentStress >= node.limit * 0.8 ? 'alert' : 'good';
            return { ...node, stress: currentStress, status: state };
          }));

          return nextPos;
        });
      }, 100);
    } else {
      setTruckPosition(-20);
      setNodes(baselineNodes);
    }

    return () => clearInterval(timer);
  }, [loadTestActive, baselineNodes, locationBaselines]);

  // Keep selected node details updated
  useEffect(() => {
    if (selectedNode) {
      const updated = nodes.find(n => n.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [nodes, selectedNode]);

  const triggerLoadTest = () => {
    if (loadTestActive) return;
    setLoadTestActive(true);
    setTruckPosition(-20);
  };

  const getNodeColor = (node: BridgeNode) => {
    if (node.status === 'danger') return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500';
    if (node.status === 'alert') return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500';
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  };

  const getSVGNodeColor = (node: BridgeNode) => {
    if (node.status === 'danger') return 'fill-red-500';
    if (node.status === 'alert') return 'fill-orange-500';
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
        <span className="text-xs text-[#4682B4] font-bold">Bridge Monitoring</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-8 h-8 text-[#4682B4]" />
            Bridge Structural Telemetry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitor vibration frequency, pier tilt, cable stresses, and execute automated heavy load transit testing.
          </p>
        </div>
        <div>
          <Button 
            disabled={loadTestActive}
            onClick={triggerLoadTest}
            className="bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5" />
            {loadTestActive ? 'Vehicle Crossing Active...' : 'Simulate 40-Ton Load Test'}
          </Button>
        </div>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vibration & Tilt Gauges */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Vibration Frequency */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Radio className="w-4 h-4 text-[#4682B4]" />
                Vibration Frequency (Hz)
              </CardTitle>
              <CardDescription className="text-xs">
                Seismic and traffic vibration metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
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
                      vibration >= 10 ? "stroke-red-500" : "stroke-[#4682B4]"
                    )}
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.min(20, vibration)) / 20}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{vibration.toFixed(1)} Hz</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">frequency</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-[#4682B4]/20 bg-[#4682B4]/5">
                <span className="text-slate-600 dark:text-slate-400">Struct Mode:</span>
                <span className={cn(
                  "font-bold uppercase",
                  vibration >= 10 ? 'text-red-600 animate-pulse' : 'text-emerald-600'
                )}>
                  {vibration >= 10 ? 'Heavy Load Vibration' : 'Damped/Stable'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pier Tilt Angle */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Compass className="w-4 h-4 text-[#4682B4]" />
                Support Pier Tilt Angle
              </CardTitle>
              <CardDescription className="text-xs">
                Tilt angle sensor readings on main piers.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              
              <div className="relative w-36 h-36 flex items-center justify-center">
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
                    className="stroke-[#4682B4] transition-all duration-300"
                    strokeWidth="7"
                    strokeDasharray={188.4}
                    strokeDashoffset={188.4 - (188.4 * Math.min(0.5, tiltAngle)) / 0.5}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{tiltAngle.toFixed(3)}°</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Pier Tilt</span>
                </div>
              </div>

              <div className="w-full mt-2 flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border border-[#4682B4]/20 bg-[#4682B4]/5">
                <span className="text-slate-600 dark:text-slate-400">Settle Status:</span>
                <span className="font-bold text-emerald-600 uppercase">Within Spec</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Blueprint Cross-Section SVG & Node Inspector */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bridge Blueprint SVG Diagram */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Compass className="w-5 h-5 text-[#4682B4]" />
                Bridge Structural Blueprint Cross-Section
              </CardTitle>
              <CardDescription className="text-xs">
                Suspension bridge profile. Click anchors or pier foundations to audit local psi stress limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Interactive blueprint diagram */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                
                <svg className="w-full aspect-[16/9] max-w-[420px]" viewBox="0 0 160 90">
                  {/* Water Bed line below bridge */}
                  <path d="M -10,75 C 40,75 80,78 170,75" className="stroke-blue-500/20 stroke-[3] fill-none" />

                  {/* Main suspension cable line (curving down) */}
                  <path d="M 15,30 Q 80,55 145,30" className="stroke-slate-300 dark:stroke-slate-700 stroke-[1.5] fill-none" />
                  {/* Tension cable highlights */}
                  <path d="M 15,30 Q 80,55 145,30" className={cn("stroke-[#4682B4]/30 stroke-[1.5] fill-none", loadTestActive ? 'stroke-orange-500/50' : '')} />

                  {/* Hangers (vertical cables linking deck to main cable) */}
                  {[30, 45, 60, 75, 90, 105, 120, 130].map(x => {
                    // Quadratic Bezier formula for main cable y position:
                    // y = a*x^2 + b*x + c. Let's approximate it simply:
                    // at x=15 y=30, at x=80 y=55, at x=145 y=30
                    const dx = x - 80;
                    const yVal = 55 - (25 * (65 - dx)*(65 + dx)) / (65*65);
                    const yTarget = Math.max(30, Math.min(55, yVal));
                    return (
                      <line key={x} x1={x} y1={yTarget} x2={x} y2="55" className="stroke-slate-300 dark:stroke-slate-800 stroke-[0.5]" />
                    );
                  })}

                  {/* Bridge Main Deck line */}
                  <line x1="10" y1="55" x2="150" y2="55" className="stroke-slate-400 dark:stroke-slate-600 stroke-[3]" />

                  {/* Bridge Piers (supports) */}
                  {/* Pier 1: x=45, Pier 2: x=115 */}
                  <rect x="42" y="55" width="6" height="20" className="fill-slate-300 dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-700 stroke-[0.5]" />
                  <rect x="112" y="55" width="6" height="20" className="fill-slate-300 dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-700 stroke-[0.5]" />

                  {/* Simulated Moving Truck */}
                  {loadTestActive && (
                    <g transform={`translate(${truckPosition}, 45)`}>
                      <rect x="0" y="2" width="10" height="6" className="fill-[#4682B4] stroke-white stroke-[0.5]" rx="1" />
                      <rect x="10" y="4" width="4" height="4" className="fill-slate-800" rx="0.5" />
                      <circle cx="2.5" cy="8.5" r="1.5" className="fill-slate-900" />
                      <circle cx="8" cy="8.5" r="1.5" className="fill-slate-900" />
                      <circle cx="12" cy="8.5" r="1.5" className="fill-slate-900" />
                    </g>
                  )}

                  {/* Plotted Bridge Nodes */}
                  {nodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <g 
                        key={node.id} 
                        className="cursor-pointer" 
                        onClick={() => setSelectedNode(node)}
                      >
                        {isSelected && (
                          <circle cx={node.coords.x} cy={node.coords.y} r="7" className="fill-none stroke-[#4682B4] stroke-[1] animate-ping" />
                        )}
                        <circle
                          cx={node.coords.x}
                          cy={node.coords.y}
                          r="4"
                          className={cn(
                            "stroke-white dark:stroke-slate-900 stroke-[1] transition-all duration-200",
                            getSVGNodeColor(node)
                          )}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-2 justify-center text-[10px] font-bold">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />Within Limits</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-orange-500 rounded-full" />High Tension</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 bg-red-500 rounded-full" />Limit Exceeded</span>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="mt-4 p-4 rounded-xl border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30">
                {selectedNode ? (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-bold">Structural Node Inspector</span>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {selectedNode.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Diagnostics: <strong className="capitalize text-slate-700 dark:text-slate-300">Crack Rating: {selectedNode.cracks}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={cn(
                        "px-3 py-1.5 rounded-lg border text-center min-w-[120px]",
                        getNodeColor(selectedNode)
                      )}>
                        <span className="block text-[8px] uppercase font-black text-slate-400">Node Stress</span>
                        <span className="text-xs font-extrabold leading-none">{selectedNode.stress} psi / {selectedNode.limit}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    Click a highlighted node on the bridge blueprint to inspect stress telemetry.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Sensor Logs */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Activity className="w-4 h-4 text-[#4682B4]" />
                Ultrasonic Stress Sensor Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2.5 text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-start gap-2 p-2 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">Pier 2 Support tension alert:</strong>
                  Vibration threshold reached 5.1k psi. Recommended to dispatch a maintenance auditor for inspection of concrete interfaces.
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-[11px] leading-tight">Center Hanger Cables:</strong>
                  Ultrasonic scan confirms anchor wires are safe, holding tension parameters at 56% capacity under baseline transit load.
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
