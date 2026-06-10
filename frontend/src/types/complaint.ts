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
}
