import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS, MOCK_ANNOUNCEMENTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
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
      <div className="space-y-10">
        {/* Welcome */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
            Welcome back, {(profile?.full_name || 'Brother')?.split(' ')[0]}
          </h1>
          <p className="text-lg font-body text-muted-foreground mt-3">
            Your Iron Forums dashboard — <span className="text-secondary font-semibold">Connect</span> · <span className="text-secondary font-semibold">Sharpen</span> · <span className="text-secondary font-semibold">Grow</span>
          </p>
        </div>

        {/* At-A-Glance Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-6">
              <p className="text-base font-body font-medium text-muted-foreground">Overall Score</p>
              <p className={`text-5xl font-heading font-bold mt-2 ${getScoreColor(avgScore)}`}>
                {avgScore}
              </p>
              <p className="text-sm font-body text-muted-foreground mt-1">out of 10</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-high">
            <CardContent className="p-6">
              <p className="text-base font-body font-medium text-muted-foreground">Your Top Strength</p>
              <p className="text-xl font-heading font-bold mt-2">{topCategory?.name}</p>
              <p className={`text-4xl font-heading font-bold mt-1 ${getScoreColor(topArea?.score ?? 0)}`}>
                {topArea?.score}<span className="text-lg text-muted-foreground">/10</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-score-low">
            <CardContent className="p-6">
              <p className="text-base font-body font-medium text-muted-foreground">Needs Attention</p>
              <p className="text-xl font-heading font-bold mt-2">{weakCategory?.name}</p>
              <p className={`text-4xl font-heading font-bold mt-1 ${getScoreColor(weakArea?.score ?? 0)}`}>
                {weakArea?.score}<span className="text-lg text-muted-foreground">/10</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <p className="text-base font-body font-medium text-muted-foreground">Your Role</p>
              <p className="text-xl font-heading font-bold mt-2">
                {profile ? ROLE_LABELS[(profile.role || 'member') as UserRole] : '—'}
              </p>
              <p className="text-base font-body text-muted-foreground mt-1">{profile?.chapter}</p>
            </CardContent>
          </Card>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card
            className="cursor-pointer hover:shadow-lg hover:border-secondary/40 transition-all group"
            onClick={() => navigate('/snapshot')}
          >
            <CardContent className="p-7 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl">Take Your Snapshot</h3>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Rate your last 30 days
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:border-secondary/40 transition-all group"
            onClick={() => navigate('/consultant')}
          >
            <CardContent className="p-7 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl">Talk to The Consultant</h3>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Get AI-powered guidance
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:border-secondary/40 transition-all group"
            onClick={() => navigate('/community')}
          >
            <CardContent className="p-7 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl">Community Hub</h3>
                <p className="text-base font-body text-muted-foreground mt-1">
                  Brothers, events & chapters
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-secondary" />
              <CardTitle className="text-2xl font-heading">Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {MOCK_ANNOUNCEMENTS.map((a) => (
              <div key={a.id} className="border-b last:border-0 pb-5 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-heading font-bold text-lg">{a.title}</h4>
                    <p className="text-base font-body text-muted-foreground mt-1">{a.content}</p>
                  </div>
                  <span className="text-sm font-body text-muted-foreground whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Snapshots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Recent Snapshots</CardTitle>
            <CardDescription className="text-base font-body">Your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_SNAPSHOTS.map((s) => {
                const avg =
                  Math.round(
                    (s.ratings.reduce((sum, r) => sum + r.score, 0) / s.ratings.length) * 10
                  ) / 10;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate('/snapshot')}
                  >
                    <div>
                      <p className="font-heading font-bold text-lg">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-base font-body text-muted-foreground mt-0.5">{s.quarterlyGoal}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-heading font-bold ${getScoreColor(avg)}`}>{avg}</p>
                      <p className="text-sm font-body text-muted-foreground">avg score</p>
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
