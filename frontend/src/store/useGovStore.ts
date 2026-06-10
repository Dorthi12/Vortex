import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ComplaintPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type PolicyStatus = 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Archived';

export interface GovComplaint {
  id: string;
  title: string;
  citizen: string;
  phone: string;
  location: string;
  district: string;
  state: string;
  category: string;
  department: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  submittedAt: string;
  description: string;
  aiCategory: string;
  aiSuggestion: string;
  assignedOfficer?: string;
  timeline: { status: string; note: string; timestamp: string; by: string }[];
}

export interface Policy {
  id: string;
  title: string;
  department: string;
  region: string;
  type: string;
  status: PolicyStatus;
  effectiveDate: string;
  expiryDate: string;
  description: string;
  approvalAuthority: string;
  views: number;
  downloads: number;
  affectedPop: string;
  createdAt: string;
  publishedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  activeCases: number;
  complaints: number;
  alerts: number;
  performance: number;
  resourceUsage: number;
  policyCompliance: number;
  status: 'Operational' | 'Alert' | 'Critical';
  color: string;
  icon: string;
}

export interface Resource {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  allocated: number;
  available: number;
  unit: string;
  district: string;
  lastUpdated: string;
  criticality: 'Critical' | 'High' | 'Normal';
}

export interface GovUser {
  id: string;
  name: string;
  role: string;
  department: string;
  district: string;
  govId: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
  permissions: string[];
}

export interface AuditEntry {
  id: string;
  action: string;
  module: string;
  officer: string;
  role: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

export interface CouncilRecommendation {
  id: string;
  title: string;
  domain: string;
  priority: 'Critical' | 'High' | 'Medium';
  agentVotes: { agent: string; vote: 'Approve' | 'Reject' | 'Abstain'; confidence: number; reason: string }[];
  consensusScore: number;
  riskScore: number;
  status: 'Pending Human Review' | 'Approved' | 'Rejected' | 'Implemented';
  createdAt: string;
  policyRef?: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

export const MOCK_GOV_COMPLAINTS: GovComplaint[] = [
  {
    id: 'CMP-00421', title: 'Sewage overflow blocking National Highway 48', citizen: 'Rajesh Kumar Sharma', phone: '9876543210',
    location: 'NH-48, Km 204, Pune-Mumbai Expressway', district: 'Pune', state: 'Maharashtra',
    category: 'Sanitation & Waste', department: 'Infrastructure', priority: 'Critical', status: 'In Progress',
    submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    description: 'Major sewage overflow causing health hazard and traffic disruption on National Highway. Three lanes are blocked and the situation is worsening.',
    aiCategory: 'Infrastructure / Sanitation Emergency', aiSuggestion: 'Deploy SEB repair team within 2 hours. Coordinate with NHAI for lane closure management.',
    assignedOfficer: 'Er. Priya Deshmukh, IES',
    timeline: [
      { status: 'Submitted', note: 'Complaint received via citizen portal', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), by: 'Citizen Portal' },
      { status: 'Under Review', note: 'AI categorized as Critical Infrastructure Emergency', timestamp: new Date(Date.now() - 3600000 * 5.5).toISOString(), by: 'AI Engine' },
      { status: 'Assigned', note: 'Assigned to Er. Priya Deshmukh, Infrastructure Dept.', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), by: 'Desk Officer Mehta' },
      { status: 'In Progress', note: 'Repair team dispatched. ETA 45 minutes.', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), by: 'Er. Priya Deshmukh' },
    ]
  },
  {
    id: 'CMP-00419', title: 'Dengue fever cluster in Sector 7 — 14 reported cases', citizen: 'Sunita Devi Patil', phone: '9845001122',
    location: 'Sector 7, Ward 12, Hadapsar, Pune', district: 'Pune', state: 'Maharashtra',
    category: 'Public Health', department: 'Health', priority: 'Critical', status: 'Assigned',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    description: 'Multiple households reporting dengue symptoms. Local clinic is overwhelmed. Stagnant water from construction site is the likely vector source.',
    aiCategory: 'Disease Outbreak / Vector-borne', aiSuggestion: 'Mobilize fogging unit and deploy rapid diagnostic team. Issue public health advisory for the ward.',
    assignedOfficer: 'Dr. Anjali Rao, CMHO',
    timeline: [
      { status: 'Submitted', note: 'Complaint logged by local health worker', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), by: 'Health Worker' },
      { status: 'Under Review', note: 'Flagged as potential outbreak — escalated to CMHO', timestamp: new Date(Date.now() - 3600000 * 11).toISOString(), by: 'AI Engine' },
      { status: 'Assigned', note: 'CMHO Dr. Anjali Rao assigned. Fogging scheduled.', timestamp: new Date(Date.now() - 3600000 * 9).toISOString(), by: 'Health Secretary' },
    ]
  },
  {
    id: 'CMP-00415', title: 'Bridge structural cracks — Sangam Road overpass', citizen: 'Mohammad Arif Khan', phone: '9922334455',
    location: 'Sangam Road Overpass, Pune Central', district: 'Pune', state: 'Maharashtra',
    category: 'Infrastructure / Safety', department: 'Infrastructure', priority: 'High', status: 'Under Review',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    description: 'Visible cracks on the bridge support pillars. Locals are worried about structural integrity. Heavy vehicles continue to use the bridge.',
    aiCategory: 'Structural Safety Alert', aiSuggestion: 'Immediate structural audit required. Consider temporary load restriction pending engineer assessment.',
    timeline: [
      { status: 'Submitted', note: 'Filed via NETRAVAAH citizen app with photos attached', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), by: 'Citizen Portal' },
      { status: 'Under Review', note: 'PWD structural engineer review scheduled for tomorrow', timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), by: 'PWD Helpdesk' },
    ]
  },
  {
    id: 'CMP-00412', title: 'Crop failure — unseasonal rain damaged 400 acres', citizen: 'Ramesh Vitthal Bhoite', phone: '9011223344',
    location: 'Village Takli, Ahmednagar District', district: 'Ahmednagar', state: 'Maharashtra',
    category: 'Agriculture / Disaster', department: 'Agriculture', priority: 'High', status: 'Resolved',
    submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    description: 'Unseasonal hailstorm destroyed approximately 400 acres of standing soybean and cotton crops. Farmers need immediate compensation assessment.',
    aiCategory: 'Agricultural Disaster / Crop Loss', aiSuggestion: 'Trigger PM Fasal Bima Yojana claim process. Deploy agricultural survey team for loss assessment.',
    assignedOfficer: 'Smt. Kavita Sharma, Agricultural Officer',
    timeline: [
      { status: 'Submitted', note: 'Complaint registered with GPS coordinates', timestamp: new Date(Date.now() - 3600000 * 72).toISOString(), by: 'Citizen Portal' },
      { status: 'Assigned', note: 'Agricultural survey team assigned', timestamp: new Date(Date.now() - 3600000 * 60).toISOString(), by: 'District Collector' },
      { status: 'In Progress', note: 'Field survey completed. Loss assessed at ₹1.2 Cr.', timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), by: 'Survey Team' },
      { status: 'Resolved', note: 'Compensation orders issued. PM Fasal Bima claims filed.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), by: 'District Collector' },
    ]
  },
  {
    id: 'CMP-00409', title: 'Power outage — 3 villages without electricity for 48 hours', citizen: 'Vijay Ganpat Kadam', phone: '9633221100',
    location: 'Villages: Pargaon, Nimgaon, Walchandnagar, Solapur', district: 'Solapur', state: 'Maharashtra',
    category: 'Energy / Electricity', department: 'Energy', priority: 'High', status: 'In Progress',
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    description: 'Extended power failure affecting three villages. Medical equipment in primary health centers also down. Patients at risk.',
    aiCategory: 'Energy Infrastructure / Emergency', aiSuggestion: 'Deploy mobile generator to PHC immediately. Send MSEDCL repair crew with transformer replacement unit.',
    assignedOfficer: 'Er. Suresh Bhosale, MSEDCL',
    timeline: [
      { status: 'Submitted', note: 'Emergency complaint received', timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), by: 'Citizen Portal' },
      { status: 'Assigned', note: 'MSEDCL engineer assigned', timestamp: new Date(Date.now() - 3600000 * 45).toISOString(), by: 'Control Room' },
      { status: 'In Progress', note: 'Repair crew on site. Transformer replacement in progress.', timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), by: 'Er. Suresh Bhosale' },
    ]
  },
  {
    id: 'CMP-00406', title: 'School building roof collapse — 2 students injured', citizen: 'Meera Shankar Naidu', phone: '9744556677',
    location: 'Govt. Primary School, Ward 5, Latur', district: 'Latur', state: 'Maharashtra',
    category: 'Education / Infrastructure', department: 'Education', priority: 'Critical', status: 'Resolved',
    submittedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    description: 'Roof of classroom 3 partially collapsed during school hours. Two students sustained minor injuries. School closed for safety inspection.',
    aiCategory: 'Infrastructure Emergency / Education Safety', aiSuggestion: 'Immediate structural audit. Medical care for injured. Alternative learning space arrangement required.',
    assignedOfficer: 'Shri Arun Pawar, District Education Officer',
    timeline: [
      { status: 'Submitted', note: 'Emergency complaint filed by school principal', timestamp: new Date(Date.now() - 3600000 * 96).toISOString(), by: 'School Principal' },
      { status: 'Assigned', note: 'DEO and structural engineer assigned', timestamp: new Date(Date.now() - 3600000 * 94).toISOString(), by: 'District Collector' },
      { status: 'In Progress', note: 'Students shifted to alternate premises. Structural audit underway.', timestamp: new Date(Date.now() - 3600000 * 80).toISOString(), by: 'DEO' },
      { status: 'Resolved', note: 'Repair work completed. Building certified safe. School reopened.', timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), by: 'PWD' },
    ]
  },
  {
    id: 'CMP-00403', title: 'Flood water not receding — 200 families stranded', citizen: 'Abdul Rashid Shaikh', phone: '9512233445',
    location: 'Riverside Colony, Kolhapur', district: 'Kolhapur', state: 'Maharashtra',
    category: 'Disaster / Flood', department: 'Hazard', priority: 'Critical', status: 'In Progress',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    description: 'Flood water in Riverside Colony has not receded despite rainfall stopping 12 hours ago. Approximately 200 families are stranded without food or drinking water.',
    aiCategory: 'Flood Emergency / Humanitarian', aiSuggestion: 'Deploy NDRF team with boats. Arrange emergency food packets and drinking water supply. Open nearest relief camp.',
    assignedOfficer: 'Shri Rajiv Nair, District Disaster Manager',
    timeline: [
      { status: 'Submitted', note: 'SOS received via helpline and citizen app', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), by: 'Emergency Helpline' },
      { status: 'Under Review', note: 'Situation assessed as humanitarian emergency', timestamp: new Date(Date.now() - 3600000 * 7.5).toISOString(), by: 'AI Engine' },
      { status: 'Assigned', note: 'NDRF team and boat rescue dispatched', timestamp: new Date(Date.now() - 3600000 * 7).toISOString(), by: 'DDMA Office' },
      { status: 'In Progress', note: '120 families evacuated. Relief camp operational.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), by: 'NDRF Team' },
    ]
  },
  {
    id: 'CMP-00401', title: 'Illegal sand mining destroying river bank', citizen: 'Priya Vishwas Tupe', phone: '9966778899',
    location: 'Bhima River Bank, Solapur Road, Pune', district: 'Pune', state: 'Maharashtra',
    category: 'Environment / Illegal Activity', department: 'Environment', priority: 'Medium', status: 'Under Review',
    submittedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    description: 'Illegal sand mining equipment operating at night near Bhima river. River bank erosion visible. No permits visible.',
    aiCategory: 'Environmental Violation / Illegal Mining', aiSuggestion: 'Issue stop-work order. Coordinate with police for enforcement action. File FIR under MMDR Act.',
    timeline: [
      { status: 'Submitted', note: 'Complaint filed with photographic evidence', timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), by: 'Citizen Portal' },
      { status: 'Under Review', note: 'District environment officer notified for verification', timestamp: new Date(Date.now() - 3600000 * 30).toISOString(), by: 'Control Room' },
    ]
  },
];

export const MOCK_POLICIES: Policy[] = [
  { id: 'POL-2024-001', title: 'National Digital Governance Infrastructure Policy 2024', department: 'Ministry of Electronics & IT', region: 'National', type: 'Infrastructure', status: 'Published', effectiveDate: '2024-04-01', expiryDate: '2027-03-31', description: 'Comprehensive policy for digital infrastructure development across all government departments.', approvalAuthority: 'Cabinet Secretary', views: 45200, downloads: 8900, affectedPop: '1.4 Billion', createdAt: '2024-01-15', publishedAt: '2024-03-28' },
  { id: 'POL-2024-002', title: 'Pradhan Mantri Crop Insurance Enhancement Scheme', department: 'Ministry of Agriculture', region: 'National', type: 'Agriculture', status: 'Published', effectiveDate: '2024-06-01', expiryDate: '2027-05-31', description: 'Enhanced crop insurance coverage with AI-based damage assessment for all enrolled farmers.', approvalAuthority: 'Agriculture Minister', views: 28100, downloads: 5400, affectedPop: '120 Million Farmers', createdAt: '2024-02-10', publishedAt: '2024-05-20' },
  { id: 'POL-2024-003', title: 'State Emergency Health Response Protocol 2024', department: 'Ministry of Health', region: 'Maharashtra', type: 'Health', status: 'Under Review', effectiveDate: '2024-09-01', expiryDate: '2027-08-31', description: 'Standardized emergency health response protocol for disease outbreaks and mass casualty events.', approvalAuthority: 'Health Secretary', views: 5600, downloads: 1200, affectedPop: '125 Million', createdAt: '2024-06-01' },
  { id: 'POL-2024-004', title: 'Municipal Infrastructure Maintenance Standards', department: 'Ministry of Urban Development', region: 'Maharashtra', type: 'Infrastructure', status: 'Approved', effectiveDate: '2024-07-01', expiryDate: '2029-06-30', description: 'New standards for preventive maintenance of bridges, roads, and civic infrastructure.', approvalAuthority: 'Urban Development Secretary', views: 12300, downloads: 3100, affectedPop: '50 Million Urban Citizens', createdAt: '2024-03-15' },
  { id: 'POL-2024-005', title: 'Renewable Energy Grid Integration Policy', department: 'Ministry of Power', region: 'National', type: 'Energy', status: 'Draft', effectiveDate: '2025-01-01', expiryDate: '2030-12-31', description: 'Policy for mandatory integration of renewable energy sources into the national power grid.', approvalAuthority: 'Power Secretary', views: 2100, downloads: 890, affectedPop: '500 Million Rural Households', createdAt: '2024-07-01' },
  { id: 'POL-2024-006', title: 'Flood Zone Displacement & Relief Protocol', department: 'NDMA', region: 'National', type: 'Disaster Management', status: 'Published', effectiveDate: '2023-06-15', expiryDate: '2028-06-14', description: 'National protocol for flood disaster response, displacement management, and relief distribution.', approvalAuthority: 'NDMA Chairman', views: 67000, downloads: 15000, affectedPop: '200 Million Flood-Prone', createdAt: '2023-03-01', publishedAt: '2023-06-10' },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-01', name: 'Agriculture', head: 'Shri Anil Kumar Sinha', activeCases: 34, complaints: 12, alerts: 2, performance: 84, resourceUsage: 67, policyCompliance: 91, status: 'Operational', color: 'emerald', icon: '🌾' },
  { id: 'dept-02', name: 'Health', head: 'Dr. Suresh Patel', activeCases: 89, complaints: 28, alerts: 5, performance: 76, resourceUsage: 88, policyCompliance: 84, status: 'Alert', color: 'teal', icon: '🏥' },
  { id: 'dept-03', name: 'Infrastructure', head: 'Er. Ravi Shankar', activeCases: 56, complaints: 19, alerts: 4, performance: 71, resourceUsage: 74, policyCompliance: 87, status: 'Alert', color: 'blue', icon: '🏗️' },
  { id: 'dept-04', name: 'Hazard Management', head: 'Shri Deepak Joshi', activeCases: 23, complaints: 7, alerts: 8, performance: 92, resourceUsage: 95, policyCompliance: 96, status: 'Operational', color: 'red', icon: '⚠️' },
  { id: 'dept-05', name: 'Education', head: 'Dr. Meenakshi Lekhi', activeCases: 41, complaints: 14, alerts: 1, performance: 79, resourceUsage: 58, policyCompliance: 88, status: 'Operational', color: 'purple', icon: '🎓' },
  { id: 'dept-06', name: 'Economy', head: 'Shri Nirmala Iyer', activeCases: 18, complaints: 5, alerts: 0, performance: 88, resourceUsage: 62, policyCompliance: 94, status: 'Operational', color: 'indigo', icon: '📊' },
  { id: 'dept-07', name: 'Transport', head: 'Er. Vijay Sharma', activeCases: 27, complaints: 9, alerts: 3, performance: 73, resourceUsage: 71, policyCompliance: 82, status: 'Alert', color: 'sky', icon: '🚗' },
  { id: 'dept-08', name: 'Energy', head: 'Er. Sunil Mehta', activeCases: 15, complaints: 6, alerts: 2, performance: 85, resourceUsage: 79, policyCompliance: 90, status: 'Operational', color: 'amber', icon: '⚡' },
  { id: 'dept-09', name: 'Environment', head: 'Dr. Kavita Sharma', activeCases: 32, complaints: 11, alerts: 3, performance: 68, resourceUsage: 52, policyCompliance: 76, status: 'Alert', color: 'green', icon: '🌿' },
  { id: 'dept-10', name: 'Law & Order', head: 'DGP Rajesh Verma', activeCases: 74, complaints: 22, alerts: 6, performance: 91, resourceUsage: 83, policyCompliance: 98, status: 'Operational', color: 'slate', icon: '⚖️' },
];

export const MOCK_RESOURCES: Resource[] = [
  { id: 'res-01', name: 'Emergency Food Packets', category: 'Food', totalStock: 50000, allocated: 18500, available: 31500, unit: 'packets', district: 'Pune', lastUpdated: new Date(Date.now() - 3600000 * 2).toISOString(), criticality: 'Normal' },
  { id: 'res-02', name: 'Potable Water Tankers', category: 'Water', totalStock: 120, allocated: 87, available: 33, unit: 'tankers', district: 'Maharashtra', lastUpdated: new Date(Date.now() - 3600000).toISOString(), criticality: 'High' },
  { id: 'res-03', name: 'Medical Oxygen Cylinders', category: 'Medical', totalStock: 8000, allocated: 6800, available: 1200, unit: 'cylinders', district: 'Mumbai', lastUpdated: new Date(Date.now() - 1800000).toISOString(), criticality: 'Critical' },
  { id: 'res-04', name: 'NDRF Rescue Boats', category: 'Vehicles', totalStock: 45, allocated: 38, available: 7, unit: 'boats', district: 'Kolhapur', lastUpdated: new Date(Date.now() - 600000).toISOString(), criticality: 'Critical' },
  { id: 'res-05', name: 'Emergency Personnel', category: 'Personnel', totalStock: 2500, allocated: 1840, available: 660, unit: 'personnel', district: 'State-wide', lastUpdated: new Date(Date.now() - 3600000 * 4).toISOString(), criticality: 'High' },
  { id: 'res-06', name: 'Relief Shelters', category: 'Shelters', totalStock: 180, allocated: 124, available: 56, unit: 'shelters', district: 'Vidarbha', lastUpdated: new Date(Date.now() - 3600000 * 6).toISOString(), criticality: 'Normal' },
  { id: 'res-07', name: 'Emergency Relief Fund', category: 'Funds', totalStock: 500000000, allocated: 320000000, available: 180000000, unit: '₹', district: 'State', lastUpdated: new Date(Date.now() - 86400000).toISOString(), criticality: 'Normal' },
  { id: 'res-08', name: 'Heavy Equipment (JCBs)', category: 'Equipment', totalStock: 200, allocated: 167, available: 33, unit: 'units', district: 'Nashik', lastUpdated: new Date(Date.now() - 3600000 * 3).toISOString(), criticality: 'High' },
];

export const MOCK_USERS: GovUser[] = [
  { id: 'usr-001', name: 'Shri Arjun Mehta', role: 'National Administrator', department: 'Cabinet Secretariat', district: 'New Delhi', govId: 'GOV-NAT-0001', status: 'Active', lastLogin: new Date(Date.now() - 1800000).toISOString(), permissions: ['all'] },
  { id: 'usr-002', name: 'Dr. Priya Verma', role: 'Ministry Official', department: 'Ministry of Health', district: 'New Delhi', govId: 'GOV-HLT-0042', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(), permissions: ['health', 'reports', 'policies'] },
  { id: 'usr-003', name: 'Shri Ramesh Joshi', role: 'District Collector', department: 'District Administration', district: 'Pune', govId: 'GOV-DIS-MH17', status: 'Active', lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(), permissions: ['district-pune', 'complaints', 'resources'] },
  { id: 'usr-004', name: 'Er. Sunita Patel', role: 'Department Head', department: 'Infrastructure', district: 'Maharashtra', govId: 'GOV-INF-MH001', status: 'Active', lastLogin: new Date(Date.now() - 86400000).toISOString(), permissions: ['infrastructure', 'reports'] },
  { id: 'usr-005', name: 'DIG Vikram Singh', role: 'Emergency Operations Officer', department: 'NDMA', district: 'Mumbai', govId: 'GOV-EMG-0015', status: 'Active', lastLogin: new Date(Date.now() - 7200000).toISOString(), permissions: ['emergency', 'resources', 'command-center'] },
  { id: 'usr-006', name: 'Dr. Kavita Sharma', role: 'State Official', department: 'Environment Department', district: 'Maharashtra', govId: 'GOV-ENV-MH003', status: 'Inactive', lastLogin: new Date(Date.now() - 86400000 * 5).toISOString(), permissions: ['environment', 'reports'] },
];

export const MOCK_AUDIT: AuditEntry[] = [
  { id: 'aud-001', action: 'Policy Published', module: 'Policy Management', officer: 'Shri Arjun Mehta', role: 'National Administrator', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), details: 'Published "National Digital Governance Infrastructure Policy 2024"', ipAddress: '10.44.1.15' },
  { id: 'aud-002', action: 'Complaint Assigned', module: 'Complaint Management', officer: 'Shri Ramesh Joshi', role: 'District Collector', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), details: 'Assigned CMP-00421 to Er. Priya Deshmukh', ipAddress: '10.44.1.28' },
  { id: 'aud-003', action: 'Resource Allocated', module: 'Resource Management', officer: 'DIG Vikram Singh', role: 'Emergency Operations Officer', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), details: 'Allocated 38 rescue boats to Kolhapur flood emergency', ipAddress: '10.44.1.52' },
  { id: 'aud-004', action: 'User Created', module: 'User Management', officer: 'Shri Arjun Mehta', role: 'National Administrator', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Created user account for DIG Vikram Singh, NDMA', ipAddress: '10.44.1.15' },
  { id: 'aud-005', action: 'Policy Status Changed', module: 'Policy Management', officer: 'Dr. Priya Verma', role: 'Ministry Official', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), details: 'Moved POL-2024-003 from Draft to Under Review', ipAddress: '10.44.1.19' },
  { id: 'aud-006', action: 'Complaint Resolved', module: 'Complaint Management', officer: 'Shri Arun Pawar', role: 'Department Officer', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), details: 'Marked CMP-00406 as Resolved after building repair completion', ipAddress: '10.44.1.71' },
];

export const MOCK_COUNCIL: CouncilRecommendation[] = [
  {
    id: 'rec-001', title: 'Immediate deployment of mobile medical units to dengue-affected areas', domain: 'Health', priority: 'Critical',
    agentVotes: [
      { agent: 'Health AI Agent', vote: 'Approve', confidence: 97, reason: 'Dengue cases exceeding 3x seasonal average in affected wards.' },
      { agent: 'Resource AI Agent', vote: 'Approve', confidence: 91, reason: 'Mobile units available in district inventory. 4 units unallocated.' },
      { agent: 'Risk Assessment Agent', vote: 'Approve', confidence: 88, reason: 'Inaction probability increases fatalities by 340% within 72 hours.' },
      { agent: 'Budget AI Agent', vote: 'Approve', confidence: 84, reason: 'Emergency health fund has ₹4.2 Cr available for immediate allocation.' },
    ],
    consensusScore: 95, riskScore: 91, status: 'Pending Human Review', createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    policyRef: 'POL-2024-003'
  },
  {
    id: 'rec-002', title: 'Activate flood emergency protocol for Kolhapur district', domain: 'Disaster Management', priority: 'Critical',
    agentVotes: [
      { agent: 'Hazard AI Agent', vote: 'Approve', confidence: 99, reason: 'River gauge at 97% capacity. Historical data shows breach probability at 89%.' },
      { agent: 'Resource AI Agent', vote: 'Approve', confidence: 94, reason: 'NDRF teams pre-positioned. Boats and rations ready for deployment.' },
      { agent: 'Infrastructure Agent', vote: 'Approve', confidence: 87, reason: 'Flood walls last maintained 4 years ago. Structural weakness identified.' },
      { agent: 'Evacuation AI Agent', vote: 'Approve', confidence: 96, reason: 'Evacuation routes mapped. 12,000 residents in high-risk zone.' },
    ],
    consensusScore: 97, riskScore: 99, status: 'Approved', createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'rec-003', title: 'Initiate crop loss compensation for Ahmednagar hailstorm victims', domain: 'Agriculture', priority: 'High',
    agentVotes: [
      { agent: 'Agriculture AI Agent', vote: 'Approve', confidence: 92, reason: 'Satellite imagery confirms 400+ acres crop damage. Loss estimated ₹1.2 Cr.' },
      { agent: 'Budget AI Agent', vote: 'Approve', confidence: 78, reason: 'PMFBY has allocated funds available. Processing can begin immediately.' },
      { agent: 'Risk Assessment Agent', vote: 'Approve', confidence: 85, reason: 'Delay beyond 30 days reduces farmer trust index by 22 points.' },
      { agent: 'Policy AI Agent', vote: 'Abstain', confidence: 60, reason: 'Need to verify PMFBY enrollment status of affected farmers.' },
    ],
    consensusScore: 82, riskScore: 74, status: 'Pending Human Review', createdAt: new Date(Date.now() - 86400000).toISOString(),
    policyRef: 'POL-2024-002'
  },
];

// ─── STORE ────────────────────────────────────────────────────────────────────

interface GovStore {
  isGovAuthenticated: boolean;
  govUser: { name: string; role: string; govId: string; department: string } | null;
  complaints: GovComplaint[];
  policies: Policy[];
  departments: Department[];
  resources: Resource[];
  users: GovUser[];
  auditLog: AuditEntry[];
  councilItems: CouncilRecommendation[];
  govLogin: (govId: string, password: string) => boolean;
  govLogout: () => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note: string) => void;
  updateCouncilStatus: (id: string, status: CouncilRecommendation['status']) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

export const useGovStore = create<GovStore>()(
  persist(
    (set, get) => ({
      isGovAuthenticated: false,
      govUser: null,
      complaints: MOCK_GOV_COMPLAINTS,
      policies: MOCK_POLICIES,
      departments: MOCK_DEPARTMENTS,
      resources: MOCK_RESOURCES,
      users: MOCK_USERS,
      auditLog: MOCK_AUDIT,
      councilItems: MOCK_COUNCIL,

      govLogin: (govId, password) => {
        // Demo: any GOV- prefixed ID with password "gov123" works
        if (govId.startsWith('GOV-') && password === 'gov123') {
          const user = MOCK_USERS.find(u => u.govId === govId) || {
            name: 'Shri Arjun Mehta', role: 'National Administrator',
            govId, department: 'Cabinet Secretariat'
          };
          set({ isGovAuthenticated: true, govUser: { name: user.name, role: user.role, govId: user.govId, department: user.department } });
          return true;
        }
        return false;
      },

      govLogout: () => set({ isGovAuthenticated: false, govUser: null }),

      updateComplaintStatus: (id, status, note) => {
        set(state => ({
          complaints: state.complaints.map(c =>
            c.id === id ? { ...c, status, timeline: [...c.timeline, { status, note, timestamp: new Date().toISOString(), by: state.govUser?.name || 'Officer' }] } : c
          )
        }));
      },

      updateCouncilStatus: (id, status) => {
        set(state => ({
          councilItems: state.councilItems.map(r => r.id === id ? { ...r, status } : r)
        }));
      },

      addAuditEntry: (entry) => {
        const newEntry: AuditEntry = { ...entry, id: `aud-${Date.now()}`, timestamp: new Date().toISOString() };
        set(state => ({ auditLog: [newEntry, ...state.auditLog] }));
      },
    }),
    { name: 'netravaah-gov-store', storage: createJSONStorage(() => localStorage) }
  )
);
