'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Sprout, 
  HeartPulse, 
  Flame, 
  Building2, 
  TrendingUp, 
  Truck, 
  Leaf, 
  Zap, 
  Scale, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  MessageSquare, 
  Database, 
  Sparkles, 
  Sun, 
  Moon, 
  Star, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Play,
  Cpu,
  Brain,
  Layers,
  Fingerprint,
  RotateCcw,
  ChevronRight
} from 'lucide-react';
import { StateEmblem } from '@/components/layout/StateEmblem';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

const cardThemes = [
  // 1. Predict Future Events (Persian Blue)
  { 
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40', 
    border: 'border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600', 
    text: 'text-indigo-900 dark:text-indigo-300', 
    accent: 'text-indigo-700 dark:text-indigo-400',
    divider: 'border-indigo-200 dark:border-indigo-800/50'
  },
  // 2. Monitor Infrastructure (Steel Blue/Slate)
  { 
    bg: 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-900/40 dark:hover:bg-slate-800/40', 
    border: 'border-slate-200/80 dark:border-slate-800/60 hover:border-slate-400 dark:hover:border-slate-650', 
    text: 'text-slate-800 dark:text-slate-200', 
    accent: 'text-slate-600 dark:text-slate-400',
    divider: 'border-slate-200 dark:border-slate-800/50'
  },
  // 3. Detect Disease Outbreaks (Teal)
  { 
    bg: 'bg-teal-50/90 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:hover:bg-teal-900/40', 
    border: 'border-teal-200/80 dark:border-teal-800/60 hover:border-teal-400 dark:hover:border-teal-600', 
    text: 'text-teal-900 dark:text-teal-300', 
    accent: 'text-teal-700 dark:text-teal-400',
    divider: 'border-teal-200 dark:border-teal-800/50'
  },
  // 4. Analyze Agricultural Conditions (Green)
  { 
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40', 
    border: 'border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600', 
    text: 'text-emerald-900 dark:text-emerald-300', 
    accent: 'text-emerald-700 dark:text-emerald-400',
    divider: 'border-emerald-200 dark:border-emerald-800/50'
  },
  // 5. Track Disaster Risks (Red/Rose)
  { 
    bg: 'bg-rose-50/90 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/40', 
    border: 'border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600', 
    text: 'text-rose-900 dark:text-rose-350', 
    accent: 'text-rose-700 dark:text-rose-400',
    divider: 'border-rose-200 dark:border-rose-800/50'
  },
  // 6. Recommend Actions (Orange/Amber)
  { 
    bg: 'bg-orange-50/90 hover:bg-orange-100/90 dark:bg-orange-950/40 dark:hover:bg-orange-900/40', 
    border: 'border-orange-200/80 dark:border-orange-850/60 hover:border-orange-400 dark:hover:border-orange-650', 
    text: 'text-orange-900 dark:text-orange-350', 
    accent: 'text-orange-700 dark:text-orange-400',
    divider: 'border-orange-200 dark:border-orange-800/50'
  },
  // 7. Optimize Resource Allocation (Purple)
  { 
    bg: 'bg-purple-50/90 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/40', 
    border: 'border-purple-200/80 dark:border-purple-800/60 hover:border-purple-400 dark:hover:border-purple-650', 
    text: 'text-purple-900 dark:text-purple-300', 
    accent: 'text-purple-700 dark:text-purple-400',
    divider: 'border-purple-200 dark:border-purple-800/50'
  },
  // 8. Provide Policy Intelligence (Royal Blue)
  { 
    bg: 'bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/40', 
    border: 'border-blue-200/80 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-650', 
    text: 'text-blue-900 dark:text-blue-300', 
    accent: 'text-blue-700 dark:text-blue-400',
    divider: 'border-blue-200 dark:border-blue-800/50'
  },
  // 9. Generate Executive Reports (Fuchsia)
  { 
    bg: 'bg-fuchsia-50/90 hover:bg-fuchsia-100/90 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/40', 
    border: 'border-fuchsia-200/80 dark:border-fuchsia-800/60 hover:border-fuchsia-400 dark:hover:border-fuchsia-650', 
    text: 'text-fuchsia-900 dark:text-fuchsia-350', 
    accent: 'text-fuchsia-700 dark:text-fuchsia-400',
    divider: 'border-fuchsia-200 dark:border-fuchsia-800/50'
  },
  // 10. Support Citizen Services (Cyan)
  { 
    bg: 'bg-cyan-50/90 hover:bg-cyan-100/90 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40', 
    border: 'border-cyan-200/80 dark:border-cyan-800/60 hover:border-cyan-400 dark:hover:border-cyan-650', 
    text: 'text-cyan-900 dark:text-cyan-300', 
    accent: 'text-cyan-700 dark:text-cyan-400',
    divider: 'border-cyan-200 dark:border-cyan-800/50'
  },
  // 11. Run Simulations (Lime)
  { 
    bg: 'bg-lime-50/90 hover:bg-lime-100/90 dark:bg-lime-950/40 dark:hover:bg-lime-900/40', 
    border: 'border-lime-200/80 dark:border-lime-800/60 hover:border-lime-400 dark:hover:border-lime-650', 
    text: 'text-lime-900 dark:text-lime-350', 
    accent: 'text-lime-700 dark:text-lime-400',
    divider: 'border-lime-200 dark:border-lime-800/50'
  },
  // 12. Build Digital Twins (Gold/Amber)
  { 
    bg: 'bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-900/40', 
    border: 'border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-650', 
    text: 'text-amber-950 dark:text-[#E5B842]', 
    accent: 'text-amber-800 dark:text-amber-400',
    divider: 'border-amber-200 dark:border-amber-800/50'
  }
];

export default function WelcomePage() {
  const router = useRouter();

  // Theme synchronization
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  // Review Carousel State
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);
  const reviews = [
    { type: 'District Collector', rating: 5, feedback: 'Netravaah revolutionized our monsoon emergency response. The dam flood discharge simulator prevented critical causeway flooding in Wards 14 & 15.', author: 'Shri R. K. Gaikwad, IAS', location: 'Pune Division' },
    { type: 'Public Health Director', rating: 5, feedback: 'Outbreak vector risk mapping gave us a 10-day lead time on dengue hotspots control. The diagnostic clinic allocations saved medical reserves from saturation.', author: 'Dr. Sunita Deshpande', location: 'State Health Command' },
    { type: 'Chief Agricultural Officer', rating: 5, feedback: 'Soil health advice and crop suitability matching helped over 85,000 local farmers optimize fertilizer inputs, increasing wheat yield estimates.', author: 'Shri Amit Patil', location: 'APMC Central' },
    { type: 'Senior Citizen Representative', rating: 5, feedback: 'The RAG policy assistant resolved our pension & Ayushman cover queries in seconds. Excellent transparency and accessibility.', author: 'Smt. Kamal Bai', location: 'Shivajinagar Wards' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx(idx => (idx + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  return (
    <div className="w-full h-screen overflow-y-auto bg-white dark:bg-[#050816] text-[#1E293B] dark:text-white font-sans relative selection:bg-purple-500/20 scroll-smooth">
      
      {/* ========================================== */}
      {/* WATERMARK BACKGROUND                       */}
      {/* ========================================== */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
        <StateEmblem className="w-[32rem] h-[38rem] md:w-[50rem] md:h-[58rem] opacity-[0.05] dark:opacity-[0.06] text-[#0F4C81] dark:text-[#D4AF37] transition-all duration-300" />
      </div>

      {/* ========================================== */}
      {/* INDIA OUTLINE BACKGROUND (LEFT SIDE)        */}
      {/* ========================================== */}
      <div className="absolute left-[-15rem] md:left-[-10rem] lg:left-[-5rem] top-[10%] w-[38rem] h-[42rem] md:w-[48rem] md:h-[52rem] pointer-events-none overflow-hidden z-0 select-none">
        <svg 
          viewBox="0 0 500 560" 
          className="w-full h-full text-yellow-500/10 dark:text-[#D4AF37]/10"
          xmlns="http://www.w3.org/2000/svg"
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
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 4"
          />
          {/* Lakshadweep Islands */}
          <circle cx="160" cy="485" r="2.5" fill="currentColor" />
          <circle cx="163" cy="495" r="1.5" fill="currentColor" />
          <circle cx="167" cy="505" r="2" fill="currentColor" />
          
          {/* Andaman & Nicobar Islands */}
          <path d="M 395 460 C 396 455, 398 450, 395 440" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="398" cy="485" r="1.5" fill="currentColor" />
          <circle cx="405" cy="505" r="2" fill="currentColor" />
          <circle cx="410" cy="520" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* ========================================== */}
      {/* HEADER NAVBAR                              */}
      {/* ========================================== */}
      <header className="w-full max-w-7xl mx-auto h-20 px-6 md:px-8 flex items-center justify-between z-20 relative border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <StateEmblem className="w-6 h-7 text-[#0F4C81] dark:text-[#D4AF37]" />
          <span className={`${playfair.className} font-bold tracking-widest text-sm text-[#0B2342] dark:text-white`}>NETRAVAAH</span>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5 text-[#D4AF37]" /> : <Moon className="w-4.5 h-4.5 text-[#0F4C81]" />}
        </button>
      </header>

      {/* ========================================== */}
      {/* HERO SECTION                               */}
      {/* ========================================== */}
      <section className="relative max-w-5xl mx-auto px-6 md:px-8 pt-16 pb-8 text-center space-y-6 z-10">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5 text-royal-blue dark:text-[#D4AF37]" />
            National AI Core Operating System
          </span>
        </div>

        <h1 className={`${playfair.className} text-6xl md:text-8xl font-black tracking-widest text-[#0B2342] dark:text-[#4F46E5] transition-colors select-none [text-shadow:_0_2px_10px_rgba(15,76,129,0.15)] dark:[text-shadow:_0_0_20px_rgba(79,70,229,0.4)]`}>
          NETRAVAAH
        </h1>
        
        <p className="text-lg md:text-xl font-bold tracking-wider text-slate-800 dark:text-slate-350">
          AI-Powered Governance Operating System
        </p>

        <p className="text-sm md:text-base text-slate-800 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          "Transforming data into intelligent decisions for a safer, healthier, more resilient and more prosperous nation."
        </p>

        {/* Hero CTAs */}
        <div className="pt-6 flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => {
              const authenticated = localStorage.getItem('citizen_authenticated') === 'true';
              router.push(authenticated ? '/' : '/login');
            }}
            className="px-6 py-3 bg-[#0F4C81] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Enter Citizen Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => router.push('/gov/login')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white dark:border-slate-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Activity className="w-4 h-4 text-[#0F4C81] dark:text-[#D4AF37]" />
            <span>Enter Government Portal</span>
          </button>
        </div>
      </section>

      {/* ========================================== */}
      {/* NATIONAL COMMAND STATUS TASKBARS          */}
      {/* ========================================== */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-6 relative z-10 font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          
          {/* Card 1: Green Taskbar */}
          <div className="border-t-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/[0.03] p-4 rounded-b-lg shadow-xs flex flex-col justify-between border-x border-b border-slate-200/65 dark:border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">AGRI SYSTEMS</div>
              <div className="text-sm font-black text-emerald-800 dark:text-emerald-450 mt-1">TELEMETRY ON</div>
            </div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-4 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>ACTIVE SYNC</span>
            </div>
          </div>

          {/* Card 2: Persian Blue Taskbar */}
          <div className="border-t-4 border-[#1C39BB] bg-[#1C39BB]/5 dark:bg-[#1C39BB]/[0.03] p-4 rounded-b-lg shadow-xs flex flex-col justify-between border-x border-b border-slate-200/65 dark:border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">INFRA SYSTEMS</div>
              <div className="text-sm font-black text-[#1C39BB] dark:text-[#5B7BF6] mt-1">SECURE TRACE</div>
            </div>
            <div className="text-[9px] text-[#1C39BB] dark:text-[#5B7BF6] mt-4 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-[#1C39BB] animate-pulse inline-block" />
              <span>STANDBY LOCK</span>
            </div>
          </div>

          {/* Card 3: Yellow Taskbar */}
          <div className="border-t-4 border-[#D4AF37] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/[0.03] p-4 rounded-b-lg shadow-xs flex flex-col justify-between border-x border-b border-slate-200/65 dark:border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">ECONOMY CORE</div>
              <div className="text-sm font-black text-[#D4AF37] dark:text-[#E5B842] mt-1">AUDIT STAMPED</div>
            </div>
            <div className="text-[9px] text-[#D4AF37] dark:text-[#E5B842] mt-4 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse inline-block" />
              <span>LOGS SIGNED</span>
            </div>
          </div>

          {/* Card 4: Orange Taskbar */}
          <div className="border-t-4 border-orange-500 bg-orange-500/5 dark:bg-orange-500/[0.03] p-4 rounded-b-lg shadow-xs flex flex-col justify-between border-x border-b border-slate-200/65 dark:border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">HAZARD RADAR</div>
              <div className="text-sm font-black text-orange-700 dark:text-orange-450 mt-1">WET-BULB SCAN</div>
            </div>
            <div className="text-[9px] text-orange-600 dark:text-orange-400 mt-4 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse inline-block" />
              <span>ACTIVE WATCH</span>
            </div>
          </div>

          {/* Card 5: Purple Taskbar */}
          <div className="border-t-4 border-purple-500 bg-purple-500/5 dark:bg-purple-500/[0.03] p-4 rounded-b-lg shadow-xs flex flex-col justify-between border-x border-b border-slate-200/65 dark:border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">EDUCATION INTEL</div>
              <div className="text-sm font-black text-purple-700 dark:text-purple-450 mt-1">STAFF MATRIX</div>
            </div>
            <div className="text-[9px] text-purple-600 dark:text-purple-400 mt-4 flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse inline-block" />
              <span>COMPILING</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* MISSION SECTION                            */}
      {/* ========================================== */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-10 z-10 relative">
        <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A1226]/60 backdrop-blur-xs shadow-md p-6 md:p-8 space-y-4 rounded-2xl">
          <h2 className="text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest text-center">
            What is Netravaah?
          </h2>
          <p className="text-xs md:text-sm text-slate-900 dark:text-slate-300 leading-relaxed font-medium text-justify font-sans">
            Netravaah is an AI-powered governance platform that combines predictive intelligence, real-time monitoring, policy intelligence, citizen services, disaster management, healthcare analytics, agricultural insights, infrastructure monitoring, resource optimization and executive decision support into a unified operating system for governance.
          </p>
        </Card>
      </section>

      {/* ========================================== */}
      {/* CAPABILITIES SECTION                       */}
      {/* ========================================== */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-12 space-y-8 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest">
          What Can Netravaah Do?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[
            { title: 'Predict Future Events', desc: 'Forecast structural failures, weather events, and water resource levels.', metric: '95% Accuracy' },
            { title: 'Monitor Infrastructure', desc: 'Real-time telemetry of bridges stress, grid loads, and water flow rates.', metric: '24/7 Scan' },
            { title: 'Detect Disease Outbreaks', desc: 'Track infection vector transmissions and clinic occupancy margins.', metric: '10-Day Lead' },
            { title: 'Analyze Agricultural Conditions', desc: 'NPK mineral matching advisories and APMC market price analytics.', metric: '85k Farmers' },
            { title: 'Track Disaster Risks', desc: 'Severe cyclone trajectory coordinates and wet-bulb index monitoring.', metric: 'Real-Time Alert' },
            { title: 'Recommend Actions', desc: 'Automate evacuation dispatches and healthcare bed resource bookings.', metric: 'Instant Trigger' },
            { title: 'Optimize Resource Allocation', desc: 'Redistribute educator staffing and municipal repair components.', metric: '100% Symmetrical' },
            { title: 'Provide Policy Intelligence', desc: 'Search gazette directories and query RAG chat guidelines.', metric: '18k Docs' },
            { title: 'Generate Executive Reports', desc: 'Compile local, state, and national dossier audits (PDF/Excel).', metric: '650+ Districts' },
            { title: 'Support Citizen Services', desc: 'Register local grievances and track SLA resolution progress.', metric: '97% Resolved' },
            { title: 'Run Simulations', desc: 'Model flood gauge gate releases and multivariable budget growth.', metric: '48h Curve' },
            { title: 'Build Digital Twins', desc: 'Scan 3D isometric city grid nodes checking capacity thresholds.', metric: 'Isometric Scan' }
          ].map((feat, idx) => {
            const theme = cardThemes[idx % cardThemes.length];
            return (
              <Card 
                key={idx} 
                className={cn(
                  "border hover:shadow-2xs transition-all p-4 flex flex-col justify-between min-h-[140px] rounded-xl group cursor-default",
                  theme.bg,
                  theme.border
                )}
              >
                <div>
                  <h3 className={cn("text-xs font-black transition-all", theme.text)}>
                    {feat.title}
                  </h3>
                  <p className="text-[10px] text-slate-800 dark:text-slate-300 mt-2 leading-relaxed font-semibold">
                    {feat.desc}
                  </p>
                </div>
                <div className={cn("text-[9px] font-mono font-black mt-3 border-t pt-2 flex justify-between", theme.divider, theme.accent)}>
                  <span>IMPACT:</span>
                  <span>{feat.metric}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================== */}
      {/* DOMAINS SECTION                            */}
      {/* ========================================== */}
      <section id="domains" className="max-w-6xl mx-auto px-6 md:px-8 py-12 space-y-8 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest">
          Intelligence Domains
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Agriculture Intelligence', desc: 'Monitor crop yields, soil health parameters, and commodity price trends.', capabilities: 'NPK Matching, Yield Simulator, APMC Ticker', status: 'Telemetry Syncing', color: 'border-emerald-250 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/30' },
            { name: 'Healthcare Intelligence', desc: 'Audit ICU bed vacancy matrices and regional vector transmission rates.', capabilities: 'Outbreak Hotspots, Clinic Directory, Bookings', status: 'Online Status', color: 'border-teal-250 dark:border-teal-800/60 text-teal-950 dark:text-teal-300 bg-teal-50/90 dark:bg-teal-950/30' },
            { name: 'Hazard Intelligence', desc: 'Real-time monitoring of river gauge water levels, cyclone wind tracks, and wet-bulb indexes.', capabilities: 'Dam Release simulation, Route Planner, cooling Centers', status: 'Active Watch', color: 'border-rose-250 dark:border-rose-800/60 text-rose-950 dark:text-[#F87171] bg-rose-50/90 dark:bg-rose-950/30' },
            { name: 'Infrastructure Intelligence', desc: 'Telemetry checks on highway closures, road repair limits, and high-voltage grid substations.', capabilities: 'Bridge Strain, substation Loading, Road Quality', status: 'Telemetry Syncing', color: 'border-blue-250 dark:border-blue-800/60 text-blue-950 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/30' },
            { name: 'Economic Intelligence', desc: 'Model industrial economic zones development, budget allocations, and credit leverage margins.', capabilities: 'Growth Projection, Outlay Auditing, Job Metrics', status: 'Online Status', color: 'border-indigo-250 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/30' },
            { name: 'Education Intelligence', desc: 'Track pass percentages, infrastructure quality scores, and teacher staffing vacancies.', capabilities: 'Health Index, Staff Optimizer, Scholarship Discovery', status: 'Active Watch', color: 'border-purple-250 dark:border-purple-800/60 text-purple-950 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/30' },
            { name: 'Transport Intelligence', desc: 'Log freight rail corridor usage, bus rerouting limits, and traffic congestion patterns.', capabilities: 'GPS Dispatch, ETA Tracker, alternate Routes', status: 'Online Status', color: 'border-sky-250 dark:border-sky-800/60 text-sky-950 dark:text-sky-300 bg-sky-50/90 dark:bg-sky-950/30' },
            { name: 'Environment Intelligence', desc: 'Monitor ambient air quality thresholds, solid waste processing, and river floodplain buffers.', capabilities: 'Air Compliance, Riparian Zoning, Carbon Tracker', status: 'Active Watch', color: 'border-green-300 dark:border-green-800/60 text-green-950 dark:text-green-300 bg-green-50/90 dark:bg-green-950/30' },
            { name: 'Energy Intelligence', desc: 'Deploy net-metering solar arrays on municipal school rooftops and audit transmission stability.', capabilities: 'Substation load, Grid Balancing, Solar Grid', status: 'Telemetry Syncing', color: 'border-amber-250 dark:border-amber-800/60 text-amber-950 dark:text-[#FBBF24] bg-amber-50/90 dark:bg-amber-950/30' }
          ].map((dom, idx) => (
            <Card key={idx} className={cn("border shadow-xs p-5 flex flex-col justify-between min-h-[200px] rounded-2xl transition-all hover:scale-[1.01] hover:shadow-md", dom.color)}>
              <div>
                <h3 className="text-sm font-extrabold">{dom.name}</h3>
                <p className="text-[11px] text-slate-800 dark:text-slate-450 mt-2 leading-relaxed font-medium">
                  {dom.desc}
                </p>
                <div className="text-[10px] font-bold mt-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-900 dark:text-slate-500 block">Capabilities:</span>
                  <span className="text-slate-950 dark:text-slate-350">{dom.capabilities}</span>
                </div>
              </div>
              <div className="text-[9px] font-mono font-black uppercase mt-4 border-t border-slate-100 dark:border-slate-850 pt-2.5 flex justify-between items-center">
                <span>STATUS:</span>
                <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">● {dom.status}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* HOW IT WORKS (PIPELINE TIMELINE)           */}
      {/* ========================================== */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-12 space-y-8 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest">
          Netravaah Pipeline Workflow
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-50/50 dark:bg-[#0A1226]/40 border border-border rounded-2xl overflow-x-auto">
          {[
            { step: '1', title: 'Data Sources', desc: 'IoT sensors & GIS telemetry' },
            { step: '2', title: 'AI Models', desc: 'Predictive neural forecast' },
            { step: '3', title: 'Domain Agents', desc: 'Health/Hazards heuristic loops' },
            { step: '4', title: 'Gov Council', desc: 'Multi-agent AI consensus' },
            { step: '5', title: 'Policy RAG', desc: 'Statutory verification checking' },
            { step: '6', title: 'Executive Docs', desc: 'Report dossiers compilation' },
            { step: '7', title: 'Citizen Action', desc: 'SLA resolutions & dispatches' }
          ].map((flow, idx) => (
            <React.Fragment key={idx}>
              <div className="text-center p-3 flex-1 min-w-[120px]">
                <div className="h-8 w-8 rounded-full bg-[#0F4C81]/10 text-[#0F4C81] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37] border border-border/80 flex items-center justify-center font-bold text-xs mx-auto">
                  {flow.step}
                </div>
                <h4 className="text-[11px] font-black text-slate-950 dark:text-white mt-2 leading-tight">{flow.title}</h4>
                <p className="text-[9px] text-slate-800 dark:text-slate-500 mt-1 leading-snug">{flow.desc}</p>
              </div>
              {idx < 6 && (
                <div className="hidden md:block text-[#0F4C81] dark:text-[#D4AF37] font-black shrink-0 text-xs">
                  ➜
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* IMPACT SECTION                             */}
      {/* ========================================== */}
      <section className="max-w-5xl mx-auto px-6 md:px-8 py-12 space-y-8 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest">
          National Impact Performance
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { metric: '1.2M+', label: 'Citizens Benefitted', theme: 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-[#0F4C81] dark:text-blue-300' },
            { metric: '650+', label: 'Districts Covered', theme: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-350' },
            { metric: '250K+', label: 'Predictions Generated', theme: 'bg-purple-50/90 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-800 dark:text-purple-300' },
            { metric: '95%', label: 'Decision Accuracy', theme: 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-850 dark:text-[#E5B842]' },
            { metric: '98%', label: 'System Availability', theme: 'bg-teal-50/90 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-355' },
            { metric: '24/7', label: 'Monitoring Coverage', theme: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-350' },
            { metric: '50K+', label: 'Resolved Grievances', theme: 'bg-cyan-50/90 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/60 text-cyan-800 dark:text-cyan-350' },
            { metric: '₹142M', label: 'Scholarships Disbursed', theme: 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/60 text-orange-850 dark:text-orange-355' }
          ].map((imp, idx) => (
            <Card key={idx} className={cn("border shadow-2xs p-5 text-center space-y-1 rounded-xl transition-all hover:scale-[1.01] hover:shadow-xs", imp.theme)}>
              <h3 className="text-2xl md:text-3xl font-black font-mono">{imp.metric}</h3>
              <p className="text-[10px] uppercase font-bold tracking-wide opacity-85">{imp.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* SUCCESS STORIES                            */}
      {/* ========================================== */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-12 space-y-8 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest">
          Success Stories & Deployments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Shri G. K. Gaikwad, IAS', role: 'District Collector', loc: 'Pune Division', exp: 'The Mula River flood prediction model allowed early warning alerts. We evacuated low-lying causeway areas 12 hours before overflow, minimizing loss parameters.', img: '🏢', theme: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-250 dark:border-rose-800/60 text-rose-950 dark:text-rose-200 hover:border-rose-450 dark:hover:border-rose-500' },
            { name: 'Dr. Sunita Deshpande', role: 'Public Health Officer', loc: 'Municipal Clinic', exp: 'Vector disease outbreak forecasting flagged Ward 14 as high risk. Sanitization deployments prevented a major dengue spike, saving clinical bed reserves.', img: '🩺', theme: 'bg-teal-50/90 dark:bg-teal-950/30 border-teal-250 dark:border-teal-800/60 text-teal-950 dark:text-teal-200 hover:border-teal-450 dark:hover:border-teal-500' },
            { name: 'Shri Ramrao Patil', role: 'Agriculturalist', loc: 'Hadapsar Rural APMC', exp: 'NPK mineral matching calculations matched my soil telemetry perfectly. Subsidized drone spray allocations increased crop yield metrics by 18%.', img: '🌾', theme: 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 hover:border-emerald-450 dark:hover:border-emerald-500' }
          ].map((story, idx) => (
            <Card key={idx} className={cn("border transition-all shadow-xs p-5 flex flex-col justify-between min-h-[220px] rounded-2xl hover:scale-[1.01] hover:shadow-md", story.theme)}>
              <div className="space-y-3">
                <span className="text-[24px] select-none">{story.img}</span>
                <p className="text-xs opacity-90 leading-relaxed font-sans text-justify italic">
                  "{story.exp}"
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/20 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/60 dark:bg-black/30 border border-current/25 flex items-center justify-center font-serif font-black text-xs">
                  {story.name.charAt(story.name.indexOf(' ') + 1)}
                </div>
                <div>
                  <h4 className="text-xs font-black leading-none">{story.name}</h4>
                  <p className="text-[9px] opacity-80 mt-1 font-bold">{story.role} • {story.loc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================== */}
      {/* TRUST & SECURITY SECTIONS                  */}
      {/* ========================================== */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
        
        {/* Why Trust Netravaah */}
        <Card className="bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-800/60 shadow-xs p-6 space-y-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-md text-emerald-950 dark:text-emerald-200">
          <h3 className="text-xs uppercase font-extrabold text-emerald-900 dark:text-emerald-400 tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Why Trust Netravaah?</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-medium">
            {[
              { title: 'AI Explainability', desc: 'Every forecast renders sub-clause references.' },
              { title: 'Human Approval Layer', desc: 'Executive decisions require administrator signatures.' },
              { title: 'Statutory Compliance', desc: 'Aligned with state & federal bylaws.' },
              { title: 'Audit Trails Log', desc: 'Secure blockchain ledger tracks operations.' },
              { title: 'Multi-Agent Validation', desc: '9 sectors vote on joint directives.' },
              { title: 'Transparent Modeling', desc: 'No black-box models utilized.' }
            ].map((t, idx) => (
              <div key={idx} className="space-y-0.5">
                <h4 className="font-bold text-emerald-950 dark:text-white">{t.title}</h4>
                <p className="text-[10px] text-emerald-800/90 dark:text-emerald-350">{t.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Security Parameters */}
        <Card className="bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-250 dark:border-indigo-800/60 shadow-xs p-6 space-y-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-md text-indigo-950 dark:text-indigo-200">
          <h3 className="text-xs uppercase font-extrabold text-indigo-900 dark:text-indigo-400 tracking-widest flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
            <span>Enterprise Security Protocols</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-medium">
            {[
              { title: 'Role-Based Access (RBAC)', desc: 'District, state, and citizen clearance levels.' },
              { title: 'Secure REST APIs', desc: 'Tokens expire under consent directives.' },
              { title: 'Data Encryption', desc: 'SHA-256 digital stamps and locks.' },
              { title: 'Continuous Audits', desc: 'State infrastructure security logs active.' },
              { title: 'Compliance locks', desc: 'Fully verified under ITA-2000 code standards.' },
              { title: 'Automatic Logs backup', desc: 'Persistent local storage backup logs.' }
            ].map((s, idx) => (
              <div key={idx} className="space-y-0.5">
                <h4 className="font-bold text-indigo-950 dark:text-white">{s.title}</h4>
                <p className="text-[10px] text-indigo-800/90 dark:text-indigo-350">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>

      </section>

      {/* ========================================== */}
      {/* ROTATING REVIEWS PANEL                     */}
      {/* ========================================== */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-10 z-10 relative">
        <h2 className="text-center text-xs uppercase font-extrabold text-[#0F4C81] dark:text-[#D4AF37] tracking-widest mb-6">
          Official & Citizen Feedback
        </h2>

        <Card className="border border-border bg-slate-50/50 dark:bg-[#0A1226]/40 backdrop-blur-xs p-6 text-center space-y-4 rounded-2xl min-h-[160px] flex flex-col justify-center transition-all duration-300">
          <div className="flex justify-center gap-0.5 text-amber-500">
            {Array.from({ length: reviews[activeReviewIdx].rating }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <p className="text-xs md:text-sm text-slate-950 dark:text-slate-200 leading-relaxed font-sans font-medium max-w-2xl mx-auto italic">
            "{reviews[activeReviewIdx].feedback}"
          </p>
          <div>
            <h4 className="text-xs font-black text-slate-950 dark:text-white">{reviews[activeReviewIdx].author}</h4>
            <p className="text-[9px] text-slate-800 dark:text-slate-500 mt-1 font-bold">
              {reviews[activeReviewIdx].type} • {reviews[activeReviewIdx].location}
            </p>
          </div>
        </Card>
      </section>

      {/* ========================================== */}
      {/* CALL TO ACTION                             */}
      {/* ========================================== */}
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-16 text-center space-y-6 z-10 relative border-t border-slate-200/50 dark:border-slate-850/40">
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white">
          Ready to Explore Netravaah?
        </h2>
        <p className="text-xs text-slate-800 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
          Select your target portal level to proceed directly into telemetry streams and RAG advisory boards.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={() => {
              const authenticated = localStorage.getItem('citizen_authenticated') === 'true';
              router.push(authenticated ? '/' : '/login');
            }}
            className="px-6 py-3 bg-[#0F4C81] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span>Enter Citizen Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => router.push('/gov/login')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl border border-slate-350 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-white dark:border-slate-800 shadow-sm transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Activity className="w-4 h-4 text-[#0F4C81] dark:text-[#D4AF37]" />
            <span>Enter Government Portal</span>
          </button>

          <a
            href="#domains"
            className="px-6 py-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-900 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider no-underline"
          >
            <span>Explore Domains</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOOTER                                     */}
      {/* ========================================== */}
      <footer className="w-full bg-slate-50 dark:bg-[#0A1226]/80 border-t border-slate-200/50 dark:border-slate-850/40 py-10 z-10 relative">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StateEmblem className="w-5 h-6 text-[#0F4C81] dark:text-[#D4AF37]" />
              <span className={`${playfair.className} font-bold tracking-widest text-xs text-[#0B2342] dark:text-white`}>NETRAVAAH</span>
            </div>
            <p className="text-[10px] text-slate-800 dark:text-slate-500 font-medium leading-relaxed">
              AI-Powered Governance Operating System. Compiled under national security protocols for administrative audits.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-950 dark:text-slate-300 tracking-wider">Quick Links</h4>
            <div className="flex flex-col gap-1.5 mt-3 text-[10px] font-bold text-slate-900 dark:text-slate-400">
              <Link href="/" className="hover:underline cursor-pointer">Citizen Dashboard</Link>
              <Link href="/command-center" className="hover:underline cursor-pointer">Governance Council</Link>
              <Link href="/national-command-center" className="hover:underline cursor-pointer">National Command Center</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase font-bold text-slate-950 dark:text-slate-300 tracking-wider">Welfare & Schemes</h4>
            <div className="flex flex-col gap-1.5 mt-3 text-[10px] font-bold text-slate-900 dark:text-slate-400">
              <Link href="/policies" className="hover:underline cursor-pointer">Policies Catalog</Link>
              <Link href="/policies/search" className="hover:underline cursor-pointer">Statutory Search</Link>
              <Link href="/policies/chat" className="hover:underline cursor-pointer">RAG chatbot</Link>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase font-bold text-slate-950 dark:text-slate-300 tracking-wider">Version Information</h4>
            <p className="text-[10px] text-slate-850 dark:text-slate-500 font-bold font-mono">
              SYSTEM LEVEL: V2.6.0-PROD
            </p>
            <p className="text-[10px] text-slate-850 dark:text-slate-500 font-bold font-mono">
              DB HASH: SHA-EDN-42A9B
            </p>
          </div>

        </div>

        <div className="text-center text-[9px] text-slate-800 dark:text-slate-600 font-bold mt-8 border-t border-slate-200/40 dark:border-slate-850/40 pt-6">
          © 2026 NETRAVAAH • GOVERNMENT OPERATIONS COMMAND • ALL DATA CLASSIFIED SECURED
        </div>
      </footer>

    </div>
  );
}
