// components/health/AgentResponseCard.tsx
import React from 'react';
import { HealthAgentReport } from '../../types/health';
import { RiskIndicator } from './RiskIndicator';

interface AgentResponseCardProps {
  report: HealthAgentReport;
  onDeploy?: (requirements: HealthAgentReport['resource_requirements']) => void;
}

export function AgentResponseCard({ report, onDeploy }: AgentResponseCardProps) {
  const {
    query_text,
    district_name,
    risk_level,
    contributing_factors,
    expected_spread,
    recommended_actions,
    resource_requirements,
    confidence_score,
  } = report;

  // Color mappings based on risk level
  const riskColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    CRITICAL: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
    },
    HIGH: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    },
    MEDIUM: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    },
    LOW: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
  };

  const currentRisk = (risk_level || 'medium').toUpperCase();
  const theme = riskColors[currentRisk] || riskColors.MEDIUM;

  const confidencePct = Math.round((confidence_score || 0.85) * 100);

  return (
    <div className={`w-full rounded-xl bg-[#0A1228] border ${theme.border} p-6 ${theme.glow} transition-all duration-350`}>
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1A2744] pb-4 mb-5">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#1C39BB] dark:text-blue-400">
            Advisory Agent Report • {district_name}
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">Health Governance Decision Advisory</h3>
        </div>
        <div className="flex items-center gap-3 bg-[#070D1A] border border-[#1A2744] px-4 py-2 rounded-lg">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Confidence Index</div>
            <div className="text-sm font-mono font-bold text-white">{confidencePct}%</div>
          </div>
          <svg className="w-8 h-8" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={theme.text}
              strokeWidth="2.5"
              strokeDasharray={`${confidencePct}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>
      </div>

      {/* Query Context */}
      <div className="bg-[#070D1A]/50 border border-[#1A2744] rounded-lg p-3.5 mb-5">
        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Triggering Scenario/Query</span>
        <p className="text-xs text-slate-300 italic">"{query_text}"</p>
      </div>

      {/* Main Grid: Risk & Spread */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Threat Evaluation</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">System assessment</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <RiskIndicator level={currentRisk} size="lg" />
            <span className={`text-xl font-black tracking-wide ${theme.text}`}>{currentRisk}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The multi-agent consensus scoring identifies this cluster as {currentRisk.toLowerCase()} severity, requiring immediate localized operational mobilization.
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#1A2744] bg-[#070D1A]">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">Spread Dynamics Forecast</span>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {expected_spread || "Slow replication, low immediate growth rate predicted under current weather controls."}
          </p>
        </div>
      </div>

      {/* Key Issues & Actions Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Contributing Escalation Factors
          </h4>
          <ul className="space-y-2">
            {contributing_factors && contributing_factors.length > 0 ? (
              contributing_factors.map((factor, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 bg-[#070D1A]/30 border border-[#1A2744]/40 p-2 rounded">
                  <span className="text-[#1C39BB] dark:text-blue-400 font-mono text-[10px] font-bold">0{idx + 1}.</span>
                  <span className="flex-1 leading-normal">{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">No specific factors reported.</li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Mitigating Policy Recommendations
          </h4>
          <ul className="space-y-2">
            {recommended_actions && recommended_actions.length > 0 ? (
              recommended_actions.map((action, idx) => (
                <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 bg-[#070D1A]/30 border border-[#1A2744]/40 p-2 rounded">
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">✓</span>
                  <span className="flex-1 leading-normal">{action}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">No actions recommended.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Resource Allocation Projections */}
      {resource_requirements && Object.keys(resource_requirements).length > 0 && (
        <div className="border-t border-[#1A2744] pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Resource Mobilization Blueprint</h4>
              <span className="text-[10px] text-slate-500">Predicted inventory requirements for containment</span>
            </div>
            {onDeploy && (
              <button
                onClick={() => onDeploy(resource_requirements)}
                className="bg-[#1C39BB] hover:bg-blue-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg border border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer"
              >
                Deploy Reserves
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {Object.entries(resource_requirements).map(([key, val]) => {
              if (val === undefined || val === null || val === 0) return null;
              const title = key.replace(/_/g, ' ').toUpperCase();
              return (
                <div key={key} className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3 text-center">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 truncate">{title}</div>
                  <div className="text-lg font-mono font-bold text-white">{val}</div>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full w-[70%]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
