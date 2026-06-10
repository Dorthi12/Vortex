'use client'

import { useState, useEffect } from 'react'

const reportTypes = [
  'Department Report',
  'District Report',
  'State Report',
  'National Report',
  'Policy Report',
  'Complaint Report',
  'Resource Report',
  'Emergency Report',
]

const departments = [
  'All Departments',
  'Revenue & Land Records',
  'Public Works',
  'Health & Medical',
  'Agriculture',
  'Police & Law',
  'Education',
  'Water Resources',
  'Urban Development',
  'Social Welfare',
]

const districts = [
  'All Districts',
  'Pune',
  'Mumbai',
  'Nashik',
  'Nagpur',
  'Aurangabad',
  'Kolhapur',
  'Solapur',
  'Amravati',
  'Latur',
  'Satara',
]

const sectionOptions = [
  { key: 'executiveSummary', label: 'Executive Summary' },
  { key: 'kpis', label: 'KPIs & Metrics' },
  { key: 'charts', label: 'Charts & Visualizations' },
  { key: 'complaintDetails', label: 'Complaint Details' },
  { key: 'resourceUsage', label: 'Resource Usage' },
  { key: 'aiRecommendations', label: 'AI Recommendations' },
]

const recentReports = [
  { title: 'Maharashtra State Monthly Report', period: 'May 2024', format: 'PDF', size: '2.4 MB', type: 'State Report', date: '01 Jun 2024', icon: '📄', color: '#ef4444' },
  { title: 'Pune District Complaint Report', period: 'Q1 2024', format: 'Excel', size: '890 KB', type: 'District Report', date: '15 May 2024', icon: '📊', color: '#22c55e' },
  { title: 'National Emergency Response Report', period: 'FY 2024', format: 'PDF', size: '5.1 MB', type: 'Emergency Report', date: '10 May 2024', icon: '🚨', color: '#ef4444' },
  { title: 'Agriculture Department Annual Report', period: 'FY 2023–24', format: 'PDF', size: '3.8 MB', type: 'Department Report', date: '30 Apr 2024', icon: '🌾', color: '#ef4444' },
  { title: 'National Resource Utilization Summary', period: 'Q1 2024', format: 'Word', size: '1.2 MB', type: 'Resource Report', date: '20 Apr 2024', icon: '📝', color: '#3b82f6' },
  { title: 'Water Resources District Analysis', period: 'Mar 2024', format: 'Excel', size: '1.7 MB', type: 'District Report', date: '05 Apr 2024', icon: '💧', color: '#22c55e' },
  { title: 'Policy Implementation Scorecard', period: 'H2 2023', format: 'PDF', size: '2.9 MB', type: 'Policy Report', date: '15 Mar 2024', icon: '📋', color: '#ef4444' },
  { title: 'Complaint Trend Analysis — All Districts', period: 'Feb 2024', format: 'PDF', size: '4.2 MB', type: 'Complaint Report', date: '01 Mar 2024', icon: '📈', color: '#ef4444' },
]

const formatIcons: Record<string, { icon: string; color: string }> = {
  PDF: { icon: '📄', color: '#ef4444' },
  Excel: { icon: '📊', color: '#22c55e' },
  Word: { icon: '📝', color: '#3b82f6' },
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('National Report')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-05-31')
  const [department, setDepartment] = useState('All Departments')
  const [district, setDistrict] = useState('All Districts')
  const [format, setFormat] = useState('PDF')
  const [sections, setSections] = useState<Record<string, boolean>>({
    executiveSummary: true,
    kpis: true,
    charts: true,
    complaintDetails: false,
    resourceUsage: true,
    aiRecommendations: true,
  })
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggleSection = (key: string) => setSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleGenerate = () => {
    setGenerating(true)
    setGenerated(false)
    setProgress(0)
  }

  useEffect(() => {
    if (!generating) return
    if (progress >= 100) {
      setGenerating(false)
      setGenerated(true)
      return
    }
    const t = setTimeout(() => setProgress((p) => Math.min(p + Math.random() * 12 + 4, 100)), 200)
    return () => clearTimeout(t)
  }, [generating, progress])

  const selectedSections = sectionOptions.filter((s) => sections[s.key])

  const inputStyle: React.CSSProperties = {
    background: '#0B2342',
    border: '1px solid #1C39BB44',
    borderRadius: 8,
    color: '#e2e8f0',
    padding: '10px 13px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f1e', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #0B2342 0%, #1A3A6C 100%)', borderBottom: '1px solid #1C39BB44', padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 32, background: '#D4AF37', borderRadius: 2 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Government Reports</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Generate, export, and archive official government intelligence reports • NETRAVAAH Reports Engine</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <div style={{ background: '#D4AF3722', border: '1px solid #D4AF3744', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>📊 Reports Module</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* ═══ LEFT: REPORT GENERATOR FORM ═══ */}
        <div>
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 16, padding: '28px 28px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 18 }}>🔧</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Report Generator</h2>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#818cf8', background: '#818cf822', padding: '3px 8px', borderRadius: 5, fontWeight: 700 }}>AI-POWERED</span>
            </div>

            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Report Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)} style={inputStyle}>
                  {reportTypes.map(r => <option key={r} value={r} style={{ background: '#0B2342' }}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Export Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['PDF', 'Excel', 'Word'].map(f => (
                    <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${format === f ? '#D4AF37' : '#1C39BB44'}`, background: format === f ? '#D4AF3722' : '#0B2342', color: format === f ? '#D4AF37' : '#94a3b8', fontSize: 13, fontWeight: format === f ? 700 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                      {formatIcons[f].icon} {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Date Range — From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={labelStyle}>Date Range — To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>

            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} style={inputStyle}>
                  {departments.map(d => <option key={d} value={d} style={{ background: '#0B2342' }}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>District / Region</label>
                <select value={district} onChange={e => setDistrict(e.target.value)} style={inputStyle}>
                  {districts.map(d => <option key={d} value={d} style={{ background: '#0B2342' }}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Section Checkboxes */}
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Include Sections</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {sectionOptions.map(s => (
                  <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: sections[s.key] ? '#1C39BB22' : '#0B2342', border: `1px solid ${sections[s.key] ? '#1C39BB66' : '#1C39BB22'}`, borderRadius: 8, padding: '9px 12px', transition: 'all 0.2s' }}>
                    <input type="checkbox" checked={sections[s.key]} onChange={() => toggleSection(s.key)} style={{ display: 'none' }} />
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${sections[s.key] ? '#1C39BB' : '#475569'}`, background: sections[s.key] ? '#1C39BB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sections[s.key] && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: sections[s.key] ? '#e2e8f0' : '#64748b', fontWeight: sections[s.key] ? 600 : 400 }}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ width: '100%', padding: '14px', background: generating ? '#1A3A6C' : 'linear-gradient(135deg, #1C39BB, #1A3A6C)', border: `1px solid ${generating ? '#1A3A6C' : '#1C39BB'}`, borderRadius: 10, color: generating ? '#64748b' : '#fff', fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {generating ? (
                <>
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #1C39BB', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Compiling Report...
                </>
              ) : '⚡ Generate Report'}
            </button>
          </div>

          {/* PREVIEW PANEL */}
          {(generating || generated) && (
            <div style={{ background: 'linear-gradient(135deg, #0d1f38, #0B234288)', border: '1px solid #D4AF3744', borderRadius: 16, padding: '24px 28px', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#D4AF37' }}>Report Preview</h3>
                {generating && <span style={{ fontSize: 10, background: '#D4AF3722', border: '1px solid #D4AF3744', color: '#D4AF37', padding: '2px 8px', borderRadius: 5, fontWeight: 700, marginLeft: 'auto' }}>COMPILING...</span>}
                {generated && <span style={{ fontSize: 10, background: '#22c55e22', border: '1px solid #22c55e44', color: '#22c55e', padding: '2px 8px', borderRadius: 5, fontWeight: 700, marginLeft: 'auto' }}>✓ READY</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'Report Title', value: `${reportType} — ${district !== 'All Districts' ? district : department !== 'All Departments' ? department : 'All'}` },
                  { label: 'Date Range', value: `${dateFrom} to ${dateTo}` },
                  { label: 'Export Format', value: format },
                  { label: 'Sections Included', value: `${selectedSections.length} sections` },
                ].map(f => (
                  <div key={f.label} style={{ background: '#0B234266', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{f.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {selectedSections.map(s => (
                  <span key={s.key} style={{ fontSize: 11, background: '#1C39BB22', border: '1px solid #1C39BB44', color: '#818cf8', padding: '3px 10px', borderRadius: 5 }}>✓ {s.label}</span>
                ))}
              </div>

              {/* Mock Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                {[{ label: 'Total Records', value: '14,287' }, { label: 'Complaints', value: '3,412' }, { label: 'Departments', value: '9' }, { label: 'Districts', value: '36' }].map(s => (
                  <div key={s.label} style={{ background: '#1A3A6C22', border: '1px solid #1C39BB33', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {generating && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Report being compiled...</span>
                    <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700 }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ height: 6, background: '#1A3A6C44', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #1C39BB, #D4AF37)', borderRadius: 4, transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}

              <button
                disabled={generating}
                style={{ padding: '12px 24px', background: generated ? 'linear-gradient(135deg, #15803d, #22c55e)' : '#1A3A6C', border: `1px solid ${generated ? '#22c55e' : '#1C39BB44'}`, borderRadius: 10, color: generated ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: generated ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                {generated ? '⬇ Download Report' : '⏳ Report being compiled...'}
              </button>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: RECENT REPORTS ═══ */}
        <div>
          <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 16, padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 16 }}>🗂</span>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Recent Reports</h2>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b', background: '#1A3A6C33', padding: '2px 8px', borderRadius: 5 }}>8 reports</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentReports.map((r) => (
                <div key={r.title} style={{ background: '#0B234266', border: '1px solid #1C39BB22', borderRadius: 10, padding: '13px 14px', transition: 'border-color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1C39BB66')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1C39BB22')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: r.color + '22', border: `1px solid ${r.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {r.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, marginBottom: 4 }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>{r.period} • Generated {r.date}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: formatIcons[r.format].color + '22', color: formatIcons[r.format].color }}>
                          {formatIcons[r.format].icon} {r.format}
                        </span>
                        <span style={{ fontSize: 9, color: '#64748b' }}>{r.size}</span>
                        <span style={{ fontSize: 9, background: '#1A3A6C33', color: '#94a3b8', padding: '2px 6px', borderRadius: 4 }}>{r.type}</span>
                      </div>
                    </div>
                    <button title="Download" style={{ width: 30, height: 30, borderRadius: 8, background: '#1A3A6C', border: '1px solid #1C39BB44', color: '#94a3b8', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1C39BB'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1A3A6C'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}>
                      ⬇
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Storage summary */}
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#0B234266', border: '1px solid #1C39BB22', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Storage Usage</div>
              <div style={{ height: 6, background: '#1A3A6C44', borderRadius: 3, marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '34%', background: 'linear-gradient(90deg, #1C39BB, #D4AF37)', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
                <span>22.3 MB used</span>
                <span style={{ color: '#94a3b8' }}>65.7 MB free</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #0B2342; color: #e2e8f0; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg); }
      `}</style>
    </div>
  )
}
