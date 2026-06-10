import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Complaint, ComplaintStatus, Officer, TimelineEntry } from '../types/complaint';

export const MOCK_OFFICERS: Officer[] = [
  { id: 'off-1', name: 'Amit Patel', phone: '98765-43210', role: 'Electrical Grid Engineer', department: 'State Electricity Board' },
  { id: 'off-2', name: 'Rohan Sharma', phone: '98765-43211', role: 'Sanitation Inspector', department: 'Sanitation & Environment Dept' },
  { id: 'off-3', name: 'Sunita Deshmukh', phone: '98765-43212', role: 'Hydraulics Supervisor', department: 'Municipal Water Authority' },
  { id: 'off-4', name: 'Vijay Kumar', phone: '98765-43213', role: 'Civil Works Inspector', department: 'Public Works Department (PWD)' },
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'CMP-78401',
    title: 'Water main pipe leakage',
    description: 'A major water leakage is observed at the main distribution junction in Sector 4B Lane 3. Water has been pooling on the street for over 12 hours, causing low pressure in nearby apartments.',
    category: 'Water Supply & Drainage',
    department: 'Municipal Water Authority',
    location: 'Sector 4B Lane 3, Near Primary Clinic, Pune',
    coordinates: { x: 30, y: 45 },
    status: 'Submitted',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    timeline: [
      {
        status: 'Submitted',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        note: 'Grievance submitted by citizen Jane Doe. Incident logged under active SLA tracking.',
        updatedBy: 'System Portal'
      }
    ]
  },
  {
    id: 'CMP-78395',
    title: 'Refuse accumulation Sector 4B',
    description: 'Garbage collection truck has skipped Sector 4B for the last 3 days. Overflowing waste bins on the main road are emitting a foul odor and creating public hygiene concerns.',
    category: 'Solid Waste Management',
    department: 'Sanitation & Environment Dept',
    location: 'Sector 4B Waste Depot Road, Pune',
    coordinates: { x: 80, y: 75 },
    status: 'In Progress',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    officer: MOCK_OFFICERS[1], // Rohan Sharma
    timeline: [
      {
        status: 'Submitted',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        note: 'Incident reported through mobile portal app.',
        updatedBy: 'System Portal'
      },
      {
        status: 'Assigned',
        timestamp: new Date(Date.now() - 3600000 * 40).toISOString(),
        note: 'Assigned to Sanitation Inspector Rohan Sharma for field investigation.',
        updatedBy: 'Desk Operator Amit'
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        note: 'Sanitation cleanup crew dispatched to clear overflowing depot. Partial clearance complete.',
        updatedBy: 'Rohan Sharma'
      }
    ]
  },
  {
    id: 'CMP-78350',
    title: 'Power transformer sparks',
    description: 'Sparks observed on the power transformer near fire station road. Sparks become severe during humid weather and rainfall, posing a direct threat to nearby street trees.',
    category: 'Electricity & Streetlights',
    department: 'State Electricity Board',
    location: 'Sector 4B Fire Station Road, Pune',
    coordinates: { x: 45, y: 70 },
    status: 'Resolved',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(), // 5 days ago
    officer: MOCK_OFFICERS[0], // Amit Patel
    timeline: [
      {
        status: 'Submitted',
        timestamp: new Date(Date.now() - 3600000 * 120).toISOString(),
        note: 'Emergency infrastructure risk report logged.',
        updatedBy: 'System Portal'
      },
      {
        status: 'Assigned',
        timestamp: new Date(Date.now() - 3600000 * 118).toISOString(),
        note: 'Electrical inspector Amit Patel dispatched.',
        updatedBy: 'Desk Operator Amit'
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
        note: 'Substation shut down temporarily to replace worn insulator bushings and adjust transformer grounding.',
        updatedBy: 'Amit Patel'
      },
      {
        status: 'Resolved',
        timestamp: new Date(Date.now() - 3600000 * 94).toISOString(),
        note: 'Transformer insulation replacement completed and verified. Power grid stable. Insulator spark issue resolved.',
        updatedBy: 'Amit Patel'
      }
    ]
  }
];

interface ComplaintStore {
  complaints: Complaint[];
  officers: Officer[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'timeline' | 'officer'> & { photoName?: string; photoUrl?: string; videoName?: string; videoUrl?: string }) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note: string, updatedBy: string) => void;
  assignOfficer: (id: string, officerId: string, updatedBy: string) => void;
}

export const useComplaintStore = create<ComplaintStore>()(
  persist(
    (set, get) => ({
      complaints: INITIAL_COMPLAINTS,
      officers: MOCK_OFFICERS,
      
      addComplaint: (data) => {
        const id = `CMP-${Math.floor(10000 + Math.random() * 90000)}`;
        const now = new Date().toISOString();
        
        const newComplaint: Complaint = {
          ...data,
          id,
          status: 'Submitted',
          createdAt: now,
          timeline: [
            {
              status: 'Submitted',
              timestamp: now,
              note: 'Grievance registered. Initial municipal desk routing in progress.',
              updatedBy: 'System Portal'
            }
          ]
        };
        
        set((state) => ({
          complaints: [newComplaint, ...state.complaints]
        }));
      },
      
      updateComplaintStatus: (id, status, note, updatedBy) => {
        const now = new Date().toISOString();
        
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            
            const newTimelineEntry: TimelineEntry = {
              status,
              timestamp: now,
              note,
              updatedBy
            };
            
            return {
              ...c,
              status,
              timeline: [...c.timeline, newTimelineEntry]
            };
          })
        }));
      },
      
      assignOfficer: (id, officerId, updatedBy) => {
        const now = new Date().toISOString();
        const officer = get().officers.find((o) => o.id === officerId);
        if (!officer) return;
        
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            
            const status: ComplaintStatus = c.status === 'Submitted' ? 'Assigned' : c.status;
            
            const newTimelineEntry: TimelineEntry = {
              status,
              timestamp: now,
              note: `Assigned to ${officer.role} ${officer.name} (${officer.department}).`,
              updatedBy
            };
            
            return {
              ...c,
              status,
              officer,
              timeline: [...c.timeline, newTimelineEntry]
            };
          })
        }));
      }
    }),
    {
      name: 'netravaah-complaints-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
