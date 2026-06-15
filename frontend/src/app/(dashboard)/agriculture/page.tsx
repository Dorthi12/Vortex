'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sprout, 
  TrendingUp, 
  Gauge, 
  Leaf, 
  Droplet, 
  DollarSign, 
  AlertTriangle, 
  Bug, 
  Sparkles, 
  Clock, 
  FileText, 
  ShieldAlert, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  ClipboardList, 
  CloudSun, 
  Calendar, 
  Coins, 
  Settings,
  ChevronRight,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertOctagon,
  X,
  ShieldCheck,
  User
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OfficialContact {
  name: string;
  role: string;
  phone: string;
  type: 'Chief' | 'Lab Specialist' | 'Field Agent';
}

interface FeatureItem {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  status: 'Active' | 'AI Ready' | 'Monitoring' | 'Live' | 'Government Verified';
  stat: string;
  department: string;
  primaryPhone: string;
  officersCount: number;
  contacts: OfficialContact[];
  // Solid color tokens for bright mode & dark mode
  colorClasses: {
    lightBg: string;
    darkBg: string;
    lightBorder: string;
    darkBorder: string;
    accentColor: string;
    badgeStyle: string;
    badgeStyleDark: string;
  };
}

const FEATURE_GRID_ITEMS: FeatureItem[] = [
  { 
    name: 'Crop Recommendation', 
    description: 'Optimal crop matching based on NPK sensors and pH levels.', 
    href: '/agriculture/recommendation', 
    icon: Sprout, 
    status: 'AI Ready', 
    stat: '98% Model Accuracy',
    department: 'Crop Yield & Planning',
    primaryPhone: '+91 20 2560 4103',
    officersCount: 18,
    contacts: [
      { name: 'Smt. Asha Deshmukh', role: 'Director of Agronomy', phone: '+91 20 2560 4103', type: 'Chief' },
      { name: 'Shri Manoj Patil', role: 'Block Extension Officer', phone: '+91 20 2560 4123', type: 'Field Agent' },
      { name: 'Dr. Sanjay Mehta', role: 'Crop Suitability Analyst', phone: '+91 20 2560 4143', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-emerald-50/90',
      darkBg: 'dark:bg-[#071F15]',
      lightBorder: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-500/30',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      badgeStyle: 'bg-emerald-200/80 text-emerald-800 border-emerald-300',
      badgeStyleDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    }
  },
  { 
    name: 'Yield Prediction', 
    description: 'Forecast harvest volume outputs utilizing soil and climate variables.', 
    href: '/agriculture/yield', 
    icon: TrendingUp, 
    status: 'Active', 
    stat: '120K Predictions',
    department: 'Crop Yield & Planning',
    primaryPhone: '+91 20 2560 4103',
    officersCount: 18,
    contacts: [
      { name: 'Smt. Asha Deshmukh', role: 'Director of Agronomy', phone: '+91 20 2560 4103', type: 'Chief' },
      { name: 'Shri Rahul Joshi', role: 'Yield Forecasting Analyst', phone: '+91 20 2560 4113', type: 'Lab Specialist' },
      { name: 'Shri Manoj Patil', role: 'Block Extension Officer', phone: '+91 20 2560 4123', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-blue-50/95',
      darkBg: 'dark:bg-[#0B1530]',
      lightBorder: 'border-blue-300',
      darkBorder: 'dark:border-blue-500/30',
      accentColor: 'text-blue-700 dark:text-blue-450',
      badgeStyle: 'bg-blue-200/80 text-blue-800 border-blue-300',
      badgeStyleDark: 'dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
    }
  },
  { 
    name: 'Soil Health Intelligence', 
    description: 'Real-time soil grade, organic carbon and nutrient indexes.', 
    href: '/agriculture/soil', 
    icon: Gauge, 
    status: 'Live', 
    stat: '50K Farmers Assisted',
    department: 'Soil & Fertilizers',
    primaryPhone: '+91 20 2560 4102',
    officersCount: 14,
    contacts: [
      { name: 'Dr. Ramesh Kurien', role: 'Chief Soil Scientist', phone: '+91 20 2560 4102', type: 'Chief' },
      { name: 'Shri Sanjay Mehta', role: 'Soil Testing Lab Lead', phone: '+91 20 2560 4112', type: 'Lab Specialist' },
      { name: 'Kumari Divya Nair', role: 'Soil Sample Field Inspector', phone: '+91 20 2560 4122', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-indigo-50/95',
      darkBg: 'dark:bg-[#110e2e]',
      lightBorder: 'border-indigo-300',
      darkBorder: 'dark:border-indigo-500/30',
      accentColor: 'text-indigo-700 dark:text-indigo-400',
      badgeStyle: 'bg-indigo-200/80 text-indigo-800 border-indigo-300',
      badgeStyleDark: 'dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
    }
  },
  { 
    name: 'Fertilizer Advisor', 
    description: 'NPK mineral deficiency calculations and organic schedules.', 
    href: '/agriculture/fertilizer', 
    icon: Leaf, 
    status: 'Government Verified', 
    stat: 'Certified Dosages',
    department: 'Soil & Fertilizers',
    primaryPhone: '+91 20 2560 4102',
    officersCount: 14,
    contacts: [
      { name: 'Dr. Ramesh Kurien', role: 'Chief Soil Scientist', phone: '+91 20 2560 4102', type: 'Chief' },
      { name: 'Shri Sanjay Mehta', role: 'Soil Testing Lab Lead', phone: '+91 20 2560 4112', type: 'Lab Specialist' },
      { name: 'Kumari Divya Nair', role: 'Soil Sample Field Inspector', phone: '+91 20 2560 4122', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-teal-50/95',
      darkBg: 'dark:bg-[#051e24]',
      lightBorder: 'border-teal-300',
      darkBorder: 'dark:border-teal-500/30',
      accentColor: 'text-teal-700 dark:text-teal-400',
      badgeStyle: 'bg-teal-200/80 text-teal-850 border-teal-300',
      badgeStyleDark: 'dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20'
    }
  },
  // Row 2
  { 
    name: 'Irrigation Forecast', 
    description: 'Weather-adjusted irrigation intervals to mitigate water stress.', 
    href: '/agriculture/irrigation', 
    icon: Droplet, 
    status: 'Monitoring', 
    stat: '14mm Rain Forecast',
    department: 'Plant Protection',
    primaryPhone: '+91 20 2560 4104',
    officersCount: 22,
    contacts: [
      { name: 'Dr. Vikram Patil', role: 'Chief Entomologist', phone: '+91 20 2560 4104', type: 'Chief' },
      { name: 'Shri Amit Kulkarni', role: 'Irrigation Inspector', phone: '+91 20 2560 4124', type: 'Field Agent' },
      { name: 'Dr. Swati Sen', role: 'Plant Pathologist Expert', phone: '+91 20 2560 4114', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-cyan-55/95',
      darkBg: 'dark:bg-[#031d30]',
      lightBorder: 'border-cyan-300',
      darkBorder: 'dark:border-cyan-500/30',
      accentColor: 'text-cyan-750 dark:text-cyan-400',
      badgeStyle: 'bg-cyan-200/80 text-cyan-850 border-cyan-300',
      badgeStyleDark: 'dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20'
    }
  },
  { 
    name: 'Market Intelligence', 
    description: 'Monitor wholesale Mandi pricing indexes and price trends.', 
    href: '/agriculture/market', 
    icon: DollarSign, 
    status: 'Live', 
    stat: 'Stable Price Corridor',
    department: 'Markets & Credit',
    primaryPhone: '+91 20 2560 4105',
    officersCount: 11,
    contacts: [
      { name: 'Shri Anil Gokhale', role: 'Agricultural Commissioner', phone: '+91 20 2560 4105', type: 'Chief' },
      { name: 'Shri Vinod Rane', role: 'Mandi Procurement Officer', phone: '+91 20 2560 4125', type: 'Field Agent' },
      { name: 'Smt. Rekha Sharma', role: 'Credit Schemes Manager', phone: '+91 20 2560 4115', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-emerald-55/95',
      darkBg: 'dark:bg-[#022016]',
      lightBorder: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-500/30',
      accentColor: 'text-emerald-750 dark:text-emerald-400',
      badgeStyle: 'bg-emerald-200/80 text-emerald-900 border-emerald-300',
      badgeStyleDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    }
  },
  { 
    name: 'Disease Detection', 
    description: 'Classify foliage pathogens using computer vision scanners.', 
    href: '/agriculture/disease', 
    icon: AlertTriangle, 
    status: 'AI Ready', 
    stat: '94% Classifier Match',
    department: 'Plant Protection',
    primaryPhone: '+91 20 2560 4104',
    officersCount: 22,
    contacts: [
      { name: 'Dr. Vikram Patil', role: 'Chief Entomologist', phone: '+91 20 2560 4104', type: 'Chief' },
      { name: 'Dr. Swati Sen', role: 'Plant Pathologist Expert', phone: '+91 20 2560 4114', type: 'Lab Specialist' },
      { name: 'Shri Amit Kulkarni', role: 'Irrigation Inspector', phone: '+91 20 2560 4124', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-rose-50/95',
      darkBg: 'dark:bg-[#2a080c]',
      lightBorder: 'border-rose-300',
      darkBorder: 'dark:border-red-500/30',
      accentColor: 'text-red-700 dark:text-red-400',
      badgeStyle: 'bg-rose-200/80 text-red-900 border-rose-300',
      badgeStyleDark: 'dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
    }
  },
  { 
    name: 'Pest Detection', 
    description: 'Identify insect infestation risks and IPM suppression plans.', 
    href: '/agriculture/pests', 
    icon: Bug, 
    status: 'Active', 
    stat: 'Pyrilla Risk Alert',
    department: 'Plant Protection',
    primaryPhone: '+91 20 2560 4104',
    officersCount: 22,
    contacts: [
      { name: 'Dr. Vikram Patil', role: 'Chief Entomologist', phone: '+91 20 2560 4104', type: 'Chief' },
      { name: 'Dr. Swati Sen', role: 'Plant Pathologist Expert', phone: '+91 20 2560 4114', type: 'Lab Specialist' },
      { name: 'Shri Amit Kulkarni', role: 'Irrigation Inspector', phone: '+91 20 2560 4124', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-orange-50/95',
      darkBg: 'dark:bg-[#2a1308]',
      lightBorder: 'border-orange-300',
      darkBorder: 'dark:border-orange-500/30',
      accentColor: 'text-orange-700 dark:text-orange-400',
      badgeStyle: 'bg-orange-200/80 text-orange-900 border-orange-300',
      badgeStyleDark: 'dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
    }
  },
  // Row 3
  { 
    name: 'Nutrient Deficiency Detection', 
    description: 'Identify leaf mineral deficiencies using spectral scans.', 
    href: '/agriculture/nutrient', 
    icon: Sparkles, 
    status: 'AI Ready', 
    stat: '92% Model Match',
    department: 'Soil & Fertilizers',
    primaryPhone: '+91 20 2560 4102',
    officersCount: 14,
    contacts: [
      { name: 'Dr. Ramesh Kurien', role: 'Chief Soil Scientist', phone: '+91 20 2560 4102', type: 'Chief' },
      { name: 'Shri Sanjay Mehta', role: 'Soil Testing Lab Lead', phone: '+91 20 2560 4112', type: 'Lab Specialist' },
      { name: 'Kumari Divya Nair', role: 'Soil Sample Field Inspector', phone: '+91 20 2560 4122', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-violet-50/95',
      darkBg: 'dark:bg-[#1a082a]',
      lightBorder: 'border-violet-300',
      darkBorder: 'dark:border-violet-500/30',
      accentColor: 'text-violet-700 dark:text-violet-400',
      badgeStyle: 'bg-violet-200/80 text-violet-900 border-violet-300',
      badgeStyleDark: 'dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20'
    }
  },
  { 
    name: 'Growth Stage Detection', 
    description: 'Detect crop phenology stage and estimated maturity calendars.', 
    href: '/agriculture/growth-stage', 
    icon: Clock, 
    status: 'Monitoring', 
    stat: 'Elongation Phase',
    department: 'Crop Yield & Planning',
    primaryPhone: '+91 20 2560 4103',
    officersCount: 18,
    contacts: [
      { name: 'Smt. Asha Deshmukh', role: 'Director of Agronomy', phone: '+91 20 2560 4103', type: 'Chief' },
      { name: 'Shri Rahul Joshi', role: 'Yield Forecasting Analyst', phone: '+91 20 2560 4113', type: 'Lab Specialist' },
      { name: 'Shri Manoj Patil', role: 'Block Extension Officer', phone: '+91 20 2560 4123', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-sky-50/95',
      darkBg: 'dark:bg-[#071d2b]',
      lightBorder: 'border-sky-300',
      darkBorder: 'dark:border-sky-500/30',
      accentColor: 'text-sky-700 dark:text-sky-400',
      badgeStyle: 'bg-sky-200/80 text-sky-900 border-sky-300',
      badgeStyleDark: 'dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20'
    }
  },
  { 
    name: 'Subsidy Advisor', 
    description: 'Welfare eligibility evaluations and custom hiring credits.', 
    href: '/agriculture/subsidies', 
    icon: FileText, 
    status: 'Government Verified', 
    stat: '₹45,000 Average Claim',
    department: 'Markets & Credit',
    primaryPhone: '+91 20 2560 4105',
    officersCount: 11,
    contacts: [
      { name: 'Shri Anil Gokhale', role: 'Agricultural Commissioner', phone: '+91 20 2560 4105', type: 'Chief' },
      { name: 'Smt. Rekha Sharma', role: 'Credit Schemes Manager', phone: '+91 20 2560 4115', type: 'Lab Specialist' },
      { name: 'Shri Vinod Rane', role: 'Mandi Procurement Officer', phone: '+91 20 2560 4125', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-purple-50/95',
      darkBg: 'dark:bg-[#1d0a2b]',
      lightBorder: 'border-purple-300',
      darkBorder: 'dark:border-purple-500/30',
      accentColor: 'text-purple-700 dark:text-purple-400',
      badgeStyle: 'bg-purple-200/80 text-purple-900 border-purple-300',
      badgeStyleDark: 'dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
    }
  },
  { 
    name: 'Agricultural Risk Engine', 
    description: 'Composite threat analysis of weather, pests and yields.', 
    href: '/agriculture/risk', 
    icon: ShieldAlert, 
    status: 'Live', 
    stat: '26/100 Low Risk',
    department: 'Weather & Risk',
    primaryPhone: '+91 20 2560 4106',
    officersCount: 9,
    contacts: [
      { name: 'Smt. Priya Nair', role: 'Disaster Mitigation Lead', phone: '+91 20 2560 4106', type: 'Chief' },
      { name: 'Kumari Ananya Sen', role: 'Insurance Claims Agent', phone: '+91 20 2560 4126', type: 'Field Agent' },
      { name: 'Shri Devendra Singh', role: 'Meteorology Data Expert', phone: '+91 20 2560 4116', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-rose-50/95',
      darkBg: 'dark:bg-[#2b0711]',
      lightBorder: 'border-rose-300',
      darkBorder: 'dark:border-rose-500/30',
      accentColor: 'text-rose-700 dark:text-rose-400',
      badgeStyle: 'bg-rose-200/80 text-rose-950 border-rose-300',
      badgeStyleDark: 'dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20'
    }
  },
  // Row 4
  { 
    name: 'Farmer Assistant (RAG)', 
    description: 'Text and voice chat advisor synced with agriculture manuals.', 
    href: '/agriculture/assistant', 
    icon: MessageSquare, 
    status: 'AI Ready', 
    stat: 'Instant Policy Search',
    department: 'Support & Advisory',
    primaryPhone: '+91 20 2560 4107',
    officersCount: 15,
    contacts: [
      { name: 'Shri Rajesh Shinde', role: 'IT Support Lead', phone: '+91 20 2560 4107', type: 'Chief' },
      { name: 'Shri Sunil Rao', role: 'Public Relations Officer', phone: '+91 20 2560 4127', type: 'Field Agent' },
      { name: 'AI Bot Assistant Netra', role: '24/7 Virtual Assistant', phone: '+91 20 2560 4117', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-pink-50/95',
      darkBg: 'dark:bg-[#2b0722]',
      lightBorder: 'border-pink-300',
      darkBorder: 'dark:border-pink-500/30',
      accentColor: 'text-pink-700 dark:text-pink-400',
      badgeStyle: 'bg-pink-200/80 text-pink-900 border-pink-300',
      badgeStyleDark: 'dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20'
    }
  },
  { 
    name: 'Advisory Agent', 
    description: 'Generate all-in-one compiled AI advisory dossiers.', 
    href: '/agriculture/advisory', 
    icon: Bot, 
    status: 'AI Ready', 
    stat: 'Dossier PDF Export',
    department: 'Support & Advisory',
    primaryPhone: '+91 20 2560 4107',
    officersCount: 15,
    contacts: [
      { name: 'Shri Rajesh Shinde', role: 'IT Support Lead', phone: '+91 20 2560 4107', type: 'Chief' },
      { name: 'Shri Sunil Rao', role: 'Public Relations Officer', phone: '+91 20 2560 4127', type: 'Field Agent' },
      { name: 'AI Bot Assistant Netra', role: '24/7 Virtual Assistant', phone: '+91 20 2560 4117', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-fuchsia-50/95',
      darkBg: 'dark:bg-[#24052a]',
      lightBorder: 'border-fuchsia-300',
      darkBorder: 'dark:border-fuchsia-500/30',
      accentColor: 'text-fuchsia-700 dark:text-fuchsia-400',
      badgeStyle: 'bg-fuchsia-200/80 text-fuchsia-900 border-fuchsia-300',
      badgeStyleDark: 'dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20'
    }
  },
  { 
    name: 'Analytics', 
    description: 'District adoption statistics, yield trends, and pathogen counts.', 
    href: '/agriculture/analytics', 
    icon: BarChart3, 
    status: 'Live', 
    stat: '5 Core SVG Reports',
    department: 'Support & Advisory',
    primaryPhone: '+91 20 2560 4107',
    officersCount: 15,
    contacts: [
      { name: 'Shri Rajesh Shinde', role: 'IT Support Lead', phone: '+91 20 2560 4107', type: 'Chief' },
      { name: 'Shri Sunil Rao', role: 'Public Relations Officer', phone: '+91 20 2560 4127', type: 'Field Agent' },
      { name: 'AI Bot Assistant Netra', role: '24/7 Virtual Assistant', phone: '+91 20 2560 4117', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-lime-50/95',
      darkBg: 'dark:bg-[#0f2405]',
      lightBorder: 'border-lime-300',
      darkBorder: 'dark:border-lime-500/25',
      accentColor: 'text-lime-700 dark:text-lime-400',
      badgeStyle: 'bg-lime-200/80 text-lime-900 border-lime-300',
      badgeStyleDark: 'dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20'
    }
  },
  { 
    name: 'Reports', 
    description: 'Downloadable seasonal summaries and district telemetry logs.', 
    href: '/agriculture/reports', 
    icon: ClipboardList, 
    status: 'Active', 
    stat: 'PDF Compiler ready',
    department: 'Support & Advisory',
    primaryPhone: '+91 20 2560 4107',
    officersCount: 15,
    contacts: [
      { name: 'Shri Rajesh Shinde', role: 'IT Support Lead', phone: '+91 20 2560 4107', type: 'Chief' },
      { name: 'Shri Sunil Rao', role: 'Public Relations Officer', phone: '+91 20 2560 4127', type: 'Field Agent' },
      { name: 'AI Bot Assistant Netra', role: '24/7 Virtual Assistant', phone: '+91 20 2560 4117', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-emerald-100/80',
      darkBg: 'dark:bg-[#022005]',
      lightBorder: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-500/25',
      accentColor: 'text-emerald-700 dark:text-emerald-450',
      badgeStyle: 'bg-emerald-200/90 text-emerald-950 border-emerald-300',
      badgeStyleDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    }
  },
  // Row 5
  { 
    name: 'Weather Intelligence', 
    description: 'Micro-climate monitoring, evaporation rates, and frost alarms.', 
    href: '/agriculture/weather', 
    icon: CloudSun, 
    status: 'Monitoring', 
    stat: 'Scattered Showers',
    department: 'Weather & Risk',
    primaryPhone: '+91 20 2560 4106',
    officersCount: 9,
    contacts: [
      { name: 'Smt. Priya Nair', role: 'Disaster Mitigation Lead', phone: '+91 20 2560 4106', type: 'Chief' },
      { name: 'Shri Devendra Singh', role: 'Meteorology Data Expert', phone: '+91 20 2560 4116', type: 'Lab Specialist' },
      { name: 'Kumari Ananya Sen', role: 'Insurance Claims Agent', phone: '+91 20 2560 4126', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-amber-50/95',
      darkBg: 'dark:bg-[#221c05]',
      lightBorder: 'border-amber-300',
      darkBorder: 'dark:border-amber-500/25',
      accentColor: 'text-amber-705 dark:text-amber-400',
      badgeStyle: 'bg-amber-200/80 text-amber-900 border-amber-300',
      badgeStyleDark: 'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
    }
  },
  { 
    name: 'Harvest Window Prediction', 
    description: 'Forecast the optimal dates to execute crop harvesting.', 
    href: '/agriculture/harvest-window', 
    icon: Calendar, 
    status: 'AI Ready', 
    stat: 'sucrose peak match',
    department: 'Crop Yield & Planning',
    primaryPhone: '+91 20 2560 4103',
    officersCount: 18,
    contacts: [
      { name: 'Smt. Asha Deshmukh', role: 'Director of Agronomy', phone: '+91 20 2560 4103', type: 'Chief' },
      { name: 'Shri Manoj Patil', role: 'Block Extension Officer', phone: '+91 20 2560 4123', type: 'Field Agent' },
      { name: 'Dr. Sanjay Mehta', role: 'Crop Suitability Analyst', phone: '+91 20 2560 4143', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-orange-50/95',
      darkBg: 'dark:bg-[#281205]',
      lightBorder: 'border-orange-300',
      darkBorder: 'dark:border-orange-500/25',
      accentColor: 'text-orange-700 dark:text-orange-400',
      badgeStyle: 'bg-orange-200/80 text-orange-950 border-orange-300',
      badgeStyleDark: 'dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
    }
  },
  { 
    name: 'Farmer Credit Risk', 
    description: 'Evaluate crop loan caps and interest subsidy allocations.', 
    href: '/agriculture/credit-risk', 
    icon: Coins, 
    status: 'Government Verified', 
    stat: 'Low Risk rating',
    department: 'Markets & Credit',
    primaryPhone: '+91 20 2560 4105',
    officersCount: 11,
    contacts: [
      { name: 'Shri Anil Gokhale', role: 'Agricultural Commissioner', phone: '+91 20 2560 4105', type: 'Chief' },
      { name: 'Smt. Rekha Sharma', role: 'Credit Schemes Manager', phone: '+91 20 2560 4115', type: 'Lab Specialist' },
      { name: 'Shri Vinod Rane', role: 'Mandi Procurement Officer', phone: '+91 20 2560 4125', type: 'Field Agent' }
    ],
    colorClasses: {
      lightBg: 'bg-emerald-50/95',
      darkBg: 'dark:bg-[#022011]',
      lightBorder: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-500/25',
      accentColor: 'text-emerald-700 dark:text-emerald-400',
      badgeStyle: 'bg-emerald-200/80 text-emerald-950 border-emerald-300',
      badgeStyleDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    }
  },
  { 
    name: 'Settings', 
    description: 'Configure preferred languages, notification channels, and zones.', 
    href: '/agriculture/settings', 
    icon: Settings, 
    status: 'Live', 
    stat: '6 Languages',
    department: 'Support & Advisory',
    primaryPhone: '+91 20 2560 4107',
    officersCount: 15,
    contacts: [
      { name: 'Shri Rajesh Shinde', role: 'IT Support Lead', phone: '+91 20 2560 4107', type: 'Chief' },
      { name: 'Shri Sunil Rao', role: 'Public Relations Officer', phone: '+91 20 2560 4127', type: 'Field Agent' },
      { name: 'AI Bot Assistant Netra', role: '24/7 Virtual Assistant', phone: '+91 20 2560 4117', type: 'Lab Specialist' }
    ],
    colorClasses: {
      lightBg: 'bg-slate-100/90',
      darkBg: 'dark:bg-[#1c222c]',
      lightBorder: 'border-slate-300',
      darkBorder: 'dark:border-slate-500/25',
      accentColor: 'text-slate-700 dark:text-slate-450',
      badgeStyle: 'bg-slate-200/85 text-slate-800 border-slate-300',
      badgeStyleDark: 'dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
    }
  }
];

export default function AgricultureLanding() {
  // Call facility / complaint modal state
  const [activeHotline, setActiveHotline] = useState<FeatureItem | null>(null);

  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [activeCallNumber, setActiveCallNumber] = useState<string>('');
  const [activeCallName, setActiveCallName] = useState<string>('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const handleOpenHotline = (e: React.MouseEvent, item: FeatureItem) => {
    e.preventDefault(); // Prevent page redirect on link click
    e.stopPropagation();
    setActiveHotline(item);
    setCallState('idle');
    setShowComplaintForm(false);
    setComplaintSubmitted(false);
    setComplaintTitle('');
    setComplaintDesc('');
  };

  const startHotlineCall = (number: string, name: string) => {
    setActiveCallNumber(number);
    setActiveCallName(name);
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 1500);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;
    setComplaintSubmitted(true);
    setTimeout(() => {
      setShowComplaintForm(false);
      setActiveHotline(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 min-h-screen bg-[#F8FAFC] dark:bg-[#070D1A] p-2 text-slate-900 dark:text-[#F8FAFC] transition-colors duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 dark:border-[#D4AF37]/20 p-6 md:p-8 bg-gradient-to-br from-emerald-500/5 via-white to-blue-500/5 dark:from-[#081F15] dark:via-[#0A1228] dark:to-[#0D1B2A] shadow-md transition-all">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3a8a] dark:text-[#D4AF37]">
              Ministry of Agriculture Digital EOC
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Agriculture Intelligence Department
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed max-w-3xl font-black">
            AI-powered crop planning, yield forecasting, soil diagnostics, disease monitoring, subsidy intelligence, market forecasting and agricultural decision support.
          </p>
        </div>

        {/* Animated KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
          {[
            { label: 'Farmers Assisted', val: '1.42 M+', sub: 'Active Registry' },
            { label: 'Predictions Generated', val: '120 K', sub: 'Calculations run' },
            { label: 'Disease Scans', val: '50 K', sub: 'Pathogens matched' },
            { label: 'Active Advisories', val: '1,240', sub: 'Dispatched today' },
            { label: 'Government Schemes', val: '3 Schemes', sub: 'Subsidies active' },
            { label: 'Market Insights', val: 'Stable', sub: 'Mandi price corridor' }
          ].map((kpi, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              className="bg-white dark:bg-[#0B1530] p-4 rounded-xl border border-slate-200 dark:border-[#1A2744] shadow-sm flex flex-col justify-between min-h-[95px] transition-all"
            >
              <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-450">{kpi.label}</span>
              <span className="text-lg font-black text-slate-900 dark:text-[#D4AF37] mt-1">{kpi.val}</span>
              <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black mt-1">{kpi.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACCESS ACTION TOOLBAR                                            */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-655 dark:text-slate-400">Quick Access Tools</h3>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/agriculture/recommendation">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Recommend Crop
            </Button>
          </Link>
          <Link href="/agriculture/yield">
            <Button size="sm" className="bg-[#1e3a8a] dark:bg-[#1C39BB] hover:bg-blue-800 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Predict Yield
            </Button>
          </Link>
          <Link href="/agriculture/disease">
            <Button size="sm" className="bg-red-650 hover:bg-red-700 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Scan Disease
            </Button>
          </Link>
          <Link href="/agriculture/pests">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Detect Pest
            </Button>
          </Link>
          <Link href="/agriculture/subsidies">
            <Button size="sm" className="bg-purple-650 hover:bg-purple-700 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Check Subsidies
            </Button>
          </Link>
          <Link href="/agriculture/market">
            <Button size="sm" className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Market Forecast
            </Button>
          </Link>
          <Link href="/agriculture/assistant">
            <Button size="sm" className="bg-[#D4AF37] hover:bg-yellow-600 text-slate-900 font-bold text-xs py-2 px-3.5 h-9 cursor-pointer shadow-sm active:scale-95 transition-all">
              Ask Agriculture AI
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 20 FEATURE GRID SECTION                                                */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-655 dark:text-slate-400">Agriculture AI capabilities</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURE_GRID_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            
            return (
              <Link href={item.href} key={item.name} className="block group">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  whileHover={{ 
                    y: -5, 
                    boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.1)',
                  }}
                  className={cn(
                    "h-full rounded-2xl p-5 flex flex-col justify-between min-h-[250px] transition-all relative overflow-hidden shadow-sm border",
                    item.colorClasses.lightBg,
                    item.colorClasses.darkBg,
                    item.colorClasses.lightBorder,
                    item.colorClasses.darkBorder
                  )}
                >
                  {/* Top color indicator border */}
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-900/10 dark:bg-white/10" />
                  
                  <div className="space-y-3.5">
                    {/* Icon + Status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#070D1A] border border-slate-350 dark:border-emerald-500/20 flex items-center justify-center text-slate-900 dark:text-[#D4AF37] shrink-0 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm">
                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </div>
                      
                      <span className={cn('text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 shadow-2xs', item.colorClasses.badgeStyle, item.colorClasses.badgeStyleDark)}>
                        {item.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-slate-950 dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-[#D4AF37] transition-colors leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed font-black">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer metadata with Call Escalation Button */}
                  <div className="border-t border-slate-300 dark:border-[#1A2744] pt-3.5 mt-4 flex flex-col gap-2">
                    {/* Primary Department & Phone Display */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-900 dark:text-slate-400 bg-white/50 dark:bg-black/10 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                      <span className="truncate max-w-[110px]">{item.department}</span>
                      <span className="font-mono text-slate-950 dark:text-white">{item.primaryPhone}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-slate-950 dark:text-slate-400 italic block truncate max-w-[120px]">
                        {item.stat}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Calling facility trigger */}
                        <button
                          onClick={(e) => handleOpenHotline(e, item)}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-emerald-500/25 hover:border-slate-500 bg-white dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors shadow-xs cursor-pointer flex items-center gap-1 font-bold text-[9px]"
                          title="Call Escalation Options / Submit Complaint"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Call Office
                        </button>

                        <span className="text-[10px] font-black text-slate-900 dark:text-[#D4AF37] flex items-center gap-0.5 group-hover:gap-1.5 transition-all uppercase tracking-wide">
                          Open
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DIALER & COMPLAINT DIRECTORY MODAL                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeHotline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveHotline(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0A1228] border border-slate-300 dark:border-[#1A2744] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 p-6 text-slate-950 dark:text-slate-200"
            >
              <button 
                onClick={() => setActiveHotline(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-950 dark:hover:text-white p-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                    {activeHotline.department} • Direct Directory
                  </span>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">
                    Hotline Contact Options
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 leading-relaxed font-bold">
                    Select a contact option below to call or escalate issues regarding <b>{activeHotline.name}</b>.
                  </p>
                </div>

                {/* Simulated Dialer */}
                {callState !== 'idle' ? (
                  <div className="p-6 rounded-xl bg-slate-950 text-white text-center space-y-4 shadow-inner">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 animate-pulse">
                      <Phone className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {callState === 'calling' ? 'CONNECTING HOTLINE...' : 'CONNECTED VIA VOIP'}
                      </span>
                      <h4 className="text-lg font-bold mt-1 text-[#D4AF37] font-mono">{activeCallNumber}</h4>
                      <p className="text-[10px] text-slate-450 mt-1">Connecting to <b>{activeCallName}</b>...</p>
                    </div>
                    <Button 
                      onClick={() => setCallState('idle')}
                      className="bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-5 py-1.5 h-8 mt-2 mx-auto cursor-pointer active:scale-95 transition-all"
                    >
                      Disconnect Call
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Contacts options list */}
                    {!showComplaintForm && (
                      <div className="space-y-3.5">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                          Select Available Contacts to Refer to for Help:
                        </span>
                        
                        <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                          {activeHotline.contacts.map((contact, idx) => (
                            <div 
                              key={idx}
                              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3 hover:border-slate-400 dark:hover:border-emerald-500/30 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-emerald-950/30 flex items-center justify-center border border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-400 shrink-0">
                                  {contact.type === 'Chief' ? <ShieldCheck className="w-4.5 h-4.5 text-amber-500" /> : <User className="w-4.5 h-4.5" />}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-955 dark:text-white leading-tight">
                                    {contact.name}
                                  </h4>
                                  <span className="text-[9px] text-slate-605 dark:text-slate-450 block font-semibold">
                                    {contact.role} • <span className="font-mono">{contact.phone}</span>
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => startHotlineCall(contact.phone, contact.name)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                              >
                                <Phone className="w-3 h-3" />
                                Call
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold">
                            Total officers on call duty: <b>{activeHotline.officersCount}</b>
                          </span>
                          <button
                            onClick={() => setShowComplaintForm(true)}
                            className="text-[10px] font-black text-red-650 hover:text-red-750 flex items-center gap-1 cursor-pointer"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" /> File Official Complaint
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Complaint form */}
                {showComplaintForm && !complaintSubmitted && (
                  <form onSubmit={handleComplaintSubmit} className="space-y-4 border-t border-slate-150 dark:border-slate-850 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        Complaint Title
                      </label>
                      <input
                        type="text"
                        required
                        value={complaintTitle}
                        onChange={e => setComplaintTitle(e.target.value)}
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        placeholder="e.g. Inaccurate soil moisture reading in ward 4"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                        Complaint Details / Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={complaintDesc}
                        onChange={e => setComplaintDesc(e.target.value)}
                        className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-bold"
                        placeholder="Describe the issue in detail to assist the duty officers..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowComplaintForm(false)}
                        className="text-xs h-9 cursor-pointer"
                      >
                        Back to Directory
                      </Button>
                      <Button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 cursor-pointer"
                      >
                        Submit Complaint
                      </Button>
                    </div>
                  </form>
                )}

                {/* Complaint Submission Success */}
                {complaintSubmitted && (
                  <div className="p-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center space-y-3 animate-in zoom-in-95 duration-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-450">Complaint Logged Successfully</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                        Ticket assigned to central queue. Dispatching to duty officers on standby.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
