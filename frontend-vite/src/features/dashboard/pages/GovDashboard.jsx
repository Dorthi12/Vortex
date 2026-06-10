import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import PriorityTable from '../components/PriorityTable';
import Heatmap from '../components/Heatmap';

export default function GovDashboard() {
  const reportData = [
    { name: 'Mon', reports: 120, resolved: 80 },
    { name: 'Tue', reports: 150, resolved: 110 },
    { name: 'Wed', reports: 180, resolved: 140 },
    { name: 'Thu', reports: 160, resolved: 155 },
    { name: 'Fri', reports: 210, resolved: 170 },
    { name: 'Sat', reports: 250, resolved: 160 },
    { name: 'Sun', reports: 230, resolved: 190 },
  ];

  const metrics = [
    { title: 'Total Issues Reported', value: '1,300', change: '+14%', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Issues Resolved', value: '1,005', change: '+22%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Active Citizens', value: '45.2k', change: '+5%', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Avg Response Time', value: '14h 20m', change: '-2h', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="flex bg-slate-50/50 min-h-[calc(100vh-5rem)]">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 sm:p-8 lg:p-10 w-full max-w-7xl mx-auto overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Command Center</h1>
          <p className="text-slate-600">AI-driven civic intelligence and real-time governance metrics.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${metric.bg}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${metric.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">{metric.title}</h3>
              <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts & Map Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 font-heading">Resolution Trends</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6A75E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C6A75E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B1E3D" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0B1E3D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="reports" stroke="#C6A75E" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" />
                  <Area type="monotone" dataKey="resolved" stroke="#0B1E3D" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 font-heading">Issue Hotspots</h3>
            <div className="flex-1 min-h-[16rem]">
              <Heatmap />
            </div>
          </motion.div>
        </div>

        {/* Priority Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-900 font-heading">AI-Prioritized Critical Issues</h3>
            <button className="text-sm font-medium text-primary hover:text-accent transition-colors">View All</button>
          </div>
          <PriorityTable />
        </motion.div>

      </div>
    </div>
  );
}
