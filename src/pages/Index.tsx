import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import { PulseAlerts } from '@/components/dashboard/PulseAlerts';
import { JourneyTimeline } from '@/components/dashboard/JourneyTimeline';
import { ActionItems } from '@/components/dashboard/ActionItems';
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { snapshots: dbSnapshots } = useSnapshots();
  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSnapshot = allSnapshots[0];
  const previousSnapshot = allSnapshots[1];

  const avgScore = latestSnapshot
    ? Math.round((latestSnapshot.ratings.reduce((sum, r) => sum + r.score, 0) / latestSnapshot.ratings.length) * 10) / 10
    : 0;

  const prevAvg = previousSnapshot
    ? Math.round((previousSnapshot.ratings.reduce((sum, r) => sum + r.score, 0) / previousSnapshot.ratings.length) * 10) / 10
    : null;

  const avgDelta = prevAvg !== null ? Math.round((avgScore - prevAvg) * 10) / 10 : null;

  const topArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((best, r) => (r.score > best.score ? r : best))
    : null;
  const weakArea = latestSnapshot
    ? latestSnapshot.ratings.reduce((worst, r) => (r.score < worst.score ? r : worst))
    : null;

  const topCategory = topArea ? SNAPSHOT_CATEGORIES.find(c => c.id === topArea.categoryId) : null;
  const weakCategory = weakArea ? SNAPSHOT_CATEGORIES.find(c => c.id === weakArea.categoryId) : null;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasThisMonthSnapshot = latestSnapshot && latestSnapshot.date.startsWith(currentMonth);
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  const firstName = (profile?.full_name || 'Brother')?.split(' ')[0];

  return (
    <DashboardLayout>
      <div className="space-y-8 sm:space-y-10 max-w-4xl">

        {/* ── 1. Welcome + Status ── */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-primary">
              Welcome back, {firstName}
            </h1>
            {profile && (
              <Badge variant="outline" className="text-xs font-body border-primary/20 text-primary">
                {ROLE_LABELS[(profile.role || 'member') as UserRole]}
              </Badge>
            )}
          </div>

          {hasThisMonthSnapshot ? (
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/snapshot')}
            >
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <p className="font-body text-base text-muted-foreground group-hover:text-foreground transition-colors">
                {monthName} Snapshot complete —{' '}
                <span className="text-primary font-semibold underline underline-offset-2">Review your results</span>
              </p>
            </div>
          ) : (
            <Button
              size="lg"
              className="h-14 px-8 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm"
              onClick={() => navigate('/snapshot')}
            >
              <ClipboardCheck className="h-5 w-5 mr-2.5" />
              Take Your {monthName} Snapshot
              <ArrowRight className="h-4 w-4 ml-2.5" />
            </Button>
          )}
        </div>

        {/* ── 2. Pulse — Mentor Pattern Alerts ── */}
        <PulseAlerts snapshots={allSnapshots} />

        {/* ── 3. Your Journey — Monthly Scorecard Grid ── */}
        <JourneyTimeline snapshots={allSnapshots} />

        {/* ── 4. Quick Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/snapshot')}>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Overall</p>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-3xl font-heading font-bold text-primary">{avgScore}</span>
                {avgDelta !== null && (
                  <span className={`inline-flex items-center text-xs font-body font-bold ${
                    avgDelta > 0 ? 'text-primary' : avgDelta < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {avgDelta > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : avgDelta < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                    {avgDelta > 0 ? '+' : ''}{avgDelta}
                  </span>
                )}
              </div>
              <p className="text-xs font-body text-muted-foreground">/10 avg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Strongest</p>
              <p className="text-sm font-heading font-bold mt-1.5 truncate">{topCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{topArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">Focus Area</p>
              <p className="text-sm font-heading font-bold mt-1.5 truncate">{weakCategory?.name ?? '—'}</p>
              <p className="text-xs font-body text-muted-foreground">{weakArea?.score ?? '—'}/10</p>
            </CardContent>
          </Card>
        </div>

        {/* ── 5. Action Items ── */}
        <ActionItems />

      </div>
    </DashboardLayout>
  );
}
