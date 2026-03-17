import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS, MOCK_POSTS, MOCK_MEMBERS, MOCK_EVENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ConsultantWidget } from '@/components/dashboard/ConsultantWidget';
import { CategorySparkline } from '@/components/snapshot/CategorySparkline';
import {
  ClipboardCheck,
  TrendingUp,
  Megaphone,
  Users,
  ChevronRight,
  Calendar,
  MessageSquareText,
  UserCircle,
} from 'lucide-react';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-score-high';
  if (score >= 4) return 'text-score-mid';
  return 'text-score-low';
}

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
      <div className="space-y-8 sm:space-y-10">
        {/* Welcome Header */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-primary leading-[1.1]">
            Welcome back, {(profile?.full_name || 'Brother')?.split(' ')[0]}
          </h1>
          <p className="text-base sm:text-lg font-body text-muted-foreground">
            <span className="text-secondary font-semibold">Connect</span>
            <span className="mx-1.5 text-muted-foreground/40">»</span>
            <span className="text-secondary font-semibold">Sharpen</span>
            <span className="mx-1.5 text-muted-foreground/40">»</span>
            <span className="text-secondary font-semibold">Grow</span>
          </p>
        </div>

        {/* Score Cards — compact row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <Card className="border-l-4 border-l-secondary col-span-2 sm:col-span-1">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base font-body font-medium text-muted-foreground">Overall Score</p>
              <p className={`text-4xl sm:text-5xl font-heading font-bold mt-1 sm:mt-2 ${getScoreColor(avgScore)}`}>
                {avgScore}
              </p>
              <p className="text-xs sm:text-sm font-body text-muted-foreground mt-0.5">out of 10</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-high">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base font-body font-medium text-muted-foreground">Top Strength</p>
              <p className="text-base sm:text-xl font-heading font-bold mt-1 sm:mt-2 truncate">{topCategory?.name}</p>
              <CategorySparkline categoryId={topArea?.categoryId ?? ''} snapshots={allSnapshots} />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-low">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base font-body font-medium text-muted-foreground">Needs Attention</p>
              <p className="text-base sm:text-xl font-heading font-bold mt-1 sm:mt-2 truncate">{weakCategory?.name}</p>
              <CategorySparkline categoryId={weakArea?.categoryId ?? ''} snapshots={allSnapshots} />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base font-body font-medium text-muted-foreground">Your Role</p>
              <p className="text-base sm:text-xl font-heading font-bold mt-1 sm:mt-2">
                {profile ? ROLE_LABELS[(profile.role || 'member') as UserRole] : '—'}
              </p>
              <p className="text-sm sm:text-base font-body text-muted-foreground mt-0.5 truncate">{profile?.chapter}</p>
            </CardContent>
          </Card>
        </div>

        {/* Primary Actions — Snapshot CTA + Community */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          <Card
            className="cursor-pointer hover:shadow-md hover:border-secondary/30 transition-all duration-200 group active:scale-[0.98]"
            onClick={() => navigate('/snapshot')}
          >
            <CardContent className="p-5 sm:p-7 flex flex-row items-center gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg sm:text-xl">Take Your Snapshot</h3>
                <p className="text-sm sm:text-base font-body text-muted-foreground mt-0.5">
                  Rate your last 30 days — mandatory monthly
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md hover:border-secondary/30 transition-all duration-200 group active:scale-[0.98]"
            onClick={() => navigate('/community')}
          >
            <CardContent className="p-5 sm:p-7 flex flex-row items-center gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-lg sm:text-xl">Community Hub</h3>
                <p className="text-sm sm:text-base font-body text-muted-foreground mt-0.5">
                  Brothers, events & chapters
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Main content: Community-focused 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: Community Posts + Events (8 cols) */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            {/* Recent Community Posts */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquareText className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-xl sm:text-2xl font-heading">Community</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-body text-muted-foreground hover:text-secondary gap-1"
                    onClick={() => navigate('/community')}
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {recentPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className={`flex items-start gap-3 py-4 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors ${
                      i < recentPosts.length - 1 ? 'border-b border-border/30' : ''
                    }`}
                    onClick={() => navigate('/community')}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-heading font-bold truncate">{post.authorName}</span>
                        <Badge variant="outline" className="text-xs font-body shrink-0">{post.category}</Badge>
                      </div>
                      <h4 className="font-heading font-bold text-base leading-snug mt-0.5">{post.title}</h4>
                      <p className="text-sm font-body text-muted-foreground mt-0.5 line-clamp-1">{post.content}</p>
                    </div>
                    <span className="text-xs font-body text-muted-foreground/60 whitespace-nowrap shrink-0 mt-1">
                      {post.replies} replies
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-xl sm:text-2xl font-heading">Upcoming Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {upcomingEvents.map((event, i) => (
                  <div
                    key={event.id}
                    className={`py-4 ${
                      i < upcomingEvents.length - 1 ? 'border-b border-border/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-base sm:text-lg leading-snug">{event.title}</h4>
                        <p className="text-sm font-body text-muted-foreground mt-0.5">{event.location}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-heading font-bold text-secondary">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs font-body text-muted-foreground">
                          {event.attendees.length}/{event.maxAttendees}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Announcements + Consultant + Snapshots (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:space-y-6">
            {/* Announcements */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-lg sm:text-xl font-heading">Announcements</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {MOCK_ANNOUNCEMENTS.slice(0, 3).map((a, i) => (
                  <div
                    key={a.id}
                    className={`py-3 ${
                      i < 2 ? 'border-b border-border/30' : ''
                    }`}
                  >
                    <h4 className="font-heading font-bold text-sm sm:text-base leading-snug">{a.title}</h4>
                    <p className="text-xs sm:text-sm font-body text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                    <span className="text-xs font-body text-muted-foreground/50 mt-1 block">
                      {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Snapshots */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl font-heading">My Snapshots</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-body text-muted-foreground hover:text-secondary gap-1"
                    onClick={() => navigate('/snapshot')}
                  >
                    All <ChevronRight className="h-3 w-3" />
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
                      className={`flex items-center justify-between py-3 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors ${
                        i < Math.min(allSnapshots.length, 4) - 1 ? 'border-b border-border/30' : ''
                      }`}
                      onClick={() => navigate('/snapshot')}
                    >
                      <p className="font-heading font-bold text-sm sm:text-base leading-snug">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className={`text-xl sm:text-2xl font-heading font-bold ${getScoreColor(avg)}`}>{avg}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* The Consultant — small, tucked away */}
            <ConsultantWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
