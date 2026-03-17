// Snapshot category definitions — aligned with Iron-Forum/shared/snapshot-config.ts (source of truth)
// Keys match Prisma field names (camelCase) used in the report_cards table.
// Dashboard adds: group, hasSpouseRating, hasChildRating, description for web-specific rendering.

import type { SnapshotCategory, SnapshotType } from '@/types';

// ─── MEMBER SNAPSHOT ───
const MEMBER_CATEGORIES: SnapshotCategory[] = [
  { id: 'intimacyWithJesus', name: 'Intimacy with Jesus', group: 'spiritual', scriptureRef: 'Matt. 22:37-38', description: 'Your personal walk with Christ — prayer life, time in the Word, obedience.' },
  { id: 'marriageSelf', name: 'Marriage (You)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'The health of your covenant relationship. How connected are you?' },
  { id: 'marriageSpouse', name: 'Marriage (Spouse)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'How your spouse would rate the health of your marriage.' },
  { id: 'parentingSelf', name: 'Parenting & Children (You)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'Your intentionality and presence as a father.' },
  { id: 'parentingChild', name: 'Parenting & Children (Child)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'How your child would rate your presence and engagement.' },
  { id: 'staff', name: 'Staff', group: 'professional', scriptureRef: '1 Thess. 5:14', description: 'How well you are leading and developing your team.' },
  { id: 'sales', name: 'Sales', group: 'professional', scriptureRef: 'Matt. 25:21', description: 'Revenue generation, pipeline health, and stewardship of opportunity.' },
  { id: 'marketing', name: 'Marketing', group: 'professional', scriptureRef: 'Isaiah 43:19', description: 'Brand visibility, messaging effectiveness, and market position.' },
  { id: 'operations', name: 'Operations', group: 'professional', scriptureRef: '1 Cor. 14:40', description: 'Systems, processes, and the orderliness of your business.' },
  { id: 'finances', name: 'Finances', group: 'professional', scriptureRef: 'Luke 14:28', description: 'Cash flow, profitability, generosity, and financial stewardship.' },
  { id: 'leadership', name: 'Leadership', group: 'professional', scriptureRef: '1 Peter 5:2-3', description: 'Your effectiveness as a servant leader in your organization.' },
  { id: 'mentalHealth', name: 'Mental Health', group: 'personal', scriptureRef: 'Phil. 4:6-7', description: 'Anxiety, stress, peace of mind, and emotional stability.' },
  { id: 'physicalHealth', name: 'Physical Health', group: 'personal', scriptureRef: '1 Cor. 6:19-20', description: 'Exercise, nutrition, sleep, and honoring your body as a temple.' },
];

// ─── LEADER SNAPSHOT ───
const LEADER_CATEGORIES: SnapshotCategory[] = [
  { id: 'intimacyWithJesus', name: 'Intimacy with Jesus', group: 'spiritual', scriptureRef: 'Matt. 22:37-38', description: 'Your personal walk with Christ — prayer life, time in the Word, obedience.' },
  { id: 'marriageSelf', name: 'Marriage (You)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'The health of your covenant relationship.' },
  { id: 'marriageSpouse', name: 'Marriage (Spouse)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'How your spouse would rate the health of your marriage.' },
  { id: 'parentingSelf', name: 'Parenting & Children (You)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'Your intentionality and presence as a father.' },
  { id: 'parentingChild', name: 'Parenting & Children (Child)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'How your child would rate your presence and engagement.' },
  { id: 'leadership', name: 'Leadership', group: 'professional', scriptureRef: '1 Peter 5:2-3', description: 'Your effectiveness leading your chapter and organization.' },
  { id: 'teamManagement', name: 'Team Management', group: 'professional', scriptureRef: 'Phil. 2:3-4', description: 'How well you develop, empower, and serve those you lead.' },
  { id: 'progressGoals', name: 'Progress with Major Goals & Objectives', group: 'professional', scriptureRef: 'Prov. 16:3', description: 'Movement toward your most important strategic priorities.' },
  { id: 'lessonsScripture', name: 'Lessons from Scripture & Holy Spirit', group: 'spiritual', scriptureRef: '1 Cor. 14:40', description: 'What God is teaching you right now through His Word and Spirit.' },
  { id: 'mentalHealth', name: 'Mental Health', group: 'personal', scriptureRef: 'Phil. 4:6-7', description: 'Anxiety, stress, peace of mind, and emotional stability.' },
  { id: 'physicalHealth', name: 'Physical Health', group: 'personal', scriptureRef: '1 Cor. 6:19-20', description: 'Exercise, nutrition, sleep, and honoring your body as a temple.' },
];

// ─── IRON PULSE (ADVISOR) ───
const ADVISOR_CATEGORIES: SnapshotCategory[] = [
  { id: 'intimacyWithJesus', name: 'Intimacy with Jesus', group: 'spiritual', scriptureRef: 'Matt. 22:37-38', description: 'Your personal walk with Christ — prayer life, time in the Word, obedience.' },
  { id: 'marriageSelf', name: 'Marriage (You)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'The health of your covenant relationship.' },
  { id: 'marriageSpouse', name: 'Marriage (Spouse)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'How your spouse would rate the health of your marriage.' },
  { id: 'parentingSelf', name: 'Parenting & Children (You)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'Your intentionality and presence as a father.' },
  { id: 'parentingChild', name: 'Parenting & Children (Child)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'How your child would rate your presence and engagement.' },
  { id: 'mentoring', name: 'Mentoring', group: 'spiritual', scriptureRef: '2 Tim. 2:2', description: 'How faithfully you are investing in the next generation of leaders.' },
  { id: 'lifeLessons', name: 'Life Lessons Learned', group: 'spiritual', scriptureRef: '1 John 3:16', description: 'Wisdom gained through experience, failure, and the grace of God.' },
  { id: 'progressGoals', name: 'Progress with Major Goals & Objectives', group: 'professional', scriptureRef: 'Prov. 16:3', description: 'Movement toward your most important strategic priorities.' },
  { id: 'lessonsScripture', name: 'Lessons from Scripture & Holy Spirit', group: 'spiritual', scriptureRef: '1 Cor. 14:40', description: 'What God is teaching you right now through His Word and Spirit.' },
  { id: 'mentalHealth', name: 'Mental Health', group: 'personal', scriptureRef: 'Phil. 4:6-7', description: 'Anxiety, stress, peace of mind, and emotional stability.' },
  { id: 'physicalHealth', name: 'Physical Health', group: 'personal', scriptureRef: '1 Cor. 6:19-20', description: 'Exercise, nutrition, sleep, and honoring your body as a temple.' },
];

// ─── NONPROFIT SNAPSHOT ───
const NONPROFIT_CATEGORIES: SnapshotCategory[] = [
  { id: 'intimacyWithJesus', name: 'Intimacy with Jesus', group: 'spiritual', scriptureRef: 'Matt. 22:37-38', description: 'Your personal walk with Christ — prayer life, time in the Word, obedience.' },
  { id: 'marriageSelf', name: 'Marriage (You)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'The health of your covenant relationship.' },
  { id: 'marriageSpouse', name: 'Marriage (Spouse)', group: 'personal', scriptureRef: 'Mark 10:8-10', description: 'How your spouse would rate the health of your marriage.' },
  { id: 'parentingSelf', name: 'Parenting & Children (You)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'Your intentionality and presence as a father.' },
  { id: 'parentingChild', name: 'Parenting & Children (Child)', group: 'personal', scriptureRef: 'Prov. 22:6', description: 'How your child would rate your presence and engagement.' },
  { id: 'staff', name: 'Staff & Volunteers', group: 'professional', scriptureRef: '1 Thess. 5:14', description: 'How well you are leading, supporting, and developing your team.' },
  { id: 'sales', name: 'Growth & Impact', group: 'professional', scriptureRef: 'Matt. 25:21', description: 'Effectiveness in fulfilling your mission and reaching more people.' },
  { id: 'marketing', name: 'Marketing', group: 'professional', scriptureRef: 'Isaiah 43:19', description: 'Awareness, storytelling, and communicating your mission.' },
  { id: 'operations', name: 'Operations', group: 'professional', scriptureRef: '1 Cor. 14:40', description: 'Systems, processes, and organizational orderliness.' },
  { id: 'finances', name: 'Finances', group: 'professional', scriptureRef: 'Luke 14:28', description: 'Fundraising, stewardship, budget health, and donor relationships.' },
  { id: 'leadership', name: 'Leadership', group: 'professional', scriptureRef: '1 Peter 5:2-3', description: 'Board relations, vision casting, and servant leadership.' },
  { id: 'mentalHealth', name: 'Mental Health', group: 'personal', scriptureRef: 'Phil. 4:6-7', description: 'Anxiety, stress, peace of mind, and emotional stability.' },
  { id: 'physicalHealth', name: 'Physical Health', group: 'personal', scriptureRef: '1 Cor. 6:19-20', description: 'Exercise, nutrition, sleep, and honoring your body as a temple.' },
];

export const SNAPSHOT_CONFIGS: Record<SnapshotType, SnapshotCategory[]> = {
  member: MEMBER_CATEGORIES,
  leader: LEADER_CATEGORIES,
  advisor: ADVISOR_CATEGORIES,
  nonprofit: NONPROFIT_CATEGORIES,
};

// Keep legacy export for backward compat
export const SNAPSHOT_CATEGORIES = MEMBER_CATEGORIES;
