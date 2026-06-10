'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, 
  Activity, 
  TrendingUp, 
  Search, 
  BookOpen, 
  Award, 
  Users, 
  Building, 
  Sliders, 
  FileText, 
  MessageSquare,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/education', icon: Activity },
  { name: 'Performance', path: '/education/performance', icon: TrendingUp },
  { name: 'Dropout Risk', path: '/education/dropout', icon: Search },
  { name: 'Scholarships', path: '/education/scholarships', icon: Award },
  { name: 'Teachers', path: '/education/teachers', icon: Users },
  { name: 'Infrastructure', path: '/education/infrastructure', icon: Building },
  { name: 'Higher Edu', path: '/education/higher-edu', icon: GraduationCap },
  { name: 'Resource Planner', path: '/education/resource-planner', icon: Sliders },
  { name: 'AI Assistant', path: '/education/assistant', icon: MessageSquare },
  { name: 'Reports', path: '/education/reports', icon: FileText }
];

interface EducationHeaderProps {
  title: string;
  subtitle: string;
}

export function EducationHeader({ title, subtitle }: EducationHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
      
      {/* Title & Metadata Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-edu-purple animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-edu-purple dark:text-edu-gold font-bold">
              National Education Policy & Analytics Registry
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-edu-purple" />
            <span>{title}</span>
          </h1>
          <p className="text-slate-800 dark:text-slate-400 text-sm mt-0.5 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Global Stats Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[8px] uppercase font-bold text-slate-900 dark:text-slate-500">Registry System</p>
            <p className="text-xs font-black text-royal-blue dark:text-edu-gold font-mono">ED-INTELL-V2.6</p>
          </div>
          <div className="h-8 border-l border-slate-200 dark:border-slate-800" />
          <div className="text-left">
            <p className="text-[8px] uppercase font-bold text-slate-900 dark:text-slate-500">Live Status</p>
            <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-450 bg-emerald-100 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30">
              ● ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Sub-Navigation Tab Bar */}
      <div className="flex items-center overflow-x-auto gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 scrollbar-none py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all shrink-0 no-underline cursor-pointer",
                isActive
                  ? "bg-white dark:bg-slate-850 text-edu-purple dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-900 hover:text-edu-purple dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-edu-purple" : "text-slate-500 dark:text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
