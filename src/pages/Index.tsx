import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS, MOCK_POSTS, MOCK_EVENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ConsultantWidget } from '@/components/dashboard/ConsultantWidget';
import {
  ClipboardCheck,
  Megaphone,
  Users,
  ChevronRight,
  Calendar,
  MessageSquareText,
  UserCircle,
} from 'lucide-react';

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { snapshots: dbSnapshots } = useSnapshots();
  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSnapshot = allSnapshots[0];

  const avgScore = latestSnapshot
    ? Math.round(
        (latestSnapshot.ratings.reduce((sum, r) => sum + r.score, 0) /
          latestSnapshot.ratings.length) *
          10
      ) / 10
    : 0;

  const topArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((best, r) => (r.score > best.score ? r : best))
    : null;
  const weakArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((worst, r) => (r.score < worst.score ? r : worst))
    : null;

  const topCategory = topArea
    ? SNAPSHOT_CATEGORIES.find((c) => c.id === topArea.categoryId)
    : null;
  const weakCategory = weakArea
    ? SNAPSHOT_CATEGORIES.find((c) => c.id === weakArea.categoryId)
    : null;

  const upcomingEvents = MOCK_EVENTS.filter(
    (e) => new Date(e.date) >= new Date()
  ).slice(0, 3);

  const recentPosts = MOCK_POSTS.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="space-y-7 sm:space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-primary">
            Welcome back, {(profile?.full_name || 'Brother')?.split(' ')[0]}
          </h1>
          <p className="text-sm sm:text-base font-body text-muted-foreground mt-1">
            {profile ? ROLE_LABELS[(profile.role || 'member') as UserRole] : ''}{profile?.chapter ? ` · ${profile.chapter}` : ''}
          </p>
        </div>

        {/* Snapshot Summary — single muted row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card
            className="cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => navigate('/snapshot')}
          >
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Overall</p>
              <p className="text-3xl sm:text-4xl font-heading font-bold text-primary mt-1">{avgScore}</p>
              <p className="text-xs font-body text-muted-foreground">/10 avg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Strongest</p>
              <p className="text-sm sm:text-base font-heading font-bold mt-1 truncate">{topCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{topArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs sm:text-sm font-body text-muted-foreground">Focus Area</p>
              <p className="text-sm sm:text-base font-heading font-bold mt-1 truncate">{weakCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{weakArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card
            className="cursor-pointer hover:shadow-sm transition-shadow group"
            onClick={() => navigate('/snapshot')}
          >
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-base">Take Your Snapshot</p>
                <p className="text-xs font-body text-muted-foreground">Monthly report card — required</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-sm transition-shadow group"
            onClick={() => navigate('/community')}
          >
            <CardContent className="p-4 sm:p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-base">Community Hub</p>
                <p className="text-xs font-body text-muted-foreground">Brothers, events & chapters</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left: Community + Events */}
          <div className="lg:col-span-8 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg font-heading">Community</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-body text-muted-foreground"
                    onClick={() => navigate('/community')}
                  >
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {recentPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className={`flex items-start gap-3 py-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors ${
                      i < recentPosts.length - 1 ? 'border-b border-border/20' : ''
                    }`}
                    onClick={() => navigate('/community')}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-heading font-bold leading-snug">{post.title}</p>
                      <p className="text-xs font-body text-muted-foreground mt-0.5">
                        {post.authorName} · {post.replies} replies
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg font-heading">Upcoming Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {upcomingEvents.map((event, i) => (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between py-3 ${
                      i < upcomingEvents.length - 1 ? 'border-b border-border/20' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm leading-snug">{event.title}</p>
                      <p className="text-xs font-body text-muted-foreground mt-0.5">{event.location}</p>
                    </div>
                    <p className="text-sm font-heading font-bold text-primary shrink-0 ml-3">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Announcements + Snapshots + Consultant */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg font-heading">Announcements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {MOCK_ANNOUNCEMENTS.slice(0, 3).map((a, i) => (
                  <div
                    key={a.id}
                    className={`py-3 ${i < 2 ? 'border-b border-border/20' : ''}`}
                  >
                    <p className="font-heading font-bold text-sm leading-snug">{a.title}</p>
                    <p className="text-xs font-body text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">My Snapshots</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-body text-muted-foreground"
                    onClick={() => navigate('/snapshot')}
                  >
                    All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {allSnapshots.slice(0, 4).map((s, i) => {
                  const avg =
                    Math.round(
                      (s.ratings.reduce((sum, r) => sum + r.score, 0) / s.ratings.length) * 10
                    ) / 10;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between py-2.5 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors ${
                        i < 3 ? 'border-b border-border/20' : ''
                      }`}
                      onClick={() => navigate('/snapshot')}
                    >
                      <p className="font-heading font-bold text-sm">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-lg font-heading font-bold text-primary">{avg}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <ConsultantWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
