'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useGovStore,
  MOCK_GOV_COMPLAINTS,
  MOCK_POLICIES,
  MOCK_DEPARTMENTS,
  MOCK_RESOURCES,
  MOCK_COUNCIL,
} from '@/store/useGovStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_RECOMMENDATIONS = [
  {
    id: 'ai-1',
    priority: 'CRITICAL',
    color: 'red',
    icon: '🚨',
    title: 'Deploy NDRF flood response to Kolhapur',
    detail: 'River gauge at 97% — breach probability 89% within 6 hours',
    dept: 'Hazard Management',
  },
  {
    id: 'ai-2',
    priority: 'CRITICAL',
    color: 'red',
    icon: '🏥',
    title: 'Mobile medical units to dengue cluster',
    detail: 'Dengue 3× seasonal average in Sector 7 — 14 confirmed cases',
    dept: 'Health',
  },
  {
    id: 'ai-3',
    priority: 'HIGH',
    color: 'amber',
    icon: '⚡',
    title: 'Restore power to 3 villages — Solapur',
    detail: 'Medical equipment offline — PHC patients at critical risk',
    dept: 'Energy',
  },
  {
    id: 'ai-4',
    priority: 'HIGH',
    color: 'amber',
    icon: '🏗️',
    title: 'Load restrict Sangam Road overpass',
    detail: 'Structural cracks reported — audit due tomorrow morning',
    dept: 'Infrastructure',
  },
];

const EMERGENCY_INCIDENTS = [
  { id: 'INC-01', severity: 'CRITICAL', color: '#EF4444', label: 'Flood', title: '200 families stranded — Kolhapur Riverside Colony', time: '8h ongoing', pulse: true },
  { id: 'INC-02', severity: 'CRITICAL', color: '#EF4444', label: 'Health', title: 'Dengue outbreak — Sector 7, Pune (14 cases)', time: '12h ongoing', pulse: true },
  { id: 'INC-03', severity: 'HIGH', color: '#F59E0B', label: 'Power', title: 'Grid failure — 3 villages Solapur district', time: '48h ongoing', pulse: false },
];

const STATE_MARKERS = [
  { id: 'mh', name: 'Maharashtra', cx: 210, cy: 320, color: '#EF4444', alerts: 8 },
  { id: 'mp', name: 'Madhya Pradesh', cx: 240, cy: 260, color: '#F59E0B', alerts: 3 },
  { id: 'up', name: 'Uttar Pradesh', cx: 270, cy: 190, color: '#F59E0B', alerts: 4 },
  { id: 'rj', name: 'Rajasthan', cx: 175, cy: 200, color: '#22C55E', alerts: 1 },
  { id: 'gj', name: 'Gujarat', cx: 130, cy: 250, color: '#22C55E', alerts: 2 },
  { id: 'ka', name: 'Karnataka', cx: 200, cy: 400, color: '#3B82F6', alerts: 2 },
  { id: 'tn', name: 'Tamil Nadu', cx: 230, cy: 470, color: '#22C55E', alerts: 0 },
  { id: 'wb', name: 'West Bengal', cx: 350, cy: 240, color: '#F59E0B', alerts: 3 },
  { id: 'dl', name: 'Delhi', cx: 230, cy: 170, color: '#A855F7', alerts: 5 },
  { id: 'pb', name: 'Punjab', cx: 210, cy: 150, color: '#22C55E', alerts: 1 },
  { id: 'br', name: 'Bihar', cx: 330, cy: 200, color: '#F59E0B', alerts: 2 },
  { id: 'od', name: 'Odisha', cx: 310, cy: 300, color: '#22C55E', alerts: 1 },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, pulse = false, icon,
}: {
  label: string; value: string; sub: string; color: string; pulse?: boolean; icon: string;
}) {
  const borderMap: Record<string, string> = {
    amber: 'border-l-amber-400',
    emerald: 'border-l-emerald-400',
    red: 'border-l-red-500',
    blue: 'border-l-blue-400',
    orange: 'border-l-orange-400',
    purple: 'border-l-purple-400',
    cyan: 'border-l-cyan-400',
  };
  const textMap: Record<string, string> = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  };
  const dotMap: Record<string, string> = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    red: 'bg-red-500',
    blue: 'bg-blue-400',
    orange: 'bg-orange-400',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
  };

  return (
    <div className={`bg-[#0A1228] border border-[#1A2744] border-l-4 ${borderMap[color]} rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-[#1C39BB] transition-all duration-300`}>
      {/* background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotMap[color]}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotMap[color]}`} />
          </span>
        )}
      </div>
      <div className={`text-3xl font-black tracking-tight ${textMap[color]}`}>{value}</div>
      <div className="text-xs text-slate-400 font-medium uppercase tracking-widest leading-tight">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-6 bg-gradient-to-b from-[#D4AF37] to-[#1C39BB] rounded-full" />
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── India SVG Map ─────────────────────────────────────────────────────────────

function IndiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full flex justify-center items-center" style={{ minHeight: 340 }}>
      <svg
        viewBox="0 0 500 560"
        className="w-full max-w-[420px]"
        style={{ filter: 'drop-shadow(0 0 32px rgba(28,57,187,0.25))' }}
      >
        {/* India simplified outline */}
        <path
          d="M 250 15 
             C 255 10, 260 10, 265 15
             C 270 20, 280 15, 285 20
             C 290 25, 295 25, 300 35
             C 305 45, 310 50, 305 60
             C 300 70, 290 70, 285 80
             C 280 90, 285 100, 295 105
             C 305 110, 315 100, 320 110
             C 325 120, 340 125, 350 135
             C 360 145, 370 135, 375 150
             C 380 165, 395 160, 410 155
             C 425 150, 440 155, 450 160
             C 460 165, 470 170, 480 175
             C 490 180, 500 190, 495 200
             C 490 210, 480 210, 475 220
             C 470 230, 475 245, 465 250
             C 455 255, 450 245, 440 250
             C 430 255, 425 265, 420 280
             C 415 295, 420 310, 410 320
             C 400 330, 395 320, 390 335
             C 385 350, 375 340, 370 355
             C 365 370, 350 375, 345 365
             C 340 355, 345 340, 335 335
             C 325 330, 320 320, 315 330
             C 310 340, 305 355, 305 370
             C 305 385, 310 400, 300 415
             C 290 430, 285 445, 275 460
             C 265 475, 255 490, 250 505
             C 245 520, 240 525, 235 520
             C 230 515, 220 490, 215 470
             C 210 450, 195 430, 190 410
             C 185 390, 175 370, 165 350
             C 155 330, 145 310, 150 290
             C 155 270, 140 265, 125 265
             C 110 265, 95 255, 85 250
             C 75 245, 70 235, 80 230
             C 90 225, 105 230, 115 225
             C 125 220, 135 210, 140 200
             C 145 190, 150 175, 155 160
             C 160 145, 175 135, 185 120
             C 195 105, 200 90, 210 80
             C 220 70, 225 60, 235 50
             C 245 40, 245 35, 250 15 Z"
          fill="none"
          stroke="#1A3A6C"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner shading */}
        <path
          d="M 250 15 
             C 255 10, 260 10, 265 15
             C 270 20, 280 15, 285 20
             C 290 25, 295 25, 300 35
             C 305 45, 310 50, 305 60
             C 300 70, 290 70, 285 80
             C 280 90, 285 100, 295 105
             C 305 110, 315 100, 320 110
             C 325 120, 340 125, 350 135
             C 360 145, 370 135, 375 150
             C 380 165, 395 160, 410 155
             C 425 150, 440 155, 450 160
             C 460 165, 470 170, 480 175
             C 490 180, 500 190, 495 200
             C 490 210, 480 210, 475 220
             C 470 230, 475 245, 465 250
             C 455 255, 450 245, 440 250
             C 430 255, 425 265, 420 280
             C 415 295, 420 310, 410 320
             C 400 330, 395 320, 390 335
             C 385 350, 375 340, 370 355
             C 365 370, 350 375, 345 365
             C 340 355, 345 340, 335 335
             C 325 330, 320 320, 315 330
             C 310 340, 305 355, 305 370
             C 305 385, 310 400, 300 415
             C 290 430, 285 445, 275 460
             C 265 475, 255 490, 250 505
             C 245 520, 240 525, 235 520
             C 230 515, 220 490, 215 470
             C 210 450, 195 430, 190 410
             C 185 390, 175 370, 165 350
             C 155 330, 145 310, 150 290
             C 155 270, 140 265, 125 265
             C 110 265, 95 255, 85 250
             C 75 245, 70 235, 80 230
             C 90 225, 105 230, 115 225
             C 125 220, 135 210, 140 200
             C 145 190, 150 175, 155 160
             C 160 145, 175 135, 185 120
             C 195 105, 200 90, 210 80
             C 220 70, 225 60, 235 50
             C 245 40, 245 35, 250 15 Z"
          fill="url(#mapGrad)"
          fillOpacity="0.4"
        />

        <defs>
          <radialGradient id="mapGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1C39BB" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0B2342" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        {/* Grid lines */}
        {[100, 180, 260, 340, 420, 500].map(y => (
          <line key={y} x1="50" y1={y} x2="450" y2={y} stroke="#1A3A6C" strokeWidth="0.3" strokeDasharray="4,6" />
        ))}
        {[100, 180, 260, 340, 420].map(x => (
          <line key={x} x1={x} y1="30" x2={x} y2="530" stroke="#1A3A6C" strokeWidth="0.3" strokeDasharray="4,6" />
        ))}

        {/* State markers */}
        {STATE_MARKERS.map(m => (
          <g
            key={m.id}
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Pulse ring */}
            {m.alerts > 2 && (
              <circle cx={m.cx} cy={m.cy} r="10" fill="none" stroke={m.color} strokeWidth="1" opacity="0.4">
                <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Dot */}
            <circle
              cx={m.cx}
              cy={m.cy}
              r={hovered === m.id ? 7 : 5}
              fill={m.color}
              style={{ transition: 'r 0.2s', filter: `drop-shadow(0 0 6px ${m.color})` }}
            />
            {/* Label on hover */}
            {hovered === m.id && (
              <>
                <rect x={m.cx + 9} y={m.cy - 14} width={m.name.length * 6 + 16} height={26} rx="4" fill="#0A1228" stroke="#1A2744" strokeWidth="1" />
                <text x={m.cx + 17} y={m.cy - 1} fill="white" fontSize="9" fontWeight="700">{m.name}</text>
                <text x={m.cx + 17} y={m.cy + 8} fill={m.color} fontSize="8">{m.alerts} alerts</text>
              </>
            )}
          </g>
        ))}

        {/* Legend */}
        {[
          { color: '#EF4444', label: 'Critical' },
          { color: '#F59E0B', label: 'Alert' },
          { color: '#22C55E', label: 'Normal' },
          { color: '#A855F7', label: 'Monitoring' },
        ].map((l, i) => (
          <g key={l.label} transform={`translate(${95 + i * 56}, 525)`}>
            <circle cx="5" cy="5" r="4" fill={l.color} />
            <text x="12" y="9" fill="#94a3b8" fontSize="8">{l.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Department Performance ────────────────────────────────────────────────────

function DeptPerformance() {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    slate: 'bg-slate-400',
  };
  const statusColor: Record<string, string> = {
    Operational: 'text-emerald-400',
    Alert: 'text-amber-400',
    Critical: 'text-red-400',
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {MOCK_DEPARTMENTS.map(d => (
        <div key={d.id} className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3 hover:border-[#1C39BB]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{d.icon}</span>
              <span className="text-xs font-semibold text-white">{d.name}</span>
            </div>
            <span className={`text-xs font-bold ${statusColor[d.status]}`}>{d.performance}%</span>
          </div>
          <div className="h-1.5 bg-[#1A2744] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colorMap[d.color] || 'bg-blue-500'} transition-all`}
              style={{ width: `${d.performance}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-500">{d.activeCases} cases</span>
            <span className={`text-[10px] font-medium ${statusColor[d.status]}`}>{d.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Resource Bar Chart ────────────────────────────────────────────────────────

function ResourceChart() {
  const data = MOCK_RESOURCES.map(r => ({
    label: r.category,
    pct: Math.round((r.allocated / r.totalStock) * 100),
    criticality: r.criticality,
  }));

  const critColor: Record<string, string> = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Normal: '#1C39BB',
  };

  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-300 font-medium">{d.label}</span>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                style={{ color: critColor[d.criticality], backgroundColor: `${critColor[d.criticality]}22` }}
              >
                {d.criticality}
              </span>
              <span className="text-xs font-bold" style={{ color: critColor[d.criticality] }}>{d.pct}%</span>
            </div>
          </div>
          <div className="h-2 bg-[#1A2744] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${d.pct}%`,
                backgroundColor: critColor[d.criticality],
                boxShadow: `0 0 8px ${critColor[d.criticality]}88`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Policy Timeline ───────────────────────────────────────────────────────────

function PolicyTimeline() {
  const statusColor: Record<string, string> = {
    Draft: 'text-slate-400 bg-slate-800',
    'Under Review': 'text-amber-300 bg-amber-900/40',
    Approved: 'text-blue-300 bg-blue-900/40',
    Published: 'text-emerald-300 bg-emerald-900/40',
    Archived: 'text-slate-500 bg-slate-900/40',
  };
  const dotColor: Record<string, string> = {
    Draft: 'bg-slate-500',
    'Under Review': 'bg-amber-400',
    Approved: 'bg-blue-400',
    Published: 'bg-emerald-400',
    Archived: 'bg-slate-600',
  };

  return (
    <div className="relative space-y-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#D4AF37]/60 via-[#1C39BB]/40 to-transparent" />
      {MOCK_POLICIES.slice(0, 5).map(p => (
        <div key={p.id} className="flex gap-4 pl-2">
          <div className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full flex-shrink-0 ring-2 ring-[#070D1A] ${dotColor[p.status]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[p.status]}`}
              >
                {p.status}
              </span>
              <span className="text-[10px] text-slate-500">{p.id}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-tight truncate">{p.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{p.department} · {p.effectiveDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Complaints Feed ───────────────────────────────────────────────────────────

function ComplaintsFeed() {
  const statusColor: Record<string, string> = {
    Submitted: 'text-slate-400 bg-slate-800',
    'Under Review': 'text-amber-300 bg-amber-900/40',
    Assigned: 'text-blue-300 bg-blue-900/40',
    'In Progress': 'text-cyan-300 bg-cyan-900/40',
    Resolved: 'text-emerald-300 bg-emerald-900/40',
    Closed: 'text-slate-500 bg-slate-900/40',
  };
  const prioColor: Record<string, string> = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Medium: '#3B82F6',
    Low: '#6B7280',
  };

  return (
    <div className="space-y-2.5">
      {MOCK_GOV_COMPLAINTS.slice(0, 5).map(c => (
        <div
          key={c.id}
          className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3 hover:border-[#1C39BB]/60 transition-colors"
          style={{ borderLeftColor: prioColor[c.priority], borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] text-slate-500 font-mono">{c.id}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ color: prioColor[c.priority], backgroundColor: `${prioColor[c.priority]}22` }}
                >
                  {c.priority}
                </span>
              </div>
              <p className="text-xs text-white font-medium leading-tight truncate">{c.title}</p>
              <p className="text-[10px] text-slate-500 mt-1">{c.district} · {timeAgo(c.submittedAt)}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusColor[c.status]}`}>
              {c.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Council Preview ────────────────────────────────────────────────────────────

function CouncilPreview() {
  const router = useRouter();
  const prioColor: Record<string, string> = {
    Critical: '#EF4444',
    High: '#F59E0B',
    Medium: '#3B82F6',
  };

  return (
    <div className="space-y-4">
      {MOCK_COUNCIL.slice(0, 2).map(rec => {
        const approves = rec.agentVotes.filter(v => v.vote === 'Approve').length;
        const total = rec.agentVotes.length;
        const pct = Math.round((approves / total) * 100);

        return (
          <div key={rec.id} className="bg-[#070D1A] border border-[#1A2744] rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: prioColor[rec.priority], boxShadow: `0 0 8px ${prioColor[rec.priority]}` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white leading-tight">{rec.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{rec.domain} · {rec.id}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                style={{ color: prioColor[rec.priority], backgroundColor: `${prioColor[rec.priority]}22` }}
              >
                {rec.priority}
              </span>
            </div>

            {/* Consensus / Risk bars */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Consensus</span>
                  <span className="text-[10px] font-bold text-emerald-400">{rec.consensusScore}%</span>
                </div>
                <div className="h-1.5 bg-[#1A2744] rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rec.consensusScore}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Risk Level</span>
                  <span className="text-[10px] font-bold text-red-400">{rec.riskScore}%</span>
                </div>
                <div className="h-1.5 bg-[#1A2744] rounded-full">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${rec.riskScore}%` }} />
                </div>
              </div>
            </div>

            {/* Voting pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rec.agentVotes.map(v => (
                <span
                  key={v.agent}
                  className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    v.vote === 'Approve' ? 'bg-emerald-900/50 text-emerald-300' :
                    v.vote === 'Reject' ? 'bg-red-900/50 text-red-300' :
                    'bg-slate-800 text-slate-400'
                  }`}
                >
                  {v.agent.replace(' AI Agent', '').replace(' Agent', '')} · {v.confidence}%
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  rec.status === 'Pending Human Review' ? 'bg-amber-900/50 text-amber-300' :
                  rec.status === 'Approved' ? 'bg-emerald-900/50 text-emerald-300' :
                  'bg-blue-900/50 text-blue-300'
                }`}
              >
                {rec.status}
              </span>
              <span className="text-[10px] text-slate-500">{pct}% agents approve</span>
            </div>
          </div>
        );
      })}

      <button
        onClick={() => router.push('/gov/council')}
        className="w-full py-2 text-xs font-bold tracking-widest uppercase text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 transition-all"
      >
        Review All Council Items →
      </button>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { isGovAuthenticated, govUser } = useGovStore();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isGovAuthenticated) {
      router.replace('/gov/login');
    }
  }, [isGovAuthenticated, router]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!isGovAuthenticated) return null;

  const KPI_CARDS = [
    { label: 'Total Complaints', value: '1,247', sub: '↑ 8 today', color: 'amber', icon: '📋', pulse: false },
    { label: 'Resolved Today', value: '89', sub: '↑ 12% vs yesterday', color: 'emerald', icon: '✅', pulse: false },
    { label: 'Pending Critical', value: '23', sub: 'Immediate action required', color: 'red', icon: '🔴', pulse: true },
    { label: 'Active Policies', value: '156', sub: '12 under review', color: 'blue', icon: '📜', pulse: false },
    { label: 'District Coverage', value: '36/36', sub: 'All districts online', color: 'emerald', icon: '🗺️', pulse: false },
    { label: 'Active Alerts', value: '8', sub: '3 critical severity', color: 'orange', icon: '⚠️', pulse: true },
    { label: 'Resource Deployments', value: '342', sub: '94% utilization rate', color: 'purple', icon: '📦', pulse: false },
    { label: 'Ongoing Operations', value: '12', sub: '4 NDRF, 8 district', color: 'cyan', icon: '⚙️', pulse: false },
  ];

  return (
    <div className="min-h-screen bg-[#070D1A] text-white overflow-x-hidden">
      {/* Noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}
      />

      <div className="relative z-10 max-w-[1800px] mx-auto px-6 py-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1A2744]">
          <div className="flex items-start gap-4">
            {/* Emblem */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#0B2342] border border-[#1A3A6C] flex items-center justify-center text-2xl shadow-lg shadow-[#1C39BB]/20">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                  Executive Intelligence Dashboard
                </h1>
                <span className="px-2.5 py-1 bg-red-900/50 border border-red-700/60 rounded text-[10px] font-black text-red-300 tracking-widest animate-pulse">
                  CLASSIFIED • LEVEL 3
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 tracking-wide">
                Real-time national governance command overview
              </p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Session Operator: <span className="text-[#D4AF37]/90">{govUser?.name}</span> — {govUser?.role}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{formatDate(now)}</span>
                <span className="text-xs text-[#D4AF37] font-mono font-bold tracking-widest">{formatTime(now)} IST</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1C39BB] hover:bg-[#2548d4] border border-[#1C39BB] rounded-lg text-xs font-bold text-white tracking-wide transition-all shadow-lg shadow-[#1C39BB]/30">
              <span>📊</span> Generate Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-red-700/80 hover:bg-red-600 border border-red-600 rounded-lg text-xs font-bold text-white tracking-wide transition-all shadow-lg shadow-red-900/30">
              <span>📡</span> Broadcast Alert
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0A1228] hover:bg-[#0d1830] border border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-lg text-xs font-bold text-[#D4AF37] tracking-wide transition-all">
              <span>💾</span> Export Data
            </button>
          </div>
        </div>

        {/* ── KPI GRID ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3">
          {KPI_CARDS.map(k => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* ── MAIN 3-COL GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* COL 1 — AI Recommendations + Emergency Incidents */}
          <div className="space-y-6">

            {/* AI Recommendations */}
            <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
              <SectionHeader title="AI Recommendations" subtitle="Prioritized by risk engine" />
              <div className="space-y-3">
                {AI_RECOMMENDATIONS.map(r => (
                  <div
                    key={r.id}
                    className={`bg-[#070D1A] border rounded-lg p-3.5 transition-all hover:scale-[1.01] ${
                      r.color === 'red' ? 'border-red-800/60 hover:border-red-600' : 'border-amber-800/40 hover:border-amber-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest ${
                              r.color === 'red'
                                ? 'bg-red-900/60 text-red-300 border border-red-700/40'
                                : 'bg-amber-900/60 text-amber-300 border border-amber-700/40'
                            }`}
                          >
                            {r.priority}
                          </span>
                          <span className="text-[9px] text-slate-500">{r.dept}</span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-tight">{r.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-tight">{r.detail}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      <button className="flex-1 py-1.5 text-[10px] font-bold text-white bg-[#1C39BB] hover:bg-[#2548d4] rounded transition-colors">
                        Act Now
                      </button>
                      <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border border-[#1A2744] hover:border-slate-500 rounded transition-colors">
                        Defer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Incidents */}
            <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
              <SectionHeader title="Emergency Incidents" subtitle="Active ongoing emergencies" />
              <div className="space-y-3">
                {EMERGENCY_INCIDENTS.map(inc => (
                  <div
                    key={inc.id}
                    className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3 flex items-start gap-3"
                    style={{ borderLeftColor: inc.color, borderLeftWidth: 3 }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {inc.pulse ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: inc.color }} />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: inc.color }} />
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: inc.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider"
                          style={{ color: inc.color, backgroundColor: `${inc.color}22` }}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-[9px] text-slate-500">{inc.label}</span>
                      </div>
                      <p className="text-xs text-white font-medium leading-tight">{inc.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{inc.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COL 2 — Map + Department Performance */}
          <div className="xl:col-span-2 space-y-6">

            {/* India Map */}
            <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <SectionHeader title="National Operations Map" subtitle="Live alert distribution across states" />
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  All 36 districts online
                </div>
              </div>
              <IndiaMap />
            </div>

            {/* Department Performance */}
            <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
              <SectionHeader title="Department Performance Overview" subtitle="Health scores — all 10 departments" />
              <DeptPerformance />
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Complaints Feed */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Recent Complaints Feed" subtitle="Last 5 submissions" />
              <button
                onClick={() => router.push('/gov/complaints')}
                className="text-[10px] text-[#1C39BB] hover:text-blue-400 font-bold tracking-wide transition-colors"
              >
                View All →
              </button>
            </div>
            <ComplaintsFeed />
          </div>

          {/* Policy Activity Timeline */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Policy Activity" subtitle="Recent policy lifecycle events" />
              <button
                onClick={() => router.push('/gov/policies')}
                className="text-[10px] text-[#1C39BB] hover:text-blue-400 font-bold tracking-wide transition-colors"
              >
                View All →
              </button>
            </div>
            <PolicyTimeline />
          </div>

          {/* Resource Utilization */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
            <SectionHeader title="Resource Utilization" subtitle="Allocation % across critical categories" />
            <ResourceChart />

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#1A2744]">
              <div className="text-center">
                <div className="text-lg font-black text-red-400">
                  {MOCK_RESOURCES.filter(r => r.criticality === 'Critical').length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-amber-400">
                  {MOCK_RESOURCES.filter(r => r.criticality === 'High').length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">High</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-emerald-400">
                  {MOCK_RESOURCES.filter(r => r.criticality === 'Normal').length}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Normal</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── GOVERNANCE COUNCIL PREVIEW ──────────────────────────── */}
        <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-3">
                <SectionHeader title="Governance AI Council" subtitle="Top-priority multi-agent consensus recommendations" />
                <span className="mb-4 px-2.5 py-1 bg-amber-900/40 border border-amber-700/40 rounded text-[10px] font-bold text-amber-300 tracking-wider">
                  {MOCK_COUNCIL.filter(r => r.status === 'Pending Human Review').length} AWAITING REVIEW
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CouncilPreview />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1A2744] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-600">
          <div className="flex items-center gap-3">
            <span>🏛️ NETRAVAAH National Governance Platform</span>
            <span>·</span>
            <span>Version 2.4.1</span>
            <span>·</span>
            <span className="text-emerald-700">● All systems operational</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last sync: {formatTime(now)}</span>
            <span>·</span>
            <span className="text-red-700 font-semibold tracking-wider">RESTRICTED ACCESS — GOVERNMENT USE ONLY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
