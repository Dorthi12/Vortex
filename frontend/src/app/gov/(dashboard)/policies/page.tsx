'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, MOCK_POLICIES, Policy, PolicyStatus } from '@/store/useGovStore';

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'create' | 'archive' | 'analytics';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  'Ministry of Electronics & IT',
  'Ministry of Agriculture',
  'Ministry of Health',
  'Ministry of Urban Development',
  'Ministry of Power',
  'NDMA',
  'Ministry of Education',
  'Ministry of Finance',
  'Ministry of Transport',
  'Ministry of Environment',
];

const POLICY_TYPES = [
  'Infrastructure', 'Health', 'Agriculture', 'Energy',
  'Education', 'Finance', 'Transport', 'Environment', 'Disaster Management', 'Governance',
];

const REGIONS = ['National', 'State', 'District'];

const KPI_STATS = [
  { label: 'Total Policies', value: 156, icon: '📋', color: 'text-blue-300', bg: 'bg-blue-900/30', border: 'border-blue-700/40' },
  { label: 'Active', value: 89, icon: '✅', color: 'text-emerald-300', bg: 'bg-emerald-900/30', border: 'border-emerald-700/40' },
  { label: 'Under Review', value: 12, icon: '🔍', color: 'text-amber-300', bg: 'bg-amber-900/30', border: 'border-amber-700/40' },
  { label: 'Draft', value: 24, icon: '📝', color: 'text-slate-300', bg: 'bg-slate-700/30', border: 'border-slate-600/40' },
  { label: 'Archived', value: 31, icon: '🗄️', color: 'text-purple-300', bg: 'bg-purple-900/30', border: 'border-purple-700/40' },
];

const FLOW_STEPS = [
  { label: 'Create', icon: '✏️', desc: 'Draft Policy' },
  { label: 'Review', icon: '🔍', desc: 'Dept. Review' },
  { label: 'Approve', icon: '✅', desc: 'Authority Sign' },
  { label: 'Publish', icon: '📢', desc: 'Go Live' },
];

const FLOW_DESTINATIONS = [
  { label: 'Citizen Portal', icon: '👥' },
  { label: 'AI Assistant', icon: '🤖' },
  { label: 'Reports Module', icon: '📊' },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function statusBadge(status: PolicyStatus) {
  const map: Record<PolicyStatus, string> = {
    Draft: 'bg-slate-700 text-slate-200',
    'Under Review': 'bg-amber-700/70 text-amber-200',
    Approved: 'bg-blue-700/70 text-blue-200',
    Published: 'bg-emerald-700/70 text-emerald-200',
    Archived: 'bg-purple-800/70 text-purple-200',
  };
  return map[status] || 'bg-gray-700 text-gray-200';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

// ─── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, bg, border }: typeof KPI_STATS[0]) {
  return (
    <div className={`flex-1 min-w-[140px] rounded-xl border ${border} ${bg} p-4 flex flex-col gap-1`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-400 font-medium tracking-wide">{label}</span>
    </div>
  );
}

function TabDashboard({ policies }: { policies: Policy[] }) {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="flex flex-wrap gap-3">
        {KPI_STATS.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Propagation Flow */}
      <div className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 p-5">
        <h3 className="text-sm font-semibold text-[#D4AF37] tracking-widest uppercase mb-4">Policy Propagation Flow</h3>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1 bg-[#1A3A6C]/70 border border-[#1C39BB]/50 rounded-lg px-4 py-3 min-w-[90px]">
                <span className="text-xl">{step.icon}</span>
                <span className="text-xs font-bold text-white">{step.label}</span>
                <span className="text-[10px] text-slate-400">{step.desc}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <svg className="text-[#D4AF37] w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
          {/* Fan-out to destinations */}
          <svg className="text-[#D4AF37] w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="flex flex-col gap-2">
            {FLOW_DESTINATIONS.map(d => (
              <div key={d.label} className="flex items-center gap-2 bg-[#1C39BB]/20 border border-[#1C39BB]/40 rounded-lg px-3 py-1.5">
                <span>{d.icon}</span>
                <span className="text-xs font-semibold text-blue-200">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Policies Table */}
      <div className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A3A6C]/60 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#D4AF37] tracking-widest uppercase">Recent Policies</h3>
          <span className="text-xs text-slate-400">{policies.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2342]/80 text-slate-400 text-xs uppercase tracking-wider">
                {['ID', 'Title', 'Department', 'Region', 'Type', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-t border-[#1A3A6C]/40 hover:bg-[#1A3A6C]/20 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#0B2342]/30'}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#D4AF37] whitespace-nowrap">{p.id}</td>
                  <td className="px-4 py-3 text-white font-medium max-w-[220px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{p.department}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{p.region}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{p.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs bg-[#1C39BB]/30 border border-[#1C39BB]/50 rounded text-blue-300 hover:bg-[#1C39BB]/50 transition">View</button>
                      <button className="px-2 py-1 text-xs bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-[#D4AF37] hover:bg-[#D4AF37]/20 transition">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabCreate() {
  const [form, setForm] = useState({
    title: '', department: '', region: '', type: '', effectiveDate: '',
    expiryDate: '', description: '', approvalAuthority: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1A3A6C]/60 bg-[#0B2342]/80">
          <h3 className="text-sm font-semibold text-[#D4AF37] tracking-widest uppercase">New Policy Submission</h3>
          <p className="text-xs text-slate-400 mt-1">Fill all required fields. Policy will be routed for departmental review.</p>
        </div>

        {submitted && (
          <div className="mx-6 mt-5 flex items-center gap-3 rounded-lg border border-emerald-600/50 bg-emerald-900/30 px-4 py-3 text-emerald-300 text-sm font-medium">
            <span className="text-lg">✅</span>
            Policy successfully submitted for review. Reference tracking will be assigned within 24 hours.
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Policy Title <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. National Digital Health Mission Act 2025"
              className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#1C39BB] text-sm"
            />
          </div>

          {/* Department + Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white focus:outline-none focus:border-[#1C39BB] text-sm"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Region <span className="text-red-400">*</span>
              </label>
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white focus:outline-none focus:border-[#1C39BB] text-sm"
              >
                <option value="">Select Region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Policy Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Policy Type <span className="text-red-400">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white focus:outline-none focus:border-[#1C39BB] text-sm"
            >
              <option value="">Select Type</option>
              {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Effective Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={form.effectiveDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white focus:outline-none focus:border-[#1C39BB] text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white focus:outline-none focus:border-[#1C39BB] text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Policy Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Provide a comprehensive description of the policy, its objectives, scope, and implementation guidelines..."
              className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#1C39BB] text-sm resize-none"
            />
          </div>

          {/* Approval Authority */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Approval Authority <span className="text-red-400">*</span>
            </label>
            <input
              name="approvalAuthority"
              value={form.approvalAuthority}
              onChange={handleChange}
              required
              placeholder="e.g. Cabinet Secretary / Minister of Health"
              className="w-full rounded-lg bg-[#0B2342] border border-[#1A3A6C]/80 px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#1C39BB] text-sm"
            />
          </div>

          {/* Attachments Note */}
          <div className="rounded-lg border border-dashed border-[#1C39BB]/50 bg-[#1C39BB]/5 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📎</span>
              <div>
                <p className="text-sm font-medium text-slate-200">Attachments</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supporting documents (PDFs, scanned orders, impact assessments) should be uploaded via the Secure Document Vault portal separately and linked by reference ID after submission.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#1C39BB] to-[#D4AF37]/80 hover:from-[#1C39BB]/90 hover:to-[#D4AF37] text-white font-semibold text-sm transition-all shadow-lg shadow-[#1C39BB]/20"
            >
              <span>📤</span> Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabArchive({ policies }: { policies: Policy[] }) {
  const [filter, setFilter] = useState<PolicyStatus | 'All'>('All');
  const statuses: (PolicyStatus | 'All')[] = ['All', 'Published', 'Approved', 'Under Review', 'Draft', 'Archived'];
  const filtered = filter === 'All' ? policies : policies.filter(p => p.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === s ? 'bg-[#1C39BB] border-[#1C39BB] text-white' : 'border-[#1A3A6C]/60 text-slate-400 hover:text-white hover:border-[#1C39BB]/60'}`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} policies</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 p-5 hover:border-[#1C39BB]/50 hover:bg-[#0B2342]/80 transition-all group"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="font-mono text-xs text-[#D4AF37]">{p.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge(p.status)}`}>{p.status}</span>
            </div>

            <h4 className="text-sm font-bold text-white mb-1 leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-2">{p.title}</h4>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">{p.description}</p>

            {/* Metadata */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>🏛️</span><span className="truncate">{p.department}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>🌏</span><span>{p.region}</span>
                <span className="mx-1 text-slate-600">·</span>
                <span>📋</span><span>{p.type}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>📅</span>
                <span>{formatDate(p.effectiveDate)} → {formatDate(p.expiryDate)}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg bg-[#0B2342] border border-[#1A3A6C]/40 p-2 text-center">
                <div className="text-sm font-bold text-blue-300">{formatNum(p.views)}</div>
                <div className="text-[10px] text-slate-500">Views</div>
              </div>
              <div className="rounded-lg bg-[#0B2342] border border-[#1A3A6C]/40 p-2 text-center">
                <div className="text-sm font-bold text-emerald-300">{formatNum(p.downloads)}</div>
                <div className="text-[10px] text-slate-500">Downloads</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Approved by: {p.approvalAuthority}</span>
              <button className="ml-auto px-3 py-1 rounded bg-[#1C39BB]/30 border border-[#1C39BB]/50 text-blue-300 text-xs font-semibold hover:bg-[#1C39BB]/50 transition">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-[#0B2342] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function TabAnalytics({ policies }: { policies: Policy[] }) {
  const totalViews = policies.reduce((a, p) => a + p.views, 0);
  const totalDownloads = policies.reduce((a, p) => a + p.downloads, 0);
  const maxViews = Math.max(...policies.map(p => p.views));

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Policy Views', value: formatNum(totalViews), icon: '👁️', color: 'text-blue-300' },
          { label: 'Total Downloads', value: formatNum(totalDownloads), icon: '📥', color: 'text-emerald-300' },
          { label: 'Avg. Compliance', value: '87%', icon: '📊', color: 'text-[#D4AF37]' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-Policy Analytics */}
      <div className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A3A6C]/60">
          <h3 className="text-sm font-semibold text-[#D4AF37] tracking-widest uppercase">Policy Performance Analytics</h3>
        </div>
        <div className="divide-y divide-[#1A3A6C]/40">
          {policies.map(p => {
            const viewPct = Math.round((p.views / maxViews) * 100);
            const dlPct = Math.min(Math.round((p.downloads / p.views) * 100), 100);
            const compliance = Math.floor(70 + Math.random() * 28);
            return (
              <div key={p.id} className="px-5 py-4 hover:bg-[#1A3A6C]/10 transition-colors">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#D4AF37]">{p.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.department} · {p.affectedPop} affected</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-blue-300">{formatNum(p.views)}</div>
                    <div className="text-[10px] text-slate-500">views</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Views Reach</span><span className="font-semibold text-blue-300">{viewPct}%</span>
                    </div>
                    <ProgressBar value={viewPct} color="bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Download Rate</span><span className="font-semibold text-emerald-300">{dlPct}%</span>
                    </div>
                    <ProgressBar value={dlPct} color="bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Compliance Score</span><span className={`font-semibold ${compliance >= 85 ? 'text-emerald-300' : compliance >= 70 ? 'text-amber-300' : 'text-red-300'}`}>{compliance}%</span>
                    </div>
                    <ProgressBar value={compliance} color={compliance >= 85 ? 'bg-emerald-500' : compliance >= 70 ? 'bg-amber-500' : 'bg-red-500'} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Population Reach</span><span className="font-semibold text-purple-300">{p.affectedPop}</span>
                    </div>
                    <ProgressBar value={75} color="bg-purple-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const router = useRouter();
  const { isGovAuthenticated, govUser, policies } = useGovStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!isGovAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">🔒</div>
        <p className="text-slate-300 font-semibold">Access Restricted</p>
        <p className="text-slate-500 text-sm">You must be logged in to the Government Portal to view this page.</p>
        <button
          onClick={() => router.push('/gov')}
          className="px-4 py-2 rounded-lg bg-[#1C39BB] text-white text-sm font-semibold hover:bg-[#1C39BB]/80 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏛️' },
    { id: 'create', label: 'Create Policy', icon: '✏️' },
    { id: 'archive', label: 'Policy Archive', icon: '🗄️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  const allPolicies = policies.length > 0 ? policies : MOCK_POLICIES;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase">Policy Management</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">NETRAVAAH Gov Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Government Policy Registry</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Centralized policy lifecycle management — from drafting to citizen deployment
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Logged in as</div>
          <div className="text-sm font-semibold text-white">{govUser?.name}</div>
          <div className="text-xs text-[#D4AF37]">{govUser?.role}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1A3A6C]/60 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && <TabDashboard policies={allPolicies} />}
        {activeTab === 'create' && <TabCreate />}
        {activeTab === 'archive' && <TabArchive policies={allPolicies} />}
        {activeTab === 'analytics' && <TabAnalytics policies={allPolicies} />}
      </div>
    </div>
  );
}
