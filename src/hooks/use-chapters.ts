import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_CHAPTERS } from '@/data/mock-data';
import type { DbChapter } from '@/types/shared';

export interface ChapterRow {
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
  member_count: number;
}

export function useChapters() {
  const { isDemo } = useAuth();

  return useQuery<ChapterRow[]>({
    queryKey: ['chapters', { isDemo }],
    queryFn: async () => {
      if (isDemo) {
        return MOCK_CHAPTERS.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          state: c.state,
          state_code: null,
          meeting_day: c.meetingDay,
          meeting_time: c.meetingTime,
          meeting_location: null,
          description: null,
          next_meeting_date: null,
          org_id: '',
          member_count: c.memberCount,
        }));
      }

      // Authenticated: fetch chapters
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .order('name');
      if (chaptersError) throw chaptersError;

      const typedChapters = (chapters ?? []) as unknown as DbChapter[];

      // Fetch member counts per chapter
      const chapterIds = typedChapters.map((c) => c.id);
      let memberCountMap = new Map<string, number>();

      if (chapterIds.length > 0) {
        // Count users grouped by chapter_id
        const { data: counts, error: countsError } = await supabase
          .from('users')
          .select('chapter_id')
          .in('chapter_id', chapterIds);
        if (countsError) throw countsError;

        for (const row of (counts ?? []) as unknown as { chapter_id: string | null }[]) {
          if (row.chapter_id) {
            memberCountMap.set(row.chapter_id, (memberCountMap.get(row.chapter_id) ?? 0) + 1);
          }
        }
      }

      return typedChapters.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        state: c.state,
        state_code: c.state_code,
        meeting_day: c.meeting_day,
        meeting_time: c.meeting_time,
        meeting_location: c.meeting_location,
        description: c.description,
        next_meeting_date: c.next_meeting_date,
        org_id: c.org_id,
        member_count: memberCountMap.get(c.id) ?? 0,
      }));
    },
  });
}
