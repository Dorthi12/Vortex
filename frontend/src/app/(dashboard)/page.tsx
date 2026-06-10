'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CloudSun, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  Send, 
  Search, 
  HeartPulse, 
  Sprout, 
  FileText, 
  ShieldAlert, 
  X, 
  Check, 
  ArrowRight,
  Map,
  Layers,
  HelpCircle,
  TrendingUp,
  MessageSquareCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Label, Input, Textarea, Select, FormGroup } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/useUiStore';

// Mock Interfaces
interface MapResource {
  id: string;
  name: string;
  type: 'clinic' | 'emergency' | 'ration' | 'waste';
  coords: { x: number; y: number };
  details: string;
  phone: string;
}

interface Scheme {
  id: string;
  name: string;
  ministry: string;
  desc: string;
  eligibility: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

// Mock Datasets
const MOCK_RESOURCES: MapResource[] = [
  { id: 'res-1', name: 'Sector 4B Primary Clinic', type: 'clinic', coords: { x: 30, y: 45 }, details: 'OPD open 9 AM - 6 PM. Free diagnostic services available.', phone: '020-2567891' },
  { id: 'res-2', name: 'Pune Civil Hospital', type: 'clinic', coords: { x: 70, y: 35 }, details: '24/7 Trauma and emergency ward. Multi-specialty care.', phone: '020-2567000' },
  { id: 'res-3', name: 'Sector 4B Fire Station', type: 'emergency', coords: { x: 45, y: 70 }, details: 'Disaster response unit and 3 active fire engines.', phone: '020-2567101' },
  { id: 'res-4', name: 'Ward 12 Ration Store', type: 'ration', coords: { x: 20, y: 25 }, details: 'Distributes pulses, sugar, and foodgrains. Open 10 AM - 5 PM.', phone: '020-2567543' },
  { id: 'res-5', name: 'Municipal Waste Depot', type: 'waste', coords: { x: 80, y: 75 }, details: 'Waste segregation plant and collection truck hub.', phone: '020-2567990' },
];

const MOCK_SCHEMES: Scheme[] = [
  { id: 'sch-1', name: 'PM Awas Yojana (Urban)', ministry: 'Ministry of Housing', desc: 'Direct financial subsidy of up to ₹2.67 Lakhs for purchasing or constructing affordable first-time homes.', eligibility: 'Annual family income under ₹18 Lakhs. No existing pucca house.' },
  { id: 'sch-2', name: 'PM Fasal Bima Yojana', ministry: 'Ministry of Agriculture', desc: 'Comprehensive yield insurance coverage against non-preventable natural risks during crop lifecycle.', eligibility: 'All landholding farmers growing notified crops in scheduled areas.' },
  { id: 'sch-3', name: 'Ayushman Bharat Card', ministry: 'Ministry of Health', desc: 'Provides free secondary and tertiary hospitalization cover of up to ₹5 Lakhs per family per year.', eligibility: 'Identified households under Socio-Economic Caste Census data.' },
];

const PREDEFINED_BOT_RESPONSES = [
  { keywords: ['water', 'flood', 'drain', 'leak'], response: 'To report water logging or pipe leaks: 1. Click "File Incident Report" in the bottom datagrid section. 2. Select the "Water Supply" sector. 3. Input Sector 4B and submit. Municipal engineers are dispatched within 2 hours under active SLA.' },
  { keywords: ['crop', 'agri', 'sow', 'seed'], response: 'Current agricultural advisories for Pune District: Suspend watering for the next 24 hours as IMD forecasts rains. Optimal sowing crops for this week are rice seedlings, groundnuts, and cotton. Fertilizers can be purchased at subsided rates from the Sector 4B cooperative.' },
  { keywords: ['scheme', 'awas', 'fasal', 'insurance'], response: 'You can check government scheme eligibility directly from the bottom schemes list on your dashboard. Simply click "Apply Now" next to PM Awas Yojana or PM Fasal Bima to check requirements and submit a mock application instantly.' },
  { keywords: ['emergency', 'hospital', 'fire', 'ambulance'], response: 'For emergencies: call the consolidated helpline 112 immediately. You can view nearby emergency vehicles and clinics on the interactive Sector Resource Map widget. Clicking any marker reveals direct phone links.' }
];

export default function CitizenDashboard() {
  const { setActiveTab } = useUiStore();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const auth = localStorage.getItem('citizen_authenticated') === 'true';
    if (!auth) {
      router.replace('/welcome');
    } else {
      setIsAuthenticated(true);
      setActiveTab('Dashboard');
    }
  }, [router, setActiveTab]);

  // States
  const [mapFilter, setMapFilter] = useState<'all' | 'clinic' | 'emergency' | 'ration' | 'waste'>('all');
  const [selectedResource, setSelectedResource] = useState<MapResource | null>(MOCK_RESOURCES[0]);
  const [applyScheme, setApplyScheme] = useState<Scheme | null>(null);
  const [schemeApplied, setSchemeApplied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'ai', text: 'Namaste! I am the NETRAVAAH AI Assistant. Ask me about weather risks, government schemes, or how to report local grievances.', time: '08:30 AM' }
  ]);

  // Handle resource selection
  const handleResourceClick = (resource: MapResource) => {
    setSelectedResource(resource);
  };

  // Filtered Map Resources
  const filteredResources = mapFilter === 'all' 
    ? MOCK_RESOURCES 
    : MOCK_RESOURCES.filter(r => r.type === mapFilter);

  // Scheme Application handling
  const handleSchemeApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSchemeApplied(true);
    setTimeout(() => {
      setSchemeApplied(false);
      setApplyScheme(null);
    }, 1500);
  };

  // AI Chatbot Logic
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsChatLoading(false);
      
      // Look for keywords match
      const query = userText.toLowerCase();
      let responseText = "Thank you for query. I have logged your question for municipal coordination. For specific guidance, try typing keywords like: 'water', 'crop', 'scheme', or 'emergency'.";

      for (const item of PREDEFINED_BOT_RESPONSES) {
        if (item.keywords.some(keyword => query.includes(keyword))) {
          responseText = item.response;
          break;
        }
      }

      const aiMsg: ChatMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }, 1200);
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 border-4 border-royal-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-neutral-text-muted">Authenticating credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP SECTION: WELCOME BANNER, LOCATION, WEATHER, RISK STATUS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Banner Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-white dark:bg-gov-navy text-slate-800 dark:text-neutral-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[180px] border-l-4 border-l-persian-blue">
          {/* Background blurs using brand colors */}
          <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-royal-blue/10 dark:bg-royal-blue/15 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[15rem] h-[15rem] bg-brand-yellow/10 dark:bg-brand-yellow/10 rounded-full blur-[60px] -ml-24 -mb-24 pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-[12rem] h-[12rem] bg-success/5 dark:bg-success/10 rounded-full blur-[50px] pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-brand-yellow border border-amber-200 dark:border-amber-900/50 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">
                Citizen Portal Hub
              </span>
              <span className="bg-success-light dark:bg-success-light/10 text-success dark:text-green-400 border border-success/20 dark:border-success/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success dark:bg-green-400 animate-pulse" />
                Profile Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
              <span className="text-royal-blue dark:text-royal-blue-light">Namaste,</span>{' '}
              <span className="text-green-800 dark:text-green-400 font-extrabold animate-in fade-in">Jane Doe</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Your profile is verified. Access real-time agricultural advisories, report local civic complaints, monitor climate risks, and track welfare schemes.
            </p>
          </div>
          
          <div className="relative z-10 pt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 mt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success dark:bg-green-400 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">SLA Link: Active</span>
            </div>
            <span>•</span>
            <span>Last Sync: Just Now</span>
            <span>•</span>
            <span>Ref: IN-78401-4B</span>
          </div>
        </div>

        {/* Location & Weather & Risk Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-3">
          {/* Location & Weather Widget */}
          <Card className="flex items-center p-4 gap-4 bg-card border-border-subtle shadow-xs">
            <div className="h-12 w-12 rounded-full bg-royal-blue/10 flex items-center justify-center shrink-0">
              <CloudSun className="w-6 h-6 text-royal-blue" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-text-muted">
                <MapPin className="w-3.5 h-3.5 text-royal-blue" />
                <span>Sector 4B • Pune, MH</span>
              </div>
              <h4 className="text-base font-bold">29°C • Humid Rain</h4>
              <p className="text-[10px] text-neutral-text-muted leading-none">
                IMD Advises: Rain showers expected by noon
              </p>
            </div>
          </Card>

          {/* Municipal Risk Status dials */}
          <Card className="p-4 bg-card border-border-subtle shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-text-muted">Municipal Risk Index</h4>
              <span className="text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">Safe Tier</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-neutral-text">84 AQI</span>
                <span className="text-[9px] text-neutral-text-muted">Air Quality</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-success">Low</span>
                <span className="text-[9px] text-neutral-text-muted">Flood Risk</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="block text-xs font-bold text-neutral-text">12%</span>
                <span className="text-[9px] text-neutral-text-muted">Grid Surcharge</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE SECTION: CURRENT ALERTS, RECOMMENDATIONS, INTERACTIVE MAP */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts & Recommendations */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Current Alerts */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-text-muted">Active Civic Warnings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1">
              <Alert variant="warning" title="Heavy Rainfall Forecasted">
                IMD warns of 80mm heavy showers within 12h. Stay indoors.
              </Alert>
              <Alert variant="info" title="Power Grid Tuning scheduled">
                Substation 4B maintenance tomorrow 2 AM - 4 AM.
              </Alert>
            </CardContent>
          </Card>

          {/* Dual Recommendations (Health & Agri) */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-text-muted">Sector-specific Advisory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {/* Health */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-success-light flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4.5 h-4.5 text-success" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-neutral-text">Health: Vector Protection</h5>
                  <p className="text-[11px] text-neutral-text-muted leading-relaxed">
                    Prevent standing water pools around storage tanks. Dengue vaccine drives are open at Ward Clinic.
                  </p>
                </div>
              </div>

              {/* Agriculture */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-info-light flex items-center justify-center shrink-0">
                  <Sprout className="w-4.5 h-4.5 text-info" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-neutral-text">Agri: Irrigation Alert</h5>
                  <p className="text-[11px] text-neutral-text-muted leading-relaxed">
                    Suspend irrigation watering cycles ahead of heavy rains. Ideal planting window open for Rice seedlings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Resource Locator Map */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle>Sector Resource Locator</CardTitle>
              <CardDescription>Locate clinics, ration shops, and disaster units in Pune Sector 4B</CardDescription>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['all', 'clinic', 'emergency', 'ration', 'waste'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMapFilter(type)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-semibold rounded-md uppercase tracking-wider transition-all cursor-pointer',
                    mapFilter === type 
                      ? 'bg-white dark:bg-slate-900 text-royal-blue shadow-xs font-bold' 
                      : 'text-neutral-text-muted hover:text-neutral-text'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* Interactive SVG Map Card */}
            <div className="md:col-span-2 relative h-[240px] border border-border bg-slate-50 dark:bg-slate-900/60 rounded-lg overflow-hidden flex items-center justify-center">
              
              {/* Map grid lines */}
              <svg className="absolute inset-0 w-full h-full text-slate-200 dark:text-slate-800/80 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Simulated contour road routes */}
                <path d="M 10 50 Q 50 120 150 150 T 300 200" fill="none" stroke="rgba(15, 76, 129, 0.15)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 200 10 Q 150 130 50 220" fill="none" stroke="rgba(15, 76, 129, 0.15)" strokeWidth="6" strokeLinecap="round" />
              </svg>

              {/* Map Indicators */}
              {filteredResources.map((res) => {
                const isSelected = selectedResource?.id === res.id;
                
                const typeColors = {
                  clinic: 'bg-success border-success-light',
                  emergency: 'bg-danger border-danger-light',
                  ration: 'bg-brand-yellow border-brand-yellow-light',
                  waste: 'bg-info border-info-light'
                };

                return (
                  <button
                    key={res.id}
                    onClick={() => handleResourceClick(res)}
                    className={cn(
                      'absolute h-4 w-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 z-10 animate-in fade-in',
                      typeColors[res.type],
                      isSelected && 'ring-4 ring-royal-blue/30 scale-125 z-20'
                    )}
                    style={{ left: `${res.coords.x}%`, top: `${res.coords.y}%` }}
                    title={res.name}
                  />
                );
              })}
              
              {/* Legend overlay info */}
              <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded text-[9px] font-bold border border-border-subtle flex gap-3 text-neutral-text-muted">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Clinic</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> Emergency</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-brand-yellow" /> Ration</span>
              </div>
            </div>

            {/* Selected resource detailed card */}
            <div className="md:col-span-1 flex flex-col justify-between border border-border-subtle bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg space-y-4">
              {selectedResource ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest text-white ${
                      selectedResource.type === 'clinic' ? 'bg-success' : 
                      selectedResource.type === 'emergency' ? 'bg-danger' : 
                      selectedResource.type === 'ration' ? 'bg-brand-yellow text-slate-900' : 'bg-info'
                    }`}>
                      {selectedResource.type}
                    </span>
                    <h4 className="text-sm font-bold text-neutral-text leading-tight">{selectedResource.name}</h4>
                    <p className="text-xs text-neutral-text-muted leading-relaxed">{selectedResource.details}</p>
                  </div>

                  <div className="space-y-2 border-t border-t-border-subtle pt-3 text-xs mt-auto">
                    <div className="flex justify-between items-center text-neutral-text-muted">
                      <span>Phone Hotline:</span>
                      <strong className="text-neutral-text">{selectedResource.phone}</strong>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`tel:${selectedResource.phone}`)}
                      className="w-full flex items-center justify-center gap-1.5 text-[11px] py-1 h-8 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Contact Operator
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-xs text-neutral-text-muted">
                  Click on map marker node to review details
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: COMPLAINTS STATUS, SCHEMES, AI CHATBOT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Area: Complaints & Resolution Performance Chart */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* My Complaints Grid */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle>My Filed Grievances</CardTitle>
              <CardDescription>Track status logs of reported civic incidents</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead>Current Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-neutral-text">Refuse accumulation Sector 4</TableCell>
                    <TableCell className="text-xs text-neutral-text-muted">2026-06-08</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-warning-light text-warning border border-warning/20">
                        In Progress
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-neutral-text">Power transformer sparks</TableCell>
                    <TableCell className="text-xs text-neutral-text-muted">2026-06-05</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-success-light text-success border border-success/20">
                        Resolved
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-xs text-neutral-text">Water main pipe leakage</TableCell>
                    <TableCell className="text-xs text-neutral-text-muted">2026-06-09</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-info-light text-info border border-info/20">
                        Investigating
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance chart */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SLA Grievance Resolution</CardTitle>
                  <CardDescription>Municipal grievances solved within 24 hours</CardDescription>
                </div>
                <TrendingUp className="w-5 h-5 text-success shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-2">
              {/* Custom SVG Line Chart */}
              <div className="h-[140px] w-full flex items-center justify-center relative bg-slate-50 dark:bg-slate-900/30 border border-slate-100 rounded-lg p-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                  {/* Grid Lines */}
                  <line x1="10" y1="90" x2="190" y2="90" stroke="#E2E8F0" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="190" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
                  <line x1="10" y1="10" x2="190" y2="10" stroke="#F1F5F9" strokeWidth="0.5" strokeDasharray="2" />
                  
                  {/* Chart Line Path (Resolution rates from 82% to 97%) */}
                  <path 
                    d="M 10 75 L 46 65 L 82 55 L 118 42 L 154 30 L 190 15" 
                    fill="none" 
                    stroke="#0F4C81" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  
                  {/* Data Point Dots */}
                  <circle cx="10" cy="75" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="46" cy="65" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="82" cy="55" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="118" cy="42" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="154" cy="30" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="190" cy="15" r="3.5" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  
                  {/* Text labels */}
                  <text x="10" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Jan</text>
                  <text x="46" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Feb</text>
                  <text x="82" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Mar</text>
                  <text x="118" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Apr</text>
                  <text x="154" y="98" fontSize="7" fill="#64748B" textAnchor="middle">May</text>
                  <text x="190" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Jun</text>

                  <text x="190" y="10" fontSize="7" fill="#16A34A" fontWeight="bold" textAnchor="end">97% Max</text>
                </svg>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-t-border-subtle pt-3 mt-3">
                <span className="text-neutral-text-muted">Target Response SLA Rate:</span>
                <span className="font-bold text-success">95% Required (97% Actual)</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Area: Emergency Speed Dial */}
        <Card className="xl:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>Immediate speed dials for public welfare assistance</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 flex-1 pt-1">
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex flex-col justify-between min-h-[90px]">
              <span className="text-xs font-bold text-danger">Unified Helpline</span>
              <h4 className="text-xl font-bold font-sans text-danger">112</h4>
              <span className="text-[9px] text-neutral-text-muted">National Rescue</span>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-800 p-2.5 border border-border-subtle rounded-lg flex flex-col justify-between min-h-[90px]">
              <span className="text-xs font-bold text-neutral-text">Ambulance Cell</span>
              <h4 className="text-xl font-bold font-sans text-neutral-text">102</h4>
              <span className="text-[9px] text-neutral-text-muted">Medical dispatch</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 p-2.5 border border-border-subtle rounded-lg flex flex-col justify-between min-h-[90px]">
              <span className="text-xs font-bold text-neutral-text">Fire Control</span>
              <h4 className="text-xl font-bold font-sans text-neutral-text">101</h4>
              <span className="text-[9px] text-neutral-text-muted">Active Stations</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 p-2.5 border border-border-subtle rounded-lg flex flex-col justify-between min-h-[90px]">
              <span className="text-xs font-bold text-neutral-text">Disaster Response</span>
              <h4 className="text-xl font-bold font-sans text-neutral-text">108</h4>
              <span className="text-[9px] text-neutral-text-muted">NDRF Pune Ward</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Government Schemes */}
        <Card className="xl:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Government Schemes & Support</CardTitle>
            <CardDescription>Direct welfare assistance and insurance channels open for application</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 pt-1">
            {MOCK_SCHEMES.map((scheme) => (
              <div 
                key={scheme.id}
                className="p-4 border border-border-subtle bg-slate-50/50 dark:bg-slate-900/30 rounded-lg flex flex-col justify-between h-full hover:border-royal-blue/30 transition-all group"
              >
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-royal-blue-light tracking-wider block">
                    {scheme.ministry}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-text leading-tight group-hover:text-royal-blue transition-colors">
                    {scheme.name}
                  </h4>
                  <p className="text-[10px] text-neutral-text-muted leading-relaxed">
                    {scheme.desc}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setApplyScheme(scheme)}
                  className="w-full text-[10px] h-7 mt-3 py-1 bg-white hover:bg-slate-100 cursor-pointer"
                >
                  Verify & Apply
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Embedded AI Chatbot Assistant panel */}
        <Card className="xl:col-span-1 flex flex-col h-[380px] justify-between">
          <CardHeader className="pb-3 border-b border-b-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquareCode className="w-5 h-5 text-royal-blue" />
              <div>
                <CardTitle className="text-sm font-bold">NETRAVAAH AI Assistant</CardTitle>
                <CardDescription className="text-[10px]">Real-time chatbot for municipal policy advice</CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  'max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed animate-in fade-in',
                  msg.sender === 'user' 
                    ? 'bg-royal-blue text-white ml-auto' 
                    : 'bg-white border border-border-subtle text-neutral-text mr-auto dark:bg-slate-900 dark:border-slate-800'
                )}
              >
                <p>{msg.text}</p>
                <span className={`block text-[8px] text-right mt-1 opacity-70 ${
                  msg.sender === 'user' ? 'text-white' : 'text-neutral-text-muted'
                }`}>
                  {msg.time}
                </span>
              </div>
            ))}
            
            {/* Typing Loader spinner */}
            {isChatLoading && (
              <div className="bg-white border border-border-subtle text-neutral-text mr-auto dark:bg-slate-900 dark:border-slate-800 max-w-[85%] rounded-lg p-2.5 text-xs flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-royal-blue animate-bounce [animation-delay:-0.3s]" />
                <span className="flex h-1.5 w-1.5 rounded-full bg-royal-blue animate-bounce [animation-delay:-0.15s]" />
                <span className="flex h-1.5 w-1.5 rounded-full bg-royal-blue animate-bounce" />
              </div>
            )}
          </div>

          {/* Text Input drawer */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-border-subtle flex gap-2 shrink-0 bg-white dark:bg-slate-900">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about water, crops, schemes..."
              className="flex-1 h-9 px-3 border border-border-subtle rounded-md text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ring dark:bg-slate-800 dark:focus:bg-slate-900"
            />
            <Button variant="navy" type="submit" size="icon" className="h-9 w-9 shrink-0 cursor-pointer">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & SUBMISSIONS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!applyScheme}
        onClose={() => setApplyScheme(null)}
        title={applyScheme ? `Scheme Application: ${applyScheme.name}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setApplyScheme(null)}>
              Cancel
            </Button>
            <Button variant="navy" onClick={handleSchemeApplySubmit} isLoading={schemeApplied}>
              {schemeApplied ? 'Submitting...' : 'Submit Form'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSchemeApplySubmit} className="space-y-4">
          {schemeApplied ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <div className="h-12 w-12 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-success" />
              </div>
              <h4 className="text-base font-bold">Application Received Successfully</h4>
              <p className="text-xs text-neutral-text-muted max-w-xs">
                Your credentials have been authenticated. Reference ID: AP-9104-{applyScheme?.id.toUpperCase()}.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 p-3 bg-info-light border border-info/30 rounded-md text-xs text-info dark:bg-info/10">
                <HelpCircle className="w-4.5 h-4.5 shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold block">Eligibility Criteria Checklist:</span>
                  <span>{applyScheme?.eligibility}</span>
                </div>
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Applicant Full Name">
                  <Input type="text" value="Jane Doe" disabled />
                </FormGroup>
                <FormGroup label="Aadhaar Card Reference">
                  <Input type="text" value="XXXX-XXXX-9104" disabled />
                </FormGroup>
              </div>

              {/* Land / Property details depending on scheme */}
              <FormGroup label="Civic Ward/Block ID" required>
                <Input type="text" placeholder="e.g. Block 4B, Ward 12" required />
              </FormGroup>

              {/* Terms and compliance */}
              <label className="flex items-start gap-2 text-xs text-neutral-text-muted cursor-pointer mt-2">
                <input type="checkbox" className="rounded border-slate-300 text-royal-blue focus:ring-royal-blue h-4 w-4 mt-0.5" required />
                <span>I hereby certify that all information submitted is true and matching Aadhaar registry database records.</span>
              </label>
            </>
          )}
        </form>
      </Modal>

    </div>
  );
}
