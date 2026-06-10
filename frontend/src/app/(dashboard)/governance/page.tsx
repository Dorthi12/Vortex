'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartPulse, 
  Flame, 
  Sprout, 
  Building2, 
  TrendingUp, 
  GraduationCap, 
  Truck, 
  Leaf, 
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BrainCircuit,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

// Agent definition interface
interface CouncilAgent {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  vote: 'APPROVE' | 'OBJECT' | 'ABSTAIN';
  confidence: number; // 0-100
  stance: string;
  reasoning: string;
  priority: string;
  policyRef: string;
  policyName: string;
  conflictsWith: string[];
  alliesWith: string[];
}

// Scenario definition interface
interface PolicyScenario {
  id: string;
  title: string;
  description: string;
  consensusScore: number; // 0-100
  riskScore: number; // 0-100
  agreementIndex: number; // 0-100
  execSummary: string;
  agents: CouncilAgent[];
  actionItems: { text: string; status: 'completed' | 'pending' | 'critical'; lead: string }[];
  frictionNodes: { agentA: string; agentB: string; issue: string; severity: 'high' | 'medium' }[];
}

// Scenarios dataset
const SCENARIOS: PolicyScenario[] = [
  {
    id: 'scen-1',
    title: 'Monsoon Flood Evacuation Corridor Directive',
    description: 'Enforcing active zoning and drainage bypass pathways along the Mula River basin to handle excess cusecs discharge from Koyna and adjacent dams.',
    consensusScore: 84,
    riskScore: 32,
    agreementIndex: 88,
    execSummary: 'The multi-agent council approves the evacuation corridor directive with high consensus. Life preservation and safety safeguards (Health, Hazard, Environment) override short-term commercial haulage setbacks (Economy, Transport). Exemptions have been generated for emergency cargo vehicles.',
    agents: [
      {
        id: 'ag-health',
        name: 'Health Sector AI',
        icon: HeartPulse,
        vote: 'APPROVE',
        confidence: 94,
        stance: 'Critical risk to human life from water-borne outbreaks and facility inundation. Evacuation corridors are mandatory.',
        reasoning: 'Protects hospital facilities in low-elevation sectors. Prevents sewage-water mixing vectors and dengue breeding spikes. High confidence based on historic Pune flood morbidity models.',
        priority: 'Water-borne Outbreak Prevention',
        policyRef: 'Section 4B-EP',
        policyName: 'Epidemic Disease Act Contingency',
        conflictsWith: ['Economy Sector AI'],
        alliesWith: ['Hazard Mitigation AI', 'Environment AI']
      },
      {
        id: 'ag-hazard',
        name: 'Hazard Mitigation AI',
        icon: Flame,
        vote: 'APPROVE',
        confidence: 98,
        stance: 'Mula-Mutha River gauge levels predicted to breach warning marks. Strict containment zoning must be enforced.',
        reasoning: 'Calculates active runoff patterns. Outlines high risk of causeway overflows. Evacuation routes must bypass Hadapsar heavy grids. Dynamic updates require active sirens tests.',
        priority: 'Emergency Evacuation Pathways',
        policyRef: 'Article 12-DM',
        policyName: 'National Disaster Management Framework',
        conflictsWith: ['Economy Sector AI', 'Transport AI'],
        alliesWith: ['Health Sector AI', 'Infrastructure AI']
      },
      {
        id: 'ag-agri',
        name: 'Agriculture AI',
        icon: Sprout,
        vote: 'APPROVE',
        confidence: 82,
        stance: 'Monsoon discharges will waterlog peri-urban crop zones. Emergency drainage gates should open early.',
        reasoning: 'Supports dam gate release schedules. Opening gates 1-4 progressively prevents major standing crop losses in outer sectors. Soil moisture levels must be maintained below saturated margins.',
        priority: 'Crop Soil Drainage Management',
        policyRef: 'Directive AG-42',
        policyName: 'APMC Monsoon Protection Act',
        conflictsWith: ['Energy AI'],
        alliesWith: ['Environment AI']
      },
      {
        id: 'ag-infra',
        name: 'Infrastructure AI',
        icon: Building2,
        vote: 'APPROVE',
        confidence: 76,
        stance: 'Bridges and structural bases require stress shielding. Diverting heavy truck vibration is needed.',
        reasoning: 'Diverting heavy cargo from bridges reduces load spikes during high river silt settle periods. Recommends gating pier supports bases to prevent anchoring failure.',
        priority: 'Structural Anchor Preservation',
        policyRef: 'Standard BR-500',
        policyName: 'PWD Bridge Safety Engineering Code',
        conflictsWith: ['Transport AI'],
        alliesWith: ['Hazard Mitigation AI']
      },
      {
        id: 'ag-econ',
        name: 'Economy Sector AI',
        icon: TrendingUp,
        vote: 'OBJECT',
        confidence: 90,
        stance: 'Evacuating industrial corridors blockades Hadapsar commercial transport lanes. Daily commerce loses reach ₹1.8 Crore.',
        reasoning: 'Objecting to absolute closures. Commute blocks disrupt factory output and delay delivery lines. Recommends structured shift bypasses rather than total corridor evacuation closures.',
        priority: 'Supply Chain Continuity',
        policyRef: 'Bylaw EC-04',
        policyName: 'Maharashtra Industrial Development Act',
        conflictsWith: ['Hazard Mitigation AI', 'Health Sector AI'],
        alliesWith: ['Transport AI']
      },
      {
        id: 'ag-edu',
        name: 'Education AI',
        icon: GraduationCap,
        vote: 'APPROVE',
        confidence: 88,
        stance: 'Schools in low-elevation wards must convert to temporary relief camps. Online study directives active.',
        reasoning: 'Converts primary school blocks in safe sectors to temporary shelters. Ensures pupil transport stops in flooded wards to avoid transit danger. Recommends online backup schooling systems.',
        priority: 'Child Safety & School Shelter Conversion',
        policyRef: 'Code ED-102',
        policyName: 'School Safety Contingency Guidelines',
        conflictsWith: [],
        alliesWith: ['Hazard Mitigation AI']
      },
      {
        id: 'ag-trans',
        name: 'Transport AI',
        icon: Truck,
        vote: 'ABSTAIN',
        confidence: 72,
        stance: 'Rerouting municipal buses to secondary pathways is feasible but adds 28 minutes average commute delay.',
        reasoning: 'Neutral stance. Bus fleets can coordinate evacuation support but standard cargo flows will experience severe traffic delays. Requires dynamic GIS road updates to proceed.',
        priority: 'Fleet Re-routing Capacity',
        policyRef: 'Directive TR-88',
        policyName: 'State Transport Corporation Emergency Rules',
        conflictsWith: ['Infrastructure AI', 'Hazard Mitigation AI'],
        alliesWith: ['Economy Sector AI']
      },
      {
        id: 'ag-env',
        name: 'Environment AI',
        icon: Leaf,
        vote: 'APPROVE',
        confidence: 92,
        stance: 'Natural river floodplains must absorb runoff. Concrete embankment modifications should be blocked.',
        reasoning: 'Supports natural ecological absorption. Objects to temporary concrete barriers that block river silt migration. Demands protection of riparian flora along the Mula river banks.',
        priority: 'Natural Floodplain Conservation',
        policyRef: 'Clause EN-22',
        policyName: 'Eco-Sensitive Zoning Regulation',
        conflictsWith: ['Infrastructure AI'],
        alliesWith: ['Health Sector AI', 'Agriculture AI']
      },
      {
        id: 'ag-energy',
        name: 'Energy AI',
        icon: Zap,
        vote: 'APPROVE',
        confidence: 85,
        stance: 'Hadapsar high-voltage substations must run at isolated voltage modes to prevent grounding grids.',
        reasoning: 'Agrees with path protection. Floodwaters breaching substation bases present catastrophic grid short-circuit risks. Isolated load-shedding is required if water levels exceed 8.5m.',
        priority: 'Substation Short-Circuit Containment',
        policyRef: 'Rule EN-94',
        policyName: 'Central Electricity Authority Grid Code',
        conflictsWith: ['Agriculture AI'],
        alliesWith: ['Infrastructure AI']
      }
    ],
    actionItems: [
      { text: 'Deploy NDRF Battalions 08 & 12 to Odisha Border/River basin', status: 'completed', lead: 'Hazard Mitigation AI' },
      { text: 'Convert Wards 14 & 15 Primary Schools into relief camps', status: 'completed', lead: 'Education AI' },
      { text: 'Activate isolated load-shedding protocols at Hadapsar Grid 4B', status: 'pending', lead: 'Energy AI' },
      { text: 'Enforce alternate cargo bypassing on Delhi Highway Corridor', status: 'critical', lead: 'Transport AI' }
    ],
    frictionNodes: [
      { agentA: 'Economy Sector AI', agentB: 'Hazard Mitigation AI', issue: 'Economy objects to absolute corridor closures; demands commercial bypass lanes.', severity: 'high' },
      { agentA: 'Transport AI', agentB: 'Infrastructure AI', issue: 'Transport demands bridge access for trucks; Infrastructure objects due to structural stress.', severity: 'medium' },
      { agentA: 'Environment AI', agentB: 'Infrastructure AI', issue: 'Environment opposes concrete levee structures; Infrastructure insists they are structurally necessary.', severity: 'medium' }
    ]
  },
  {
    id: 'scen-2',
    title: 'Industrial Special Zoning & Power Grid Expansion',
    description: 'Expanding the industrial zoning corridor in Hadapsar Industrial Zone to include chemical processing, adding a 150MW high-voltage power substation.',
    consensusScore: 68,
    riskScore: 52,
    agreementIndex: 70,
    execSummary: 'Zoning proposal approved by a moderate consensus. Core economic growth (Economy, Energy, Infrastructure) is prioritized, but requires major mitigation directives from environmental and health sectors (green buffers, daily air quality audits).',
    agents: [
      {
        id: 'ag-health',
        name: 'Health Sector AI',
        icon: HeartPulse,
        vote: 'OBJECT',
        confidence: 88,
        stance: 'Chemical processing increases particulate matter and hazardous gas leak risks inside residential buffer zones.',
        reasoning: 'Outlines a potential 12% rise in respiratory complaints. Requests a mandatory 2 km buffer zone separating chemical units from residential schools.',
        priority: 'Toxic Emissions Control',
        policyRef: 'Article 19-HC',
        policyName: 'Public Health Pollution Control Act',
        conflictsWith: ['Economy Sector AI', 'Energy AI'],
        alliesWith: ['Environment AI']
      },
      {
        id: 'ag-hazard',
        name: 'Hazard Mitigation AI',
        icon: Flame,
        vote: 'ABSTAIN',
        confidence: 74,
        stance: 'Substation placement is safe from flooding, but chemical transit routes lack specialized fire response teams.',
        reasoning: 'Neutral stance. Substation site is on high elevation. However, shipping chemical cargo through central sectors requires specialized Hazmat standby squads.',
        priority: 'Hazmat Transport Safety',
        policyRef: 'Section 8-HZ',
        policyName: 'Industrial Hazard Safety Protocol',
        conflictsWith: ['Transport AI'],
        alliesWith: ['Infrastructure AI']
      },
      {
        id: 'ag-agri',
        name: 'Agriculture AI',
        icon: Sprout,
        vote: 'OBJECT',
        confidence: 78,
        stance: 'Industrial runoff threatens groundwater tables supplying nearby organic sugarcane fields.',
        reasoning: 'Objects to layout coordinates. The downstream canal system receives industrial runoff. demards water treatment plants at the sector exits.',
        priority: 'Groundwater Quality Protection',
        policyRef: 'Directive AG-14',
        policyName: 'Irrigation Water Safety Standards',
        conflictsWith: ['Infrastructure AI', 'Economy Sector AI'],
        alliesWith: ['Environment AI']
      },
      {
        id: 'ag-infra',
        name: 'Infrastructure AI',
        icon: Building2,
        vote: 'APPROVE',
        confidence: 90,
        stance: 'Sufficient grid load capacity exists to anchor the new 150MW substation and reinforce heavy industries.',
        reasoning: 'The layout utilizes existing structural baselines. Strengthens the national power grid loop. Re-routing can handle load peaks successfully.',
        priority: 'Grid Anchor Feasibility',
        policyRef: 'Standard INF-40',
        policyName: 'Substation Grid Interconnection Rules',
        conflictsWith: ['Agriculture AI'],
        alliesWith: ['Economy Sector AI', 'Energy AI']
      },
      {
        id: 'ag-econ',
        name: 'Economy Sector AI',
        icon: TrendingUp,
        vote: 'APPROVE',
        confidence: 96,
        stance: 'Industrial expansion attracts ₹140 Crore in annual investments and adds 2,400 skilled manufacturing jobs.',
        reasoning: 'Crucial for economic targets. Chemical self-sufficiency is a regional mandate. Delaying expansion causes capital flight to other divisions.',
        priority: 'Investment & Job Optimization',
        policyRef: 'Bylaw EC-01',
        policyName: 'Special Economic Zone Development Act',
        conflictsWith: ['Health Sector AI', 'Environment AI'],
        alliesWith: ['Energy AI', 'Infrastructure AI']
      },
      {
        id: 'ag-edu',
        name: 'Education AI',
        icon: GraduationCap,
        vote: 'APPROVE',
        confidence: 70,
        stance: 'Hadapsar vocational institute stands to gain direct research sponsorships from the industrial sector.',
        reasoning: 'Approve with conditions. Industry-linked apprenticeship grants offset training budget costs. Demands secondary filtration for schools within 5km.',
        priority: 'Apprenticeship Sponsorships',
        policyRef: 'Code ED-15',
        policyName: 'Vocational Training Collaboration Act',
        conflictsWith: ['Health Sector AI'],
        alliesWith: ['Economy Sector AI']
      },
      {
        id: 'ag-trans',
        name: 'Transport AI',
        icon: Truck,
        vote: 'APPROVE',
        confidence: 80,
        stance: 'Existing rail spur can handle chemical cargo movements without disrupting civilian highway layouts.',
        reasoning: 'Rail transport bypasses arterial roads. Mitigates road safety hazards. Demands dedicated rail tankers with automatic valve isolation.',
        priority: 'Freight Rail Corridor Usage',
        policyRef: 'Directive TR-22',
        policyName: 'Rail Cargo Transit Regulations',
        conflictsWith: ['Hazard Mitigation AI'],
        alliesWith: ['Infrastructure AI']
      },
      {
        id: 'ag-env',
        name: 'Environment AI',
        icon: Leaf,
        vote: 'OBJECT',
        confidence: 95,
        stance: 'Industrial chemical emissions exceed the sector air quality thresholds. Mitigation offsets are insufficient.',
        reasoning: 'Strong objection. Predicted sulfur levels will breach threshold boundaries. Recommends rejecting the chemical zoning unless carbon scrubbers are mandated.',
        priority: 'Air Quality Threshold Compliance',
        policyRef: 'Clause EN-01',
        policyName: 'National Ambient Air Quality Standard',
        conflictsWith: ['Economy Sector AI', 'Energy AI'],
        alliesWith: ['Health Sector AI', 'Agriculture AI']
      },
      {
        id: 'ag-energy',
        name: 'Energy AI',
        icon: Zap,
        vote: 'APPROVE',
        confidence: 98,
        stance: 'The 150MW substation resolves the current industrial grid voltage drop issue, securing supply.',
        reasoning: 'High confidence. Industrial expansion provides peak load justification for grid upgrades. Secures system backup during monsoon spikes.',
        priority: 'Substation Expansion & Upgrades',
        policyRef: 'Rule EN-12',
        policyName: 'Grid Stability & Transmission Rules',
        conflictsWith: ['Health Sector AI', 'Environment AI'],
        alliesWith: ['Economy Sector AI', 'Infrastructure AI']
      }
    ],
    actionItems: [
      { text: 'Approve Special Economic Zone Hadapsar layout outline', status: 'completed', lead: 'Economy Sector AI' },
      { text: 'Mandate industrial rail spur connection for toxic chemicals', status: 'completed', lead: 'Transport AI' },
      { text: 'Establish 2 km buffer zone around residential schools', status: 'pending', lead: 'Health Sector AI' },
      { text: 'Enforce high-performance carbon scrubbers on chemical boilers', status: 'critical', lead: 'Environment AI' }
    ],
    frictionNodes: [
      { agentA: 'Environment AI', agentB: 'Economy Sector AI', issue: 'Environment demands carbon caps; Economy objects due to lower profitability margins.', severity: 'high' },
      { agentA: 'Health Sector AI', agentB: 'Energy AI', issue: 'Health opposes placing the high-voltage substation near residential sector boundaries.', severity: 'medium' },
      { agentA: 'Agriculture AI', agentB: 'Infrastructure AI', issue: 'Agriculture objects to water discharge routing; Infrastructure claims current channels are optimal.', severity: 'medium' }
    ]
  },
  {
    id: 'scen-3',
    title: 'Zero-Emission Green Transit & School Zones',
    description: 'Banning diesel freight trucks within school districts during school hours (7 AM - 2 PM), retrofitting streets with cycling corridors and solar microgrids.',
    consensusScore: 76,
    riskScore: 22,
    agreementIndex: 82,
    execSummary: 'High consensus for the zero-emission school transit zones. Child health and pedagogical benefits (Education, Health, Environment) are clear. Financial offsets for local merchants due to delivery locks have been mitigated with secondary slots.',
    agents: [
      {
        id: 'ag-health',
        name: 'Health Sector AI',
        icon: HeartPulse,
        vote: 'APPROVE',
        confidence: 96,
        stance: 'Diesel emission bans will cut pediatric asthma admissions in surrounding wards by 14%.',
        reasoning: 'High health optimization. Childhood health benefits far outweigh commercial cargo delays. Cycling paths support active lifestyle indicators.',
        priority: 'Pediatric Asthma Risk Reduction',
        policyRef: 'Article 8-P',
        policyName: 'Clean Air for Children Guidelines',
        conflictsWith: ['Economy Sector AI'],
        alliesWith: ['Education AI', 'Environment AI']
      },
      {
        id: 'ag-hazard',
        name: 'Hazard Mitigation AI',
        icon: Flame,
        vote: 'APPROVE',
        confidence: 84,
        stance: 'Banning heavy trucks in school zones prevents pedestrian-freight vehicle accidents during peak hours.',
        reasoning: 'Reduces pedestrian collision parameters. Establishes safe pickup lanes. Emergency vehicle path clearance is maintained.',
        priority: 'Pedestrian Collision Prevention',
        policyRef: 'Section 4-SZ',
        policyName: 'School Zone Traffic Safety Code',
        conflictsWith: [],
        alliesWith: ['Transport AI']
      },
      {
        id: 'ag-agri',
        name: 'Agriculture AI',
        icon: Sprout,
        vote: 'ABSTAIN',
        confidence: 65,
        stance: 'Minimal correlation with crop yields, though local organic farming stalls stand to benefit from cycling corridors.',
        reasoning: 'Neutral stance. The urban layout changes have no impact on rural agriculture, though micro-markets gain foot traffic.',
        priority: 'Local Farmers Markets Access',
        policyRef: 'Directive AG-02',
        policyName: 'Urban Agriculture Support Rules',
        conflictsWith: [],
        alliesWith: ['Environment AI']
      },
      {
        id: 'ag-infra',
        name: 'Infrastructure AI',
        icon: Building2,
        vote: 'APPROVE',
        confidence: 82,
        stance: 'Roadway space is sufficient to accommodate cycling barriers and solar street light installations.',
        reasoning: 'Supports cycling track layouts. Incorporates small-scale solar microgrids on school roofs. Capital cost is fully offset by government carbon credits.',
        priority: 'Green Corridor retrofitting',
        policyRef: 'Standard INF-12',
        policyName: 'Green Infrastructure Design Manual',
        conflictsWith: ['Economy Sector AI'],
        alliesWith: ['Energy AI', 'Transport AI']
      },
      {
        id: 'ag-econ',
        name: 'Economy Sector AI',
        icon: TrendingUp,
        vote: 'OBJECT',
        confidence: 85,
        stance: 'Delivery bans from 7 AM - 2 PM lock out local merchants, reducing retail volumes by estimated 8%.',
        reasoning: 'Objecting to rigid time locks. Retailers depend on morning inventory deliveries. Recommends allowing low-emission electric vans.',
        priority: 'Merchant Delivery Continuity',
        policyRef: 'Bylaw EC-90',
        policyName: 'Municipal Commerce Protection Rules',
        conflictsWith: ['Health Sector AI', 'Education AI'],
        alliesWith: ['Transport AI']
      },
      {
        id: 'ag-edu',
        name: 'Education AI',
        icon: GraduationCap,
        vote: 'APPROVE',
        confidence: 98,
        stance: 'Quiet, pollution-free environments are optimal for student concentration and cognitive development.',
        reasoning: 'Maximum consensus. Protects the student population. School districts should serve as leading zones for sustainable municipal designs.',
        priority: 'Student Health & Quiet Zones',
        policyRef: 'Code ED-44',
        policyName: 'National Right to Education Safety Act',
        conflictsWith: ['Economy Sector AI'],
        alliesWith: ['Health Sector AI', 'Environment AI']
      },
      {
        id: 'ag-trans',
        name: 'Transport AI',
        icon: Truck,
        vote: 'APPROVE',
        confidence: 88,
        stance: 'Bus timetables can align with the ban, and electric shuttle corridors can bypass the closed lanes.',
        reasoning: 'Redirects diesel fleets. Cycling corridors integrate with transit stations. Electric shuttle paths handle student flows.',
        priority: 'Transit Corridor Integration',
        policyRef: 'Directive TR-04',
        policyName: 'Active Transport & Cycling Bylaw',
        conflictsWith: ['Economy Sector AI'],
        alliesWith: ['Infrastructure AI', 'Environment AI']
      },
      {
        id: 'ag-env',
        name: 'Environment AI',
        icon: Leaf,
        vote: 'APPROVE',
        confidence: 94,
        stance: 'Restricting freight vehicle combustion reduces nitrogen dioxide levels inside city centers by 22%.',
        reasoning: 'Improves environmental air quality index. Curbs greenhouse emissions. Solar microgrids feed clean power back to local grids.',
        priority: 'Urban Air Quality Optimization',
        policyRef: 'Clause EN-90',
        policyName: 'Municipal Carbon Reduction Framework',
        conflictsWith: [],
        alliesWith: ['Health Sector AI', 'Transport AI']
      },
      {
        id: 'ag-energy',
        name: 'Energy AI',
        icon: Zap,
        vote: 'APPROVE',
        confidence: 90,
        stance: 'Solar microgrids on school rooftops provide 45% of campus electricity, offsetting carbon loads.',
        reasoning: 'Rooftop solar fits grid topology. Reduces substation load during summer peak cooling demands. Stabilizes distribution network.',
        priority: 'School Rooftop Solar Microgrids',
        policyRef: 'Rule EN-32',
        policyName: 'Distributed Energy Net Metering Code',
        conflictsWith: [],
        alliesWith: ['Infrastructure AI']
      }
    ],
    actionItems: [
      { text: 'Draft diesel vehicle restriction bylaws for school wards', status: 'completed', lead: 'Education AI' },
      { text: 'Install solar panel arrays on 12 municipal school roofs', status: 'completed', lead: 'Energy AI' },
      { text: 'Construct physical cycling corridor barriers on Lane 3', status: 'pending', lead: 'Infrastructure AI' },
      { text: 'Create delivery permit system for electric transport vans', status: 'pending', lead: 'Economy Sector AI' }
    ],
    frictionNodes: [
      { agentA: 'Economy Sector AI', agentB: 'Education AI', issue: 'Economy opposes total morning delivery ban; demands exemptions for retail slots.', severity: 'high' },
      { agentA: 'Economy Sector AI', agentB: 'Infrastructure AI', issue: 'Economy objects to space allocation for cycle tracks; demands retention of parking lanes.', severity: 'medium' }
    ]
  }
];

export default function GovernanceCouncilDashboard() {
  const { setActiveTab } = useUiStore();

  // Sync tab highlight on sidebar
  useEffect(() => {
    setActiveTab('Governance Council');
  }, [setActiveTab]);

  // Active scenario state
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scen-1');
  
  // Find current scenario details
  const activeScenario = useMemo(() => {
    return SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];
  }, [activeScenarioId]);

  // Selected agent detail state
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ag-health');

  // Find selected agent details
  const selectedAgent = useMemo(() => {
    return activeScenario.agents.find(a => a.id === selectedAgentId) || activeScenario.agents[0];
  }, [activeScenario, selectedAgentId]);

  // Reset selected agent when scenario changes to avoid mismatches
  useEffect(() => {
    setSelectedAgentId(activeScenario.agents[0].id);
  }, [activeScenario]);

  // Helper for Vote Badge styling
  const getVoteBadgeStyles = (vote: CouncilAgent['vote']) => {
    switch (vote) {
      case 'APPROVE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'OBJECT':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'ABSTAIN':
      default:
        return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getVoteIcon = (vote: CouncilAgent['vote']) => {
    switch (vote) {
      case 'APPROVE':
        return <ThumbsUp className="w-3 h-3 shrink-0" />;
      case 'OBJECT':
        return <ThumbsDown className="w-3 h-3 shrink-0" />;
      case 'ABSTAIN':
      default:
        return <Info className="w-3 h-3 shrink-0" />;
    }
  };

  // Helper for action item status badges
  const getActionStatusBadge = (status: 'completed' | 'pending' | 'critical') => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse';
      case 'pending':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CASE SELECTION                                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-royal-blue dark:bg-persian-blue animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-royal-blue dark:text-brand-yellow font-bold">
              Multi-Agent AI Heuristic Consensus
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5 text-royal-blue dark:text-blue-400" />
              9 Sector Council Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Governance Council Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Simulating policy negotiations, cross-sector friction modeling, and joint directives.
          </p>
        </div>

        {/* Dynamic Scenario Select Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {SCENARIOS.map((scen) => (
            <button
              key={scen.id}
              onClick={() => setActiveScenarioId(scen.id)}
              className={cn(
                'h-10 px-4 text-xs font-bold rounded-lg transition-all border cursor-pointer',
                activeScenarioId === scen.id
                  ? 'bg-royal-blue border-royal-blue text-white shadow-md dark:bg-persian-blue dark:border-persian-blue'
                  : 'bg-card border-border text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
              )}
            >
              {scen.id === 'scen-1' ? '⚡ Monsoon Evac' : scen.id === 'scen-2' ? '🏭 Industrial Zone' : '🚲 Green Schools'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OVERALL CONSENSUS & CORE STATISTICS                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Consensus Radial Gauge */}
        <Card className="bg-card border-border shadow-xs flex flex-col justify-between p-5 min-h-[220px]">
          <div className="flex justify-between items-center text-slate-550 dark:text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Overall Consensus</span>
            <Activity className="w-4.5 h-4.5 text-royal-blue dark:text-blue-400" />
          </div>
          
          <div className="flex items-center justify-center py-2 relative">
            <svg className="w-28 h-28 transform -rotate-95" viewBox="0 0 100 100">
              {/* Back ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="fill-transparent stroke-slate-100 dark:stroke-slate-900"
                strokeWidth="8"
              />
              {/* Fill ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="fill-transparent stroke-royal-blue dark:stroke-persian-blue transition-all duration-500"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * activeScenario.consensusScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {activeScenario.consensusScore}%
              </span>
              <span className="text-[8px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-bold">
                Agreement
              </span>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-center text-slate-450 dark:text-slate-500 border-t border-border/60 pt-3">
            Threshold to ratify directive: <strong className="text-royal-blue dark:text-blue-400">70.0%</strong>
          </div>
        </Card>

        {/* Risk & Agreement Index cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Risk & Feasibility Coefficients */}
          <Card className="bg-card border-border shadow-xs p-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Risk Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Crisis Risk Coefficient</span>
                  <strong className={cn(
                    "text-xs font-black font-mono",
                    activeScenario.riskScore > 50 ? "text-rose-500" : "text-emerald-500"
                  )}>
                    {activeScenario.riskScore} / 100
                  </strong>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      activeScenario.riskScore > 50 ? "bg-rose-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${activeScenario.riskScore}%` }} 
                  />
                </div>
              </div>

              {/* Agreement Index */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span className="uppercase tracking-wider">Conflict Dispersion Index</span>
                  <strong className="text-xs font-black font-mono text-royal-blue dark:text-blue-400">
                    {100 - activeScenario.agreementIndex} / 100
                  </strong>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full bg-royal-blue dark:bg-persian-blue rounded-full transition-all duration-500" 
                    style={{ width: `${100 - activeScenario.agreementIndex}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-450 dark:text-slate-500 border-t border-border/60 pt-3 flex items-center gap-1.5 leading-snug">
              <Info className="w-3.5 h-3.5 text-royal-blue dark:text-blue-400 shrink-0" />
              <span>Low risk and low conflict dispersion index model indicates a stable policy pathway.</span>
            </div>
          </Card>

          {/* Card: Policy Executive Summary */}
          <Card className="md:col-span-2 bg-card border-border shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400">
                <Scale className="w-4 h-4 text-royal-blue dark:text-blue-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider">AI Executive Directive Summary</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-2 leading-snug">
                {activeScenario.title}
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                {activeScenario.execSummary}
              </p>
            </div>
            
            <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-border/60 pt-3 flex items-center justify-between">
              <span>Decision Model: Heuristics Net v4.2</span>
              <span className="font-mono text-[9px] font-bold bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-border">
                {activeScenario.consensusScore >= 70 ? 'DIRECTIVE RATIFIED' : 'PENDING NEGOTIATION'}
              </span>
            </div>
          </Card>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 3x3 AGENT VOTING MATRIX GRID & DETAIL INSPECTOR                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: 3x3 Agent Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
              Governance Council Voting Grid (9 Sectors)
            </span>
            <span className="text-[9px] text-slate-400">Click a card to audit details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeScenario.agents.map((agent) => {
              const AgentIcon = agent.icon;
              const isSelected = selectedAgentId === agent.id;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={cn(
                    'p-4 bg-card border rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden group shadow-2xs',
                    isSelected 
                      ? 'ring-3 ring-royal-blue/30 border-royal-blue dark:border-blue-400 scale-[1.02] z-10' 
                      : 'border-border hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg border",
                        isSelected ? "bg-royal-blue/10 border-royal-blue/30 text-royal-blue dark:text-blue-400" : "bg-slate-100 border-border text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                      )}>
                        <AgentIcon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">
                        {agent.name.split(' ')[0]}
                      </span>
                    </div>
                    
                    <span className={cn(
                      'text-[8px] font-mono border px-1.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-1 tracking-wide',
                      getVoteBadgeStyles(agent.vote)
                    )}>
                      {getVoteIcon(agent.vote)}
                      {agent.vote}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal font-sans line-clamp-3 mt-3">
                    {agent.stance}
                  </p>

                  <div className="w-full mt-4 border-t border-border/60 pt-2 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-450 dark:text-slate-500">Confidence:</span>
                    <strong className="text-slate-700 dark:text-slate-350">{agent.confidence}%</strong>
                  </div>

                  {/* Top corner gradient highlight */}
                  <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.03] group-hover:opacity-[0.08] bg-current rounded-bl-full pointer-events-none" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Agent Detail Inspector */}
        <Card className="bg-card border-border shadow-xs flex flex-col justify-between min-h-[380px] p-5">
          <div className="space-y-4">
            
            {/* Inspector Header */}
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4.5 h-4.5 text-royal-blue dark:text-blue-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Agent Telemetry Inspector
                </span>
              </div>
              <span className="font-mono text-[8px] font-bold text-slate-500">
                {selectedAgent.id.toUpperCase()}
              </span>
            </div>

            {/* Agent Identity */}
            <div className="flex items-center gap-3">
              {React.createElement(selectedAgent.icon, {
                className: "w-8 h-8 text-royal-blue dark:text-blue-400 p-1.5 rounded-lg bg-royal-blue/10 border border-royal-blue/20"
              })}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                  {selectedAgent.name}
                </h4>
                <span className="text-[9px] text-slate-500 font-medium block mt-1">
                  Primary Domain: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{selectedAgent.priority}</strong>
                </span>
              </div>
            </div>

            {/* Stance details */}
            <div className="space-y-2 text-xs border-t border-border/60 pt-3">
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Negotiation Stance</span>
              <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                {selectedAgent.stance}
              </p>
            </div>

            {/* Deep logic reasoning */}
            <div className="space-y-2 text-xs border-t border-border/60 pt-3">
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Core Logic Logic Models</span>
              <p className="text-slate-700 dark:text-slate-450 font-sans leading-relaxed p-2.5 rounded bg-slate-50 dark:bg-slate-900/50 border border-border/50">
                {selectedAgent.reasoning}
              </p>
            </div>

            {/* Policy Reference */}
            <div className="space-y-2 text-xs border-t border-border/60 pt-3">
              <span className="block text-[9px] font-bold text-slate-500 uppercase">Policy Guideline Anchor</span>
              <div className="flex items-start gap-2 bg-royal-blue/5 border border-royal-blue/10 dark:bg-slate-900/30 dark:border-slate-800 p-2.5 rounded-lg">
                <FileText className="w-4.5 h-4.5 text-royal-blue dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[10px]">
                  <strong className="block text-royal-blue dark:text-blue-400 font-mono font-bold leading-tight">
                    {selectedAgent.policyRef} • {selectedAgent.policyName}
                  </strong>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Municipal Regulatory Code reference validated.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Alliances / Friction list */}
          <div className="border-t border-border/60 pt-3.5 mt-4 flex items-center justify-between text-[10px]">
            <div className="flex gap-1.5 flex-1 border-r border-border pr-2">
              <span className="text-slate-400 font-bold uppercase text-[8px] shrink-0 mt-0.5">Allies:</span>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.alliesWith.length > 0 ? (
                  selectedAgent.alliesWith.map(ally => (
                    <span key={ally} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] px-1 py-0.5 rounded border border-emerald-500/20 font-bold">
                      {ally.split(' ')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[8px] italic">None declared</span>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 flex-1 pl-3">
              <span className="text-slate-400 font-bold uppercase text-[8px] shrink-0 mt-0.5">Friction:</span>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.conflictsWith.length > 0 ? (
                  selectedAgent.conflictsWith.map(conf => (
                    <span key={conf} className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] px-1 py-0.5 rounded border border-rose-500/20 font-bold">
                      {conf.split(' ')[0]}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[8px] italic">None declared</span>
                )}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* 4. CROSS-SECTOR FRICTION MAP & JOINT RECOMMENDATIONS                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Conflict Friction map */}
        <Card className="lg:col-span-2 bg-card border-border shadow-xs p-5 flex flex-col justify-between min-h-[300px]">
          <CardHeader className="p-0 pb-3 border-b border-border/80">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
                  Cross-Sector Conflict Friction Matrix
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 mt-0.5">
                  Point-to-point friction metrics modeling cross-sector policy contradictions
                </CardDescription>
              </div>
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 flex-1 space-y-3 overflow-y-auto">
            {activeScenario.frictionNodes.map((node, index) => (
              <div 
                key={index}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/35",
                  node.severity === 'high' ? 'bg-rose-50/10 border-rose-500/20' : 'bg-slate-50/40 border-border/50 dark:bg-slate-900/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-900 dark:text-slate-200 uppercase">{node.agentA.split(' ')[0]}</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest leading-none mt-1">vs</span>
                    <span className="text-[9px] font-bold text-slate-900 dark:text-slate-200 uppercase mt-1">{node.agentB.split(' ')[0]}</span>
                  </div>
                  
                  <div className="h-8 w-px bg-border/60" />
                  
                  <div>
                    <span className={cn(
                      'text-[7.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border',
                      node.severity === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    )}>
                      {node.severity} friction
                    </span>
                    <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                      {node.issue}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-slate-300 dark:text-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right: Joint Recommendations Checklist */}
        <Card className="bg-card border-border shadow-xs p-5 flex flex-col justify-between min-h-[300px]">
          <CardHeader className="p-0 pb-3 border-b border-border/80">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
                  Joint Policy Action Items
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 mt-0.5">
                  Consensus synthesized directives validated for execution
                </CardDescription>
              </div>
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4 flex-1 space-y-3.5 overflow-y-auto">
            {activeScenario.actionItems.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-[11px] text-slate-900 dark:text-slate-300 font-sans leading-relaxed">
                    {item.text}
                  </p>
                  <span className={cn(
                    'text-[7.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border shrink-0',
                    getActionStatusBadge(item.status)
                  )}>
                    {item.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-slate-450 dark:text-slate-500 border-b border-border/30 pb-2">
                  <span>Lead Sector: {item.lead.split(' ')[0]}</span>
                  <span>Verifiable</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
