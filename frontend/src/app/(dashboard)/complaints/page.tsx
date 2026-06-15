// app/(dashboard)/complaints/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, MapPin, List, Map as MapIcon, Activity, CheckCircle2, 
  AlertCircle, Clock, ChevronRight, MessageSquare, ThumbsUp, Eye, EyeOff, UserCheck
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
  const { complaints, supportIssue, verifyAffected, followIssue, activePolls, castPollVote } = useComplaintStore();
  const { setActiveTab } = useUiStore();
  
  // SSR Hydration safeguard
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setActiveTab('Complaints');
  }, [setActiveTab]);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'community' | 'operations' | 'map'>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMapComplaint, setSelectedMapComplaint] = useState<Complaint | null>(null);

  // User session simulation (for demo voting/interaction)
  const currentUserId = 'user-101';

  if (!mounted) {
    return (
      <div className="h-[60vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#070D1A]">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider animate-pulse">Synchronizing governance database...</p>
        </div>
      </div>
    );
  }

  // Categories list
  const categories = [
    'All',
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
      Submitted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
      Assigned: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      'In Progress': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
      Resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
      Closed: 'bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    };
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border', styles[status])}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (score: number) => {
    const level = score > 85 ? 'Critical' : score > 65 ? 'High' : score > 40 ? 'Medium' : 'Low';
    const styles = {
      Critical: 'bg-red-100 text-red-750 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      High: 'bg-orange-100 text-orange-700 border-orange-350 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30',
      Medium: 'bg-amber-100 text-amber-705 border-amber-300 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
      Low: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-850'
    };
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase border', styles[level])}>
        {level} (Score: {score})
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-[#F8FAFC] p-4 transition-colors duration-300">
      
      {/* Top Header Row with View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-[#1A2744] pb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#4682B4] dark:text-[#D4AF37]">
            Civic Collaboration Hub
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Community Governance Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5 font-bold">
            Discuss local grievances, coordinate verified affected groups, and track official responses.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('community')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              viewMode === 'community' ? "bg-[#4682B4] text-white border-[#4682B4]" : "bg-white dark:bg-[#0a1228] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400"
            )}
          >
            Community View (Feed)
          </button>
          
          <button
            onClick={() => setViewMode('operations')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              viewMode === 'operations' ? "bg-[#4682B4] text-white border-[#4682B4]" : "bg-white dark:bg-[#0a1228] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400"
            )}
          >
            Admin Operations View
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              viewMode === 'map' ? "bg-[#4682B4] text-white border-[#4682B4]" : "bg-white dark:bg-[#0a1228] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400"
            )}
          >
            Map View
          </button>

          <Link href="/complaints/new">
            <Button size="sm" variant="success" className="font-bold text-xs h-9 shadow-md shadow-success/15 hover:scale-[1.02] active:scale-95 transition-all text-white">
              <Plus className="w-4 h-4 mr-1" />
              Report Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (4 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-450">Active Incidents</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalFiled}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-450">Resolving Today</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{underInvestigation}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-450">Citizen Supports</p>
            <h3 className="text-2xl font-black text-[#4682B4] mt-1">2.4k</h3>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#0A1228] border border-slate-200 dark:border-[#1A2744] shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-450">Resolution Rate</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-450 mt-1">94.8%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Main Container Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column (Main Feed or Operations log table - 3 cols) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* SEARCH & FILTER STRIP */}
          {viewMode !== 'map' && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:max-w-xs">
                <Search className="w-4 h-4 text-slate-450 absolute left-3 top-3" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search comments, IDs, keywords..." 
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070D1A] focus:outline-hidden focus:border-[#4682B4]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1A] font-bold cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>

                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="p-2 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1A] font-bold cursor-pointer"
                >
                  {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </Card>
          )}

          {/* 1. COMMUNITY SOCIAL FEED VIEW */}
          {viewMode === 'community' && (
            <div className="space-y-4">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <Card key={c.id} className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] hover:border-[#4682B4]/40 transition-colors shadow-sm overflow-hidden">
                    
                    {/* Merge Group Announcement Banner */}
                    {c.isMerged && (
                      <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] font-black text-amber-700 dark:text-amber-450 flex items-center justify-between">
                        <span>⚠️ DUPLICATES DETECTED: {c.mergedCount} reports auto-merged into this incident</span>
                        <span>Affected Citizens: {c.affectedCount * 3}</span>
                      </div>
                    )}

                    <CardContent className="p-5 space-y-4">
                      {/* Top profile header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm font-black text-[#4682B4]">
                            {c.citizenName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                              {c.citizenName}
                            </h4>
                            <p className="text-[10px] text-slate-450 font-bold">
                              Ward: {c.location.split(',')[1] || 'Main PMC'} • {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Priority level */}
                        <div className="flex flex-col items-end gap-1">
                          {getPriorityBadge(c.priorityScore)}
                          {getStatusBadge(c.status)}
                        </div>
                      </div>

                      {/* Content Body */}
                      <Link href={`/complaints/${c.id}`} className="block group no-underline">
                        <h3 className="text-base font-black text-slate-950 dark:text-white group-hover:text-[#4682B4] transition-colors leading-snug">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed font-bold mt-1.5">
                          {c.description}
                        </p>
                      </Link>

                      {/* Footer Actions strip */}
                      <div className="border-t border-slate-150 dark:border-[#1A2744] pt-3 flex flex-wrap gap-4 items-center justify-between text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-4">
                          {/* Support Button */}
                          <button 
                            onClick={() => supportIssue(c.id, currentUserId)}
                            className={cn(
                              "flex items-center gap-1 hover:text-[#4682B4] transition-colors cursor-pointer",
                              c.supportedBy.includes(currentUserId) && "text-[#4682B4]"
                            )}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>👍 Support ({c.supportCount})</span>
                          </button>

                          {/* Affected citizen verification */}
                          <button 
                            onClick={() => verifyAffected(c.id, currentUserId)}
                            className={cn(
                              "flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer",
                              c.affectedBy.includes(currentUserId) && "text-red-500"
                            )}
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Affected ({c.affectedCount})</span>
                          </button>

                          {/* Subscribe */}
                          <button 
                            onClick={() => followIssue(c.id, currentUserId)}
                            className={cn(
                              "flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer",
                              c.followedBy.includes(currentUserId) && "text-blue-500"
                            )}
                          >
                            <Eye className="w-4 h-4" />
                            <span>Subscribe ({c.followCount})</span>
                          </button>
                        </div>

                        <Link href={`/complaints/${c.id}`} className="flex items-center gap-1 text-[#4682B4] hover:underline no-underline font-black">
                          <MessageSquare className="w-4 h-4" />
                          <span>Comments ({c.comments.length})</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>

                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 font-bold text-xs">
                  No community posts matched active search queries.
                </div>
              )}
            </div>
          )}

          {/* 2. ADMIN OPERATIONS TICKET VIEW */}
          {viewMode === 'operations' && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] shadow-sm">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-black/20">
                    <TableRow>
                      <TableHead className="font-bold text-xs">Incident ID</TableHead>
                      <TableHead className="font-bold text-xs">Category</TableHead>
                      <TableHead className="font-bold text-xs">Title</TableHead>
                      <TableHead className="font-bold text-xs">Priority</TableHead>
                      <TableHead className="font-bold text-xs">Status</TableHead>
                      <TableHead className="font-bold text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComplaints.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#101F42]/30 transition-colors">
                        <TableCell className="font-mono font-bold text-xs">{c.id}</TableCell>
                        <TableCell className="text-slate-500 text-xs">{c.category}</TableCell>
                        <TableCell className="font-black text-xs text-slate-900 dark:text-white truncate max-w-[200px]">{c.title}</TableCell>
                        <TableCell>{getPriorityBadge(c.priorityScore)}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/complaints/${c.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-bold text-[#4682B4]">
                              Inspect Ticket
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 3. GIS CLUSTERING MAP VIEW */}
          {viewMode === 'map' && (
            <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                
                {/* Visual SVG Map (3 cols) */}
                <div className="md:col-span-3 flex items-center justify-center bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <svg className="w-full aspect-square max-w-[300px]" viewBox="0 0 160 160">
                    <line x1="80" y1="0" x2="80" y2="160" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3,3" />
                    <line x1="0" y1="80" x2="160" y2="80" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3,3" />
                    <rect x="10" y="10" width="140" height="140" fill="transparent" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1" rx="5" />
                    
                    {/* Render Clustered GIS Marker Dots */}
                    {complaints.map(c => {
                      if (!c.coordinates) return null;
                      const isSelected = selectedMapComplaint?.id === c.id;
                      return (
                        <g 
                          key={c.id} 
                          className="cursor-pointer"
                          onClick={() => setSelectedMapComplaint(c)}
                        >
                          {isSelected && (
                            <circle cx={c.coordinates.x} cy={c.coordinates.y} r="8" className="fill-none stroke-[#4682B4] stroke-[1.5] animate-ping" />
                          )}
                          <circle 
                            cx={c.coordinates.x} 
                            cy={c.coordinates.y} 
                            r="5" 
                            className={cn(
                              "stroke-white dark:stroke-slate-900 stroke-[1]",
                              c.status === 'Resolved' ? 'fill-emerald-500' :
                              c.priorityScore > 85 ? 'fill-red-500' :
                              c.priorityScore > 65 ? 'fill-orange-500' : 'fill-amber-500'
                            )}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Selected Marker Inspector Panel (2 cols) */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  {selectedMapComplaint ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#4682B4]">GIS Map Node</span>
                        <h4 className="font-extrabold text-sm text-slate-950 dark:text-white mt-1 leading-snug">{selectedMapComplaint.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{selectedMapComplaint.location}</p>
                      </div>

                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-450">Category:</span>
                          <span className="truncate max-w-[120px]">{selectedMapComplaint.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Priority Score:</span>
                          <span>{selectedMapComplaint.priorityScore}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Supporters:</span>
                          <span>{selectedMapComplaint.supportCount} Citizens</span>
                        </div>
                      </div>

                      <Link href={`/complaints/${selectedMapComplaint.id}`}>
                        <Button className="w-full bg-[#4682B4] hover:bg-[#4682B4]/90 text-white font-bold text-xs mt-4">
                          View Full Discussion
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400 font-bold">Select a map marker to inspect incident records.</span>
                    </div>
                  )}
                </div>

              </div>
            </Card>
          )}

        </div>

        {/* Right Column: Trending Sidebars & Community Polling (1/3 width) */}
        <div className="space-y-6">
          
          {/* 1. COMMUNITY TRENDING PANEL */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-5 shadow-sm space-y-4">
            <div>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Trending Civic Issues</CardTitle>
              <CardDescription className="text-[10px]">What citizens are supporting right now.</CardDescription>
            </div>
            
            <div className="space-y-3">
              {complaints.slice(0, 3).map((c) => (
                <Link href={`/complaints/${c.id}`} key={`trend-${c.id}`} className="block group no-underline">
                  <h5 className="text-xs font-black text-slate-950 dark:text-white group-hover:text-[#4682B4] transition-colors leading-snug">
                    {c.title}
                  </h5>
                  <span className="text-[10px] text-slate-450 font-bold mt-1 block">
                    👍 {c.supportCount} Citizens Support
                  </span>
                </Link>
              ))}
            </div>

            {/* Trending tags */}
            <div className="border-t border-slate-150 dark:border-slate-800 pt-3.5 space-y-2">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-450">Trending Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {['#water', '#roads', '#electricity', '#garbage', '#hospital'].map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 text-[10px] font-bold text-slate-700 dark:text-slate-350">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 2. COMMUNITY POLLING SECTION */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-5 shadow-sm space-y-4">
            <div>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white">Community Polling</CardTitle>
              <CardDescription className="text-[10px]">Vote on local developmental projects.</CardDescription>
            </div>

            <div className="space-y-4">
              {activePolls.map((poll) => {
                const totalVotes = Object.values(poll.votes).reduce((a, b) => a + b, 0);
                const hasVoted = poll.votedBy.includes(currentUserId);
                
                return (
                  <div key={poll.id} className="space-y-2 text-xs">
                    <h5 className="font-extrabold text-slate-900 dark:text-white leading-snug">{poll.question}</h5>
                    
                    <div className="space-y-1.5">
                      {poll.options.map((option) => {
                        const optVotes = poll.votes[option] || 0;
                        const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        
                        return (
                          <div key={option} className="space-y-1">
                            {hasVoted ? (
                              <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded flex justify-between font-bold text-[10px]">
                                <span className="truncate max-w-[130px]">{option}</span>
                                <span>{percent}% ({optVotes})</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => castPollVote(poll.id, option, currentUserId)}
                                className="w-full text-left p-2 border border-slate-200 dark:border-slate-800 hover:border-[#4682B4] rounded text-[10px] font-semibold cursor-pointer transition-colors"
                              >
                                {option}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 3. AI CIVIC INSIGHTS PANEL */}
          <Card className="border border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A1228] p-5 shadow-sm space-y-4">
            <div>
              <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                AI Civic Insights
              </CardTitle>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-950 dark:text-emerald-400 border border-emerald-500/20 rounded-lg space-y-1 font-bold text-[10px]">
                <span className="block font-black uppercase text-[8px] text-emerald-500">Emerging Issue</span>
                Water leakage reports increased 34% in Hadapsar wards this week.
              </div>

              <div className="p-2.5 bg-blue-500/10 text-blue-950 dark:text-blue-400 border border-blue-500/20 rounded-lg space-y-1 font-bold text-[10px]">
                <span className="block font-black uppercase text-[8px] text-[#4682B4]">Complaint Hotspots</span>
                Sector 4B Waste Depot road is flagged for repeating solid waste backlog.
              </div>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
