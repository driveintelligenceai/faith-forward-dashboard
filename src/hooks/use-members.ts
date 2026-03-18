import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_MEMBERS } from '@/data/mock-data';
import type { DbUser, DbChapter } from '@/types/shared';

export interface MemberRow {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  title: string | null;
  company: string | null;
  role: DbUser['role'];
  snapshot_type: string;
  dues_status: string;
  chapter_id: string | null;
  chapter_name: string | null;
  created_at: string;
}

interface UseMembersOptions {
  search?: string;
  chapterId?: string;
}

export function useMembers({ search = '', chapterId }: UseMembersOptions = {}) {
  const { isDemo } = useAuth();

  return useQuery<MemberRow[]>({
    queryKey: ['members', { search, chapterId, isDemo }],
    queryFn: async () => {
      if (isDemo) {
        // Transform MOCK_MEMBERS to MemberRow shape
        let results: MemberRow[] = MOCK_MEMBERS.map((m) => ({
          id: m.id,
          name: m.name,
          email: null,
          city: null,
          state: null,
          industry: null,
          title: null,
          company: null,
          role: 'member' as DbUser['role'],
          snapshot_type: 'member',
          dues_status: 'active',
          chapter_id: null,
          chapter_name: m.chapter,
          created_at: m.joinedDate,
        }));

        if (search) {
          const lower = search.toLowerCase();
          results = results.filter(
            (r) =>
              r.name.toLowerCase().includes(lower) ||
              (r.chapter_name ?? '').toLowerCase().includes(lower),
          );
        }

        if (chapterId) {
          results = results.filter((r) => r.chapter_id === chapterId);
        }

        return results;
      }

      // Authenticated: query Supabase
      let query = supabase.from('users').select('*');

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data: users, error: usersError } = await query.order('name');
      if (usersError) throw usersError;

      const typedUsers = (users ?? []) as unknown as DbUser[];

      // Fetch chapter names for all chapter_ids present
      const chapterIds = [...new Set(typedUsers.map((u) => u.chapter_id).filter(Boolean))] as string[];
      let chapterMap = new Map<string, string>();

      if (chapterIds.length > 0) {
        const { data: chapters, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, name')
          .in('id', chapterIds);
        if (chaptersError) throw chaptersError;
        chapterMap = new Map(
          ((chapters ?? []) as unknown as Pick<DbChapter, 'id' | 'name'>[]).map((c) => [c.id, c.name]),
        );
      }

      let rows: MemberRow[] = typedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        city: u.city,
        state: u.state,
        industry: u.industry,
        title: u.title,
        company: u.company,
        role: u.role,
        snapshot_type: u.snapshot_type,
        dues_status: u.dues_status,
        chapter_id: u.chapter_id,
        chapter_name: u.chapter_id ? (chapterMap.get(u.chapter_id) ?? null) : null,
        created_at: u.created_at,
      }));

      if (search) {
        const lower = search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.name.toLowerCase().includes(lower) ||
            (r.email ?? '').toLowerCase().includes(lower) ||
            (r.chapter_name ?? '').toLowerCase().includes(lower),
        );
      }

      return rows;
    },
  });
}
