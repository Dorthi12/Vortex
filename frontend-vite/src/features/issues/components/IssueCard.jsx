import { motion } from 'framer-motion';
import { Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function IssueCard({ issue, index }) {
  const statusColors = {
    'Reported': 'bg-red-50 text-red-600 border-red-200',
    'In Progress': 'bg-yellow-50 text-yellow-600 border-yellow-200',
    'Resolved': 'bg-primary/5 text-primary border-primary/20',
  };

  const StatusIcon = {
    'Reported': AlertCircle,
    'In Progress': Clock,
    'Resolved': CheckCircle2,
  }[issue.status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {issue.category}
        </span>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusColors[issue.status]}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {issue.status}
        </span>
      </div>
      
      <h3 className="font-heading font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">
        {issue.title}
      </h3>
      
      <p className="text-slate-600 mb-4 text-sm line-clamp-3 leading-relaxed flex-grow">
        {issue.description}
      </p>
      
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 pt-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-1.5 truncate max-w-[60%]">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{issue.location}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{issue.date}</span>
        </div>
      </div>
    </motion.div>
  );
}
