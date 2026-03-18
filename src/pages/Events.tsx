import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Users, ExternalLink } from 'lucide-react';
import { MOCK_EVENTS } from '@/data/mock-data';
import type { ForumEvent } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatDay(dateStr: string) {
  return new Date(dateStr).getDate();
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildCalendarUrl(event: ForumEvent): string {
  const start = new Date(event.date);
  // Default to a 2-hour window starting at 7:30 AM local
  start.setHours(7, 30, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 2);

  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: event.location,
    details: event.description,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function inferEventType(event: ForumEvent): string {
  const title = event.title.toLowerCase();
  if (title.includes('retreat')) return 'Retreat';
  if (title.includes('summit')) return 'Summit';
  if (title.includes('breakfast')) return 'Breakfast';
  if (title.includes('launch')) return 'Launch';
  if (title.includes('guest')) return 'Guest Day';
  return 'Event';
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: ForumEvent; onClick: () => void }) {
  const month = formatMonth(event.date);
  const day = formatDay(event.date);
  const eventType = inferEventType(event);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4 items-start">
        {/* Date badge */}
        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg px-3 py-2 shrink-0 min-w-[52px]">
          <span className="text-xs font-body text-primary font-semibold uppercase tracking-wide">
            {month}
          </span>
          <span className="text-2xl font-heading font-bold text-primary leading-tight">
            {day}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-heading font-bold text-foreground leading-snug">
              {event.title}
            </p>
            <Badge
              variant="secondary"
              className="text-xs font-body shrink-0 mt-0.5"
            >
              {eventType}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs font-body text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-body text-muted-foreground/70">
            <Users className="h-3 w-3 shrink-0" />
            <span>
              {event.attendees.length}
              {event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Event Detail Dialog ───────────────────────────────────────────────────────

function EventDetailDialog({
  event,
  open,
  onClose,
}: {
  event: ForumEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground leading-snug">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Description */}
          <p className="text-sm font-body text-muted-foreground leading-relaxed">
            {event.description}
          </p>

          {/* Details grid */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                  Date &amp; Time
                </p>
                <p className="text-sm font-body text-foreground">
                  {formatFullDate(event.date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                  Location
                </p>
                <p className="text-sm font-body text-foreground">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-0.5">
                  Attendees
                </p>
                <p className="text-sm font-body text-foreground">
                  {event.attendees.length}
                  {event.maxAttendees ? ` of ${event.maxAttendees} spots filled` : ' attending'}
                </p>
              </div>
            </div>
          </div>

          {/* Calendar CTA */}
          <Button
            asChild
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-heading font-bold gap-2 min-h-[44px]"
          >
            <a
              href={buildCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Add to Google Calendar
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<ForumEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const now = new Date();
  const upcoming = MOCK_EVENTS.filter(e => new Date(e.date) >= now).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const past = MOCK_EVENTS.filter(e => new Date(e.date) < now).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function openEvent(event: ForumEvent) {
    setSelectedEvent(event);
    setDialogOpen(true);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
            Events
          </h1>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Meetings &amp; gatherings
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming" className="font-heading font-semibold min-h-[44px]">
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold w-5 h-5">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="font-heading font-semibold min-h-[44px]">
              Past
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3 mt-0">
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-body text-muted-foreground">
                    No upcoming events scheduled.
                  </p>
                </CardContent>
              </Card>
            ) : (
              upcoming.map(event => (
                <EventCard key={event.id} event={event} onClick={() => openEvent(event)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3 mt-0">
            {past.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-body text-muted-foreground">
                    No past events to show.
                  </p>
                </CardContent>
              </Card>
            ) : (
              past.map(event => (
                <EventCard key={event.id} event={event} onClick={() => openEvent(event)} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Event detail dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </DashboardLayout>
  );
}
