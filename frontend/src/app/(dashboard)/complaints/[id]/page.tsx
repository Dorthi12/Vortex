'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileImage, 
  FileVideo,
  Send,
  UserCheck,
  ShieldAlert,
  BadgeAlert,
  ChevronRight
} from 'lucide-react';
import { useComplaintStore } from '@/store/useComplaintStore';
import { useUiStore } from '@/store/useUiStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Label, Input, Textarea, Select, FormGroup } from '@/components/ui/form';
import { ComplaintStatus, Complaint } from '@/types/complaint';
import { cn } from '@/lib/utils';

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { complaints, officers, updateComplaintStatus, assignOfficer } = useComplaintStore();
  const { setActiveTab } = useUiStore();

  // Sync active sidebar item
  useEffect(() => {
    setActiveTab('Complaints');
  }, [setActiveTab]);

  // Find complaint
  const complaint = complaints.find((c) => c.id === id);

  // Administrative Control States
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('Submitted');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [logNote, setLogNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState(false);

  // Initialize administrative controls once complaint data is loaded
  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setSelectedOfficerId(complaint.officer?.id || '');
    }
  }, [complaint]);

  if (!complaint) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Card className="max-w-md bg-card border-danger/35 text-center p-6">
          <CardContent className="pt-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-danger-light flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Grievance Not Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The complaint ID <strong className="font-mono text-slate-700 dark:text-slate-200">{id}</strong> does not exist in the active database registry.
              </p>
            </div>
            <Link href="/complaints" passHref>
              <Button variant="outline" className="w-full h-10 mt-2 cursor-pointer">
                Return to Directory
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status badge styling
  const getStatusBadge = (status: ComplaintStatus) => {
    const styles = {
      Submitted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      Assigned: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      'In Progress': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
      Resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
      Closed: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    };
    return (
      <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border', styles[status])}>
        {status}
      </span>
    );
  };

  // Stepper dot styling
  const getTimelineDotColor = (status: ComplaintStatus) => {
    const colors = {
      Submitted: 'border-amber-500 bg-amber-500 text-amber-500',
      Assigned: 'border-blue-500 bg-blue-500 text-blue-500',
      'In Progress': 'border-purple-500 bg-purple-500 text-purple-500',
      Resolved: 'border-green-500 bg-green-500 text-green-500',
      Closed: 'border-slate-400 bg-slate-400 text-slate-400',
    };
    return colors[status];
  };

  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setOperationSuccess(false);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updater = 'Desk Operator Jane';

    // 1. Check if officer is updated
    const prevOfficerId = complaint.officer?.id || '';
    if (selectedOfficerId && selectedOfficerId !== prevOfficerId) {
      assignOfficer(complaint.id, selectedOfficerId, updater);
    }

    // 2. Check if status is updated, or custom status log note is added
    if (selectedStatus !== complaint.status || logNote.trim() !== '') {
      const finalNote = logNote.trim() !== '' 
        ? logNote.trim() 
        : `Status modified from ${complaint.status} to ${selectedStatus}.`;
      updateComplaintStatus(complaint.id, selectedStatus, finalNote, updater);
    }

    setIsUpdating(false);
    setOperationSuccess(true);
    setLogNote('');

    // Clear success banner after 2 seconds
    setTimeout(() => {
      setOperationSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link 
          href="/complaints" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-royal-blue dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Grievances Directory
        </Link>

        <span className="text-xs font-mono font-extrabold text-slate-450 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded border border-border-subtle">
          ID: {complaint.id}
        </span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-royal-blue dark:text-brand-yellow font-bold">
              {complaint.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">{complaint.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {complaint.title}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500">Active SLA status:</span>
          {getStatusBadge(complaint.status)}
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: DETAILS, MEDIA, TIMELINE      */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Grievance Description & Location */}
          <Card className="bg-card border-border-subtle shadow-xs">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              
              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-450 uppercase tracking-wide">Incident Summary</Label>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  {complaint.description}
                </p>
              </div>

              {/* Location details */}
              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-100 dark:border-slate-850">
                <div className="h-9 w-9 rounded-full bg-royal-blue/10 flex items-center justify-center shrink-0 text-royal-blue">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Registered Location</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{complaint.location}</span>
                  {complaint.coordinates && (
                    <span className="block text-[10px] text-slate-500 font-mono">
                      Grid Coordinate Mapping: X={complaint.coordinates.x}%, Y={complaint.coordinates.y}% (Sector 4B Locator Map)
                    </span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 2. Uploaded Evidence Media Preview */}
          <Card className="bg-card border-border-subtle shadow-xs">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Attached Evidence Media</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Photo Evidence Card */}
                <div className="border border-border-subtle bg-slate-50 dark:bg-slate-900/25 rounded-lg overflow-hidden flex flex-col justify-between">
                  <div className="aspect-video relative bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {/* Simulated image preview / actual mockup */}
                    {complaint.photoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-4 relative group">
                        <FileImage className="w-10 h-10 text-royal-blue mb-1" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate max-w-[220px]">{complaint.photoName || 'evidence_image.jpg'}</span>
                        <span className="text-[10px] text-slate-500">Field Photo Capture</span>
                        {/* Overlay visual border design */}
                        <div className="absolute inset-0 border border-royal-blue/10 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="text-slate-400 dark:text-slate-650 flex flex-col items-center justify-center text-xs">
                        <FileImage className="w-8 h-8 mb-1.5 opacity-40" />
                        No photo attachment uploaded
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-border-subtle bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-550 truncate max-w-[180px]">{complaint.photoName || 'No Photo Logged'}</span>
                    <span className="text-slate-400">Image</span>
                  </div>
                </div>

                {/* Video Evidence Card */}
                <div className="border border-border-subtle bg-slate-50 dark:bg-slate-900/25 rounded-lg overflow-hidden flex flex-col justify-between">
                  <div className="aspect-video relative bg-slate-200 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                    {complaint.videoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-4 relative">
                        <FileVideo className="w-10 h-10 text-royal-blue mb-1" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate max-w-[220px]">{complaint.videoName || 'evidence_video.mp4'}</span>
                        <span className="text-[10px] text-slate-500">Field Video Capture</span>
                        <div className="absolute inset-0 border border-royal-blue/10 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="text-slate-400 dark:text-slate-650 flex flex-col items-center justify-center text-xs">
                        <FileVideo className="w-8 h-8 mb-1.5 opacity-40" />
                        No video attachment uploaded
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-border-subtle bg-white dark:bg-slate-900 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-550 truncate max-w-[180px]">{complaint.videoName || 'No Video Logged'}</span>
                    <span className="text-slate-400">Video</span>
                  </div>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* 3. Dynamic Stepper Timeline view */}
          <Card className="bg-card border-border-subtle shadow-xs">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Incident Tracking Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="relative border-l-2 border-slate-150 dark:border-slate-800 ml-4 pl-8 py-2 space-y-8">
                
                {complaint.timeline.map((event, idx) => (
                  <div key={idx} className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                    
                    {/* Stepper Dot Indicator */}
                    <span className={cn(
                      'absolute -left-[41px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border bg-white dark:bg-slate-900 text-neutral-white shadow-xs z-10 transition-all duration-300',
                      getTimelineDotColor(event.status)
                    )}>
                      <span className="h-2.5 w-2.5 rounded-full bg-current" />
                    </span>

                    {/* Stepper Content Box */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {event.status}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            by {event.updatedBy}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                          <Clock className="w-3 h-3 text-royal-blue shrink-0" />
                          <span>
                            {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                        {event.note}
                      </p>
                    </div>

                  </div>
                ))}

              </div>

            </CardContent>
          </Card>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: WORKFLOWS, ADMIN SIMULATOR   */}
        {/* ========================================== */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Current Active Assigned Officer Card */}
          <Card className={cn(
            'bg-card border-border-subtle shadow-xs border-l-4',
            complaint.officer ? 'border-l-success' : 'border-l-warning'
          )}>
            <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Assigned Technical Officer</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {complaint.officer ? (
                <div className="space-y-4">
                  {/* Officer Info header */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success-light dark:bg-success/10 flex items-center justify-center shrink-0 text-success">
                      <UserCheck className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{complaint.officer.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{complaint.officer.role}</p>
                    </div>
                  </div>

                  {/* Details stats table */}
                  <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-slate-600 dark:text-slate-350">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-royal-blue shrink-0" />
                      <span className="truncate">Dept: <strong>{complaint.officer.department}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-royal-blue shrink-0" />
                      <span>Hotline: <strong>{complaint.officer.phone}</strong></span>
                    </div>
                  </div>

                  {/* Speed Dial contact */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`tel:${complaint.officer?.phone}`)}
                    className="w-full text-xs font-semibold py-1.5 h-9 mt-2 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    Call Officer Hotline
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-warning-light dark:bg-amber-950/20 flex items-center justify-center shrink-0 text-warning mx-auto">
                    <BadgeAlert className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Pending Technical Dispatch</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-normal">
                      No administrative field officer has been assigned to this report. Use the simulator control below to route.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Municipal Operator Simulator Panel */}
          <Card className="bg-card border-border-subtle shadow-md border-t-4 border-t-royal-blue">
            <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-royal-blue dark:text-blue-400">
                Municipal Admin Simulator
              </CardTitle>
              <CardDescription className="text-[10px]">
                Simulate dispatcher console decisions and status updates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleApplyChanges} className="space-y-4">
                
                {/* Status Toggle selection */}
                <FormGroup label="Transition SLA Status">
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                    className="text-xs cursor-pointer h-9"
                  >
                    <option value="Submitted">Submitted (Pending Action)</option>
                    <option value="Assigned">Assigned (Officer Assigned)</option>
                    <option value="In Progress">In Progress (Active Work)</option>
                    <option value="Resolved">Resolved (Issues Fixed)</option>
                    <option value="Closed">Closed (Citizen Acknowledged)</option>
                  </Select>
                </FormGroup>

                {/* Officer Assignment selector */}
                <FormGroup label="Assign Field Officer">
                  <Select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="text-xs cursor-pointer h-9"
                  >
                    <option value="">-- Leave Unassigned --</option>
                    {officers.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name} ({off.role})
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                {/* Log Note entry input */}
                <FormGroup 
                  label="Timeline Operation Note" 
                  helperText="Add a note to log in the tracking timeline stepper (Optional)"
                >
                  <Textarea
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="e.g. Dispatched cleaning crew to Lane 3. Water main valve shut down temporarily."
                    className="text-xs min-h-[70px]"
                  />
                </FormGroup>

                {/* Operation Status messages */}
                {operationSuccess && (
                  <div className="p-2.5 rounded bg-success-light dark:bg-success-light/10 border border-success/30 text-[11px] text-success font-semibold flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <CheckCircle2 className="w-4 h-4" />
                    Dispatcher console synced successfully!
                  </div>
                )}

                {/* Apply Operations changes button */}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdating}
                  className="w-full text-xs font-semibold h-9 py-1.5 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Apply Simulator Changes
                </Button>

              </form>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
