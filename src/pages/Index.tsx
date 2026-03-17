import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { ROLE_LABELS } from '@/types';
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
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your Iron Forums dashboard — track, grow, and sharpen.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className={`text-3xl font-bold mt-1 ${getScoreColor(avgScore)}`}>
                    {avgScore}
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Strength</p>
                  <p className="text-lg font-semibold mt-1">{topCategory?.name}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(topArea?.score ?? 0)}`}>
                    {topArea?.score}/10
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-score-high/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Attention</p>
                  <p className="text-lg font-semibold mt-1">{weakCategory?.name}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(weakArea?.score ?? 0)}`}>
                    {weakArea?.score}/10
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-score-low/40" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-lg font-semibold mt-1">
                    {user ? ROLE_LABELS[user.role] : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.chapter}</p>
                </div>
                <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-secondary/50 transition-colors" onClick={() => navigate('/snapshot')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Take Your Snapshot</h3>
                <p className="text-sm text-muted-foreground">
                  Rate your last 30 days across all life categories
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-secondary/50 transition-colors" onClick={() => navigate('/consultant')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <MessageSquare className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Talk to The Consultant</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered guidance for your growth areas
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">Announcements</CardTitle>
            </div>
            <CardDescription>Latest updates from Iron Forums</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium">{a.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
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
            <CardTitle className="text-lg">Recent Snapshots</CardTitle>
            <CardDescription>Your progress over time</CardDescription>
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
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.quarterlyGoal}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getScoreColor(avg)}`}>{avg}</p>
                      <p className="text-xs text-muted-foreground">avg score</p>
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
