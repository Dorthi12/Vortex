'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGovStore } from '@/store/useGovStore';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// ── India map SVG paths (simplified decorative outline) ──────────────────────
function IndiaMapSVG() {
  return (
    <svg
      viewBox="0 0 500 560"
      className="w-full max-w-[420px] opacity-[0.07]"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
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
      />
      {/* Andaman & Nicobar */}
      <path d="M 395 460 C 396 455, 398 450, 395 440" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="398" cy="485" r="1.5" fill="#D4AF37" />
      <circle cx="405" cy="505" r="2" fill="#D4AF37" />
      <circle cx="410" cy="520" r="1.5" fill="#D4AF37" />
      {/* Lakshadweep */}
      <circle cx="160" cy="485" r="2" fill="#D4AF37" />
      <circle cx="163" cy="495" r="1.5" fill="#D4AF37" />
      <circle cx="167" cy="505" r="2" fill="#D4AF37" />
    </svg>
  );
}

// ── Decorative security badge pill ───────────────────────────────────────────
function SecurityBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1A2744] bg-[#0A1228]/60 text-xs text-slate-400">
      <Icon size={12} className="text-[#D4AF37]" />
      <span>{label}</span>
    </div>
  );
}

export default function GovLoginPage() {
  const router = useRouter();
  const { govLogin } = useGovStore();

  const [govId, setGovId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small artificial delay for UX realism
    await new Promise(r => setTimeout(r, 900));

    const success = govLogin(govId.trim(), password);
    if (success) {
      router.push('/gov/dashboard');
    } else {
      setError('Invalid Government ID or password. Please verify your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  const fillDemo = () => {
    setGovId('GOV-NAT-0001');
    setPassword('gov123');
    setError('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070D1A]">

      {/* ══════════════════════════════════════
          LEFT PANEL — Branding (60%)
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden bg-gradient-to-br from-[#070D1A] via-[#0B1A2E] to-[#0B2342] border-r border-[#1A2744]">

        {/* Background map */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <IndiaMapSVG />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Radial glow at center */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(28,57,187,0.12) 0%, transparent 70%)' }} />

        {/* Content */}
        <div className="relative flex flex-col h-full px-14 py-12">

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A3A6C] to-[#0B2342] border border-[#D4AF37]/40 shadow-xl shadow-[#D4AF37]/5">
              <Shield size={28} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-[#D4AF37] text-2xl font-black tracking-widest">NETRAVAAH</h1>
              <p className="text-[#D4AF37]/50 text-xs tracking-[0.3em] font-medium">GOVERNANCE PLATFORM</p>
            </div>
          </div>

          {/* Main tagline */}
          <div className="mt-auto mb-auto pt-8">
            <p className="text-slate-500 text-xs tracking-[0.25em] uppercase mb-3">Integrated National Governance System</p>
            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Governing with<br />
              <span className="text-[#D4AF37]">Intelligence</span> &{' '}
              <span className="text-[#1C39BB]">Clarity</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Secure, AI-augmented governance infrastructure connecting departments,
              citizens, and decision-makers across the nation.
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { label: 'Districts Online', value: '748' },
                { label: 'Active Officers', value: '24,300' },
                { label: 'Cases Resolved', value: '98.2%' },
                { label: 'Uptime SLA', value: '99.97%' },
              ].map(s => (
                <div key={s.label} className="px-4 py-2 rounded-lg bg-[#0D1E3A] border border-[#1A2744]">
                  <div className="text-[#D4AF37] font-bold text-base">{s.value}</div>
                  <div className="text-slate-500 text-[10px]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning banner */}
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-amber-700/30 bg-amber-900/10 mt-auto">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-300 text-xs font-semibold tracking-wide uppercase mb-0.5">Official Government Use Only</p>
              <p className="text-amber-400/60 text-[11px] leading-snug">
                This system is restricted to authorised government officials. Unauthorised access is a criminal offence under the IT Act, 2000.
                All sessions are monitored and audit-logged.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-slate-700 text-[10px] mt-6 tracking-wider">
            © 2024 NETRAVAAH — MINISTRY OF ELECTRONICS & INFORMATION TECHNOLOGY, GOVT. OF INDIA
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL — Login Form (40%)
      ══════════════════════════════════════ */}
      <div className="flex flex-col items-center justify-center flex-1 bg-[#070D1A] px-8 relative overflow-hidden">

        {/* Subtle radial glow behind card */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(26,58,108,0.12) 0%, transparent 70%)' }} />

        {/* Mobile logo (only visible below lg) */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <Shield size={22} className="text-[#D4AF37]" />
          <span className="text-[#D4AF37] font-black tracking-widest text-lg">NETRAVAAH</span>
        </div>

        {/* Card */}
        <div
          className={`relative w-full max-w-sm bg-[#0A1228] border border-[#1A2744] rounded-2xl shadow-2xl overflow-hidden transition-all duration-150 ${
            shake ? 'animate-pulse border-red-500/50' : ''
          }`}
          style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          {/* Card top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="px-8 pt-8 pb-6">
            {/* Card header */}
            <div className="text-center mb-7">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#1A3A6C] to-[#0B2342] border border-[#D4AF37]/30 mx-auto mb-4">
                <Lock size={22} className="text-[#D4AF37]" />
              </div>
              <h2 className="text-white text-xl font-bold">Government Secure Access</h2>
              <p className="text-slate-500 text-xs mt-1 tracking-wide">NETRAVAAH Governance Platform</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-lg bg-red-900/20 border border-red-700/40">
                <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-xs leading-snug">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Government ID */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 tracking-wide">
                  Government ID
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={govId}
                    onChange={e => setGovId(e.target.value)}
                    placeholder="GOV-NAT-0001"
                    required
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#070D1A] border border-[#1A2744] rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#1C39BB] focus:ring-1 focus:ring-[#1C39BB]/30 transition-colors font-mono tracking-widest"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5 tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#070D1A] border border-[#1A2744] rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#1C39BB] focus:ring-1 focus:ring-[#1C39BB]/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-lg bg-[#1A3A6C] border border-[#D4AF37]/40 text-white text-sm font-semibold tracking-wide hover:bg-[#1C39BB] hover:border-[#D4AF37]/70 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1C39BB]/10"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Help text */}
            <p className="text-slate-600 text-[10px] text-center mt-4 leading-relaxed">
              Use your official government credentials.<br />
              For assistance contact:{' '}
              <span className="text-[#D4AF37]/60">helpdesk@netravaah.gov.in</span>
            </p>
          </div>

          {/* Security badges */}
          <div className="flex justify-center gap-2 flex-wrap px-6 pb-5 border-t border-[#1A2744] pt-4">
            <SecurityBadge icon={Lock} label="SSL Encrypted" />
            <SecurityBadge icon={Shield} label="MFA Ready" />
            <SecurityBadge icon={CheckCircle} label="Audit Logged" />
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 w-full max-w-sm">
          <button
            type="button"
            onClick={fillDemo}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-[#1A2744] hover:border-[#D4AF37]/30 bg-[#0A1228]/50 hover:bg-[#0D1E3A]/70 transition-all group"
          >
            <div className="text-left">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Demo Credentials</p>
              <p className="text-slate-300 text-xs font-mono">GOV-NAT-0001 / gov123</p>
            </div>
            <div className="text-[#D4AF37]/40 group-hover:text-[#D4AF37] transition-colors text-[10px] tracking-widest">
              AUTOFILL ↗
            </div>
          </button>
        </div>
      </div>

      {/* Shake keyframe (inline style workaround) */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
