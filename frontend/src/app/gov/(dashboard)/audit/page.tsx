'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, AuditEntry } from '@/store/useGovStore';
import {
  ShieldCheck, Activity, Filter, Download, X, ChevronRight,
  Clock, User, Monitor, FileText, Package, Users, AlertTriangle,
  Search, Eye, Shield, Globe, Calendar
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtDateInput(iso: string) {
  return iso.slice(0, 10);
}

const MODULE_CONFIG: Record<string, { color: string; bg: string; border: string; text: string; icon: React.ElementType }> = {
  'Policy Management':    { color: 'blue',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   icon: FileText  },
  'Complaint Management': { color: 'amber',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  icon: AlertTriangle },
  'Resource Management':  { color: 'red',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    icon: Package   },
  'User Management':      { color: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: Users     },
};

function moduleConfig(mod: string) {
  return MODULE_CONFIG[mod] || { color: 'slate', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: Shield };
}

const MODULES = ['All', 'Policy Management', 'Complaint Management', 'Resource Management', 'User Management'];
const MODULE_SHORTNAMES: Record<string, string> = {
  'Policy Management': 'Policy',
  'Complaint Management': 'Complaints',
  'Resource Management': 'Resources',
  'User Management': 'Users',
};

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function AuditDetailDrawer({ entry, onClose }: { entry: AuditEntry | null; onClose: () => void }) {
  if (!entry) return null;
  const cfg = moduleConfig(entry.module);
  const Icon = cfg.icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-[#0B1829] border-l border-[#1A2744] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2744] bg-[#070D1A]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Icon size={16} className={cfg.text} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Audit Entry Detail</p>
              <p className="text-slate-500 text-[11px] font-mono">{entry.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2744] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action */}
          <div className="p-4 rounded-xl bg-[#070D1A] border border-[#1A2744]">
            <p className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold mb-1">Action Performed</p>
            <p className="text-white font-bold text-base">{entry.action}</p>
          </div>

          {/* Details */}
          <div className="p-4 rounded-xl bg-[#070D1A] border border-[#1A2744]">
            <p className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold mb-2">Full Details</p>
            <p className="text-slate-300 text-sm leading-relaxed">{entry.details}</p>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Officer', value: entry.officer, icon: User },
              { label: 'Role', value: entry.role, icon: Shield },
              { label: 'Module', value: entry.module, icon: Icon },
              { label: 'IP Address', value: entry.ipAddress, icon: Globe },
              { label: 'Timestamp', value: fmtTimestamp(entry.timestamp), icon: Clock, full: true },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} className={`${item.full ? 'col-span-2' : ''} p-3 rounded-xl bg-[#0D1E3A] border border-[#1A2744]`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ItemIcon size={11} className="text-slate-500" />
                    <p className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold">{item.label}</p>
                  </div>
                  <p className="text-white text-sm font-medium">{item.value}</p>
                </div>
              );
            })}
          </div>

          {/* Module badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Module Classification:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
              <Icon size={10} />
              {entry.module}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const router = useRouter();
  const { isGovAuthenticated, auditLog } = useGovStore();

  const [search, setSearch]         = useState('');
  const [moduleFilter, setModule]   = useState('All');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [selectedEntry, setSelected] = useState<AuditEntry | null>(null);

  React.useEffect(() => {
    if (!isGovAuthenticated) router.replace('/gov/login');
  }, [isGovAuthenticated, router]);

  if (!isGovAuthenticated) return null;

  const filtered = useMemo(() => {
    return auditLog.filter(e => {
      const matchSearch = !search || [e.officer, e.action, e.module, e.details, e.ipAddress]
        .some(f => f.toLowerCase().includes(search.toLowerCase()));
      const matchModule = moduleFilter === 'All' || e.module === moduleFilter;
      const eDate = new Date(e.timestamp);
      const matchFrom = !dateFrom || eDate >= new Date(dateFrom);
      const matchTo   = !dateTo   || eDate <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchModule && matchFrom && matchTo;
    });
  }, [auditLog, search, moduleFilter, dateFrom, dateTo]);

  // KPI counts
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEntries   = auditLog.filter(e => new Date(e.timestamp) >= today);
  const policyActions  = todayEntries.filter(e => e.module === 'Policy Management').length;
  const complaintActs  = todayEntries.filter(e => e.module === 'Complaint Management').length;
  const resourceActs   = todayEntries.filter(e => e.module === 'Resource Management').length;
  const userActs       = todayEntries.filter(e => e.module === 'User Management').length;

  const kpis = [
    { label: 'Total Actions Today', value: todayEntries.length, icon: Activity,      color: 'text-white',      bg: 'bg-[#1A3A6C]/30', border: 'border-[#1A3A6C]' },
    { label: 'Policy Changes',      value: policyActions,       icon: FileText,       color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
    { label: 'Complaint Actions',   value: complaintActs,       icon: AlertTriangle,  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
    { label: 'Resource Allocations',value: resourceActs,        icon: Package,        color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
    { label: 'User Changes',        value: userActs,            icon: Users,          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  const handleExport = () => {
    const csv = [
      ['ID','Timestamp','Officer','Role','Action','Module','Details','IP Address'].join(','),
      ...filtered.map(e => [e.id, fmtTimestamp(e.timestamp), e.officer, e.role, e.action, e.module, `"${e.details}"`, e.ipAddress].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1A3A6C] to-[#0B2342] border border-[#D4AF37]/40 flex items-center justify-center">
                <ShieldCheck size={14} className="text-[#D4AF37]" />
              </div>
              <span className="text-[10px] tracking-[0.3em] text-[#D4AF37]/60 font-semibold uppercase">NETRAVAAH GOV</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Audit Center</h1>
            <p className="text-slate-400 text-sm mt-0.5">Complete audit trail of all government portal actions</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A3A6C] hover:bg-[#1C39BB] border border-[#1C39BB]/50 text-white font-semibold text-sm transition-all duration-200"
          >
            <Download size={15} />
            Export Audit Log
          </button>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${k.bg} ${k.border} bg-[#0D1E3A]`}>
                <div className={`w-9 h-9 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={k.color} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
                  <p className="text-slate-500 text-[10px] font-medium leading-tight truncate">{k.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 p-4 bg-[#0D1E3A] border border-[#1A2744] rounded-xl">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-2">
            <Search size={13} className="text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search officer, action, module..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-600 outline-none min-w-0"
            />
            {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-500 hover:text-white" /></button>}
          </div>
          {/* Module filter */}
          <div className="flex gap-1.5 flex-wrap">
            {MODULES.map(m => (
              <button
                key={m}
                onClick={() => setModule(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${moduleFilter === m ? 'bg-[#1C39BB] text-white' : 'bg-[#070D1A] text-slate-400 border border-[#1A2744] hover:border-[#1C39BB]/50 hover:text-white'}`}
              >
                {MODULE_SHORTNAMES[m] || m}
              </button>
            ))}
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2 bg-[#070D1A] border border-[#1A2744] rounded-lg px-3 py-1.5">
            <Calendar size={13} className="text-slate-500" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent text-slate-300 text-xs outline-none" />
            <span className="text-slate-600 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent text-slate-300 text-xs outline-none" />
          </div>
          {/* Results count */}
          <div className="flex items-center ml-auto">
            <span className="text-slate-500 text-xs font-mono">{filtered.length} records</span>
          </div>
        </div>

        {/* ── Audit Table ── */}
        <div className="bg-[#0D1E3A] border border-[#1A2744] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#1A2744] bg-[#070D1A]">
                  {['Timestamp', 'Officer Name', 'Role', 'Action', 'Module', 'Details', 'IP Address', ''].map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[10px] font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2744]/60">
                {filtered.map((entry) => {
                  const cfg = moduleConfig(entry.module);
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[#1A2744]/30 transition-colors cursor-pointer group"
                      onClick={() => setSelected(entry)}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-600 flex-shrink-0" />
                          <span className="text-slate-300 text-xs font-mono">{fmtTimestamp(entry.timestamp)}</span>
                        </div>
                      </td>
                      {/* Officer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1A3A6C] border border-[#1C39BB]/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-black text-[#D4AF37]">{entry.officer.charAt(entry.officer.indexOf(' ') + 1) || entry.officer[0]}</span>
                          </div>
                          <span className="text-white text-xs font-semibold whitespace-nowrap">{entry.officer}</span>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs whitespace-nowrap">{entry.role}</span>
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3">
                        <span className="text-white text-xs font-semibold whitespace-nowrap">{entry.action}</span>
                      </td>
                      {/* Module */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
                          <Icon size={9} />
                          {MODULE_SHORTNAMES[entry.module] || entry.module}
                        </span>
                      </td>
                      {/* Details */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-slate-400 text-xs truncate">{entry.details}</p>
                      </td>
                      {/* IP */}
                      <td className="px-4 py-3">
                        <span className="text-slate-500 text-xs font-mono whitespace-nowrap">{entry.ipAddress}</span>
                      </td>
                      {/* View */}
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1 text-slate-600 group-hover:text-[#D4AF37] transition-colors text-[11px]">
                          <Eye size={13} />
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck size={32} className="text-slate-700 mb-3" />
              <p className="text-slate-500 font-semibold">No audit entries found</p>
              <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-[#1A2744] flex items-center justify-between">
            <span className="text-slate-600 text-xs font-mono">Showing {filtered.length} of {auditLog.length} entries</span>
            <span className="text-[10px] text-slate-600 font-mono">NETRAVAAH · Audit Center · Tamper-proof log</span>
          </div>
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      <AuditDetailDrawer entry={selectedEntry} onClose={() => setSelected(null)} />
    </>
  );
}
