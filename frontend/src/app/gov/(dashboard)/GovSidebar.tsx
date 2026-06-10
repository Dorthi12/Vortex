'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Building2,
  Package,
  Users,
  Radio,
  TrendingUp,
  ClipboardList,
  ShieldCheck,
  UserCog,
  Star,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useGovStore } from '@/store/useGovStore';

const NAV_LINKS = [
  { label: 'Dashboard',         href: '/gov/dashboard',   icon: LayoutDashboard },
  { label: 'Complaints',        href: '/gov/complaints',  icon: Inbox },
  { label: 'Policies',          href: '/gov/policies',    icon: FileText },
  { label: 'Departments',       href: '/gov/departments', icon: Building2 },
  { label: 'Resources',         href: '/gov/resources',   icon: Package },
  { label: 'Governance Council',href: '/gov/council',     icon: Users },
  { label: 'Command Center',    href: '/gov/command',     icon: Radio },
  { label: 'Analytics',         href: '/gov/analytics',   icon: TrendingUp },
  { label: 'Reports',           href: '/gov/reports',     icon: ClipboardList },
  { label: 'Audit Center',      href: '/gov/audit',       icon: ShieldCheck },
  { label: 'User Management',   href: '/gov/users',       icon: UserCog },
  { label: 'Leadership Panel',  href: '/gov/leadership',  icon: Star },
  { label: 'Settings',          href: '/gov/settings',    icon: Settings },
];

export function GovSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { govUser, govLogout } = useGovStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    govLogout();
    router.push('/gov/login');
  };

  return (
    <aside
      className={`relative flex flex-col h-full bg-[#070D1A] border-r border-[#1A2744] transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } flex-shrink-0`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#1A3A6C] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#1C39BB] transition-colors"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Logo / Brand ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1A2744] flex-shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#1A3A6C] to-[#0B2342] border border-[#D4AF37]/40 flex-shrink-0">
          <Shield size={20} className="text-[#D4AF37]" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-[#D4AF37] font-bold text-sm tracking-widest truncate">
              NETRAVAAH
            </span>
            <span className="text-[#D4AF37]/60 text-[10px] tracking-[0.2em] font-medium truncate">
              GOV PORTAL
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#1A2744] scrollbar-track-transparent">
        <ul className="space-y-0.5 px-2">
          {NAV_LINKS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-[#1A3A6C] text-white'
                      : 'text-slate-400 hover:bg-[#0D1E3A] hover:text-white'
                  }`}
                  title={collapsed ? label : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#D4AF37] rounded-r-full" />
                  )}
                  <Icon
                    size={18}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#D4AF37]' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate">{label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User Info + Logout ── */}
      <div className="flex-shrink-0 border-t border-[#1A2744] p-3">
        {govUser ? (
          <div className="space-y-2">
            {!collapsed && (
              <div className="px-2 py-2 rounded-lg bg-[#0D1E3A] border border-[#1A2744]">
                <p className="text-white text-xs font-semibold truncate">{govUser.name}</p>
                <p className="text-[#D4AF37]/70 text-[10px] truncate mt-0.5">{govUser.role}</p>
                <p className="text-slate-500 text-[10px] truncate">{govUser.govId}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2.5 w-full py-2 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors text-sm font-medium ${
                collapsed ? 'justify-center px-3' : 'pl-12 pr-3'
              }`}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut size={16} className="flex-shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        ) : (
          <div className={`flex ${collapsed ? 'justify-center' : ''} px-2`}>
            <span className="text-slate-600 text-xs">Not signed in</span>
          </div>
        )}
      </div>
    </aside>
  );
}
