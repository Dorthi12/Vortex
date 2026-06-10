'use client';

import { useRouter } from 'next/navigation';
import { useGovStore, MOCK_DEPARTMENTS, Department } from '@/store/useGovStore';

// ─── COLOR CONFIG ───────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, {
  border: string; bg: string; icon: string; badge: string;
  bar: string; accent: string; glow: string;
}> = {
  emerald: {
    border: 'border-emerald-700/40', bg: 'bg-emerald-900/10',
    icon: 'bg-emerald-900/50 border border-emerald-700/50',
    badge: 'bg-emerald-700/60 text-emerald-200', bar: 'bg-emerald-500',
    accent: 'text-emerald-300', glow: 'shadow-emerald-900/30',
  },
  teal: {
    border: 'border-teal-700/40', bg: 'bg-teal-900/10',
    icon: 'bg-teal-900/50 border border-teal-700/50',
    badge: 'bg-teal-700/60 text-teal-200', bar: 'bg-teal-400',
    accent: 'text-teal-300', glow: 'shadow-teal-900/30',
  },
  blue: {
    border: 'border-blue-700/40', bg: 'bg-blue-900/10',
    icon: 'bg-blue-900/50 border border-blue-700/50',
    badge: 'bg-blue-700/60 text-blue-200', bar: 'bg-blue-500',
    accent: 'text-blue-300', glow: 'shadow-blue-900/30',
  },
  red: {
    border: 'border-red-700/40', bg: 'bg-red-900/10',
    icon: 'bg-red-900/50 border border-red-700/50',
    badge: 'bg-red-700/60 text-red-200', bar: 'bg-red-500',
    accent: 'text-red-300', glow: 'shadow-red-900/30',
  },
  purple: {
    border: 'border-purple-700/40', bg: 'bg-purple-900/10',
    icon: 'bg-purple-900/50 border border-purple-700/50',
    badge: 'bg-purple-700/60 text-purple-200', bar: 'bg-purple-500',
    accent: 'text-purple-300', glow: 'shadow-purple-900/30',
  },
  indigo: {
    border: 'border-indigo-700/40', bg: 'bg-indigo-900/10',
    icon: 'bg-indigo-900/50 border border-indigo-700/50',
    badge: 'bg-indigo-700/60 text-indigo-200', bar: 'bg-indigo-500',
    accent: 'text-indigo-300', glow: 'shadow-indigo-900/30',
  },
  sky: {
    border: 'border-sky-700/40', bg: 'bg-sky-900/10',
    icon: 'bg-sky-900/50 border border-sky-700/50',
    badge: 'bg-sky-700/60 text-sky-200', bar: 'bg-sky-500',
    accent: 'text-sky-300', glow: 'shadow-sky-900/30',
  },
  amber: {
    border: 'border-amber-700/40', bg: 'bg-amber-900/10',
    icon: 'bg-amber-900/50 border border-amber-700/50',
    badge: 'bg-amber-700/60 text-amber-200', bar: 'bg-amber-400',
    accent: 'text-amber-300', glow: 'shadow-amber-900/30',
  },
  green: {
    border: 'border-green-700/40', bg: 'bg-green-900/10',
    icon: 'bg-green-900/50 border border-green-700/50',
    badge: 'bg-green-700/60 text-green-200', bar: 'bg-green-500',
    accent: 'text-green-300', glow: 'shadow-green-900/30',
  },
  slate: {
    border: 'border-slate-600/40', bg: 'bg-slate-800/20',
    icon: 'bg-slate-800/50 border border-slate-600/50',
    badge: 'bg-slate-600/60 text-slate-200', bar: 'bg-slate-400',
    accent: 'text-slate-300', glow: 'shadow-slate-900/30',
  },
};

// ─── AI RECOMMENDATIONS ─────────────────────────────────────────────────────────

const AI_RECS: Record<string, string> = {
  Agriculture: 'Rainfall advisory suggests activating drought mitigation scheme in 3 sub-districts within 72 hrs.',
  Health: 'Dengue vector index elevated in 5 wards. Recommend preemptive fogging and rapid testing deployment.',
  Infrastructure: 'Bridge load capacity on NH-48 requires immediate structural audit. Defer heavy vehicle permits.',
  'Hazard Management': 'River gauge at 94% capacity. Pre-position NDRF boats in Kolhapur and Sangli districts.',
  Education: 'Low attendance anomaly detected in 7 schools. Mid-day meal irregularity flagged for investigation.',
  Economy: 'GST collections 4.2% above projection. Recommend reallocation of surplus to infrastructure budget.',
  Transport: 'Peak congestion on 12 city corridors identified. Signal optimization can reduce wait times by 18%.',
  Energy: 'Grid demand forecast 14% spike this weekend. Activate load-balancing protocol with alternate feeders.',
  Environment: 'PM2.5 levels approaching threshold in 3 industrial zones. Issue compliance notice to violators.',
  'Law & Order': 'Predictive crime index elevated in 2 precincts. Recommend patrol redeployment and CCTV audit.',
};

// ─── STATUS BADGE ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Department['status'] }) {
  const cfg = {
    Operational: { dot: 'bg-emerald-400', text: 'text-emerald-300', label: 'Operational' },
    Alert: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300', label: 'Alert' },
    Critical: { dot: 'bg-red-400 animate-ping', text: 'text-red-300', label: 'Critical' },
  }[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

// ─── METRIC BAR ──────────────────────────────────────────────────────────────────

function MetricBar({ label, value, barColor, unit = '%' }: { label: string; value: number; barColor: string; unit?: string }) {
  const pct = unit === '%' ? value : Math.min(Math.round((value / 100) * 100), 100);
  const textColor =
    value >= 85 ? 'text-emerald-300' :
    value >= 65 ? 'text-amber-300' :
    'text-red-300';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className={`text-[11px] font-bold ${textColor}`}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0B2342]/80 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── DEPARTMENT CARD ─────────────────────────────────────────────────────────────

function DepartmentCard({ dept }: { dept: Department }) {
  const c = COLOR_MAP[dept.color] || COLOR_MAP.slate;
  const aiRec = AI_RECS[dept.name] || 'No active AI recommendations at this time.';

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} bg-[#0B2342]/50 p-5 hover:shadow-lg ${c.glow} hover:scale-[1.01] transition-all duration-200 flex flex-col gap-4`}>
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center text-xl flex-shrink-0`}>
            {dept.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{dept.name}</h3>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{dept.head}</p>
          </div>
        </div>
        <StatusBadge status={dept.status} />
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        <MetricBar label="Performance Score" value={dept.performance} barColor={c.bar} />
        <MetricBar label="Policy Compliance" value={dept.policyCompliance} barColor={c.bar} />
        <MetricBar label="Resource Usage" value={dept.resourceUsage} barColor={
          dept.resourceUsage >= 90 ? 'bg-red-500' : dept.resourceUsage >= 75 ? 'bg-amber-400' : c.bar
        } />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#0B2342]/70 border border-[#1A3A6C]/40 p-2 text-center">
          <div className={`text-base font-bold ${c.accent}`}>{dept.activeCases}</div>
          <div className="text-[9px] text-slate-500 leading-tight">Active Cases</div>
        </div>
        <div className="rounded-lg bg-[#0B2342]/70 border border-[#1A3A6C]/40 p-2 text-center cursor-pointer hover:border-amber-600/50 transition-colors">
          <div className="text-base font-bold text-amber-300">{dept.complaints}</div>
          <div className="text-[9px] text-slate-500 leading-tight">Complaints</div>
        </div>
        <div className="rounded-lg bg-[#0B2342]/70 border border-[#1A3A6C]/40 p-2 text-center">
          <div className={`text-base font-bold ${dept.alerts > 5 ? 'text-red-300' : dept.alerts > 2 ? 'text-amber-300' : 'text-emerald-300'}`}>{dept.alerts}</div>
          <div className="text-[9px] text-slate-500 leading-tight">Alerts</div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="rounded-lg border border-[#1C39BB]/30 bg-[#1C39BB]/5 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs">🤖</span>
          <span className="text-[10px] font-bold text-[#D4AF37] tracking-wider uppercase">AI Insight</span>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">{aiRec}</p>
      </div>

      {/* Actions */}
      <button className={`w-full py-2 rounded-lg border ${c.border} text-xs font-semibold ${c.accent} hover:bg-white/5 transition-colors`}>
        View Full Details →
      </button>
    </div>
  );
}

// ─── SYSTEM HEALTH GAUGE ─────────────────────────────────────────────────────────

function SystemHealthGauge({ value }: { value: number }) {
  const color = value >= 85 ? 'text-emerald-400' : value >= 70 ? 'text-amber-400' : 'text-red-400';
  const bgColor = value >= 85 ? 'stroke-emerald-500' : value >= 70 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#1A3A6C" strokeWidth="6" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            className={bgColor}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${color}`}>{value}%</span>
        </div>
      </div>
      <div>
        <div className={`text-lg font-bold ${color}`}>System Health</div>
        <div className="text-xs text-slate-400">Overall operational status across all departments</div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const router = useRouter();
  const { isGovAuthenticated, govUser, departments } = useGovStore();

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

  const allDepts = departments.length > 0 ? departments : MOCK_DEPARTMENTS;
  const operational = allDepts.filter(d => d.status === 'Operational').length;
  const alert = allDepts.filter(d => d.status === 'Alert').length;
  const critical = allDepts.filter(d => d.status === 'Critical').length;
  const avgPerformance = Math.round(allDepts.reduce((a, d) => a + d.performance, 0) / allDepts.length);
  const totalAlerts = allDepts.reduce((a, d) => a + d.alerts, 0);
  const totalCases = allDepts.reduce((a, d) => a + d.activeCases, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl border border-[#1A3A6C]/60 bg-[#0B2342]/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase">Department Command</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500">NETRAVAAH Gov Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Department Monitoring Console</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Real-time operational status across all {allDepts.length} government departments with AI-driven insights
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Logged in as</div>
            <div className="text-sm font-semibold text-white">{govUser?.name}</div>
            <div className="text-xs text-[#D4AF37]">{govUser?.role}</div>
          </div>
        </div>

        {/* Health + Quick Stats */}
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <SystemHealthGauge value={82} />
          <div className="h-10 w-px bg-[#1A3A6C]/60 hidden md:block" />
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Operational', value: operational, color: 'text-emerald-300' },
              { label: 'On Alert', value: alert, color: 'text-amber-300' },
              { label: 'Critical', value: critical, color: 'text-red-300' },
              { label: 'Avg Performance', value: `${avgPerformance}%`, color: 'text-blue-300' },
              { label: 'Active Cases', value: totalCases, color: 'text-slate-200' },
              { label: 'Total Alerts', value: totalAlerts, color: 'text-orange-300' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {totalAlerts > 0 && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 px-4 py-3 flex items-center gap-3">
          <span className="text-lg animate-pulse">⚠️</span>
          <span className="text-sm text-amber-200 font-medium">
            {totalAlerts} active alerts across {allDepts.filter(d => d.alerts > 0).length} departments requiring attention
          </span>
          <button className="ml-auto text-xs font-semibold text-amber-300 border border-amber-700/50 rounded px-3 py-1 hover:bg-amber-900/30 transition">
            View All Alerts
          </button>
        </div>
      )}

      {/* Department Grid: 2 rows × 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {allDepts.map(dept => (
          <DepartmentCard key={dept.id} dept={dept} />
        ))}
      </div>

      {/* Footer Note */}
      <div className="flex items-center gap-2 text-xs text-slate-600 pb-2">
        <span>🕐</span>
        <span>Data refreshes every 90 seconds · Last sync: {new Date().toLocaleTimeString('en-IN')}</span>
        <span className="ml-auto">NETRAVAAH Department Monitoring v2.4</span>
      </div>
    </div>
  );
}
