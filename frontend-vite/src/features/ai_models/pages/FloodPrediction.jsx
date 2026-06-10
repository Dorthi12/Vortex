import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CloudRain, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';

export default function FloodPrediction() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { day: 'Mon', level: 2.1, threshold: 4.5 },
    { day: 'Tue', level: 2.8, threshold: 4.5 },
    { day: 'Wed', level: 3.5, threshold: 4.5 },
    { day: 'Thu', level: 4.8, threshold: 4.5 },
    { day: 'Fri', level: 5.2, threshold: 4.5 },
    { day: 'Sat', level: 3.9, threshold: 4.5 },
    { day: 'Sun', level: 2.5, threshold: 4.5 },
  ];

  return (
    <div className="flex bg-slate-50 min-h-[calc(100vh-5rem)]">
      <Sidebar />
      <div className="flex-1 p-6 sm:p-8 lg:p-10 w-full max-w-7xl mx-auto overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Flood Risk Prediction</h1>
          <p className="text-slate-600">AI-powered 7-day forecast for water levels and catchment areas.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 relative flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <CloudRain className="w-6 h-6 text-primary absolute animate-pulse" />
            </div>
            <p className="text-lg font-medium text-slate-600 animate-pulse">Running neural network models...</p>
            <p className="text-sm text-slate-400 mt-2">Analyzing meteorological data</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-red-800 font-bold text-lg mb-1">High Risk Detected</h3>
                  <p className="text-red-600 text-sm">Critical water levels predicted for Thursday & Friday in East Valley.</p>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Activity className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-slate-500 font-medium text-sm mb-1">AI Confidence Score</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-slate-900">94.2%</span>
                    <span className="text-emerald-500 text-sm font-medium mb-1">+2.1%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><ShieldCheck className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-slate-500 font-medium text-sm mb-1">Evacuation Status</h3>
                  <p className="text-2xl font-bold text-emerald-600">Standby</p>
                  <p className="text-xs text-slate-400 mt-1">Teams alerted at 08:00 AM</p>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-heading font-bold text-slate-900">7-Day Water Level Forecast (Meters)</h3>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Predicted Level</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Danger Threshold (4.5m)</div>
                </div>
              </div>

              <div className="h-80 w-full mb-6">
                <ResponsiveContainer>
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <ReferenceLine y={4.5} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                    <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row gap-6 items-start">
                <div className="bg-primary/10 text-primary p-3 rounded-full hidden sm:block">
                  <CloudRain className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">AI Diagnostic Explanation</h4>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    The predictive model indicates a <strong className="text-red-500">76% probability</strong> of the Mithi River breaching its warning mark of 4.5 meters on Thursday afternoon. This is driven by an incoming low-pressure system combining with high tide delays (Factor: 0.82). 
                  </p>
                  <button className="text-primary font-medium text-sm hover:text-primary-light transition-colors">Generate Evacuation Route Map →</button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
