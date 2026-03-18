import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_POSTS } from '@/data/mock-data';
import type { DbPost, DbComment, DbCategory, DbUser } from '@/types/shared';

export interface PostRow {
  id: string;
  title: string;
  body: string;
  is_facilitator: boolean;
  pinned: boolean;
  category_id: string | null;
  category_name: string | null;
  chapter_id: string | null;
  author_id: string;
  author_name: string | null;
  created_at: string;
  comment_count: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export function usePosts() {
  const { isDemo } = useAuth();

  return useQuery<PostRow[]>({
    queryKey: ['posts', { isDemo }],
    queryFn: async () => {
      if (isDemo) {
        return MOCK_POSTS.map((p) => ({
          id: p.id,
          title: p.title,
          body: p.content,
          is_facilitator: false,
          pinned: false,
          category_id: null,
          category_name: p.category,
          chapter_id: null,
          author_id: p.authorId,
          author_name: p.authorName,
          created_at: p.date,
          comment_count: p.replies,
        }));
      }

      // Authenticated: fetch posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (postsError) throw postsError;

      const typedPosts = (posts ?? []) as unknown as DbPost[];

      // Fetch author names
      const authorIds = [...new Set(typedPosts.map((p) => p.author_id))];
      let authorMap = new Map<string, string>();

      if (authorIds.length > 0) {
        const { data: authors, error: authorsError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', authorIds);
        if (authorsError) throw authorsError;
        authorMap = new Map(
          ((authors ?? []) as unknown as Pick<DbUser, 'id' | 'name'>[]).map((u) => [u.id, u.name]),
        );
      }

      // Fetch category names
      const categoryIds = [...new Set(typedPosts.map((p) => p.category_id).filter(Boolean))] as string[];
      let categoryMap = new Map<string, string>();

      if (categoryIds.length > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds);
        if (categoriesError) throw categoriesError;
        categoryMap = new Map(
          ((categories ?? []) as unknown as Pick<DbCategory, 'id' | 'name'>[]).map((c) => [c.id, c.name]),
        );
      }

      // Fetch comment counts
      const postIds = typedPosts.map((p) => p.id);
      let commentCountMap = new Map<string, number>();

      if (postIds.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds);
        if (commentsError) throw commentsError;

        for (const row of (comments ?? []) as unknown as Pick<DbComment, 'post_id'>[]) {
          commentCountMap.set(row.post_id, (commentCountMap.get(row.post_id) ?? 0) + 1);
        }
      }

      return typedPosts.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        is_facilitator: p.is_facilitator,
        pinned: p.pinned,
        category_id: p.category_id,
        category_name: p.category_id ? (categoryMap.get(p.category_id) ?? null) : null,
        chapter_id: p.chapter_id,
        author_id: p.author_id,
        author_name: authorMap.get(p.author_id) ?? null,
        created_at: p.created_at,
        comment_count: commentCountMap.get(p.id) ?? 0,
      }));
    },
  });
}

export function useCategories() {
  const { isDemo } = useAuth();

  return useQuery<CategoryRow[]>({
    queryKey: ['categories', { isDemo }],
    queryFn: async () => {
      if (isDemo) {
        // Derive unique categories from mock posts
        const seen = new Set<string>();
        const result: CategoryRow[] = [];
        let order = 0;
        for (const p of MOCK_POSTS) {
          if (!seen.has(p.category)) {
            seen.add(p.category);
            result.push({ id: p.category, name: p.category, icon: null, sort_order: order++ });
          }
        }
        return result;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;

      return (data ?? []) as unknown as CategoryRow[];
    },
  });
}
