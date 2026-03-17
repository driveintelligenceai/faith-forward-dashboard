import type { SnapshotCategory } from '@/types';

export const SNAPSHOT_CATEGORIES: SnapshotCategory[] = [
  { id: 'intimacy', name: 'Intimacy with Jesus', group: 'personal', scriptureRef: 'Matt. 22:37-38' },
  { id: 'marriage', name: 'Marriage', group: 'personal', scriptureRef: 'Mark 10:8-10', hasSpouseRating: true },
  { id: 'parenting', name: 'Parenting & Children', group: 'personal', scriptureRef: 'Prov. 22:6', hasChildRating: true },
  { id: 'mental_health', name: 'Mental Health', group: 'personal', scriptureRef: 'Phil. 4:6-7' },
  { id: 'physical_health', name: 'Physical Health', group: 'personal', scriptureRef: '1 Cor. 6:19-20' },
  { id: 'staff', name: 'Staff', group: 'business', scriptureRef: '1 Thess. 5:14' },
  { id: 'sales', name: 'Sales', group: 'business', scriptureRef: 'Matt. 25:21' },
  { id: 'marketing', name: 'Marketing', group: 'business', scriptureRef: 'Isaiah 53:19' },
  { id: 'operations', name: 'Operations', group: 'business', scriptureRef: '1 Cor. 14:40' },
  { id: 'finances', name: 'Finances', group: 'business', scriptureRef: 'Luke 14:24' },
  { id: 'leadership', name: 'Leadership', group: 'business', scriptureRef: '1 Peter 5:2-3' },
];
