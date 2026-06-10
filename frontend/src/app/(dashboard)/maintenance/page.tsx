'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ChevronRight, 
  ArrowLeft, 
  Wrench, 
  Plus, 
  Clock, 
  Users, 
  Package, 
  Phone,
  CheckCircle,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input } from '@/components/ui/form';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { LocationScopeBanner } from '@/components/layout/LocationScopeBanner';
import { useMemo } from 'react';

interface WorkOrder {
  id: string;
  taskName: string;
  assetClass: 'road' | 'bridge' | 'dam' | 'grid';
  location: string;
  priority: 'high' | 'medium' | 'low';
  crewAssigned: string;
  scheduledDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  { id: 'WO-501', taskName: 'Asphalt resurfacing outer lanes', assetClass: 'road', location: 'Yerawada Causeway margins', priority: 'high', crewAssigned: 'Civil Works Team Alpha', scheduledDate: 'June 10', status: 'in-progress' },
  { id: 'WO-502', taskName: 'Install ultrasonic sensor rings', assetClass: 'bridge', location: 'Sangam Bridge Pier 2 foundation', priority: 'high', crewAssigned: 'Structural Diagnostics B', scheduledDate: 'June 11', status: 'pending' },
  { id: 'WO-503', taskName: 'Substation Transformer core cleaning', assetClass: 'grid', location: 'Hadapsar Substation 4A', priority: 'medium', crewAssigned: 'Electrical Grid Crew 3', scheduledDate: 'June 10', status: 'completed' },
  { id: 'WO-504', taskName: 'Lubricate radial gate hinges', assetClass: 'dam', location: 'Khadakwasla Spillway Gate 3', priority: 'low', crewAssigned: 'Reservoir Logistics Team', scheduledDate: 'June 14', status: 'pending' },
];

interface MaintenanceCrew {
  id: string;
  name: string;
  size: number;
  status: 'active' | 'standby' | 'off-duty';
  contact: string;
}

const INITIAL_CREWS: MaintenanceCrew[] = [
  { id: 'cr-1', name: 'Civil Works Team Alpha', size: 6, status: 'active', contact: '+91 20 2555 4545' },
  { id: 'cr-2', name: 'Structural Diagnostics B', size: 4, status: 'standby', contact: '+91 20 2555 7878' },
  { id: 'cr-3', name: 'Electrical Grid Crew 3', size: 5, status: 'active', contact: '+91 20 2555 9090' },
  { id: 'cr-4', name: 'Reservoir Logistics Team', size: 8, status: 'standby', contact: '+91 20 2555 1212' },
];

export default function MaintenanceDashboard() {
  const { setActiveTab, userLocation } = useUiStore();

  useEffect(() => {
    setActiveTab('Infrastructure');
  }, [setActiveTab]);

  // Set default baselines based on location
  const locationOrders = useMemo(() => {
    switch (userLocation) {
      case 'Yerawada':
        return [
          { id: 'WO-501', taskName: 'Asphalt resurfacing outer lanes', assetClass: 'road' as const, location: 'Yerawada Causeway margins', priority: 'high' as const, crewAssigned: 'Civil Works Team Alpha', scheduledDate: 'June 10', status: 'in-progress' as const },
          { id: 'WO-502', taskName: 'Install ultrasonic sensor rings', assetClass: 'bridge' as const, location: 'Yerawada Confluence Bridge Pier 2', priority: 'high' as const, crewAssigned: 'Structural Diagnostics B', scheduledDate: 'June 11', status: 'pending' as const },
          { id: 'WO-503', taskName: 'Clean drainage culverts', assetClass: 'road' as const, location: 'Yerawada riverbed margin road', priority: 'medium' as const, crewAssigned: 'Civil Works Team Alpha', scheduledDate: 'June 10', status: 'completed' as const },
          { id: 'WO-504', taskName: 'Lubricate radial gate hinges', assetClass: 'dam' as const, location: 'Yerawada Sluice Spillway 2', priority: 'low' as const, crewAssigned: 'Reservoir Logistics Team', scheduledDate: 'June 14', status: 'pending' as const },
        ];
      case 'Hadapsar':
        return [
          { id: 'WO-501', taskName: 'Transformer core cleaning', assetClass: 'grid' as const, location: 'Hadapsar Substation 4A', priority: 'high' as const, crewAssigned: 'Electrical Grid Crew 3', scheduledDate: 'June 10', status: 'in-progress' as const },
          { id: 'WO-502', taskName: 'Industrial zone lane repaving', assetClass: 'road' as const, location: 'Hadapsar Main Cargo Way', priority: 'high' as const, crewAssigned: 'Civil Works Team Alpha', scheduledDate: 'June 11', status: 'pending' as const },
          { id: 'WO-503', taskName: 'Thermal dial calibration', assetClass: 'grid' as const, location: 'Hadapsar Substation 4A', priority: 'medium' as const, crewAssigned: 'Electrical Grid Crew 3', scheduledDate: 'June 10', status: 'completed' as const },
          { id: 'WO-504', taskName: 'Inspect industrial grid junction', assetClass: 'grid' as const, location: 'Hadapsar Node B', priority: 'low' as const, crewAssigned: 'Electrical Grid Crew 3', scheduledDate: 'June 14', status: 'pending' as const },
        ];
      case 'Aundh':
        return [
          { id: 'WO-501', taskName: 'Bypass lane cracks sealing', assetClass: 'road' as const, location: 'Aundh Bypass Lane', priority: 'medium' as const, crewAssigned: 'Civil Works Team Alpha', scheduledDate: 'June 10', status: 'in-progress' as const },
          { id: 'WO-502', taskName: 'Dam gate 1 calibration', assetClass: 'dam' as const, location: 'Khadakwasla Reservoir Spillway 1', priority: 'high' as const, crewAssigned: 'Reservoir Logistics Team', scheduledDate: 'June 11', status: 'pending' as const },
          { id: 'WO-503', taskName: 'Aundh Causeway inspection', assetClass: 'bridge' as const, location: 'Aundh Marg causeway', priority: 'low' as const, crewAssigned: 'Structural Diagnostics B', scheduledDate: 'June 10', status: 'completed' as const },
        ];
      case 'Shivajinagar':
      default:
        return INITIAL_WORK_ORDERS;
    }
  }, [userLocation]);

  const [orders, setOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [crews, setCrews] = useState<MaintenanceCrew[]>(INITIAL_CREWS);
  
  useEffect(() => {
    setOrders(locationOrders);
  }, [locationOrders]);

  // New ticket form states
  const [showForm, setShowForm] = useState<boolean>(false);
  const [taskName, setTaskName] = useState<string>('');
  const [assetClass, setAssetClass] = useState<'road' | 'bridge' | 'dam' | 'grid'>('road');
  const [location, setLocation] = useState<string>('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [crewAssigned, setCrewAssigned] = useState<string>('Civil Works Team Alpha');

  // Success trigger
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !location) return;

    const newOrder: WorkOrder = {
      id: `WO-custom-${Date.now().toString().slice(-4)}`,
      taskName,
      assetClass,
      location,
      priority,
      crewAssigned,
      scheduledDate: 'June 11',
      status: 'pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    setFormSuccess(true);
    setTaskName('');
    setLocation('');

    setTimeout(() => {
      setFormSuccess(false);
      setShowForm(false);
    }, 2000);
  };

  const getPriorityColor = (pri: 'high' | 'medium' | 'low') => {
    if (pri === 'high') return 'bg-red-500/10 text-red-600 dark:text-red-400';
    if (pri === 'medium') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  const getStatusColor = (status: 'pending' | 'in-progress' | 'completed') => {
    if (status === 'completed') return 'bg-emerald-500/10 text-emerald-600';
    if (status === 'in-progress') return 'bg-blue-500/10 text-blue-600';
    return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
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
        <span className="text-xs text-[#4682B4] font-bold">Maintenance Planner</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-8 h-8 text-[#4682B4]" />
            Maintenance Scheduling & Planner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Audit pending repair logs, assign specialist engineering crews, and register emergency infrastructure tickets.
          </p>
        </div>
        <div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? 'Cancel Work Order' : 'Create Work Order'}
          </Button>
        </div>
      </div>

      {/* Location Scope Banner */}
      <LocationScopeBanner />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Work Order Creator */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Create form */}
          {showForm && (
            <Card className="border border-[#4682B4]/30 bg-card shadow-sm animate-in slide-in-from-top-4 duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Plus className="w-4 h-4 text-[#4682B4]" />
                  Log Infrastructure Work Order
                </CardTitle>
                <CardDescription className="text-xs">
                  Create a new maintenance ticket and allocate a dispatch team.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <form onSubmit={handleCreateOrder} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="order-task">Repair Task Name</Label>
                    <Input
                      id="order-task"
                      type="text"
                      placeholder="e.g. Seal cracks on Pier 2 foundations"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="order-class">Asset Class</Label>
                      <select 
                        id="order-class" 
                        value={assetClass} 
                        onChange={(e) => setAssetClass(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <option value="road">Road</option>
                        <option value="bridge">Bridge</option>
                        <option value="dam">Dam</option>
                        <option value="grid">Grid</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="order-priority">Priority Level</Label>
                      <select 
                        id="order-priority" 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="order-location">Location Address</Label>
                    <Input
                      id="order-location"
                      type="text"
                      placeholder="e.g. Sangam Confluence Bridge"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="order-crew">Crew Allocation</Label>
                    <select 
                      id="order-crew" 
                      value={crewAssigned} 
                      onChange={(e) => setCrewAssigned(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-form-border bg-form-bg px-3 py-2 text-sm text-form-text focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      {crews.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" className="w-full bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs cursor-pointer mt-2" disabled={formSuccess}>
                    {formSuccess ? 'Submitting Order...' : 'Dispatch Work Order'}
                  </Button>

                  {formSuccess && (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 text-center">
                      Work order created. Ticket ID mapped to scheduler grid.
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Specialist Crews Directory */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Users className="w-4 h-4 text-[#4682B4]" />
                Municipal Engineering Crews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {crews.map(crew => (
                <div key={crew.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-card">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{crew.name}</h4>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                      crew.status === 'active' ? 'bg-blue-500/10 text-blue-600' :
                      crew.status === 'standby' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    )}>
                      {crew.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                    <span>Crew Size: {crew.size} engineers</span>
                    <a href={`tel:${crew.contact}`} className="flex items-center gap-0.5 text-[#4682B4] no-underline">
                      <Phone className="w-3 h-3" />
                      Call crew
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Work Orders grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Work Orders table */}
          <Card className="border border-border-subtle bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Wrench className="w-5 h-5 text-[#4682B4]" />
                Active Maintenance Scheduler
              </CardTitle>
              <CardDescription className="text-xs">
                Scheduled and active infrastructure repairs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-slate-500 dark:text-slate-400 font-black uppercase text-[10px]">
                      <th className="py-2.5">Task Detail</th>
                      <th className="py-2.5">Class / Location</th>
                      <th className="py-2.5">Priority</th>
                      <th className="py-2.5">Mock Status</th>
                      <th className="py-2.5 text-right">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5">
                          <span className="block font-bold text-slate-800 dark:text-slate-100">{order.taskName}</span>
                          <span className="text-[10px] text-slate-400">ID: {order.id} • Assigned: {order.crewAssigned}</span>
                        </td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                          <span className="block capitalize font-bold text-[10px] text-[#4682B4]">{order.assetClass}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{order.location}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                            getPriorityColor(order.priority)
                          )}>
                            {order.priority}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            getStatusColor(order.status)
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              order.status === 'completed' ? 'bg-emerald-500' :
                              order.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'
                            )} />
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {order.scheduledDate}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
