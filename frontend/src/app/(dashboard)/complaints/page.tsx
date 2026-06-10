'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  MapPin, 
  List, 
  Map as MapIcon, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { useComplaintStore } from '@/store/useComplaintStore';
import { useUiStore } from '@/store/useUiStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ComplaintStatus, Complaint } from '@/types/complaint';
import { cn } from '@/lib/utils';

export default function ComplaintsDashboard() {
  const router = useRouter();
  const { complaints } = useComplaintStore();
  const { setActiveTab } = useUiStore();
  
  // SSR Hydration safeguard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setActiveTab('Complaints');
  }, [setActiveTab]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMapComplaint, setSelectedMapComplaint] = useState<Complaint | null>(null);

  if (!mounted) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-royal-blue"></span>
          </span>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">Synchronizing grievance database...</p>
        </div>
      </div>
    );
  }

  // Categories list
  const categories = [
    'All',
    'Road & Infrastructure',
    'Water Supply & Drainage',
    'Solid Waste Management',
    'Electricity & Streetlights',
    'Public Health & Sanitation'
  ];

  // Statuses list
  const statuses = ['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  // Metrics calculations
  const totalFiled = complaints.length;
  const pendingAction = complaints.filter(c => c.status === 'Submitted').length;
  const underInvestigation = complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length;
  const resolvedClosed = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  // Filter logic
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: ComplaintStatus) => {
    const styles = {
      Submitted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      Assigned: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      'In Progress': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
      Resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
      Closed: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    };
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', styles[status])}>
        {status}
      </span>
    );
  };

  const getStatusIndicatorColor = (status: ComplaintStatus) => {
    const colors = {
      Submitted: 'bg-amber-500 border-amber-300',
      Assigned: 'bg-blue-500 border-blue-300',
      'In Progress': 'bg-purple-500 border-purple-300',
      Resolved: 'bg-green-500 border-green-300',
      Closed: 'bg-slate-400 border-slate-300',
    };
    return colors[status];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-royal-blue dark:text-brand-yellow font-bold">Municipal Grievances</span>
          <h1 className="text-3xl font-extrabold tracking-tight">Complaint Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-1">
            File public reports, assign technical officers, and monitor incident SLA status tracking in real-time.
          </p>
        </div>
        <Link href="/complaints/new" passHref>
          <Button variant="navy" className="flex items-center gap-1.5 h-10 px-4 cursor-pointer">
            <Plus className="w-4.5 h-4.5" />
            File New Complaint
          </Button>
        </Link>
      </div>

      {/* 2. Stats Summary Widget grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border-subtle shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500">Total Filed</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalFiled}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border-subtle shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-amber-600">Pending Action</span>
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">{pendingAction}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border-subtle shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-purple-600">In Progress</span>
              <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400">{underInvestigation}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border-subtle shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-green-600">Resolved & Closed</span>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">{resolvedClosed}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filters and Search Drawer */}
      <Card className="bg-card border-border-subtle shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, title, or description..."
              className="w-full h-10 pl-9 pr-4 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-ring bg-slate-50 focus:bg-white dark:bg-slate-900 dark:border-slate-800 dark:focus:bg-slate-950 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Category Select Dropdown */}
            <div className="flex flex-col">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-md text-xs bg-slate-50 dark:bg-slate-900 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>

            {/* Status Select Dropdown */}
            <div className="flex flex-col">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-md text-xs bg-slate-50 dark:bg-slate-900 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring font-medium"
              >
                {statuses.map((stat) => (
                  <option key={stat} value={stat}>{stat === 'All' ? 'All Statuses' : stat}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle Controls */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all',
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-800 text-royal-blue dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => {
                  setViewMode('map');
                  if (filteredComplaints.length > 0 && !selectedMapComplaint) {
                    setSelectedMapComplaint(filteredComplaints[0]);
                  }
                }}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all',
                  viewMode === 'map' 
                    ? 'bg-white dark:bg-slate-800 text-royal-blue dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map View
              </button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 4. Display Area (Table View vs Interactive SVG Map View) */}
      {viewMode === 'list' ? (
        <Card className="bg-card border-border-subtle shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 pl-6">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Filed Date</TableHead>
                    <TableHead className="w-20 text-center pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-bold pl-6">
                          <Link href={`/complaints/${c.id}`} className="text-royal-blue hover:text-persian-blue dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
                            {c.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{c.title}</div>
                          <div className="text-[10px] text-slate-500 md:hidden mt-0.5">{c.category}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-slate-600 dark:text-slate-350">{c.category}</TableCell>
                        <TableCell className="hidden lg:table-cell text-slate-500 line-clamp-1 max-w-[200px] mt-2.5">{c.location}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500 text-xs">
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Link href={`/complaints/${c.id}`} passHref>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer">
                              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-450" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-slate-500 dark:text-slate-450">
                        No active complaints found matching filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Interactive SVG Map container */}
          <Card className="lg:col-span-2 bg-card border-border-subtle shadow-xs overflow-hidden flex flex-col justify-between min-h-[360px]">
            <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
              <CardTitle className="text-sm">Sector 4B Incident Locator Map</CardTitle>
              <CardDescription className="text-[11px]">Geographic mapping of logged public complaints</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 relative bg-slate-50 dark:bg-slate-900/60 p-0 overflow-hidden flex items-center justify-center min-h-[300px]">
              
              {/* Map SVG grid lines */}
              <svg className="absolute inset-0 w-full h-full text-slate-200 dark:text-slate-800/80 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="mapGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />
                
                {/* Roads contour simulation */}
                <path d="M 10 50 Q 50 120 150 150 T 400 220" fill="none" stroke="rgba(15, 76, 129, 0.12)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 300 10 Q 220 130 50 280" fill="none" stroke="rgba(15, 76, 129, 0.12)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 50 10 L 350 280" fill="none" stroke="rgba(15, 76, 129, 0.08)" strokeWidth="6" strokeLinecap="round" />
              </svg>

              {/* Active Complaint coordinate nodes */}
              {filteredComplaints.filter(c => c.coordinates).map((c) => {
                const coords = c.coordinates!;
                const isSelected = selectedMapComplaint?.id === c.id;
                
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedMapComplaint(c)}
                    className={cn(
                      'absolute h-5 w-5 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 z-10',
                      getStatusIndicatorColor(c.status),
                      isSelected && 'ring-4 ring-royal-blue/30 scale-125 z-20'
                    )}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    title={c.title}
                  >
                    <span className="absolute -inset-1 rounded-full animate-ping bg-royal-blue/5 dark:bg-white/5 opacity-50" />
                  </button>
                );
              })}

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 px-3 py-2 rounded-lg text-[10px] font-bold border border-border-subtle flex flex-col gap-1.5 text-slate-500 shadow-md">
                <span className="text-slate-800 dark:text-slate-200 border-b border-border-subtle pb-1 mb-1 font-extrabold uppercase tracking-wide">Status Legend</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Submitted (Unassigned)</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Assigned</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> In Progress</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" /> Resolved</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" /> Closed</span>
              </div>
            </CardContent>
          </Card>

          {/* Selected complaint card info */}
          <Card className="bg-card border-border-subtle shadow-xs flex flex-col justify-between min-h-[360px]">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle>Grievance Inspect</CardTitle>
              <CardDescription>Click a map node to view details</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-5 flex flex-col justify-between">
              {selectedMapComplaint ? (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400">{selectedMapComplaint.id}</span>
                      {getStatusBadge(selectedMapComplaint.status)}
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{selectedMapComplaint.title}</h4>
                    
                    <div className="flex items-start gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-royal-blue shrink-0 mt-0.5" />
                      <span>{selectedMapComplaint.location}</span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      {selectedMapComplaint.description}
                    </p>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {selectedMapComplaint.officer ? (
                      <div className="text-[11px] text-slate-500 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2 rounded">
                        <span>Assigned Officer:</span>
                        <strong className="text-slate-850 dark:text-slate-200">{selectedMapComplaint.officer.name}</strong>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-600 flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded border border-amber-100 dark:border-amber-900/20">
                        <span>Assignment status:</span>
                        <strong className="font-bold">Pending Dispatch</strong>
                      </div>
                    )}

                    <Link href={`/complaints/${selectedMapComplaint.id}`} passHref>
                      <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-[11px] py-1.5 h-9 cursor-pointer">
                        Manage Grievance
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 py-10">
                  <MapIcon className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                  Select an active incident marker on the locator map to inspect details.
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
