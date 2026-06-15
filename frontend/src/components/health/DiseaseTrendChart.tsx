// components/health/DiseaseTrendChart.tsx
import React from 'react';

interface DiseaseTrendChartProps {
  data: number[];
  labels: string[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  gridLinesCount?: number;
}

export function DiseaseTrendChart({
  data,
  labels,
  height = 160,
  strokeColor = '#1C39BB', // Royal Blue default
  fillColor = 'rgba(28, 57, 187, 0.1)',
  gridLinesCount = 3
}: DiseaseTrendChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data, 10);
  const minVal = 0;
  const dataLen = data.length;

  const width = 500;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Convert points to coordinates
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx / (dataLen - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, val };
  });

  // Create SVG path strings
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`;

  // Grid line values
  const gridLines = [];
  for (let i = 0; i <= gridLinesCount; i++) {
    const ratio = i / gridLinesCount;
    const y = paddingTop + chartHeight - ratio * chartHeight;
    const val = Math.round(minVal + ratio * (maxVal - minVal));
    gridLines.push({ y, val });
  }

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-md overflow-visible">
        {/* Horizontal Gridlines */}
        {gridLines.map((gl, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={gl.y} 
              x2={width - paddingRight} 
              y2={gl.y} 
              className="stroke-slate-800/80" 
              strokeWidth="0.5" 
              strokeDasharray={idx === 0 ? "0" : "4"} 
            />
            <text 
              x={paddingLeft - 8} 
              y={gl.y + 3} 
              className="fill-slate-500 text-[8px] font-black font-mono" 
              textAnchor="end"
            >
              {gl.val}
            </text>
          </g>
        ))}

        {/* X Axis Line */}
        <line 
          x1={paddingLeft} 
          y1={paddingTop + chartHeight} 
          x2={width - paddingRight} 
          y2={paddingTop + chartHeight} 
          className="stroke-[#1A2744]" 
          strokeWidth="1" 
        />

        {/* X Axis Labels */}
        {labels.map((label, idx) => {
          const x = paddingLeft + (idx / (labels.length - 1)) * chartWidth;
          return (
            <text 
              key={idx} 
              x={x} 
              y={height - 8} 
              className="fill-slate-500 text-[8px] font-black uppercase tracking-wider" 
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Colored Area Fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Trend Line */}
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />

        {/* Interactive circles */}
        {points.map((p, idx) => (
          <g key={idx} className="group/dot cursor-pointer">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4.5" 
              className="fill-slate-950 stroke-slate-200 stroke-[1.5] transition-all hover:r-6" 
            />
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="2" 
              fill={strokeColor} 
            />
            {/* Tooltip on hover */}
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 pointer-events-none">
              <rect 
                x={p.x - 25} 
                y={p.y - 22} 
                width="50" 
                height="14" 
                rx="3" 
                className="fill-[#101F42] stroke-[#1A2744] stroke-[0.5]" 
              />
              <text 
                x={p.x} 
                y={p.y - 12} 
                className="fill-white text-[7px] font-bold" 
                textAnchor="middle"
              >
                Cases: {p.val}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
