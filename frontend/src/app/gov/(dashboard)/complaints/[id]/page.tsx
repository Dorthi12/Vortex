'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGovStore, GovComplaint, ComplaintStatus } from '@/store/useGovStore';
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Clock, Play, CheckCircle2,
  User, Phone, MapPin, Calendar, FileText, Send, UserCheck, Share2, Zap
} from 'lucide-react';

const STATUS_OPTIONS: { value: ComplaintStatus; label: string; color: string }[] = [
  { value: 'Submitted', label: 'Submitted', color: 'text-slate-400 border-slate-700 bg-slate-950/40' },
  { value: 'Under Review', label: 'Under Review', color: 'text-blue-400 border-blue-700 bg-blue-950/40' },
  { value: 'Assigned', label: 'Assigned', color: 'text-indigo-400 border-indigo-700 bg-indigo-950/40' },
  { value: 'In Progress', label: 'In Progress', color: 'text-amber-400 border-amber-700 bg-amber-950/40' },
  { value: 'Resolved', label: 'Resolved', color: 'text-emerald-400 border-emerald-700 bg-emerald-950/40' },
  { value: 'Closed', label: 'Closed', color: 'text-rose-400 border-rose-700 bg-rose-950/40' },
];

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const isGovAuthenticated = useGovStore(s => s.isGovAuthenticated);
  const complaints = useGovStore(s => s.complaints);
  const updateComplaintStatus = useGovStore(s => s.updateComplaintStatus);

  const [complaint, setComplaint] = useState<GovComplaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Under Review');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isGovAuthenticated) {
      router.replace('/gov/login');
      return;
    }

    if (id) {
      const found = complaints.find(c => c.id === id);
      if (found) {
        setComplaint(found);
        setNewStatus(found.status);
      }
    }
  }, [id, complaints, isGovAuthenticated, router]);

  if (!isGovAuthenticated || !complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
        <span>Loading complaint records...</span>
      </div>
    );
  }

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    updateComplaintStatus(complaint.id, newStatus, note);
    setNote('');
    setSuccessMsg('Status updated successfully');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 bg-red-950/30 border border-red-800/40';
      case 'High': return 'text-orange-400 bg-orange-950/30 border border-orange-800/40';
      case 'Medium': return 'text-amber-400 bg-amber-950/30 border border-amber-800/40';
      default: return 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/40';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/50';
      case 'Closed': return 'text-rose-400 bg-rose-950/30 border border-rose-800/50';
      case 'In Progress': return 'text-amber-400 bg-amber-950/30 border border-amber-800/50';
      case 'Assigned': return 'text-indigo-400 bg-indigo-950/30 border border-indigo-800/50';
      case 'Under Review': return 'text-blue-400 bg-blue-950/30 border border-blue-800/50';
      default: return 'text-slate-400 bg-slate-900/30 border border-slate-800/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMB & BACK ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>NETRAVAAH GOV</span>
          <span>&gt;</span>
          <span className="cursor-pointer hover:text-slate-300" onClick={() => router.push('/gov/complaints')}>Complaints</span>
          <span>&gt;</span>
          <span className="text-[#D4AF37] font-mono">{complaint.id}</span>
        </div>
        <button
          onClick={() => router.push('/gov/complaints')}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#0A1228] hover:bg-[#121E3D] border border-[#1A2744] rounded-lg text-xs font-semibold text-slate-300 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* ── HEADER TITLE BLOCK ── */}
      <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-bold text-[#D4AF37] tracking-wider px-2 py-0.5 bg-[#121E3D] border border-[#1C39BB]/30 rounded">
                ID: {complaint.id}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority} Priority
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{complaint.title}</h1>
            <p className="text-slate-400 text-xs mt-1">
              Registered in <span className="text-slate-300 font-semibold">{complaint.district}</span>, Maharashtra
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 text-xs font-semibold rounded-lg transition-colors">
              <AlertTriangle size={14} />
              <span>Mark Emergency</span>
            </button>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#121E3D] hover:bg-[#1A2D5E] text-slate-300 border border-[#1A2744] text-xs font-semibold rounded-lg transition-colors">
              <Share2 size={14} />
              <span>Forward to Ministry</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Citizen, description, timeline (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Citizen details */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center">
              <User size={14} className="mr-2 text-slate-500" />
              Citizen Registration Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-slate-500 w-24">Citizen Name:</span>
                  <span className="text-white font-medium">{complaint.citizen}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-slate-500 w-24">Phone Line:</span>
                  <span className="text-slate-300 font-mono">{complaint.phone}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-slate-500 w-24">Location:</span>
                  <span className="text-slate-300 flex items-center"><MapPin size={12} className="mr-1 text-[#D4AF37]" /> {complaint.location}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-slate-500 w-24">Submitted:</span>
                  <span className="text-slate-300 flex items-center"><Calendar size={12} className="mr-1 text-slate-500" /> {new Date(complaint.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center">
              <FileText size={14} className="mr-2 text-slate-500" />
              Complaint Narration
            </h2>
            <div className="bg-[#070D1A] rounded-lg p-4 border border-[#1A2744] text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {complaint.description}
            </div>
          </div>

          {/* Action Update Form */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center">
              <Send size={14} className="mr-2 text-[#D4AF37]" />
              Update Governance Resolution
            </h2>
            
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs rounded-lg font-semibold flex items-center">
                <CheckCircle size={14} className="mr-2" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Action Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full bg-[#070D1A] border border-[#1A2744] focus:border-[#D4AF37] text-white text-xs font-semibold rounded-lg p-2.5 outline-none transition-colors"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-[#0A1228]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Governance Action Notes &amp; Decisions</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Provide detailed description of action taken, department orders, or investigation findings..."
                  className="w-full h-28 bg-[#070D1A] border border-[#1A2744] focus:border-[#D4AF37] text-white text-xs rounded-lg p-3 outline-none resize-none transition-colors placeholder:text-slate-600"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#1C39BB] to-[#1A3A6C] hover:from-[#244bd5] hover:to-[#224e8d] border border-[#1C39BB] text-xs font-bold text-white rounded-lg transition-all shadow-md flex items-center space-x-2"
                >
                  <UserCheck size={14} />
                  <span>Log Resolution Action</span>
                </button>
              </div>
            </form>
          </div>

          {/* Timeline */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-5 flex items-center">
              <Clock size={14} className="mr-2 text-slate-500" />
              Governance &amp; Resolution Audit Timeline
            </h2>
            <div className="relative pl-6 border-l border-[#1C39BB]/30 space-y-6">
              {complaint.timeline && complaint.timeline.length > 0 ? (
                complaint.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Glowing Bullet */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#070D1A] border-2 border-[#D4AF37] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white bg-[#121E3D] px-2 py-0.5 rounded border border-[#1A2744]">
                          {step.status}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {new Date(step.timestamp).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed bg-[#070D1A]/50 p-2.5 rounded border border-[#1A2744]/40">
                        {step.note}
                      </p>
                      <p className="text-[10px] text-[#D4AF37] mt-1 text-right">
                        Logged by: <span className="font-semibold">{step.by}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No timeline logs found.</div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI analysis, assignments, department */}
        <div className="space-y-6">
          
          {/* AI Insights Card */}
          <div className="bg-[#0A1228] border border-amber-950/60 rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
            <h2 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center justify-between">
              <span className="flex items-center"><Zap size={14} className="mr-2 text-[#D4AF37]" /> AI Intel analysis</span>
              <span className="text-[10px] bg-amber-500/10 text-[#D4AF37] border border-amber-700/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest font-mono">ACTIVE</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Predicted Category</span>
                <span className="text-sm font-bold text-white block mt-0.5">{complaint.aiCategory}</span>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Confidence Rating</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">94%</span>
                </div>
              </div>

              <div className="bg-[#070D1A] border border-[#1A2744] rounded-lg p-3.5 space-y-2">
                <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider flex items-center">
                  <Brain size={12} className="mr-1" />
                  AI Suggested Response Path
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {complaint.aiSuggestion}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Relevant Policies</span>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-[#121E3D] text-slate-300 border border-[#1A2744] px-2 py-0.5 rounded cursor-pointer hover:border-slate-500 transition-colors">
                    Gov-Infra-2024-03
                  </span>
                  <span className="text-[10px] bg-[#121E3D] text-slate-300 border border-[#1A2744] px-2 py-0.5 rounded cursor-pointer hover:border-slate-500 transition-colors">
                    Water-Security-Act
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Severity Risk Assessment</span>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                  <div className="bg-emerald-950/40 text-slate-500 p-1 border border-emerald-900/10 rounded">LOW</div>
                  <div className="bg-amber-950/40 text-slate-500 p-1 border border-amber-900/10 rounded">MED</div>
                  <div className="bg-red-500/10 text-red-400 p-1 border border-red-800/40 rounded">HIGH</div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Ownership Card */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4">
              Assigned Department
            </h2>
            <div className="space-y-3">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase">Department</span>
                <span className="text-sm font-semibold text-white block mt-0.5">{complaint.department}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1A2744]">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Lead Officer</span>
                  <span className="text-xs font-medium text-slate-300 mt-0.5 block">Shri R. K. Shinde</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Office Tel</span>
                  <span className="text-xs font-medium text-slate-300 mt-0.5 block font-mono">022-2202-4561</span>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Assignment Card */}
          <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl p-5 shadow-md">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-[#1A2744] pb-2 mb-4 flex items-center justify-between">
              <span>Security Assignment</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1A2744] flex items-center justify-center text-[#D4AF37] font-bold">
                  {complaint.assignedOfficer ? complaint.assignedOfficer.split(' ').slice(-1)[0][0] : 'U'}
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Assigned Personnel</span>
                  <span className="text-xs font-bold text-white block">
                    {complaint.assignedOfficer || 'Unassigned / Queue'}
                  </span>
                </div>
              </div>
              <button className="w-full py-2 bg-[#121E3D] hover:bg-[#1C39BB]/20 text-slate-300 hover:text-white border border-[#1A2744] hover:border-[#1C39BB]/40 rounded-lg text-xs font-semibold transition-all">
                Reassign Duty Officer
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
