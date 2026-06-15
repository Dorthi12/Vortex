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
  ChevronRight,
  ThumbsUp,
  MessageSquare,
  Award,
  Users,
  Bell,
  Eye,
  Check,
  Plus,
  Reply,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { useComplaintStore } from '@/store/useComplaintStore';
import { useUiStore } from '@/store/useUiStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label, Input, Textarea, Select, FormGroup } from '@/components/ui/form';
import { ComplaintStatus, Complaint, CommentThread, CommentReply } from '@/types/complaint';
import { cn } from '@/lib/utils';

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { 
    complaints, 
    officers, 
    updateComplaintStatus, 
    assignOfficer,
    supportIssue,
    verifyAffected,
    followIssue,
    addThreadedComment,
    addCommentReply,
    addOfficialResponse
  } = useComplaintStore();
  
  const { setActiveTab } = useUiStore();

  // Sync active sidebar item
  useEffect(() => {
    setActiveTab('Complaints');
  }, [setActiveTab]);

  // Find complaint
  const complaint = complaints.find((c) => c.id === id);

  // User session simulation (for demo interactions)
  const currentUserId = 'user-101';
  
  // Interactive Comment and Reply States
  const [commentText, setCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null);
  const [posterRole, setPosterRole] = useState<'citizen' | 'official'>('citizen');

  // Administrative Control States
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('Submitted');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [logNote, setLogNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [operationSuccess, setOperationSuccess] = useState(false);

  // Official Response Form States
  const [offResponseText, setOffResponseText] = useState('');
  const [selectedRespOfficerId, setSelectedRespOfficerId] = useState('');
  const [beforePhotoUrl, setBeforePhotoUrl] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  // Initialize administrative controls once complaint data is loaded
  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      setSelectedOfficerId(complaint.officer?.id || '');
      if (officers.length > 0) {
        setSelectedRespOfficerId(complaint.officer?.id || officers[0].id);
      }
    }
  }, [complaint, officers]);

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

  // Check user interaction states
  const hasSupported = complaint.supportedBy?.includes(currentUserId) || false;
  const hasVerified = complaint.affectedBy?.includes(currentUserId) || false;
  const hasFollowed = complaint.followedBy?.includes(currentUserId) || false;

  // Custom 6-stage Visual Resolution Timeline mapper
  const timelineStages = [
    { label: 'Filed', status: 'Submitted', desc: 'Grievance submitted by citizen' },
    { label: 'Under Review', status: 'Submitted', desc: 'Assigned to triage desk for routing' },
    { label: 'Assigned', status: 'Assigned', desc: 'Dispatched to field department officer' },
    { label: 'Work Started', status: 'In Progress', desc: 'Contractors or engineers on site' },
    { label: 'Inspection Completed', status: 'Resolved', desc: 'Quality inspection and testing' },
    { label: 'Resolved', status: 'Resolved', desc: 'Issue fully fixed and closed' }
  ];

  // Helper to determine the status level index
  const getTimelineStageIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'Submitted': return 1; // Under Review is active
      case 'Assigned': return 2; // Assigned is active
      case 'In Progress': return 3; // Work Started
      case 'Resolved': return 5; // Resolved
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const currentStageIndex = getTimelineStageIndex(complaint.status);

  // Get status badge styling
  const getStatusBadge = (status: ComplaintStatus) => {
    const styles = {
      Submitted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
      Assigned: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
      'In Progress': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-955/20 dark:text-purple-400 dark:border-purple-900/30',
      Resolved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-955/20 dark:text-green-400 dark:border-green-900/30',
      Closed: 'bg-slate-50 text-slate-655 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    };
    return (
      <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border', styles[status])}>
        {status}
      </span>
    );
  };

  // Timeline entry styling helper
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

  // Handlers for interactive actions
  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setOperationSuccess(false);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const updater = 'Desk Operator Jane';

    const prevOfficerId = complaint.officer?.id || '';
    if (selectedOfficerId && selectedOfficerId !== prevOfficerId) {
      assignOfficer(complaint.id, selectedOfficerId, updater);
    }

    if (selectedStatus !== complaint.status || logNote.trim() !== '') {
      const finalNote = logNote.trim() !== '' 
        ? logNote.trim() 
        : `Status modified from ${complaint.status} to ${selectedStatus}.`;
      updateComplaintStatus(complaint.id, selectedStatus, finalNote, updater);
    }

    setIsUpdating(false);
    setOperationSuccess(true);
    setLogNote('');
    setTimeout(() => setOperationSuccess(false), 3000);
  };

  // Post top-level comment
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const authorName = posterRole === 'official' ? 'Officer Amit Patel' : 'Jane Doe';
    const isOfficial = posterRole === 'official';

    addThreadedComment(complaint.id, authorName, commentText.trim(), isOfficial);
    setCommentText('');
  };

  // Post reply to a comment thread
  const handlePostReply = (commentId: string) => {
    const replyText = replyTextMap[commentId];
    if (!replyText || !replyText.trim()) return;

    const authorName = posterRole === 'official' ? 'Officer Amit Patel' : 'Jane Doe';
    const isOfficial = posterRole === 'official';

    addCommentReply(complaint.id, commentId, authorName, replyText.trim(), isOfficial);
    
    // Clear state
    setReplyTextMap({
      ...replyTextMap,
      [commentId]: ''
    });
    setActiveReplyBox(null);
  };

  // Post official response with before/after visual proof uploads
  const handlePostOfficialResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offResponseText.trim()) return;

    setIsSubmittingResponse(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const chosenOfficer = officers.find(o => o.id === selectedRespOfficerId) || officers[0];

    addOfficialResponse(complaint.id, {
      officerName: chosenOfficer.name,
      officerRole: chosenOfficer.role,
      department: chosenOfficer.department,
      content: offResponseText.trim(),
      beforePhotoUrl: beforePhotoUrl || undefined,
      afterPhotoUrl: afterPhotoUrl || undefined
    });

    // Automatically update SLA status to Resolved in timeline
    updateComplaintStatus(
      complaint.id, 
      'Resolved', 
      `Official Resolution logged by ${chosenOfficer.name}. Verification proof submitted.`, 
      chosenOfficer.name
    );

    setOffResponseText('');
    setBeforePhotoUrl('');
    setAfterPhotoUrl('');
    setIsSubmittingResponse(false);
    setResponseSuccess(true);
    setTimeout(() => setResponseSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[1400px] mx-auto">
      
      {/* Top Breadcrumbs & ID header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1228] border border-[#1A2744] p-4 rounded-xl shadow-lg">
        <Link 
          href="/complaints" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#4682B4]" />
          Back to Grievances Directory
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest text-[#D4AF37] font-black uppercase bg-[#D4AF37]/10 px-2.5 py-1 rounded border border-[#D4AF37]/25">
            CLASSIFIED OPERATIONAL VIEW
          </span>
          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded border border-[#1A2744]">
            ID: {complaint.id}
          </span>
        </div>
      </div>

      {/* Main Details and Core Info */}
      <div className="bg-[#0A1228] border border-[#1A2744] rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[#1A2744] bg-slate-950/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-[#4682B4] font-black">
                {complaint.category}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-bold bg-[#1A2744]/40 px-2 py-0.5 rounded border border-[#1A2744]">
                {complaint.department}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              {complaint.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0 bg-slate-900/50 p-2.5 rounded-lg border border-[#1A2744]">
            <span className="text-xs text-slate-400 font-medium">SLA Status:</span>
            {getStatusBadge(complaint.status)}
          </div>
        </div>

        {/* Citizen Information Row */}
        <div className="px-6 py-4 bg-[#0A1228] flex flex-wrap items-center justify-between gap-4 border-b border-[#1A2744]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1A3A6C] border border-[#D4AF37]/45 flex items-center justify-center text-white text-sm font-black uppercase shadow-inner">
              {complaint.citizenName?.substring(0, 2) || 'AN'}
            </div>
            <div>
              <span className="text-xs font-bold block text-white">{complaint.citizenName || 'Anonymous Citizen'}</span>
              <span className="text-[10px] text-slate-400 font-medium">Ward: Pune Central • District: Pune Metro</span>
            </div>
          </div>

          {/* Social Interactions Stats Summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-[#1A2744]">
              <ThumbsUp className="w-3.5 h-3.5 text-[#4682B4]" />
              <span>{complaint.supportCount} Supports</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-[#1A2744]">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{complaint.affectedCount} Affected</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-[#1A2744]">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>{complaint.followCount} Followers</span>
            </div>
          </div>
        </div>

        {/* Community Engagement Buttons Row */}
        <div className="px-6 py-4 bg-[#070D1A] flex flex-wrap items-center gap-3">
          <Button
            onClick={() => supportIssue(complaint.id, currentUserId)}
            variant={hasSupported ? 'primary' : 'outline'}
            className={cn(
              "text-xs font-bold gap-2 transition-transform active:scale-95",
              hasSupported ? "bg-[#4682B4] hover:bg-[#4682B4]/80 text-white" : "border-[#1A2744] text-slate-300 hover:text-white"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", hasSupported && "fill-current")} />
            {hasSupported ? 'Supported Issue' : 'Support Issue'}
          </Button>

          <Button
            onClick={() => verifyAffected(complaint.id, currentUserId)}
            variant={hasVerified ? 'primary' : 'outline'}
            className={cn(
              "text-xs font-bold gap-2 transition-transform active:scale-95",
              hasVerified ? "bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-extrabold" : "border-[#1A2744] text-slate-300 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            {hasVerified ? 'Verified as Affected' : 'I am Affected'}
          </Button>

          <Button
            onClick={() => followIssue(complaint.id, currentUserId)}
            variant={hasFollowed ? 'primary' : 'outline'}
            className={cn(
              "text-xs font-bold gap-2 transition-transform active:scale-95",
              hasFollowed ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-[#1A2744] text-slate-300 hover:text-white"
            )}
          >
            <Bell className="w-4 h-4" />
            {hasFollowed ? 'Following Updates' : 'Follow Issue'}
          </Button>
        </div>
      </div>

      {/* Visual Resolution Timeline Stepper */}
      <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#1A2744] bg-slate-950/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Visual Resolution Timeline
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Live automated updates of municipal tracking milestones
            </CardDescription>
          </div>
          <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>STAGE: {currentStageIndex + 1}/6</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Timeline Process Line Map */}
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-4 mt-2">
            
            {/* Background Line Connector for desktop */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1A2744] -translate-y-1/2 hidden lg:block -z-0" />

            {timelineStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isActive = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;

              return (
                <div key={idx} className="flex lg:flex-col items-center gap-4 lg:gap-3 z-10 w-full lg:w-1/6 relative">
                  
                  {/* Step bubble icon marker */}
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-305 font-extrabold text-sm",
                    isCompleted && "bg-emerald-950/40 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-950/50",
                    isActive && "bg-[#1A3A6C] text-[#D4AF37] border-[#D4AF37] animate-pulse ring-2 ring-[#D4AF37]/30",
                    isPending && "bg-slate-905 text-slate-600 border-[#1A2744]"
                  )}>
                    {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>

                  {/* Label Text block */}
                  <div className="text-left lg:text-center space-y-0.5">
                    <span className={cn(
                      "block text-xs font-extrabold uppercase tracking-wide",
                      isCompleted && "text-emerald-400",
                      isActive && "text-[#D4AF37]",
                      isPending && "text-slate-500"
                    )}>
                      {stage.label}
                    </span>
                    <span className="block text-[10px] text-slate-400 leading-normal max-w-[140px]">
                      {stage.desc}
                    </span>
                  </div>
                </div>
              );
            })}

          </div>
        </CardContent>
      </Card>

      {/* Main Grid Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: OFFICIAL RESPONSES & DETAILS */}
        {/* ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Official Response & Proof Verification Section */}
          <Card className="bg-[#0A1228] border border-emerald-500/30 shadow-lg border-l-4 border-l-emerald-555">
            <CardHeader className="pb-3 border-b border-[#1A2744] bg-emerald-950/10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                    Official Resolution Proof & Responses
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Verified municipal feedback with photographic evidence
                  </CardDescription>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                VERIFIED GOV
              </span>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {complaint.officialResponses.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <BadgeAlert className="w-8 h-8 text-[#D4AF37] mx-auto opacity-75" />
                  <p className="text-xs font-bold">No official response logged yet.</p>
                  <p className="text-[10px] max-w-sm mx-auto">
                    Assigned officers will upload visual before/after proofs and resolutions details here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {complaint.officialResponses.map((response) => (
                    <div key={response.id} className="p-4 bg-emerald-950/20 border border-emerald-900/35 rounded-xl space-y-4">
                      
                      {/* Officer header info */}
                      <div className="flex items-center justify-between border-b border-emerald-900/30 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs">
                            GOV
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-white block">{response.officerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{response.officerRole} • {response.department}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#4682B4]" />
                          {new Date(response.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Official Text response */}
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/45 p-3 rounded-lg border border-emerald-900/30">
                        {response.content}
                      </p>

                      {/* Before / After Photo verification panels */}
                      {(response.beforePhotoUrl || response.afterPhotoUrl) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-900/35 pt-4">
                          
                          {/* Before Image */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] uppercase font-bold text-rose-450 tracking-wider">Before Fixing</span>
                            <div className="aspect-video relative rounded-lg bg-slate-900 overflow-hidden border border-rose-950/40 flex items-center justify-center">
                              {response.beforePhotoUrl ? (
                                <img src={response.beforePhotoUrl} alt="Before cleanup/repair" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-[10px] text-slate-500 flex flex-col items-center justify-center">
                                  <FileImage className="w-6 h-6 mb-1 opacity-50" />
                                  No before image provided
                                </div>
                              )}
                              <span className="absolute bottom-2 left-2 text-[9px] uppercase font-black bg-rose-950/80 text-rose-450 px-2 py-0.5 rounded border border-rose-800">
                                REPORTED STATE
                              </span>
                            </div>
                          </div>

                          {/* After Image */}
                          <div className="space-y-1.5">
                            <span className="block text-[10px] uppercase font-bold text-emerald-400 tracking-wider">After Resolution</span>
                            <div className="aspect-video relative rounded-lg bg-slate-900 overflow-hidden border border-emerald-955/40 flex items-center justify-center">
                              {response.afterPhotoUrl ? (
                                <img src={response.afterPhotoUrl} alt="After cleanup/repair" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-[10px] text-slate-500 flex flex-col items-center justify-center">
                                  <FileImage className="w-6 h-6 mb-1 opacity-50" />
                                  No completion photo provided
                                </div>
                              )}
                              <span className="absolute bottom-2 left-2 text-[9px] uppercase font-black bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                                COMPLETED STATE
                              </span>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>

          {/* 2. Details Summary & Description */}
          <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg">
            <CardHeader className="pb-3 border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Incident Details & Mapping</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Summary</Label>
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/45 p-4 rounded-lg border border-[#1A2744]">
                  {complaint.description}
                </p>
              </div>

              {/* Geographic mapping */}
              <div className="flex items-start gap-3 bg-slate-950/30 p-4 rounded-lg border border-[#1A2744]">
                <div className="h-9 w-9 rounded bg-[#1A3A6C] flex items-center justify-center shrink-0 text-[#D4AF37] border border-[#D4AF37]/20">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Registered Location Address</span>
                  <span className="text-xs font-bold text-white block">{complaint.location}</span>
                  {complaint.coordinates && (
                    <span className="block text-[10px] text-[#4682B4] font-mono mt-0.5">
                      GPS coordinates grid map node: Lat {18.52 + (complaint.coordinates.x * 0.001)}, Lng {73.85 + (complaint.coordinates.y * 0.001)}
                    </span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 3. Uploaded Media Evidence Panel */}
          <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg">
            <CardHeader className="pb-3 border-b border-[#1A2744]">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Uploaded Evidence Media</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Photo Evidence */}
                <div className="border border-[#1A2744] bg-[#070D1A] rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="aspect-video relative bg-slate-955/80 flex items-center justify-center overflow-hidden">
                    {complaint.photoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-450 p-4 relative group">
                        <FileImage className="w-10 h-10 text-[#4682B4] mb-2" />
                        <span className="text-xs font-bold text-white truncate max-w-[220px]">{complaint.photoName || 'evidence_attachment.jpg'}</span>
                        <span className="text-[10px] text-slate-500">Citizen Uploaded Image</span>
                      </div>
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center justify-center text-xs">
                        <FileImage className="w-8 h-8 mb-2 opacity-30" />
                        No photo attachment uploaded
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-[#1A2744] bg-[#0A1228] flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold truncate max-w-[180px]">{complaint.photoName || 'No Photo Logged'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">JPEG IMAGE</span>
                  </div>
                </div>

                {/* Video Evidence */}
                <div className="border border-[#1A2744] bg-[#070D1A] rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="aspect-video relative bg-slate-955/80 flex items-center justify-center overflow-hidden">
                    {complaint.videoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-450 p-4 relative">
                        <FileVideo className="w-10 h-10 text-[#4682B4] mb-2" />
                        <span className="text-xs font-bold text-white truncate max-w-[220px]">{complaint.videoName || 'evidence_clip.mp4'}</span>
                        <span className="text-[10px] text-slate-500">Citizen Uploaded Video</span>
                      </div>
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center justify-center text-xs">
                        <FileVideo className="w-8 h-8 mb-2 opacity-30" />
                        No video attachment uploaded
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-[#1A2744] bg-[#0A1228] flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold truncate max-w-[180px]">{complaint.videoName || 'No Video Logged'}</span>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">MP4 VIDEO</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* 4. Threaded Comments & Replies Section */}
          <Card className="bg-[#0A1228] border border-[#1A2744] shadow-lg">
            <CardHeader className="pb-3 border-b border-[#1A2744] bg-slate-955/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Threaded Community Comments
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Discuss grievance priority, affected wards and community coordination
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                  <MessageSquare className="w-4 h-4 text-[#4682B4]" />
                  <span>{complaint.comments?.length || 0} Discussions</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Commenter Role selection simulation */}
              <div className="flex items-center gap-3 bg-slate-955/30 p-2.5 rounded-lg border border-[#1A2744] mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comment Persona:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPosterRole('citizen')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded font-bold transition-all",
                      posterRole === 'citizen' ? "bg-[#1A3A6C] text-[#D4AF37] border border-[#D4AF37]/30" : "text-slate-550 hover:text-slate-300"
                    )}
                  >
                    Citizen (Jane Doe)
                  </button>
                  <button 
                    onClick={() => setPosterRole('official')}
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded font-bold transition-all",
                      posterRole === 'official' ? "bg-emerald-955 text-emerald-400 border border-emerald-800" : "text-slate-550 hover:text-slate-300"
                    )}
                  >
                    Official (Amit Patel)
                  </button>
                </div>
              </div>

              {/* Post New Top-level Comment form */}
              <form onSubmit={handlePostComment} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#1A2744] flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 select-none">
                  JD
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ask a question or report status updates..."
                    className="text-xs bg-[#070D1A] border-[#1A2744] h-9"
                  />
                  <Button type="submit" variant="primary" className="h-9 px-4 shrink-0 text-xs font-bold gap-1 bg-[#4682B4] hover:bg-[#4682B4]/85 text-white border-0">
                    <Send className="w-3.5 h-3.5" />
                    Comment
                  </Button>
                </div>
              </form>

              {/* Comment Thread List */}
              <div className="space-y-4">
                {complaint.comments?.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4">No comments posted yet. Start the conversation!</p>
                ) : (
                  complaint.comments?.map((comment) => (
                    <div key={comment.id} className={cn(
                      "p-3 rounded-xl border space-y-3",
                      comment.isOfficial 
                        ? "bg-emerald-955/10 border-emerald-900/30" 
                        : "bg-[#070D1A]/50 border-[#1A2744]"
                    )}>
                      {/* Comment Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-white">{comment.authorName}</span>
                          {comment.isOfficial && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-955 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
                              Official Response
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          {new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Comment text content */}
                      <p className="text-xs text-slate-350 leading-relaxed font-sans">{comment.content}</p>

                      {/* Reply action triggers */}
                      <div className="flex items-center gap-3 border-t border-slate-900/50 pt-2 text-[10px] text-slate-500">
                        <button 
                          onClick={() => setActiveReplyBox(activeReplyBox === comment.id ? null : comment.id)}
                          className="hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Reply className="w-3 h-3 text-[#4682B4]" />
                          Reply
                        </button>
                        <span>•</span>
                        <span>{comment.replies?.length || 0} replies</span>
                      </div>

                      {/* Nested Replies List */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-4 border-l border-[#1A2744] space-y-3 mt-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className={cn(
                              "p-2.5 rounded-lg border",
                              reply.isOfficial 
                                ? "bg-emerald-955/10 border-emerald-900/20" 
                                : "bg-slate-955/20 border-slate-900"
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white">{reply.authorName}</span>
                                  {reply.isOfficial && (
                                    <span className="inline-flex items-center text-[8px] font-black bg-emerald-955 text-emerald-400 border border-emerald-900 px-1 rounded uppercase tracking-widest">
                                      Official
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(reply.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nested Reply Input form */}
                      {activeReplyBox === comment.id && (
                        <div className="flex gap-2 pl-4 border-l border-[#1A2744] animate-in fade-in slide-in-from-top-1 duration-200">
                          <Input
                            value={replyTextMap[comment.id] || ''}
                            onChange={(e) => setReplyTextMap({ ...replyTextMap, [comment.id]: e.target.value })}
                            placeholder={`Reply to ${comment.authorName}...`}
                            className="text-xs bg-slate-955 border-[#1A2744] h-8"
                          />
                          <Button 
                            onClick={() => handlePostReply(comment.id)}
                            variant="primary" 
                            className="h-8 px-3 shrink-0 text-xs font-bold bg-[#4682B4] text-white"
                          >
                            Send
                          </Button>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: WORKFLOWS, ADMIN SIMULATOR   */}
        {/* ========================================== */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Technical Field Officer details */}
          <Card className={cn(
            'bg-[#0A1228] border border-[#1A2744] shadow-lg border-l-4',
            complaint.officer ? 'border-l-emerald-500' : 'border-l-amber-500'
          )}>
            <CardHeader className="pb-3 border-b border-[#1A2744] bg-slate-955/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Assigned Dispatcher Info</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {complaint.officer ? (
                <div className="space-y-4">
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                      <UserCheck className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{complaint.officer.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{complaint.officer.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-[#1A2744] pt-3 text-slate-350">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#4682B4] shrink-0" />
                      <span className="truncate">Ministry: <strong>{complaint.officer.department}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#4682B4] shrink-0" />
                      <span>Dispatch Phone: <strong>{complaint.officer.phone}</strong></span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`tel:${complaint.officer?.phone}`)}
                    className="w-full text-xs font-bold py-1.5 h-9 mt-2 border-[#1A2744] text-slate-300 hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" />
                    Call Officer Hotline
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 text-[#D4AF37] mx-auto animate-pulse">
                    <BadgeAlert className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Pending Technical Dispatch</h4>
                    <p className="text-[10px] text-slate-500 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                      No administrative field officer has been assigned to this report. Use the simulator control below to route.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Submit Official Resolution Proof form */}
          <Card className="bg-[#0A1228] border border-emerald-500/30 shadow-lg">
            <CardHeader className="pb-3 border-b border-[#1A2744] bg-emerald-955/15">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Submit Official Resolution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Log official resolution with before/after visual proof mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handlePostOfficialResponse} className="space-y-4">
                
                <FormGroup label="Responding Official">
                  <Select
                    value={selectedRespOfficerId}
                    onChange={(e) => setSelectedRespOfficerId(e.target.value)}
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white h-9"
                  >
                    {officers.map((off) => (
                      <option key={off.id} value={off.id} className="bg-[#0A1228] text-white">
                        {off.name} ({off.role})
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup label="Resolution Text Proof" required>
                  <Textarea
                    value={offResponseText}
                    onChange={(e) => setOffResponseText(e.target.value)}
                    placeholder="Summarize visual repair proofs, engineering clearances..."
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white min-h-[75px]"
                    required
                  />
                </FormGroup>

                <FormGroup 
                  label="Before Photo URL (Simulated)" 
                  helperText="Simulated photo path before fixing (e.g. image of leak)"
                >
                  <Input
                    value={beforePhotoUrl}
                    onChange={(e) => setBeforePhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1542013936693-8848e57b4373?w=500"
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white h-9"
                  />
                </FormGroup>

                <FormGroup 
                  label="After Photo URL (Simulated)" 
                  helperText="Simulated photo path after fixing (e.g. fixed pipes)"
                >
                  <Input
                    value={afterPhotoUrl}
                    onChange={(e) => setAfterPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=500"
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white h-9"
                  />
                </FormGroup>

                {responseSuccess && (
                  <div className="p-2.5 rounded bg-emerald-955/40 border border-emerald-500/30 text-[10px] text-emerald-400 font-extrabold flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Resolution logged! SLA updated to Resolved.
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmittingResponse}
                  className="w-full text-xs font-bold h-9 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Publish Resolution Proof
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* 3. Municipal Operator SLA Simulator */}
          <Card className="bg-[#0A1228] border border-[#1A2744] shadow-md border-t-2 border-t-[#4682B4]">
            <CardHeader className="pb-3 border-b border-[#1A2744] bg-slate-955/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#4682B4]">
                Municipal SLA Simulator
              </CardTitle>
              <CardDescription className="text-[10px] text-slate-500">
                Administrative dispatcher controls to adjust metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleApplyChanges} className="space-y-4">
                
                <FormGroup label="Transition SLA Status">
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white h-9"
                  >
                    <option value="Submitted" className="bg-[#0A1228] text-white">Submitted (Pending Action)</option>
                    <option value="Assigned" className="bg-[#0A1228] text-white">Assigned (Officer Assigned)</option>
                    <option value="In Progress" className="bg-[#0A1228] text-white">In Progress (Active Work)</option>
                    <option value="Resolved" className="bg-[#0A1228] text-white">Resolved (Issues Fixed)</option>
                    <option value="Closed" className="bg-[#0A1228] text-white">Closed (Citizen Acknowledged)</option>
                  </Select>
                </FormGroup>

                <FormGroup label="Assign Field Officer">
                  <Select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white h-9"
                  >
                    <option value="" className="bg-[#0A1228] text-white">-- Leave Unassigned --</option>
                    {officers.map((off) => (
                      <option key={off.id} value={off.id} className="bg-[#0A1228] text-white">
                        {off.name} ({off.role})
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup 
                  label="Timeline Operation Note" 
                  helperText="Add a note to log in the tracking timeline stepper"
                >
                  <Textarea
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Dispatched maintenance crews, valve calibrations active..."
                    className="text-xs bg-[#070D1A] border-[#1A2744] text-white min-h-[70px]"
                  />
                </FormGroup>

                {operationSuccess && (
                  <div className="p-2.5 rounded bg-blue-955/40 border border-blue-900/30 text-[10px] text-blue-450 font-bold flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4682B4]" />
                    Dispatcher console synchronized!
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdating}
                  className="w-full text-xs font-bold h-9 bg-[#4682B4] hover:bg-[#4682B4]/85 text-white cursor-pointer"
                >
                  Sync Dispatch Controls
                </Button>

              </form>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
