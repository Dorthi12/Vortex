import { Brain, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function PriorityTable() {
  const priorities = [
    { id: 'ISS-092', issue: 'Bridge Structural Weakness', area: 'Sector 5', aiScore: 98, trend: 'up', status: 'Critical' },
    { id: 'ISS-088', issue: 'Contaminated Water Supply', area: 'North Ward', aiScore: 94, trend: 'up', status: 'High' },
    { id: 'ISS-105', issue: 'Major Traffic Signal Failure', area: 'Downtown', aiScore: 87, trend: 'down', status: 'High' },
    { id: 'ISS-042', issue: 'Drainage Blockage Risk', area: 'East Valley', aiScore: 76, trend: 'up', status: 'Medium' },
    { id: 'ISS-112', issue: 'Streetlight Outage', area: 'West End', aiScore: 62, trend: 'down', status: 'Medium' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue ID</th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Area</th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-1"><Brain className="w-3.5 h-3.5 text-accent" /> AI Risk Score</div>
            </th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {priorities.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
              <td className="py-3 px-4 text-sm font-medium text-slate-500">{item.id}</td>
              <td className="py-3 px-4 text-sm font-semibold text-slate-800">{item.issue}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{item.area}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-200 rounded-full h-1.5 max-w-[4rem]">
                    <div 
                      className={`h-1.5 rounded-full ${item.aiScore > 90 ? 'bg-red-500' : item.aiScore > 80 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                      style={{ width: `${item.aiScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.aiScore}</span>
                  {item.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-red-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  item.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                  item.status === 'High' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {item.status === 'Critical' && <AlertCircle className="w-3 h-3" />}
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
