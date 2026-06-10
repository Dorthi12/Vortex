'use client'

import { useState } from 'react'

const kpiCards = [
  {
    label: 'National Complaint Resolution Rate',
    value: '87%',
    change: '+2.3%',
    changeDir: 'up',
    icon: '✅',
    subtext: 'vs 84.7% last month',
    color: '#22c55e',
  },
  {
    label: 'Average Response Time',
    value: '4.2 hrs',
    change: '-0.8 hrs',
    changeDir: 'up',
    icon: '⏱',
    subtext: 'vs 5.0 hrs last month',
    color: '#D4AF37',
  },
  {
    label: 'Policy Implementation Score',
    value: '91%',
    change: '+1.5%',
    changeDir: 'up',
    icon: '📋',
    subtext: 'Above national target of 85%',
    color: '#1C39BB',
  },
  {
    label: 'District Compliance Index',
    value: '84%',
    change: '-0.4%',
    changeDir: 'down',
    icon: '🏛',
    subtext: 'vs 84.4% last month',
    color: '#e85d04',
  },
]

const complaintTrendData = [
  { day: 'Mon', value: 162 },
  { day: 'Tue', value: 195 },
  { day: 'Wed', value: 178 },
  { day: 'Thu', value: 220 },
  { day: 'Fri', value: 188 },
  { day: 'Sat', value: 145 },
  { day: 'Sun', value: 159 },
]

const departmentBars = [
  { dept: 'Revenue & Land Records', score: 92, complaints: 214 },
  { dept: 'Public Works', score: 78, complaints: 387 },
  { dept: 'Health & Medical', score: 85, complaints: 193 },
  { dept: 'Agriculture', score: 88, complaints: 156 },
  { dept: 'Police & Law', score: 74, complaints: 299 },
  { dept: 'Education', score: 91, complaints: 122 },
  { dept: 'Water Resources', score: 67, complaints: 443 },
]

const districtGrid = [
  { name: 'Pune', score: 92, color: '#22c55e' },
  { name: 'Mumbai', score: 88, color: '#22c55e' },
  { name: 'Nashik', score: 81, color: '#D4AF37' },
  { name: 'Nagpur', score: 76, color: '#D4AF37' },
  { name: 'Aurangabad', score: 69, color: '#e85d04' },
  { name: 'Kolhapur', score: 63, color: '#ef4444' },
  { name: 'Solapur', score: 84, color: '#22c55e' },
  { name: 'Amravati', score: 77, color: '#D4AF37' },
  { name: 'Latur', score: 71, color: '#D4AF37' },
  { name: 'Satara', score: 89, color: '#22c55e' },
  { name: 'Sangli', score: 82, color: '#22c55e' },
  { name: 'Jalna', score: 58, color: '#ef4444' },
]

const resourceUtilization = [60, 72, 68, 85, 91, 79, 88]

const districtTableData = [
  { district: 'Pune', active: 312, resolved: 1847, pending: 89, priority: 14, score: 92, status: 'Excellent' },
  { district: 'Mumbai', active: 478, resolved: 3219, pending: 143, priority: 21, score: 88, status: 'Good' },
  { district: 'Nashik', active: 198, resolved: 943, pending: 67, priority: 8, score: 81, status: 'Good' },
  { district: 'Nagpur', active: 267, resolved: 1124, pending: 112, priority: 19, score: 76, status: 'Average' },
  { district: 'Aurangabad', active: 334, resolved: 876, pending: 178, priority: 27, score: 69, status: 'Below Avg' },
  { district: 'Kolhapur', active: 412, resolved: 654, pending: 231, priority: 38, score: 63, status: 'Critical' },
  { district: 'Solapur', active: 156, resolved: 788, pending: 44, priority: 6, score: 84, status: 'Good' },
  { district: 'Amravati', active: 221, resolved: 934, pending: 88, priority: 11, score: 77, status: 'Average' },
  { district: 'Latur', active: 189, resolved: 712, pending: 94, priority: 13, score: 71, status: 'Average' },
  { district: 'Satara', active: 134, resolved: 1023, pending: 29, priority: 4, score: 89, status: 'Good' },
]

const statusColors: Record<string, string> = {
  Excellent: '#22c55e',
  Good: '#4ade80',
  Average: '#D4AF37',
  'Below Avg': '#e85d04',
  Critical: '#ef4444',
}

const scoreColor = (score: number) => {
  if (score >= 85) return '#22c55e'
  if (score >= 75) return '#D4AF37'
  if (score >= 65) return '#e85d04'
  return '#ef4444'
}

// SVG line chart helpers
const chartW = 520
const chartH = 140
const maxVal = Math.max(...complaintTrendData.map((d) => d.value))
const minVal = Math.min(...complaintTrendData.map((d) => d.value))

const toX = (i: number) => 40 + (i / (complaintTrendData.length - 1)) * (chartW - 60)
const toY = (v: number) => chartH - 20 - ((v - minVal) / (maxVal - minVal + 10)) * (chartH - 40)

const linePoints = complaintTrendData.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')
const areaPoints =
  `${toX(0)},${chartH - 20} ` +
  complaintTrendData.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ') +
  ` ${toX(complaintTrendData.length - 1)},${chartH - 20}`

// Resource area chart
const resW = 420
const resH = 120
const resMax = 100
const resToX = (i: number) => 20 + (i / (resourceUtilization.length - 1)) * (resW - 30)
const resToY = (v: number) => resH - 20 - (v / resMax) * (resH - 30)
const resAreaPoints =
  `${resToX(0)},${resH - 20} ` +
  resourceUtilization.map((v, i) => `${resToX(i)},${resToY(v)}`).join(' ') +
  ` ${resToX(resourceUtilization.length - 1)},${resH - 20}`
const resLinePoints = resourceUtilization.map((v, i) => `${resToX(i)},${resToY(v)}`).join(' ')

export default function AnalyticsPage() {
  const [sortCol, setSortCol] = useState<string>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedData = [...districtTableData].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sortCol] as number | string
    const bVal = (b as Record<string, unknown>)[sortCol] as number | string
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    }
    return sortDir === 'desc'
      ? String(bVal).localeCompare(String(aVal))
      : String(aVal).localeCompare(String(bVal))
  })

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('desc') }
  }

  const cols = [
    { key: 'district', label: 'District' },
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'pending', label: 'Pending' },
    { key: 'priority', label: 'Priority Cases' },
    { key: 'score', label: 'Performance Score' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080f1e', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
      {/* TOP HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #0B2342 0%, #1A3A6C 100%)', borderBottom: '1px solid #1C39BB44', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 32, background: '#D4AF37', borderRadius: 2 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>National Analytics Dashboard</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Real-time performance monitoring • NETRAVAAH Intelligence Platform</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: '#0f2a4a', border: '1px solid #1C39BB44', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#94a3b8' }}>
            Last updated: <span style={{ color: '#D4AF37' }}>10 Jun 2026, 20:55 IST</span>
          </div>
          <div style={{ background: '#22c55e22', border: '1px solid #22c55e44', borderRadius: 6, padding: '5px 12px', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>● LIVE</div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ═══ SECTION 1: KPI CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 30 }}>
          {kpiCards.map((k) => (
            <div key={k.label} style={{ background: 'linear-gradient(135deg, #0d1f38 0%, #0B2342 100%)', border: '1px solid #1C39BB33', borderRadius: 14, padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color, borderRadius: '14px 14px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{k.icon}</span>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: k.changeDir === 'up' ? '#22c55e22' : '#ef444422', color: k.changeDir === 'up' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                  {k.change}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{k.subtext}</div>
              <div style={{ position: 'absolute', bottom: -20, right: -10, width: 80, height: 80, borderRadius: '50%', background: k.color + '11', border: `1px solid ${k.color}22` }} />
            </div>
          ))}
        </div>

        {/* ═══ SECTION 2: TREND CHARTS ═══ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 3, height: 20, background: '#D4AF37', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.3px' }}>Trend Analysis</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
          {/* Complaint Volume Line Chart */}
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Complaint Volume Trend — Last 7 Days</span>
              <span style={{ color: '#D4AF37', fontSize: 12 }}>Total: 1,247</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1C39BB" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1C39BB" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <line key={f} x1={40} y1={chartH - 20 - f * (chartH - 40)} x2={chartW - 20} y2={chartH - 20 - f * (chartH - 40)} stroke="#1C39BB22" strokeWidth="1" />
              ))}
              {/* Area */}
              <polygon points={areaPoints} fill="url(#areaGrad)" />
              {/* Line */}
              <polyline points={linePoints} fill="none" stroke="#1C39BB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {/* Dots + labels */}
              {complaintTrendData.map((d, i) => (
                <g key={d.day}>
                  <circle cx={toX(i)} cy={toY(d.value)} r={4} fill="#1C39BB" stroke="#D4AF37" strokeWidth="2" />
                  <text x={toX(i)} y={chartH - 4} textAnchor="middle" fill="#64748b" fontSize="11">{d.day}</text>
                  <text x={toX(i)} y={toY(d.value) - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">{d.value}</text>
                </g>
              ))}
              {/* Y-axis */}
              <text x={35} y={chartH - 18} textAnchor="end" fill="#64748b" fontSize="10">{minVal}</text>
              <text x={35} y={toY((maxVal + minVal) / 2)} textAnchor="end" fill="#64748b" fontSize="10">{Math.round((maxVal + minVal) / 2)}</text>
              <text x={35} y={20} textAnchor="end" fill="#64748b" fontSize="10">{maxVal}</text>
            </svg>
          </div>

          {/* Resource Utilization Area Chart */}
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span>Resource Utilization Trend — Last 7 Days</span>
              <span style={{ color: '#22c55e', fontSize: 12 }}>Avg: 77.6%</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${resW} ${resH}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              {[25, 50, 75, 100].map((v) => (
                <line key={v} x1={20} y1={resToY(v)} x2={resW - 10} y2={resToY(v)} stroke="#1C39BB22" strokeWidth="1" />
              ))}
              <polygon points={resAreaPoints} fill="url(#resGrad)" />
              <polyline points={resLinePoints} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {resourceUtilization.map((v, i) => (
                <g key={i}>
                  <circle cx={resToX(i)} cy={resToY(v)} r={4} fill="#D4AF37" stroke="#fff" strokeWidth="1.5" />
                  <text x={resToX(i)} y={resH - 4} textAnchor="middle" fill="#64748b" fontSize="10">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </text>
                  <text x={resToX(i)} y={resToY(v) - 8} textAnchor="middle" fill="#94a3b8" fontSize="10">{v}%</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 30 }}>
          {/* Department Performance Bars */}
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>Department Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {departmentBars.map((d) => (
                <div key={d.dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{d.dept}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(d.score) }}>{d.score}%</span>
                  </div>
                  <div style={{ height: 7, background: '#1A3A6C44', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.score}%`, background: `linear-gradient(90deg, ${scoreColor(d.score)}88, ${scoreColor(d.score)})`, borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District Grid */}
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>Resolution Rate by District</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[{ c: '#22c55e', l: '≥85 Excellent' }, { c: '#D4AF37', l: '70–84 Good' }, { c: '#e85d04', l: '60–69 Average' }, { c: '#ef4444', l: '<60 Critical' }].map((l) => (
                <div key={l.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.c }} />
                  <span style={{ fontSize: 9, color: '#64748b' }}>{l.l}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {districtGrid.map((d) => (
                <div key={d.name} style={{ background: d.color + '18', border: `1px solid ${d.color}44`, borderRadius: 8, padding: '10px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.score}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: DISTRICT TABLE ═══ */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: '#D4AF37', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>District Analytics</h2>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', background: '#1A3A6C33', padding: '3px 10px', borderRadius: 5 }}>Click column headers to sort</span>
          </div>
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(90deg, #0B2342, #1A3A6C)' }}>
                  {cols.map((c) => (
                    <th key={c.key} onClick={() => toggleSort(c.key)} style={{ padding: '13px 14px', textAlign: c.key === 'district' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: sortCol === c.key ? '#D4AF37' : '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #1C39BB33', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      {c.label} {sortCol === c.key ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr key={row.district} style={{ background: idx % 2 === 0 ? '#0d1f3888' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1A3A6C33')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#0d1f3888' : 'transparent')}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#e2e8f0', borderBottom: '1px solid #1C39BB18' }}>{row.district}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', color: '#94a3b8', borderBottom: '1px solid #1C39BB18' }}>{row.active.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', color: '#22c55e', borderBottom: '1px solid #1C39BB18' }}>{row.resolved.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', color: '#D4AF37', borderBottom: '1px solid #1C39BB18' }}>{row.pending}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, textAlign: 'center', color: row.priority >= 25 ? '#ef4444' : '#e85d04', fontWeight: 600, borderBottom: '1px solid #1C39BB18' }}>{row.priority}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '1px solid #1C39BB18' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 6, background: '#1A3A6C44', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.score}%`, background: scoreColor(row.score), borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(row.score) }}>{row.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '1px solid #1C39BB18' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: statusColors[row.status] + '22', color: statusColors[row.status], border: `1px solid ${statusColors[row.status]}44` }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ SECTION 4: AI PREDICTION PANEL ═══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: '#1C39BB', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>AI Forecast & Prediction Engine</h2>
            <span style={{ marginLeft: 8, fontSize: 10, background: '#1C39BB33', border: '1px solid #1C39BB66', borderRadius: 5, padding: '2px 8px', color: '#818cf8', fontWeight: 700 }}>NETRAVAAH-AI v3.1</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            {/* Volume Prediction */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1A3A6C22)', border: '1px solid #1C39BB44', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>📈 COMPLAINT VOLUME FORECAST</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Next 7-day prediction</div>
              <div style={{ fontSize: 38, fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>1,340</div>
              <div style={{ fontSize: 12, color: '#e85d04', marginTop: 6, marginBottom: 10 }}>↑ +7.5% vs current 1,247</div>
              <div style={{ height: 1, background: '#1C39BB33', marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: '#64748b' }}>Confidence: <span style={{ color: '#818cf8', fontWeight: 700 }}>91%</span></div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Model: LSTM + Weather Correlation</div>
            </div>

            {/* Hotspot Districts */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #7f1d1d11)', border: '1px solid #ef444433', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>🔥 PREDICTED HOTSPOT DISTRICTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[{ name: 'Kolhapur', risk: 'CRITICAL', score: 94, delta: '+31%' }, { name: 'Pune', risk: 'HIGH', score: 78, delta: '+18%' }, { name: 'Nagpur', risk: 'HIGH', score: 72, delta: '+14%' }].map((h) => (
                  <div key={h.name} style={{ background: '#ef444411', border: '1px solid #ef444422', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{h.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#ef444422', color: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>{h.risk}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Risk Index: {h.score} • {h.delta} surge expected</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Shortage */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #7c2d1211)', border: '1px solid #e85d0433', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 11, color: '#e85d04', fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>⚠️ RESOURCE SHORTAGE ALERTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[{ resource: 'Medical Oxygen', urgency: '72h', level: 23, status: 'WARNING' }, { resource: 'Rescue Boats', urgency: '24h', level: 8, status: 'CRITICAL' }, { resource: 'Emergency Vehicles', urgency: '96h', level: 41, status: 'MONITOR' }].map((r) => (
                  <div key={r.resource} style={{ background: '#e85d0411', border: '1px solid #e85d0422', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{r.resource}</span>
                      <span style={{ fontSize: 9, color: r.status === 'CRITICAL' ? '#ef4444' : r.status === 'WARNING' ? '#e85d04' : '#D4AF37', fontWeight: 700 }}>{r.status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0' }}>Shortage in: <span style={{ color: '#e85d04', fontWeight: 700 }}>{r.urgency}</span></div>
                    <div style={{ height: 5, background: '#1A3A6C44', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${r.level}%`, background: r.level < 15 ? '#ef4444' : r.level < 35 ? '#e85d04' : '#D4AF37', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>Stock: {r.level}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-deployments */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #14532d11)', border: '1px solid #22c55e33', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>🚀 RECOMMENDED PRE-DEPLOYMENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { action: 'Deploy 4 NDRF Teams → Kolhapur', priority: 'P1', urgency: 'Immediate' },
                  { action: 'Pre-stage 200 Oxygen Cylinders → Pune Medical Hub', priority: 'P1', urgency: '48h' },
                  { action: 'Activate 8 Rescue Boats → Coastal Districts', priority: 'P2', urgency: '12h' },
                  { action: 'Alert District Collectors → Nagpur, Amravati', priority: 'P2', urgency: '24h' },
                  { action: 'Issue Public Advisory → Western Maharashtra', priority: 'P3', urgency: '72h' },
                ].map((r) => (
                  <div key={r.action} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, background: r.priority === 'P1' ? '#ef444422' : r.priority === 'P2' ? '#e85d0422' : '#D4AF3722', color: r.priority === 'P1' ? '#ef4444' : r.priority === 'P2' ? '#e85d04' : '#D4AF37', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 1 }}>{r.priority}</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#e2e8f0', lineHeight: 1.4 }}>{r.action}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Within {r.urgency}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '8px 12px', background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>AI Confidence: 91% • Data sources: 47 feeds</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
