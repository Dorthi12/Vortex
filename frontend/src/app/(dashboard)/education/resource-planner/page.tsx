'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  TrendingUp, 
  Coins, 
  Building, 
  Users, 
  RefreshCw, 
  Play, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EducationHeader } from '@/components/education/EducationHeader';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

export default function ResourcePlanner() {
  const { setActiveTab } = useUiStore();

  // Growth inputs
  const [studentGrowth, setStudentGrowth] = useState<number>(3.5); // % YoY
  const [classSize, setClassSize] = useState<number>(30); // students per class
  const [budgetMultiplier, setBudgetMultiplier] = useState<number>(1.2);

  useEffect(() => {
    setActiveTab('Education');
  }, [setActiveTab]);

  // Compute resource projections
  const projections = useMemo(() => {
    // Math to compute resources needed over next 5 years
    const growthFactor = (1 + studentGrowth / 100);
    const futureStudents = Math.floor(345200 * Math.pow(growthFactor, 5));
    const extraStudents = futureStudents - 345200;

    const extraClassrooms = Math.floor(extraStudents / classSize);
    const extraTeachers = Math.floor(extraClassrooms * 1.2);
    const estimatedCost = (extraClassrooms * 15 + extraTeachers * 8) * (1 / budgetMultiplier);

    return {
      futureStudents,
      extraClassrooms,
      extraTeachers,
      estimatedCost: Math.max(5.0, estimatedCost / 10)
    };
  }, [studentGrowth, classSize, budgetMultiplier]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Shared Header */}
      <EducationHeader 
        title="Education Resource Planner" 
        subtitle="Predict future school demands, classroom requirements, and multi-year budget outlay forecasts."
      />

      {/* 1. Main Planner Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Growth Variables (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-edu-purple" />
                <span>Growth Variable Inputs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4.5 space-y-4">
              
              {/* Student Growth */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Student Population Growth</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">+{studentGrowth}% YoY</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={studentGrowth}
                  onChange={(e) => setStudentGrowth(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

              {/* Class size target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Target Pupils Per Classroom</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">{classSize} Students</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="45"
                  value={classSize}
                  onChange={(e) => setClassSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

              {/* Budget Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-slate-350">Fiscal Expansion Factor</span>
                  <span className="font-mono text-royal-blue dark:text-edu-gold">{budgetMultiplier}x Outlay</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={budgetMultiplier}
                  onChange={(e) => setBudgetMultiplier(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-edu-purple"
                />
              </div>

            </CardContent>
          </Card>

          {/* Verification stamp */}
          <Card className="bg-card border-border shadow-xs p-4.5 space-y-2">
            <h4 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-edu-purple" />
              <span>Planning Model Info</span>
            </h4>
            <p className="text-[11px] text-slate-900 dark:text-slate-450 leading-relaxed font-sans font-medium text-justify">
              This planner computes the capital infrastructure costs over a 5-year outlook based on municipal urbanization variables and regional school registers.
            </p>
          </Card>
        </div>

        {/* Right Column: Projected Requirements (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Outputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Classrooms */}
            <Card className="bg-card border-border shadow-2xs p-4 flex flex-col justify-between">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Classrooms Needed</p>
                <h3 className="text-xl font-black font-mono text-slate-950 dark:text-white mt-1">
                  +{projections.extraClassrooms} Wards
                </h3>
              </div>
              <Building className="w-5 h-5 text-edu-purple mt-3" />
            </Card>

            {/* Teachers */}
            <Card className="bg-card border-border shadow-2xs p-4 flex flex-col justify-between">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Teachers Needed</p>
                <h3 className="text-xl font-black font-mono text-royal-blue dark:text-edu-gold mt-1">
                  +{projections.extraTeachers} Staff
                </h3>
              </div>
              <Users className="w-5 h-5 text-royal-blue dark:text-edu-gold mt-3" />
            </Card>

            {/* Estimated Outlay */}
            <Card className="bg-card border-border shadow-2xs p-4 flex flex-col justify-between">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-900 dark:text-slate-400">Capital Outlay</p>
                <h3 className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-450 mt-1">
                  ₹{projections.estimatedCost.toFixed(1)} Cr
                </h3>
              </div>
              <Coins className="w-5 h-5 text-emerald-600 mt-3" />
            </Card>

          </div>

          {/* 5-Year Outlook SVG Graph */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-4.5 border-b border-border">
              <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-edu-purple" />
                <span>5-Year Outlay Projection Curve</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex items-center justify-center">
              <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner">
                
                {/* SVG Line Graph */}
                <svg viewBox="0 0 400 180" className="w-full h-full text-slate-300 dark:text-slate-800">
                  <line x1="40" y1="20" x2="360" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="70" x2="360" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="120" x2="360" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="40" y1="140" x2="360" y2="140" stroke="currentColor" strokeWidth="0.8" />
                  
                  {/* Line path shifting based on projections */}
                  <path
                    d={`M 40 135 L 120 120 L 200 95 L 280 65 L 340 35`}
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  <circle cx="40" cy="135" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="120" cy="120" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="200" cy="95" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="280" cy="65" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />
                  <circle cx="340" cy="35" r="4" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="1" />

                  {/* X labels */}
                  <text x="40" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Year 1</text>
                  <text x="120" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Year 2</text>
                  <text x="200" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Year 3</text>
                  <text x="280" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Year 4</text>
                  <text x="340" y="160" fill="currentColor" fontSize="8" fontWeight="bold" textAnchor="middle">Year 5</text>
                </svg>

              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
