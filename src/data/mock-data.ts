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
  { id: '1', name: 'Jonathan Almanzar', role: 'ceo', chapter: 'Suwanee Forum', joinedDate: '2022-01-15' },
  { id: '2', name: 'Gary Smith', role: 'executive', chapter: 'Suwanee Forum', joinedDate: '2003-06-01' },
  { id: '3', name: 'Barry Lusk', role: 'executive', chapter: 'Alpharetta Forum', joinedDate: '2018-03-01' },
  { id: '4', name: 'Rob Marbury', role: 'executive', chapter: 'Cumming Forum', joinedDate: '2015-09-01' },
  { id: '5', name: 'Mike Townsend', role: 'executive', chapter: 'Suwanee Forum', joinedDate: '2016-05-01' },
  { id: '6', name: 'Ben Ambuehl', role: 'facilitator', chapter: 'Alpharetta Forum', joinedDate: '2021-06-15' },
  { id: '7', name: 'Bruce Witt', role: 'facilitator', chapter: 'Gwinnett Forum', joinedDate: '2019-08-01' },
  { id: '8', name: 'W. Gary Wilson', role: 'facilitator', chapter: 'Opelika Forum', joinedDate: '2020-01-10' },
  { id: '9', name: 'Mark Pugh', role: 'facilitator', chapter: 'Nashville Forum', joinedDate: '2019-03-20' },
  { id: '10', name: 'Darrell Rochester', role: 'facilitator', chapter: 'Charlotte Forum', joinedDate: '2021-11-01' },
  { id: '11', name: 'Jason Chandler', role: 'facilitator', chapter: 'Dallas Forum', joinedDate: '2020-07-15' },
  { id: '12', name: 'Michael Kearney', role: 'facilitator', chapter: 'Baltimore Forum', joinedDate: '2022-04-01' },
  { id: '13', name: 'Marc Carson', role: 'facilitator', chapter: 'Johannesburg Forum', joinedDate: '2021-02-01' },
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

// ─── HAND-CRAFTED 12-MONTH DEMO PERSONA ───
// Profile: Happily married, 2 daughters, travels a lot for work.
// Highly successful business owner. Great at sales, weak at marketing.
// Doesn't spend enough time with wife. Middle-of-the-road with Jesus.
// Physical/mental health declining from travel burnout.

const DEMO_SNAPSHOT_DATA: {
  scores: Record<string, number[]>; // categoryId → 12 monthly scores (oldest → newest)
  spouseScores: Record<string, number[]>;
  childScores: Record<string, number[]>;
  lifeEvents: Record<string, Record<number, string>>; // categoryId → { monthIndex: note }
} = {
  scores: {
    //                     Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar
    intimacy:             [ 5,   6,   5,   7,   5,   6,   5,   7,   6,   5,   6,   6 ],
    marriage:             [ 7,   6,   5,   5,   4,   5,   4,   5,   6,   5,   4,   5 ],
    parenting:            [ 8,   8,   9,   8,   8,   9,   8,   9,   8,   8,   9,   8 ],
    staff:                [ 6,   6,   7,   6,   7,   7,   6,   7,   7,   7,   6,   7 ],
    sales:                [ 7,   7,   8,   8,   8,   9,   8,   9,   9,   8,   9,   9 ],
    marketing:            [ 4,   3,   4,   3,   4,   4,   3,   4,   3,   4,   4,   4 ],
    operations:           [ 6,   6,   6,   7,   6,   7,   7,   6,   7,   7,   6,   7 ],
    finances:             [ 7,   7,   7,   8,   7,   8,   8,   7,   8,   8,   7,   8 ],
    leadership:           [ 7,   6,   7,   7,   7,   8,   7,   8,   7,   7,   8,   7 ],
    mental_health:        [ 7,   6,   6,   5,   6,   5,   5,   6,   5,   5,   5,   5 ],
    physical_health:      [ 7,   6,   6,   5,   5,   5,   4,   5,   4,   4,   5,   4 ],
  },
  spouseScores: {
    //                     Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar
    marriage:             [ 6,   5,   4,   4,   3,   4,   3,   4,   5,   3,   3,   4 ],
  },
  childScores: {
    //                     Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec  Jan  Feb  Mar
    parenting:            [ 9,   8,   9,   8,   9,   9,   8,   9,   9,   8,   9,   9 ],
  },
  lifeEvents: {
    intimacy: {
      3: 'Started a men\'s Bible study group — felt closer to God for a few weeks.',
      7: 'Attended the men\'s retreat — powerful time in the Word.',
      10: 'Missed quiet time most of the month — traveling too much.',
    },
    marriage: {
      0: 'Things were good — took a weekend trip together.',
      4: 'Missed our anniversary dinner — was in Dallas for a client pitch.',
      8: 'Started weekly date night — Sarah noticed and it helped.',
      10: 'Canceled date night 3 weeks in a row for work travel.',
      11: 'Sarah told me she feels lonely. That hit hard.',
    },
    parenting: {
      2: 'Coached Emma\'s soccer team — she was so proud.',
      5: 'FaceTimed the girls every night from the road — they love it.',
      8: 'Took both girls on a daddy-daughter day. Best day of the month.',
    },
    sales: {
      5: 'Closed the biggest deal of the year — $1.2M contract.',
      7: 'Pipeline is overflowing. Hired a junior rep to help.',
      10: 'Back-to-back record months. Referral engine is working.',
    },
    marketing: {
      1: 'Tried running Facebook ads — wasted $2K.',
      4: 'Still no marketing hire. I keep putting it off.',
      8: 'A Forum brother offered to introduce me to his marketing person.',
      11: 'Finally started interviewing for a marketing director.',
    },
    mental_health: {
      3: 'Anxious about a cash flow crunch. Couldn\'t sleep well.',
      6: 'Burnout symptoms. Headaches, short temper.',
      9: 'Told my Forum brothers I\'m struggling. They prayed over me.',
    },
    physical_health: {
      0: 'Was going to the gym 3x/week. Felt great.',
      4: 'Travel schedule killed my gym routine.',
      6: 'Put on 15 lbs since summer. Doctor flagged my blood pressure.',
      10: 'Joined a gym near the office but only went twice.',
    },
  },
};

const DEMO_PURPOSE_STATEMENTS = [
  'To lead my family and business with integrity, serving God in all things.',
  'To honor Christ in every decision and invest in the next generation.',
  'To build a company that reflects Kingdom values in the marketplace.',
  'To be a present father and a faithful husband while growing my business.',
];

const DEMO_QUARTERLY_GOALS = [
  'Take Sarah on a real vacation — no phone, no laptop.',
  'Hire a marketing director before end of quarter.',
  'Increase revenue 15% while cutting travel by 20%.',
  'Strengthen daily devotional habit and weekly date nights.',
  'Launch new service offering and close 3 enterprise deals.',
  'Delegate more to my ops manager — stop micromanaging.',
  'Get back to the gym 4x/week. No excuses.',
  'Mentor two younger guys through Iron Forums.',
  'Read 2 leadership books this quarter.',
  'Build a 90-day plan with my team — not solo.',
  'Grow sales pipeline 25% through referrals.',
  'Reconnect with Sarah. She deserves better from me.',
];

const DEMO_MAJOR_ISSUES = [
  'I\'m traveling too much and my wife is feeling it. I need to figure out how to scale without being on the road every week.',
  'My marketing is non-existent. Sales carries everything and that\'s not sustainable.',
  'I feel spiritually dry. I know the right things to do but I\'m not doing them consistently.',
  'Physical health is declining. I\'m making excuses instead of making changes.',
  'I\'m burning out. The business is growing but I\'m not managing the pace.',
  'Sarah told me she feels like a single mom. That was a gut punch. I need to change.',
  'Cash flow is tight despite record revenue. Something\'s off in the financials.',
  'I need to trust my team more and stop trying to do everything myself.',
  'My prayer life is almost nonexistent. I\'m running on fumes spiritually.',
  'The girls are growing up fast and I\'m missing it. That terrifies me.',
  'I need real accountability. Not surface-level stuff. The deep kind.',
  'Struggling with pride. Business success is making me self-reliant instead of God-reliant.',
];

function buildDemoSnapshots(): Snapshot[] {
  const snapshots: Snapshot[] = [];
  const catIds = Object.keys(DEMO_SNAPSHOT_DATA.scores);

  for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
    // monthIdx 0 = oldest (Apr 2025), 11 = newest (Mar 2026)
    const date = new Date(2025, 3 + monthIdx, 1); // April 2025 + monthIdx
    const dateStr = date.toISOString().split('T')[0];

    const ratings = catIds.map(catId => {
      const score = DEMO_SNAPSHOT_DATA.scores[catId][monthIdx];
      const rating: any = { categoryId: catId, score };

      if (DEMO_SNAPSHOT_DATA.spouseScores[catId]) {
        rating.spouseScore = DEMO_SNAPSHOT_DATA.spouseScores[catId][monthIdx];
      }
      if (DEMO_SNAPSHOT_DATA.childScores[catId]) {
        rating.childScore = DEMO_SNAPSHOT_DATA.childScores[catId][monthIdx];
      }
      if (DEMO_SNAPSHOT_DATA.lifeEvents[catId]?.[monthIdx]) {
        rating.lifeEvent = DEMO_SNAPSHOT_DATA.lifeEvents[catId][monthIdx];
      }

      return rating;
    });

    snapshots.push({
      id: `demo-${monthIdx + 1}`,
      userId: '1',
      snapshotType: 'member',
      date: dateStr,
      purposeStatement: DEMO_PURPOSE_STATEMENTS[monthIdx % DEMO_PURPOSE_STATEMENTS.length],
      quarterlyGoal: DEMO_QUARTERLY_GOALS[monthIdx % DEMO_QUARTERLY_GOALS.length],
      majorIssue: DEMO_MAJOR_ISSUES[monthIdx % DEMO_MAJOR_ISSUES.length],
      ratings,
    });
  }

  // Return newest first
  return snapshots.reverse();
}

export const MOCK_SNAPSHOTS: Snapshot[] = buildDemoSnapshots();

// ─── EVENTS ───
export const MOCK_EVENTS: ForumEvent[] = [
  {
    id: '1', title: 'Q2 Kickoff Breakfast — Suwanee', date: '2026-04-08',
    location: 'The River Club, 1138 Crescent River Pass, Suwanee, GA',
    description: 'Quarterly kickoff with guest speaker on servant leadership and Kingdom business principles.',
    chapterId: '1', attendees: ['1', '2', '5', '16', '23'], maxAttendees: 50,
  },
  {
    id: '2', title: "Men's Retreat Weekend", date: '2026-05-15',
    location: 'Amicalola Falls State Park, Dawsonville, GA',
    description: 'Annual retreat focused on spiritual growth, brotherhood, strategic planning, and renewal.',
    chapterId: '1', attendees: ['1', '2', '3', '4', '5', '6'], maxAttendees: 60,
  },
  {
    id: '3', title: 'Cross-Chapter Leadership Summit', date: '2026-06-20',
    location: 'Atlanta Marriott Marquis, Atlanta, GA',
    description: 'Annual gathering of all chapter facilitators and board members.',
    chapterId: '2', attendees: ['1', '2', '3'], maxAttendees: 100,
  },
  {
    id: '4', title: 'Nashville Forum Guest Day', date: '2026-04-16',
    location: 'Nashville, TN',
    description: 'Bring a business owner friend to experience Iron Forums firsthand.',
    chapterId: '5', attendees: ['9', '15'], maxAttendees: 25,
  },
  {
    id: '5', title: 'Charlotte Chapter Launch Celebration', date: '2026-04-24',
    location: 'Charlotte, NC',
    description: 'Celebrating our newest chapter led by Darrell Rochester.',
    chapterId: '6', attendees: ['10', '19'], maxAttendees: 30,
  },
];

// ─── POSTS ───
export const MOCK_POSTS: Post[] = [
  { id: '1', authorId: '16', authorName: 'Lou Samara', title: 'What I love about IF — accountability that goes both ways', content: 'What I love about IF is that it not only helps me be accountable, but I can pour into others too.', date: '2026-03-10', replies: 14, category: 'Testimony' },
  { id: '2', authorId: '14', authorName: 'Alexandra Radford', title: 'Best room you can be in as an entrepreneur', content: 'These people are the best leaders — they care so much about their employees, quality culture, leadership, excellence.', date: '2026-03-08', replies: 9, category: 'Leadership' },
  { id: '3', authorId: '17', authorName: 'Gary Liu', title: "I've avoided costly mistakes by seeking godly advice", content: "I've avoided costly mistakes by seeking godly advice from these men who have walked this path before me.", date: '2026-03-05', replies: 18, category: 'Business' },
  { id: '4', authorId: '15', authorName: 'Sawyer Stromwall', title: 'A space for faithful followers who want to grow', content: "IF is a space where I can sit around a table with people who want to better themselves and be faithful followers of the Lord.", date: '2026-02-28', replies: 11, category: 'Faith' },
  { id: '5', authorId: '12', authorName: 'Michael Kearney', title: 'From isolation to community — true growth happens together', content: 'As a leader, I used to feel like I had to carry it all alone. The brotherhood I\'ve found changed everything.', date: '2026-02-20', replies: 22, category: 'Community' },
  { id: '6', authorId: '2', authorName: 'Gary Smith', title: 'Book recommendation: "The Ruthless Elimination of Hurry"', content: 'Brothers, just finished this powerful book by John Mark Comer. If you\'re feeling the weight of running too fast, this is for you.', date: '2026-02-15', replies: 7, category: 'Resources' },
];

// ─── ANNOUNCEMENTS ───
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: "Annual Men's Retreat — Registration Open", content: "Registration for our 2026 Men's Retreat at Amicalola Falls is now open. Early bird pricing through April 15th.", date: '2026-03-12', authorName: 'Jonathan Almanzar' },
  { id: '2', title: 'New Chapter Launch: Charlotte, NC', content: "Our newest chapter in Charlotte, NC, led by Darrell Rochester. Invite business owners to Be Our Guest.", date: '2026-03-01', authorName: 'Gary Smith', chapterId: '6' },
  { id: '3', title: 'Ben Ambuehl Named Network Director', content: 'Congratulations to Ben Ambuehl on his new role as Network Director.', date: '2026-02-15', authorName: 'Jonathan Almanzar' },
  { id: '4', title: 'Q1 Snapshot Reminder — Due March 31', content: 'Brothers, complete your monthly Snapshot before end of March. Honest self-assessment is the foundation of growth.', date: '2026-03-15', authorName: 'Barry Lusk' },
];

// ─── CHAT MESSAGES ───
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1', role: 'assistant',
    content: `Welcome, brother. I'm here to walk alongside you as you pause, pray, and reflect on the last 30 days.\n\nThis isn't a test — it's a mirror. Be honest with yourself and with God.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nLet's start with the foundation. How has your **Intimacy with Jesus** been this past month?`,
    timestamp: '2026-03-17T08:00:00Z',
  },
];
