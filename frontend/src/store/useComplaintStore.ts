// frontend/src/store/useComplaintStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Complaint, ComplaintStatus, Officer, TimelineEntry, CommentThread, CommentReply, OfficialResponse, CommunityPoll } from '../types/complaint';

export const MOCK_OFFICERS: Officer[] = [
  { id: 'off-1', name: 'Amit Patel', phone: '98765-43210', role: 'Electrical Grid Engineer', department: 'State Electricity Board' },
  { id: 'off-2', name: 'Rohan Sharma', phone: '98765-43211', role: 'Sanitation Inspector', department: 'Sanitation & Environment Dept' },
  { id: 'off-3', name: 'Sunita Deshmukh', phone: '98765-43212', role: 'Hydraulics Supervisor', department: 'Municipal Water Authority' },
  { id: 'off-4', name: 'Vijay Kumar', phone: '98765-43213', role: 'Civil Works Inspector', department: 'Public Works Department (PWD)' },
];

const INITIAL_POLLS: CommunityPoll[] = [
  {
    id: 'poll-1',
    question: 'Which sector road repairs should take priority first?',
    options: ['Sector A (Main Market)', 'Sector B (Primary School link)', 'Sector C (Station Road)'],
    votes: { 'Sector A (Main Market)': 428, 'Sector B (Primary School link)': 312, 'Sector C (Station Road)': 140 },
    votedBy: ['user-101'],
    active: true
  },
  {
    id: 'poll-2',
    question: 'Proposed park lighting curfew time?',
    options: ['10:00 PM', '11:00 PM', '12:00 AM (Midnight)'],
    votes: { '10:00 PM': 510, '11:00 PM': 224, '12:00 AM (Midnight)': 98 },
    votedBy: [],
    active: true
  }
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
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    timeline: [
      {
        status: 'Submitted',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        note: 'Grievance submitted by citizen Jane Doe. Incident logged under active SLA tracking.',
        updatedBy: 'System Portal'
      }
    ],
    citizenName: 'Jane Doe',
    avatarSeed: 'jane',
    supportCount: 1247,
    supportedBy: ['user-101'],
    affectedCount: 328,
    affectedBy: [],
    followCount: 950,
    followedBy: [],
    priorityScore: 94,
    priorityLevel: 'Critical',
    isMerged: false,
    comments: [
      {
        id: 'c-1',
        authorName: 'Suresh Kumar',
        content: 'This has blocked water supply to our entire building. Highly critical!',
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        replies: [
          {
            id: 'r-1',
            authorName: 'Ananya Sen',
            content: 'Agree, hoping for prompt action.',
            createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
          }
        ]
      }
    ],
    officialResponses: []
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
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    officer: MOCK_OFFICERS[1],
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
    ],
    citizenName: 'Anonymous',
    avatarSeed: 'anon',
    supportCount: 985,
    supportedBy: [],
    affectedCount: 220,
    affectedBy: ['user-101'],
    followCount: 410,
    followedBy: [],
    priorityScore: 78,
    priorityLevel: 'High',
    isMerged: true,
    mergedCount: 18,
    comments: [
      {
        id: 'c-2',
        authorName: 'Rohan Sharma',
        content: 'Crew dispatched for waste disposal. Work is currently active.',
        isOfficial: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        replies: []
      }
    ],
    officialResponses: [
      {
        id: 'or-1',
        officerName: 'Rohan Sharma',
        officerRole: 'Sanitation Inspector',
        department: 'Sanitation & Environment Dept',
        content: 'Waste clearance initiated. 4 tons cleared, final sweeps scheduled for tomorrow.',
        createdAt: new Date(Date.now() - 3600000 * 23).toISOString()
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
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    officer: MOCK_OFFICERS[0],
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
    ],
    citizenName: 'Priya Sharma',
    avatarSeed: 'priya',
    supportCount: 740,
    supportedBy: [],
    affectedCount: 180,
    affectedBy: [],
    followCount: 310,
    followedBy: [],
    priorityScore: 65,
    priorityLevel: 'Medium',
    isMerged: false,
    comments: [],
    officialResponses: [
      {
        id: 'or-2',
        officerName: 'Amit Patel',
        officerRole: 'Electrical Grid Engineer',
        department: 'State Electricity Board',
        content: 'Insulation replaced and checked via infrared thermal imaging. Spark issues resolved.',
        createdAt: new Date(Date.now() - 3600000 * 94).toISOString()
      }
    ]
  }
];

interface ComplaintStore {
  complaints: Complaint[];
  officers: Officer[];
  activePolls: CommunityPoll[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'timeline' | 'officer' | 'supportCount' | 'supportedBy' | 'affectedCount' | 'affectedBy' | 'followCount' | 'followedBy' | 'priorityScore' | 'priorityLevel' | 'comments' | 'officialResponses'> & { photoName?: string; photoUrl?: string; videoName?: string; videoUrl?: string }) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus, note: string, updatedBy: string) => void;
  assignOfficer: (id: string, officerId: string, updatedBy: string) => void;
  
  // Extended Social Hub Actions
  supportIssue: (id: string, userId: string) => void;
  verifyAffected: (id: string, userId: string) => void;
  followIssue: (id: string, userId: string) => void;
  addThreadedComment: (id: string, authorName: string, content: string, isOfficial?: boolean) => void;
  addCommentReply: (id: string, commentId: string, authorName: string, content: string, isOfficial?: boolean) => void;
  addOfficialResponse: (id: string, response: Omit<OfficialResponse, 'id' | 'createdAt'>) => void;
  castPollVote: (pollId: string, option: string, userId: string) => void;
}

export const useComplaintStore = create<ComplaintStore>()(
  persist(
    (set, get) => ({
      complaints: INITIAL_COMPLAINTS,
      officers: MOCK_OFFICERS,
      activePolls: INITIAL_POLLS,
      
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
          ],
          citizenName: data.citizenName || 'Anonymous',
          avatarSeed: 'anon',
          supportCount: 1,
          supportedBy: ['user-101'],
          affectedCount: 1,
          affectedBy: ['user-101'],
          followCount: 1,
          followedBy: ['user-101'],
          priorityScore: 45,
          priorityLevel: 'Low',
          comments: [],
          officialResponses: []
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
      },

      supportIssue: (id, userId) => {
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const hasSupported = c.supportedBy.includes(userId);
            const supportedBy = hasSupported 
              ? c.supportedBy.filter(u => u !== userId) 
              : [...c.supportedBy, userId];
            const supportCount = hasSupported ? c.supportCount - 1 : c.supportCount + 1;
            
            // Recompute priorityScore slightly based on supports
            const priorityScore = Math.min(100, Math.max(0, c.priorityScore + (hasSupported ? -1 : 1)));
            const priorityLevel = priorityScore > 85 ? 'Critical' : priorityScore > 65 ? 'High' : priorityScore > 40 ? 'Medium' : 'Low';
            
            return {
              ...c,
              supportCount,
              supportedBy,
              priorityScore,
              priorityLevel
            };
          })
        }));
      },

      verifyAffected: (id, userId) => {
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const hasVerified = c.affectedBy.includes(userId);
            const affectedBy = hasVerified 
              ? c.affectedBy.filter(u => u !== userId) 
              : [...c.affectedBy, userId];
            const affectedCount = hasVerified ? c.affectedCount - 1 : c.affectedCount + 1;
            
            return {
              ...c,
              affectedCount,
              affectedBy
            };
          })
        }));
      },

      followIssue: (id, userId) => {
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const hasFollowed = c.followedBy.includes(userId);
            const followedBy = hasFollowed 
              ? c.followedBy.filter(u => u !== userId) 
              : [...c.followedBy, userId];
            const followCount = hasFollowed ? c.followCount - 1 : c.followCount + 1;
            
            return {
              ...c,
              followCount,
              followedBy
            };
          })
        }));
      },

      addThreadedComment: (id, authorName, content, isOfficial = false) => {
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const newComment: CommentThread = {
              id: `c-${Math.floor(1000 + Math.random() * 9000)}`,
              authorName,
              content,
              isOfficial,
              createdAt: new Date().toISOString(),
              replies: []
            };
            return {
              ...c,
              comments: [...c.comments, newComment]
            };
          })
        }));
      },

      addCommentReply: (id, commentId, authorName, content, isOfficial = false) => {
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const comments = c.comments.map((comm) => {
              if (comm.id !== commentId) return comm;
              const newReply: CommentReply = {
                id: `r-${Math.floor(1000 + Math.random() * 9000)}`,
                authorName,
                content,
                isOfficial,
                createdAt: new Date().toISOString()
              };
              return {
                ...comm,
                replies: [...comm.replies, newReply]
              };
            });
            return {
              ...c,
              comments
            };
          })
        }));
      },

      addOfficialResponse: (id, response) => {
        const now = new Date().toISOString();
        set((state) => ({
          complaints: state.complaints.map((c) => {
            if (c.id !== id) return c;
            const newResponse: OfficialResponse = {
              ...response,
              id: `or-${Math.floor(1000 + Math.random() * 9000)}`,
              createdAt: now
            };
            return {
              ...c,
              officialResponses: [...c.officialResponses, newResponse]
            };
          })
        }));
      },

      castPollVote: (pollId, option, userId) => {
        set((state) => ({
          activePolls: state.activePolls.map((poll) => {
            if (poll.id !== pollId) return poll;
            if (poll.votedBy.includes(userId)) return poll; // Avoid duplicate votes
            
            const votes = { ...poll.votes };
            votes[option] = (votes[option] || 0) + 1;
            
            return {
              ...poll,
              votes,
              votedBy: [...poll.votedBy, userId]
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
