// frontend/src/types/complaint.ts
export type ComplaintStatus = 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface TimelineEntry {
  status: ComplaintStatus;
  timestamp: string;
  note: string;
  updatedBy: string;
}

export interface Officer {
  id: string;
  name: string;
  phone: string;
  role: string;
  department: string;
}

export interface CommentReply {
  id: string;
  authorName: string;
  content: string;
  isOfficial?: boolean;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  authorName: string;
  content: string;
  isOfficial?: boolean;
  createdAt: string;
  replies: CommentReply[];
}

export interface OfficialResponse {
  id: string;
  officerName: string;
  officerRole: string;
  department: string;
  content: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completionProofUrl?: string;
  createdAt: string;
}

export interface CommunityPoll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // Maps option name to count
  votedBy: string[]; // List of user IDs who voted
  active: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  location: string;
  coordinates?: { x: number; y: number };
  photoUrl?: string;
  photoName?: string;
  videoUrl?: string;
  videoName?: string;
  status: ComplaintStatus;
  officer?: Officer;
  timeline: TimelineEntry[];
  createdAt: string;
  
  // Extended Social & Governance Properties
  citizenName?: string;
  avatarSeed?: string;
  supportCount: number;
  supportedBy: string[]; // Array of user IDs who supported
  affectedCount: number;
  affectedBy: string[]; // Array of user IDs who verified affected
  followCount: number;
  followedBy: string[]; // Array of user IDs who followed
  priorityScore: number;
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  isMerged?: boolean;
  mergedCount?: number;
  comments: CommentThread[];
  officialResponses: OfficialResponse[];
}
