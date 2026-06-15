// components/health/SimulationChart.tsx
import React, { useState } from 'react';

interface SimulationChartProps {
  timeline: Array<{
    day: number;
    S: number;
    E: number;
    I: number;
    R: number;
    new_cases: number;
  }>;
  height?: number;
}

type CurveType = 'S' | 'E' | 'I' | 'R';

export function SimulationChart({ timeline, height = 250 }: SimulationChartProps) {
  const [activeCurves, setActiveCurves] = useState<Record<CurveType, boolean>>({
    S: true,
    E: true,
    I: true,
    R: true
  });

  if (!timeline || timeline.length === 0) return null;

  const toggleCurve = (type: CurveType) => {
    setActiveCurves(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const width = 600;
  const paddingLeft = 50;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const daysCount = timeline.length;
  
  // Find max value in timeline for scaling (only counting active curves)
  let maxVal = 100;
  timeline.forEach(d => {
    if (activeCurves.S && d.S > maxVal) maxVal = d.S;
    if (activeCurves.E && d.E > maxVal) maxVal = d.E;
    if (activeCurves.I && d.I > maxVal) maxVal = d.I;
    if (activeCurves.R && d.R > maxVal) maxVal = d.R;
  });

  // Calculate coordinates for curves
  const getCoordinates = (key: CurveType) => {
    return timeline.map((d, idx) => {
      const x = paddingLeft + (idx / (daysCount - 1)) * chartWidth;
      const val = d[key];
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, val };
    });
  };

  const curvesConfig: Record<CurveType, { label: string; color: string; fill: string }> = {
    S: { label: 'Susceptible (S)', color: '#3B82F6', fill: 'rgba(59, 130, 246, 0.03)' },
    E: { label: 'Exposed (E)', color: '#F59E0B', fill: 'rgba(245, 158, 11, 0.05)' },
    I: { label: 'Infectious (I)', color: '#EF4444', fill: 'rgba(239, 68, 68, 0.08)' },
    R: { label: 'Recovered (R)', color: '#10B981', fill: 'rgba(16, 185, 129, 0.05)' }
  };

  // Generate SVG path for a curve
  const getPathStrings = (key: CurveType) => {
    const coords = getCoordinates(key);
    if (coords.length === 0) return { line: '', area: '' };
    
    const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const area = `${line} L ${coords[coords.length - 1].x},${paddingTop + chartHeight} L ${coords[0].x},${paddingTop + chartHeight} Z`;
    
    return { line, area };
  };

  // Grid Lines
  const gridLinesCount = 4;
  const gridLines = [];
  for (let i = 0; i <= gridLinesCount; i++) {
    const ratio = i / gridLinesCount;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    const val = Math.round(ratio * maxVal);
    gridLines.push({ y, val });
  }

  // Generate 5 labels for X-axis
  const xLabelsCount = 5;
  const xLabels = [];
  for (let i = 0; i < xLabelsCount; i++) {
    const ratio = i / (xLabelsCount - 1);
    const dayIndex = Math.min(daysCount - 1, Math.round(ratio * (daysCount - 1)));
    const x = paddingLeft + ratio * chartWidth;
    xLabels.push({ x, text: `Day ${timeline[dayIndex].day}` });
  }

  return (
    <div className="w-full bg-[#0A1228] border border-[#1A2744] rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[9px] uppercase font-black tracking-widest text-[#1C39BB] dark:text-blue-400">
            SEIR Compartmental Model
          </span>
          <h4 className="text-sm font-bold text-white">Simulation Spread Projections</h4>
        </div>
        {/* Toggle Controls */}
        <div className="flex flex-wrap gap-2.5">
          {(Object.keys(curvesConfig) as CurveType[]).map(key => {
            const active = activeCurves[key];
            const cfg = curvesConfig[key];
            return (
              <button
                key={key}
                onClick={() => toggleCurve(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  active 
                    ? `bg-[#070D1A] border-[#1A2744] text-white`
                    : 'bg-transparent border-slate-900 text-slate-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? cfg.color : '#475569' }} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {gridLines.map((gl, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={gl.y} 
                x2={width - paddingRight} 
                y2={gl.y} 
                className="stroke-slate-800/80" 
                strokeWidth="0.5" 
                strokeDasharray={idx === 0 ? "0" : "3"} 
              />
              <text 
                x={paddingLeft - 8} 
                y={gl.y + 3} 
                className="fill-slate-500 text-[8px] font-bold font-mono" 
                textAnchor="end"
              >
                {gl.val >= 1000000 ? `${(gl.val / 1000000).toFixed(1)}M` : gl.val >= 1000 ? `${(gl.val / 1000).toFixed(0)}k` : gl.val}
              </text>
            </g>
          ))}

          {/* X axis line */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop + chartHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + chartHeight} 
            className="stroke-[#1A2744]" 
            strokeWidth="1" 
          />

          {/* X Axis Labels */}
          {xLabels.map((lbl, idx) => (
            <text 
              key={idx} 
              x={lbl.x} 
              y={height - 8} 
              className="fill-slate-500 text-[8px] font-bold tracking-wider uppercase" 
              textAnchor="middle"
            >
              {lbl.text}
            </text>
          ))}

          {/* Render Curve Areas & Lines */}
          {(Object.keys(curvesConfig) as CurveType[]).map(key => {
            if (!activeCurves[key]) return null;
            const cfg = curvesConfig[key];
            const paths = getPathStrings(key);
            
            return (
              <g key={key}>
                <path d={paths.area} fill={cfg.fill} />
                <path d={paths.line} fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
