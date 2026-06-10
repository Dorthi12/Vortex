import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, ShieldAlert, HeartPulse } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';

export default function DiseasePrediction() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { ward: 'Ward A', cases: 145, predicted: 180 },
    { ward: 'Ward B', cases: 85, predicted: 110 },
    { ward: 'Ward C', cases: 210, predicted: 340 },
    { ward: 'Ward D', cases: 50, predicted: 65 },
    { ward: 'Ward E', cases: 120, predicted: 150 },
  ];

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 p-6 sm:p-8 w-full max-w-7xl mx-auto overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Outbreak Intelligence</h1>
          <p className="text-slate-600">Predictive epidemiology for vector-borne diseases (Dengue focus).</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <HeartPulse className="w-16 h-16 text-primary animate-bounce mb-4" />
            <p className="text-lg font-medium text-slate-600">Cross-referencing hospital data...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600"><AlertTriangle className="w-8 h-8 hidden" /><Thermometer className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-orange-800 font-bold text-lg mb-1">Ward C Alert</h3>
                  <p className="text-orange-600 text-sm">Cluster formation detected. Preventative fogging recommended.</p>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Activity className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-slate-500 font-medium text-sm mb-1">Model Accuracy</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">89.5%</span>
                    <span className="text-slate-400 text-sm font-medium mb-1">based on 10k cases</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-6">Current vs Predicted Cases by Ward (Next 14 Days)</h3>
              <div className="h-80 w-full mb-6">
                <ResponsiveContainer>
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="ward" axisLine={false} tickLine={false} dy={10} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="cases" name="Current Cases" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="predicted" name="Predicted Cases" fill="#0B1E3D" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border border-slate-100">
                <strong className="text-slate-800">Insight:</strong> The stark rise in Ward C is correlated with the recent stagnation of water reported in <span className="text-primary font-medium cursor-pointer">Issue #1042</span>. Deploying health workers to Sector 4 and 5 of Ward C can mitigate 40% of the predicted spike.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
