export interface DbUser {
  id: string;
  device_id: string;
  email: string | null;
  name: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  title: string | null;
  company: string | null;
  role: 'member' | 'chapter_admin' | 'hq_admin';
  snapshot_type: string;
  dues_status: string;
  chapter_id: string | null;
  created_at: string;
}

export interface DbChapter {
  id: string;
  name: string;
  city: string;
  state: string;
  state_code: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  description: string | null;
  next_meeting_date: string | null;
  org_id: string;
}

export interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  max_attendees: number | null;
  chapter_id: string | null;
  created_by_id: string | null;
  created_at: string;
}

export interface DbPost {
  id: string;
  title: string;
  body: string;
  is_facilitator: boolean;
  pinned: boolean;
  category_id: string | null;
  chapter_id: string | null;
  author_id: string;
  created_at: string;
}

export interface DbComment {
  id: string;
  body: string;
  post_id: string;
  author_id: string;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface DbRsvp {
  event_id: string;
  user_id: string;
  checked_in: boolean;
  created_at: string;
}
