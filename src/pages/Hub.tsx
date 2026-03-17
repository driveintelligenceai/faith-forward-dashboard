import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionItems } from '@/components/dashboard/ActionItems';
import { CommunityChat } from '@/components/hub/CommunityChat';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { Play, CalendarDays, Megaphone } from 'lucide-react';
import hubHero from '@/assets/hub-hero.jpg';
import ceoThumbnail from '@/assets/ceo-thumbnail.jpg';
import membersRetreat from '@/assets/members-retreat.jpg';

export default function Hub() {
  const { profile } = useAuth();
  const firstName = (profile?.full_name || 'Brother')?.split(' ')[0];

  const upcomingEvents = MOCK_EVENTS
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 max-w-5xl">

        {/* ── Hero Banner ── */}
        <div className="relative rounded-2xl overflow-hidden h-[180px] sm:h-[220px]">
          <img src={hubHero} alt="Iron Forums brotherhood" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-foreground tracking-tight">
              What's happening, {firstName}
            </h1>
            <p className="text-sm sm:text-base font-body text-primary-foreground/80 mt-1">
              News, events, and action items from your Iron Forums brotherhood.
            </p>
          </div>
        </div>

        {/* ── CEO Video + Announcements Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Weekly CEO Video */}
          <Card className="lg:col-span-3 overflow-hidden">
            <div className="relative group cursor-pointer">
              <img src={ceoThumbnail} alt="Jonathan Almanzar" className="w-full h-[200px] sm:h-[240px] object-cover" />
              <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-secondary-foreground ml-1" />
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <Badge variant="secondary" className="text-xs font-body mb-2">Weekly Update</Badge>
              <h3 className="text-base font-heading font-bold text-foreground">March Week 3: Staying Present While Scaling</h3>
              <p className="text-sm font-body text-muted-foreground mt-1">
                Jonathan Almanzar, CEO · March 17, 2026
              </p>
            </CardContent>
          </Card>

          {/* Announcements */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-secondary" />
              <h2 className="text-lg font-heading font-bold text-foreground">Announcements</h2>
            </div>
            <div className="space-y-2">
              {MOCK_ANNOUNCEMENTS.slice(0, 4).map(a => (
                <Card key={a.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <p className="text-sm font-heading font-semibold text-foreground leading-snug">{a.title}</p>
                    <p className="text-xs font-body text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-xs font-body text-muted-foreground/60 mt-1.5">
                      {a.authorName} · {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* ── Upcoming Events + Member Spotlight ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Upcoming Events */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-heading font-bold text-foreground">Upcoming Events</h2>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map(event => (
                <Card key={event.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-primary/5 rounded-lg px-3 py-2 shrink-0">
                      <span className="text-xs font-body text-primary uppercase">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-heading font-bold text-primary">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-heading font-bold text-foreground truncate">{event.title}</p>
                      <p className="text-xs font-body text-muted-foreground mt-0.5 truncate">{event.location}</p>
                      <p className="text-xs font-body text-muted-foreground/60 mt-1">
                        {event.attendees.length}{event.maxAttendees ? `/${event.maxAttendees}` : ''} attending
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Member Spotlight */}
          <div className="space-y-3">
            <h2 className="text-lg font-heading font-bold text-foreground">Brotherhood in Action</h2>
            <Card className="overflow-hidden">
              <img src={membersRetreat} alt="Iron Forums retreat" className="w-full h-[200px] object-cover" />
              <CardContent className="p-4">
                <p className="text-sm font-heading font-bold text-foreground">2025 Men's Retreat — Amicalola Falls</p>
                <p className="text-xs font-body text-muted-foreground mt-1">
                  Real conversations. Real accountability. Real brotherhood. Registration for 2026 is now open.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Action Items ── */}
        <ActionItems />

        {/* ── Community Coordinator AI ── */}
        <CommunityChat />

      </div>
    </DashboardLayout>
  );
}
