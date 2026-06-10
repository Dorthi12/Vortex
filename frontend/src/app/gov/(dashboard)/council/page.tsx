'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore, MOCK_COUNCIL, CouncilRecommendation } from '@/store/useGovStore';
import {
  Users, CheckCircle2, XCircle, Clock, Zap, AlertTriangle,
  TrendingUp, Shield, CheckCheck, X, ChevronRight, FileText,
  Activity, BarChart2, Brain
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function priorityConfig(p: CouncilRecommendation['priority']) {
  const map = {
    Critical: { text: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30',   dot: 'bg-red-500',   label: 'CRITICAL' },
    High:     { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-500', label: 'HIGH'     },
    Medium:   { text: 'text-sky-400',   bg: 'bg-sky-500/10',   border: 'border-sky-500/30',   dot: 'bg-sky-400',   label: 'MEDIUM'   },
  };
  return map[p];
}

function voteConfig(v: 'Approve' | 'Reject' | 'Abstain') {
  const map = {
    Approve: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', label: 'APPROVE', icon: CheckCircle2 },
    Reject:  { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40',     label: 'REJECT',  icon: XCircle },
    Abstain: { text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/40',   label: 'ABSTAIN', icon: Clock },
  };
  return map[v];
}

function statusConfig(s: CouncilRecommendation['status']) {
  const map: Record<string, { text: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
    'Pending Human Review': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', icon: Clock,       label: 'PENDING REVIEW' },
    'Approved':             { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', icon: CheckCheck, label: 'APPROVED' },
    'Rejected':             { text: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/40',   icon: X,          label: 'REJECTED' },
    'Implemented':          { text: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/40', icon: Zap,        label: 'IMPLEMENTED' },
  };
  return map[s] || map['Pending Human Review'];
}

function ConsensusGauge({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#1A2744" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Consensus</span>
    </div>
  );
}

function RiskMeter({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-red-500' : score >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = score >= 90 ? 'text-red-400' : score >= 70 ? 'text-amber-400' : 'text-emerald-400';
  const label = score >= 90 ? 'CRITICAL RISK' : score >= 70 ? 'HIGH RISK' : 'MODERATE RISK';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Risk Score</span>
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[#1A2744] rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={`text-sm font-black w-10 text-right ${textColor}`}>{score}</span>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CouncilCard({ rec }: { rec: CouncilRecommendation }) {
  const { updateCouncilStatus, govUser } = useGovStore();
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null);
  const pCfg = priorityConfig(rec.priority);
  const sCfg = statusConfig(rec.status);
  const SIcon = sCfg.icon;

  const handleAction = (action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    updateCouncilStatus(rec.id, newStatus as CouncilRecommendation['status']);
    setConfirming(null);
  };

  const approveCount = rec.agentVotes.filter(v => v.vote === 'Approve').length;

  return (
    <div className={`relative bg-gradient-to-br from-[#0D1E3A] to-[#070D1A] border rounded-2xl overflow-hidden shadow-xl
      ${rec.priority === 'Critical' ? 'border-red-500/30' : rec.priority === 'High' ? 'border-amber-500/20' : 'border-[#1A2744]'}`}
    >
      {/* Top accent bar */}
      <div className={`h-[3px] w-full ${rec.priority === 'Critical' ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-600' : rec.priority === 'High' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#1C39BB] to-[#1A3A6C]'}`} />

      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Domain */}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-[#1C39BB]/20 text-[#8099ee] border border-[#1C39BB]/30 uppercase">
                {rec.domain}
              </span>
              {/* Priority */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest ${pCfg.bg} ${pCfg.text} border ${pCfg.border} uppercase`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot} animate-pulse`} />
                {pCfg.label}
              </span>
              {/* Status */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest ${sCfg.bg} ${sCfg.text} border ${sCfg.border} uppercase`}>
                <SIcon size={10} />
                {sCfg.label}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg leading-snug">{rec.title}</h3>
            <p className="text-slate-500 text-xs mt-1 font-mono">
              ID: {rec.id} &nbsp;·&nbsp; Created: {fmtTime(rec.createdAt)}
            </p>
          </div>
          {/* Vote summary pill */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-[#0B2342] border border-[#1A2744] rounded-xl">
            <span className="text-emerald-400 font-black text-2xl">{approveCount}/{rec.agentVotes.length}</span>
            <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">Agents Approve</span>
          </div>
        </div>

        {/* ── Agent Votes ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-[#D4AF37]" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Agent Voting Panel</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rec.agentVotes.map((vote, i) => {
              const vCfg = voteConfig(vote.vote);
              const VIcon = vCfg.icon;
              return (
                <div key={i} className="bg-[#070D1A] border border-[#1A2744] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-xs font-semibold truncate">{vote.agent}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${vCfg.bg} ${vCfg.text} ${vCfg.border} flex-shrink-0`}>
                      <VIcon size={9} />
                      {vCfg.label}
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Confidence</span>
                      <span className={`text-[10px] font-bold ${vCfg.text}`}>{vote.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1A2744] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${vote.vote === 'Approve' ? 'bg-emerald-500' : vote.vote === 'Reject' ? 'bg-red-500' : 'bg-slate-500'}`}
                        style={{ width: `${vote.confidence}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed italic">&ldquo;{vote.reason}&rdquo;</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Metrics Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#070D1A]/60 rounded-xl border border-[#1A2744]">
          <div className="flex justify-center">
            <ConsensusGauge score={rec.consensusScore} />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <RiskMeter score={rec.riskScore} />
            {rec.policyRef && (
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Policy Ref:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold font-mono">
                  {rec.policyRef}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        {rec.status === 'Pending Human Review' && (
          <div className="border-t border-[#1A2744] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Awaiting Human Authorization</span>
            </div>
            {confirming === null ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming('approve')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-sm tracking-wider uppercase transition-all duration-200 group"
                >
                  <CheckCheck size={16} className="group-hover:scale-110 transition-transform" />
                  APPROVE
                </button>
                <button
                  onClick={() => setConfirming('reject')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 hover:border-red-400 text-red-300 font-bold text-sm tracking-wider uppercase transition-all duration-200 group"
                >
                  <X size={16} className="group-hover:scale-110 transition-transform" />
                  REJECT
                </button>
              </div>
            ) : (
              <div className={`rounded-xl p-4 border ${confirming === 'approve' ? 'bg-emerald-900/20 border-emerald-500/40' : 'bg-red-900/20 border-red-500/40'}`}>
                <p className="text-white text-sm font-semibold mb-3">
                  Confirm: <span className={confirming === 'approve' ? 'text-emerald-400' : 'text-red-400'}>
                    {confirming === 'approve' ? 'APPROVE' : 'REJECT'}
                  </span> this recommendation?
                </p>
                <p className="text-slate-400 text-xs mb-4">
                  This action will be recorded in the audit log as: <span className="font-mono text-slate-300">{govUser?.name || 'Officer'}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(confirming)}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm tracking-wider uppercase transition-all ${confirming === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                  >
                    Confirm {confirming === 'approve' ? 'Approval' : 'Rejection'}
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="flex-1 py-2 rounded-lg font-semibold text-sm text-slate-400 hover:text-white bg-[#1A2744] hover:bg-[#1A3A6C] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Outcome (if actioned) ── */}
        {(rec.status === 'Approved' || rec.status === 'Rejected' || rec.status === 'Implemented') && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rec.status === 'Approved' || rec.status === 'Implemented' ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
            {rec.status === 'Approved' || rec.status === 'Implemented' ? (
              <CheckCheck size={16} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <X size={16} className="text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${rec.status === 'Approved' || rec.status === 'Implemented' ? 'text-emerald-400' : 'text-red-400'}`}>
                {rec.status === 'Implemented' ? 'Approved & Implemented' : rec.status}
              </p>
              <p className="text-slate-400 text-[11px]">
                Reviewed by {govUser?.name || 'Authorized Officer'} · {govUser?.role || 'National Administrator'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouncilPage() {
  const router = useRouter();
  const { isGovAuthenticated, councilItems } = useGovStore();

  React.useEffect(() => {
    if (!isGovAuthenticated) router.replace('/gov/login');
  }, [isGovAuthenticated, router]);

  if (!isGovAuthenticated) return null;

  const items = [...councilItems].sort((a, b) => {
    // Critical + Pending first
    const priorityOrder = { Critical: 0, High: 1, Medium: 2 };
    const statusOrder: Record<string, number> = { 'Pending Human Review': 0, Approved: 1, Rejected: 2, Implemented: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority])
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
  });

  const pending     = items.filter(r => r.status === 'Pending Human Review').length;
  const approved    = items.filter(r => r.status === 'Approved' || r.status === 'Implemented').length;
  const implemented = items.filter(r => r.status === 'Implemented').length;
  const critical    = items.filter(r => r.priority === 'Critical').length;

  const stats = [
    { label: 'Pending Review',   value: pending,     icon: Clock,     color: 'text-amber-400', bg: 'bg-amber-500/10',   border: 'border-amber-500/20', badge: true },
    { label: 'Approved Today',   value: approved,    icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Implemented',      value: implemented, icon: Zap,       color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10',   border: 'border-[#D4AF37]/20' },
    { label: 'Critical Priority',value: critical,    icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: true },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1A3A6C] to-[#0B2342] border border-[#D4AF37]/40 flex items-center justify-center">
              <Users size={14} className="text-[#D4AF37]" />
            </div>
            <span className="text-[10px] tracking-[0.3em] text-[#D4AF37]/60 font-semibold uppercase">NETRAVAAH GOV</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Governance Council</h1>
          <p className="text-slate-400 text-sm mt-0.5">Multi-agent AI consensus recommendations awaiting human review</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0D1E3A] border border-[#1A2744] rounded-xl">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-slate-400 text-xs font-mono">{items.length} active recommendations</span>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`relative flex items-center gap-3 p-4 rounded-xl border ${s.bg} ${s.border} bg-[#0D1E3A]`}>
              <div className={`w-10 h-10 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                  {(s as { badge?: boolean }).badge && s.value > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black animate-pulse ${s.color} bg-current/10`}
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] font-medium">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Council Cards ── */}
      <div className="space-y-6">
        {items.map(rec => (
          <CouncilCard key={rec.id} rec={rec} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0D1E3A] border border-[#1A2744] flex items-center justify-center mb-4">
            <BarChart2 size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-semibold">No council recommendations</p>
          <p className="text-slate-600 text-sm mt-1">AI agents are monitoring — recommendations will appear here</p>
        </div>
      )}
    </div>
  );
}
