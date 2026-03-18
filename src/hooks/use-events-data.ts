import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_EVENTS } from '@/data/mock-data';
import type { DbEvent, DbRsvp } from '@/types/shared';

export interface EventRow {
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
  rsvp_count: number;
}

export function useEventsData() {
  const { isDemo } = useAuth();

  return useQuery<EventRow[]>({
    queryKey: ['events-data', { isDemo }],
    queryFn: async () => {
      if (isDemo) {
        return MOCK_EVENTS.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          type: 'chapter',
          date: e.date,
          time: null,
          end_time: null,
          location: e.location,
          address: null,
          max_attendees: e.maxAttendees,
          chapter_id: e.chapterId,
          created_by_id: null,
          created_at: e.date,
          rsvp_count: e.attendees.length,
        }));
      }

      // Authenticated: fetch events sorted by date
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (eventsError) throw eventsError;

      const typedEvents = (events ?? []) as unknown as DbEvent[];

      // Fetch RSVP counts for all events
      const eventIds = typedEvents.map((e) => e.id);
      let rsvpCountMap = new Map<string, number>();

      if (eventIds.length > 0) {
        const { data: rsvps, error: rsvpsError } = await supabase
          .from('rsvps')
          .select('event_id')
          .in('event_id', eventIds);
        if (rsvpsError) throw rsvpsError;

        for (const row of (rsvps ?? []) as unknown as Pick<DbRsvp, 'event_id'>[]) {
          rsvpCountMap.set(row.event_id, (rsvpCountMap.get(row.event_id) ?? 0) + 1);
        }
      }

      return typedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        type: e.type,
        date: e.date,
        time: e.time,
        end_time: e.end_time,
        location: e.location,
        address: e.address,
        max_attendees: e.max_attendees,
        chapter_id: e.chapter_id,
        created_by_id: e.created_by_id,
        created_at: e.created_at,
        rsvp_count: rsvpCountMap.get(e.id) ?? 0,
      }));
    },
  });
}
