'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Activity, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  ClipboardList, 
  ShieldAlert, 
  HeartPulse, 
  Sprout, 
  Flame, 
  Radio, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  Gauge, 
  Server,
  Zap,
  Droplet,
  Compass,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

// Types for View Scope
type ViewScope = 'district' | 'state' | 'national';

// Type for Heatmap Region
interface HeatmapRegion {
  id: string;
  name: string;
  riskScore: number; // 0-100
  hazardType: string;
  status: 'Critical' | 'Moderate' | 'Safe';
  incidentCount: number;
}

// Telemetry Details Type
interface TelemetryData {
  health: {
    index: number;
    occupancy: string;
    cases: string;
    status: string;
  };
  agri: {
    index: number;
    moisture: string;
    yield: string;
    advisory: string;
  };
  hazard: {
    flood: string;
    seismic: string;
    industrial: string;
    status: 'High' | 'Moderate' | 'Low';
  };
  infra: {
    power: string;
    waterLeak: string;
    roadBlock: string;
    status: string;
  };
}

// Comprehensive Scope Datasets
const SCOPE_DATA: Record<ViewScope, {
  name: string;
  regionType: string;
  kpis: {
    complaintsAssigned: number;
    complaintsTrend: string;
    predictionsText: string;
    predictionsSub: string;
    resourcesText: string;
    resourcesSub: string;
    activeAlerts: number;
    alertsSeverity: 'Critical' | 'Warning' | 'Info';
    reportsCompiled: number;
    reportsTime: string;
    slaPerformance: number;
    slaSub: string;
  };
  heatmap: HeatmapRegion[];
  telemetry: TelemetryData;
  charts: {
    allocation: { category: string; active: number; backup: number }[];
    predictedSla: { month: string; actual: number; predicted: number }[];
  };
}> = {
  district: {
    name: 'Pune District (Sector 4B)',
    regionType: 'Municipal Ward',
    kpis: {
      complaintsAssigned: 42,
      complaintsTrend: '+8% from yesterday',
      predictionsText: '96.8% SLA',
      predictionsSub: 'Next month predicted resolution',
      resourcesText: '18 Units Active',
      resourcesSub: '4 Ambulances, 3 Fire crews standby',
      activeAlerts: 2,
      alertsSeverity: 'Warning',
      reportsCompiled: 9,
      reportsTime: 'Avg resolve time: 2.1 hrs',
      slaPerformance: 95.8,
      slaSub: 'Target resolution rate: 95.0%',
    },
    heatmap: [
      { id: 'reg-1', name: 'Ward 12 (Core Sector)', riskScore: 78, hazardType: 'Water Logging', status: 'Critical', incidentCount: 14 },
      { id: 'reg-2', name: 'Ward 14 (Market Area)', riskScore: 48, hazardType: 'Pothole Blockage', status: 'Moderate', incidentCount: 8 },
      { id: 'reg-3', name: 'Ward 15 (Residential)', riskScore: 22, hazardType: 'None', status: 'Safe', incidentCount: 2 },
      { id: 'reg-4', name: 'Ward 16 (Industrial)', riskScore: 65, hazardType: 'Grid Voltage Spark', status: 'Critical', incidentCount: 11 },
      { id: 'reg-5', name: 'Ward 17 (Suburbs East)', riskScore: 34, hazardType: 'Waste Dump Overflow', status: 'Moderate', incidentCount: 5 },
      { id: 'reg-6', name: 'Ward 18 (Suburbs West)', riskScore: 15, hazardType: 'None', status: 'Safe', incidentCount: 2 },
    ],
    telemetry: {
      health: { index: 82, occupancy: '78% Hospital Beds', cases: 'Dengue: 2.4 / 1k citizens', status: 'Optimal' },
      agri: { index: 68, moisture: '68% Soil Moisture Rating', yield: 'Sowing progress: On Schedule', advisory: 'IMD advises crop protection ahead of tomorrow\'s rains' },
      hazard: { flood: '0.4m River Level rise', seismic: '0.1 Richter (Negligible)', industrial: 'Chemical leaks: Nil', status: 'Low' },
      infra: { power: '64% Substation load', waterLeak: '91% Pipeline flow pressure', roadBlock: 'Sector 4B Lane 3: Waterlogged', status: 'Stable' },
    },
    charts: {
      allocation: [
        { category: 'Water Dept', active: 12, backup: 6 },
        { category: 'Electricity Board', active: 15, backup: 8 },
        { category: 'Sanitation Dept', active: 20, backup: 5 },
        { category: 'Roads & PWD', active: 8, backup: 12 },
      ],
      predictedSla: [
        { month: 'Jan', actual: 94.2, predicted: 94.0 },
        { month: 'Feb', actual: 95.1, predicted: 94.8 },
        { month: 'Mar', actual: 94.8, predicted: 95.0 },
        { month: 'Apr', actual: 95.6, predicted: 95.2 },
        { month: 'May', actual: 95.8, predicted: 95.5 },
        { month: 'Jun', actual: 95.8, predicted: 96.8 }, // prediction jump
      ],
    }
  },
  state: {
    name: 'Maharashtra State',
    regionType: 'Division Hub',
    kpis: {
      complaintsAssigned: 1840,
      complaintsTrend: '+14% rainfall surcharge',
      predictionsText: '+12% Flood Risk',
      predictionsSub: 'Konkan coast model forecast',
      resourcesText: '96 Relief Camps',
      resourcesSub: '8 Disaster teams, 420 vehicles active',
      activeAlerts: 5,
      alertsSeverity: 'Critical',
      reportsCompiled: 48,
      reportsTime: 'Avg resolve time: 4.5 hrs',
      slaPerformance: 92.4,
      slaSub: 'Target resolution rate: 93.0%',
    },
    heatmap: [
      { id: 'reg-1', name: 'Konkan Division', riskScore: 92, hazardType: 'Heavy Inundation', status: 'Critical', incidentCount: 420 },
      { id: 'reg-2', name: 'Pune Division', riskScore: 56, hazardType: 'Highway Landslide', status: 'Moderate', incidentCount: 180 },
      { id: 'reg-3', name: 'Nashik Division', riskScore: 38, hazardType: 'Dam Discharge Overflow', status: 'Moderate', incidentCount: 95 },
      { id: 'reg-4', name: 'Aurangabad Division', riskScore: 72, hazardType: 'Water Outage Stress', status: 'Critical', incidentCount: 310 },
      { id: 'reg-5', name: 'Nagpur Division', riskScore: 45, hazardType: 'Pest Infestation', status: 'Moderate', incidentCount: 112 },
      { id: 'reg-6', name: 'Amravati Division', riskScore: 24, hazardType: 'None', status: 'Safe', incidentCount: 32 },
    ],
    telemetry: {
      health: { index: 78, occupancy: '84% State ICU beds occupancy', cases: 'Malaria watch: Eastern hubs', status: 'Elevated Alert' },
      agri: { index: 54, moisture: '51% Vidarbha moisture rating', yield: 'Soybean stress warning: 32%', advisory: 'State subsidy portal open for crop insurance claims' },
      hazard: { flood: 'Dam levels: 72% Capacity', seismic: '1.2 Richter (Koyna Hub)', industrial: 'Chemical grid: Nominal', status: 'Moderate' },
      infra: { power: '82% Grid transmission capacity', waterLeak: 'Canal network health: 88%', roadBlock: 'Western Expressway: Landslide delay', status: 'Active Maintenance' },
    },
    charts: {
      allocation: [
        { category: 'Health Services', active: 180, backup: 90 },
        { category: 'State PWD / Roads', active: 310, backup: 140 },
        { category: 'Irrigation & Dams', active: 240, backup: 60 },
        { category: 'State Grid Corp', active: 150, backup: 110 },
      ],
      predictedSla: [
        { month: 'Jan', actual: 93.1, predicted: 93.5 },
        { month: 'Feb', actual: 92.8, predicted: 93.0 },
        { month: 'Mar', actual: 93.4, predicted: 92.8 },
        { month: 'Apr', actual: 92.5, predicted: 92.5 },
        { month: 'May', actual: 92.4, predicted: 92.2 },
        { month: 'Jun', actual: 92.4, predicted: 91.8 }, // prediction drops due to monsoon load
      ],
    }
  },
  national: {
    name: 'India (Union Command)',
    regionType: 'Geographic Zone',
    kpis: {
      complaintsAssigned: 34200,
      complaintsTrend: '+4% National Monsoon deviation',
      predictionsText: 'Zone V Watch',
      predictionsSub: 'Seismology network threat alert',
      resourcesText: '24 NDRF Battalions',
      resourcesSub: '1,200 clinics, 15 emergency pathways',
      activeAlerts: 8,
      alertsSeverity: 'Critical',
      reportsCompiled: 256,
      reportsTime: 'Avg resolve time: 12.0 hrs',
      slaPerformance: 89.2,
      slaSub: 'Target resolution rate: 90.0%',
    },
    heatmap: [
      { id: 'reg-1', name: 'Eastern Zone (Coast)', riskScore: 89, hazardType: 'Tropical Cyclone', status: 'Critical', incidentCount: 2840 },
      { id: 'reg-2', name: 'Western Zone (Desert)', riskScore: 82, hazardType: 'Extreme Heatwave', status: 'Critical', incidentCount: 1910 },
      { id: 'reg-3', name: 'Northern Zone (Himalayas)', riskScore: 61, hazardType: 'Cloudburst Warning', status: 'Critical', incidentCount: 890 },
      { id: 'reg-4', name: 'Southern Zone (Peninsula)', riskScore: 42, hazardType: 'Coastal Inundation', status: 'Moderate', incidentCount: 1105 },
      { id: 'reg-5', name: 'Central Zone (Plains)', riskScore: 35, hazardType: 'Power Outage Surcharge', status: 'Moderate', incidentCount: 740 },
      { id: 'reg-6', name: 'North-East Zone (Hills)', riskScore: 78, hazardType: 'Flash Flood landslide', status: 'Critical', incidentCount: 1450 },
    ],
    telemetry: {
      health: { index: 88, occupancy: 'National ICU Bed Reserve: 32%', cases: 'Aadhaar Health Link coverage: 94%', status: 'Stable' },
      agri: { index: 72, moisture: 'Monsoon progress rating: 92%', yield: 'Yield forecast: +3.2% YoY growth', advisory: 'Fasal Bima insurance payout threshold verified at 94.2%' },
      hazard: { flood: 'Cyclone alert: Bay of Bengal V', seismic: 'Zone V Active Monitoring', industrial: 'Safety index: 98.4%', status: 'High' },
      infra: { power: 'Grid frequency: 49.92 Hz', waterLeak: 'River link project safety: 96%', roadBlock: 'National Highway connectivity: 98.4%', status: 'Stable' },
    },
    charts: {
      allocation: [
        { category: 'NDRF Disaster Teams', active: 14000, backup: 8000 },
        { category: 'National Health Hubs', active: 32000, backup: 15000 },
        { category: 'Grid Surcharges', active: 25000, backup: 12000 },
        { category: 'National Highways', active: 18000, backup: 24000 },
      ],
      predictedSla: [
        { month: 'Jan', actual: 90.2, predicted: 90.5 },
        { month: 'Feb', actual: 89.8, predicted: 90.0 },
        { month: 'Mar', actual: 89.9, predicted: 89.5 },
        { month: 'Apr', actual: 89.4, predicted: 89.5 },
        { month: 'May', actual: 89.2, predicted: 89.0 },
        { month: 'Jun', actual: 89.2, predicted: 88.5 },
      ],
    }
  }
};

export default function OfficialDashboard() {
  const { setActiveTab } = useUiStore();

  // Scope state
  const [scope, setScope] = useState<ViewScope>('district');
  const [selectedHeatmapRegion, setSelectedHeatmapRegion] = useState<HeatmapRegion | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync tab highlight on sidebar
  useEffect(() => {
    setActiveTab('Official Government Dashboard');
  }, [setActiveTab]);

  // Set initial sync time
  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Update default selected heatmap region when scope changes
  useEffect(() => {
    setSelectedHeatmapRegion(SCOPE_DATA[scope].heatmap[0]);
  }, [scope]);

  // Handle mock refresh sync
  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // Scatter details slightly for realism
      if (selectedHeatmapRegion) {
        const matchingRegion = SCOPE_DATA[scope].heatmap.find(h => h.id === selectedHeatmapRegion.id);
        if (matchingRegion) {
          setSelectedHeatmapRegion({
            ...matchingRegion,
            incidentCount: matchingRegion.incidentCount + (Math.random() > 0.5 ? 1 : 0)
          });
        }
      }
    }, 800);
  };

  const activeData = SCOPE_DATA[scope];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SCOPE SWITCHERS PANEL                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-persian-blue animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-royal-blue dark:text-brand-yellow font-bold">
              Command & Control Center
            </span>
            <span className="text-slate-350 dark:text-slate-650">•</span>
            <span className="text-xs text-slate-500 font-semibold">Executive Level Access</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Official Governance Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monitoring active scope: <strong className="text-royal-blue dark:text-blue-400">{activeData.name}</strong>
          </p>
        </div>

        {/* Dynamic Scope Select Controls & Sync Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Executive View Scope Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-inner">
            {(['district', 'state', 'national'] as ViewScope[]).map((level) => (
              <button
                key={level}
                onClick={() => setScope(level)}
                className={cn(
                  'h-9 px-4 text-xs font-bold rounded-md uppercase tracking-wider cursor-pointer transition-all',
                  scope === level 
                    ? 'bg-white dark:bg-slate-800 text-royal-blue dark:text-white shadow-xs font-extrabold border border-border-subtle/50' 
                    : 'text-slate-550 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
                )}
              >
                {level === 'district' ? 'District (Pune)' : level === 'state' ? 'State (MH)' : 'National (India)'}
              </button>
            ))}
          </div>

          {/* Sync Trigger button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncData}
            isLoading={isSyncing}
            className="h-10 px-3 cursor-pointer text-xs font-bold gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            Synced: {lastSyncTime}
          </Button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LARGE KPI CARDS GRID (6 WIDGETS)                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1: Complaints Assigned */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-persian-blue p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Complaints Assigned</span>
              <Building className="w-4 h-4 text-persian-blue" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{activeData.kpis.complaintsAssigned}</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2">{activeData.kpis.complaintsTrend}</span>
        </Card>

        {/* KPI 2: Predictions Model */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-royal-blue p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Model Predictions</span>
              <TrendingUp className="w-4 h-4 text-royal-blue" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-snug">{activeData.kpis.predictionsText}</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2 line-clamp-1">{activeData.kpis.predictionsSub}</span>
        </Card>

        {/* KPI 3: Resource Capacity */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-success p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Resources Active</span>
              <Users className="w-4 h-4 text-success" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2 leading-snug">{activeData.kpis.resourcesText}</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2 line-clamp-1">{activeData.kpis.resourcesSub}</span>
        </Card>

        {/* KPI 4: Active Alerts */}
        <Card className={cn(
          'bg-card border-border-subtle shadow-xs border-l-4 p-4 flex flex-col justify-between min-h-[110px]',
          activeData.kpis.activeAlerts > 4 ? 'border-l-danger bg-danger/5 dark:bg-danger/5' : 'border-l-warning'
        )}>
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Critical Alerts</span>
              <AlertTriangle className={cn(
                'w-4 h-4', 
                activeData.kpis.activeAlerts > 4 ? 'text-danger animate-pulse' : 'text-warning'
              )} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{activeData.kpis.activeAlerts}</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 mt-2 flex items-center gap-1">
            <span className={cn('h-1.5 w-1.5 rounded-full animate-ping', 
              activeData.kpis.activeAlerts > 4 ? 'bg-danger' : 'bg-warning'
            )} />
            Severity Level: {activeData.kpis.alertsSeverity}
          </span>
        </Card>

        {/* KPI 5: Reports Compiled */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-slate-450 p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">Reports & Audits</span>
              <ClipboardList className="w-4 h-4 text-slate-650" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{activeData.kpis.reportsCompiled}</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2 line-clamp-1">{activeData.kpis.reportsTime}</span>
        </Card>

        {/* KPI 6: SLA Performance */}
        <Card className="bg-card border-border-subtle shadow-xs border-l-4 border-l-info p-4 flex flex-col justify-between min-h-[110px]">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] uppercase font-bold tracking-wider">SLA Performance</span>
              <Activity className="w-4 h-4 text-info" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{activeData.kpis.slaPerformance}%</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500 mt-2 line-clamp-1">{activeData.kpis.slaSub}</span>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE ANALYTICAL SECTION (HEATMAP & CHARTS)                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Widget: Geographic Risk Heatmap Grid */}
        <Card className="lg:col-span-2 bg-card border-border-subtle shadow-xs flex flex-col justify-between min-h-[380px]">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Regional Risk Overview & Heatmap</CardTitle>
                <CardDescription className="text-[11px]">
                  Risk density index mapped by {activeData.regionType} boundary limits
                </CardDescription>
              </div>
              <Compass className="w-4.5 h-4.5 text-royal-blue shrink-0 animate-spin-slow" />
            </div>
          </CardHeader>
          
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 p-5">
            
            {/* Interactive Grid Map Heatmap Cells */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3 min-h-[200px]">
              {activeData.heatmap.map((region) => {
                const isSelected = selectedHeatmapRegion?.id === region.id;
                
                // Color scaling based on risk score (Tailwind color scales)
                const getRiskBg = (score: number) => {
                  if (score >= 75) return 'bg-red-500/15 border-red-500 hover:bg-red-500/25 text-red-700 dark:text-red-400';
                  if (score >= 45) return 'bg-amber-500/15 border-amber-500 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400';
                  return 'bg-green-500/15 border-green-500 hover:bg-green-500/25 text-green-700 dark:text-green-400';
                };

                return (
                  <button
                    key={region.id}
                    onClick={() => setSelectedHeatmapRegion(region)}
                    className={cn(
                      'p-3.5 border-2 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between group shadow-2xs relative overflow-hidden',
                      getRiskBg(region.riskScore),
                      isSelected && 'ring-4 ring-royal-blue/30 scale-[1.02] z-10 border-royal-blue dark:border-blue-400'
                    )}
                  >
                    <div className="space-y-0.5">
                      <span className="block text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        {activeData.regionType}
                      </span>
                      <h4 className="text-sm font-black tracking-tight leading-tight truncate group-hover:text-royal-blue dark:group-hover:text-white transition-colors">
                        {region.name}
                      </h4>
                    </div>

                    <div className="flex items-end justify-between mt-5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                      <div>
                        <span className="block text-[8px] uppercase font-bold text-slate-500">Risk Score</span>
                        <strong className="text-base font-extrabold">{region.riskScore} / 100</strong>
                      </div>
                      <span className={cn(
                        'text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        region.status === 'Critical' ? 'bg-red-550 text-white' : 
                        region.status === 'Moderate' ? 'bg-amber-500 text-slate-900' : 'bg-green-600 text-white'
                      )}>
                        {region.status}
                      </span>
                    </div>

                    {/* Small grid line visual details */}
                    <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity bg-current rounded-bl-full pointer-events-none" />
                  </button>
                );
              })}
            </div>

            {/* Heatmap region detailed inspect drawer */}
            <div className="md:col-span-1 bg-slate-50 dark:bg-slate-900/35 border border-border-subtle p-4 rounded-lg flex flex-col justify-between min-h-[200px]">
              {selectedHeatmapRegion ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                        Detailed Telemetry
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-royal-blue" />
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                      {selectedHeatmapRegion.name}
                    </h4>

                    <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Incident density:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">
                          {selectedHeatmapRegion.incidentCount} active cases
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Primary Risk Category:</span>
                        <span className="font-semibold text-danger truncate max-w-[120px]">
                          {selectedHeatmapRegion.hazardType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto border-t border-slate-200 dark:border-slate-800 pt-3">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase">Risk Evaluation Note:</span>
                    <p className="text-[10px] text-slate-650 dark:text-slate-400 leading-normal italic bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-900">
                      {selectedHeatmapRegion.riskScore >= 75 
                        ? 'High density alert: Action priority 1. Dispatch emergency relief teams immediately.' 
                        : selectedHeatmapRegion.riskScore >= 45
                        ? 'Moderate load alert: Dispatch inspector units to coordinate sanitization and infrastructure checks.' 
                        : 'Sector safe: Telemetry values are currently nominal.'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
                  Select a heatmap cell block to view telemetry logs.
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Right Widget: Allocation and Predictions Charts */}
        <Card className="lg:col-span-1 bg-card border-border-subtle shadow-xs flex flex-col justify-between min-h-[380px]">
          <CardHeader className="pb-3 border-b border-border-subtle bg-slate-50 dark:bg-slate-900/40">
            <CardTitle className="text-sm font-bold">Resource Allocation & Predictions</CardTitle>
            <CardDescription className="text-[11px]">
              Active vs standby personnel distributions and predictive resolution rates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6 flex-1 flex flex-col justify-between">
            
            {/* Custom SVG Bar Chart: Resource Allocation */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Active vs Backup capacity</span>
              <div className="h-[100px] w-full flex items-end justify-between relative bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-lg p-2.5 pt-4">
                {activeData.charts.allocation.map((item, idx) => {
                  const maxVal = Math.max(...activeData.charts.allocation.map(a => a.active + a.backup));
                  const activeHeight = `${(item.active / maxVal) * 80}%`;
                  const backupHeight = `${(item.backup / maxVal) * 80}%`;

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                      <div className="flex gap-1 items-end w-full justify-center h-full">
                        {/* Active bar */}
                        <div 
                          className="w-2.5 bg-royal-blue dark:bg-blue-500 rounded-t-xs hover:opacity-85 transition-all relative"
                          style={{ height: activeHeight }}
                          title={`Active: ${item.active}`}
                        />
                        {/* Backup bar */}
                        <div 
                          className="w-2.5 bg-brand-yellow dark:bg-brand-yellow rounded-t-xs hover:opacity-85 transition-all relative"
                          style={{ height: backupHeight }}
                          title={`Backup: ${item.backup}`}
                        />
                      </div>
                      <span className="text-[8px] text-slate-500 truncate max-w-[45px] text-center mt-1 font-semibold block">
                        {item.category.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom SVG Line Chart: SLA Predictions */}
            <div className="space-y-2 mt-auto">
              <span className="text-[10px] uppercase font-bold text-slate-500">SLA Predictions (Actual vs Model)</span>
              <div className="h-[110px] w-full flex items-center justify-center relative bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 rounded-lg p-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                  {/* Grid Lines */}
                  <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(226,232,240,0.4)" strokeWidth="0.5" />
                  <line x1="10" y1="50" x2="190" y2="50" stroke="rgba(241,245,249,0.3)" strokeWidth="0.5" />
                  <line x1="10" y1="10" x2="190" y2="10" stroke="rgba(241,245,249,0.3)" strokeWidth="0.5" strokeDasharray="2" />
                  
                  {/* SLA actual line */}
                  <path 
                    d={`M 10 ${100 - activeData.charts.predictedSla[0].actual} 
                       L 46 ${100 - activeData.charts.predictedSla[1].actual} 
                       L 82 ${100 - activeData.charts.predictedSla[2].actual} 
                       L 118 ${100 - activeData.charts.predictedSla[3].actual} 
                       L 154 ${100 - activeData.charts.predictedSla[4].actual} 
                       L 190 ${100 - activeData.charts.predictedSla[5].actual}`} 
                    fill="none" 
                    stroke="#0F4C81" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />

                  {/* SLA predicted model line */}
                  <path 
                    d={`M 10 ${100 - activeData.charts.predictedSla[0].predicted} 
                       L 46 ${100 - activeData.charts.predictedSla[1].predicted} 
                       L 82 ${100 - activeData.charts.predictedSla[2].predicted} 
                       L 118 ${100 - activeData.charts.predictedSla[3].predicted} 
                       L 154 ${100 - activeData.charts.predictedSla[4].predicted} 
                       L 190 ${100 - activeData.charts.predictedSla[5].predicted}`} 
                    fill="none" 
                    stroke="#F59E0B" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2"
                    strokeLinecap="round" 
                  />
                  
                  {/* Data Points */}
                  <circle cx="190" cy={100 - activeData.charts.predictedSla[5].actual} r="3" fill="#FFFFFF" stroke="#0F4C81" strokeWidth="2" />
                  <circle cx="190" cy={100 - activeData.charts.predictedSla[5].predicted} r="3" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
                  
                  {/* Labels */}
                  <text x="10" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Jan</text>
                  <text x="82" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Mar</text>
                  <text x="190" y="98" fontSize="7" fill="#64748B" textAnchor="middle">Jun</text>

                  <text x="190" y="20" fontSize="7" fill="#0F4C81" fontWeight="bold" textAnchor="end">SLA: {activeData.charts.predictedSla[5].actual}%</text>
                </svg>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 4. TELEMETRY STATUS SECTIONS (HEALTH, AGRI, HAZARD, INFRASTRUCTURE)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Section 1: District Health */}
        <Card className="bg-card border-border-subtle shadow-xs border-t-4 border-t-success flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">District Health Telemetry</span>
              <HeartPulse className="w-5 h-5 text-success shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeData.telemetry.health.index} / 100</span>
              <span className="text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">
                {activeData.telemetry.health.status}
              </span>
            </div>
            
            <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Facility Occupancy:</span>
                <strong>{activeData.telemetry.health.occupancy}</strong>
              </div>
              <div className="flex justify-between">
                <span>Epidemiological marker:</span>
                <strong>{activeData.telemetry.health.cases}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Agriculture Status */}
        <Card className="bg-card border-border-subtle shadow-xs border-t-4 border-t-royal-blue flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agriculture Telemetry</span>
              <Sprout className="w-5 h-5 text-royal-blue shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeData.telemetry.agri.index} / 100</span>
              <span className="text-[10px] font-bold text-royal-blue dark:text-blue-400 bg-royal-blue/10 px-2 py-0.5 rounded-full">
                Sowing Watch
              </span>
            </div>
            
            <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Regional Moisture:</span>
                <strong>{activeData.telemetry.agri.moisture}</strong>
              </div>
              <div className="flex justify-between">
                <span>Yield forecast index:</span>
                <strong>{activeData.telemetry.agri.yield}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Hazard Status */}
        <Card className={cn(
          'bg-card border-border-subtle shadow-xs border-t-4 flex flex-col justify-between',
          activeData.telemetry.hazard.status === 'High' ? 'border-t-danger bg-danger/5 dark:bg-danger/5' : 'border-t-warning'
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hazard & Risk Telemetry</span>
              <Flame className={cn(
                'w-5 h-5 shrink-0',
                activeData.telemetry.hazard.status === 'High' ? 'text-danger animate-pulse' : 'text-warning'
              )} />
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">Active Warning</span>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                activeData.telemetry.hazard.status === 'High' ? 'bg-danger text-white' : 'bg-warning text-slate-900'
              )}>
                {activeData.telemetry.hazard.status} Risk
              </span>
            </div>
            
            <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Flood gauge:</span>
                <strong>{activeData.telemetry.hazard.flood}</strong>
              </div>
              <div className="flex justify-between">
                <span>Seismological networks:</span>
                <strong>{activeData.telemetry.hazard.seismic}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Infrastructure Status */}
        <Card className="bg-card border-border-subtle shadow-xs border-t-4 border-t-slate-450 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Infrastructure Telemetry</span>
              <Zap className="w-5 h-5 text-slate-500 shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">Grid & Routes</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                {activeData.telemetry.infra.status}
              </span>
            </div>
            
            <div className="space-y-2 text-xs border-t border-border-subtle pt-3 text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Electrical Grid reserves:</span>
                <strong>{activeData.telemetry.infra.power}</strong>
              </div>
              <div className="flex justify-between">
                <span>Water flow leakage:</span>
                <strong>{activeData.telemetry.infra.waterLeak}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Dynamic scope specific alerts banner */}
      <div className="p-4 rounded-lg bg-royal-blue/5 border border-royal-blue/20 dark:bg-slate-900/40 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-royal-blue/10 flex items-center justify-center shrink-0 text-royal-blue dark:text-blue-400">
            <Radio className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Live Meteorological & Agri Advisory</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
              {activeData.telemetry.agri.advisory}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-xs text-royal-blue dark:text-blue-400 font-bold border-t sm:border-t-0 pt-2 sm:pt-0">
          <span>Active GIS Telemetry</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

    </div>
  );
}
