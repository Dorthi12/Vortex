'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Lock, User, ChevronDown } from 'lucide-react';
import { useGovStore } from '@/store/useGovStore';

// Derive a human-readable page title from pathname
function getPageTitle(pathname: string): { crumbs: string[]; title: string } {
  const segments = pathname.replace(/^\/gov\/?/, '').split('/').filter(Boolean);
  if (segments.length === 0) return { crumbs: ['GOV'], title: 'Portal Home' };

  const labelMap: Record<string, string> = {
    dashboard:  'Dashboard',
    complaints: 'Complaints',
    policies:   'Policies',
    departments:'Departments',
    resources:  'Resources',
    council:    'Governance Council',
    command:    'Command Center',
    analytics:  'Analytics',
    reports:    'Reports',
    audit:      'Audit Center',
    users:      'User Management',
    leadership: 'Leadership Panel',
    settings:   'Settings',
  };

  const crumbs = ['GOV', ...segments.map(s => labelMap[s] ?? s.charAt(0).toUpperCase() + s.slice(1))];
  const title = labelMap[segments[0]] ?? segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  return { crumbs, title };
}

// Mock notifications
const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'CMP-00421: Critical infrastructure alert', time: '6m ago', unread: true },
  { id: 2, text: 'Governance Council requires review', time: '22m ago', unread: true },
  { id: 3, text: 'New policy POL-2024-005 submitted', time: '1h ago', unread: false },
  { id: 4, text: 'NDRF deployment confirmed — Kolhapur', time: '2h ago', unread: false },
];

export function GovNavbar() {
  const pathname = usePathname();
  const { govUser } = useGovStore();
  const { crumbs, title } = getPageTitle(pathname);

  const [now, setNow] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  return (
    <header className="flex-shrink-0 flex items-center justify-between h-16 px-6 bg-[#0A1228] border-b border-[#1A2744] relative z-20">

      {/* ── LEFT: Breadcrumb + Page Title ── */}
      <div className="flex flex-col min-w-0">
        <nav className="flex items-center gap-1.5 text-[10px] text-slate-500 tracking-widest uppercase mb-0.5">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-700">/</span>}
              <span className={i === crumbs.length - 1 ? 'text-[#D4AF37]/80' : ''}>{c}</span>
            </React.Fragment>
          ))}
        </nav>
        <h1 className="text-white font-semibold text-base leading-tight truncate">{title}</h1>
      </div>

      {/* ── CENTER: Classification Badge ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
        <Lock size={11} className="text-[#D4AF37]" />
        <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.18em] whitespace-nowrap">
          CLASSIFIED • GOVERNMENT ACCESS ONLY
        </span>
        <Lock size={11} className="text-[#D4AF37]" />
      </div>

      {/* ── RIGHT: DateTime + Notifications + User ── */}
      <div className="flex items-center gap-4">

        {/* Date + Time */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-white text-xs font-mono font-semibold tabular-nums">{formattedTime}</span>
          <span className="text-slate-500 text-[10px]">{formattedDate}</span>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-[#1A2744]" />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg hover:bg-[#1A2744] transition-colors text-slate-400 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[#D4AF37] text-[#070D1A] text-[9px] font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#0D1E3A] border border-[#1A2744] rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A2744]">
                <span className="text-white text-sm font-semibold">Notifications</span>
                <span className="text-[#D4AF37] text-xs">{unreadCount} unread</span>
              </div>
              <ul className="divide-y divide-[#1A2744] max-h-64 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map(n => (
                  <li key={n.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-[#1A2744]/40 transition-colors cursor-pointer ${n.unread ? 'bg-[#1C39BB]/5' : ''}`}>
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.unread ? 'bg-[#D4AF37]' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-xs leading-snug">{n.text}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-2 border-t border-[#1A2744] text-center">
                <button className="text-[#D4AF37]/70 text-xs hover:text-[#D4AF37] transition-colors">View all alerts</button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#1A2744] transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#1C39BB] to-[#1A3A6C] border border-[#D4AF37]/30">
              <User size={14} className="text-white" />
            </div>
            {govUser && (
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-white text-xs font-semibold truncate max-w-[120px]">{govUser.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="text-[#D4AF37]/70 text-[10px] truncate max-w-[120px]">{govUser.role}</span>
              </div>
            )}
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && govUser && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#0D1E3A] border border-[#1A2744] rounded-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-4 border-b border-[#1A2744]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#1C39BB] to-[#1A3A6C] border border-[#D4AF37]/30">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{govUser.name}</p>
                    <p className="text-[#D4AF37]/70 text-xs">{govUser.role}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5 font-mono">{govUser.govId}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Department</span>
                  <span className="text-slate-300">{govUser.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click-away overlay */}
      {(showNotifs || showUserMenu) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => { setShowNotifs(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
}
