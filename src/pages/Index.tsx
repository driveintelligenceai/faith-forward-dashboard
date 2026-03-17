import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Target,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-score-high';
  if (score >= 4) return 'text-score-mid';
  return 'text-score-low';
}

export default function Index() {
  const { user } = useAuth();
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
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-base font-body text-muted-foreground mt-2">
            Your Iron Forums dashboard — <span className="text-secondary font-semibold">Connect</span> · <span className="text-secondary font-semibold">Sharpen</span> · <span className="text-secondary font-semibold">Grow</span>
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-muted-foreground">Average Score</p>
                  <p className={`text-4xl font-heading font-bold mt-1 ${getScoreColor(avgScore)}`}>
                    {avgScore}
                  </p>
                </div>
                <Target className="h-9 w-9 text-secondary/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-high">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-muted-foreground">Top Strength</p>
                  <p className="text-base font-body font-semibold mt-1">{topCategory?.name}</p>
                  <p className={`text-3xl font-heading font-bold ${getScoreColor(topArea?.score ?? 0)}`}>
                    {topArea?.score}/10
                  </p>
                </div>
                <TrendingUp className="h-9 w-9 text-score-high/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-low">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-muted-foreground">Needs Attention</p>
                  <p className="text-base font-body font-semibold mt-1">{weakCategory?.name}</p>
                  <p className={`text-3xl font-heading font-bold ${getScoreColor(weakArea?.score ?? 0)}`}>
                    {weakArea?.score}/10
                  </p>
                </div>
                <TrendingDown className="h-9 w-9 text-score-low/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium text-muted-foreground">Role</p>
                  <p className="text-base font-body font-semibold mt-1">
                    {user ? ROLE_LABELS[user.role] : '—'}
                  </p>
                  <p className="text-sm font-body text-muted-foreground">{user?.chapter}</p>
                </div>
                {user && (
                  <Badge className={`${ROLE_COLORS[user.role]} text-xs font-body border-0`}>
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md hover:border-secondary/40 transition-all" onClick={() => navigate('/snapshot')}>
            <CardContent className="p-6 flex items-center gap-5">
              <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-lg">Take Your Snapshot</h3>
                <p className="text-sm font-body text-muted-foreground mt-0.5">
                  Rate your last 30 days across all life categories
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md hover:border-secondary/40 transition-all" onClick={() => navigate('/consultant')}>
            <CardContent className="p-6 flex items-center gap-5">
              <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <MessageSquare className="h-7 w-7 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-lg">Talk to The Consultant</h3>
                <p className="text-sm font-body text-muted-foreground mt-0.5">
                  Get AI-powered guidance for your growth areas
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-secondary" />
              <CardTitle className="text-xl font-heading">Announcements</CardTitle>
            </div>
            <CardDescription className="font-body">Latest updates from Iron Forums</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-heading font-semibold text-base">{a.title}</h4>
                    <p className="text-sm font-body text-muted-foreground mt-1">{a.content}</p>
                  </div>
                  <span className="text-xs font-body text-muted-foreground whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Snapshots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-heading">Recent Snapshots</CardTitle>
            <CardDescription className="font-body">Your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_SNAPSHOTS.map((s) => {
                const avg =
                  Math.round(
                    (s.ratings.reduce((sum, r) => sum + r.score, 0) / s.ratings.length) * 10
                  ) / 10;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-heading font-semibold">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm font-body text-muted-foreground">{s.quarterlyGoal}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-heading font-bold ${getScoreColor(avg)}`}>{avg}</p>
                      <p className="text-xs font-body text-muted-foreground">avg score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
