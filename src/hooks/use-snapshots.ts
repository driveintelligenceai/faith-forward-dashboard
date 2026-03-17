import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Snapshot, SnapshotRating, SnapshotType } from '@/types';

interface DbSnapshot {
  id: string;
  user_id: string;
  snapshot_type: string;
  purpose_statement: string;
  quarterly_goal: string;
  major_issue: string;
  created_at: string;
}

interface DbRating {
  id: string;
  snapshot_id: string;
  category_id: string;
  score: number;
  spouse_score: number | null;
  child_score: number | null;
  note: string | null;
  life_event: string | null;
}

export function useSnapshots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }

    try {
      // Fetch snapshots with ratings
      const { data: snapshotRows, error: snapErr } = await supabase
        .from('snapshots')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (snapErr) throw snapErr;
      if (!snapshotRows?.length) {
        setSnapshots([]);
        setIsLoading(false);
        return;
      }

      const snapshotIds = snapshotRows.map((s: DbSnapshot) => s.id);
      const { data: ratingRows, error: ratErr } = await supabase
        .from('snapshot_ratings')
        .select('*')
        .in('snapshot_id', snapshotIds);

      if (ratErr) throw ratErr;

      const ratingsBySnapshot = new Map<string, SnapshotRating[]>();
      (ratingRows || []).forEach((r: DbRating) => {
        const list = ratingsBySnapshot.get(r.snapshot_id) || [];
        list.push({
          categoryId: r.category_id,
          score: r.score,
          spouseScore: r.spouse_score ?? undefined,
          childScore: r.child_score ?? undefined,
          note: r.note ?? undefined,
          lifeEvent: r.life_event ?? undefined,
        });
        ratingsBySnapshot.set(r.snapshot_id, list);
      });

      const mapped: Snapshot[] = snapshotRows.map((s: DbSnapshot) => ({
        id: s.id,
        userId: s.user_id,
        snapshotType: s.snapshot_type as SnapshotType,
        date: s.created_at.split('T')[0],
        purposeStatement: s.purpose_statement,
        quarterlyGoal: s.quarterly_goal,
        majorIssue: s.major_issue,
        ratings: ratingsBySnapshot.get(s.id) || [],
      }));

      setSnapshots(mapped);
    } catch (err) {
      console.error('Error fetching snapshots:', err);
      toast({ title: 'Error', description: 'Failed to load snapshot history.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const saveSnapshot = useCallback(async (
    snapshotType: SnapshotType,
    purposeStatement: string,
    quarterlyGoal: string,
    majorIssue: string,
    ratings: Record<string, SnapshotRating>
  ) => {
    if (!user) return null;
    setIsSaving(true);

    try {
      // Insert snapshot
      const { data: snapshot, error: snapErr } = await supabase
        .from('snapshots')
        .insert({
          user_id: user.id,
          snapshot_type: snapshotType,
          purpose_statement: purposeStatement,
          quarterly_goal: quarterlyGoal,
          major_issue: majorIssue,
        })
        .select()
        .single();

      if (snapErr) throw snapErr;

      // Insert ratings
      const ratingRows = Object.entries(ratings)
        .filter(([, r]) => r.score > 0)
        .map(([, r]) => ({
          snapshot_id: snapshot.id,
          category_id: r.categoryId,
          score: r.score,
          spouse_score: r.spouseScore ?? null,
          child_score: r.childScore ?? null,
          note: r.note ?? null,
          life_event: r.lifeEvent ?? null,
        }));

      if (ratingRows.length > 0) {
        const { error: ratErr } = await supabase
          .from('snapshot_ratings')
          .insert(ratingRows);
        if (ratErr) throw ratErr;
      }

      toast({ title: 'Snapshot Saved', description: 'Your snapshot has been saved successfully.' });
      await fetchSnapshots(); // Refresh
      return snapshot.id;
    } catch (err) {
      console.error('Error saving snapshot:', err);
      toast({ title: 'Save Failed', description: 'Could not save your snapshot. Please try again.', variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, toast, fetchSnapshots]);

  return { snapshots, isLoading, isSaving, saveSnapshot, refetch: fetchSnapshots };
}
