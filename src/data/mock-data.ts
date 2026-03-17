import type { Snapshot, Chapter, ForumEvent, Post, Member, Announcement, ChatMessage } from '@/types';

// ─────────────────────────────────────────────────────────
// REAL IRON FORUMS DATA — sourced from ironforums.org
// HQ: The River Club, Suwanee, GA 30024 · Founded 2003
// 21 locations across the U.S. and South Africa
// ─────────────────────────────────────────────────────────

// ─── CHAPTERS (Real locations from Iron Forums locator) ───
export const MOCK_CHAPTERS: Chapter[] = [
  { id: '1', name: 'Suwanee Forum', city: 'Suwanee', state: 'GA', memberCount: 14, facilitatorName: 'Gary Smith', meetingDay: 'Tuesday', meetingTime: '7:00 AM' },
  { id: '2', name: 'Alpharetta Forum', city: 'Alpharetta', state: 'GA', memberCount: 12, facilitatorName: 'Ben Ambuehl', meetingDay: 'Wednesday', meetingTime: '7:00 AM' },
  { id: '3', name: 'Gwinnett Forum', city: 'Lawrenceville', state: 'GA', memberCount: 10, facilitatorName: 'Bruce Witt', meetingDay: 'Thursday', meetingTime: '6:30 AM' },
  { id: '4', name: 'Opelika Forum', city: 'Opelika', state: 'AL', memberCount: 8, facilitatorName: 'W. Gary Wilson', meetingDay: 'Tuesday', meetingTime: '7:00 AM' },
  { id: '5', name: 'Nashville Forum', city: 'Nashville', state: 'TN', memberCount: 11, facilitatorName: 'Mark Pugh', meetingDay: 'Wednesday', meetingTime: '6:30 AM' },
  { id: '6', name: 'Charlotte Forum', city: 'Charlotte', state: 'NC', memberCount: 9, facilitatorName: 'Darrell Rochester', meetingDay: 'Thursday', meetingTime: '7:00 AM' },
  { id: '7', name: 'Dallas Forum', city: 'Dallas', state: 'TX', memberCount: 10, facilitatorName: 'Jason Chandler', meetingDay: 'Tuesday', meetingTime: '7:00 AM' },
  { id: '8', name: 'Baltimore Forum', city: 'Baltimore', state: 'MD', memberCount: 8, facilitatorName: 'Michael Kearney', meetingDay: 'Wednesday', meetingTime: '7:00 AM' },
  { id: '9', name: 'Johannesburg Forum', city: 'Johannesburg', state: 'SA', memberCount: 7, facilitatorName: 'Marc Carson', meetingDay: 'Thursday', meetingTime: '7:00 AM' },
  { id: '10', name: 'Cumming Forum', city: 'Cumming', state: 'GA', memberCount: 10, facilitatorName: 'Rob Marbury', meetingDay: 'Tuesday', meetingTime: '6:30 AM' },
];

// ─── MEMBERS (Real leadership + real testimonial members) ───
export const MOCK_MEMBERS: Member[] = [
  // Leadership & Board
  { id: '1', name: 'Jonathan Almanzar', role: 'ceo', chapter: 'Suwanee Forum', joinedDate: '2022-01-15' },
  { id: '2', name: 'Gary Smith', role: 'executive', chapter: 'Suwanee Forum', joinedDate: '2003-06-01' },
  { id: '3', name: 'Barry Lusk', role: 'executive', chapter: 'Alpharetta Forum', joinedDate: '2018-03-01' },
  { id: '4', name: 'Rob Marbury', role: 'executive', chapter: 'Cumming Forum', joinedDate: '2015-09-01' },
  { id: '5', name: 'Mike Townsend', role: 'executive', chapter: 'Suwanee Forum', joinedDate: '2016-05-01' },
  // Facilitators
  { id: '6', name: 'Ben Ambuehl', role: 'facilitator', chapter: 'Alpharetta Forum', joinedDate: '2021-06-15' },
  { id: '7', name: 'Bruce Witt', role: 'facilitator', chapter: 'Gwinnett Forum', joinedDate: '2019-08-01' },
  { id: '8', name: 'W. Gary Wilson', role: 'facilitator', chapter: 'Opelika Forum', joinedDate: '2020-01-10' },
  { id: '9', name: 'Mark Pugh', role: 'facilitator', chapter: 'Nashville Forum', joinedDate: '2019-03-20' },
  { id: '10', name: 'Darrell Rochester', role: 'facilitator', chapter: 'Charlotte Forum', joinedDate: '2021-11-01' },
  { id: '11', name: 'Jason Chandler', role: 'facilitator', chapter: 'Dallas Forum', joinedDate: '2020-07-15' },
  { id: '12', name: 'Michael Kearney', role: 'facilitator', chapter: 'Baltimore Forum', joinedDate: '2022-04-01' },
  { id: '13', name: 'Marc Carson', role: 'facilitator', chapter: 'Johannesburg Forum', joinedDate: '2021-02-01' },
  // Members (from testimonials & real references)
  { id: '14', name: 'Alexandra Radford', role: 'member', chapter: 'Alpharetta Forum', joinedDate: '2023-06-15' },
  { id: '15', name: 'Sawyer Stromwall', role: 'member', chapter: 'Nashville Forum', joinedDate: '2023-09-01' },
  { id: '16', name: 'Lou Samara', role: 'member', chapter: 'Suwanee Forum', joinedDate: '2024-01-10' },
  { id: '17', name: 'Gary Liu', role: 'member', chapter: 'Dallas Forum', joinedDate: '2024-03-20' },
  { id: '18', name: 'David Mitchell', role: 'member', chapter: 'Gwinnett Forum', joinedDate: '2023-11-01' },
  { id: '19', name: 'Thomas Reed', role: 'member', chapter: 'Charlotte Forum', joinedDate: '2024-06-01' },
  { id: '20', name: 'Andrew Foster', role: 'member', chapter: 'Baltimore Forum', joinedDate: '2024-07-15' },
  { id: '21', name: 'Nathan Price', role: 'member', chapter: 'Cumming Forum', joinedDate: '2024-09-01' },
  { id: '22', name: 'James Walker', role: 'member', chapter: 'Opelika Forum', joinedDate: '2025-01-15' },
  { id: '23', name: 'Steven Brooks', role: 'member', chapter: 'Suwanee Forum', joinedDate: '2025-03-01' },
  { id: '24', name: 'Robert Chen', role: 'member', chapter: 'Alpharetta Forum', joinedDate: '2025-05-10' },
];

// ─── HELPER: Generate 12 months of snapshot data ───
function generateMonthlySnapshots(
  userId: string,
  snapshotType: 'member' | 'leader' | 'advisor' | 'nonprofit',
  categoryIds: string[],
  baseScores: number[],
  opts?: { hasSpouse?: string[]; hasChild?: string[] }
): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const now = new Date('2026-03-01');

  const purposeStatements = [
    'To lead my family and business with integrity, serving God in all things.',
    'To honor Christ in every decision and invest in the next generation of leaders.',
    'To build a redemptive company that reflects the Kingdom in the marketplace.',
    'To pursue excellence in business while prioritizing faith and family.',
  ];

  const quarterlyGoals = [
    'Increase revenue 15% while maintaining work-life balance.',
    'Launch new service offering and onboard 3 new clients.',
    'Complete leadership development program for my team.',
    'Strengthen daily devotional habit and weekly date nights.',
    'Hire two key roles and delegate operational responsibilities.',
    'Reduce debt by 20% and increase giving by 10%.',
    'Build a 90-day strategic plan with measurable KPIs.',
    'Mentor two younger business owners through Iron Forums.',
    'Improve physical health — exercise 4x/week consistently.',
    'Deepen prayer life and memorize one chapter of Scripture.',
    'Grow sales pipeline by 25% through referral strategy.',
    'Launch community impact initiative through the business.',
  ];

  const majorIssues = [
    'Struggling with delegation — need to trust my team more.',
    'Navigating a difficult season in marriage — need intentional time together.',
    'Physical health declining — need consistent exercise routine.',
    'Cash flow pressure from rapid growth — need better financial systems.',
    'Feeling isolated in leadership — need deeper accountability.',
    'Work-life balance is off — business consuming too much energy.',
    'Key employee departure — rebuilding team culture.',
    'Anxious about economic uncertainty — trusting God with outcomes.',
    'Spiritual dryness — struggling to maintain consistent quiet time.',
    'Parenting challenges with teenagers — need wisdom and patience.',
    'Major business pivot — uncertain about direction forward.',
    'Burnout symptoms emerging — need to establish better boundaries.',
  ];

  for (let m = 0; m < 12; m++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - m);
    const dateStr = date.toISOString().split('T')[0];

    const ratings = categoryIds.map((catId, i) => {
      // Create realistic progression: scores generally improve over time with some variance
      const progression = (11 - m) * 0.15; // slight upward trend
      const variance = (Math.sin(m * 2.3 + i * 1.7) * 1.5); // realistic monthly fluctuation
      const score = Math.max(1, Math.min(10, Math.round(baseScores[i] + progression + variance)));

      const rating: any = { categoryId: catId, score };

      if (opts?.hasSpouse?.includes(catId)) {
        rating.spouseScore = Math.max(1, Math.min(10, score + Math.round(Math.sin(m * 1.1) * 1.5 - 1)));
      }
      if (opts?.hasChild?.includes(catId)) {
        rating.childScore = Math.max(1, Math.min(10, score + Math.round(Math.cos(m * 0.9) * 1 - 0.5)));
      }

      return rating;
    });

    snapshots.push({
      id: `${userId}-${m + 1}`,
      userId,
      snapshotType,
      date: dateStr,
      purposeStatement: purposeStatements[parseInt(userId) % purposeStatements.length],
      quarterlyGoal: quarterlyGoals[m % quarterlyGoals.length],
      majorIssue: majorIssues[m % majorIssues.length],
      ratings,
    });
  }

  return snapshots;
}

// ─── SNAPSHOTS (12 months for the demo user "1" — Jonathan Almanzar) ───
const MEMBER_CATS = ['intimacy', 'marriage', 'parenting', 'staff', 'sales', 'marketing', 'operations', 'finances', 'leadership', 'mental_health', 'physical_health'];
const BASE_SCORES_1 = [7, 6, 7, 6, 8, 5, 7, 7, 6, 5, 4]; // Jonathan

export const MOCK_SNAPSHOTS: Snapshot[] = generateMonthlySnapshots(
  '1', 'member', MEMBER_CATS, BASE_SCORES_1,
  { hasSpouse: ['marriage'], hasChild: ['parenting'] }
);

// ─── EVENTS (Real-style events for Iron Forums) ───
export const MOCK_EVENTS: ForumEvent[] = [
  {
    id: '1',
    title: 'Q2 Kickoff Breakfast — Suwanee',
    date: '2026-04-08',
    location: 'The River Club, 1138 Crescent River Pass, Suwanee, GA',
    description: 'Quarterly kickoff with guest speaker on servant leadership and Kingdom business principles.',
    chapterId: '1',
    attendees: ['1', '2', '5', '16', '23'],
    maxAttendees: 50,
  },
  {
    id: '2',
    title: "Men's Retreat Weekend",
    date: '2026-05-15',
    location: 'Amicalola Falls State Park, Dawsonville, GA',
    description: 'Annual retreat focused on spiritual growth, brotherhood, strategic planning, and renewal. Connect » Sharpen » Grow.',
    chapterId: '1',
    attendees: ['1', '2', '3', '4', '5', '6'],
    maxAttendees: 60,
  },
  {
    id: '3',
    title: 'Cross-Chapter Leadership Summit',
    date: '2026-06-20',
    location: 'Atlanta Marriott Marquis, Atlanta, GA',
    description: 'Annual gathering of all chapter facilitators and board members. Strategic planning, facilitator training, and network growth.',
    chapterId: '2',
    attendees: ['1', '2', '3'],
    maxAttendees: 100,
  },
  {
    id: '4',
    title: 'Nashville Forum Guest Day',
    date: '2026-04-16',
    location: 'Nashville, TN',
    description: 'Bring a business owner friend to experience Iron Forums firsthand. See how we help leaders Connect » Sharpen » Grow.',
    chapterId: '5',
    attendees: ['9', '15'],
    maxAttendees: 25,
  },
  {
    id: '5',
    title: 'Charlotte Chapter Launch Celebration',
    date: '2026-04-24',
    location: 'Charlotte, NC',
    description: 'Celebrating our newest chapter led by Darrell Rochester. Join us for fellowship and vision casting.',
    chapterId: '6',
    attendees: ['10', '19'],
    maxAttendees: 30,
  },
];

// ─── POSTS (Community discussions) ───
export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    authorId: '16',
    authorName: 'Lou Samara',
    title: 'What I love about IF — accountability that goes both ways',
    content: 'What I love about IF is that it not only helps me be accountable, but I can pour into others and help them be accountable too. Being in a group of like-minded entrepreneurs who are there to sharpen and be sharpened is very impactful.',
    date: '2026-03-10',
    replies: 14,
    category: 'Testimony',
  },
  {
    id: '2',
    authorId: '14',
    authorName: 'Alexandra Radford',
    title: 'Best room you can be in as an entrepreneur',
    content: 'These people are the best leaders — they care so much about their employees, quality culture, leadership, excellence… it\'s the best room you can be in if you\'re an entrepreneur.',
    date: '2026-03-08',
    replies: 9,
    category: 'Leadership',
  },
  {
    id: '3',
    authorId: '17',
    authorName: 'Gary Liu',
    title: "I've avoided costly mistakes by seeking godly advice",
    content: "I've avoided costly mistakes by seeking godly advice from these men who have walked this path before me. Brothers, if you're facing a tough decision, bring it to the table.",
    date: '2026-03-05',
    replies: 18,
    category: 'Business',
  },
  {
    id: '4',
    authorId: '15',
    authorName: 'Sawyer Stromwall',
    title: 'A space for faithful followers who want to grow',
    content: "IF is a space where I can sit around a table with a group of people who want to better themselves, their business, and want to be faithful followers of the Lord — this is so rare!",
    date: '2026-02-28',
    replies: 11,
    category: 'Faith',
  },
  {
    id: '5',
    authorId: '12',
    authorName: 'Michael Kearney',
    title: 'From isolation to community — true growth happens together',
    content: 'As a leader, I used to feel like I had to carry it all alone. But connecting with a community of faith-driven leaders changed everything. The brotherhood I\'ve found offers real accountability, encouragement, and wisdom — shaping how I lead and live.',
    date: '2026-02-20',
    replies: 22,
    category: 'Community',
  },
  {
    id: '6',
    authorId: '2',
    authorName: 'Gary Smith',
    title: 'Book recommendation: "The Ruthless Elimination of Hurry"',
    content: 'Brothers, just finished this powerful book by John Mark Comer. If you\'re feeling the weight of running too fast, this is for you. Let\'s discuss at our next Forum.',
    date: '2026-02-15',
    replies: 7,
    category: 'Resources',
  },
];

// ─── ANNOUNCEMENTS ───
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: "Annual Men's Retreat — Registration Open",
    content: "Registration for our 2026 Men's Retreat at Amicalola Falls is now open. Early bird pricing available through April 15th. Connect · Sharpen · Grow.",
    date: '2026-03-12',
    authorName: 'Jonathan Almanzar',
  },
  {
    id: '2',
    title: 'New Chapter Launch: Charlotte, NC',
    content: "We're excited to announce our newest chapter in Charlotte, NC, led by Darrell Rochester. If you know business owners in the Charlotte area, invite them to Be Our Guest.",
    date: '2026-03-01',
    authorName: 'Gary Smith',
    chapterId: '6',
  },
  {
    id: '3',
    title: 'Ben Ambuehl Named Network Director',
    content: 'Congratulations to Ben Ambuehl on his new role as Network Director. Ben will be leading our chapter expansion efforts across the Southeast and beyond.',
    date: '2026-02-15',
    authorName: 'Jonathan Almanzar',
  },
  {
    id: '4',
    title: 'Q1 Snapshot Reminder — Due March 31',
    content: 'Brothers, please complete your monthly Snapshot before the end of March. Your honest self-assessment is the foundation of real growth.',
    date: '2026-03-15',
    authorName: 'Barry Lusk',
  },
];

// ─── CHAT MESSAGES (Consultant welcome) ───
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Welcome, brother. I'm here to walk alongside you as you pause, pray, and reflect on the last 30 days.\n\nThis isn't a test — it's a mirror. Be honest with yourself and with God. I'll ask questions, challenge your thinking, and help you see what He might be showing you.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nLet's start with the foundation. How has your **Intimacy with Jesus** been this past month?`,
    timestamp: '2026-03-17T08:00:00Z',
  },
];
