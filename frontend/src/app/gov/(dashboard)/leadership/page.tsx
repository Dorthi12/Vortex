'use client'

import { useState } from 'react'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const nationalPriorities = [
  {
    id: 'P1', title: 'Flood Disaster Response — Western Maharashtra', progress: 68,
    departments: ['NDRF', 'Revenue', 'Health', 'Public Works'],
    deadline: '30 Jun 2026', status: 'ACTIVE', statusColor: '#22c55e',
    description: 'Full-scale emergency deployment for western Maharashtra flood relief & rehabilitation.',
  },
  {
    id: 'P2', title: 'Mission Drought Mitigation — Marathwada', progress: 41,
    departments: ['Agriculture', 'Water Resources', 'Social Welfare'],
    deadline: '15 Jul 2026', status: 'IN PROGRESS', statusColor: '#D4AF37',
    description: 'Drought response across 6 districts with immediate water tanker deployment.',
  },
  {
    id: 'P3', title: 'Urban Infrastructure Upgrade — Mumbai Metro Corridor', progress: 82,
    departments: ['Urban Development', 'PWD', 'MMRDA'],
    deadline: '31 Aug 2026', status: 'ON TRACK', statusColor: '#22c55e',
    description: 'Phase-3 metro corridor construction and last-mile connectivity.',
  },
  {
    id: 'P4', title: 'Cybersecurity Hardening — State IT Infrastructure', progress: 55,
    departments: ['IT & Digital', 'Home Affairs', 'Finance'],
    deadline: '01 Sep 2026', status: 'REVIEW', statusColor: '#e85d04',
    description: 'Comprehensive audit and upgrade of government digital security framework.',
  },
  {
    id: 'P5', title: 'Aarogya Mission — Rural Health Infrastructure', progress: 29,
    departments: ['Health & Medical', 'Social Welfare', 'Finance'],
    deadline: '31 Dec 2026', status: 'PLANNED', statusColor: '#94a3b8',
    description: 'Expand PHC network across 2,400 villages with telemedicine integration.',
  },
]

const recentAnnouncements = [
  { title: 'State Flood Emergency Declared — Western Maharashtra', priority: 'CRITICAL', date: '10 Jun 2026', broadcast: 'All Channels', author: 'Chief Minister Office' },
  { title: 'New Digital Grievance Redressal Portal Launched', priority: 'HIGH', date: '08 Jun 2026', broadcast: 'Citizen Portal, AI Assistant', author: 'IT Department' },
  { title: 'Monsoon Preparedness Circular for All DMs', priority: 'HIGH', date: '05 Jun 2026', broadcast: 'Department Dashboards', author: 'Revenue & Disaster Mgmt' },
  { title: 'Budget Q1 2026 Allocation Update', priority: 'MEDIUM', date: '01 Jun 2026', broadcast: 'Department Dashboards', author: 'Finance Department' },
  { title: 'Agricultural Minimum Support Price Revision 2026', priority: 'MEDIUM', date: '29 May 2026', broadcast: 'Citizen Portal, All Channels', author: 'Agriculture Department' },
]

const strategicInitiatives = [
  {
    name: 'Digital India 2.0', icon: '🌐',
    kpis: ['98% internet coverage', '4.2B digital transactions/yr', '87% e-service adoption'],
    ministry: 'Ministry of Electronics & IT',
    budget: '₹1,20,000 Cr', timeline: '2024–2027', completion: 62,
    color: '#1C39BB',
  },
  {
    name: 'Mission Health Coverage', icon: '🏥',
    kpis: ['Universal health insurance', '5,000 PHCs upgraded', '2.4Cr beneficiaries'],
    ministry: 'Ministry of Health & Family Welfare',
    budget: '₹64,000 Cr', timeline: '2025–2028', completion: 38,
    color: '#22c55e',
  },
  {
    name: 'Green Infrastructure', icon: '🌿',
    kpis: ['40% renewable energy share', '10,000 MW solar added', 'Net zero by 2030'],
    ministry: 'Ministry of Environment & Energy',
    budget: '₹85,000 Cr', timeline: '2024–2030', completion: 27,
    color: '#4ade80',
  },
  {
    name: 'Agricultural Modernization', icon: '🌾',
    kpis: ['Farmer income doubled', '90% crop insurance coverage', '10,000 FPOs formed'],
    ministry: 'Ministry of Agriculture',
    budget: '₹52,000 Cr', timeline: '2025–2029', completion: 44,
    color: '#D4AF37',
  },
]

const npiData = [
  { label: 'GDP Growth Rate', value: '7.2%', target: '7.5%', trend: 'up', unit: '%', color: '#22c55e' },
  { label: 'Poverty Rate', value: '11.4%', target: '<10%', trend: 'down', unit: '%', color: '#22c55e' },
  { label: 'Literacy Rate', value: '78.9%', target: '85%', trend: 'up', unit: '%', color: '#D4AF37' },
  { label: 'Health Index', value: '0.73', target: '0.80', trend: 'up', unit: '', color: '#D4AF37' },
  { label: 'Infrastructure Score', value: '64.1', target: '75.0', trend: 'up', unit: '/100', color: '#D4AF37' },
  { label: 'Farmer Income Index', value: '1.42×', target: '2.0×', trend: 'up', unit: '', color: '#D4AF37' },
  { label: 'Digital Adoption', value: '82%', target: '90%', trend: 'up', unit: '%', color: '#22c55e' },
  { label: 'Unemployment Rate', value: '6.7%', target: '<5%', trend: 'down', unit: '%', color: '#e85d04' },
  { label: 'FDI Inflow (YoY)', value: '+18%', target: '+20%', trend: 'up', unit: '', color: '#22c55e' },
  { label: 'Renewable Energy %', value: '31%', target: '40%', trend: 'up', unit: '%', color: '#4ade80' },
  { label: 'Crime Rate Index', value: '4.2', target: '<3.5', trend: 'down', unit: '', color: '#e85d04' },
  { label: 'Export Growth', value: '11.3%', target: '15%', trend: 'up', unit: '%', color: '#D4AF37' },
]

const executiveBriefings = [
  {
    date: '09 Jun 2026', title: 'National Flood & Disaster Review — PM-CMO Coordination',
    participants: ['Prime Minister Office', 'Chief Ministers — 5 States', 'NDMA', 'Home Secretary'],
    summary: 'Emergency response deployment reviewed. ₹2,400 Cr relief fund approved. NDRF battalion movement authorized.',
  },
  {
    date: '05 Jun 2026', title: 'Digital Governance & Cybersecurity Briefing',
    participants: ['Cabinet Secretary', 'IT Ministry', 'CERT-In', 'CISOs — 12 Departments'],
    summary: 'Zero-trust architecture adoption timeline fixed at Q4 2026. AI-based threat detection pilot approved.',
  },
  {
    date: '01 Jun 2026', title: 'Q1 FY2026–27 Economic Performance Review',
    participants: ['Finance Ministry', 'NITI Aayog', 'RBI Governor', 'State Finance Secretaries'],
    summary: 'GDP at 7.2%, above consensus. GST collection ₹1.87L Cr — record high. Infra spending at 96% of target.',
  },
  {
    date: '28 May 2026', title: 'Agricultural Distress & Monsoon Preparedness Review',
    participants: ['Agriculture Ministry', 'IMD Chief', 'State CMs', 'NITI Aayog Vice-Chairman'],
    summary: 'Monsoon forecast at 104% of LPA. Pre-positioning of seed kits and soil moisture sensors across 8 states authorized.',
  },
  {
    date: '22 May 2026', title: 'Strategic Security & Border Infrastructure Briefing',
    participants: ['NSA', 'Defence Secretary', 'Home Ministry', 'Border States CMs'],
    summary: 'Classified. Key infrastructure deployment reviewed. No further public disclosure.',
  },
]

const broadcastOptions = ['Citizen Portal', 'Department Dashboards', 'AI Assistant', 'All Channels']
const priorityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const priorityColors: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#e85d04', MEDIUM: '#D4AF37', LOW: '#22c55e' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadershipPage() {
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMsg, setAnnouncementMsg] = useState('')
  const [announcementPriority, setAnnouncementPriority] = useState('HIGH')
  const [broadcastTo, setBroadcastTo] = useState<string[]>(['All Channels'])
  const [published, setPublished] = useState(false)
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)

  const toggleBroadcast = (opt: string) => {
    setBroadcastTo(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])
  }

  const handlePublish = () => {
    if (!announcementTitle.trim()) return
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
    setAnnouncementTitle('')
    setAnnouncementMsg('')
  }

  const inputStyle: React.CSSProperties = {
    background: '#0B2342', border: '1px solid #1C39BB44', borderRadius: 8,
    color: '#e2e8f0', padding: '10px 13px', fontSize: 13, width: '100%',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.8px',
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f1e', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0B2342 0%, #1A3A6C 100%)', borderBottom: '2px solid #D4AF3744', padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 4, height: 40, background: '#D4AF37', borderRadius: 2 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>National Leadership Panel</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Strategic oversight and national priority management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ background: '#ef444422', border: '1px solid #ef444444', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '1.5px' }}>RESTRICTED ACCESS</div>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>SENIOR OFFICIALS ONLY</div>
              </div>
            </div>
            <div style={{ background: '#D4AF3722', border: '1px solid #D4AF3744', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🛡</span>
              <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 700 }}>CLEARANCE: TS/SCI</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ═══ SECTION 1: NATIONAL PRIORITIES ═══ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#D4AF37', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>National Priorities</h2>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>(5 active missions)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nationalPriorities.map((p) => (
              <div key={p.id} style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '20px 22px', display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 16, alignItems: 'start' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg, ${p.statusColor}33, ${p.statusColor}11)`, border: `2px solid ${p.statusColor}66`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: p.statusColor }}>{p.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{p.description}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {p.departments.map(d => (
                      <span key={d} style={{ fontSize: 10, background: '#1A3A6C33', border: '1px solid #1C39BB33', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: '#1A3A6C44', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.statusColor}88, ${p.statusColor})`, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.statusColor, minWidth: 36 }}>{p.progress}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: p.statusColor + '22', color: p.statusColor, border: `1px solid ${p.statusColor}44`, whiteSpace: 'nowrap' }}>{p.status}</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>📅 {p.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 2: POLICY ANNOUNCEMENTS ═══ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#1C39BB', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Policy Announcements</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Form */}
            <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '22px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>📢</span> Create National Announcement
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Announcement Title</label>
                <input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Enter announcement title..." style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Message</label>
                <textarea value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} rows={3} placeholder="Enter official message..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Priority Level</label>
                  <select value={announcementPriority} onChange={e => setAnnouncementPriority(e.target.value)} style={inputStyle}>
                    {priorityLevels.map(p => <option key={p} value={p} style={{ background: '#0B2342' }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Broadcast To</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {broadcastOptions.map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <div onClick={() => toggleBroadcast(opt)} style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${broadcastTo.includes(opt) ? '#1C39BB' : '#475569'}`, background: broadcastTo.includes(opt) ? '#1C39BB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                          {broadcastTo.includes(opt) && <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 11, color: broadcastTo.includes(opt) ? '#e2e8f0' : '#64748b' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handlePublish} style={{ width: '100%', padding: '12px', background: published ? 'linear-gradient(135deg, #15803d, #22c55e)' : 'linear-gradient(135deg, #D4AF37, #b8922e)', border: 'none', borderRadius: 10, color: '#0B2342', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.3s' }}>
                {published ? '✓ Announcement Published!' : '📣 Publish Announcement'}
              </button>
            </div>

            {/* Recent Announcements */}
            <div style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 14, padding: '22px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>Recent Announcements</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentAnnouncements.map((a) => (
                  <div key={a.title} style={{ background: '#0B234266', border: '1px solid #1C39BB22', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3, flex: 1, marginRight: 8 }}>{a.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: priorityColors[a.priority] + '22', color: priorityColors[a.priority], border: `1px solid ${priorityColors[a.priority]}33`, whiteSpace: 'nowrap' }}>{a.priority}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{a.author} • {a.date}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>📡 {a.broadcast}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3: STRATEGIC INITIATIVES ═══ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#D4AF37', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Strategic Initiatives</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {strategicInitiatives.map((si) => (
              <div key={si.name} style={{ background: '#0d1f38', border: `1px solid ${si.color}33`, borderRadius: 14, padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: si.color, borderRadius: '14px 14px 0 0' }} />
                <div style={{ fontSize: 26, marginBottom: 10 }}>{si.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{si.name}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>Lead: {si.ministry}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                  {si.kpis.map(k => (
                    <div key={k} style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 5 }}>
                      <span style={{ color: si.color }}>▸</span> {k}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: '#0B234266', borderRadius: 6, padding: '7px 8px' }}>
                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>BUDGET</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: si.color }}>{si.budget}</div>
                  </div>
                  <div style={{ background: '#0B234266', borderRadius: 6, padding: '7px 8px' }}>
                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>TIMELINE</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{si.timeline}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Completion</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: si.color }}>{si.completion}%</span>
                </div>
                <div style={{ height: 6, background: '#1A3A6C44', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${si.completion}%`, background: `linear-gradient(90deg, ${si.color}88, ${si.color})`, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 4: NATIONAL PERFORMANCE INDICATORS ═══ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#1C39BB', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>National Performance Indicators</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {npiData.map((n) => (
              <div key={n.label} style={{ background: '#0d1f38', border: '1px solid #1C39BB33', borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: n.color, lineHeight: 1, marginBottom: 2 }}>{n.value}</div>
                <div style={{ fontSize: 9, color: '#64748b', marginBottom: 6, lineHeight: 1.3 }}>{n.label}</div>
                <div style={{ fontSize: 9, color: '#475569', marginBottom: 6 }}>Target: <span style={{ color: '#94a3b8' }}>{n.target}</span></div>
                <div style={{ fontSize: 14 }}>
                  {n.trend === 'up'
                    ? <span style={{ color: '#22c55e' }}>▲</span>
                    : <span style={{ color: '#22c55e' }}>▼</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 5: EXECUTIVE BRIEFINGS ═══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: '#D4AF37', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Executive Briefings</h2>
            <button onClick={() => setBriefingModalOpen(true)} style={{ marginLeft: 'auto', padding: '8px 16px', background: 'linear-gradient(135deg, #1C39BB, #1A3A6C)', border: '1px solid #1C39BB66', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📅 Schedule New Briefing
            </button>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #D4AF37, #1C39BB33)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {executiveBriefings.map((b, idx) => (
                <div key={b.date} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -20, top: 18, width: 12, height: 12, borderRadius: '50%', background: idx === 0 ? '#D4AF37' : '#1C39BB', border: `2px solid ${idx === 0 ? '#D4AF37' : '#1C39BB'}`, boxShadow: idx === 0 ? '0 0 10px #D4AF3766' : 'none' }} />
                  <div style={{ background: '#0d1f38', border: `1px solid ${idx === 0 ? '#D4AF3744' : '#1C39BB22'}`, borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{b.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {b.participants.map(p => (
                            <span key={p} style={{ fontSize: 10, background: '#1A3A6C44', border: '1px solid #1C39BB33', color: '#94a3b8', padding: '2px 7px', borderRadius: 4 }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: idx === 0 ? '#D4AF37' : '#64748b', fontWeight: 600, marginLeft: 12, whiteSpace: 'nowrap' }}>📅 {b.date}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, borderLeft: '3px solid #1C39BB44', paddingLeft: 10 }}>{b.summary}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE BRIEFING MODAL */}
      {briefingModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ background: '#0d1f38', border: '1px solid #D4AF3744', borderRadius: 18, padding: '28px 28px', width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#D4AF37' }}>📅 Schedule Executive Briefing</h3>
              <button onClick={() => setBriefingModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={labelStyle}>Briefing Title</label><input style={inputStyle} placeholder="Enter briefing title..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Date</label><input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} /></div>
                <div><label style={labelStyle}>Time</label><input type="time" style={{ ...inputStyle, colorScheme: 'dark' }} /></div>
              </div>
              <div><label style={labelStyle}>Participants</label><textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Add participants..." /></div>
              <div><label style={labelStyle}>Classification Level</label>
                <select style={inputStyle}>
                  {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET', 'TS/SCI'].map(l => <option key={l} value={l} style={{ background: '#0B2342' }}>{l}</option>)}
                </select>
              </div>
              <button onClick={() => setBriefingModalOpen(false)} style={{ marginTop: 8, padding: '12px', background: 'linear-gradient(135deg, #D4AF37, #b8922e)', border: 'none', borderRadius: 10, color: '#0B2342', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        select option { background: #0B2342; color: #e2e8f0; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(5) hue-rotate(175deg); }
      `}</style>
    </div>
  )
}
