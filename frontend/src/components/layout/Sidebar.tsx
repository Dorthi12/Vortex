'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  LayoutDashboard, 
  Activity, 
  Users, 
  TrendingUp, 
  Inbox, 
  BookOpen, 
  GraduationCap,
  ClipboardList, 
  Scale, 
  Cpu, 
  Layers, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Sprout,
  HeartPulse,
  Building2,
  LogOut
} from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { StateEmblem } from './StateEmblem';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Official Government Dashboard', icon: Activity },
  { name: 'National Command Center', icon: Layers },
  { name: 'Agriculture', icon: Sprout },
  { name: 'Health Services', icon: HeartPulse },
  { name: 'Civic Hazards', icon: Scale },
  { name: 'Infrastructure', icon: Building2 },
  { name: 'Governance Council', icon: Users },
  { name: 'Complaints', icon: Inbox },
  { name: 'Education', icon: GraduationCap },
  { name: 'Reports', icon: ClipboardList },
  { name: 'Policy Intelligence', icon: Scale },
  { name: 'Simulation', icon: Cpu },
  { name: 'Digital Twin', icon: Layers },
];

const MENU_ITEM_PATHS: Record<string, string> = {
  'Dashboard': '/',
  'Official Government Dashboard': '/command-center',
  'National Command Center': '/national-command-center',
  'Agriculture': '/agriculture',
  'Health Services': '/health',
  'Civic Hazards': '/hazards',
  'Infrastructure': '/infrastructure',
  'Governance Council': '/governance',
  'Reports': '/reports',
  'Policy Intelligence': '/policies',
  'Simulation': '/simulation',
  'Digital Twin': '/digital-twin',
  'Complaints': '/complaints',
  'Education': '/education',
};

export function Sidebar() {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    sidebarOpen, 
    toggleSidebar,
    activeTab,
    setActiveTab
  } = useUiStore();

  const handleMenuClick = (name: string) => {
    setActiveTab(name);
    if (sidebarOpen) {
      toggleSidebar(); // Close mobile sidebar drawer after click
    }
  };

  const sidebarVariants: Variants = {
    expanded: { width: '16rem', transition: { duration: 0.2, ease: 'easeInOut' } },
    collapsed: { width: '5rem', transition: { duration: 0.2, ease: 'easeInOut' } },
  };

  const labelVariants: Variants = {
    expanded: { opacity: 1, x: 0, display: 'block', transition: { delay: 0.1, duration: 0.15 } },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' }, transition: { duration: 0.1 } },
  };

  // Reusable Sidebar menu list render
  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;
        const path = MENU_ITEM_PATHS[item.name];

        const linkContent = (
          <span
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer',
              isActive
                ? 'bg-royal-blue text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            )}
            title={sidebarCollapsed ? item.name : undefined}
          >
            <Icon 
              className={cn(
                'w-5 h-5 shrink-0 transition-transform group-hover:scale-105',
                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white'
              )} 
            />
            
            {/* Nav label with framer motion animate */}
            <motion.span
              animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
              variants={labelVariants}
              initial={false}
              className="truncate"
            >
              {item.name}
            </motion.span>

            {/* Hover tooltip for collapsed sidebar */}
            {sidebarCollapsed && (
              <span className="absolute left-16 z-50 scale-0 rounded-md bg-gov-navy px-2 py-1 text-xs text-white group-hover:scale-100 transition-all shadow-md font-sans border border-slate-700 whitespace-nowrap">
                {item.name}
              </span>
            )}
          </span>
        );

        if (path) {
          return (
            <Link
              key={item.name}
              href={path}
              onClick={() => handleMenuClick(item.name)}
              className="block no-underline"
            >
              {linkContent}
            </Link>
          );
        }

        return (
          <button
            key={item.name}
            onClick={() => handleMenuClick(item.name)}
            className="w-full text-left"
          >
            {linkContent}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* 2. Mobile Sidebar Slide-Over Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-2xl lg:hidden"
          >
            {/* Header in mobile panel */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle bg-gov-navy text-neutral-white">
              <Link href="/welcome" onClick={toggleSidebar} className="flex items-center gap-2 hover:opacity-85 transition-opacity no-underline">
                <StateEmblem className="w-6 h-7 text-brand-yellow" />
                <span className="font-bold tracking-wider text-base font-sans text-white">NETRAVAAH</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-neutral-white/80 hover:bg-slate-800 rounded-full"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Nav Links */}
            {renderNavLinks()}

            <div className="p-4 border-t border-border-subtle text-center text-xs text-neutral-text-muted">
              v1.0.0-beta • Governance AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Desktop Permanent Collapsible Sidebar */}
      <motion.div
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        initial={false}
        className="hidden lg:flex flex-col border-r border-border bg-card shrink-0 h-screen sticky top-0"
      >
        <Link 
          href="/welcome"
          className="h-16 px-6 border-b border-border-subtle flex items-center gap-3 overflow-hidden bg-gov-navy text-neutral-white shrink-0 hover:opacity-85 transition-opacity no-underline w-full"
        >
          <StateEmblem className="w-6 h-7 text-brand-yellow shrink-0" />
          {!sidebarCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold tracking-widest text-base font-sans whitespace-nowrap text-white"
            >
              NETRAVAAH
            </motion.span>
          )}
        </Link>

        {/* Sidebar Nav Links */}
        {renderNavLinks()}

        {/* Bottom Actions Container */}
        <div className="p-3 border-t border-border-subtle shrink-0 space-y-1">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start py-2.5 px-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 dark:hover:text-red-400"
            onClick={() => {
              localStorage.removeItem('citizen_authenticated');
              window.location.href = '/welcome';
            }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold ml-3">Logout</span>
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full flex items-center justify-center py-2.5 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 shrink-0" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-5 h-5 shrink-0" />
                <span className="text-xs font-medium">Collapse Menu</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
