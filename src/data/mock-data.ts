import type { Snapshot, Chapter, ForumEvent, Post, Member, Announcement, ChatMessage } from '@/types';

export const MOCK_SNAPSHOTS: Snapshot[] = [
  {
    id: '1',
    userId: '1',
    date: '2026-03-01',
    purposeStatement: 'To lead my family and business with integrity, serving God in all things.',
    quarterlyGoal: 'Increase revenue 15% while maintaining work-life balance.',
    majorIssue: 'Struggling with delegation at work — need to trust my team more.',
    ratings: [
      { categoryId: 'intimacy', score: 7 },
      { categoryId: 'marriage', score: 6, spouseScore: 5 },
      { categoryId: 'parenting', score: 7, childScore: 6 },
      { categoryId: 'mental_health', score: 5 },
      { categoryId: 'physical_health', score: 4 },
      { categoryId: 'staff', score: 6 },
      { categoryId: 'sales', score: 8 },
      { categoryId: 'marketing', score: 5 },
      { categoryId: 'operations', score: 7 },
      { categoryId: 'finances', score: 7 },
      { categoryId: 'leadership', score: 6 },
    ],
  },
  {
    id: '2',
    userId: '1',
    date: '2026-02-01',
    purposeStatement: 'To lead my family and business with integrity, serving God in all things.',
    quarterlyGoal: 'Launch new product line by end of Q1.',
    majorIssue: 'Navigating a difficult season in marriage — need more intentional time together.',
    ratings: [
      { categoryId: 'intimacy', score: 6 },
      { categoryId: 'marriage', score: 4, spouseScore: 3 },
      { categoryId: 'parenting', score: 6, childScore: 5 },
      { categoryId: 'mental_health', score: 4 },
      { categoryId: 'physical_health', score: 5 },
      { categoryId: 'staff', score: 5 },
      { categoryId: 'sales', score: 7 },
      { categoryId: 'marketing', score: 4 },
      { categoryId: 'operations', score: 6 },
      { categoryId: 'finances', score: 6 },
      { categoryId: 'leadership', score: 5 },
    ],
  },
  {
    id: '3',
    userId: '1',
    date: '2026-01-01',
    purposeStatement: 'To lead my family and business with integrity, serving God in all things.',
    quarterlyGoal: 'Complete leadership training program.',
    majorIssue: 'Physical health declining — need consistent exercise routine.',
    ratings: [
      { categoryId: 'intimacy', score: 5 },
      { categoryId: 'marriage', score: 5, spouseScore: 4 },
      { categoryId: 'parenting', score: 5, childScore: 5 },
      { categoryId: 'mental_health', score: 5 },
      { categoryId: 'physical_health', score: 3 },
      { categoryId: 'staff', score: 4 },
      { categoryId: 'sales', score: 6 },
      { categoryId: 'marketing', score: 3 },
      { categoryId: 'operations', score: 5 },
      { categoryId: 'finances', score: 5 },
      { categoryId: 'leadership', score: 4 },
    ],
  },
];

export const MOCK_CHAPTERS: Chapter[] = [
  { id: '1', name: 'Nashville Chapter', city: 'Nashville', state: 'TN', memberCount: 12, facilitatorName: 'James Walker', meetingDay: 'Tuesday', meetingTime: '7:00 AM' },
  { id: '2', name: 'Atlanta Chapter', city: 'Atlanta', state: 'GA', memberCount: 10, facilitatorName: 'Michael Harris', meetingDay: 'Wednesday', meetingTime: '6:30 AM' },
  { id: '3', name: 'Dallas Chapter', city: 'Dallas', state: 'TX', memberCount: 14, facilitatorName: 'Robert Chen', meetingDay: 'Thursday', meetingTime: '7:00 AM' },
  { id: '4', name: 'Charlotte Chapter', city: 'Charlotte', state: 'NC', memberCount: 8, facilitatorName: 'Steven Brooks', meetingDay: 'Tuesday', meetingTime: '6:00 AM' },
];

export const MOCK_EVENTS: ForumEvent[] = [
  { id: '1', title: 'Q2 Kickoff Breakfast', date: '2026-04-05', location: 'Nashville Convention Center', description: 'Quarterly kickoff with guest speaker on servant leadership.', chapterId: '1', attendees: ['1', '2', '3'], maxAttendees: 50 },
  { id: '2', title: 'Men\'s Retreat Weekend', date: '2026-05-15', location: 'Smoky Mountain Lodge', description: 'Annual retreat focused on spiritual growth, brotherhood, and strategic planning.', chapterId: '1', attendees: ['1'], maxAttendees: 30 },
  { id: '3', title: 'Leadership Summit', date: '2026-06-20', location: 'Atlanta Marriott', description: 'Cross-chapter leadership development summit.', chapterId: '2', attendees: [], maxAttendees: 100 },
];

export const MOCK_POSTS: Post[] = [
  { id: '1', authorId: '1', authorName: 'David Mitchell', title: 'How I improved my marriage score from 3 to 8', content: 'Brothers, I want to share what worked for me over the past six months...', date: '2026-03-10', replies: 12, category: 'Marriage' },
  { id: '2', authorId: '2', authorName: 'James Walker', title: 'Book recommendation: Leading with integrity', content: 'Just finished this incredible book on Christian leadership in business...', date: '2026-03-08', replies: 8, category: 'Leadership' },
  { id: '3', authorId: '3', authorName: 'Michael Harris', title: 'Prayer request: Business transition', content: 'Brothers, I\'m going through a major business transition and could use your prayers...', date: '2026-03-05', replies: 15, category: 'Prayer' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'David Mitchell', role: 'ceo', chapter: 'Nashville Chapter', joinedDate: '2023-06-15' },
  { id: '2', name: 'James Walker', role: 'executive', chapter: 'Nashville Chapter', joinedDate: '2023-08-01' },
  { id: '3', name: 'Michael Harris', role: 'facilitator', chapter: 'Atlanta Chapter', joinedDate: '2023-09-15' },
  { id: '4', name: 'Robert Chen', role: 'facilitator', chapter: 'Dallas Chapter', joinedDate: '2024-01-10' },
  { id: '5', name: 'Steven Brooks', role: 'facilitator', chapter: 'Charlotte Chapter', joinedDate: '2024-03-20' },
  { id: '6', name: 'Thomas Reed', role: 'member', chapter: 'Nashville Chapter', joinedDate: '2024-06-01' },
  { id: '7', name: 'Andrew Foster', role: 'member', chapter: 'Atlanta Chapter', joinedDate: '2024-07-15' },
  { id: '8', name: 'Nathan Price', role: 'member', chapter: 'Dallas Chapter', joinedDate: '2024-09-01' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Q2 Retreat Registration Open', content: 'Registration for the annual Men\'s Retreat is now open. Early bird pricing available through April 1st.', date: '2026-03-12', authorName: 'David Mitchell' },
  { id: '2', title: 'New Chapter Launch: Charlotte', content: 'We\'re excited to announce our newest chapter in Charlotte, NC. Led by Steven Brooks.', date: '2026-03-01', authorName: 'David Mitchell', chapterId: '4' },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Welcome, brother. I'm here to walk alongside you as you pursue excellence in every area of life — faith, family, and business.\n\nI've reviewed your latest Snapshot. Your **Sales** score of 8 is strong — that discipline is paying off. Let's talk about the areas where you see room for growth.\n\nWhat would you like to focus on today?`,
    timestamp: '2026-03-17T08:00:00Z',
  },
];
