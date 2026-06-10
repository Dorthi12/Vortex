'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, MOCK_GOV_COMPLAINTS, ComplaintPriority, ComplaintStatus } from '@/store/useGovStore';

// ─── TYPES & HELPERS ──────────────────────────────────────────────────────────

type TabKey = 'global' | 'priority' | 'department' | 'emergency';

const PRIORITY_ORDER: Record<ComplaintPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const PRIORITY_CONFIG: Record<ComplaintPriority, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: 'bg-red-950/60',   text: 'text-red-400',   border: 'border-red-700/60',   dot: 'bg-red-500'   },
  High:     { bg: 'bg-orange-950/60', text: 'text-orange-400', border: 'border-orange-700/60', dot: 'bg-orange-500' },
  Medium:   { bg: 'bg-amber-950/60',  text: 'text-amber-400',  border: 'border-amber-700/60',  dot: 'bg-amber-500'  },
  Low:      { bg: 'bg-green-950/60',  text: 'text-green-400',  border: 'border-green-700/60',  dot: 'bg-green-500'  },
};

const STATUS_CONFIG: Record<ComplaintStatus, { bg: string; text: string }> = {
  'Submitted':    { bg: 'bg-slate-700/60',  text: 'text-slate-300'  },
  'Under Review': { bg: 'bg-blue-900/60',   text: 'text-blue-300'   },
  'Assigned':     { bg: 'bg-indigo-900/60', text: 'text-indigo-300' },
  'In Progress':  { bg: 'bg-amber-900/60',  text: 'text-amber-300'  },
  'Resolved':     { bg: 'bg-green-900/60',  text: 'text-green-300'  },
  'Closed':       { bg: 'bg-slate-800/60',  text: 'text-slate-400'  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DEPT_ICONS: Record<string, string> = {
  Infrastructure: '🏗️', Health: '🏥', Agriculture: '🌾',
  Energy: '⚡', Education: '🎓', Hazard: '⚠️', Environment: '🌿',
};

const ALL_DEPARTMENTS = [...new Set(MOCK_GOV_COMPLAINTS.map(c => c.department))];
const ALL_DISTRICTS   = [...new Set(MOCK_GOV_COMPLAINTS.map(c => c.district))];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  );
}

interface ComplaintRowProps {
  complaint: typeof MOCK_GOV_COMPLAINTS[0];
  emergency?: boolean;
  onView: (id: string) => void;
}

function ComplaintRow({ complaint: c, emergency, onView }: ComplaintRowProps) {
  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200
        ${emergency
          ? 'bg-red-950/20 border-red-700/50 animate-pulse-border shadow-red-900/30 shadow-md'
          : 'bg-[#0A1228] border-[#1A2744] hover:border-[#1C39BB]/50 hover:bg-[#0B1535]'
        }`}
    >
      {/* Left: ID + badges */}
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <span className="font-mono text-[#D4AF37] text-sm font-bold tracking-widest">{c.id}</span>
        <PriorityBadge priority={c.priority} />
        <StatusBadge status={c.status} />
      </div>

      {/* Center: Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
          {c.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {c.location}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <span>{DEPT_ICONS[c.department] || '🏛️'}</span>
            <span className="text-[#1C39BB] font-medium">{c.department}</span>
          </span>
          <span className="text-xs text-slate-500">by <span className="text-slate-300">{c.citizen}</span></span>
        </div>
      </div>

      {/* Right: Time + action */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs text-slate-500 font-mono">{timeAgo(c.submittedAt)}</span>
        <button
          onClick={() => onView(c.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A3A6C] hover:bg-[#1C39BB] text-white border border-[#1C39BB]/40 hover:border-[#1C39BB] transition-all"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ComplaintsPage() {
  const router = useRouter();
  const { isGovAuthenticated, complaints } = useGovStore();

  if (!isGovAuthenticated) {
    if (typeof window !== 'undefined') router.replace('/gov/login');
    return (
      <div className="min-h-screen bg-[#070D1A] flex items-center justify-center">
        <p className="text-[#D4AF37] font-mono animate-pulse">Redirecting to secure login…</p>
      </div>
    );
  }

  const [activeTab, setActiveTab]       = useState<TabKey>('global');
  const [search, setSearch]             = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterDept, setFilterDept]         = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // Stats
  const total    = complaints.length;
  const critical = complaints.filter(c => c.priority === 'Critical').length;
  const high     = complaints.filter(c => c.priority === 'High').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const pending  = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;

  // Filter logic
  const filtered = useMemo(() => {
    let list = [...complaints];
    if (search)          list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search) || c.citizen.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority)  list = list.filter(c => c.priority === filterPriority);
    if (filterStatus)    list = list.filter(c => c.status === filterStatus);
    if (filterDept)      list = list.filter(c => c.department === filterDept);
    if (filterDistrict)  list = list.filter(c => c.district === filterDistrict);
    return list;
  }, [complaints, search, filterPriority, filterStatus, filterDept, filterDistrict]);

  const globalList    = filtered;
  const priorityList  = filtered.filter(c => c.priority === 'Critical' || c.priority === 'High').sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const emergencyList = filtered.filter(c => c.priority === 'Critical');
  const byDept        = useMemo(() => {
    const map: Record<string, typeof complaints> = {};
    filtered.forEach(c => { if (!map[c.department]) map[c.department] = []; map[c.department].push(c); });
    return map;
  }, [filtered]);

  const tabList: { key: TabKey; label: string; count: number }[] = [
    { key: 'global',     label: 'Global Feed',     count: globalList.length    },
    { key: 'priority',   label: 'Priority Queue',  count: priorityList.length  },
    { key: 'department', label: 'By Department',   count: filtered.length      },
    { key: 'emergency',  label: 'Emergency',       count: emergencyList.length },
  ];

  const handleView = (id: string) => router.push(`/gov/complaints/${id}`);

  return (
    <div className="min-h-screen bg-[#070D1A] text-white">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1A2744] bg-[#0A1228]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="px-6 py-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#1C39BB]/20 border border-[#1C39BB]/40 flex items-center justify-center text-sm">📋</div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Complaint Management System</h1>
              </div>
              <p className="text-slate-400 text-sm pl-11">NETRAVAAH Citizen Grievance Resolution Platform — Real-time Monitoring</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B2342] border border-[#1A2744] text-slate-300 text-sm hover:border-[#1C39BB]/40 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B2342] border border-[#1A2744] text-slate-300 text-sm hover:border-[#1C39BB]/40 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                Filter
              </button>
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c9a52e] text-[#070D1A] text-sm font-bold transition-all shadow-lg shadow-[#D4AF37]/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Complaint
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { label: 'Total Complaints', val: total,    bg: 'bg-[#1A3A6C]/40',   text: 'text-white',      border: 'border-[#1C39BB]/30' },
              { label: 'Critical',         val: critical, bg: 'bg-red-950/40',     text: 'text-red-400',    border: 'border-red-700/40'    },
              { label: 'High',             val: high,     bg: 'bg-orange-950/40',  text: 'text-orange-400', border: 'border-orange-700/40' },
              { label: 'Resolved',         val: resolved, bg: 'bg-green-950/40',   text: 'text-green-400',  border: 'border-green-700/40'  },
              { label: 'Pending',          val: pending,  bg: 'bg-amber-950/40',   text: 'text-amber-400',  border: 'border-amber-700/40'  },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.bg} ${s.border}`}>
                <span className={`text-xl font-bold font-mono ${s.text}`}>{s.val}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 p-6">

        {/* ── LEFT: main content ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Search + Filters */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search complaints by ID, title, or citizen name…"
                className="w-full pl-10 pr-4 py-2.5 bg-[#070D1A] border border-[#1A2744] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#1C39BB]/60 transition-colors"
              />
            </div>
            {/* Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Priority', val: filterPriority, set: setFilterPriority, opts: ['Critical','High','Medium','Low'] },
                { label: 'Status',   val: filterStatus,   set: setFilterStatus,   opts: ['Submitted','Under Review','Assigned','In Progress','Resolved','Closed'] },
                { label: 'Department', val: filterDept,   set: setFilterDept,     opts: ALL_DEPARTMENTS },
                { label: 'District',   val: filterDistrict, set: setFilterDistrict, opts: ALL_DISTRICTS },
              ].map(f => (
                <select
                  key={f.label}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  className="px-3 py-1.5 bg-[#070D1A] border border-[#1A2744] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-[#1C39BB]/60 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">All {f.label}</option>
                  {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              {(search || filterPriority || filterStatus || filterDept || filterDistrict) && (
                <button
                  onClick={() => { setSearch(''); setFilterPriority(''); setFilterStatus(''); setFilterDept(''); setFilterDistrict(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 border border-[#1A2744] hover:border-red-700/40 transition-all"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl overflow-hidden">
            {/* Tab nav */}
            <div className="flex border-b border-[#1A2744]">
              {tabList.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all
                    ${activeTab === tab.key
                      ? 'text-[#D4AF37] bg-[#D4AF37]/5 border-b-2 border-[#D4AF37]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }
                    ${tab.key === 'emergency' ? 'text-red-400 hover:text-red-300' : ''}
                  `}
                >
                  {tab.key === 'emergency' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold
                    ${activeTab === tab.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-slate-700/60 text-slate-400'}
                    ${tab.key === 'emergency' ? 'bg-red-900/40 text-red-400' : ''}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 space-y-3 min-h-[300px]">

              {/* GLOBAL FEED */}
              {activeTab === 'global' && (
                globalList.length === 0
                  ? <EmptyState />
                  : globalList.map(c => <ComplaintRow key={c.id} complaint={c} onView={handleView} />)
              )}

              {/* PRIORITY QUEUE */}
              {activeTab === 'priority' && (
                priorityList.length === 0
                  ? <EmptyState message="No Critical or High priority complaints match your filters." />
                  : priorityList.map(c => <ComplaintRow key={c.id} complaint={c} onView={handleView} />)
              )}

              {/* BY DEPARTMENT */}
              {activeTab === 'department' && (
                Object.keys(byDept).length === 0
                  ? <EmptyState />
                  : Object.entries(byDept).map(([dept, items]) => (
                    <div key={dept} className="space-y-2">
                      <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                        <span>{DEPT_ICONS[dept] || '🏛️'}</span>
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">{dept}</h3>
                        <div className="flex-1 h-px bg-[#1A2744]" />
                        <span className="text-xs text-slate-500 font-mono">{items.length} complaint{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      {items.map(c => <ComplaintRow key={c.id} complaint={c} onView={handleView} />)}
                    </div>
                  ))
              )}

              {/* EMERGENCY */}
              {activeTab === 'emergency' && (
                emergencyList.length === 0
                  ? <EmptyState message="No critical emergencies at this time." icon="✅" />
                  : (
                    <>
                      <div className="flex items-center gap-2 px-1 py-2 mb-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                        <p className="text-red-400 text-sm font-bold uppercase tracking-widest">
                          Emergency Critical Feed — Requires Immediate Action
                        </p>
                      </div>
                      {emergencyList.map(c => <ComplaintRow key={c.id} complaint={c} emergency onView={handleView} />)}
                    </>
                  )
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: AI Insights Sidebar ────────────────────────────────── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* AI Analysis Header */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A2744] bg-[#1C39BB]/10">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-sm font-bold text-[#D4AF37] tracking-wide uppercase">AI Complaint Analysis</span>
            </div>

            {/* Category Distribution */}
            <div className="px-4 py-3 border-b border-[#1A2744]">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Category Distribution</p>
              {[
                { label: 'Infrastructure', pct: 28, color: 'bg-blue-500'   },
                { label: 'Health',         pct: 22, color: 'bg-teal-500'   },
                { label: 'Disaster',       pct: 18, color: 'bg-red-500'    },
                { label: 'Agriculture',    pct: 15, color: 'bg-green-500'  },
                { label: 'Environment',    pct: 10, color: 'bg-emerald-500'},
                { label: 'Energy',         pct: 7,  color: 'bg-amber-500'  },
              ].map(cat => (
                <div key={cat.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{cat.label}</span>
                    <span className="text-slate-300 font-mono">{cat.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1A2744] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Trending Issues */}
            <div className="px-4 py-3 border-b border-[#1A2744]">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Trending Issues</p>
              <ul className="space-y-1.5">
                {['Flood & Waterlogging', 'Disease Outbreaks', 'Road Infrastructure', 'Power Cuts'].map((issue, i) => (
                  <li key={issue} className="flex items-center gap-2 text-xs">
                    <span className="text-[#D4AF37] font-bold font-mono w-4">{i + 1}.</span>
                    <span className="text-slate-300">{issue}</span>
                    <span className="ml-auto text-red-400 text-[10px]">▲</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Department Bottlenecks */}
            <div className="px-4 py-3 border-b border-[#1A2744]">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Department Bottlenecks</p>
              <ul className="space-y-1.5">
                {[
                  { dept: 'Health', delay: '18h avg' },
                  { dept: 'Infrastructure', delay: '24h avg' },
                  { dept: 'Environment', delay: '36h avg' },
                ].map(b => (
                  <li key={b.dept} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{b.dept}</span>
                    <span className="text-orange-400 font-mono">{b.delay}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resolution Rate */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Resolution Rate Today</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-green-400">89%</span>
                <span className="text-xs text-green-500 mb-1">↑ +4% vs yesterday</span>
              </div>
              <div className="mt-2 h-2 bg-[#1A2744] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: '89%' }} />
              </div>
            </div>
          </div>

          {/* Live Status Card */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">System Status</p>
            <div className="space-y-2">
              {[
                { label: 'AI Engine',      status: 'Online',    color: 'text-green-400' },
                { label: 'Alert Daemon',   status: 'Active',    color: 'text-green-400' },
                { label: 'SMS Gateway',    status: 'Active',    color: 'text-green-400' },
                { label: 'Data Sync',      status: 'Syncing…',  color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{s.label}</span>
                  <span className={`font-medium ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick nav */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Quick Access</p>
            <div className="space-y-1.5">
              {[
                { label: '📊 Analytics Dashboard', path: '/gov/analytics' },
                { label: '📋 Policy Management', path: '/gov/policies' },
                { label: '👤 User Management', path: '/gov/users' },
                { label: '🔒 Audit Log', path: '/gov/audit' },
              ].map(link => (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className="w-full text-left text-xs text-slate-400 hover:text-[#D4AF37] py-1.5 px-2 rounded hover:bg-[#D4AF37]/5 transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ message = 'No complaints match your current filters.', icon = '🔍' }: { message?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3 opacity-40">{icon}</div>
      <p className="text-slate-500 text-sm max-w-sm">{message}</p>
    </div>
  );
}
