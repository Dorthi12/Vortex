import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import IssueCard from '../components/IssueCard';

export default function IssuesList() {
  const [issues] = useState([
    {
      id: 1,
      title: 'Broken Streetlights on Residency Road',
      description: 'Multiple streetlights are not functioning near the central junction, causing safety concerns during the night.',
      category: 'Infrastructure',
      status: 'Reported',
      location: 'Residency Road, Ward 4',
      date: 'Oct 24, 2026',
    },
    {
      id: 2,
      title: 'Water Supply Contamination',
      description: 'Residents are receiving muddy water for the past two days. Needs immediate attention as it poses a health risk.',
      category: 'Public Health',
      status: 'In Progress',
      location: 'Green Park Extension',
      date: 'Oct 23, 2026',
    },
    {
      id: 3,
      title: 'Potholes after Monsoon',
      description: 'Large potholes have formed on the main arterial road slowing down traffic significantly.',
      category: 'Roads & Transport',
      status: 'Resolved',
      location: 'Eastern Express Highway',
      date: 'Oct 15, 2026',
    },
    {
      id: 4,
      title: 'Garbage Collection Delayed',
      description: 'The municipal garbage truck has not visited our sector for 4 days. Waste is piling up heavily.',
      category: 'Sanitation',
      status: 'Reported',
      location: 'Sector 17, Vashi',
      date: 'Oct 25, 2026',
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">Civic Issues</h1>
          <p className="text-slate-600">Track, report, and stay updated on community problems.</p>
        </div>
        
        <Link 
          to="/issues/new" 
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-light transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Report New Issue
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-8 flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none bg-slate-50"
            placeholder="Search issues..."
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-lg font-medium hover:bg-slate-100 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {issues.map((issue, index) => (
          <IssueCard key={issue.id} issue={issue} index={index} />
        ))}
      </div>
    </div>
  );
}
