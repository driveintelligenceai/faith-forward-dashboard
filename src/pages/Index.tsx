import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Target,
  Megaphone,
  ArrowRight,
  Users,
  ChevronRight,
} from 'lucide-react';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-score-high';
  if (score >= 4) return 'text-score-mid';
  return 'text-score-low';
}

function getScoreBg(score: number) {
  if (score >= 7) return 'bg-score-high/10';
  if (score >= 4) return 'bg-score-mid/10';
  return 'bg-score-low/10';
}

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const latestSnapshot = MOCK_SNAPSHOTS[0];

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
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="text-secondary font-semibold">Sharpen</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="text-secondary font-semibold">Grow</span>
          </p>
        </div>

        {/* Score Cards — responsive grid */}
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
              <p className={`text-3xl sm:text-4xl font-heading font-bold mt-0.5 sm:mt-1 ${getScoreColor(topArea?.score ?? 0)}`}>
                {topArea?.score}<span className="text-sm sm:text-lg text-muted-foreground">/10</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-low">
            <CardContent className="p-4 sm:p-6">
              <p className="text-sm sm:text-base font-body font-medium text-muted-foreground">Needs Attention</p>
              <p className="text-base sm:text-xl font-heading font-bold mt-1 sm:mt-2 truncate">{weakCategory?.name}</p>
              <p className={`text-3xl sm:text-4xl font-heading font-bold mt-0.5 sm:mt-1 ${getScoreColor(weakArea?.score ?? 0)}`}>
                {weakArea?.score}<span className="text-sm sm:text-lg text-muted-foreground">/10</span>
              </p>
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

        {/* Quick Actions — clean, card-based */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {[
            {
              title: 'Take Your Snapshot',
              desc: 'Rate your last 30 days',
              icon: ClipboardCheck,
              bg: 'bg-primary',
              url: '/snapshot',
            },
            {
              title: 'Talk to The Consultant',
              desc: 'AI-powered mentoring',
              icon: MessageSquare,
              bg: 'bg-secondary',
              url: '/consultant',
            },
            {
              title: 'Community Hub',
              desc: 'Brothers, events & chapters',
              icon: Users,
              bg: 'bg-primary/80',
              url: '/community',
            },
          ].map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md hover:border-secondary/30 transition-all duration-200 group active:scale-[0.98]"
              onClick={() => navigate(action.url)}
            >
              <CardContent className="p-5 sm:p-7 flex flex-row sm:flex-col items-center sm:items-center text-left sm:text-center gap-4">
                <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl ${action.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                  <action.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                </div>
                <div className="flex-1 sm:flex-initial">
                  <h3 className="font-heading font-bold text-lg sm:text-xl">{action.title}</h3>
                  <p className="text-sm sm:text-base font-body text-muted-foreground mt-0.5">
                    {action.desc}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-secondary transition-colors sm:hidden" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {/* Announcements — takes 3 cols */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <Megaphone className="h-5 w-5 text-secondary" />
                <CardTitle className="text-xl sm:text-2xl font-heading">Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {MOCK_ANNOUNCEMENTS.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-start justify-between gap-3 py-4 ${
                    i < MOCK_ANNOUNCEMENTS.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-base sm:text-lg leading-snug">{a.title}</h4>
                    <p className="text-sm sm:text-base font-body text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-body text-muted-foreground/60 whitespace-nowrap shrink-0 mt-0.5">
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Snapshots — takes 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl sm:text-2xl font-heading">Recent Snapshots</CardTitle>
              <CardDescription className="text-sm sm:text-base font-body">Your progress over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {MOCK_SNAPSHOTS.map((s, i) => {
                const avg =
                  Math.round(
                    (s.ratings.reduce((sum, r) => sum + r.score, 0) / s.ratings.length) * 10
                  ) / 10;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between py-3.5 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors ${
                      i < MOCK_SNAPSHOTS.length - 1 ? 'border-b border-border/30' : ''
                    }`}
                    onClick={() => navigate('/snapshot')}
                  >
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-base sm:text-lg leading-snug">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs sm:text-sm font-body text-muted-foreground mt-0.5 truncate">{s.quarterlyGoal}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-2xl sm:text-3xl font-heading font-bold ${getScoreColor(avg)}`}>{avg}</p>
                      <p className="text-[11px] sm:text-xs font-body text-muted-foreground">avg</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
