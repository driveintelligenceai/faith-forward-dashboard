export type UserRole = 'ceo' | 'executive' | 'facilitator' | 'member';

export type SnapshotType = 'member' | 'leader' | 'advisor' | 'nonprofit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  chapter: string;
  avatarUrl?: string;
  joinedDate: string;
  snapshotType?: SnapshotType;
}

export interface SnapshotCategory {
  id: string;
  name: string;
  group: 'personal' | 'professional' | 'spiritual';
  scriptureRef: string;
  hasSpouseRating?: boolean;
  hasChildRating?: boolean;
  description?: string;
}

export interface SnapshotRating {
  categoryId: string;
  score: number;
  spouseScore?: number;
  childScore?: number;
  note?: string;
  lifeEvent?: string;
}

export interface Snapshot {
  id: string;
  userId: string;
  snapshotType: SnapshotType;
  date: string;
  purposeStatement: string;
  quarterlyGoal: string;
  majorIssue: string;
  ratings: SnapshotRating[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  categoryContext?: string;
}

export interface Chapter {
  id: string;
  name: string;
  city: string;
  state: string;
  memberCount: number;
  facilitatorName: string;
  meetingDay: string;
  meetingTime: string;
}

export interface ForumEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  chapterId: string;
  attendees: string[];
  maxAttendees: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  date: string;
  replies: number;
  category: string;
}

export interface Member {
  id: string;
  name: string;
  role: UserRole;
  chapter: string;
  joinedDate: string;
  avatarUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  chapterId?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  executive: 'Founder / Executive',
  facilitator: 'Chapter Facilitator',
  member: 'Member',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ceo: 'bg-secondary text-secondary-foreground',
  executive: 'bg-primary text-primary-foreground',
  facilitator: 'bg-primary/80 text-primary-foreground',
  member: 'bg-muted text-muted-foreground',
};

export const SNAPSHOT_TYPE_LABELS: Record<SnapshotType, string> = {
  member: 'Member Snapshot™',
  leader: 'Leader Snapshot™',
  advisor: 'Advisor Snapshot™',
  nonprofit: 'Nonprofit Snapshot™',
};

export function getRoleSnapshotType(role: UserRole): SnapshotType {
  switch (role) {
    case 'ceo': return 'advisor';
    case 'executive': return 'advisor';
    case 'facilitator': return 'leader';
    case 'member': return 'member';
  }
}
