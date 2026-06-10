import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { HardHat, Compass, TrendingDown } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';

export default function InfraRisk() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { subject: 'Structural Integrity', A: 45, B: 85, fullMark: 100 },
    { subject: 'Material Age', A: 80, B: 40, fullMark: 100 },
    { subject: 'Traffic Load', A: 95, B: 50, fullMark: 100 },
    { subject: 'Soil Stability', A: 60, B: 90, fullMark: 100 },
    { subject: 'Weather Impact', A: 75, B: 30, fullMark: 100 },
  ];

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 p-6 sm:p-8 w-full max-w-7xl mx-auto overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Infrastructure Risk Analysis</h1>
          <p className="text-slate-600">AI evaluation of bridges, roads, and public buildings.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <HardHat className="w-16 h-16 text-primary animate-pulse mb-4" />
            <p className="text-lg font-medium text-slate-600">Computing structural data...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold text-slate-900 mb-2">Bridge #42 (Eastern Highway)</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-red-50 text-red-700 border-red-200 mb-6">Critical Risk</span>
                
                <p className="text-slate-600 leading-relaxed mb-6">
                  Computer Vision analysis from recent drone footage combined with sensor data indicates significant fatigue in structural joints. High traffic load is accelerating material degradation beyond normal safe parameters.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Time to failure est.</div>
                    <div className="text-2xl font-bold text-slate-800">4-6 Months</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Action Required</div>
                    <div className="text-lg font-bold text-red-600">Immediate Closure</div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px] bg-slate-50 rounded-xl border border-slate-100 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Radar name="Bridge #42" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                    <Radar name="Baseline Safe" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
