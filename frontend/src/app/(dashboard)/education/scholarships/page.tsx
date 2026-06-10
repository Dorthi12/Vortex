'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  Coins, 
  FileText, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface ScholarshipScheme {
  id: string;
  name: string;
  category: 'Merit Based' | 'Need Based' | 'Minority' | 'Girls Education' | 'Sports' | 'Higher Education';
  reward: string;
  deadline: string;
  minMarks: number;
  maxIncome: number; // annual
  documents: string[];
}

const SCHOLARSHIPS_POOL: ScholarshipScheme[] = [
  {
    id: 'sch-scheme-1',
    name: 'National Merit-cum-Means Scholarship Directive',
    category: 'Need Based',
    reward: '₹24,000 / Year',
    deadline: '15 Aug 2026',
    minMarks: 65,
    maxIncome: 300000,
    documents: ['Income Certificate', 'Previous Year Marksheet', 'School Enrollment Proof']
  },
  {
    id: 'sch-scheme-2',
    name: 'Pragati Scholarship for Girls in Technology',
    category: 'Girls Education',
    reward: '₹50,000 / Year',
    deadline: '31 Aug 2026',
    minMarks: 70,
    maxIncome: 800000,
    documents: ['Aadhaar Card', 'Admission Receipt', 'Self Declaration Affirmation']
  },
  {
    id: 'sch-scheme-3',
    name: 'State Outstanding Sports Excellence Grant',
    category: 'Sports',
    reward: '₹35,000 / Year',
    deadline: '10 Sep 2026',
    minMarks: 50,
    maxIncome: 600000,
    documents: ['Sports Achievement Certificate', 'School Bonafide', 'Aadhaar Card']
  },
  {
    id: 'sch-scheme-4',
    name: 'Dr. Ambedkar Post-Matric Minority Scheme',
    category: 'Minority',
    reward: '₹18,000 / Year',
    deadline: '05 Oct 2026',
    minMarks: 60,
    maxIncome: 250000,
    documents: ['Community Caste Certificate', 'Income Statement', 'Marksheet']
  }
];

export default function ScholarshipsPage() {
  const { setActiveTab } = useUiStore();

  // Checker inputs
  const [marks, setMarks] = useState<number>(75);
  const [income, setIncome] = useState<number>(240000);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  // Filter scholarships based on marks, income, and category
  const filteredSchemes = useMemo(() => {
    return SCHOLARSHIPS_POOL.filter(scheme => {
      const marksMatch = marks >= scheme.minMarks;
      const incomeMatch = income <= scheme.maxIncome;
      const catMatch = selectedCategory === 'All' || scheme.category === selectedCategory;
      return marksMatch && incomeMatch && catMatch;
    });
  }, [marks, income, selectedCategory]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Scholarship Intelligence System" 
        subtitle="Match academic profiles with federal and state scholarship directories, auditing eligibility parameters in real-time."
      />

      {/* 1. Split Layout: Eligibility Checker & Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Eligibility Calculator (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4.5 h-4.5 text-edu-purple" />
                <span>Eligibility Parameters Check</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-4">
              
              {/* Previous Marks slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Previous Academic Marks %</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">{marks}%</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

              {/* Annual Income slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Annual Family Income Bracket</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">₹{income.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="25000"
                  value={income}
                  onChange={(e) => setIncome(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
                <div className="flex justify-between text-[8px] text-slate-900 dark:text-slate-500 font-bold">
                  <span>₹50K</span>
                  <span>₹1.0M MAX</span>
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-900 dark:text-slate-400 tracking-wider">
                  Filter Category Profile
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg text-xs text-slate-950 dark:text-white focus:outline-hidden"
                >
                  <option value="All">All Categories</option>
                  <option value="Need Based">Need Based</option>
                  <option value="Girls Education">Girls Education</option>
                  <option value="Sports">Sports</option>
                  <option value="Minority">Minority</option>
                  <option value="Higher Education">Higher Education</option>
                </select>
              </div>

            </CardContent>
          </Card>

          {/* Quick instructions / Help */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-2">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-edu-purple" />
              <span>Standard Disbursal Notice</span>
            </h4>
            <p className="text-[11px] text-slate-900 dark:text-slate-400 leading-relaxed font-sans font-medium text-justify">
              All applications require digital upload of verified caste, income, and educational marks sheets. Submitting mock uploads or false details will invalidate applications immediately.
            </p>
          </Card>
        </div>

        {/* Right Column: Matched Scholarships List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-slate-900 dark:text-slate-400 font-bold">
              Matched Schemes: <strong className="text-edu-purple">{filteredSchemes.length} Eligible</strong>
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-900 dark:text-slate-500 uppercase">
              SEALED SCHEME REGISTRY
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredSchemes.map((scheme) => (
              <Card key={scheme.id} className="bg-card border-border hover:border-slate-400 dark:hover:border-slate-700 transition-all shadow-3xs">
                <CardContent className="p-4.5 space-y-4">
                  
                  {/* Top line with Category badge & deadline */}
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-[9px] font-bold font-mono bg-purple-100 dark:bg-purple-950/40 text-edu-purple px-2 py-0.5 rounded border border-border">
                      {scheme.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Deadline: {scheme.deadline}</span>
                    </span>
                  </div>

                  {/* Title & Reward */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-slate-900 dark:text-slate-400 mt-1 flex items-center gap-1 font-bold">
                      <Coins className="w-4 h-4 text-royal-blue dark:text-edu-gold" />
                      <span>Reward Outlay: <strong className="text-royal-blue dark:text-edu-gold font-mono">{scheme.reward}</strong></span>
                    </p>
                  </div>

                  {/* Document Checklist */}
                  <div className="space-y-1.5 text-xs pt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-500">Required Documents:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {scheme.documents.map((doc, docIdx) => (
                        <span key={docIdx} className="px-2 py-0.5 bg-slate-100 text-slate-950 dark:bg-slate-900 dark:text-slate-450 border border-border rounded text-[9px] font-mono">
                          ✓ {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Application Button */}
                  <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-850">
                    <button className="inline-flex items-center gap-1.5 text-[10px] font-black text-edu-purple hover:underline cursor-pointer">
                      <span>File Application Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </CardContent>
              </Card>
            ))}

            {filteredSchemes.length === 0 && (
              <div className="text-center py-16 bg-card border border-border rounded-2xl text-slate-800 dark:text-slate-500 font-medium">
                No matching scholarship schemes found for your current Marks & Income parameters. Try expanding your values.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
