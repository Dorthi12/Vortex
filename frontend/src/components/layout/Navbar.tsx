'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Bell, Sun, Moon, Search, ChevronRight } from 'lucide-react';
import { useUiStore } from '@/store/useUiStore';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { 
    toggleSidebar, 
    toggleNotificationPanel, 
    activeTab 
  } = useUiStore();

  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Sync theme with local storage/document on load
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full flex items-center justify-between px-4 sm:px-6 glass-navbar">
      {/* Left Area: Mobile hamburger toggle & Brand/Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 text-neutral-text-muted hover:bg-slate-100 rounded-full"
          onClick={toggleSidebar}
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5 text-neutral-text dark:text-neutral-white" />
        </Button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center text-sm font-medium">
          <Link 
            href="/welcome" 
            className="text-neutral-text-muted hover:text-neutral-text dark:text-neutral-white/60 dark:hover:text-neutral-white cursor-pointer hidden sm:inline-block no-underline"
          >
            NETRAVAAH
          </Link>
          <ChevronRight className="w-4 h-4 text-neutral-text-muted/60 mx-1.5 hidden sm:inline-block" />
          <span className="text-royal-blue dark:text-persian-blue font-semibold tracking-wide">
            {activeTab}
          </span>
        </div>
      </div>

      {/* Right Area: Utility Actions */}
      <div className="flex items-center gap-2">
        {/* Mock Search Bar */}
        <div className="relative hidden md:block w-60">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-neutral-text-muted/60" />
          </span>
          <input
            type="search"
            placeholder="Search resources, files..."
            className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-neutral-text dark:text-neutral-white border border-transparent focus:outline-none focus:bg-white focus:border-border-subtle focus:ring-1 focus:ring-ring dark:focus:bg-slate-900 transition-all"
          />
        </div>
        
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          aria-label="Search"
        >
          <Search className="w-4 h-4 text-neutral-text-muted dark:text-neutral-white/80" />
        </Button>

        {/* Theme Mode Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-amber-500 animate-in spin-in-12 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-neutral-text dark:text-neutral-white animate-in spin-in-12 duration-200" />
          )}
        </Button>

        {/* Divider */}
        <span className="h-5 w-[1px] bg-border-subtle dark:bg-slate-800 mx-1" />

        {/* Notification Bell Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleNotificationPanel}
          className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative"
          aria-label="Open notifications panel"
        >
          <Bell className="w-4.5 h-4.5 text-neutral-text dark:text-neutral-white" />
          {/* Active notification indicator count */}
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        </Button>

        {/* Mini User Profile Image */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 rounded-full border border-royal-blue/20 bg-royal-blue/10 flex items-center justify-center text-xs font-bold text-royal-blue dark:text-neutral-white dark:bg-slate-800 dark:border-slate-700 ml-1 hover:ring-2 hover:ring-ring transition-all cursor-pointer"
          >
            JD
          </button>
          
          {showProfileMenu && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              
              {/* Profile Card Dropdown */}
              <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4 animate-in fade-in duration-100 text-slate-800 dark:text-slate-200">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-royal-blue text-white flex items-center justify-center text-sm font-bold shadow-inner">
                    JD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Jane Doe</h4>
                    <p className="text-[10px] text-slate-400">Verified Citizen · Pune</p>
                    <p className="text-[9px] text-[#0F4C81] dark:text-[#D4AF37] font-mono mt-0.5">ID: CIT-90812</p>
                  </div>
                </div>

                <div className="py-3">
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Recent Portal Activities</h5>
                  <div className="space-y-2.5">
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-slate-400 block font-mono text-[9px]">TODAY, 10:24 AM</span>
                      Checked active bridge health telemetry (Sangam Road Overpass)
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-slate-400 block font-mono text-[9px]">YESTERDAY, 04:15 PM</span>
                      Submitted water pipeline leakage complaint (CMP-78401)
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className="text-slate-400 block font-mono text-[9px]">2 DAYS AGO</span>
                      Applied for PM Crop Insurance Enhancement scheme
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      localStorage.removeItem('citizen_authenticated');
                      window.location.href = '/welcome';
                    }}
                    className="flex-1 text-center py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="flex-1 text-center py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
